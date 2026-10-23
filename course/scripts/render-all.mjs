// Рендер MP4 всех роликов каталога (или перечисленных) в out/<id>.mp4.
// Пропускает ролик, если его MP4 новее исходников (папка ролика, набор, герои, тема).
// В конце печатает таблицу «ролик — длительность — МБ»; файл больше 20 МБ — ошибка.
// Запуск: node scripts/render-all.mjs [id …]
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const LIMIT_BYTES = 20 * 1024 * 1024
const MB = 1024 * 1024

// id роликов в порядке каталога: ключи вида  'id': {
export function catalogIds(text) {
  return [...text.matchAll(/^ {2}'([\w-]+)': \{$/gm)].map((m) => m[1])
}

// MP4 свежий, если он есть и новее каждого исходника
export function isFresh(mp4Mtime, sourceMtimes) {
  return mp4Mtime !== undefined && sourceMtimes.every((t) => t < mp4Mtime)
}

const clock = (s) => `${Math.floor(Math.round(s) / 60)}:${String(Math.round(s) % 60).padStart(2, '0')}`

export function summary(rows) {
  return {
    lines: rows.map((r) => `${r.id}  ${clock(r.seconds)}  ${(r.bytes / MB).toFixed(1)} МБ`),
    tooBig: rows.filter((r) => r.bytes > LIMIT_BYTES).map((r) => r.id),
  }
}

function mtimes(path) {
  const st = statSync(path)
  if (!st.isDirectory()) return [st.mtimeMs]
  return readdirSync(path).flatMap((name) => mtimes(join(path, name)))
}

function duration(file) {
  return Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file]).toString().trim())
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
  const all = catalogIds(readFileSync(join(root, 'video/catalog.ts'), 'utf8'))
  const asked = process.argv.slice(2)
  const unknown = asked.filter((id) => !all.includes(id))
  if (unknown.length) {
    console.error(`Нет в каталоге: ${unknown.join(', ')}`)
    process.exit(1)
  }
  const ids = asked.length ? asked : all
  const shared = ['video/kit', 'video/actors', 'video/lib', 'video/theme.ts'].flatMap((p) => mtimes(join(root, p)))
  const rows = []
  for (const id of ids) {
    const out = join(root, 'out', `${id}.mp4`)
    const sources = [...shared, ...mtimes(join(root, 'video', id))]
    if (isFresh(existsSync(out) ? statSync(out).mtimeMs : undefined, sources)) {
      console.log(`${id}: MP4 свежий, пропускаю`)
    } else {
      execFileSync('node', [join(root, 'scripts/render-video.mjs'), id, out], { stdio: 'inherit', cwd: root })
    }
    rows.push({ id, seconds: duration(out), bytes: statSync(out).size })
  }
  const { lines, tooBig } = summary(rows)
  console.log(['', ...lines].join('\n'))
  if (tooBig.length) {
    console.error(`Больше 20 МБ: ${tooBig.join(', ')} — поднимите --crf или сократите ролик.`)
    process.exit(1)
  }
}
