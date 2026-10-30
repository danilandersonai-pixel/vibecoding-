// Рекордер сессий приложения тренера: по-настоящему выполняет шаги сессий (команды, правки файлов, коммиты,
// браузер) и возвращает записи в формате video/sessions/types.ts. Шаги и правила записи — спецификация §4.2–4.3.
// Сам ничего не пишет в курс: записи и demo-app/app/ кладёт скрипт record-session.mjs.
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { connect } from 'node:net'
import { constants, tmpdir } from 'node:os'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = 3000
const BASE = `http://localhost:${PORT}`
const UNTIL_MS = 120_000 // сколько ждать строку `until`
const IDLE_MS = 500 // тишина в сети, после которой страница считается спокойной
const IDLE_LIMIT_MS = 15_000
const SERVER_TAIL_MS = 300 // сколько ждать вывод сервера после ответа
const STOP_MS = 5_000 // сколько ждать остановки процесса, потом SIGKILL
const CLICK_WAIT_MS = 200 // сколько минимум ждать после нажатия: запрос из обработчика уходит не мгновенно
const DB_PORT = 54322 // порт базы `supabase start`
const DB_HOST = '127.0.0.1'
const PG_BIN = '/usr/lib/postgresql/16/bin'
const DB_LAYER = fileURLToPath(new URL('./supabase-local.sql', import.meta.url)) // то, что у Supabase есть до первой миграции
// Окружение команд сессии с db: true: psql и приложение находят локальную базу без настроек
const DB_ENV = {
  PGHOST: DB_HOST,
  PGPORT: String(DB_PORT),
  PGUSER: 'postgres',
  PGDATABASE: 'postgres',
  DATABASE_URL: `postgresql://postgres@${DB_HOST}:${DB_PORT}/postgres`,
}
export const RUN_LIMIT_MS = 15 * 60_000 // потолок для обычной команды (без until)

const KINDS = ['run', 'write', 'edit', 'read', 'commit', 'agent', 'browser']
const DATE = /^\d{4}-\d\d-\d\dT\d\d:\d\d(:\d\d(\.\d+)?)?(Z|[+-]\d\d:\d\d)$/

const sleep = (ms) => new Promise((done) => setTimeout(done, ms))

// true, если promise закончился раньше, чем через ms; таймер за собой убирает.
async function within(promise, ms) {
  let timer
  try {
    return await Promise.race([promise.then(() => true), new Promise((done) => (timer = setTimeout(() => done(false), ms)))])
  } finally {
    clearTimeout(timer)
  }
}

// Метки ИИ-агента, из которого запущен рекордер (Claude Code, Cursor, Codex…). По ним инструменты понимают, что работают
// «под агентом», и ведут себя иначе: `next dev` дописывает в проект AGENTS.md. Команды сессии идут как в терминале человека.
const AGENT_ENV = /^(AI_AGENT|CLAUDECODE|CLAUDE_.*|CODEX_.*|CURSOR_.*|COPILOT_.*|GEMINI_CLI|OPENCODE_.*|AUGMENT_AGENT|ANTIGRAVITY_AGENT|REPL_ID)$/

// Режим сборки и метки запуска тестов, из которых запущен рекордер (npm test, vitest): NODE_ENV=production заставляет `npm ci` пропустить
// devDependencies, а `next dev` под NODE_ENV=test и метками тестов ведёт себя иначе, чем в терминале человека. NODE_OPTIONS — чужие ключи node.
const RUN_ENV = /^(NODE_ENV|NODE_OPTIONS|TEST|JEST_WORKER_ID|VITEST.*)$/

// Настройки подключения к базе из окружения запуска (PGHOST, PGPASSWORD, PGSSLMODE…, DATABASE_URL): в команды попадают только свои, у сессий с db: true.
const DB_VARS = /^(PG[A-Z_]+|DATABASE_URL)$/

// Окружение команд без чужих настроек: ~ — это home/, переменные GIT_* родителя (хуки git), метки агента, режим сборки, метки тестов
// и настройки подключения к базе не наследуются.
// Язык и пояс заданы, чтобы вывод (сообщения git и npm, даты, русский текст в UTF-8) не зависел от машины.
function baseEnv(home) {
  const vars = { ...process.env, HOME: home, XDG_CONFIG_HOME: join(home, '.config'), LC_ALL: 'C.UTF-8', TZ: 'UTC' } // настройки create-next-app и git пользователя не просачиваются
  for (const name of Object.keys(vars)) if (name.startsWith('GIT_') || AGENT_ENV.test(name) || RUN_ENV.test(name) || DB_VARS.test(name)) delete vars[name]
  delete vars.NO_COLOR // вместе с FORCE_COLOR заставляет node печатать предупреждение
  delete vars.LANGUAGE // gettext берёт его раньше LC_ALL
  return vars
}

// «15 минут», «2 с»: для сообщения о потолке.
export function limitText(ms) {
  if (ms % 60_000 !== 0) return `${ms / 1000} с`.replace('.', ',')
  const m = ms / 60_000
  const word = m % 10 === 1 && m % 100 !== 11 ? 'минуту' : [2, 3, 4].includes(m % 10) && ![12, 13, 14].includes(m % 100) ? 'минуты' : 'минут'
  return `${m} ${word}`
}

// Управляющие последовательности терминала: цвет и движение курсора (CSI), заголовок окна (OSC), прочие двухзнаковые.
// Собирается из кодов знаков, чтобы не держать управляющие знаки в регулярном выражении.
const ESC = String.fromCharCode(27)
const BEL = String.fromCharCode(7)
const ANSI = new RegExp(`${ESC}(?:\\[[0-?]*[ -/]*[@-~]|\\][^${BEL}${ESC}]*(?:${BEL}|${ESC}\\\\)|[@-Z\\\\^_])`, 'g')

// Вывод команды построчно: без ANSI, путь home/ заменён на ~, пустые строки в конце отброшены; правее ничего не режем.
function outputLines(text, home) {
  const rows = text.replace(ANSI, '').split(home).join('~').split(/\r?\n/)
  while (rows.length && rows.at(-1) === '') rows.pop()
  return rows
}

// Строки git-вывода (дифф): делим только по «\n», чтобы «\r» из файла остался на месте.
function gitLines(text) {
  const rows = text.split('\n')
  while (rows.length && rows.at(-1) === '') rows.pop()
  return rows
}

// Команды `run` живут каждая в своей группе процессов, а локальная база — в своём процессе Postgres. Если рекордер упал или его прервали,
// при выходе добиваем группы и останавливаем базы (сначала группы: у них могут быть соединения с базой).
const orphans = new Set()
const databases = new Set()
let exitHook = false
function installExitHook() {
  if (exitHook) return
  exitHook = true
  process.on('exit', () => {
    for (const id of orphans) {
      try {
        process.kill(-id, 'SIGKILL')
      } catch {
        // группы уже нет
      }
    }
    for (const db of databases) stopDatabase(db)
  })
}
function trackGroup(pid) {
  orphans.add(pid)
  installExitHook()
}

function check(ok, message) {
  if (!ok) throw new Error(message)
}

// Проверка шагов сессии до запуска: запись идёт минуты, поэтому опечатка в шаге должна всплыть сразу.
function checkSteps(def, steps, seen, inAgent) {
  const at = `Сессия «${def.id}»`
  check(Array.isArray(steps), `${at}: steps должен быть списком`)
  for (const step of steps) {
    check(typeof step?.id === 'string' && step.id !== '', `${at}: у шага нет id`)
    check(!seen.has(step.id), `${at}: повторяется шаг «${step.id}»`)
    seen.add(step.id)
    const here = `${at}, шаг «${step.id}»`
    const kinds = KINDS.filter((k) => step[k] !== undefined)
    check(kinds.length === 1, `${here}: нужен ровно один из ${KINDS.join(', ')}`)
    const str = (value, what) => check(typeof value === 'string', `${here}: ${what} — строка`)
    switch (kinds[0]) {
      case 'run':
        str(step.run, 'run')
        check(step.until === undefined || (typeof step.until === 'string' && step.until !== ''), `${here}: until — непустая строка`)
        check(step.cwd === undefined || step.cwd === '~', `${here}: cwd — только «~»`)
        break
      case 'write':
        str(step.write, 'write')
        str(step.content, 'content')
        break
      case 'edit':
        str(step.edit, 'edit')
        check(typeof step.find === 'string' && step.find !== '', `${here}: find — непустая строка`)
        str(step.replace, 'replace')
        break
      case 'read':
        str(step.read, 'read')
        break
      case 'commit':
        check(typeof step.commit === 'string' && step.commit !== '', `${here}: сообщение коммита — непустая строка`)
        break
      case 'agent':
        check(!inAgent, `${here}: агент внутри агента не бывает`)
        str(step.agent?.prompt, 'agent.prompt')
        str(step.agent?.reply, 'agent.reply')
        checkSteps(def, step.steps ?? [], seen, true)
        break
      case 'browser': {
        const { url, fill, click } = step.browser ?? {}
        check(typeof url === 'string' && url.startsWith('/'), `${here}: browser.url — путь, который начинается с «/»`)
        check(fill === undefined || (fill !== null && typeof fill === 'object' && !Array.isArray(fill) && Object.values(fill).every((v) => typeof v === 'string')), `${here}: browser.fill — объект «подпись поля → значение»`)
        check(click === undefined || typeof click === 'string' || (Array.isArray(click) && click.every((c) => typeof c === 'string')), `${here}: browser.click — текст кнопки или список`)
        break
      }
    }
  }
}

function checkChain(defs) {
  check(Array.isArray(defs) && defs.length > 0, 'Нечего записывать: список сессий пуст')
  const ids = new Set()
  defs.forEach((def, i) => {
    check(typeof def?.id === 'string' && def.id !== '', 'У сессии нет id')
    check(!ids.has(def.id), `Повторяется сессия «${def.id}»`)
    ids.add(def.id)
    const prev = defs[i - 1]?.id ?? null
    check(def.from === prev, prev === null ? `Сессия «${def.id}»: from = «${def.from}», а она первая в цепочке` : `Сессия «${def.id}»: from = «${def.from}», а перед ней в цепочке «${prev}»`)
    check(typeof def.date === 'string' && DATE.test(def.date) && !Number.isNaN(Date.parse(def.date)), `Сессия «${def.id}»: date — ISO-время с часовым поясом (2026-10-28T10:00:00Z)`)
    check(def.db === undefined || def.db === true, `Сессия «${def.id}»: db — только true`)
    checkSteps(def, def.steps, new Set(), false)
  })
}

// Запущенная команда: вывод копится в text (stdout и stderr уже слиты оболочкой), closed — когда всё закрылось.
function launch(cmd, { cwd, env, group }) {
  // `exec 2>&1;` в начале сливает stderr с stdout для всей команды, а не только для её последней части
  const child = spawn('bash', ['-c', `exec 2>&1; ${cmd}`], { cwd, env, detached: group, stdio: ['ignore', 'pipe', 'pipe'] })
  const proc = { child, text: '', exited: false, code: null }
  for (const stream of [child.stdout, child.stderr]) {
    stream.setEncoding('utf8')
    stream.on('data', (chunk) => {
      proc.text += chunk
    })
  }
  proc.closed = new Promise((done, fail) => {
    child.once('error', fail)
    child.once('close', (code, signal) => {
      proc.exited = true
      proc.code = code ?? (signal ? 128 + (constants.signals[signal] ?? 0) : 1)
      orphans.delete(child.pid)
      done(proc.code)
    })
  })
  proc.closed.catch(() => {}) // ошибка запуска всплывёт у того, кто ждёт closed
  if (group) trackGroup(child.pid)
  return proc
}

// Порт занят: к нему подключается клиент по IPv4 или IPv6 (next dev слушает оба). Ничего не останавливает.
function portBusy(port) {
  const busyOn = (host) =>
    new Promise((done) => {
      const socket = connect({ port, host })
      const finish = (busy) => {
        socket.destroy()
        done(busy)
      }
      socket.setTimeout(2000, () => finish(false))
      socket.once('connect', () => finish(true))
      socket.once('error', () => finish(false)) // отказ или нет IPv6 — на этом адресе порт свободен
    })
  return Promise.all([busyOn('127.0.0.1'), busyOn('::1')]).then((answers) => answers.includes(true))
}

// Остановить команду вместе со всей группой процессов.
async function stop(proc) {
  if (proc.exited) return
  const kill = (signal) => {
    try {
      process.kill(-proc.child.pid, signal)
    } catch {
      // группы уже нет
    }
  }
  kill('SIGTERM')
  if (!(await within(proc.closed, STOP_MS))) {
    kill('SIGKILL')
    await within(proc.closed, STOP_MS)
  }
}

// git без оболочки: вывод — stdout; код не из `ok` — ошибка. Для `git diff --no-index` «1» — норма.
function git(args, { cwd, env, input, ok = [0] }) {
  return new Promise((done, fail) => {
    const child = spawn('git', args, { cwd, env, stdio: [input === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'] })
    let out = ''
    let err = ''
    child.stdout.setEncoding('utf8').on('data', (c) => (out += c))
    child.stderr.setEncoding('utf8').on('data', (c) => (err += c))
    child.once('error', fail)
    child.once('close', (code) => (ok.includes(code) ? done(out) : fail(new Error(`git ${args.join(' ')}: код ${code}\n${err.trim()}`))))
    if (input !== undefined) {
      child.stdin.on('error', () => {}) // git мог закрыться раньше: причина придёт кодом выхода
      child.stdin.end(input)
    }
  })
}

// Программа без оболочки: код выхода и общий вывод (stdout и stderr). Код не проверяется; не запустилась (нет программы) — ошибка.
function exec(file, args, { cwd, env }) {
  return new Promise((done, fail) => {
    const child = spawn(file, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    for (const stream of [child.stdout, child.stderr]) stream.setEncoding('utf8').on('data', (c) => (out += c))
    child.once('error', (err) => fail(new Error(`${file}: ${err.message}`)))
    child.once('close', (code) => done({ code, out }))
  })
}

// Хеш содержимого, как у `git hash-object` (без фильтров: файл хранится как есть).
async function blobOf(text, opts) {
  return (await git(['hash-object', '--no-filters', '--stdin'], { ...opts, input: text })).trim()
}

// Хеши содержимого файлов (как у `git hash-object --no-filters`), по порядку paths.
async function hashPaths(paths, opts) {
  check(paths.every((p) => !p.includes('\n')), 'В имени файла проекта есть перевод строки')
  if (paths.length === 0) return []
  return (await git(['hash-object', '--no-filters', '--stdin-paths'], { ...opts, input: paths.join('\n') + '\n' })).trim().split('\n')
}

// Файл (или ссылка) по пути внутри проекта есть на диске.
function fileAt(project, path) {
  try {
    const stat = lstatSync(join(project, path))
    return stat.isFile() || stat.isSymbolicLink()
  } catch {
    return false
  }
}

// Файлы проекта и хеши их содержимого: путь → blob. Отслеживаемые и неотслеживаемые, но не игнорируемые (.gitignore);
// удалённые из рабочей папки, но ещё не из индекса, пропускаются. null — проект ещё не под git (до `git init`).
async function projectBlobs(project, opts) {
  if (!existsSync(join(project, '.git'))) return null
  const listed = (await git(['ls-files', '-z', '--cached', '--others', '--exclude-standard'], opts)).split('\0').filter(Boolean)
  const paths = [...new Set(listed)].filter((path) => fileAt(project, path))
  const blobs = await hashPaths(paths, opts)
  return new Map(paths.map((path, i) => [path, blobs[i]]))
}

// Что сделала команда с файлами проекта: создала и изменила (blob — новое содержимое), удалила (blob: null); по пути.
// Файл, который остался на диске, но стал игнорируемым, удалённым не считается. Нет проекта под git до или после — null.
function changedFiles(before, after, project) {
  if (!before || !after) return null
  const files = []
  for (const [path, blob] of after) if (before.get(path) !== blob) files.push({ path, blob })
  for (const path of before.keys()) if (!after.has(path) && !fileAt(project, path)) files.push({ path, blob: null })
  return files.sort((a, b) => (a.path < b.path ? -1 : 1))
}

// Настоящий `git diff` одной правки. Новый файл — `--no-index` от /dev/null (код 1 — норма).
// Изменённый — `git diff` в черновом репозитории, где «до» уже в индексе: так дифф показывает только эту правку,
// даже если файл правили несколько раз без коммита или он ещё не добавлен в индекс проекта.
async function diffOf(path, before, after, opts) {
  if (before === null) return gitLines(await git(['diff', '--no-index', '--no-color', '--', '/dev/null', path], { ...opts, ok: [0, 1] }))
  const scratch = mkdtempSync(join(tmpdir(), 'rec-diff-'))
  try {
    const here = { ...opts, cwd: scratch }
    const file = join(scratch, path)
    await git(['init', '-q'], here)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, before)
    await git(['add', '--', path], here)
    writeFileSync(file, after)
    return gitLines(await git(['diff', '--no-color', '--', path], here))
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
}

// Ожидание затишья: ни одного запроса в полёте и тишина IDLE_MS, отсчитанная от вызова (не от последнего события до него),
// и не меньше minMs. Канал событий (EventSource) не считаем.
// Встроенный networkidle здесь не годится: после загрузки он уже наступил и на нажатие больше не ждёт.
function watchNetwork(page) {
  const inflight = new Set()
  let last = Date.now()
  const counted = (request) => request.resourceType() !== 'eventsource'
  page.on('request', (request) => {
    if (counted(request)) inflight.add(request)
    last = Date.now()
  })
  const end = (request) => {
    inflight.delete(request)
    last = Date.now()
  }
  page.on('requestfinished', end)
  page.on('requestfailed', end)
  return async (minMs = 0) => {
    const started = Date.now()
    last = started
    while (inflight.size > 0 || Date.now() - last < IDLE_MS || Date.now() - started < minMs) {
      if (Date.now() - started > IDLE_LIMIT_MS) return
      await sleep(50)
    }
  }
}

// Видимый текст страницы построчно: без пустых строк и без пробелов по краям (пробел между соседними элементами — не текст).
async function pageText(page) {
  const text = await page.evaluate(() => document.body.innerText)
  return text.split('\n').map((line) => line.trim()).filter(Boolean)
}

// Тексты всех видимых кнопок страницы по порядку: без пробелов по краям и без пустых.
async function pageButtons(page) {
  return (await page.getByRole('button').allInnerTexts()).map((text) => text.trim()).filter(Boolean)
}

// Состояние сессии — архив папки проекта на конец сессии. В него не входит то, что восстанавливается или пересоздаётся само:
// node_modules (его ставит `npm ci` по package-lock.json), кэш сборки .next и отчёты тестов. Всё остальное, включая .git и игнорируемые
// файлы вроде .env.local, сохраняется. Вне проекта (home/) ничего не сохраняется: сессии, которые продолжают с состояния, не должны от него зависеть.
const STATE_SKIP = ['node_modules', '.next', 'test-results', 'playwright-report']

// tar без оболочки: код не 0 — ошибка с выводом tar.
function tar(args) {
  return new Promise((done, fail) => {
    const child = spawn('tar', args, { stdio: ['ignore', 'ignore', 'pipe'] })
    let err = ''
    child.stderr.setEncoding('utf8').on('data', (c) => (err += c))
    child.once('error', fail)
    child.once('close', (code) => (code === 0 ? done() : fail(new Error(`tar ${args.join(' ')}: код ${code}\n${err.trim()}`))))
  })
}

// Сохраняет состояние проекта в архив (`tar -czf`); папка архива создаётся.
export async function packState(archive, project) {
  const names = readdirSync(project).filter((name) => !STATE_SKIP.includes(name)).sort()
  check(names.length > 0, `В папке проекта нечего сохранять в состояние: ${project}`)
  mkdirSync(dirname(resolve(archive)), { recursive: true })
  await tar(['-czf', resolve(archive), '-C', project, '--', ...names])
}

// Разворачивает архив состояния в папку проекта. Владельцем файлов становится тот, кто запустил рекордер, а не тот, кто делал архив.
export async function unpackState(archive, project) {
  check(existsSync(archive), `Нет архива состояния: ${archive}`)
  await tar(['-xzf', resolve(archive), '-C', project, '--no-same-owner'])
}

// Записывает цепочку сессий: defs по порядку, workdir — пустая папка. Внутри: home/ (это ~) и проект home/trainer-app.
// npmCache — папка кэша npm (ускоряет перезапись, на вывод влияет только временем).
// runLimitMs — потолок для обычной команды (по умолчанию 15 минут; параметр нужен только тестам).
// state — состояния сессий: save(id, project) вызывается после каждой записанной сессии (серверы к этому времени остановлены);
// restore { id, load(project) } — запись с середины: проект разворачивается из состояния сессии id (load кладёт его в пустую папку проекта),
// при package-lock.json ставятся пакеты `npm ci` (в запись это не попадает), и записываются сессии цепочки, которые идут после id.
// defs при этом — вся цепочка: from следующей за id сессии проверяется как обычно. Возвращает записи только проигранных сессий.
// Сессия с db: true получает свою локальную базу (Postgres 16 со слоем Supabase, порт 54322), см. startDatabase; для неё рекордер запускают от root.
export async function recordChain(defs, { workdir, npmCache, runLimitMs = RUN_LIMIT_MS, state } = {}) {
  checkChain(defs)
  const restore = state?.restore
  let first = 0
  if (restore) {
    const at = defs.findIndex((def) => def.id === restore.id)
    check(at >= 0, `Нет сессии «${restore.id}» в цепочке: ${defs.map((def) => def.id).join(', ')}`)
    check(at < defs.length - 1, `После сессии «${restore.id}» записывать нечего: она последняя в цепочке`)
    first = at + 1
  }
  const needsDb = defs.slice(first).find((def) => def.db)
  check(!needsDb || process.getuid?.() === 0, `Сессия с db: true: Postgres запускается от пользователя postgres, рекордер нужно запускать от root (сессия «${needsDb?.id}»)`)
  check(typeof workdir === 'string' && workdir !== '', 'Не указана папка записи (workdir)')
  mkdirSync(workdir, { recursive: true })
  const root = realpathSync(workdir)
  check(readdirSync(root).length === 0, `Папка записи не пуста: ${workdir}`)
  const home = join(root, 'home')
  const project = join(home, 'trainer-app')
  mkdirSync(project, { recursive: true })

  if (restore) {
    await restore.load(project)
    await installPackages({ home, project, npmCache, runLimitMs }, restore.id)
  }

  const records = []
  for (const def of defs.slice(first)) {
    records.push(await playSession({ home, project, npmCache, runLimitMs }, def))
    await state?.save(def.id, project)
  }
  return { records, project }
}

// После разворачивания состояния: если в проекте есть package-lock.json, ставит по нему пакеты (`npm ci`, как в первой сессии `npm install`).
// Команда не записывается: восстановление — не часть сессии.
async function installPackages({ home, project, npmCache, runLimitMs }, restoredId) {
  if (!existsSync(join(project, 'package-lock.json'))) return
  const proc = launch('npm ci --prefer-offline --no-audit --no-fund', { cwd: project, env: commandEnv(home, npmCache), group: true })
  if (!(await within(proc.closed, runLimitMs))) {
    await stop(proc)
    throw new Error(`Состояние сессии «${restoredId}»: npm ci не завершился за ${limitText(runLimitMs)}\n${outputLines(proc.text, home).slice(-20).join('\n')}`)
  }
  check(proc.code === 0, `Состояние сессии «${restoredId}»: npm ci не удался (код ${proc.code})\n${outputLines(proc.text, home).slice(-20).join('\n')}`)
}

// Окружение команд сессии без времени коммита: ~ — это home/, постоянный автор, порт и цвет, общий кэш npm.
function commandEnv(home, npmCache) {
  const vars = {
    ...baseEnv(home),
    GIT_AUTHOR_NAME: 'Анна',
    GIT_AUTHOR_EMAIL: 'anna@example.com',
    GIT_COMMITTER_NAME: 'Анна',
    GIT_COMMITTER_EMAIL: 'anna@example.com',
    NEXT_TELEMETRY_DISABLED: '1',
    npm_config_update_notifier: 'false',
    npm_config_fund: 'false',
    PORT: String(PORT),
    FORCE_COLOR: '0',
  }
  if (npmCache) {
    vars.npm_config_cache = npmCache
    vars.npm_config_logs_dir = join(home, '.npm', '_logs') // журнал npm там же, где без общего кэша: путь в выводе — ~/.npm/_logs
  }
  return vars
}

// Локальная база сессии с db: true. Docker нет, поэтому вместо `supabase start` — обычный Postgres 16 на порту 54322 со слоем Supabase
// (supabase-local.sql). Postgres не запускается от root, поэтому база живёт у пользователя postgres: папка в tmpdir() отдаётся ему, команды идут через runuser.
// Дальше база собирается как `supabase db reset`: слой, миграции проекта supabase/migrations/*.sql по имени, supabase/seed.sql.
// Вывод SQL в запись не попадает; ошибка SQL роняет запись с текстом ошибки и именем файла. Сессия начинает с чистой базы: данные прошлой сессии не переносятся.
// Любая ошибка при запуске базу за собой убирает. Возвращает { dir, data, env } для stopDatabase.
async function startDatabase({ home, project, id }) {
  sweepDatabases()
  const dir = mkdtempSync(join(tmpdir(), 'rec-pg-'))
  const db = { dir, data: join(dir, 'data'), env: baseEnv(dir) } // HOME у Postgres — его папка: home/ записи для postgres закрыт
  databases.add(db)
  installExitHook()
  const tail = (text) => outputLines(text, home).slice(-20).join('\n')
  const asPostgres = (tool, args) => ['-u', 'postgres', '--', `${PG_BIN}/${tool}`, ...args]
  try {
    const chown = await exec('chown', ['postgres:', dir], { cwd: dir, env: db.env })
    check(chown.code === 0, `chown postgres не удался (код ${chown.code})\n${tail(chown.out)}`)
    const init = await exec('runuser', asPostgres('initdb', ['-D', db.data, '-U', 'postgres', '--auth=trust', '-E', 'UTF8', '--locale=C.UTF-8']), { cwd: dir, env: db.env })
    check(init.code === 0, `initdb не удался (код ${init.code})\n${tail(init.out)}`)
    const log = join(dir, 'log')
    const options = `-p ${DB_PORT} -c listen_addresses=${DB_HOST} -k ${dir}`
    const start = await exec('runuser', asPostgres('pg_ctl', ['-D', db.data, '-o', options, '-l', log, '-w', 'start']), { cwd: dir, env: db.env })
    check(start.code === 0, `pg_ctl start не удался (код ${start.code})\n${tail(start.out)}\n${tail(existsSync(log) ? readFileSync(log, 'utf8') : '')}`)

    const files = [{ name: 'supabase-local.sql', path: DB_LAYER }]
    const migrations = join(project, 'supabase', 'migrations')
    const names = existsSync(migrations) ? readdirSync(migrations).filter((name) => name.endsWith('.sql')).sort() : []
    for (const name of names) files.push({ name: `supabase/migrations/${name}`, path: `supabase/migrations/${name}` })
    if (existsSync(join(project, 'supabase', 'seed.sql'))) files.push({ name: 'supabase/seed.sql', path: 'supabase/seed.sql' })
    for (const { name, path } of files) {
      const sql = await exec('psql', ['-X', '-q', '-v', 'ON_ERROR_STOP=1', '-f', path], { cwd: project, env: { ...db.env, ...DB_ENV } })
      check(sql.code === 0, `ошибка SQL в ${name} (код ${sql.code})\n${tail(sql.out)}`)
    }
  } catch (err) {
    stopDatabase(db)
    throw new Error(`Сессия «${id}», локальная база: ${err.message}`, { cause: err })
  }
  return db
}

// Остатки прошлых записей. Рекордер, убитый без возможности выйти штатно (SIGKILL, OOM), оставляет работать свой Postgres: `pg_ctl start`
// отделяет сервер от группы процессов рекордера. Порт 54322 остался бы занят, а папка rec-pg-… — лежать. Поэтому перед запуском новой базы
// все такие папки в tmpdir() с запущенным сервером (есть data/postmaster.pid) останавливаются и удаляются. Порт 54322 всё равно один на машину,
// так что чужую работающую запись это не ломает: две записи с db одновременно не бывают. Базы этого процесса не трогаются.
function sweepDatabases() {
  const root = tmpdir()
  for (const name of readdirSync(root)) {
    const dir = join(root, name)
    if (!name.startsWith('rec-pg-') || [...databases].some((db) => db.dir === dir) || !existsSync(join(dir, 'data', 'postmaster.pid'))) continue
    stopDatabase({ dir, data: join(dir, 'data'), env: baseEnv(dir) })
  }
}

// Останавливает базу (`pg_ctl stop -m fast`) и удаляет её папку. Синхронная: её зовёт и обработчик выхода, где ждать нечем.
// Не бросает. Быстрая остановка не вышла — immediate, затем SIGKILL процессу postmaster: порт 54322 не должен остаться занятым.
function stopDatabase(db) {
  databases.delete(db)
  const pidFile = join(db.data, 'postmaster.pid')
  if (existsSync(pidFile)) {
    const stopWith = (mode) => spawnSync('runuser', ['-u', 'postgres', '--', `${PG_BIN}/pg_ctl`, '-D', db.data, '-m', mode, '-t', '30', 'stop'], { cwd: db.dir, env: db.env, stdio: 'ignore' }).status === 0
    if (!stopWith('fast') && !stopWith('immediate')) {
      try {
        const pid = Number(readFileSync(pidFile, 'utf8').split('\n')[0])
        // 0 и меньше убили бы целую группу процессов; в файле от давней записи pid мог достаться чужому процессу — убиваем только postgres
        if (Number.isInteger(pid) && pid > 1 && readFileSync(`/proc/${pid}/cmdline`, 'utf8').includes('postgres')) process.kill(pid, 'SIGKILL')
      } catch {
        // процесса уже нет
      }
    }
  }
  rmSync(db.dir, { recursive: true, force: true })
}

// Одна сессия: шаги по порядку, затем остановка серверов и базы (и при ошибке тоже).
async function playSession({ home, project, npmCache, runLimitMs }, def) {
  const start = Math.floor(Date.parse(def.date) / 1000)
  const events = []
  const procs = [] // процессы с until
  let commits = 0
  let browser = null // Chromium сессии: один на все её шаги browser, создаётся на первом из них
  let context = null
  let db = null // локальная база сессии с db: true

  // Окружение команд: постоянные автор и время (k-го коммита сессии — старт + k минут); у сессии с db — подключение к её базе.
  const env = () => {
    const stamp = `${start + (commits + 1) * 60} +0000`
    return { ...commandEnv(home, npmCache), ...(db ? DB_ENV : {}), GIT_AUTHOR_DATE: stamp, GIT_COMMITTER_DATE: stamp }
  }
  const gitHere = (args, extra = {}) => git(args, { cwd: project, env: env(), ...extra })
  const lines = (text) => outputLines(text, home)

  // Путь внутри проекта, записанный как есть (без ./ и с «/»).
  function inProject(path) {
    const abs = resolve(project, path)
    const rel = relative(project, abs)
    check(rel !== '' && !rel.startsWith('..') && !isAbsolute(rel), `путь «${path}» вне проекта`)
    return { abs, rel: rel.split(sep).join('/') }
  }

  const push = (event, by) => events.push(by ? { ...event, by } : event)

  async function play(step, by) {
    try {
      await playStep(step, by)
    } catch (err) {
      throw new Error(`Сессия «${def.id}», шаг «${step.id}»: ${err.message}`, { cause: err })
    }
  }

  async function playStep(step, by) {
    const { id } = step
    if (step.run !== undefined) {
      const long = step.until !== undefined
      // Команда с until — dev-сервер, а шаги browser идут на BASE. Рекордер, убитый kill -9, оставляет свой сервер работать (он в своей
      // группе процессов): next dev тогда берёт следующий порт и всё равно пишет Ready, а браузер попадает на старый сервер со старым кодом.
      // Postgres такие остатки подметает сам (sweepDatabases), сервер — нет: чужой процесс на порту может быть чем угодно, его не трогаем.
      if (long) check(!(await portBusy(PORT)), `порт ${PORT} занят (остаток прошлой записи?) — остановите процесс и запустите снова`)
      const was = await projectBlobs(project, { cwd: project, env: env() }) // файлы проекта до команды
      const proc = launch(step.run, { cwd: step.cwd === '~' ? home : project, env: env(), group: true })
      const cwd = step.cwd === '~' ? '~' : '~/trainer-app'
      // files — что команда сделала с файлами проекта; нет проекта под git или нет изменений — поля нет
      const changed = async () => {
        const files = changedFiles(was, await projectBlobs(project, { cwd: project, env: env() }), project)
        return files?.length ? { files } : {}
      }
      if (!long) {
        if (!(await within(proc.closed, runLimitMs))) {
          await stop(proc) // вместе со всей группой, иначе потомки останутся работать
          throw new Error(`команда не завершилась за ${limitText(runLimitMs)}\n${lines(proc.text).slice(-20).join('\n')}`)
        }
        push({ id, kind: 'run', cwd, cmd: step.run, out: lines(proc.text), code: proc.code, ...(await changed()) }, by)
        return
      }
      procs.push(proc)
      const out = await waitFor(proc, step.until)
      push({ id, kind: 'run', cwd, cmd: step.run, out, code: null, ...(await changed()) }, by)
    } else if (step.write !== undefined || step.edit !== undefined) {
      const { abs, rel } = inProject(step.write ?? step.edit)
      const before = existsSync(abs) ? readFileSync(abs, 'utf8') : null
      let after = step.content
      if (step.edit !== undefined) {
        check(before !== null, `файла «${rel}» нет`)
        const first = before.indexOf(step.find)
        check(first >= 0, `find не найден в «${rel}»`)
        check(before.indexOf(step.find, first + 1) < 0, `find найден в «${rel}» несколько раз — уточните его`)
        after = before.slice(0, first) + step.replace + before.slice(first + step.find.length)
      }
      mkdirSync(dirname(abs), { recursive: true })
      writeFileSync(abs, after)
      const diff = await diffOf(rel, before, after, { cwd: project, env: env() })
      push({ id, kind: 'file', path: rel, before, after, diff, blob: await blobOf(after, { cwd: project, env: env() }) }, by)
    } else if (step.read !== undefined) {
      const { abs, rel } = inProject(step.read)
      check(existsSync(abs), `файла «${rel}» нет`)
      const text = readFileSync(abs, 'utf8')
      push({ id, kind: 'read', path: rel, text, blob: await blobOf(text, { cwd: project, env: env() }) }, by)
    } else if (step.commit !== undefined) {
      const message = step.commit
      const cmd = `git add -A && git commit -m "${message.replace(/[\\"$`]/g, '\\$&')}"`
      const proc = launch(cmd, { cwd: project, env: env(), group: false })
      const code = await proc.closed
      const out = lines(proc.text)
      check(code === 0, `коммит не удался (код ${code})\n${out.join('\n')}`)
      const hash = (await gitHere(['rev-parse', 'HEAD'])).trim().slice(0, 7)
      const branch = (await gitHere(['branch', '--show-current'])).trim()
      const parents = (await gitHere(['log', '-1', '--format=%P', 'HEAD'])).trim().split(' ').filter(Boolean).map((p) => p.slice(0, 7))
      const files = (await gitHere(['ls-tree', '-r', '-z', 'HEAD']))
        .split('\0')
        .filter(Boolean)
        .map((row) => ({ path: row.slice(row.indexOf('\t') + 1), blob: row.split(' ')[2].split('\t')[0] }))
      commits++
      push({ id, kind: 'commit', cmd, hash, message, branch, parents, out, files }, by)
    } else if (step.agent !== undefined) {
      // событие агента стоит перед своими шагами, у шагов by: "agent"
      const inner = step.steps ?? []
      push({ id, kind: 'agent', prompt: step.agent.prompt, reply: step.agent.reply, steps: inner.map((s) => s.id) })
      for (const next of inner) await play(next, 'agent')
    } else {
      push(await recordBrowser(step), by)
    }
  }

  // Ждёт в выводе процесса строку needle; возвращает вывод до этой строки включительно.
  async function waitFor(proc, needle) {
    const deadline = Date.now() + UNTIL_MS
    while (!lines(proc.text).some((row) => row.includes(needle))) {
      const tail = () => lines(proc.text).slice(-20).join('\n')
      check(!proc.exited, `процесс завершился (код ${proc.code}) до строки «${needle}»\n${tail()}`)
      check(Date.now() < deadline, `за ${UNTIL_MS / 1000} с не появилась строка «${needle}»\n${tail()}`)
      await sleep(50)
    }
    await sleep(150) // дописать строку, если она пришла кусками
    const rows = lines(proc.text)
    return rows.slice(0, rows.findIndex((row) => row.includes(needle)) + 1)
  }

  // Контекст браузера сессии: cookie и localStorage живут между её шагами, следующая сессия начинает с чистого.
  // Язык и пояс заданы, как у команд, чтобы страницы (даты, Intl) не зависели от машины.
  async function sessionContext() {
    if (!context) {
      const { chromium } = await import('@playwright/test')
      browser = await chromium.launch()
      context = await browser.newContext({ locale: 'ru-RU', timezoneId: 'Europe/Moscow' })
    }
    return context
  }

  async function recordBrowser(step) {
    const server = procs.findLast((p) => !p.exited)
    check(server, 'browser нужен работающий шаг с until (dev-сервер)')
    const { url, fill = {}, click = [] } = step.browser
    const clicks = Array.isArray(click) ? click : [click]
    const mark = server.text.length // вывод сервера считаем с начала шага
    const page = await (await sessionContext()).newPage()
    try {
      const consoleLog = []
      const network = []
      page.on('console', (m) => consoleLog.push({ type: m.type(), text: m.text() }))
      page.on('response', (r) => {
        if (r.status() >= 400) network.push({ method: r.request().method(), url: r.url(), status: r.status() })
      })
      const idle = watchNetwork(page)

      const requested = new URL(BASE + url).href // так адрес пишет браузер: русские буквы и пробелы кодируются
      await page.goto(BASE + url)
      await idle()
      // перенаправление (вход, редирект сервера): кадр не должен показывать адрес, которого у страницы не было, поэтому в шаге указывают конечный
      check(page.url() === requested, `страница открылась по адресу ${page.url()}, а запрошен ${BASE + url} — укажите в шаге конечный адрес`)
      const title = await page.title()
      const fields = []
      for (const [label, value] of Object.entries(fill)) {
        const field = page.getByLabel(label)
        await field.fill(value)
        fields.push({ label, value: await field.inputValue() })
      }
      // страница прямо перед нажатием: текст и все видимые кнопки (кадр рисует страницу целиком)
      const before = await pageText(page)
      const buttons = await pageButtons(page)
      for (const name of clicks) {
        await page.getByRole('button', { name }).click()
        await idle(CLICK_WAIT_MS)
      }
      await page.waitForLoadState('load')
      const after = await pageText(page)
      const urlAfter = page.url() // адрес в конце шага: нажатие могло увести на другую страницу
      await sleep(SERVER_TAIL_MS)
      return {
        id: step.id,
        kind: 'browser',
        url: BASE + url,
        ...(urlAfter === requested ? {} : { urlAfter }),
        title,
        fields,
        buttons,
        before,
        after,
        console: consoleLog,
        network,
        server: lines(server.text.slice(mark)),
      }
    } finally {
      await page.close() // открытая страница держала бы соединения (HMR) и писала в вывод сервера следующих шагов
    }
  }

  try {
    if (def.db) db = await startDatabase({ home, project, id: def.id })
    for (const step of def.steps) await play(step, undefined)
  } finally {
    try {
      await browser?.close()
    } finally {
      try {
        for (const proc of procs) await stop(proc)
      } finally {
        if (db) stopDatabase(db)
      }
    }
  }
  return { id: def.id, from: def.from, recorded: new Date(def.date).toISOString().slice(0, 10), events }
}

// Файлы коммита HEAD (на ветке, где проект стоит сейчас) с хешами blob: [{ path, blob }]. Сессия может кончиться переключением
// ветки (`git switch main`) — тогда это не файлы последнего коммита записи, а дерево главной ветки.
export async function committedFiles(project) {
  const env = baseEnv(join(project, '..'))
  const rows = (await git(['ls-tree', '-r', '-z', 'HEAD'], { cwd: project, env })).split('\0').filter(Boolean)
  return rows.map((row) => ({ path: row.slice(row.indexOf('\t') + 1), blob: row.split(' ')[2].split('\t')[0] }))
}

// Файлы проекта из `git ls-files` с хешами blob рабочего дерева: [{ path, blob }].
export async function trackedFiles(project) {
  const env = baseEnv(join(project, '..'))
  const paths = (await git(['ls-files', '-z'], { cwd: project, env })).split('\0').filter(Boolean)
  const blobs = await hashPaths(paths, { cwd: project, env })
  return paths.map((path, i) => ({ path, blob: blobs[i] }))
}
