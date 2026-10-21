// Рендер ролика в MP4 (H.264) и проверка лимита хранилища страницы: 20 МБ на файл.
// Запуск: node scripts/render-video.mjs <compositionId> <out.mp4>
import { execFileSync } from 'node:child_process'
import { statSync } from 'node:fs'

const BROWSER = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell'
const LIMIT_BYTES = 20 * 1024 * 1024

const [id, out] = process.argv.slice(2)
if (!id || !out) {
  console.error('Использование: node scripts/render-video.mjs <compositionId> <out.mp4>')
  process.exit(1)
}

execFileSync('npx', ['remotion', 'render', 'video/index.ts', id, out, '--codec=h264', '--crf=28', `--browser-executable=${BROWSER}`], { stdio: 'inherit' })

const bytes = statSync(out).size
const seconds = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', out]).toString().trim())
console.log(`${out}: ${seconds.toFixed(1)} с, ${(bytes / 1024 / 1024).toFixed(1)} МБ`)
if (bytes > LIMIT_BYTES) {
  console.error(`Файл больше 20 МБ — не поместится в хранилище страницы. Поднимите --crf или сократите ролик.`)
  process.exit(1)
}
