// Запись сессий приложения тренера: проигрывает всю цепочку ../demo-app/sessions/*.mjs (по имени файла) во временной папке,
// по-настоящему выполняя шаги, пишет video/sessions/<id>.json и заменяет ../demo-app/app/ файлами проекта из `git ls-files`.
// Запуск (из course/): node scripts/record-session.mjs
// Перезапись — явное действие: тесты команду не запускают, а проверяют уже сделанные записи.
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { recordChain, trackedFiles } from './session/record.mjs'

const fail = (message) => {
  console.error(message)
  process.exit(1)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = join(fileURLToPath(new URL('.', import.meta.url)), '..') // course/
  const sessionsDir = join(root, '../demo-app/sessions')
  const appDir = join(root, '../demo-app/app')
  const outDir = join(root, 'video/sessions')

  if (process.argv.length > 2) fail('Использование: node scripts/record-session.mjs\nСкрипт записывает всю цепочку сессий и аргументов не принимает.')
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

  // Ctrl+C и kill: выходим штатно, чтобы рекордер успел добить dev-серверы
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => process.exit(130))

  const workdir = mkdtempSync(join(tmpdir(), 'rec-'))
  let result
  try {
    result = await recordChain(defs, { workdir, npmCache: join(root, 'node_modules/.cache/session-npm') })
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

  rmSync(appDir, { recursive: true, force: true })
  for (const { path } of tracked) {
    mkdirSync(dirname(join(appDir, path)), { recursive: true })
    copyFileSync(join(result.project, path), join(appDir, path))
  }

  rmSync(workdir, { recursive: true, force: true })
  const ids = new Set(result.records.map((r) => r.id))
  const stale = readdirSync(outDir).filter((name) => name.endsWith('.json') && !ids.has(basename(name, '.json')))
  if (stale.length) console.warn(`Записи без сессии в цепочке (удалите, если не нужны): ${stale.join(', ')}`)
  console.log(`Записано сессий: ${result.records.length}, файлов в demo-app/app: ${tracked.length}`)
}
