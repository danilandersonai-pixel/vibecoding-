// Рекордер сессий приложения тренера: по-настоящему выполняет шаги сессий (команды, правки файлов, коммиты,
// браузер) и возвращает записи в формате video/sessions/types.ts. Шаги и правила записи — спецификация §4.2–4.3.
// Сам ничего не пишет в курс: записи и demo-app/app/ кладёт скрипт record-session.mjs.
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { constants, tmpdir } from 'node:os'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'

const PORT = 3000
const BASE = `http://localhost:${PORT}`
const UNTIL_MS = 120_000 // сколько ждать строку `until`
const IDLE_MS = 500 // тишина в сети, после которой страница считается спокойной
const IDLE_LIMIT_MS = 15_000
const SERVER_TAIL_MS = 300 // сколько ждать вывод сервера после ответа
const STOP_MS = 5_000 // сколько ждать остановки процесса, потом SIGKILL

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

// Окружение команд без чужих настроек: ~ — это home/, переменные GIT_* родителя (хуки git) не наследуются.
function baseEnv(home) {
  const vars = { ...process.env, HOME: home, XDG_CONFIG_HOME: join(home, '.config') } // настройки create-next-app и git пользователя не просачиваются
  for (const name of Object.keys(vars)) if (name.startsWith('GIT_')) delete vars[name]
  delete vars.NO_COLOR // вместе с FORCE_COLOR заставляет node печатать предупреждение
  return vars
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

// Процессы с `until` живут в своей группе. Если рекордер упал или его прервали, добиваем группы при выходе.
const orphans = new Set()
let exitHook = false
function trackGroup(pid) {
  orphans.add(pid)
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
  })
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
        check(fill === undefined || (typeof fill === 'object' && Object.values(fill).every((v) => typeof v === 'string')), `${here}: browser.fill — подпись → значение`)
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

// Остановить процесс с `until` вместе со всей группой.
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

// Хеш содержимого, как у `git hash-object` (без фильтров: файл хранится как есть).
async function blobOf(text, opts) {
  return (await git(['hash-object', '--no-filters', '--stdin'], { ...opts, input: text })).trim()
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

// Пока страница не затихнет: ни одного запроса в полёте и тишина IDLE_MS. Канал событий (EventSource) не считаем.
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
  return async () => {
    const started = Date.now()
    while (inflight.size > 0 || Date.now() - last < IDLE_MS) {
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

// Записывает цепочку сессий: defs по порядку, workdir — пустая папка. Внутри: home/ (это ~) и проект home/trainer-app.
// npmCache — папка кэша npm (ускоряет перезапись, на вывод влияет только временем).
export async function recordChain(defs, { workdir, npmCache } = {}) {
  checkChain(defs)
  check(typeof workdir === 'string' && workdir !== '', 'Не указана папка записи (workdir)')
  mkdirSync(workdir, { recursive: true })
  const root = realpathSync(workdir)
  check(readdirSync(root).length === 0, `Папка записи не пуста: ${workdir}`)
  const home = join(root, 'home')
  const project = join(home, 'trainer-app')
  mkdirSync(project, { recursive: true })

  const records = []
  for (const def of defs) records.push(await playSession({ home, project, npmCache }, def))
  return { records, project }
}

// Одна сессия: шаги по порядку, затем остановка серверов (и при ошибке тоже).
async function playSession({ home, project, npmCache }, def) {
  const start = Math.floor(Date.parse(def.date) / 1000)
  const events = []
  const procs = [] // процессы с until
  let commits = 0

  // Окружение команд: ~ — это home/, постоянные автор и время (k-го коммита сессии — старт + k минут).
  const env = () => {
    const stamp = `${start + (commits + 1) * 60} +0000`
    const vars = {
      ...baseEnv(home),
      GIT_AUTHOR_NAME: 'Анна',
      GIT_AUTHOR_EMAIL: 'anna@example.com',
      GIT_COMMITTER_NAME: 'Анна',
      GIT_COMMITTER_EMAIL: 'anna@example.com',
      GIT_AUTHOR_DATE: stamp,
      GIT_COMMITTER_DATE: stamp,
      NEXT_TELEMETRY_DISABLED: '1',
      npm_config_update_notifier: 'false',
      npm_config_fund: 'false',
      PORT: String(PORT),
      FORCE_COLOR: '0',
    }
    if (npmCache) vars.npm_config_cache = npmCache
    return vars
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
      const proc = launch(step.run, { cwd: step.cwd === '~' ? home : project, env: env(), group: long })
      const cwd = step.cwd === '~' ? '~' : '~/trainer-app'
      if (!long) {
        const code = await proc.closed
        push({ id, kind: 'run', cwd, cmd: step.run, out: lines(proc.text), code }, by)
        return
      }
      procs.push(proc)
      const out = await waitFor(proc, step.until)
      push({ id, kind: 'run', cwd, cmd: step.run, out, code: null }, by)
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

  async function recordBrowser(step) {
    const server = procs.findLast((p) => !p.exited)
    check(server, 'browser нужен работающий шаг с until (dev-сервер)')
    const { url, fill = {}, click = [] } = step.browser
    const buttons = Array.isArray(click) ? click : [click]
    const mark = server.text.length // вывод сервера считаем с начала шага
    const { chromium } = await import('@playwright/test')
    const browser = await chromium.launch()
    try {
      const page = await browser.newPage()
      const consoleLog = []
      const network = []
      page.on('console', (m) => consoleLog.push({ type: m.type(), text: m.text() }))
      page.on('response', (r) => {
        if (r.status() >= 400) network.push({ method: r.request().method(), url: r.url(), status: r.status() })
      })
      const idle = watchNetwork(page)

      await page.goto(BASE + url)
      await idle()
      const title = await page.title()
      const before = await pageText(page)
      const fields = []
      for (const [label, value] of Object.entries(fill)) {
        const field = page.getByLabel(label)
        await field.fill(value)
        fields.push({ label, value: await field.inputValue() })
      }
      for (const name of buttons) {
        await page.getByRole('button', { name }).click()
        await idle()
      }
      await page.waitForLoadState('load')
      const after = await pageText(page)
      await sleep(SERVER_TAIL_MS)
      return { id: step.id, kind: 'browser', url: BASE + url, title, fields, buttons, before, after, console: consoleLog, network, server: lines(server.text.slice(mark)) }
    } finally {
      await browser.close()
    }
  }

  try {
    for (const step of def.steps) await play(step, undefined)
  } finally {
    for (const proc of procs) await stop(proc)
  }
  return { id: def.id, from: def.from, recorded: new Date(def.date).toISOString().slice(0, 10), events }
}

// Файлы проекта из `git ls-files` с хешами blob рабочего дерева: [{ path, blob }].
export async function trackedFiles(project) {
  const env = baseEnv(join(project, '..'))
  const paths = (await git(['ls-files', '-z'], { cwd: project, env })).split('\0').filter(Boolean)
  check(paths.every((p) => !p.includes('\n')), 'В имени файла проекта есть перевод строки')
  if (paths.length === 0) return []
  const blobs = (await git(['hash-object', '--no-filters', '--stdin-paths'], { cwd: project, env, input: paths.join('\n') + '\n' })).trim().split('\n')
  return paths.map((path, i) => ({ path, blob: blobs[i] }))
}
