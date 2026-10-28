// Замер шрифтов кадров «Репозиторий»: ширина знака Martian Mono и средняя ширина знака Golos Text 500 (в em).
// Числа, округлённые вверх до 0,01 em, идут в MONO.advance и GOLOS.avg (course/video/term/theme.ts).
// Запуск: node scripts/measure-fonts.mjs
// Браузер — из PLAYWRIGHT_BROWSERS_PATH (/opt/pw-browsers); playwright install не запускать.
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const FONTS = join(ROOT, 'node_modules', '@fontsource-variable')

// Подмножества шрифтов с диапазонами знаков — как в index.css пакетов (latin и cyrillic хватает для русского текста реплик).
const LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
const CYRILLIC = 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116'

function faces(family, pkg, name, weights) {
  return ['latin', 'cyrillic']
    .map((subset) => {
      // Страница из setContent — about:blank, ей file:// не отдаётся (NetworkError), поэтому woff2 вшиты как data: URL.
      const data = readFileSync(join(FONTS, pkg, 'files', `${name}-${subset}-wght-normal.woff2`)).toString('base64')
      return `@font-face{font-family:'${family}';font-weight:${weights};src:url('data:font/woff2;base64,${data}') format('woff2-variations');unicode-range:${subset === 'latin' ? LATIN : CYRILLIC}}`
    })
    .join('\n')
}

// Реплики роликов ch-abc и ch-01. Урок набора «Репозиторий» — из снимка сценария video/lessons/<id>/script.gen.json;
// прежний ролик — строки в одинарных кавычках внутри const SCENES его script.ts (отступ 6 пробелов).
function cues(id) {
  const gen = join(ROOT, 'video', 'lessons', id, 'script.gen.json')
  if (existsSync(gen)) return JSON.parse(readFileSync(gen, 'utf8')).cues.map((c) => c.text)
  const src = readFileSync(join(ROOT, 'video', id, 'script.ts'), 'utf8')
  const scenes = src.slice(src.indexOf('const SCENES'))
  const block = scenes.slice(0, scenes.search(/^\]/m))
  return [...block.matchAll(/^ {6}'(.*)',$/gm)].map((m) => m[1].replace(/\\'/g, "'"))
}

const lines = [...cues('ch-abc'), ...cues('ch-01')]
const up = (x) => Math.ceil(x * 100 - 1e-9) / 100

const html = `<!doctype html><meta charset="utf-8"><style>
${faces('MM', 'martian-mono', 'martian-mono', '100 800')}
${faces('GT', 'golos-text', 'golos-text', '400 900')}
span{white-space:pre;position:absolute;left:0;top:0;font-variant-ligatures:none}
</style><body></body>`

const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  await page.setContent(html)
  const result = await page.evaluate(
    async ({ lines }) => {
      const width = (font, text) => {
        const s = document.createElement('span')
        s.style.font = font
        s.textContent = text
        document.body.append(s)
        const w = s.getBoundingClientRect().width
        s.remove()
        return w
      }
      // Подгружаем подмножества явно, потом ждём всё остальное.
      const need = ['0', 'ш', 'M', ...new Set(lines.join(''))]
      await Promise.all(['400', '500', '600', '700'].map((w) => document.fonts.load(`${w} 24px MM`, need.join(''))))
      await document.fonts.load('500 100px GT', need.join(''))
      await document.fonts.ready

      const mono = {}
      for (const weight of [400, 500, 600, 700]) {
        for (const ch of ['0', 'ш', 'M']) {
          mono[`${weight} ${ch}`] = width(`${weight} 24px MM, monospace`, ch.repeat(100)) / 100 / 24
        }
      }
      // Проверка, что шрифт загрузился, а не подменён запасным: те же знаки в запасном моноширинном.
      const fallback = width('500 24px monospace', '0'.repeat(100)) / 100 / 24
      const golosFallback = width('500 100px sans-serif', lines.join('\n'))
      const golosTotal = lines.reduce((sum, line) => sum + width('500 100px GT, sans-serif', line), 0)
      const golosLines = lines.map((line) => width('500 100px GT, sans-serif', line) / 100 / line.length)
      return {
        mono,
        fallback,
        golosAvg: golosTotal / 100 / lines.reduce((n, l) => n + l.length, 0),
        golosMin: Math.min(...golosLines),
        golosMax: Math.max(...golosLines),
        golosLoaded: document.fonts.check('500 100px GT', 'ш') && golosTotal !== golosFallback,
        monoLoaded: document.fonts.check('500 24px MM', 'ш'),
        chars: lines.reduce((n, l) => n + l.length, 0),
      }
    },
    { lines },
  )

  console.log(`Martian Mono 24 px, ширина знака в em (100 знаков, делим на 100 и на 24):`)
  for (const [k, v] of Object.entries(result.mono)) console.log(`  вес ${k}: ${v.toFixed(5)}`)
  console.log(`  запасной monospace для сравнения: ${result.fallback.toFixed(5)}; шрифт загружен: ${result.monoLoaded}`)
  const maxMono = Math.max(...Object.values(result.mono))
  console.log(`Golos Text 500: ${lines.length} реплик, ${result.chars} знаков`)
  console.log(`  средняя ${result.golosAvg.toFixed(5)} em (по репликам: от ${result.golosMin.toFixed(4)} до ${result.golosMax.toFixed(4)}); шрифт загружен: ${result.golosLoaded}`)
  if (!result.golosLoaded || !result.monoLoaded) {
    console.error('Шрифты не загрузились — замер недействителен.')
    process.exitCode = 1
  }
  console.log('')
  console.log(`MEASURED_ADVANCE = ${maxMono.toFixed(5)}  →  MONO.advance = ${up(maxMono)}`)
  console.log(`GOLOS_MEASURED   = ${result.golosAvg.toFixed(5)}  →  GOLOS.avg    = ${up(result.golosAvg)}`)
} finally {
  await browser.close()
}
