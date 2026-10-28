import { readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { JSX } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

// Кадр, который «видят» компоненты кадров, задаёт тест (приём из video/kit/screens/screens.test.tsx).
const now = vi.hoisted(() => ({ frame: 0 }))
vi.mock('remotion', async (importOriginal) => ({ ...(await importOriginal<typeof import('remotion')>()), useCurrentFrame: () => now.frame }))

import { applyPatch } from '../../sessions/patch'
import type { FileEvent } from '../../sessions/types'
import type { Clock, FrameCtx, Rect } from '../frame'
import { monoChars } from '../text'
import { alpha, MIN_TEXT, MONO, MOTION, SAFE, T } from '../theme'
import { CLOCK, ctx, FIXTURE, makeClock } from './fixture'
import { outsideSafe, WIN } from './geometry'
import { FRAMES } from './index'
import type { DiffSpec, EditorSpec, FrameSpec, TerminalSpec } from './index'

const S = 'fixture'
const START = CLOCK.beat(0) // 30
// Сцена, которая кончается раньше, чем что-либо успевает появиться целиком.
const SHORT: Clock = { beat: (i) => 30 + i * 90, duration: 50, lines: 6 }

function view<K extends FrameSpec['type']>(type: K, spec: Extract<FrameSpec, { type: K }>, frame: number, clock: Clock = CLOCK): string {
  now.frame = frame
  const Component = FRAMES[type].Component as unknown as (props: { spec: unknown; clock: Clock; ctx: FrameCtx }) => JSX.Element
  return renderToStaticMarkup(
    <svg>
      <Component spec={spec} clock={clock} ctx={ctx} />
    </svg>,
  )
}

// Внутренность группы <g data-part="имя">…</g> (группы кадров листовые); null — части на кадре нет.
function part(html: string, name: string): string | null {
  const m = new RegExp(`<g data-part="${name.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}"[^>]*>(.*?)</g>`, 's').exec(html)
  return m ? m[1] : null
}

// Видимый текст разметки: без тегов и комментариев React, с обычными кавычками.
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

const shownLines = (html: string, event: string) => [...html.matchAll(new RegExp(`data-part="line:${event}:(\\d+)"`, 'g'))].map((m) => Number(m[1]))
const count = (html: string, needle: string) => html.split(needle).length - 1

// Все размеры шрифта в разметке: атрибут font-size, свойство font-size и сокращение font.
function fontSizes(html: string): number[] {
  return [
    ...[...html.matchAll(/font-size="([\d.]+)"/g)].map((m) => Number(m[1])),
    ...[...html.matchAll(/font-size:\s*([\d.]+)px/g)].map((m) => Number(m[1])),
    ...[...html.matchAll(/font:\s*(?:\d+\s+)?([\d.]+)px/g)].map((m) => Number(m[1])),
  ]
}

const inside = (r: Rect) => r.x >= SAFE.x - 0.01 && r.y >= SAFE.y - 0.01 && r.x + r.w <= SAFE.x + SAFE.w + 0.01 && r.y + r.h <= SAFE.y + SAFE.h + 0.01

afterEach(() => {
  now.frame = 0
})

describe('фикстура', () => {
  it('диффы событий file ложатся на before и дают after', () => {
    for (const e of FIXTURE.events) {
      if (e.kind !== 'file') continue
      expect(applyPatch((e as FileEvent).before, e.diff)).toBe(e.after)
    }
  })
})

describe('outsideSafe', () => {
  it('называет части, вышедшие за SAFE, и молчит о тех, что внутри', () => {
    expect(outsideSafe({ frame: { ...SAFE }, a: { x: SAFE.x, y: SAFE.y, w: 10, h: 10 } })).toEqual([])
    const bad = outsideSafe({ left: { x: SAFE.x - 1, y: SAFE.y, w: 10, h: 10 }, low: { x: SAFE.x, y: SAFE.y + SAFE.h - 5, w: 10, h: 10 } })
    expect(bad).toHaveLength(2)
    expect(bad.join('\n')).toMatch(/left/)
  })
})

describe('исходники кадров', () => {
  // Review Focus 3: кадр — чистая функция номера кадра, состояния и эффектов в нём нет.
  it('frames/*.tsx не содержат useState и useEffect', () => {
    const dir = dirname(fileURLToPath(import.meta.url))
    const files = readdirSync(dir).filter((f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx'))
    expect(files).toEqual(expect.arrayContaining(['Terminal.tsx', 'Editor.tsx', 'Diff.tsx', 'Window.tsx']))
    for (const f of files) {
      const code = readFileSync(resolve(dir, f), 'utf8')
      expect(code, f).not.toMatch(/useState|useEffect/)
    }
  })

  it('набор FRAMES: terminal, editor, diff с полным контрактом', () => {
    expect(Object.keys(FRAMES).sort()).toEqual(['diff', 'editor', 'terminal'])
    for (const def of Object.values(FRAMES)) {
      expect(typeof def.layout).toBe('function')
      expect(typeof def.moments).toBe('function')
      expect(typeof def.problems).toBe('function')
      expect(typeof def.Component).toBe('function')
    }
  })
})

describe('Window', () => {
  const spec: TerminalSpec = { type: 'terminal', items: [{ session: S, event: 'ls', at: 0 }] }

  it('окно появляется за MOTION.appear кадров', () => {
    expect(view('terminal', spec, 0)).toMatch(/data-part="window"[^>]*opacity="0"/)
    expect(view('terminal', spec, MOTION.appear)).toMatch(/data-part="window"[^>]*opacity="1"/)
  })

  it('заголовок — по умолчанию «Терминал», свой title заменяет его; цвет faint, тело term-bg', () => {
    const html = view('terminal', spec, 20)
    expect(plain(html)).toContain('Терминал')
    expect(html).toContain(`fill="${T.termBg}"`)
    expect(plain(view('terminal', { ...spec, title: 'Сервер' }, 20))).toContain('Сервер')
  })

  it('редактор и дифф — тело paper', () => {
    expect(view('editor', { type: 'editor', session: S, event: 'pkg' }, 20)).toContain(`fill="${T.paper}"`)
    expect(view('diff', { type: 'diff', items: [{ session: S, event: 'page', at: 0 }] }, 20)).toContain(`fill="${T.paper}"`)
  })
})

describe('Terminal', () => {
  const T0: TerminalSpec = {
    type: 'terminal',
    items: [
      { session: S, event: 'fail', at: 0 },
      { session: S, event: 'ls', at: 1 },
    ],
  }
  const def = FRAMES.terminal
  const typedEnd = START + 'npm test'.length // 38

  describe('layout', () => {
    const layout = def.layout(T0, ctx)

    it('все части внутри SAFE, frame — окно на весь SAFE', () => {
      expect(layout.frame).toEqual({ x: SAFE.x, y: SAFE.y, w: SAFE.w, h: SAFE.h })
      for (const [name, r] of Object.entries(layout)) expect(inside(r), name).toBe(true)
    })

    it('есть cmd:, out: и line:<событие>:<k>; первая строка вывода ниже команды', () => {
      expect(Object.keys(layout)).toEqual(expect.arrayContaining(['cmd:fail', 'out:fail', 'line:fail:0', 'line:fail:2', 'cmd:ls', 'line:ls:2']))
      expect(layout['line:fail:0'].y).toBeGreaterThan(layout['cmd:fail'].y)
      expect(layout['line:fail:1'].y).toBeGreaterThan(layout['line:fail:0'].y)
      expect(layout['cmd:ls'].y).toBeGreaterThan(layout['line:fail:2'].y)
      expect(layout['out:fail'].h).toBeCloseTo(3 * MONO.line)
    })

    it('строка вывода из 300 знаков занимает ceil(300 / monoChars) строк', () => {
      const long = def.layout({ type: 'terminal', items: [{ session: S, event: 'long', at: 0 }] }, ctx)
      const chars = monoChars(SAFE.w - 2 * WIN.pad)
      expect(chars).toBeGreaterThan(90)
      expect(long['line:long:0'].h / MONO.line).toBe(Math.ceil(300 / chars))
      expect(inside(long['line:long:0'])).toBe(true)
    })

    it('при прокрутке части остаются в окне; у события browser нет cmd:', () => {
      const many = def.layout({ type: 'terminal', items: [{ session: S, event: 'many', at: 0 }] }, ctx)
      expect(inside(many['line:many:39'])).toBe(true)
      expect(many['line:many:39'].y + many['line:many:39'].h).toBeLessThanOrEqual(SAFE.y + SAFE.h)
      const mixed = def.layout({ type: 'terminal', items: [{ session: S, event: 'dev', at: 0 }, { session: S, event: 'save', at: 1, lines: [3, 3] }] }, ctx)
      expect(mixed['cmd:save']).toBeUndefined()
      expect(mixed['line:save:0']).toBeDefined()
      expect(mixed['line:save:0'].y).toBeGreaterThan(mixed['line:dev:2'].y)
    })
  })

  describe('problems', () => {
    const problems = (spec: TerminalSpec, clock: Clock = CLOCK) => def.problems(spec, ctx, clock)

    it('верные данные — без проблем', () => {
      expect(problems(T0)).toEqual([])
      expect(problems({ type: 'terminal', items: [{ session: S, event: 'c1', at: 0 }, { session: S, event: 'dev', at: 2, lines: [2, 3] }] })).toEqual([])
      expect(problems({ type: 'terminal', items: [{ session: S, event: 'dev', at: 0 }, { session: S, event: 'save', at: 1, lines: [3, 3] }] })).toEqual([])
    })

    it('ловит неизвестное событие и сессию', () => {
      expect(problems({ type: 'terminal', items: [{ session: S, event: 'zzz', at: 0 }] }).join('\n')).toMatch(/zzz/)
      expect(problems({ type: 'terminal', items: [{ session: 'нет', event: 'ls', at: 0 }] })).not.toEqual([])
    })

    it('ловит событие другого вида', () => {
      expect(problems({ type: 'terminal', items: [{ session: S, event: 'page', at: 0 }] }).join('\n')).toMatch(/page/)
      expect(problems({ type: 'terminal', items: [{ session: S, event: 'ask', at: 0 }] })).not.toEqual([])
    })

    it('ловит диапазон lines вне вывода: [0, 99] при трёх строках, [3, 2], не целые', () => {
      expect(problems({ type: 'terminal', items: [{ session: S, event: 'ls', at: 0, lines: [0, 99] }] }).join('\n')).toMatch(/lines/)
      expect(problems({ type: 'terminal', items: [{ session: S, event: 'ls', at: 0, lines: [3, 2] }] })).not.toEqual([])
      expect(problems({ type: 'terminal', items: [{ session: S, event: 'ls', at: 0, lines: [1, 3] }] })).toEqual([])
      expect(problems({ type: 'terminal', items: [{ session: S, event: 'ls', at: 0, lines: [2, 4] }] })).not.toEqual([])
    })

    it('ловит реплику, которой нет в сцене, и одно событие дважды', () => {
      expect(problems({ type: 'terminal', items: [{ session: S, event: 'ls', at: 6 }] })).not.toEqual([])
      expect(problems({ type: 'terminal', items: [{ session: S, event: 'ls', at: -1 }] })).not.toEqual([])
      expect(problems({ type: 'terminal', items: [{ session: S, event: 'ls', at: 0 }, { session: S, event: 'ls', at: 1 }] })).not.toEqual([])
    })

    it('ловит вывод, который не успевает появиться до конца сцены', () => {
      expect(problems({ type: 'terminal', items: [{ session: S, event: 'many', at: 0 }] }, SHORT).join('\n')).toMatch(/сцен/)
    })

    it('ловит одну строку вывода, которая и после переноса не помещается в окно', () => {
      expect(problems({ type: 'terminal', items: [{ session: S, event: 'huge', at: 0 }] }).join('\n')).toMatch(/помещается/)
      expect(problems({ type: 'terminal', items: [{ session: S, event: 'long', at: 0 }] })).toEqual([])
    })

    it('прокручиваемое окно не считает длинный вывод проблемой', () => {
      expect(problems({ type: 'terminal', items: [{ session: S, event: 'many', at: 0 }] }, makeClock(3))).toEqual([])
    })
  })

  describe('разметка', () => {
    it('на beat(0) + 3 набрано 3 знака команды', () => {
      const html = view('terminal', T0, START + 3)
      expect(plain(part(html, 'cmd:fail')!)).toBe('~/trainer-app $ npm')
      expect(part(html, 'line:fail:0')).toBeNull()
    })

    it('до начала набора на экране подсказка, после набора — вся команда', () => {
      expect(plain(part(view('terminal', T0, START - 5), 'cmd:fail')!)).toBe('~/trainer-app $ ')
      expect(plain(part(view('terminal', T0, typedEnd), 'cmd:fail')!)).toBe('~/trainer-app $ npm test')
    })

    it('первая строка вывода — через 2 кадра после набора, дальше по строке каждые 2 кадра', () => {
      expect(part(view('terminal', T0, typedEnd + MOTION.stagger - 1), 'line:fail:0')).toBeNull()
      const html = view('terminal', T0, typedEnd + MOTION.stagger)
      expect(plain(part(html, 'line:fail:0')!)).toBe('> trainer-app@0.1.0 test')
      expect(part(html, 'line:fail:1')).toBeNull()
      expect(plain(part(view('terminal', T0, typedEnd + 2 * MOTION.stagger), 'line:fail:1')!)).toBe('✗ 1 тест не прошёл')
    })

    it('следующая команда ждёт конца вывода предыдущей, но не раньше своей реплики', () => {
      expect(plain(part(view('terminal', T0, CLOCK.beat(1) - 1), 'cmd:ls')!)).toBe('~/trainer-app $ ')
      expect(plain(part(view('terminal', T0, CLOCK.beat(1) + 2), 'cmd:ls')!)).toBe('~/trainer-app $ ls')
    })

    it('код выхода ≠ 0 красит последнюю строку вывода в err, остальные нет', () => {
      const html = view('terminal', T0, 400)
      expect(part(html, 'line:fail:2')).toContain(`fill="${T.err}"`)
      expect(part(html, 'line:fail:1')).not.toContain(T.err)
      expect(part(html, 'line:ls:2')).not.toContain(T.err)
    })

    it('commit: команда — cmd события, вывод — out', () => {
      const spec: TerminalSpec = { type: 'terminal', items: [{ session: S, event: 'c1', at: 0 }] }
      const html = view('terminal', spec, 400)
      expect(plain(part(html, 'cmd:c1')!)).toBe('~/trainer-app $ git commit -m "Первое сохранение"')
      expect(plain(part(html, 'line:c1:0')!)).toBe('[main abc1234] Первое сохранение')
      expect(part(html, 'line:c1:1')).not.toBeNull()
    })

    it('browser: строки server без команды и набора, диапазон lines', () => {
      const spec: TerminalSpec = { type: 'terminal', items: [{ session: S, event: 'dev', at: 0 }, { session: S, event: 'save', at: 1, lines: [2, 3] }] }
      const start = CLOCK.beat(1)
      expect(part(view('terminal', spec, start - 1), 'line:save:0')).toBeNull()
      const html = view('terminal', spec, start)
      expect(plain(part(html, 'line:save:0')!)).toBe(' GET / 200 in 120ms')
      expect(part(html, 'line:save:1')).toBeNull()
      expect(html).not.toContain('data-part="cmd:save"')
      expect(plain(part(view('terminal', spec, start + 2), 'line:save:1')!)).toBe(' POST /api/sets 400 in 10ms')
    })

    it('длинная строка переносится: рядов столько, сколько в layout', () => {
      const spec: TerminalSpec = { type: 'terminal', items: [{ session: S, event: 'long', at: 0 }] }
      const html = view('terminal', spec, 400)
      const rows = part(html, 'line:long:0')!.split('<text').length - 1
      expect(rows).toBe(Math.ceil(300 / monoChars(SAFE.w - 2 * WIN.pad)))
      expect(plain(part(html, 'line:long:0')!)).toBe('abcdefghij'.repeat(30))
    })

    it('окно прокручивается: ранние строки уходят, на экране не больше строк, чем помещается', () => {
      const spec: TerminalSpec = { type: 'terminal', items: [{ session: S, event: 'many', at: 0 }] }
      const html = view('terminal', spec, 400, makeClock(3))
      expect(shownLines(html, 'many')).toHaveLength(WIN.rows)
      expect(part(html, 'line:many:39')).not.toBeNull()
      expect(part(html, 'line:many:0')).toBeNull()
      expect(part(html, 'cmd:many')).toBeNull()
      // пока строк мало, видно всё
      expect(part(view('terminal', spec, 60, makeClock(3)), 'cmd:many')).not.toBeNull()
    })

    it('курсор: мигает в ожидании (раз в 16 кадров), виден при наборе, с началом вывода исчезает', () => {
      expect(view('terminal', T0, 5)).toContain('data-part="cursor"')
      expect(view('terminal', T0, 5 + MOTION.blink)).not.toContain('data-part="cursor"')
      expect(view('terminal', T0, START + 3)).toContain('data-part="cursor"')
      expect(view('terminal', T0, typedEnd + 1)).toContain('data-part="cursor"')
      expect(view('terminal', T0, typedEnd + MOTION.stagger)).not.toContain('data-part="cursor"')
    })
  })

  describe('moments', () => {
    it('начало набора, конец набора и каждая строка вывода; по возрастанию, без повторов', () => {
      const m = def.moments(T0, CLOCK, ctx)
      expect(m).toEqual(expect.arrayContaining([START, typedEnd, typedEnd + 2, typedEnd + 4, typedEnd + 6]))
      expect(m).toEqual([...new Set(m)].sort((a, b) => a - b))
      expect(m).toContain(CLOCK.beat(1))
    })
  })
})

describe('Editor', () => {
  const def = FRAMES.editor
  const PAGE: EditorSpec = { type: 'editor', session: S, event: 'page', tree: { session: S, commit: 'c1' } }
  const problems = (spec: EditorSpec, clock: Clock = CLOCK) => def.problems(spec, ctx, clock)

  describe('layout', () => {
    const layout = def.layout(PAGE, ctx)

    it('части frame, tree, code и line:<n> — все внутри SAFE', () => {
      expect(layout.frame).toEqual({ x: SAFE.x, y: SAFE.y, w: SAFE.w, h: SAFE.h })
      expect(Object.keys(layout)).toEqual(expect.arrayContaining(['frame', 'tree', 'code', 'line:1', 'line:8']))
      for (const [name, r] of Object.entries(layout)) expect(inside(r), name).toBe(true)
    })

    it('дерево слева от кода, строки идут сверху вниз', () => {
      expect(layout.tree.x + layout.tree.w).toBeLessThanOrEqual(layout.code.x)
      expect(layout['line:5'].y).toBeGreaterThan(layout['line:4'].y)
      expect(layout['line:1'].y).toBeGreaterThanOrEqual(layout.code.y)
    })

    it('без tree части tree нет, а код занимает окно целиком', () => {
      const bare = def.layout({ type: 'editor', session: S, event: 'page' }, ctx)
      expect(bare.tree).toBeUndefined()
      expect(bare.code.x).toBeLessThan(layout.code.x)
    })

    it('lines — показывает только эти строки файла, номера остаются файловыми', () => {
      const part3 = def.layout({ type: 'editor', session: S, event: 'page', lines: [4, 6] }, ctx)
      expect(Object.keys(part3).filter((k) => k.startsWith('line:')).sort()).toEqual(['line:4', 'line:5', 'line:6'])
    })
  })

  describe('problems', () => {
    it('верные данные — без проблем', () => {
      expect(problems(PAGE)).toEqual([])
      expect(problems({ type: 'editor', session: S, event: 'pkg', lines: [1, 3] })).toEqual([])
      expect(problems({ ...PAGE, typing: { at: 0 }, highlight: [{ at: 1, lines: [4, 5] }] })).toEqual([])
      expect(problems({ ...PAGE, ghost: { at: 0, accept: 1 } })).toEqual([])
    })

    it('ловит неизвестное событие, событие другого вида и дерево не из коммита', () => {
      expect(problems({ type: 'editor', session: S, event: 'zzz' }).join('\n')).toMatch(/zzz/)
      expect(problems({ type: 'editor', session: S, event: 'ls' })).not.toEqual([])
      expect(problems({ ...PAGE, tree: { session: S, commit: 'page' } })).not.toEqual([])
      expect(problems({ ...PAGE, tree: { session: S, commit: 'nope' } })).not.toEqual([])
    })

    it('ловит диапазон lines вне файла', () => {
      expect(problems({ ...PAGE, lines: [0, 99] }).join('\n')).toMatch(/lines/)
      expect(problems({ ...PAGE, lines: [5, 9] })).not.toEqual([])
      expect(problems({ ...PAGE, lines: [6, 5] })).not.toEqual([])
    })

    it('ловит ghost и typing у read', () => {
      const read: EditorSpec = { type: 'editor', session: S, event: 'pkg' }
      expect(problems({ ...read, ghost: { at: 0, accept: 1 } }).join('\n')).toMatch(/ghost/)
      expect(problems({ ...read, typing: { at: 0 } }).join('\n')).toMatch(/typing/)
    })

    it('ловит ghost и typing вместе, accept раньше at, отсутствие новых строк', () => {
      expect(problems({ ...PAGE, typing: { at: 0 }, ghost: { at: 0, accept: 1 } })).not.toEqual([])
      expect(problems({ ...PAGE, ghost: { at: 2, accept: 1 } })).not.toEqual([])
      expect(problems({ ...PAGE, lines: [1, 3], typing: { at: 0 } })).not.toEqual([])
    })

    it('ловит показ больше 18 строк, считая и перенос', () => {
      const big: EditorSpec = { type: 'editor', session: S, event: 'big' }
      expect(problems(big).join('\n')).toMatch(/18/)
      expect(problems({ ...big, lines: [1, 18] })).toEqual([])
      expect(problems({ ...big, lines: [1, 19] })).not.toEqual([])
    })

    it('ловит подсветку вне показанных строк и реплику вне сцены', () => {
      expect(problems({ ...PAGE, highlight: [{ at: 0, lines: [7, 9] }] })).not.toEqual([])
      expect(problems({ ...PAGE, lines: [1, 3], highlight: [{ at: 0, lines: [4, 4] }] })).not.toEqual([])
      expect(problems({ ...PAGE, highlight: [{ at: 9, lines: [4, 4] }] })).not.toEqual([])
    })

    it('ловит набор, который не успевает до конца сцены', () => {
      expect(problems({ ...PAGE, typing: { at: 0 } }, SHORT).join('\n')).toMatch(/сцен/)
    })
  })

  describe('разметка', () => {
    it('дерево: папки свёрнуты, папка выбранного файла раскрыта, файл события выделен', () => {
      const html = view('editor', PAGE, 60)
      const tree = plain(html)
      expect(tree).toContain('public/')
      expect(tree).toContain('api/')
      expect(tree).toContain('README.md')
      expect(tree).not.toContain('a.svg')
      expect(tree).not.toContain('route.ts')
      expect(count(html, 'data-selected="true"')).toBe(1)
      expect(plain(part(html, 'tree:app/page.tsx')!)).toBe('page.tsx')
    })

    it('файл: номера строк и текст из записи; комментарии soft, код ink', () => {
      const html = view('editor', PAGE, 60)
      expect(plain(part(html, 'line:3')!)).toBe('3export default function Page() {')
      expect(part(html, 'line:3')).toContain(`fill="${T.faint}"`)
      expect(part(html, 'line:3')).toContain(`fill="${T.ink}"`)
      expect(part(html, 'line:4')).toContain(`fill="${T.soft}"`)
      expect(plain(part(html, 'line:4')!)).toBe('4  // вес в килограммах')
    })

    it('read показывает text файла без дерева', () => {
      const html = view('editor', { type: 'editor', session: S, event: 'pkg' }, 60)
      expect(plain(part(html, 'line:2')!)).toBe('2  "name": "trainer-app",')
      expect(html).not.toContain('data-selected')
    })

    it('ghost: до accept новые строки faint, после — ink; до at их нет', () => {
      const spec: EditorSpec = { ...PAGE, ghost: { at: 1, accept: 3 } }
      const code = (html: string, n: number) => /<text[^>]*data-role="code"[^>]*>/.exec(part(html, `line:${n}`) ?? '')?.[0] ?? ''
      const before = view('editor', spec, CLOCK.beat(1) - 1)
      expect(part(before, 'line:6')).toBeNull()
      expect(code(before, 5)).toContain(`fill="${T.ink}"`) // старая строка на месте
      const ghost = view('editor', spec, CLOCK.beat(1) + 10)
      expect(code(ghost, 6)).toContain(`fill="${T.faint}"`)
      expect(code(ghost, 7)).toContain(`fill="${T.faint}"`)
      expect(code(ghost, 5)).toContain(`fill="${T.ink}"`)
      const accepted = view('editor', spec, CLOCK.beat(3))
      expect(code(accepted, 6)).toContain(`fill="${T.ink}"`)
      expect(code(accepted, 7)).toContain(`fill="${T.ink}"`)
      expect(code(accepted, 4)).toContain(`fill="${T.soft}"`) // комментарий: обычный цвет — soft
    })

    it('ghost: строки подсказки идут очередью по 2 кадра', () => {
      const spec: EditorSpec = { ...PAGE, ghost: { at: 0, accept: 4 } }
      const at = CLOCK.beat(0)
      expect(part(view('editor', spec, at), 'line:4')).not.toBeNull()
      expect(part(view('editor', spec, at), 'line:6')).toBeNull()
      expect(part(view('editor', spec, at + MOTION.stagger), 'line:6')).not.toBeNull()
      expect(part(view('editor', spec, at + MOTION.stagger), 'line:7')).toBeNull()
      expect(part(view('editor', spec, at + 2 * MOTION.stagger), 'line:7')).not.toBeNull()
    })

    it('typing: новые строки набираются знак за знаком, старые на месте', () => {
      const spec: EditorSpec = { ...PAGE, typing: { at: 1 } }
      const at = CLOCK.beat(1)
      const html = view('editor', spec, at + 3)
      expect(plain(part(html, 'line:4')!)).toBe('4  /') // 3 знака: два пробела отступа и «/»
      expect(part(html, 'line:6')).toBeNull()
      expect(part(html, 'line:5')).not.toBeNull()
      expect(part(view('editor', spec, at - 1), 'line:4')).toBeNull()
      // строка 4 набрана целиком, потом (через кадр «Enter») начинается шестая
      const done4 = at + '  // вес в килограммах'.length
      expect(plain(part(view('editor', spec, done4), 'line:4')!)).toBe('4  // вес в килограммах')
      expect(part(view('editor', spec, done4), 'line:6')).toBeNull()
      expect(part(view('editor', spec, done4 + 1), 'line:6')).not.toBeNull()
      // после конца всё набрано
      expect(plain(part(view('editor', spec, at + 400), 'line:7')!)).toBe('7  return <p>{weight}</p>')
    })

    it('typing нового файла: набирается весь файл', () => {
      const spec: EditorSpec = { type: 'editor', session: S, event: 'route', typing: { at: 0 } }
      expect(plain(part(view('editor', spec, START + 4), 'line:1')!)).toBe('1expo')
      expect(part(view('editor', spec, START + 4), 'line:2')).toBeNull()
    })

    it('highlight: полоса растёт за 9 кадров и остаётся', () => {
      const spec: EditorSpec = { ...PAGE, highlight: [{ at: 1, lines: [4, 5] }] }
      const at = CLOCK.beat(1)
      const width = (frame: number) => {
        const m = /data-part="highlight:0"[^>]*?width="([\d.]+)"/.exec(view('editor', spec, frame))
        return m ? Number(m[1]) : 0
      }
      expect(width(at)).toBe(0)
      expect(width(at + 3)).toBeGreaterThan(0)
      expect(width(at + 3)).toBeLessThan(width(at + MOTION.appear))
      expect(width(at + MOTION.appear)).toBe(width(at + 100))
    })

    it('highlight стоит под строками 4–5 (по высоте — две строки)', () => {
      const spec: EditorSpec = { ...PAGE, highlight: [{ at: 0, lines: [4, 5] }] }
      const html = view('editor', spec, CLOCK.beat(0) + 100)
      const band = /data-part="highlight:0"[^>]*?y="([\d.]+)"[^>]*?height="([\d.]+)"/.exec(html)!
      const lay = def.layout(spec, ctx)
      expect(Number(band[1])).toBeCloseTo(lay['line:4'].y)
      expect(Number(band[2])).toBeCloseTo(2 * MONO.line)
    })
  })

  describe('moments', () => {
    it('ghost: каждая строка и accept; typing: начало, строки и конец набора; highlight: at', () => {
      const ghost = def.moments({ ...PAGE, ghost: { at: 1, accept: 3 } }, CLOCK, ctx)
      expect(ghost).toEqual(expect.arrayContaining([CLOCK.beat(1), CLOCK.beat(1) + 2, CLOCK.beat(1) + 4, CLOCK.beat(3)]))
      const typing = def.moments({ ...PAGE, typing: { at: 0 }, highlight: [{ at: 2, lines: [4, 4] }] }, CLOCK, ctx)
      const total = ['  // вес в килограммах'.length, "  const [error, setError] = useState('')".length, '  return <p>{weight}</p>'.length]
      expect(typing).toContain(START)
      expect(typing).toContain(START + total[0] + 1) // началась вторая новая строка
      expect(typing).toContain(START + total[0] + 1 + total[1] + 1 + total[2]) // конец набора
      expect(typing).toContain(CLOCK.beat(2))
      expect(typing).toEqual([...new Set(typing)].sort((a, b) => a - b))
    })
  })
})

describe('Diff', () => {
  const def = FRAMES.diff
  const ONE: DiffSpec = { type: 'diff', items: [{ session: S, event: 'page', at: 0 }] }
  const TWO: DiffSpec = { type: 'diff', items: [{ session: S, event: 'page', at: 0 }, { session: S, event: 'route', at: 1 }] }
  const problems = (spec: DiffSpec, clock: Clock = CLOCK) => def.problems(spec, ctx, clock)

  describe('layout', () => {
    it('frame, file:<событие> и line:<событие>:<k> — внутри SAFE, строки идут сверху вниз', () => {
      const layout = def.layout(TWO, ctx)
      expect(layout.frame).toEqual({ x: SAFE.x, y: SAFE.y, w: SAFE.w, h: SAFE.h })
      expect(Object.keys(layout)).toEqual(expect.arrayContaining(['file:page', 'line:page:0', 'line:page:9', 'file:route', 'line:route:4']))
      expect(layout['line:page:10']).toBeUndefined() // в диффе десять строк после git-шапки
      for (const [name, r] of Object.entries(layout)) expect(inside(r), name).toBe(true)
      expect(layout['line:page:1'].y).toBeGreaterThan(layout['line:page:0'].y)
      expect(layout['file:route'].y).toBeGreaterThan(layout['file:page'].y)
      expect(layout['line:page:0'].y).toBeGreaterThan(layout['file:page'].y)
    })

    it('lines — показывает только эти строки диффа, k считается от нуля среди показанных', () => {
      const layout = def.layout({ type: 'diff', items: [{ session: S, event: 'page', at: 0, lines: [5, 8] }] }, ctx)
      expect(Object.keys(layout).filter((k) => k.startsWith('line:')).sort()).toEqual(['line:page:0', 'line:page:1', 'line:page:2', 'line:page:3'])
    })
  })

  describe('problems', () => {
    it('верные данные — без проблем, ровно 18 строк с заголовком — помещается', () => {
      expect(problems(ONE)).toEqual([])
      expect(problems(TWO)).toEqual([])
      expect(problems({ type: 'diff', items: [{ session: S, event: 'wide', at: 0, lines: [1, 18] }] })).toEqual([])
    })

    it('ловит неизвестное событие, событие другого вида, диапазон вне диффа', () => {
      expect(problems({ type: 'diff', items: [{ session: S, event: 'zzz', at: 0 }] }).join('\n')).toMatch(/zzz/)
      expect(problems({ type: 'diff', items: [{ session: S, event: 'ls', at: 0 }] })).not.toEqual([])
      expect(problems({ type: 'diff', items: [{ session: S, event: 'page', at: 0, lines: [0, 99] }] }).join('\n')).toMatch(/lines/)
      expect(problems({ type: 'diff', items: [{ session: S, event: 'page', at: 0, lines: [1, 11] }] })).not.toEqual([])
    })

    it('ловит показ больше 18 строк (заголовок файла в окне — ещё одна строка)', () => {
      expect(problems({ type: 'diff', items: [{ session: S, event: 'wide', at: 0 }] }).join('\n')).toMatch(/18/)
      expect(problems({ type: 'diff', items: [{ session: S, event: 'wide', at: 0, lines: [1, 19] }] })).not.toEqual([])
    })

    it('ловит подсветку чужого события и строк вне показанных', () => {
      expect(problems({ ...ONE, highlight: [{ at: 1, event: 'page', lines: [5, 6] }] })).toEqual([])
      expect(problems({ ...ONE, highlight: [{ at: 1, event: 'route', lines: [1, 1] }] })).not.toEqual([])
      expect(problems({ ...ONE, highlight: [{ at: 1, event: 'page', lines: [9, 12] }] })).not.toEqual([])
      expect(problems({ type: 'diff', items: [{ session: S, event: 'page', at: 0, lines: [1, 4] }], highlight: [{ at: 1, event: 'page', lines: [5, 5] }] })).not.toEqual([])
    })

    it('ловит реплику вне сцены, событие дважды и строки, не успевающие до конца сцены', () => {
      expect(problems({ type: 'diff', items: [{ session: S, event: 'page', at: 7 }] })).not.toEqual([])
      expect(problems({ type: 'diff', items: [{ session: S, event: 'page', at: 0 }, { session: S, event: 'page', at: 1 }] })).not.toEqual([])
      expect(problems({ type: 'diff', items: [{ session: S, event: 'wide', at: 0, lines: [1, 18] }] }, SHORT).join('\n')).toMatch(/сцен/)
    })
  })

  describe('разметка', () => {
    it('заголовок: путь и «+N −M» из диффа (тут +3 −1), независимо от показанного диапазона', () => {
      const header = plain(part(view('diff', ONE, 100), 'file:page')!)
      expect(header).toContain('app/page.tsx')
      expect(header).toContain('+3 −1')
      const ranged = plain(part(view('diff', { type: 'diff', items: [{ session: S, event: 'page', at: 0, lines: [5, 5] }] }, 100), 'file:page')!)
      expect(ranged).toContain('+3 −1')
    })

    it('строки + на заливке ok 16 %, строки − на err 14 %, знак — цвета заливки, контекст soft', () => {
      const html = view('diff', ONE, 300)
      expect(count(html, alpha(T.ok, 0.16))).toBe(3)
      expect(count(html, alpha(T.err, 0.14))).toBe(1)
      const add = part(html, 'line:page:4')! // «+  // вес в килограммах»
      expect(add).toContain(`fill="${T.ok}"`)
      expect(add).toContain(`fill="${T.ink}"`)
      expect(plain(add)).toBe('+  // вес в килограммах')
      const del = part(html, 'line:page:6')!
      expect(del).toContain(`fill="${T.err}"`)
      expect(plain(del)).toBe('-  return null')
      const ctxLine = part(html, 'line:page:3')!
      expect(ctxLine).toContain(`fill="${T.soft}"`)
      expect(plain(ctxLine)).toBe(" export default function Page() {")
      expect(plain(part(html, 'line:page:0')!)).toBe('@@ -1,6 +1,8 @@')
    })

    it('строки появляются очередью: заголовок сразу, строка k — через 2·(k+1) кадра', () => {
      const at = CLOCK.beat(0)
      const first = view('diff', ONE, at + 1)
      expect(first).toContain('data-part="file:page"')
      expect(shownLines(first, 'page')).toEqual([])
      expect(shownLines(view('diff', ONE, at + 2), 'page')).toEqual([0])
      expect(shownLines(view('diff', ONE, at + 3), 'page')).toEqual([0])
      expect(shownLines(view('diff', ONE, at + 4), 'page')).toEqual([0, 1])
      expect(shownLines(view('diff', ONE, at + 100), 'page')).toHaveLength(10)
    })

    it('второй файл начинается на своей реплике', () => {
      expect(view('diff', TWO, CLOCK.beat(1) - 1)).not.toContain('data-part="file:route"')
      expect(view('diff', TWO, CLOCK.beat(1))).toContain('data-part="file:route"')
    })

    it('highlight: полоса на строках диффа растёт за 9 кадров', () => {
      const spec: DiffSpec = { ...ONE, highlight: [{ at: 1, event: 'page', lines: [5, 6] }] }
      const at = CLOCK.beat(1)
      const width = (frame: number) => {
        const m = /data-part="highlight:0"[^>]*?width="([\d.]+)"/.exec(view('diff', spec, frame))
        return m ? Number(m[1]) : 0
      }
      expect(width(at)).toBe(0)
      expect(width(at + 3)).toBeGreaterThan(0)
      expect(width(at + 3)).toBeLessThan(width(at + MOTION.appear))
    })
  })

  describe('moments', () => {
    it('заголовок, каждая строка и подсветка', () => {
      const m = def.moments({ ...ONE, highlight: [{ at: 2, event: 'page', lines: [5, 5] }] }, CLOCK, ctx)
      const at = CLOCK.beat(0)
      expect(m).toEqual(expect.arrayContaining([at, at + 2, at + 4, at + 20, CLOCK.beat(2)]))
      expect(m).toEqual([...new Set(m)].sort((a, b) => a - b))
    })
  })
})

describe('размер текста', () => {
  const specs: FrameSpec[] = [
    { type: 'terminal', items: [{ session: S, event: 'fail', at: 0 }, { session: S, event: 'long', at: 1 }] },
    { type: 'editor', session: S, event: 'page', tree: { session: S, commit: 'c1' }, typing: { at: 0 }, highlight: [{ at: 1, lines: [4, 5] }] },
    { type: 'diff', items: [{ session: S, event: 'page', at: 0 }, { session: S, event: 'route', at: 1 }], highlight: [{ at: 2, event: 'page', lines: [5, 6] }] },
  ]

  it('все font-size в разметке не меньше 24', () => {
    for (const spec of specs) {
      for (const frame of [0, 33, 60, 130, 200, 400]) {
        const sizes = fontSizes(view(spec.type, spec as never, frame))
        expect(sizes.length, `${spec.type} @${frame}`).toBeGreaterThan(0)
        expect(Math.min(...sizes), `${spec.type} @${frame}`).toBeGreaterThanOrEqual(MIN_TEXT)
      }
    }
  })
})
