import { readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import vibe from '../../../content/figures/1.1.svg?raw'
import aiwords from '../../../content/figures/abc_aiwords.svg?raw'
import envs from '../../../content/figures/abc_envs.svg?raw'
import restaurant from '../../../content/figures/abc_restaurant.svg?raw'
import modelcard from '../../../content/figures/ch1_modelcard.svg?raw'
import models from '../../../content/figures/ch1_models.svg?raw'
import trust from '../../../content/figures/ch1_trust.svg?raw'

// Кадр, который «видят» компоненты кадров, задаёт тест (приём из frames.test.tsx).
const now = vi.hoisted(() => ({ frame: 0 }))
vi.mock('remotion', async (importOriginal) => ({ ...(await importOriginal<typeof import('remotion')>()), useCurrentFrame: () => now.frame }))

import { bookSection } from '../book'
import type { Clock, FrameCtx, Rect } from '../frame'
import { appear, easeOut } from '../motion'
import { textWidth, wrapText } from '../text'
import { alpha, MIN_TEXT, MOTION, SAFE, T } from '../theme'
import { TITLE } from './boardPlan'
import { CLOCK, ctx } from './fixture'
import { FIT, fitWidth, fitWrap } from './fit'
import { FRAMES, frameDef } from './index'
import type { AgendaSpec, BoardSpec, FigureSpec, FrameSpec, RecapSpec } from './index'
import { splitSvg } from './svg'

const START = CLOCK.beat(0) // 30
const beat = (i: number) => CLOCK.beat(i)
// Сцена, которая кончается раньше, чем что-либо успевает появиться целиком.
const SHORT: Clock = { beat: (i) => 30 + i * 90, duration: 50, lines: 6 }
// Сцена в 40 кадров: схема (прорисовка до кадра 49) и пункты плана (до кадра 45) не успевают.
const TIGHT: Clock = { ...CLOCK, duration: 40 }

function view(spec: FrameSpec, frame: number, clock: Clock = CLOCK, c: FrameCtx = ctx): string {
  now.frame = frame
  const { Component } = frameDef(spec)
  return renderToStaticMarkup(
    <svg>
      <Component spec={spec} clock={clock} ctx={c} />
    </svg>,
  )
}

// Внутренность группы <g data-part="имя">…</g> (группы кадров листовые); null — части на кадре нет.
function part(html: string, name: string): string | null {
  const m = new RegExp(`<g data-part="${name.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}"[^>]*>(.*?)</g>`, 's').exec(html)
  return m ? m[1] : null
}

// Открывающий тег группы части: data-part="имя" и его атрибуты.
function partTag(html: string, name: string): string | null {
  const m = new RegExp(`<g data-part="${name.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}"[^>]*>`).exec(html)
  return m ? m[0] : null
}

function plain(html: string): string {
  return html
    .replace(/<!--.*?-->/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

const unescape = (s: string) => s.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&')
const count = (html: string, needle: string) => html.split(needle).length - 1
const number = (html: string | null, re: RegExp) => Number(re.exec(html ?? '')?.[1] ?? NaN)
const opacityOf = (tag: string | null) => number(tag, /opacity="([\d.]+)"/)
// Сколько линий прорисовано до конца (смещение штриха 0) и сколько линий с прорисовкой вообще
const fullyDrawn = (html: string) => count(html.replace(/stroke-dashoffset:0(?![.\d])/g, 'stroke-dashoffset:@'), 'stroke-dashoffset:@')

function fontSizes(html: string): number[] {
  return [
    ...[...html.matchAll(/font-size="([\d.]+)"/g)].map((m) => Number(m[1])),
    ...[...html.matchAll(/font-size:\s*([\d.]+)px/g)].map((m) => Number(m[1])),
  ]
}

const inside = (r: Rect) => r.x >= SAFE.x - 0.01 && r.y >= SAFE.y - 0.01 && r.x + r.w <= SAFE.x + SAFE.w + 0.01 && r.y + r.h <= SAFE.y + SAFE.h + 0.01
const below = (a: Rect, b: Rect) => a.y >= b.y + b.h - 0.01 // a целиком ниже b
const apart = (a: Rect, b: Rect) => a.x >= b.x + b.w - 0.01 || b.x >= a.x + a.w - 0.01 || below(a, b) || below(b, a) // прямоугольники не налезают друг на друга

afterEach(() => {
  now.frame = 0
})

describe('набор кадров', () => {
  it('в FRAMES десять кадров с полным контрактом: шесть записей и figure, board, agenda, recap', () => {
    expect(Object.keys(FRAMES).sort()).toEqual(['agenda', 'agent', 'board', 'browser', 'diff', 'editor', 'figure', 'gitlog', 'recap', 'terminal'])
    for (const type of ['figure', 'board', 'agenda', 'recap'] as const) {
      const def = FRAMES[type]
      expect(typeof def.layout).toBe('function')
      expect(typeof def.moments).toBe('function')
      expect(typeof def.problems).toBe('function')
      expect(typeof def.Component).toBe('function')
    }
  })

  it('frameDef возвращает описание кадра по типу спеки', () => {
    expect(frameDef({ type: 'figure', svg: vibe })).toBe(FRAMES.figure)
    expect(frameDef({ type: 'board', title: 'Т' })).toBe(FRAMES.board)
    expect(frameDef({ type: 'agenda' })).toBe(FRAMES.agenda)
    expect(frameDef({ type: 'recap', items: [] })).toBe(FRAMES.recap)
  })

  it('Figure.tsx, Board.tsx, Agenda.tsx и Recap.tsx на месте и без useState и useEffect', () => {
    const dir = dirname(fileURLToPath(import.meta.url))
    const files = readdirSync(dir).filter((f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx'))
    expect(files).toEqual(expect.arrayContaining(['Figure.tsx', 'Board.tsx', 'Agenda.tsx', 'Recap.tsx']))
    // компоненты и планы новых кадров (в fixture.ts «useState» — текст файла страницы в записи)
    const code = [...files, 'svg.ts', 'figurePlan.ts', 'boardPlan.ts', 'agendaPlan.ts', 'recapPlan.ts']
    for (const f of code) expect(readFileSync(resolve(dir, f), 'utf8'), f).not.toMatch(/useState|useEffect/)
  })
})

describe('fit: запас на ширину текста', () => {
  it('FIT — 1,08 от замера: ширина и перенос считаются с запасом над textWidth и wrapText', () => {
    expect(FIT).toBe(1.08)
    expect(fitWidth('абвгдежз', 28)).toBeCloseTo(textWidth('абвгдежз', 28) * FIT, 8)
    const text = 'слово и ещё слово '.repeat(12).trim()
    const plain = wrapText(text, 28, 500)
    const safe = fitWrap(text, 28, 500)
    expect(safe.length).toBeGreaterThanOrEqual(plain.length)
    for (const line of safe) expect(fitWidth(line, 28)).toBeLessThanOrEqual(500 + 0.01)
    expect(safe.join(' ')).toBe(text)
  })
})

describe('Figure', () => {
  const def = FRAMES.figure
  const CROP: [number, number, number, number] = [0, 40, 760, 370]
  const WHOLE: FigureSpec = { type: 'figure', svg: restaurant }
  const BACK: [number, number, number, number] = [457.6, 76, 139.2, 114] // «Бэкенд» в схеме abc_restaurant
  const N = splitSvg(restaurant).children.length
  const problems = (spec: FigureSpec, clock: Clock = CLOCK) => def.problems(spec, ctx, clock)
  const shown = (html: string) => [...html.matchAll(/data-el="(\d+)"/g)].map((m) => Number(m[1]))

  describe('layout', () => {
    it('frame — вся безопасная область; без focus других частей нет', () => {
      const layout = def.layout(WHOLE, ctx)
      expect(layout).toEqual({ frame: { x: SAFE.x, y: SAFE.y, w: SAFE.w, h: SAFE.h } })
    })

    it('focus:<имя> — прямоугольник схемы на холсте: масштаб вписывает схему в SAFE, схема по центру', () => {
      const spec: FigureSpec = { ...WHOLE, focus: [{ at: 2, name: 'Бэкенд', rect: BACK }] }
      const r = def.layout(spec, ctx)['focus:Бэкенд']
      const scale = Math.min(SAFE.w / 760, SAFE.h / 351)
      const ox = SAFE.x + (SAFE.w - 760 * scale) / 2
      const oy = SAFE.y + (SAFE.h - 351 * scale) / 2
      expect(r.x).toBeCloseTo(ox + BACK[0] * scale, 6)
      expect(r.y).toBeCloseTo(oy + BACK[1] * scale, 6)
      expect(r.w).toBeCloseTo(BACK[2] * scale, 6)
      expect(r.h).toBeCloseTo(BACK[3] * scale, 6)
      expect(inside(r)).toBe(true)
    })

    it('crop меняет масштаб и смещение: часть схемы вписывается в SAFE', () => {
      const spec: FigureSpec = { type: 'figure', svg: vibe, crop: CROP, focus: [{ at: 2, name: 'Вайб', rect: [520, 280, 200, 60] }] }
      const r = def.layout(spec, ctx)['focus:Вайб']
      const scale = Math.min(SAFE.w / 760, SAFE.h / 370) // высота 370 → 2,097
      const ox = SAFE.x + (SAFE.w - 760 * scale) / 2
      expect(r.x).toBeCloseTo(ox + 520 * scale, 6)
      expect(r.y).toBeCloseTo(SAFE.y + (SAFE.h - 370 * scale) / 2 + (280 - 40) * scale, 6)
      expect(r.w).toBeCloseTo(200 * scale, 6)
    })
  })

  describe('problems', () => {
    it('схема 1.1 целиком — мелкий текст: масштаб 1,89 при 11,5 px даёт меньше 24', () => {
      const bad = problems({ type: 'figure', svg: vibe })
      expect(bad).toHaveLength(1)
      expect(bad[0]).toMatch(/мелк/)
      expect(bad[0]).toMatch(/crop/)
    })

    it('1.1 с crop [0, 40, 760, 370] — без проблем: масштаб 2,097 × 11,5 ≥ 24', () => {
      expect(problems({ type: 'figure', svg: vibe, crop: CROP })).toEqual([])
    })

    it('схемы пилота, которые помещаются целиком: abc_restaurant (масштаб 2,21 × 11 ≥ 24)', () => {
      expect(problems(WHOLE)).toEqual([])
    })

    it('ловит crop вне viewBox и пустой crop', () => {
      expect(problems({ type: 'figure', svg: vibe, crop: [0, 40, 760, 400] }).join('\n')).toMatch(/crop/)
      expect(problems({ type: 'figure', svg: vibe, crop: [-10, 40, 760, 370] }).join('\n')).toMatch(/crop/)
      expect(problems({ type: 'figure', svg: vibe, crop: [0, 40, 0, 370] }).join('\n')).toMatch(/crop/)
    })

    it('ловит не-схему и схему без viewBox', () => {
      expect(problems({ type: 'figure', svg: '<div></div>' }).join('\n')).toMatch(/svg/)
      expect(problems({ type: 'figure', svg: '<svg><rect/></svg>' }).join('\n')).toMatch(/viewBox/)
    })

    it('ловит реплики вне сцены в reveal и focus, reveal.to раньше from, focus не по порядку и с одним именем', () => {
      expect(problems({ ...WHOLE, reveal: { from: 0, to: 9 } }).join('\n')).toMatch(/reveal\.to/)
      expect(problems({ ...WHOLE, reveal: { from: 2, to: 1 } }).join('\n')).toMatch(/reveal/)
      expect(problems({ ...WHOLE, focus: [{ at: 9, name: 'a', rect: BACK }] }).join('\n')).toMatch(/focus\[0\]/)
      expect(
        problems({ ...WHOLE, focus: [{ at: 3, name: 'a', rect: BACK }, { at: 2, name: 'b', rect: BACK }] }).join('\n'),
      ).toMatch(/порядк/)
      expect(
        problems({ ...WHOLE, focus: [{ at: 1, name: 'a', rect: BACK }, { at: 2, name: 'a', rect: BACK }] }).join('\n'),
      ).toMatch(/дважды|повтор/)
    })

    it('ловит focus вне схемы (и вне crop)', () => {
      expect(problems({ ...WHOLE, focus: [{ at: 1, name: 'a', rect: [700, 300, 100, 100] }] }).join('\n')).toMatch(/focus\[0\]/)
      // 1.1 с crop: заголовок схемы (y 10–34) срезан
      expect(problems({ type: 'figure', svg: vibe, crop: CROP, focus: [{ at: 1, name: 'a', rect: [20, 10, 300, 24] }] }).join('\n')).toMatch(/focus\[0\]/)
      expect(problems({ ...WHOLE, focus: [{ at: 1, name: 'a', rect: [10, 10, 0, 40] }] }).join('\n')).toMatch(/focus\[0\]/)
    })

    it('ловит то, что не успевает до конца сцены', () => {
      expect(problems(WHOLE, TIGHT).join('\n')).toMatch(/сцен/)
      expect(problems({ ...WHOLE, focus: [{ at: 1, name: 'a', rect: BACK }] }, { ...CLOCK, duration: 125 }).join('\n')).toMatch(/сцен/)
    })

    it('схемы пилота: целиком проходят abc_restaurant, abc_envs, abc_aiwords, ch1_trust; 1.1, ch1_modelcard и ch1_models — только с crop', () => {
      for (const svg of [restaurant, envs, aiwords, trust]) expect(problems({ type: 'figure', svg })).toEqual([])
      for (const svg of [vibe, modelcard, models]) expect(problems({ type: 'figure', svg }).join('\n')).toMatch(/мелк/)
      expect(problems({ type: 'figure', svg: vibe, crop: [0, 40, 760, 370] })).toEqual([])
      expect(problems({ type: 'figure', svg: modelcard, crop: [0, 40, 760, 350] })).toEqual([]) // окно карточки с семью пояснениями
      expect(problems({ type: 'figure', svg: modelcard, crop: [0, 396, 760, 76] })).toEqual([]) // нижняя плашка
      expect(problems({ type: 'figure', svg: models, crop: [0, 36, 760, 334] })).toEqual([]) // три ступени и легенда
      expect(problems({ type: 'figure', svg: models, crop: [0, 366, 760, 84] })).toEqual([]) // две нижние плашки
      // чуть выше допустимого — снова мелко: 11 px × (776 / 360) = 23,7
      expect(problems({ type: 'figure', svg: modelcard, crop: [0, 40, 760, 360] }).join('\n')).toMatch(/мелк/)
    })

    it('верные reveal и focus — без проблем', () => {
      expect(problems({ ...WHOLE, reveal: { from: 0, to: 2 }, focus: [{ at: 3, name: 'Бэкенд', rect: BACK }, { at: 4, name: 'API', rect: [310, 76, 139.2, 114] }] })).toEqual([])
    })
  })

  describe('разметка', () => {
    it('Review Focus 2: обёртка задаёт каждую переменную var(--…) из src/styles/figures.css тёмным значением', () => {
      const css = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../../src/styles/figures.css'), 'utf8')
      const used = new Set([...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]))
      expect(used.size).toBeGreaterThan(8)
      const html = view(WHOLE, START + 30)
      const style = unescape(/<g data-figure="[^"]*" style="([^"]*)"/.exec(html)?.[1] ?? '')
      const vars = Object.fromEntries([...style.matchAll(/(--[\w-]+):\s*((?:[^;(]|\([^)]*\))*)/g)].map((m) => [m[1], m[2].trim()]))
      const dark = new Set<string>([...Object.values(T), ...[T.ink, T.soft, T.line, T.grid].map((c) => c.toUpperCase())])
      for (const name of used) {
        expect(vars[name], `переменная ${name} не задана обёрткой`).toBeTruthy()
        const v = vars[name]
        expect(dark.has(v) || /^rgba\(/.test(v), `${name}: ${v}`).toBe(true)
      }
      // тёмные значения: цвета схем — токены темы
      expect(vars['--fig-ink']).toBe(T.ink)
      expect(vars['--fig-soft']).toBe(T.soft)
      expect(vars['--fig-line']).toBe(T.line)
      expect(vars['--fig-grid']).toBe(T.grid)
      expect(vars['--fig-risk']).toBe(T.err)
      expect(vars['--fig-ok']).toBe(T.ok)
      expect(vars['--fig-on']).toBe(T.desk)
      expect(vars['--accent']).toBe(T.ink)
      expect(vars['--font-body']).toBe(T.font)
    })

    it('маркеры стрелок _defs.svg лежат в видимом <defs> внутри обёртки, а не в скрытом блоке', () => {
      const html = view(WHOLE, START + 30)
      const wrap = html.slice(html.indexOf('<g data-figure'))
      expect(wrap.indexOf('<defs>')).toBeGreaterThan(-1)
      for (const id of ['bk-arrow', 'bk-arrow-acc', 'bk-arrow-risk', 'bk-arrow-ok']) expect(wrap).toContain(`id="${id}"`)
      expect(wrap.indexOf('<defs>')).toBeLessThan(wrap.indexOf('<svg'))
      expect(html).not.toMatch(/display:\s*none|hidden/)
    })

    it('схема — вложенный <svg> с viewBox схемы (или crop), по центру SAFE и без полей', () => {
      const m = /<svg x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" viewBox="([^"]+)"/.exec(view(WHOLE, START + 30))!
      const scale = Math.min(SAFE.w / 760, SAFE.h / 351)
      expect(m[5]).toBe('0 0 760 351')
      expect(Number(m[3])).toBeCloseTo(760 * scale, 2)
      expect(Number(m[4])).toBeCloseTo(351 * scale, 2)
      expect(Number(m[1])).toBeCloseTo(SAFE.x + (SAFE.w - 760 * scale) / 2, 2)
      expect(Number(m[2])).toBeCloseTo(SAFE.y + (SAFE.h - 351 * scale) / 2, 2)
      const c = /<svg x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" viewBox="([^"]+)"/.exec(view({ type: 'figure', svg: vibe, crop: CROP }, START + 30))!
      expect(c[5]).toBe('0 40 760 370')
      const r = { x: Number(c[1]), y: Number(c[2]), w: Number(c[3]), h: Number(c[4]) }
      expect(inside(r)).toBe(true)
    })

    it('по умолчанию схема появляется целиком на реплике 0: до неё пусто, к beat(0) + 19 всё на месте', () => {
      expect(shown(view(WHOLE, START - 1))).toEqual([])
      expect(shown(view(WHOLE, START))).toEqual([]) // прогресс 0
      expect(shown(view(WHOLE, START + 1))).toHaveLength(N)
      const done = view(WHOLE, START + MOTION.draw)
      expect(shown(done)).toHaveLength(N)
      // каждая сплошная линия прорисована до конца, остальные элементы — непрозрачны
      expect(fullyDrawn(done)).toBe(count(done, 'pathLength="1"'))
      expect(count(done, 'pathLength="1"')).toBeGreaterThan(0)
    })

    it('сплошные линии прорисовываются (pathLength 1, stroke-dashoffset убывает), пунктир и текст — появляются', () => {
      const early = view(WHOLE, START + 4)
      expect(count(early, 'pathLength="1"')).toBe(4) // четыре стрелки между частями: сплошные fg-ln
      const offsets = [...early.matchAll(/stroke-dashoffset:([\d.]+)/g)].map((m) => Number(m[1]))
      const p = appear(START + 4, START, MOTION.draw)
      for (const o of offsets) expect(o).toBeCloseTo(1 - p, 3)
      const later = [...view(WHOLE, START + 10).matchAll(/stroke-dashoffset:([\d.]+)/g)].map((m) => Number(m[1]))
      expect(later[0]).toBeLessThan(offsets[0])
      // пунктирные линии (fg-dots) — без pathLength: они появляются прозрачностью
      expect(early).toMatch(/<g data-el="\d+" opacity="[\d.]+"><path d="M85.6 182L85.6 236" class="fg-ln fg-dash fg-dots"\/>/)
      expect(early).toMatch(/<g data-el="\d+" opacity="[\d.]+"><text [^>]*>Фронтенд<\/text>/)
    })

    it('наконечник стрелки появляется, когда линия дорисована', () => {
      expect(view(WHOLE, START + 4)).not.toContain('marker-end')
      expect(view(WHOLE, START + MOTION.draw)).toContain('marker-end="url(#bk-arrow)"')
    })

    it('элемент без прогресса не выводится; непрозрачность — appear за MOTION.appear', () => {
      const html = view(WHOLE, START + 3)
      const o = opacityOf(/<g data-el="0"[^>]*>/.exec(html)![0])
      expect(o).toBeCloseTo(appear(START + 3, START), 4)
      expect(o).toBeGreaterThan(0)
      expect(o).toBeLessThan(1)
      expect(opacityOf(/<g data-el="0"[^>]*>/.exec(view(WHOLE, START + MOTION.appear))![0])).toBe(1)
    })

    it('reveal: элементы выходят по порядку между репликами from и to; последний заканчивается на beat(to)', () => {
      const spec: FigureSpec = { ...WHOLE, reveal: { from: 1, to: 3 } }
      expect(shown(view(spec, beat(1) - 1))).toEqual([])
      let prev = 0
      for (let f = beat(1); f <= beat(3) + 10; f += 7) {
        const ids = shown(view(spec, f))
        expect(ids, `кадр ${f}`).toEqual(ids.map((_, i) => i)) // всегда начало списка, по порядку
        expect(ids.length).toBeGreaterThanOrEqual(prev)
        prev = ids.length
      }
      expect(shown(view(spec, beat(1) + 2)).length).toBeGreaterThan(0)
      expect(shown(view(spec, beat(1) + 2)).length).toBeLessThan(N)
      // середина промежутка — примерно половина схемы
      const mid = shown(view(spec, (beat(1) + beat(3)) / 2)).length
      expect(mid).toBeGreaterThan(N * 0.3)
      expect(mid).toBeLessThan(N * 0.7)
      // к beat(to) все на месте и дорисованы
      const done = view(spec, beat(3))
      expect(shown(done)).toHaveLength(N)
      expect(fullyDrawn(done)).toBe(count(done, 'pathLength="1"'))
      // пока идёт показ, какая-то линия прорисована наполовину
      let partial = false
      for (let f = beat(1); f < beat(3) && !partial; f++) partial = /stroke-dashoffset:0\.\d/.test(view(spec, f))
      expect(partial).toBe(true)
    })

    it('focus: остальное приглушается до 35 % — подложка desk 65 % с «окном» вокруг части, рамка ink 2 px со скруглением 8', () => {
      const spec: FigureSpec = { ...WHOLE, focus: [{ at: 2, name: 'Бэкенд', rect: BACK }] }
      expect(partTag(view(spec, beat(2) - 1), 'focus:Бэкенд')).toBeNull()
      const html = view(spec, beat(2) + MOTION.appear)
      const g = part(html, 'focus:Бэкенд')!
      expect(opacityOf(partTag(html, 'focus:Бэкенд'))).toBe(1)
      expect(g).toContain(`fill="${T.desk}"`)
      expect(g).toContain('fill-opacity="0.65"')
      expect(g).toContain('fill-rule="evenodd"')
      expect(g).toMatch(new RegExp(`<rect [^>]*fill="none" stroke="${T.ink}" stroke-width="2"`))
      expect(g).toContain('rx="8"')
      // рамка и «окно» стоят на прямоугольнике части на холсте
      const r = def.layout(spec, ctx)['focus:Бэкенд']
      expect(number(g, /<rect x="([\d.]+)"/)).toBeCloseTo(r.x, 1)
      expect(number(g, /<rect [^>]*\sy="([\d.]+)"/)).toBeCloseTo(r.y, 1)
      expect(number(g, /<rect [^>]*\swidth="([\d.]+)"/)).toBeCloseTo(r.w, 1)
      expect(number(g, /<rect [^>]*\sheight="([\d.]+)"/)).toBeCloseTo(r.h, 1)
    })

    it('focus появляется за MOTION.appear', () => {
      const spec: FigureSpec = { ...WHOLE, focus: [{ at: 2, name: 'Бэкенд', rect: BACK }] }
      const o = opacityOf(partTag(view(spec, beat(2) + 3), 'focus:Бэкенд'))
      expect(o).toBeCloseTo(easeOut(3 / MOTION.appear), 4)
      expect(o).toBeGreaterThan(0)
      expect(o).toBeLessThan(1)
    })

    it('несколько focus идут по очереди: следующий заменяет предыдущий', () => {
      const spec: FigureSpec = { ...WHOLE, focus: [{ at: 1, name: 'API', rect: [310, 76, 139.2, 114] }, { at: 3, name: 'Бэкенд', rect: BACK }] }
      expect(partTag(view(spec, beat(1) + MOTION.appear), 'focus:API')).not.toBeNull()
      expect(partTag(view(spec, beat(1) + MOTION.appear), 'focus:Бэкенд')).toBeNull()
      // на смене: первый уходит, второй приходит
      const mid = view(spec, beat(3) + 4)
      expect(opacityOf(partTag(mid, 'focus:API'))).toBeCloseTo(1 - appear(beat(3) + 4, beat(3)), 4)
      expect(opacityOf(partTag(mid, 'focus:Бэкенд'))).toBeCloseTo(appear(beat(3) + 4, beat(3)), 4)
      // после смены остаётся один
      const after = view(spec, beat(3) + MOTION.appear)
      expect(partTag(after, 'focus:API')).toBeNull()
      expect(opacityOf(partTag(after, 'focus:Бэкенд'))).toBe(1)
    })

    it('в разметке нет id, которые могли бы столкнуться при растворении двух сцен: маски и клипы не нужны', () => {
      const spec: FigureSpec = { ...WHOLE, focus: [{ at: 2, name: 'Бэкенд', rect: BACK }] }
      const html = view(spec, beat(2) + MOTION.appear)
      const outside = html.replace(/<defs>.*?<\/defs>/s, '').replace(/<g data-el.*?<\/g>/gs, '')
      expect(outside).not.toMatch(/\bid="/)
    })

    it('линии разметки не тоньше 2 px, цвета разметки — только из темы', () => {
      const spec: FigureSpec = { ...WHOLE, focus: [{ at: 2, name: 'Бэкенд', rect: BACK }] }
      const allowed = new Set<string>([...Object.values(T).filter((v) => v.startsWith('#')).map((v) => v.toUpperCase()), 'none'])
      const html = view(spec, beat(2) + MOTION.appear)
      const outside = html.replace(/<defs>.*?<\/defs>/s, '').replace(/<g data-el.*?<\/g>/gs, '')
      for (const m of outside.matchAll(/stroke-width="([\d.]+)"/g)) expect(Number(m[1])).toBeGreaterThanOrEqual(2)
      for (const m of outside.matchAll(/(?:fill|stroke)="(#[0-9A-Fa-f]{3,8})"/g)) expect(allowed.has(m[1].toUpperCase()), m[1]).toBe(true)
    })

    it('текст схемы после масштаба не мельче 24 px: масштаб × самый мелкий шрифт (для схем пилота)', () => {
      const scale = (svg: string, crop?: [number, number, number, number]) => {
        const { viewBox, minFont } = splitSvg(svg)
        const [, , w, h] = crop ?? viewBox
        return Math.min(SAFE.w / w, SAFE.h / h) * minFont
      }
      expect(scale(restaurant)).toBeGreaterThanOrEqual(MIN_TEXT)
      expect(scale(vibe, CROP)).toBeGreaterThanOrEqual(MIN_TEXT)
      expect(scale(vibe)).toBeLessThan(MIN_TEXT)
      expect(scale(models)).toBeLessThan(MIN_TEXT)
    })
  })

  describe('moments', () => {
    it('по умолчанию — начало и реплика 0', () => {
      expect(def.moments(WHOLE, CLOCK, ctx)).toEqual([0, START])
    })

    it('с reveal — начало каждого элемента; с focus — реплики focus; по возрастанию, без повторов', () => {
      const spec: FigureSpec = { ...WHOLE, reveal: { from: 1, to: 3 }, focus: [{ at: 4, name: 'a', rect: BACK }, { at: 5, name: 'b', rect: BACK }] }
      const m = def.moments(spec, CLOCK, ctx)
      expect(m[0]).toBe(0)
      expect(m).toContain(beat(1))
      expect(m).toContain(beat(4))
      expect(m).toContain(beat(5))
      expect(m.filter((f) => f > 0 && f < beat(4)).length).toBeGreaterThan(10)
      expect(m).toEqual([...new Set(m)].sort((a, b) => a - b))
    })
  })
})

describe('Board', () => {
  const def = FRAMES.board
  const problems = (spec: BoardSpec, clock: Clock = CLOCK) => def.problems(spec, ctx, clock)
  const TABLE: BoardSpec = {
    type: 'board',
    title: 'Три модели',
    table: {
      head: ['Модель', 'Для чего', 'Цена'],
      rows: [
        ['Haiku', 'быстрые мелочи', 'дёшево'],
        ['Sonnet', 'повседневная работа', 'средняя'],
        ['Opus', 'сложные задачи', 'дорого'],
      ],
      at: [0, 1, 2],
      mark: [{ at: 3, row: 1, tone: 'ok' }],
    },
  }
  const TABLE_SPEC = TABLE
  const CARDS: BoardSpec = {
    type: 'board',
    cards: [
      { title: 'Абонемент', text: ['платите раз в месяц', 'лимит на пять часов'], at: 0, tone: 'ok' },
      { title: 'Счётчик', text: ['платите за каждый запрос'], at: 1 },
      { title: 'Лимит', text: ['после него — пауза'], at: 2, tone: 'err' },
    ],
  }
  const SCALE: BoardSpec = {
    type: 'board',
    scale: {
      left: 'сам пишу всё',
      right: 'агент делает всё',
      items: [
        { label: 'Подсказка', pos: 0, at: 0 },
        { label: 'Чат', pos: 0.3, at: 1 },
        { label: 'Агент с вопросом', pos: 0.6, at: 2 },
        { label: 'Задача целиком', pos: 1, at: 3 },
      ],
      marker: [{ at: 4, pos: 0.3 }, { at: 5, pos: 0.6 }],
    },
  }

  describe('layout', () => {
    it('таблица: frame, title, row:<k> — внутри SAFE, строки идут сверху вниз под заголовком без наложения', () => {
      const layout = def.layout(TABLE, ctx)
      expect(Object.keys(layout).sort()).toEqual(['frame', 'row:0', 'row:1', 'row:2', 'title'])
      for (const [name, r] of Object.entries(layout)) expect(inside(r), name).toBe(true)
      expect(below(layout['row:0'], layout.title)).toBe(true)
      expect(below(layout['row:1'], layout['row:0'])).toBe(true)
      expect(below(layout['row:2'], layout['row:1'])).toBe(true)
    })

    it('карточки: card:<k> рядом в ряд, не налезают друг на друга и лежат в SAFE', () => {
      const layout = def.layout(CARDS, ctx)
      expect(Object.keys(layout).sort()).toEqual(['card:0', 'card:1', 'card:2', 'frame'])
      for (const [name, r] of Object.entries(layout)) expect(inside(r), name).toBe(true)
      expect(layout['card:1'].x).toBeGreaterThan(layout['card:0'].x + layout['card:0'].w - 0.01)
      expect(layout['card:2'].x).toBeGreaterThan(layout['card:1'].x + layout['card:1'].w - 0.01)
      expect(layout['card:0'].y).toBe(layout['card:1'].y)
      expect(layout['card:0'].h).toBe(layout['card:1'].h) // карточки ряда одной высоты
    })

    it('шесть карточек укладываются в два ряда по три, пять — тоже', () => {
      const cards = Array.from({ length: 6 }, (_, i) => ({ title: `К${i}`, text: ['текст'], at: i % 3 }))
      const layout = def.layout({ type: 'board', cards }, ctx)
      expect(layout['card:3'].y).toBeGreaterThan(layout['card:0'].y + layout['card:0'].h - 0.01)
      expect(layout['card:3'].x).toBeCloseTo(layout['card:0'].x, 6)
      for (const r of Object.values(layout)) expect(inside(r)).toBe(true)
    })

    it('шкала: item:<k> по порядку pos слева направо, marker — в конце сцены у последнего положения', () => {
      const layout = def.layout(SCALE, ctx)
      expect(Object.keys(layout).sort()).toEqual(['frame', 'item:0', 'item:1', 'item:2', 'item:3', 'marker'])
      for (const [name, r] of Object.entries(layout)) expect(inside(r), name).toBe(true)
      const cx = (r: Rect) => r.x + r.w / 2
      expect(cx(layout['item:1'])).toBeGreaterThan(cx(layout['item:0']))
      expect(cx(layout['item:2'])).toBeGreaterThan(cx(layout['item:1']))
      expect(cx(layout['item:3'])).toBeGreaterThan(cx(layout['item:2']))
      // последний маркер стоит на pos 0,6 — там же, где пункт 2
      expect(cx(layout.marker)).toBeCloseTo(cx(layout['item:2']), 0)
    })

    it('заголовок, таблица, карточки и шкала вместе — блоки друг под другом', () => {
      const all: BoardSpec = { ...TABLE, cards: [{ title: 'Итог', text: ['коротко'], at: 3 }], scale: { left: 'а', right: 'б', items: [{ label: 'раз', pos: 0.5, at: 4 }] } }
      const layout = def.layout(all, ctx)
      expect(below(layout['row:0'], layout.title)).toBe(true)
      expect(below(layout['card:0'], layout['row:2'])).toBe(true)
      expect(below(layout['item:0'], layout['card:0'])).toBe(true)
      for (const r of Object.values(layout)) expect(inside(r)).toBe(true)
      expect(problems(all)).toEqual([])
    })
  })

  describe('problems', () => {
    it('верные доски — без проблем', () => {
      expect(problems(TABLE)).toEqual([])
      expect(problems(CARDS)).toEqual([])
      expect(problems(SCALE)).toEqual([])
      expect(problems({ type: 'board', title: 'Только заголовок' })).toEqual([])
    })

    it('пустая доска без заголовка — проблема', () => {
      expect(problems({ type: 'board' }).join('\n')).toMatch(/пуст/)
    })

    it('карточка шире SAFE: слово, которое не влезает даже в одну строку', () => {
      const wide: BoardSpec = { type: 'board', cards: [{ title: 'Ш'.repeat(80), text: ['коротко'], at: 0 }] }
      expect(problems(wide).join('\n')).toMatch(/cards\[0\]/)
      const wideText: BoardSpec = { type: 'board', cards: [{ title: 'Заголовок', text: ['с'.repeat(200)], at: 0 }] }
      expect(problems(wideText).join('\n')).toMatch(/cards\[0\]/)
    })

    it('ловит текст карточек и таблицы, который не помещается по высоте', () => {
      const words = Array.from({ length: 400 }, (_, i) => `слово${i}`).join(' ')
      expect(problems({ type: 'board', cards: [{ title: 'Длинно', text: [words], at: 0 }] }).join('\n')).toMatch(/помещается/)
      const rows = Array.from({ length: 14 }, (_, i) => [`Строка ${i}`, 'значение'])
      expect(problems({ type: 'board', table: { head: ['Имя', 'Значение'], rows, at: rows.map(() => 0) } }).join('\n')).toMatch(/помещается/)
    })

    it('таблица: ловит неровные строки, at не по числу строк и не по порядку, лишний mark', () => {
      const table = TABLE.table!
      expect(problems({ ...TABLE, table: { ...table, rows: [['Haiku', 'мелочи'], ...table.rows.slice(1)] } }).join('\n')).toMatch(/table\.rows\[0\]/)
      expect(problems({ ...TABLE, table: { ...table, at: [0, 1] } }).join('\n')).toMatch(/table\.at/)
      expect(problems({ ...TABLE, table: { ...table, at: [0, 2, 1] } }).join('\n')).toMatch(/порядк/)
      expect(problems({ ...TABLE, table: { ...table, mark: [{ at: 3, row: 3 }] } }).join('\n')).toMatch(/table\.mark\[0\]/)
      expect(problems({ ...TABLE, table: { ...table, mark: [{ at: 0, row: 2 }] } }).join('\n')).toMatch(/table\.mark\[0\]/) // метка раньше строки
      expect(problems({ ...TABLE, table: { ...table, head: [] } }).join('\n')).toMatch(/table\.head/)
    })

    it('таблица: слово шире своего столбца — проблема', () => {
      const table = { head: ['А', 'Б'], rows: [['х'.repeat(120), 'у'.repeat(120)]], at: [0] }
      expect(problems({ type: 'board', table }).join('\n')).toMatch(/table/)
    })

    it('шкала: ловит pos вне 0…1, пустые пункты, маркер не по порядку и налезающие подписи', () => {
      const scale = SCALE.scale!
      expect(problems({ type: 'board', scale: { ...scale, items: [{ label: 'x', pos: 1.2, at: 0 }] } }).join('\n')).toMatch(/scale\.items\[0\]/)
      expect(problems({ type: 'board', scale: { ...scale, items: [] } }).join('\n')).toMatch(/scale\.items/)
      expect(problems({ type: 'board', scale: { ...scale, marker: [{ at: 4, pos: 2 }] } }).join('\n')).toMatch(/scale\.marker\[0\]/)
      expect(problems({ type: 'board', scale: { ...scale, marker: [{ at: 5, pos: 0.3 }, { at: 4, pos: 0.6 }] } }).join('\n')).toMatch(/порядк/)
      // три пункта подряд с одной стороны линии? — через один, а вот два с одной стороны почти в одной точке налезают
      const crowded = { ...scale, items: [{ label: 'Первый пункт', pos: 0.5, at: 0 }, { label: 'Второй', pos: 0.6, at: 1 }, { label: 'Третий пункт', pos: 0.52, at: 2 }], marker: undefined }
      expect(problems({ type: 'board', scale: crowded }).join('\n')).toMatch(/налез|scale\.items/)
    })

    it('ловит реплики вне сцены', () => {
      expect(problems({ ...TABLE, table: { ...TABLE.table!, at: [0, 1, 9] } }).join('\n')).toMatch(/реплик/)
      expect(problems({ type: 'board', cards: [{ title: 'А', text: [], at: 9 }] }).join('\n')).toMatch(/cards\[0\]/)
      expect(problems({ type: 'board', scale: { ...SCALE.scale!, items: [{ label: 'x', pos: 0.5, at: 9 }] } }).join('\n')).toMatch(/реплик/)
    })

    it('ловит то, что не успевает до конца сцены', () => {
      expect(problems(TABLE, SHORT).join('\n')).toMatch(/сцен/)
    })

    it('слишком длинный заголовок (больше двух строк) — проблема', () => {
      expect(problems({ type: 'board', title: 'слово '.repeat(60) }).join('\n')).toMatch(/title/)
    })
  })

  describe('разметка: таблица', () => {
    it('заголовок доски — 48 px, 600, ink; шапка — Golos Text 28 px 600 soft; строки — ink', () => {
      const html = view(TABLE, beat(3) + 30)
      const title = /<text [^>]*>Три модели<\/text>/.exec(html)![0]
      expect(title).toContain('font-size:48px')
      expect(title).toContain('font-weight:600')
      expect(title).toContain(`fill="${T.ink}"`)
      const head = /<text [^>]*>Модель<\/text>/.exec(html)![0]
      expect(head).toContain('font-size:28px')
      expect(head).toContain('font-weight:600')
      expect(head).toContain(`fill="${T.soft}"`)
      const cell = /<text [^>]*>Haiku<\/text>/.exec(html)![0]
      expect(cell).toContain('font-size:28px')
      expect(cell).toContain(`fill="${T.ink}"`)
      expect(cell).toContain(T.font.split(',')[0].replace(/'/g, '&#x27;'))
    })

    it('линии по образцу книги: сверху 2 px ink, под шапкой и снизу soft, между строками edge', () => {
      const html = view(TABLE, beat(3) + 30)
      const rules = [...html.matchAll(/<rect [^>]*data-rule="(\w+)"[^>]*>/g)].map((m) => m[0])
      const byKind = (kind: string) => rules.filter((r) => r.includes(`data-rule="${kind}"`))
      expect(byKind('top')).toHaveLength(1)
      expect(byKind('top')[0]).toContain(`fill="${T.ink}"`)
      expect(byKind('head')).toHaveLength(1)
      expect(byKind('head')[0]).toContain(`fill="${T.soft}"`)
      expect(byKind('between')).toHaveLength(2) // между тремя строками
      for (const r of byKind('between')) expect(r).toContain(`fill="${T.edge}"`)
      expect(byKind('bottom')).toHaveLength(1)
      expect(byKind('bottom')[0]).toContain(`fill="${T.soft}"`)
      for (const r of rules) expect(number(r, /height="([\d.]+)"/)).toBe(2)
    })

    it('строки появляются на своих репликах: row:<k> на beat(at[k])', () => {
      expect(part(view(TABLE, START), 'row:0')).toBeNull()
      expect(part(view(TABLE, START + 3), 'row:0')).not.toBeNull()
      expect(part(view(TABLE, beat(1)), 'row:1')).toBeNull()
      expect(part(view(TABLE, beat(1) + 3), 'row:1')).not.toBeNull()
      expect(part(view(TABLE, beat(2) - 1), 'row:2')).toBeNull()
      const o = opacityOf(partTag(view(TABLE, beat(1) + 3), 'row:1'))
      expect(o).toBeCloseTo(appear(beat(1) + 3, beat(1)), 4)
    })

    it('текст строки — ячейки по столбцам; ячейки одной строки на одной базовой линии, столбцы стоят вровень со строками выше', () => {
      const html = view(TABLE, beat(3) + 30)
      const xs = (name: string) => [...part(html, name)!.matchAll(/<text x="([\d.]+)"/g)].map((m) => Number(m[1]))
      expect(plain(part(html, 'row:2')!)).toBe('Opusсложные задачидорого')
      expect(xs('row:0')).toEqual(xs('row:1'))
      expect(xs('row:0')[0]).toBeLessThan(xs('row:0')[1])
      expect(xs('row:0')[1]).toBeLessThan(xs('row:0')[2])
      const ys = [...part(html, 'row:0')!.matchAll(/<text [^>]*y="([\d.]+)"/g)].map((m) => Number(m[1]))
      expect(new Set(ys).size).toBe(1)
    })

    it('mark: подложка tone 14 % и полоса слева 4 px цвета tone; появляется на своей реплике', () => {
      const before = part(view(TABLE, beat(3) - 1), 'row:1')!
      expect(before).not.toContain(`fill="${T.ok}"`)
      expect(before).not.toContain(alpha(T.ok, 0.14))
      const html = view(TABLE, beat(3) + MOTION.appear)
      const row = part(html, 'row:1')!
      const layout = def.layout(TABLE, ctx)['row:1']
      expect(row).toContain(`fill="${alpha(T.ok, 0.14)}"`)
      const bar = /<rect [^>]*data-mark="bar"[^>]*>/.exec(row)![0]
      expect(bar).toContain(`fill="${T.ok}"`)
      expect(number(bar, /width="([\d.]+)"/)).toBe(4)
      expect(number(bar, /\bx="([\d.]+)"/)).toBeCloseTo(layout.x, 1)
      expect(number(bar, /height="([\d.]+)"/)).toBeCloseTo(layout.h, 1)
      // у других строк метки нет
      expect(part(html, 'row:0')).not.toContain(`fill="${T.ok}"`)
    })

    it('mark с tone err — T.err, warn — T.warn; без tone — ink', () => {
      const withTone = (tone?: 'ok' | 'err' | 'warn'): BoardSpec => ({ ...TABLE, table: { ...TABLE.table!, mark: [{ at: 3, row: 0, tone }] } })
      const row = (spec: BoardSpec) => part(view(spec, beat(3) + MOTION.appear), 'row:0')!
      expect(row(withTone('err'))).toContain(`fill="${T.err}"`)
      expect(row(withTone('err'))).toContain(alpha(T.err, 0.14))
      expect(row(withTone('warn'))).toContain(`fill="${T.warn}"`)
      expect(row(withTone())).toContain(`fill="${T.ink}"`)
      expect(row(withTone())).toContain(alpha(T.ink, 0.14))
    })

    it('длинная ячейка переносится по wrapText в ширину столбца; строка становится выше', () => {
      const long = 'Очень длинное описание, которое не помещается в один столбец таблицы и должно перенестись на следующую строку'
      const table = { head: ['Имя', 'Описание'], rows: [['Раз', long], ['Два', 'коротко']], at: [0, 1] }
      const spec: BoardSpec = { type: 'board', table }
      expect(problems(spec)).toEqual([])
      const layout = def.layout(spec, ctx)
      const row0 = part(view(spec, beat(1) + 30), 'row:0')!
      expect(count(row0, '<text')).toBeGreaterThan(2)
      expect(layout['row:0'].h).toBeGreaterThan(layout['row:1'].h)
      expect(plain(row0).replace(/\s/g, '').endsWith(long.replace(/\s/g, ''))).toBe(true)
      // каждая строка короче ширины столбца
      expect(wrapText(long, 28, 400).length).toBeGreaterThan(1)
    })
  })

  describe('разметка: карточки', () => {
    it('карточка: рамка edge 2 px на paper, заголовок 32 px 600, текст 28 px soft', () => {
      const html = view(CARDS, beat(2) + 30)
      const card = part(html, 'card:1')!
      expect(card).toMatch(new RegExp(`<rect [^>]*fill="${T.paper}"[^>]*stroke="${T.edge}"[^>]*stroke-width="2"`))
      const title = /<text [^>]*>Счётчик<\/text>/.exec(card)![0]
      expect(title).toContain('font-size:32px')
      expect(title).toContain('font-weight:600')
      expect(title).toContain(`fill="${T.ink}"`)
      const text = /<text [^>]*>платите за каждый запрос<\/text>/.exec(card)![0]
      expect(text).toContain('font-size:28px')
      expect(text).toContain(`fill="${T.soft}"`)
    })

    it('tone красит рамку и заголовок, текст остаётся soft', () => {
      const html = view(CARDS, beat(2) + 30)
      const ok = part(html, 'card:0')!
      expect(ok).toContain(`stroke="${T.ok}"`)
      expect(/<text [^>]*>Абонемент<\/text>/.exec(ok)![0]).toContain(`fill="${T.ok}"`)
      expect(/<text [^>]*>платите раз в месяц<\/text>/.exec(ok)![0]).toContain(`fill="${T.soft}"`)
      expect(part(html, 'card:2')).toContain(`stroke="${T.err}"`)
      expect(part(html, 'card:1')).not.toContain(T.ok)
    })

    it('карточки появляются на своих репликах', () => {
      expect(part(view(CARDS, START), 'card:0')).toBeNull()
      expect(part(view(CARDS, START + 3), 'card:0')).not.toBeNull()
      expect(part(view(CARDS, beat(1) - 1), 'card:1')).toBeNull()
      expect(part(view(CARDS, beat(1) + 3), 'card:1')).not.toBeNull()
    })

    it('длинный текст карточки переносится по wrapText: ни одна строка не шире карточки', () => {
      const text = 'Это длинный абзац про то, как выбирать модель по цене ошибки, а не по бренду, и почему флагман не нужен на каждую мелочь.'
      const spec: BoardSpec = { type: 'board', cards: [{ title: 'Выбор', text: [text], at: 0 }, { title: 'Рядом', text: ['коротко'], at: 0 }] }
      expect(problems(spec)).toEqual([])
      const html = view(spec, START + 30)
      const lines = [...part(html, 'card:0')!.matchAll(/<text [^>]*font-size:28px[^>]*>([^<]*)<\/text>/g)].map((m) => m[1])
      expect(lines.length).toBeGreaterThan(1)
      expect(lines.join(' ')).toBe(text)
      const card = def.layout(spec, ctx)['card:0']
      for (const l of lines) expect([...l].length * 28 * 0.54).toBeLessThanOrEqual(card.w - 48 + 0.01)
      // карточки ряда одной высоты, у короткой текст не вылезает
      expect(def.layout(spec, ctx)['card:1'].h).toBe(card.h)
    })
  })

  describe('разметка: шкала', () => {
    it('линия T.line 2 px на всю ширину между подписями краёв; края — 28 px soft', () => {
      const html = view(SCALE, beat(5) + 30)
      const line = /<rect [^>]*data-scale="line"[^>]*>/.exec(html)![0]
      expect(line).toContain(`fill="${T.line}"`)
      expect(number(line, /height="([\d.]+)"/)).toBe(2)
      const left = /<text [^>]*>сам пишу всё<\/text>/.exec(html)![0]
      const right = /<text [^>]*>агент делает всё<\/text>/.exec(html)![0]
      for (const t of [left, right]) {
        expect(t).toContain('font-size:28px')
        expect(t).toContain(`fill="${T.soft}"`)
      }
      // подписи краёв стоят у краёв линии
      const lx = number(line, /\bx="([\d.]+)"/)
      const lw = number(line, /width="([\d.]+)"/)
      expect(number(left, /\bx="([\d.]+)"/)).toBeLessThan(lx)
      expect(number(right, /\bx="([\d.]+)"/)).toBeGreaterThan(lx + lw)
    })

    it('пункты — точки на линии и подписи над и под линией по очереди; появляются на своих репликах', () => {
      const html = view(SCALE, beat(3) + 30)
      const line = /<rect [^>]*data-scale="line"[^>]*>/.exec(html)![0]
      const lineY = number(line, /\by="([\d.]+)"/)
      const labelY = (k: number) => number(part(html, `item:${k}`), /<text [^>]*y="([\d.]+)"/)
      expect(labelY(0)).toBeLessThan(lineY) // над
      expect(labelY(1)).toBeGreaterThan(lineY) // под
      expect(labelY(2)).toBeLessThan(lineY)
      expect(labelY(3)).toBeGreaterThan(lineY)
      for (let k = 0; k < 4; k++) expect(part(html, `item:${k}`)).toContain('<circle')
      expect(plain(part(html, 'item:2')!)).toBe('Агент с вопросом')
      expect(part(view(SCALE, START), 'item:0')).toBeNull()
      expect(part(view(SCALE, beat(1) - 1), 'item:1')).toBeNull()
      expect(part(view(SCALE, beat(1) + 3), 'item:1')).not.toBeNull()
    })

    it('точка пункта стоит на линии, подпись по центру точки', () => {
      const html = view(SCALE, beat(3) + 30)
      const cy = number(part(html, 'item:1'), /<circle [^>]*cy="([\d.]+)"/)
      const lineY = number(/<rect [^>]*data-scale="line"[^>]*>/.exec(html)![0], /\by="([\d.]+)"/)
      expect(cy).toBeCloseTo(lineY + 1, 1)
      const cx = number(part(html, 'item:1'), /<circle [^>]*cx="([\d.]+)"/)
      expect(number(part(html, 'item:1'), /<text [^>]*x="([\d.]+)"/)).toBeCloseTo(cx, 1)
      expect(part(html, 'item:1')).toContain('text-anchor="middle"')
    })

    it('маркер — треугольник ink, появляется на первой реплике и переезжает за MOTION.move на следующей', () => {
      const x = (frame: number) => number(partTag(view(SCALE, frame), 'marker'), /translate\(([\d.]+)/)
      expect(partTag(view(SCALE, beat(4) - 1), 'marker')).toBeNull()
      const html = view(SCALE, beat(4) + MOTION.appear)
      const g = part(html, 'marker')!
      expect(g).toContain(`fill="${T.ink}"`)
      expect(g).toMatch(/<path d="M[-\d. ]+L[-\d. ]+L[-\d. ]+Z"/)
      const layout = def.layout(SCALE, ctx)
      const item1 = layout['item:1']
      expect(x(beat(4) + MOTION.appear)).toBeCloseTo(item1.x + item1.w / 2, 0)
      // переезд к pos 0,6 — к item:2
      const target = layout['item:2'].x + layout['item:2'].w / 2
      expect(x(beat(5))).toBeCloseTo(x(beat(4) + MOTION.appear), 4)
      const midX = x(beat(5) + 5)
      expect(midX).toBeGreaterThan(x(beat(5)))
      expect(midX).toBeLessThan(target)
      expect(x(beat(5) + MOTION.move)).toBeCloseTo(target, 0)
      expect(x(beat(5) + MOTION.move + 30)).toBeCloseTo(target, 0)
      // движение идёт по ease-out
      const p = (x(beat(5) + 5) - x(beat(5))) / (target - x(beat(5)))
      expect(p).toBeCloseTo(easeOut(5 / MOTION.move), 3)
    })
  })

  describe('размещение', () => {
    const titleBottom = (layout: Record<string, Rect>) => layout.title.y + layout.title.h

    it('блок под заголовком не уходит от него дальше TITLE.lift: заголовок и карточки остаются рядом', () => {
      const layout = def.layout({ ...CARDS, title: 'Что выбрать' }, ctx)
      expect(layout['card:0'].y - titleBottom(layout)).toBe(TITLE.gap + TITLE.lift)
    })

    it('без заголовка блок по центру окна по высоте', () => {
      const layout = def.layout(CARDS, ctx)
      const r = layout['card:0']
      expect(r.y - SAFE.y).toBeCloseTo(SAFE.y + SAFE.h - (r.y + r.h), 0)
    })

    it('очень высокий блок прижимается к заголовку без зазора сверху: остаётся TITLE.gap', () => {
      const words = Array.from({ length: 25 }, (_, i) => `слово${i}`).join(' ')
      const layout = def.layout({ type: 'board', title: 'Т', cards: [{ title: 'Высокая', text: [words, words, words], at: 0 }] }, ctx)
      expect(layout['card:0'].y - titleBottom(layout)).toBeLessThan(TITLE.gap + TITLE.lift)
      expect(layout['card:0'].y - titleBottom(layout)).toBeGreaterThanOrEqual(TITLE.gap)
    })

    it('таблица не уже TABLE.perCol на столбец: три столбца — на всю ширину окна, два — на две трети', () => {
      const three = def.layout(TABLE_SPEC, ctx)['row:0']
      expect(three.w).toBeCloseTo(SAFE.w, 0)
      const two: BoardSpec = { type: 'board', table: { head: ['А', 'Б'], rows: [['раз', 'два']], at: [0] } }
      expect(def.layout(two, ctx)['row:0'].w).toBeCloseTo((SAFE.w / 3) * 2, 0)
    })

    it('таблица с длинным текстом занимает всё окно по ширине, а слова остаются целыми', () => {
      const long = 'Очень длинное описание, которое не помещается в один столбец таблицы и должно перенестись на следующую строку, потому что иначе оно уйдёт за край окна'
      const spec: BoardSpec = { type: 'board', table: { head: ['Имя', 'Описание', 'Ещё'], rows: [['Раз', long, 'три']], at: [0] } }
      expect(problems(spec)).toEqual([])
      expect(def.layout(spec, ctx)['row:0'].w).toBeCloseTo(SAFE.w, 0)
    })

    it('подписи пунктов шкалы — 32 px ink, подписи краёв — 28 px soft', () => {
      const html = view(SCALE, beat(5) + 30)
      const label = /<text [^>]*>Агент с вопросом<\/text>/.exec(html)![0]
      expect(label).toContain('font-size:32px')
      expect(label).toContain(`fill="${T.ink}"`)
      expect(/<text [^>]*>сам пишу всё<\/text>/.exec(html)![0]).toContain('font-size:28px')
    })

    it('длинная подпись пункта шкалы переносится и растёт в сторону от линии', () => {
      const scale = { ...SCALE.scale!, items: [{ label: 'Очень длинная подпись пункта шкалы режимов', pos: 0.5, at: 0 }, { label: 'Чат', pos: 0.2, at: 1 }], marker: undefined }
      const spec: BoardSpec = { type: 'board', scale }
      expect(problems(spec)).toEqual([])
      const html = view(spec, beat(1) + 30)
      const ys = [...part(html, 'item:0')!.matchAll(/<text [^>]*y="([\d.]+)"/g)].map((m) => Number(m[1]))
      expect(ys.length).toBeGreaterThan(1)
      const lineY = number(/<rect [^>]*data-scale="line"[^>]*>/.exec(html)![0], /\by="([\d.]+)"/)
      for (const y of ys) expect(y).toBeLessThan(lineY) // первая подпись — над линией, строки растут вверх
      expect(ys[1] - ys[0]).toBe(44)
    })
  })

  describe('moments', () => {
    it('заголовок, строки, метки, карточки, пункты и маркеры; по возрастанию, без повторов', () => {
      const t = def.moments(TABLE, CLOCK, ctx)
      expect(t).toEqual([0, beat(0), beat(1), beat(2), beat(3)])
      expect(def.moments(CARDS, CLOCK, ctx)).toEqual([0, beat(0), beat(1), beat(2)])
      expect(def.moments(SCALE, CLOCK, ctx)).toEqual([0, beat(0), beat(1), beat(2), beat(3), beat(4), beat(5)])
    })
  })
})

describe('Agenda', () => {
  const def = FRAMES.agenda
  const four: FrameCtx = { ...ctx, lesson: { ...ctx.lesson, chapters: ['Что узнаете', 'А', 'Б', 'Итог'] } }
  const five: FrameCtx = { ...ctx, lesson: { ...ctx.lesson, chapters: ['Что узнаете', 'Четыре части приложения', 'Git: история проекта', 'От компьютера к сайту', 'Итог'] } }
  const SPEC: AgendaSpec = { type: 'agenda' }
  const problems = (spec: AgendaSpec, c: FrameCtx = four, clock: Clock = CLOCK) => def.problems(spec, c, clock)

  it('пункты — главы урока без первой и последней: «А» и «Б»; части item:0, item:1', () => {
    const layout = def.layout(SPEC, four)
    expect(Object.keys(layout).sort()).toEqual(['frame', 'item:0', 'item:1'])
    const html = view(SPEC, beat(0) + 60, CLOCK, four)
    expect(plain(part(html, 'item:0')!)).toBe('02А')
    expect(plain(part(html, 'item:1')!)).toBe('03Б')
  })

  it('номер — место главы в уроке (первая тематическая — «02»), Martian Mono faint; название — Golos Text 36 px ink', () => {
    const html = view(SPEC, beat(0) + 60, CLOCK, five)
    const item = part(html, 'item:2')!
    expect(plain(item)).toBe('04От компьютера к сайту')
    const num = /<text [^>]*>04<\/text>/.exec(item)![0]
    expect(num).toContain(`fill="${T.faint}"`)
    expect(num).toContain('Martian Mono')
    const name = /<text [^>]*>От компьютера к сайту<\/text>/.exec(item)![0]
    expect(name).toContain(`fill="${T.ink}"`)
    expect(name).toContain('font-size:36px')
    expect(name).toContain('Golos Text')
  })

  it('заголовок — первая глава урока («Что узнаете») Golos 48 px 600 ink', () => {
    const html = view(SPEC, beat(0) + 60, CLOCK, four)
    const title = /<text [^>]*>Что узнаете<\/text>/.exec(html)![0]
    expect(title).toContain('font-size:48px')
    expect(title).toContain('font-weight:600')
    expect(title).toContain(`fill="${T.ink}"`)
    // у ролика дня первая глава зовётся иначе — заголовок её
    const day: FrameCtx = { ...ctx, lesson: { ...ctx.lesson, chapters: ['Что строим сегодня', 'Пример', 'Подводный камень', 'Проверьте у себя'] } }
    expect(plain(view(SPEC, beat(0) + 60, CLOCK, day))).toContain('Что строим сегодня')
  })

  it('без at пункты идут очередью от beat(0) с шагом MOTION.stagger × 3', () => {
    const step = MOTION.stagger * 3
    expect(part(view(SPEC, START - 1, CLOCK, five), 'item:0')).toBeNull()
    expect(part(view(SPEC, START + 1, CLOCK, five), 'item:0')).not.toBeNull()
    expect(part(view(SPEC, START + step, CLOCK, five), 'item:1')).toBeNull()
    expect(part(view(SPEC, START + step + 1, CLOCK, five), 'item:1')).not.toBeNull()
    expect(part(view(SPEC, START + 2 * step, CLOCK, five), 'item:2')).toBeNull()
    const o = opacityOf(partTag(view(SPEC, START + step + 3, CLOCK, five), 'item:1'))
    expect(o).toBeCloseTo(appear(START + step + 3, START + step), 4)
  })

  it('с at пункты появляются на своих репликах', () => {
    const spec: AgendaSpec = { type: 'agenda', at: [1, 2] }
    expect(part(view(spec, beat(1) - 1, CLOCK, four), 'item:0')).toBeNull()
    expect(part(view(spec, beat(1) + 3, CLOCK, four), 'item:0')).not.toBeNull()
    expect(part(view(spec, beat(2) - 1, CLOCK, four), 'item:1')).toBeNull()
    expect(part(view(spec, beat(2) + 3, CLOCK, four), 'item:1')).not.toBeNull()
  })

  it('layout: заголовок сверху, строки сверху вниз внутри SAFE', () => {
    const layout = def.layout(SPEC, five)
    for (const [name, r] of Object.entries(layout)) expect(inside(r), name).toBe(true)
    expect(below(layout['item:1'], layout['item:0'])).toBe(true)
    expect(below(layout['item:2'], layout['item:1'])).toBe(true)
  })

  describe('problems', () => {
    it('верные данные — без проблем', () => {
      expect(problems(SPEC)).toEqual([])
      expect(problems(SPEC, five)).toEqual([])
      expect(problems({ type: 'agenda', at: [0, 1, 2] }, five)).toEqual([])
    })

    it('ловит урок без тематических глав', () => {
      expect(problems(SPEC, { ...ctx, lesson: { ...ctx.lesson, chapters: ['Что узнаете', 'Итог'] } }).join('\n')).toMatch(/глав/)
    })

    it('ловит at не по числу пунктов и реплики вне сцены', () => {
      expect(problems({ type: 'agenda', at: [0] }).join('\n')).toMatch(/at/)
      expect(problems({ type: 'agenda', at: [0, 9] }).join('\n')).toMatch(/реплик/)
    })

    it('ловит название, которое не помещается в строку, и список, который не помещается в окно', () => {
      const long: FrameCtx = { ...ctx, lesson: { ...ctx.lesson, chapters: ['Что узнаете', 'д'.repeat(120), 'Итог'] } }
      expect(problems(SPEC, long).join('\n')).toMatch(/item:0|шире|помещается/)
      const many: FrameCtx = { ...ctx, lesson: { ...ctx.lesson, chapters: ['Что узнаете', ...Array.from({ length: 14 }, (_, i) => `Глава ${i}`), 'Итог'] } }
      expect(problems(SPEC, many).join('\n')).toMatch(/помещается/)
    })

    it('ловит то, что не успевает до конца сцены', () => {
      expect(problems(SPEC, four, TIGHT).join('\n')).toMatch(/сцен/)
    })
  })

  it('moments: начало и появление каждого пункта', () => {
    const step = MOTION.stagger * 3
    expect(def.moments(SPEC, CLOCK, five)).toEqual([0, START, START + step, START + 2 * step])
    expect(def.moments({ type: 'agenda', at: [1, 2, 3] }, CLOCK, five)).toEqual([0, beat(1), beat(2), beat(3)])
  })
})

describe('Recap', () => {
  const def = FRAMES.recap
  const two: FrameCtx = { ...ctx, lesson: { ...ctx.lesson, book: ['sa1', 'sa2'] } }
  const SPEC: RecapSpec = {
    type: 'recap',
    items: [
      { text: 'У приложения четыре части: зал, официант, кухня и склад.', at: 0 },
      { text: 'Секреты хранятся в .env.local, а не в чате.', at: 1 },
      { text: 'Любую ошибку сначала читают целиком.', at: 2 },
    ],
  }
  const problems = (spec: RecapSpec, c: FrameCtx = two, clock: Clock = CLOCK) => def.problems(spec, c, clock)

  it('заголовок «Итог» 48 px 600; пункты 32 px ink со знаком «✓» цвета ok', () => {
    const html = view(SPEC, beat(2) + 60, CLOCK, two)
    const title = /<text [^>]*>Итог<\/text>/.exec(html)![0]
    expect(title).toContain('font-size:48px')
    expect(title).toContain('font-weight:600')
    const item = part(html, 'item:1')!
    const tick = /<text [^>]*>✓<\/text>/.exec(item)![0]
    expect(tick).toContain(`fill="${T.ok}"`)
    expect(tick).toContain('font-size:32px')
    expect(tick).toContain('Golos Text')
    const text = /<text [^>]*>Секреты хранятся в \.env\.local, а не в чате\.<\/text>/.exec(item)![0]
    expect(text).toContain(`fill="${T.ink}"`)
    expect(text).toContain('font-size:32px')
  })

  it('заголовок — последняя глава урока: у ролика дня «Проверьте у себя»', () => {
    const day: FrameCtx = { ...two, lesson: { ...two.lesson, chapters: ['Что строим сегодня', 'Пример', 'Проверьте у себя'] } }
    expect(plain(view(SPEC, beat(2) + 60, CLOCK, day))).toContain('Проверьте у себя')
  })

  it('пункты появляются на своих репликах, один на пункт', () => {
    expect(part(view(SPEC, START, CLOCK, two), 'item:0')).toBeNull()
    expect(part(view(SPEC, START + 3, CLOCK, two), 'item:0')).not.toBeNull()
    expect(part(view(SPEC, beat(1) - 1, CLOCK, two), 'item:1')).toBeNull()
    expect(part(view(SPEC, beat(1) + 3, CLOCK, two), 'item:1')).not.toBeNull()
    expect(opacityOf(partTag(view(SPEC, beat(1) + 3, CLOCK, two), 'item:1'))).toBeCloseTo(appear(beat(1) + 3, beat(1)), 4)
  })

  it('внизу «Книга:» faint и разделы книги по bookSection: «Азбука · Код, языки и чужие детали» по строке, 28 px soft', () => {
    const html = view(SPEC, beat(2) + 60, CLOCK, two)
    const book = part(html, 'book')!
    expect(plain(book)).toBe(`Книга:Азбука · ${bookSection('sa1')!.title}Азбука · ${bookSection('sa2')!.title}`)
    expect(plain(book)).toContain('Азбука · Код, языки и чужие детали')
    const label = /<text [^>]*>Книга:<\/text>/.exec(book)![0]
    expect(label).toContain(`fill="${T.faint}"`)
    const sec = /<text [^>]*>Азбука · Код, языки и чужие детали<\/text>/.exec(book)![0]
    expect(sec).toContain(`fill="${T.soft}"`)
    expect(sec).toContain('font-size:28px')
    // фиксированная фикстура: один раздел sa1
    expect(plain(part(view(SPEC, beat(2) + 60), 'book')!)).toBe(`Книга:Азбука · ${bookSection('sa1')!.title}`)
  })

  it('блок книги появляется после последнего пункта', () => {
    expect(part(view(SPEC, beat(2) + 3, CLOCK, two), 'book')).toBeNull()
    expect(part(view(SPEC, beat(2) + 40, CLOCK, two), 'book')).not.toBeNull()
  })

  it('книга без разделов — блока нет; главы с «Глава N · …» выводятся целиком', () => {
    const none: FrameCtx = { ...ctx, lesson: { ...ctx.lesson, book: [] } }
    expect(def.layout(SPEC, none).book).toBeUndefined()
    expect(problems(SPEC, none)).toEqual([])
    const ch1: FrameCtx = { ...ctx, lesson: { ...ctx.lesson, book: ['s5'] } }
    expect(plain(part(view(SPEC, beat(2) + 60, CLOCK, ch1), 'book')!)).toContain(`Глава 1 · Введение · ${bookSection('s5')!.title}`)
  })

  it('длинный пункт переносится по wrapText с отступом под знаком', () => {
    const long = 'Очень длинный пункт итога, который не помещается в одну строку и переносится на следующую, потому что мысль в нём не короткая и держится на трёх условиях.'
    const spec: RecapSpec = { type: 'recap', items: [{ text: long, at: 0 }] }
    const html = view(spec, START + 30, CLOCK, two)
    const lines = [...part(html, 'item:0')!.matchAll(/<text [^>]*font-size:32px[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]).filter((t) => t !== '✓')
    expect(lines.length).toBeGreaterThan(1)
    expect(lines.join(' ')).toBe(long)
    expect(problems(spec)).toEqual([])
    for (const l of lines) expect([...l].length * 32 * 0.54).toBeLessThanOrEqual(SAFE.w + 0.01)
  })

  describe('layout', () => {
    it('item:<k> сверху вниз, book — под пунктами у нижнего края SAFE; всё внутри SAFE', () => {
      const layout = def.layout(SPEC, two)
      expect(Object.keys(layout).sort()).toEqual(['book', 'frame', 'item:0', 'item:1', 'item:2'])
      for (const [name, r] of Object.entries(layout)) expect(inside(r), name).toBe(true)
      expect(below(layout['item:1'], layout['item:0'])).toBe(true)
      expect(below(layout['item:2'], layout['item:1'])).toBe(true)
      expect(below(layout.book, layout['item:2'])).toBe(true)
      expect(layout.book.y + layout.book.h).toBeCloseTo(SAFE.y + SAFE.h, 0)
    })
  })

  describe('problems', () => {
    it('верные данные — без проблем', () => {
      expect(problems(SPEC)).toEqual([])
      expect(problems(SPEC, two)).toEqual([])
    })

    it('ловит раздел книги, которого нет', () => {
      const bad: FrameCtx = { ...ctx, lesson: { ...ctx.lesson, book: ['sa1', 's999'] } }
      expect(problems(SPEC, bad).join('\n')).toMatch(/s999/)
    })

    it('ловит реплику вне сцены, пункты не по порядку реплик и пустой список пунктов', () => {
      expect(problems({ type: 'recap', items: [{ text: 'а', at: 9 }] }).join('\n')).toMatch(/реплик/)
      expect(problems({ type: 'recap', items: [{ text: 'а', at: 2 }, { text: 'б', at: 1 }] }).join('\n')).toMatch(/порядк/)
      expect(problems({ type: 'recap', items: [] }).join('\n')).toMatch(/пункт/)
    })

    it('ловит то, что не помещается в окно, и то, что не успевает до конца сцены', () => {
      const many = { type: 'recap' as const, items: Array.from({ length: 12 }, (_, i) => ({ text: `Пункт итога номер ${i}, достаточно длинный, чтобы занять строку`, at: Math.min(i, 5) })) }
      expect(problems(many, two).join('\n')).toMatch(/помещается/)
      expect(problems(SPEC, two, SHORT).join('\n')).toMatch(/сцен/)
    })
  })

  it('moments: пункты и появление блока книги', () => {
    const m = def.moments(SPEC, CLOCK, two)
    expect(m[0]).toBe(0)
    expect(m).toEqual(expect.arrayContaining([beat(0), beat(1), beat(2)]))
    expect(m.length).toBe(5)
    expect(m).toEqual([...new Set(m)].sort((a, b) => a - b))
  })
})

describe('размер текста и безопасная область (Board, Agenda, Recap)', () => {
  const five: FrameCtx = { ...ctx, lesson: { ...ctx.lesson, chapters: ['Что узнаете', 'Четыре части приложения', 'Git: история проекта', 'Итог'], book: ['sa1', 'sa2'] } }
  const specs: FrameSpec[] = [
    {
      type: 'board',
      title: 'Три модели',
      table: { head: ['Модель', 'Для чего'], rows: [['Haiku', 'быстрые мелочи'], ['Opus', 'сложные задачи']], at: [0, 1], mark: [{ at: 2, row: 1, tone: 'warn' }] },
    },
    { type: 'board', cards: [{ title: 'Раз', text: ['коротко'], at: 0 }, { title: 'Два', text: ['ещё короче'], at: 1, tone: 'err' }] },
    { type: 'board', scale: { left: 'мало', right: 'много', items: [{ label: 'Раз', pos: 0.2, at: 0 }, { label: 'Два', pos: 0.8, at: 1 }], marker: [{ at: 2, pos: 0.2 }] } },
    { type: 'agenda' },
    { type: 'recap', items: [{ text: 'Первое', at: 0 }, { text: 'Второе', at: 1 }] },
  ]

  it('все font-size в разметке не меньше 24', () => {
    for (const [i, spec] of specs.entries()) {
      for (const frame of [30, 60, 130, 230, 400, 560]) {
        const sizes = fontSizes(view(spec, frame, CLOCK, five))
        expect(Math.min(...sizes, 99), `${spec.type}#${i} @${frame}`).toBeGreaterThanOrEqual(MIN_TEXT)
      }
    }
  })

  it('линии не тоньше 2 px; stroke-width в разметке не меньше 2', () => {
    for (const spec of specs) {
      for (const frame of [60, 400, 560]) {
        for (const m of view(spec, frame, CLOCK, five).matchAll(/stroke-width="([\d.]+)"/g)) expect(Number(m[1])).toBeGreaterThanOrEqual(2)
        for (const m of view(spec, frame, CLOCK, five).matchAll(/data-rule="[^"]*"[^>]*height="([\d.]+)"/g)) expect(Number(m[1])).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('все части layout внутри SAFE и у каждой есть положительный размер; части не налезают друг на друга', () => {
    for (const spec of specs) {
      const layout = frameDef(spec).layout(spec, five)
      const names = Object.keys(layout).filter((n) => n !== 'frame' && n !== 'title')
      for (const [name, r] of Object.entries(layout)) {
        expect(inside(r), `${spec.type}:${name}`).toBe(true)
        expect(r.w, `${spec.type}:${name}`).toBeGreaterThan(0)
        expect(r.h, `${spec.type}:${name}`).toBeGreaterThan(0)
      }
      for (let i = 0; i < names.length; i++) {
        for (let j = i + 1; j < names.length; j++) {
          if (names[i] === 'marker' || names[j] === 'marker') continue // маркер стоит под пунктом
          expect(apart(layout[names[i]], layout[names[j]]), `${spec.type}: ${names[i]} и ${names[j]}`).toBe(true)
        }
      }
    }
  })

  it('цвета в разметке — только из темы (и прозрачность от них)', () => {
    const allowed = new Set<string>([...Object.values(T).filter((v) => v.startsWith('#')).map((v) => v.toUpperCase()), 'none'])
    for (const spec of specs) {
      for (const frame of [60, 400, 560]) {
        for (const m of view(spec, frame, CLOCK, five).matchAll(/(?:fill|stroke)="(#[0-9A-Fa-f]{3,8})"/g)) expect(allowed.has(m[1].toUpperCase()), `${spec.type}: ${m[1]}`).toBe(true)
      }
    }
  })

  it('кадры не требуют записей: работают с любым ctx.find', () => {
    const empty: FrameCtx = { ...five, find: () => { throw new Error('записей нет') } }
    for (const spec of specs) expect(() => view(spec, 120, CLOCK, empty)).not.toThrow()
  })
})
