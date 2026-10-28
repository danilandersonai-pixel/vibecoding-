#!/usr/bin/env node
// Печатает событие записи сессии с номерами строк — в тех же единицах, что спеки кадров записей:
//   run, commit — вывод: номера для Terminal.lines;
//   browser — строки server: номера для Terminal.lines; сообщения консоли (как в DevTools): номера для Browser.consoleLines;
//     текстовые строки страницы: их можно красить в Browser.marks;
//   agent — шаги по порядку: по реплике на каждый в Agent.at.steps; команды можно спрашивать в Agent.ask;
//   file — дифф от первой «@@»: номера для Diff.lines и Diff.highlight; файл после правки: номера для Editor.lines и Editor.highlight;
//   read — текст файла: номера для Editor.lines и Editor.highlight.
// Номера идут с 1, диапазоны включают оба конца. Использование (из course/):
//   node scripts/print-event.mjs                   — какие есть записи
//   node scripts/print-event.mjs s02-sets          — события записи
//   node scripts/print-event.mjs s02-sets fix      — одно событие с номерами строк
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { addedLines, consoleText, diffBody, diffCounts, fileLines } from '../video/term/frames/source.ts'

const SESSIONS = join(dirname(fileURLToPath(import.meta.url)), '..', 'video', 'sessions')

// «номер метка текст», номера выровнены по ширине самого большого
function numbered(lines, mark = () => ' ') {
  const width = String(lines.length).length
  return lines.map((text, i) => `${String(i + 1).padStart(width)} ${mark(i)}${text}`)
}

const MINUS = '−'

/** Записи сессий, которые есть на диске: id по именам файлов. */
export function sessionIds() {
  return readdirSync(SESSIONS)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.slice(0, -'.json'.length))
    .sort()
}

/** Запись сессии по id; нет такой — ошибка со списком записей. */
export function loadRecord(session) {
  if (!sessionIds().includes(session)) throw new Error(`Нет записи сессии «${session}». Есть: ${sessionIds().join(', ')}`)
  return JSON.parse(readFileSync(join(SESSIONS, `${session}.json`), 'utf8'))
}

/** События записи по одному на строку: id, вид и что в них. */
export function listEvents(record) {
  const what = (e) => {
    if (e.kind === 'run' || e.kind === 'commit') return e.cmd
    if (e.kind === 'file' || e.kind === 'read') return e.path
    if (e.kind === 'browser') return `${e.url} «${e.title}»`
    return e.prompt.slice(0, 60)
  }
  return record.events.map((e) => `${e.id}  ${e.kind}  ${what(e)}`)
}

/** Событие записи: заголовок и строки с номерами. */
export function formatEvent(event, record) {
  const head = (text) => `# ${event.id}  ${event.kind}  ${text}`
  if (event.kind === 'run') {
    const code = event.code === null ? 'работает' : `код ${event.code}`
    return [head(`${event.cwd} $ ${event.cmd}  (${code})`), 'вывод — номера для Terminal.lines:', ...numbered(event.out)]
  }
  if (event.kind === 'commit') return [head(event.cmd), 'вывод — номера для Terminal.lines:', ...numbered(event.out)]
  if (event.kind === 'browser') {
    // Строки, которые можно красить: не заголовок (первая строка), не подписи полей и не кнопки
    const skip = new Set([...event.fields.map((f) => f.label), ...event.buttons])
    const texts = [...new Set([...event.before.slice(1), ...event.after.slice(1)])].filter((t) => !skip.has(t))
    return [
      head(`${event.url} «${event.title}»`),
      ...(event.server.length > 0 ? ['вывод dev-сервера (server) — номера для Terminal.lines:', ...numbered(event.server)] : []),
      ...(event.console.length > 0 ? ['сообщения консоли (как в DevTools) — номера для Browser.consoleLines:', ...numbered(event.console.map((m) => `${m.type.padEnd(7)} ${consoleText(m.text)}`))] : []),
      ...(texts.length > 0 ? ['текстовые строки страницы — их можно красить в Browser.marks (текст строки — точно такой):', ...texts.map((t) => `  ${t}`)] : []),
    ]
  }
  if (event.kind === 'read') {
    return [head(event.path), 'файл — номера строк для Editor.lines и Editor.highlight:', ...numbered(fileLines(event.text))]
  }
  if (event.kind === 'file') {
    const body = diffBody(event.diff)
    const { add, del } = diffCounts(body)
    const file = fileLines(event.after)
    const added = addedLines(event.diff)
    return [
      head(`${event.path}  +${add} ${MINUS}${del}`),
      'дифф от первой «@@» — номера для Diff.lines и Diff.highlight:',
      ...numbered(body.map((l) => l.raw), () => ''),
      'файл после правки — номера строк для Editor.lines и Editor.highlight («+» — новые строки, их набирают typing и ghost):',
      ...numbered(file, (i) => (added.has(i + 1) ? '+' : ' ')),
    ]
  }
  // agent: шаги по порядку; сами строки шагов кадр берёт из их событий, запрос и ответ — авторский текст сцены
  const byId = new Map((record?.events ?? []).map((e) => [e.id, e]))
  const what = (e) => {
    if (!e) return ''
    if (e.kind === 'read') return `  ${e.path}`
    if (e.kind === 'file') return `  ${e.path}  +${diffCounts(diffBody(e.diff)).add} ${MINUS}${diffCounts(diffBody(e.diff)).del}`
    return `  ${e.cmd}  (в Agent.ask — вопрос [y / n])`
  }
  const steps = event.steps.map((id, i) => {
    const e = byId.get(id)
    return `${i + 1} ${id}${e ? `  ${e.kind}${what(e)}` : ''}`
  })
  return [
    head(event.prompt.slice(0, 60)),
    'запрос и ответ — авторский текст сцены; код у chat — из первого шага file',
    ...(steps.length > 0 ? ['шаги — по реплике на каждый в Agent.at.steps:', ...steps] : ['шагов нет']),
  ]
}

function main(args) {
  const [session, id] = args
  if (!session) return ['Записи сессий:', ...sessionIds().map((s) => `  ${s}`), '', 'node scripts/print-event.mjs <сессия> [<событие>]']
  const record = loadRecord(session)
  if (!id) return [`События ${session}:`, ...listEvents(record).map((l) => `  ${l}`)]
  const event = record.events.find((e) => e.id === id)
  if (!event) throw new Error(`В записи «${session}» нет события «${id}». Есть: ${record.events.map((e) => e.id).join(', ')}`)
  return formatEvent(event, record)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    console.log(main(process.argv.slice(2)).join('\n'))
  } catch (e) {
    console.error(e instanceof Error ? e.message : e)
    process.exitCode = 1
  }
}
