// Снимки урока набора «Репозиторий» для проверки глазами: кадр середины каждой сцены и кадр середины каждого пояснения
// (с рамками пояснений — проп debugSpots). Бандл Remotion собирается один раз, браузер открывается один раз.
// Запуск (из course/): node scripts/lesson-stills.mjs <compositionId> <script.gen.json> <outDir>
//   например: node scripts/lesson-stills.mjs term-lesson video/term/fixture-lesson.gen.json /tmp/stills
// Браузер — headless_shell из /opt/pw-browsers; playwright install не запускать.
import { mkdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const BROWSER = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell'

const pad = (n) => String(n).padStart(2, '0')

/**
 * Что снимать: середина каждой сцены (scene-NN-<id>.png; если она между репликами — начало следующей реплики сцены, чтобы были видны
 * субтитры) и середина каждого пояснения (spot-NN-<сцена>.png, с рамками).
 */
export function stillShots(script) {
  const starts = []
  let at = 0
  for (const s of script.scenes) {
    starts.push(at)
    at += s.durationInFrames
  }
  const sceneOf = (frame) => {
    let k = 0
    starts.forEach((s, i) => {
      if (s <= frame) k = i
    })
    return script.scenes[k].id
  }
  const cues = script.cues ?? []
  const middle = (i) => {
    const end = starts[i] + script.scenes[i].durationInFrames
    const mid = starts[i] + Math.floor(script.scenes[i].durationInFrames / 2)
    if (cues.some((c) => mid >= c.from && mid < c.to)) return mid
    return cues.find((c) => c.from > mid && c.from < end)?.from ?? mid
  }
  return [
    ...script.scenes.map((s, i) => ({ file: `scene-${pad(i + 1)}-${s.id}.png`, frame: middle(i), debugSpots: false })),
    ...script.hotspots.map((h, i) => ({ file: `spot-${pad(i + 1)}-${sceneOf(h.from)}.png`, frame: Math.floor((h.from + h.to) / 2), debugSpots: true })),
  ]
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [id, json, outDir] = process.argv.slice(2)
  if (!id || !json || !outDir) {
    console.error('Использование: node scripts/lesson-stills.mjs <compositionId> <script.gen.json> <outDir>')
    process.exit(1)
  }
  const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
  const shots = stillShots(JSON.parse(readFileSync(resolve(json), 'utf8')))
  mkdirSync(resolve(outDir), { recursive: true })

  const { bundle } = await import('@remotion/bundler')
  const { openBrowser, renderStill, selectComposition } = await import('@remotion/renderer')
  const { webpackOverride } = await import('../video/webpack-override.mjs')

  const serveUrl = await bundle({ entryPoint: join(root, 'video/index.ts'), webpackOverride })
  const browser = await openBrowser('chrome', { browserExecutable: BROWSER, logLevel: 'error' })
  try {
    // Композиция с пропами снимка: без рамок и с рамками пояснений
    const compositions = new Map()
    for (const debugSpots of [false, true]) {
      const inputProps = { debugSpots }
      compositions.set(debugSpots, await selectComposition({ serveUrl, id, inputProps, puppeteerInstance: browser, browserExecutable: BROWSER, logLevel: 'error' }))
    }
    for (const shot of shots) {
      const output = join(resolve(outDir), shot.file)
      const inputProps = { debugSpots: shot.debugSpots }
      await renderStill({ composition: compositions.get(shot.debugSpots), serveUrl, output, frame: shot.frame, inputProps, puppeteerInstance: browser, browserExecutable: BROWSER, logLevel: 'error' })
      console.log(`${output}  кадр ${shot.frame}`)
    }
  } finally {
    await browser.close({ silent: true })
  }
}
