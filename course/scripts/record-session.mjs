// Запись сессий приложения тренера: проигрывает цепочку ../demo-app/sessions/*.mjs (по имени файла) во временной папке,
// по-настоящему выполняя шаги, пишет video/sessions/<id>.json и ../demo-app/state/<id>.tar.gz (состояние проекта после сессии)
// и заменяет ../demo-app/app/ файлами проекта из `git ls-files`.
// Запуск (из course/):
//   node scripts/record-session.mjs              — вся цепочка и состояния всех сессий
//   node scripts/record-session.mjs --from <id>  — сессия <id> и все следующие, от состояния сессии перед <id>; раньше ничего не трогается
// Папки можно подменить переменными окружения RECORD_SESSIONS_DIR, RECORD_OUT_DIR, RECORD_APP_DIR, RECORD_STATE_DIR (так её проверяют тесты).
// Перезапись — явное действие: тесты команду на настоящих папках не запускают, а проверяют уже сделанные записи.
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { packState, recordChain, trackedFiles, unpackState } from './session/record.mjs'

const fail = (message) => {
  console.error(message)
  process.exit(1)
}

const USAGE = `Использование:
  node scripts/record-session.mjs              — вся цепочка сессий и состояния всех сессий
  node scripts/record-session.mjs --from <id>  — сессия <id> и все следующие от состояния предыдущей сессии`

// Разбор аргументов: ничего или `--from <id>` / `--from=<id>`; возвращает id или null.
function parseArgs(args) {
  if (args.length === 0) return null
  if (args.length === 1 && args[0].startsWith('--from=') && args[0].length > '--from='.length) return args[0].slice('--from='.length)
  if (args.length === 2 && args[0] === '--from' && !args[1].startsWith('-')) return args[1]
  return fail(`Непонятные аргументы: ${args.join(' ')}\n${USAGE}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = join(fileURLToPath(new URL('.', import.meta.url)), '..') // course/
  const dirOf = (name, fallback) => (process.env[name] ? resolve(process.env[name]) : fallback)
  const sessionsDir = dirOf('RECORD_SESSIONS_DIR', join(root, '../demo-app/sessions'))
  const appDir = dirOf('RECORD_APP_DIR', join(root, '../demo-app/app'))
  const stateDir = dirOf('RECORD_STATE_DIR', join(root, '../demo-app/state'))
  const outDir = dirOf('RECORD_OUT_DIR', join(root, 'video/sessions'))
  // путь для сообщений: внутри репозитория — от его корня (demo-app/state/…), иначе как есть
  const shown = (path) => (relative(join(root, '..'), path).startsWith('..') ? path : relative(join(root, '..'), path))
  const stateOf = (dir, id) => join(dir, `${id}.tar.gz`)

  const from = parseArgs(process.argv.slice(2))
  if (!existsSync(sessionsDir)) fail('Нет папки ../demo-app/sessions: шаги сессий приложения тренера ещё не написаны, записывать нечего.')
  const files = readdirSync(sessionsDir).filter((name) => name.endsWith('.mjs')).sort()
  if (files.length === 0) fail('В ../demo-app/sessions нет ни одного файла сессии (*.mjs).')

  const defs = []
  for (const name of files) {
    const def = (await import(pathToFileURL(join(sessionsDir, name)).href)).default
    if (!def || typeof def !== 'object') fail(`${name}: нет export default с описанием сессии.`)
    if (def.id !== basename(name, '.mjs')) fail(`${name}: id сессии «${def.id}» не совпадает с именем файла.`)
    defs.push(def)
  }

  // С чего начинаем: --from — от состояния сессии перед <id>. Первая сессия состояния до себя не имеет: пишется вся цепочка.
  let restore
  if (from !== null) {
    const at = defs.findIndex((def) => def.id === from)
    if (at < 0) fail(`Нет сессии «${from}». Сессии цепочки: ${defs.map((def) => def.id).join(', ')}`)
    if (at > 0) {
      const prev = defs[at - 1].id
      const archive = stateOf(stateDir, prev)
      if (!existsSync(archive)) fail(`Нет состояния сессии «${prev}» (${shown(archive)}): запишите цепочку целиком`)
      restore = { id: prev, load: (project) => unpackState(archive, project) }
    }
  }

  // Ctrl+C, kill и обрыв терминала или ssh (SIGHUP): выходим штатно, чтобы рекордер успел добить dev-серверы и остановить базу
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(signal, () => process.exit(130))

  // Во временной папке: work/ — запись, state/ — состояния. В курс они попадают только после всех проверок.
  const temp = mkdtempSync(join(tmpdir(), 'rec-'))
  const workdir = join(temp, 'work')
  const stateTemp = join(temp, 'state')
  let result
  try {
    result = await recordChain(defs, {
      workdir,
      npmCache: join(root, 'node_modules/.cache/session-npm'),
      state: { save: (id, project) => packState(stateOf(stateTemp, id), project), restore },
    })
  } catch (err) {
    fail(`${err.message}\nВременная папка записи оставлена для разбора: ${workdir}`)
  }

  // Приложение в demo-app/app — ровно то, что закоммитила последняя сессия
  const tracked = await trackedFiles(result.project)
  const last = result.records.at(-1)
  const commit = last.events.findLast((e) => e.kind === 'commit')
  if (!commit) fail(`В последней сессии «${last.id}» нет коммита: приложение для demo-app/app не зафиксировано.\nВременная папка записи: ${workdir}`)
  const committed = new Map(commit.files.map((f) => [f.path, f.blob]))
  const problems = [
    ...tracked.filter((f) => committed.get(f.path) !== f.blob).map((f) => `изменён после коммита или не закоммичен: ${f.path}`),
    ...[...committed.keys()].filter((path) => !tracked.some((f) => f.path === path)).map((path) => `закоммичен, но удалён: ${path}`),
  ]
  if (problems.length) fail(`Проект после последней сессии не совпадает с её последним коммитом, ничего не записано:\n${problems.join('\n')}\nВременная папка записи: ${workdir}`)

  mkdirSync(outDir, { recursive: true })
  for (const record of result.records) writeFileSync(join(outDir, `${record.id}.json`), JSON.stringify(record, null, 1) + '\n')

  // состояния записанных сессий; архивы сессий раньше --from остаются как были
  mkdirSync(stateDir, { recursive: true })
  for (const record of result.records) copyFileSync(stateOf(stateTemp, record.id), stateOf(stateDir, record.id))

  rmSync(appDir, { recursive: true, force: true })
  for (const { path } of tracked) {
    mkdirSync(dirname(join(appDir, path)), { recursive: true })
    copyFileSync(join(result.project, path), join(appDir, path))
  }

  rmSync(temp, { recursive: true, force: true })
  const ids = new Set(defs.map((def) => def.id))
  const stale = (dir, ext) => readdirSync(dir).filter((name) => name.endsWith(ext) && !ids.has(basename(name, ext)))
  if (stale(outDir, '.json').length) console.warn(`Записи без сессии в цепочке (удалите, если не нужны): ${stale(outDir, '.json').join(', ')}`)
  if (stale(stateDir, '.tar.gz').length) console.warn(`Состояния без сессии в цепочке (удалите, если не нужны): ${stale(stateDir, '.tar.gz').join(', ')}`)
  console.log(`Записано сессий: ${result.records.length}, файлов в demo-app/app: ${tracked.length}`)
}
