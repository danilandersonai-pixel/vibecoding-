import { readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { render } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

// Кадр, который «видят» компоненты кадров, задаёт тест (приём из frames.test.tsx).
const now = vi.hoisted(() => ({ frame: 0 }))
vi.mock('remotion', async (importOriginal) => ({ ...(await importOriginal<typeof import('remotion')>()), useCurrentFrame: () => now.frame }))

import { makeFind } from '../../sessions/types'
import type { AgentEvent, BrowserEvent } from '../../sessions/types'
import type { Clock, FrameCtx, Rect } from '../frame'
import { easeOut } from '../motion'
import { textWidth, wrapText } from '../text'
import { alpha, MIN_TEXT, MOTION, SAFE, T } from '../theme'
import { CLOCK, ctx, FIXTURE, makeClock } from './fixture'
import { wrapWords } from './geometry'
import { consoleText } from './source'
import { FRAMES, frameDef } from './index'
import type { AgentSpec, BrowserSpec, FrameSpec, GitLogSpec } from './index'

const S = 'fixture'
const START = CLOCK.beat(0) // 30
// Сцена, которая кончается раньше, чем что-либо успевает появиться целиком.
const SHORT: Clock = { beat: (i) => 30 + i * 90, duration: 50, lines: 6 }

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

const count = (html: string, needle: string) => html.split(needle).length - 1
const number = (html: string, re: RegExp) => Number(re.exec(html)?.[1] ?? NaN)

// Все размеры шрифта в разметке: атрибут font-size, свойство font-size и сокращение font.
function fontSizes(html: string): number[] {
  return [
    ...[...html.matchAll(/font-size="([\d.]+)"/g)].map((m) => Number(m[1])),
    ...[...html.matchAll(/font-size:\s*([\d.]+)px/g)].map((m) => Number(m[1])),
    ...[...html.matchAll(/font:\s*(?:\d+\s+)?([\d.]+)px/g)].map((m) => Number(m[1])),
  ]
}

const inside = (r: Rect) => r.x >= SAFE.x - 0.01 && r.y >= SAFE.y - 0.01 && r.x + r.w <= SAFE.x + SAFE.w + 0.01 && r.y + r.h <= SAFE.y + SAFE.h + 0.01
const below = (a: Rect, b: Rect) => a.y >= b.y + b.h - 0.01 // a целиком ниже b

afterEach(() => {
  now.frame = 0
})

describe('набор кадров', () => {
  it('в FRAMES кадры записей (шесть) и кадры без записей (четыре) с полным контрактом', () => {
    expect(Object.keys(FRAMES).sort()).toEqual(['agenda', 'agent', 'board', 'browser', 'diff', 'editor', 'figure', 'gitlog', 'recap', 'terminal'])
    for (const type of ['agent', 'gitlog', 'browser'] as const) {
      const def = FRAMES[type]
      expect(typeof def.layout).toBe('function')
      expect(typeof def.moments).toBe('function')
      expect(typeof def.problems).toBe('function')
      expect(typeof def.Component).toBe('function')
    }
  })

  it('frameDef возвращает описание кадра по типу спеки', () => {
    expect(frameDef({ type: 'agent', session: S, event: 'ag', at: { prompt: 0, steps: [], reply: 1 } })).toBe(FRAMES.agent)
    expect(frameDef({ type: 'gitlog', rows: [] })).toBe(FRAMES.gitlog)
    expect(frameDef({ type: 'browser', session: S, event: 'form', at: { page: 0 } })).toBe(FRAMES.browser)
  })

  it('Agent.tsx, GitLog.tsx и Browser.tsx на месте и без useState и useEffect', () => {
    const dir = dirname(fileURLToPath(import.meta.url))
    const files = readdirSync(dir).filter((f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx'))
    expect(files).toEqual(expect.arrayContaining(['Agent.tsx', 'GitLog.tsx', 'Browser.tsx']))
    for (const f of files) expect(readFileSync(resolve(dir, f), 'utf8'), f).not.toMatch(/useState|useEffect/)
  })
})

describe('wrapWords', () => {
  it('переносит по словам; пробел на месте переноса не показывается, from — номер знака в исходном тексте', () => {
    expect(wrapWords('один два три', 7)).toEqual([
      { text: 'один', from: 0 },
      { text: 'два три', from: 5 },
    ])
    expect(wrapWords('один два три четыре', 8)).toEqual([
      { text: 'один два', from: 0 },
      { text: 'три', from: 9 },
      { text: 'четыре', from: 13 },
    ])
  })

  it('слово ровно в ширину строки остаётся в ней, пробел после него уходит', () => {
    expect(wrapWords('abcd efgh', 4)).toEqual([
      { text: 'abcd', from: 0 },
      { text: 'efgh', from: 5 },
    ])
  })

  it('слово длиннее строки режется по знакам', () => {
    expect(wrapWords('абвгдежз ий', 4)).toEqual([
      { text: 'абвг', from: 0 },
      { text: 'дежз', from: 4 },
      { text: 'ий', from: 9 },
    ])
  })

  it('короткий текст — одна строка, пустой — одна пустая, перевод строки считается пробелом', () => {
    expect(wrapWords('коротко', 20)).toEqual([{ text: 'коротко', from: 0 }])
    expect(wrapWords('', 20)).toEqual([{ text: '', from: 0 }])
    expect(wrapWords('раз\nдва', 4)).toEqual([
      { text: 'раз', from: 0 },
      { text: 'два', from: 4 },
    ])
  })

  it('знаки считаются по Unicode, а все строки не длиннее cols', () => {
    expect(wrapWords('😀😀😀 😀😀', 3)).toEqual([
      { text: '😀😀😀', from: 0 },
      { text: '😀😀', from: 4 },
    ])
    const text = 'Я делаю приложение для тренеров в зале: тренер ведёт подопечных и видит их прогресс, подопечный записывает тренировки.'
    for (const cols of [10, 12, 17, 30, 96]) {
      const rows = wrapWords(text, cols)
      for (const r of rows) expect([...r.text].length).toBeLessThanOrEqual(cols)
    }
    // самое длинное слово — 11 знаков, при cols ≥ 12 ничего не режется и не теряется, кроме пробелов на переносах
    for (const cols of [12, 17, 30, 96]) expect(wrapWords(text, cols).map((r) => r.text).join(' ')).toBe(text)
  })
})

describe('Agent', () => {
  const def = FRAMES.agent
  // Пять шагов: чтение, две правки, команда с вопросом, коммит без вопроса. Подряд по два диффа — только короткими.
  const AG: AgentSpec = { type: 'agent', session: S, event: 'ag', mode: 'Manual', ask: ['fail'], diffLines: 2, at: { prompt: 0, steps: [1, 1, 2, 2, 3], reply: 4 } }
  const CHAT: AgentSpec = { type: 'agent', session: S, event: 'ag', chat: true, at: { prompt: 0, steps: [], reply: 1 } }
  const problems = (spec: AgentSpec, clock: Clock = CLOCK, c: FrameCtx = ctx) => def.problems(spec, c, clock)

  // Кадры сцены AG (запрос набран за 36 кадров): набор кончается на 66, шаги на 120, 122, 210, 216 (вопрос), 300 (коммит), ответ «y» на 234, ответ агента на 390.
  const TYPED = START + 36
  const END = 520

  describe('layout', () => {
    const layout = def.layout(AG, ctx)

    it('части frame, prompt, step:<id>, reply, mode — все внутри SAFE', () => {
      expect(layout.frame).toEqual({ x: SAFE.x, y: SAFE.y, w: SAFE.w, h: SAFE.h })
      expect(Object.keys(layout).sort()).toEqual(['frame', 'mode', 'prompt', 'reply', 'step:c2', 'step:fail', 'step:page', 'step:rd-page', 'step:route'])
      for (const [name, r] of Object.entries(layout)) expect(inside(r), name).toBe(true)
    })

    it('запрос, шаги по порядку, ответ и режим идут сверху вниз без наложения', () => {
      const order = ['prompt', 'step:rd-page', 'step:route', 'step:page', 'step:fail', 'step:c2', 'reply', 'mode']
      for (let i = 1; i < order.length; i++) expect(below(layout[order[i]], layout[order[i - 1]]), `${order[i]} под ${order[i - 1]}`).toBe(true)
    })

    it('шаг с диффом выше шага без дифф: Edited + 2 строки диффа = 3 строки окна, Reading = 1', () => {
      expect(layout['step:rd-page'].h).toBeCloseTo(36)
      expect(layout['step:route'].h).toBeCloseTo(3 * 36)
      expect(layout['step:fail'].h).toBeCloseTo(4 * 36) // вопрос и три строки вывода
    })

    it('без mode части mode нет, а ответ может опуститься ниже', () => {
      const bare = def.layout({ ...AG, mode: undefined }, ctx)
      expect(bare.mode).toBeUndefined()
    })

    it('chat: нет шагов и ответа агента, есть code; запрос → код', () => {
      const chat = def.layout(CHAT, ctx)
      expect(Object.keys(chat).sort()).toEqual(['code', 'frame', 'prompt'])
      expect(below(chat.code, chat.prompt)).toBe(true)
      for (const r of Object.values(chat)) expect(inside(r)).toBe(true)
    })
  })

  describe('problems', () => {
    it('верные данные — без проблем', () => {
      expect(problems(AG)).toEqual([])
      expect(problems(CHAT)).toEqual([])
      expect(problems({ ...AG, mode: 'Plan' })).toEqual([])
    })

    it('ловит неизвестное событие и событие другого вида', () => {
      expect(problems({ ...AG, event: 'zzz' }).join('\n')).toMatch(/zzz/)
      expect(problems({ ...AG, event: 'ls' })).not.toEqual([])
    })

    it('ловит несовпадение числа шагов с записью', () => {
      expect(problems({ ...AG, at: { ...AG.at, steps: [1, 1, 2] } }).join('\n')).toMatch(/шаг/)
      expect(problems({ ...AG, at: { ...AG.at, steps: [1, 1, 2, 2, 3, 3] } }).join('\n')).toMatch(/5/)
    })

    it('ловит неизвестный id в ask и вопрос у шага, который не команда', () => {
      expect(problems({ ...AG, ask: ['fail', 'nope'] }).join('\n')).toMatch(/nope/)
      expect(problems({ ...AG, ask: ['rd-page'] }).join('\n')).toMatch(/rd-page/)
      expect(problems({ ...AG, ask: ['c2', 'fail'] })).toEqual([])
    })

    it('ловит реплику вне сцены и реплики не по порядку', () => {
      expect(problems({ ...AG, at: { ...AG.at, reply: 9 } })).not.toEqual([])
      expect(problems({ ...AG, at: { prompt: 2, steps: [1, 1, 2, 2, 3], reply: 4 } }).join('\n')).toMatch(/порядк/)
      expect(problems({ ...AG, at: { ...AG.at, reply: 2 } }).join('\n')).toMatch(/порядк/)
    })

    it('ловит diffLines, которых нет среди целых от нуля', () => {
      expect(problems({ ...AG, diffLines: -1 })).not.toEqual([])
      expect(problems({ ...AG, diffLines: 1.5 })).not.toEqual([])
      expect(problems({ ...AG, diffLines: 0 })).toEqual([])
    })

    it('diffLines по шагам: { id шага: строк } — у каждого шага своё число, у остальных по умолчанию 6; неверные — проблема', () => {
      const own: AgentSpec = { ...AG, diffLines: { route: 0, page: 3, 'rd-page': 0, fail: 0, c2: 0 } }
      expect(problems(own)).toEqual([])
      const layout = def.layout(own, ctx)
      expect(layout['step:route'].h).toBeCloseTo(36) // только «Edited …»
      expect(layout['step:page'].h).toBeCloseTo(4 * 36) // «Edited …» и три строки диффа
      // шаг, которого нет в записи, и неверное число — проблема
      expect(problems({ ...AG, diffLines: { nope: 1 } }).join('\n')).toMatch(/diffLines.*nope/)
      expect(problems({ ...AG, diffLines: { route: -2 } }).join('\n')).toMatch(/diffLines.*route/)
      // не указанный шаг — по умолчанию шесть строк: page целиком (10) не помещается вместе с остальными
      expect(problems({ ...AG, diffLines: { route: 0 } }).join('\n')).toMatch(/помещается/)
    })

    it('outLines: у шага-команды — только выбранные строки вывода, скрытые выше и ниже — строкой «…»; неверные — проблема', () => {
      // fail — npm test с тремя строками вывода и кодом 1: вопрос и строки 2–2 → «…», строка 2, «…» (4 строки окна вместо 4 без outLines)
      const one: AgentSpec = { ...AG, outLines: { fail: [2, 2] } }
      expect(problems(one)).toEqual([])
      expect(def.layout(one, ctx)['step:fail'].h).toBeCloseTo(4 * 36)
      // «…» и над строкой 2 (скрыта строка 1), и под ней (скрыта строка 3)
      const mid = plain(part(view(one, END), 'step:fail') ?? '')
      const shown = mid.indexOf('✗ 1 тест не прошёл')
      expect(shown).toBeGreaterThan(-1)
      expect(mid.indexOf('…')).toBeGreaterThan(-1)
      expect(mid.indexOf('…')).toBeLessThan(shown)
      expect(mid.lastIndexOf('…')).toBeGreaterThan(shown)
      expect(mid).not.toContain('> trainer-app@0.1.0 test')
      expect(mid).not.toContain('вес должен быть числом')
      const tail: AgentSpec = { ...AG, outLines: { fail: [1, 1] } }
      expect(def.layout(tail, ctx)['step:fail'].h).toBeCloseTo(3 * 36) // вопрос, строка 1 и «…» под ней
      const html = view(tail, END)
      const fail = plain(part(html, 'step:fail') ?? '')
      expect(fail).toContain('> trainer-app@0.1.0 test')
      expect(fail).toContain('…')
      expect(fail).not.toContain('вес должен быть числом')
      // код ≠ 0: цвета err последняя показанная строка, а не последняя строка вывода
      expect(part(html, 'step:fail')).toContain(T.err)
      // шаг не из записи, шаг не команда, диапазон вне вывода, outLines у чата — проблема
      expect(problems({ ...AG, outLines: { nope: [1, 1] } }).join('\n')).toMatch(/outLines.*nope/)
      expect(problems({ ...AG, outLines: { route: [1, 1] } }).join('\n')).toMatch(/outLines.*route/)
      expect(problems({ ...AG, outLines: { fail: [2, 9] } }).join('\n')).toMatch(/outLines «fail»/)
      expect(problems({ ...CHAT, outLines: { fail: [1, 1] } }).join('\n')).toMatch(/outLines/)
      // без outLines — весь вывод, как раньше
      expect(def.layout(AG, ctx)['step:fail'].h).toBeCloseTo(4 * 36)
    })

    it('ловит текст, который не помещается в окно: по умолчанию шесть строк диффа у каждого файла — слишком много', () => {
      expect(problems({ ...AG, diffLines: undefined }).join('\n')).toMatch(/помещается/)
      expect(problems({ ...AG, mode: undefined, diffLines: 3 })).toEqual([])
    })

    it('режим занимает нижнюю строку окна: без режима помещается строкой больше', () => {
      const tight: AgentSpec = { ...AG, diffLines: 3 }
      expect(problems({ ...tight, mode: undefined })).toEqual([])
      expect(problems(tight).join('\n')).toMatch(/помещается/)
    })

    it('ловит то, что не успевает до конца сцены', () => {
      expect(problems(AG, SHORT).join('\n')).toMatch(/сцен/)
    })

    it('chat: код берётся только у нового файла — если первый file правит существующий, это проблема', () => {
      // у события ask единственный шаг — правка app/page.tsx (before ≠ null)
      const edit: AgentSpec = { type: 'agent', session: S, event: 'ask', chat: true, at: { prompt: 0, steps: [], reply: 1 } }
      expect(problems(edit).join('\n')).toMatch(/только нового файла/)
      expect(problems(CHAT)).toEqual([]) // первый file — route.ts, новый
    })

    it('chat: шаг file обязателен; ask в chat не нужен', () => {
      const noFile: AgentEvent = { id: 'nf', kind: 'agent', prompt: 'Что в пакете?', reply: 'Ничего особенного', steps: ['pkg'] }
      const c2 = { ...ctx, find: makeFind([{ ...FIXTURE, events: [...FIXTURE.events, noFile] }]) }
      expect(problems({ ...CHAT, event: 'nf' }, CLOCK, c2).join('\n')).toMatch(/file/)
      expect(problems({ ...CHAT, event: 'nf', chat: false, at: { prompt: 0, steps: [1], reply: 2 } }, CLOCK, c2)).toEqual([])
    })

    it('шаг записи другого вида (агент в агенте) — проблема', () => {
      const nested: AgentEvent = { id: 'nest', kind: 'agent', prompt: 'x', reply: 'y', steps: ['ask'] }
      const c2 = { ...ctx, find: makeFind([{ ...FIXTURE, events: [...FIXTURE.events, nested] }]) }
      expect(problems({ ...AG, event: 'nest', at: { prompt: 0, steps: [1], reply: 2 } }, CLOCK, c2).join('\n')).toMatch(/ask/)
    })
  })

  describe('разметка', () => {
    it('заголовок окна — «Claude Code», тело терминала', () => {
      const html = view(AG, 20)
      expect(plain(html)).toContain('Claude Code')
      expect(html).toContain(`fill="${T.termBg}"`)
    })

    it('chat: заголовок окна — «Чат с ИИ», не «Claude Code»', () => {
      expect(plain(view(CHAT, 20))).toContain('Чат с ИИ')
      expect(plain(view(CHAT, 20))).not.toContain('Claude Code')
      // и пока записи нет — тоже
      expect(plain(view({ ...CHAT, event: 'zzz' }, 20))).toContain('Чат с ИИ')
      expect(plain(view({ ...AG, event: 'zzz' }, 20))).toContain('Claude Code')
    })

    it('запрос в рамке `> …` набирается знак за знаком (30 в секунду), до набора — одна «>»', () => {
      expect(plain(part(view(AG, START - 1), 'prompt')!)).toBe('>')
      expect(plain(part(view(AG, START + 5), 'prompt')!)).toBe('>Добав')
      expect(plain(part(view(AG, TYPED), 'prompt')!)).toBe('>Добавь проверку веса в форму подхода')
      expect(part(view(AG, START + 5), 'prompt')).toContain(`stroke="${T.line}"`)
    })

    it('длинный запрос переносится по словам и набирается по строкам', () => {
      const long = 'слово '.repeat(40).trim() // 239 знаков
      const nl: AgentEvent = { id: 'long-ask', kind: 'agent', prompt: long, reply: 'Готово', steps: [] }
      const c2 = { ...ctx, find: makeFind([{ ...FIXTURE, events: [...FIXTURE.events, nl] }]) }
      const spec: AgentSpec = { type: 'agent', session: S, event: 'long-ask', at: { prompt: 0, steps: [], reply: 1 } }
      const clock = makeClock(10)
      const html = view(spec, START + 239 + 5, clock, c2)
      const rows = part(html, 'prompt')!.split('<text').length - 1
      expect(rows).toBe(1 + 3) // «>» и три строки текста
      expect(plain(part(html, 'prompt')!).replace('>', '').replace(/ /g, '')).toBe(long.replace(/ /g, ''))
      expect(def.problems(spec, c2, clock)).toEqual([])
      // рамка растёт вместе с текстом: к началу набора — одна строка
      const h = (frame: number) => number(part(view(spec, frame, clock, c2), 'prompt')!, /<rect[^>]*? height="([\d.]+)"/)
      expect(h(START + 3)).toBeLessThan(h(START + 239 + 5))
    })

    it('курсор: горит при наборе, потом мигает, с началом шагов исчезает', () => {
      expect(view(AG, START + 5)).toContain('data-part="cursor"')
      expect(view(AG, TYPED + 1)).toContain('data-part="cursor"')
      expect(view(AG, TYPED + 1 + MOTION.blink)).not.toContain('data-part="cursor"')
      expect(view(AG, 130)).not.toContain('data-part="cursor"')
    })

    it('строки шагов как на схеме книги: Reading, Edited (+N −M), Run "…"? [y / n]', () => {
      const html = view(AG, END)
      expect(plain(part(html, 'step:rd-page')!)).toBe('Reading app/page.tsx')
      expect(part(html, 'step:rd-page')).toContain(`fill="${T.faint}"`)
      const route = plain(part(html, 'step:route')!)
      expect(route.startsWith('Edited app/api/sets/route.ts (+4 −0)')).toBe(true)
      expect(part(html, 'step:route')).toContain(`fill="${T.ok}"`)
      expect(plain(part(html, 'step:page')!).startsWith('Edited app/page.tsx (+3 −1)')).toBe(true)
      expect(plain(part(html, 'step:fail')!).startsWith('Run "npm test"? [y / n]')).toBe(true)
      expect(part(html, 'step:fail')).toContain(`fill="${T.warn}"`)
    })

    it('«Run …? [y / n]» только у шага из ask; у остальных команд — сама команда', () => {
      const html = view(AG, END)
      expect(count(plain(html), 'Run ')).toBe(1)
      expect(plain(part(html, 'step:c2')!)).toContain('$ git commit -m "Проверка веса"')
      expect(plain(part(html, 'step:c2')!)).toContain('[main bcd2345] Проверка веса')
      const both = view({ ...AG, ask: ['fail', 'c2'] }, END)
      expect(count(plain(both), 'Run ')).toBe(2)
      expect(count(plain(view({ ...AG, ask: [] }, END)), 'Run ')).toBe(0)
    })

    it('кавычки вопроса: прямые, как в книге, а если в команде есть «"» — внешние «ёлочки»', () => {
      const both = view({ ...AG, ask: ['fail', 'c2'] }, END)
      // у `npm test` кавычек нет — прямые
      expect(plain(part(both, 'step:fail')!).startsWith('Run "npm test"? [y / n]')).toBe(true)
      // у коммита внутри свои кавычки — внешние «»
      expect(plain(part(both, 'step:c2')!).startsWith('Run «git commit -m "Проверка веса"»? [y / n]')).toBe(true)
      expect(plain(part(both, 'step:c2')!)).not.toContain('""')
    })

    it('ответ «y» — на той же строке через MOTION.move кадров после вопроса; вывод — после ответа', () => {
      // вопрос на 216 (после диффа page), ответ на 234, вывод на 236, 238, 240
      expect(part(view(AG, 215), 'step:fail')).toBeNull()
      const asked = part(view(AG, 216), 'step:fail')!
      expect(plain(asked)).toBe('Run "npm test"? [y / n]')
      expect(asked).not.toContain('data-role="answer"')
      expect(part(view(AG, 216 + MOTION.move - 1), 'step:fail')).not.toContain('data-role="answer"')
      const answered = part(view(AG, 216 + MOTION.move), 'step:fail')!
      expect(answered).toContain('data-role="answer"')
      expect(plain(answered)).toBe('Run "npm test"? [y / n]y')
      expect(plain(part(view(AG, 236), 'step:fail')!)).toContain('> trainer-app@0.1.0 test')
      expect(plain(part(view(AG, 238), 'step:fail')!)).not.toContain('Ошибка')
      expect(plain(part(view(AG, 240), 'step:fail')!)).toContain('Ошибка: вес должен быть числом')
    })

    it('код выхода ≠ 0 красит последнюю строку вывода в err', () => {
      const fail = part(view(AG, END), 'step:fail')!
      const outs = [...fail.matchAll(/<text[^>]*data-role="out"[^>]*>/g)].map((m) => m[0])
      expect(outs).toHaveLength(3)
      expect(outs[2]).toContain(`fill="${T.err}"`)
      expect(outs[0]).not.toContain(T.err)
    })

    it('шаги появляются на своих репликах и не раньше конца набора запроса', () => {
      expect(part(view(AG, 119), 'step:rd-page')).toBeNull()
      expect(part(view(AG, 120), 'step:rd-page')).not.toBeNull()
      expect(part(view(AG, 121), 'step:route')).toBeNull() // ждёт, пока кончится Reading
      expect(part(view(AG, 122), 'step:route')).not.toBeNull()
      // запрос длиннее паузы до шага: шаг ждёт конца набора
      const slow: AgentSpec = { ...AG, at: { prompt: 0, steps: [0, 0, 0, 0, 0], reply: 1 } }
      expect(part(view(slow, TYPED), 'step:rd-page')).toBeNull()
      expect(part(view(slow, TYPED + MOTION.stagger), 'step:rd-page')).not.toBeNull()
    })

    it('дифф под Edited: строки диффа с заливкой, как в Diff; diffLines по умолчанию 6', () => {
      const html = view(AG, END)
      expect(count(html, alpha(T.ok, 0.16))).toBe(1) // у route в двух строках диффа одна новая
      const route = part(html, 'step:route')!
      expect(plain(route)).toContain('@@ -0,0 +1,4 @@')
      expect(route).toContain(`fill="${T.faint}"`) // @@ — faint
      const ask: AgentSpec = { type: 'agent', session: S, event: 'ask', at: { prompt: 0, steps: [1], reply: 2 } }
      const rows = (spec: AgentSpec) => count(view(spec, END), 'data-role="diff"')
      expect(rows(ask)).toBe(6)
      expect(rows({ ...ask, diffLines: 3 })).toBe(3)
      expect(rows({ ...ask, diffLines: 0 })).toBe(0)
      expect(rows({ ...ask, diffLines: 99 })).toBe(10) // весь дифф page: десять строк
    })

    it('строки диффа появляются очередью по MOTION.stagger после Edited', () => {
      const ask: AgentSpec = { type: 'agent', session: S, event: 'ask', at: { prompt: 0, steps: [1], reply: 2 } }
      const rows = (frame: number) => count(view(ask, frame), 'data-role="diff"')
      expect(rows(120)).toBe(0)
      expect(rows(120 + MOTION.stagger)).toBe(1)
      expect(rows(120 + 3 * MOTION.stagger)).toBe(3)
    })

    it('режим — имя режима в нижней строке мелким faint', () => {
      const mode = part(view(AG, 20), 'mode')!
      expect(plain(mode)).toBe('Manual')
      expect(mode).toContain(`fill="${T.faint}"`)
      expect(plain(part(view({ ...AG, mode: 'Accept edits' }, 20), 'mode')!)).toBe('Accept edits')
      expect(view({ ...AG, mode: undefined }, 20)).not.toContain('data-part="mode"')
    })

    it('ответ — абзац soft Golos Text 28 px, переносится по wrapText, появляется на своей реплике', () => {
      const reply = FIXTURE.events.find((e) => e.id === 'ag') as AgentEvent
      expect(part(view(AG, 389), 'reply')).toBeNull()
      const html = view(AG, END)
      const block = part(html, 'reply')!
      expect(block).toContain(`fill="${T.soft}"`)
      expect(block).toContain('font-size:28px')
      expect(block).toContain('Golos Text')
      const texts = [...block.matchAll(/<text[^>]*>(.*?)<\/text>/g)].map((m) => plain(m[1]))
      expect(texts.length).toBeGreaterThan(0)
      expect(texts.join(' ')).toBe(reply.reply)
      expect(texts).toEqual(wrapText(reply.reply, 28, 1560))
    })

    it('chat: запрос и код из диффа первого шага file; ни «Reading», ни «Edited», ни ответа агента — чат в проекте ничего не делает', () => {
      const html = view(CHAT, END)
      expect(plain(html)).not.toMatch(/Reading|Edited|Run "/)
      expect(plain(part(html, 'prompt')!)).toContain('Добавь проверку веса в форму подхода')
      expect(part(html, 'reply')).toBeNull()
      const ag = FIXTURE.events.find((e) => e.id === 'ag') as AgentEvent
      expect(plain(html)).not.toContain(ag.reply.slice(0, 20))
      const code = plain(part(html, 'code')!)
      expect(code).toContain('export async function GET() {')
      expect(code).toContain("  return Response.json({ sets: [] })")
      expect(code).not.toContain('+') // знаки диффа не нужны
      expect(code).not.toContain('@@')
      expect(html).not.toContain('data-part="step:')
    })

    it('chat: блок кода появляется на реплике at.reply — сразу после запроса', () => {
      const t = def.moments(CHAT, CLOCK, ctx)
      const codeAt = CLOCK.beat(CHAT.at.reply)
      expect(t).toContain(codeAt)
      expect(part(view(CHAT, codeAt - 1), 'code')).toBeNull()
      expect(part(view(CHAT, codeAt), 'code')).not.toBeNull()
      // строк ответа под запросом нет: код стоит сразу под рамкой ввода, через просвет
      const lay = def.layout(CHAT, ctx)
      expect(lay.code.y - (lay.prompt.y + lay.prompt.h)).toBeLessThan(36)
    })

    it('chat: diffLines ограничивает код', () => {
      const lines = (spec: AgentSpec) => count(view(spec, END), 'data-role="code"')
      expect(lines(CHAT)).toBe(4)
      expect(lines({ ...CHAT, diffLines: 2 })).toBe(2)
    })

    it('chat: если код обрезан diffLines, последняя строка блока — «…» цвета faint; если показан весь — её нет', () => {
      const more = (spec: AgentSpec) => /<text[^>]*data-role="more"[^>]*>(.*?)<\/text>/.exec(view(spec, END))
      const cut = more({ ...CHAT, diffLines: 2 })!
      expect(cut[0]).toContain(`fill="${T.faint}"`)
      expect(plain(cut[1])).toBe('…')
      expect(more(CHAT)).toBeNull() // diffLines 6 ≥ 4 строк
      expect(more({ ...CHAT, diffLines: 4 })).toBeNull() // ровно все
      // «…» стоит под последней строкой кода и входит в блок
      const html = view({ ...CHAT, diffLines: 2 }, END)
      const rows = [...html.matchAll(/<text[^>]*data-role="(?:code|more)"[^>]*? y="([\d.]+)"/g)].map((m) => Number(m[1]))
      expect(rows).toHaveLength(3)
      expect(rows[2]).toBeGreaterThan(rows[1])
      const lay = def.layout({ ...CHAT, diffLines: 2 }, ctx)
      expect(rows[2]).toBeLessThanOrEqual(lay.code.y + lay.code.h)
      expect(lay.code.h).toBeGreaterThan(def.layout({ ...CHAT, diffLines: 4 }, ctx).code.h / 4 * 2) // место под «…» посчитано
      expect(def.problems({ ...CHAT, diffLines: 2 }, ctx, CLOCK)).toEqual([])
    })

    it('chat: code — строки нового файла с a по b, а выше и ниже, если файл шире, — «…» faint', () => {
      const rows = (spec: AgentSpec) => [...view(spec, END).matchAll(/<text[^>]*data-role="(code|more)"[^>]*>(.*?)<\/text>/g)].map((m) => [m[1], plain(m[2])])
      expect(rows({ ...CHAT, code: [2, 3] })).toEqual([
        ['more', '…'],
        ['code', '  return Response.json({ sets: [] })'],
        ['code', '}'],
        ['more', '…'],
      ])
      // весь файл — без «…»; diffLines при code не обрезает
      expect(rows({ ...CHAT, code: [1, 4], diffLines: 1 }).map(([role]) => role)).toEqual(['code', 'code', 'code', 'code'])
      expect(rows({ ...CHAT, code: [1, 2] }).map(([role]) => role)).toEqual(['code', 'code', 'more'])
      expect(def.problems({ ...CHAT, code: [2, 3] }, ctx, CLOCK)).toEqual([])
      // место под обе «…» посчитано: блок выше, чем у двух строк без них
      expect(def.layout({ ...CHAT, code: [2, 3] }, ctx).code.h).toBeGreaterThan(def.layout({ ...CHAT, code: [1, 4] }, ctx).code.h - 0.01)
    })

    it('chat: code вне файла или без chat — проблема', () => {
      expect(problems({ ...CHAT, code: [3, 9] }).join('\n')).toMatch(/code/)
      expect(problems({ ...CHAT, code: [0, 2] }).join('\n')).toMatch(/code/)
      expect(problems({ ...AG, code: [1, 2] }).join('\n')).toMatch(/code.*chat/)
    })

    it('chat: «…» ждёт своей очереди после строк кода', () => {
      const spec = { ...CHAT, diffLines: 2 }
      // последний момент сцены — появление «…»: кадром раньше строки кода уже есть, а её ещё нет
      const frames = def.moments(spec, CLOCK, ctx)
      const moreAt = frames[frames.length - 1]
      expect(count(view(spec, moreAt - 1), 'data-role="code"')).toBe(2)
      expect(view(spec, moreAt - 1)).not.toContain('data-role="more"')
      expect(view(spec, moreAt)).toContain('data-role="more"')
    })
  })

  describe('moments', () => {
    it('пока длинный запрос набирается, перемена — в начале каждой его строки (не реже, чем раз в строку)', () => {
      const long = 'слово '.repeat(40).trim()
      const nl: AgentEvent = { id: 'long-ask', kind: 'agent', prompt: long, reply: 'Готово', steps: [] }
      const c2 = { ...ctx, find: makeFind([{ ...FIXTURE, events: [...FIXTURE.events, nl] }]) }
      const spec: AgentSpec = { type: 'agent', session: S, event: 'long-ask', at: { prompt: 0, steps: [], reply: 1 } }
      const m = def.moments(spec, makeClock(10), c2)
      // строки по 16 слов: начало на знаках 0, 96, 192 (слово 6 знаков, 16 слов = 95 знаков и пробел)
      expect(m).toEqual(expect.arrayContaining([START, START + 96, START + 192, START + 239]))
      for (let i = 1; i < m.length; i++) if (m[i] < START + 239) expect(m[i] - m[i - 1]).toBeLessThanOrEqual(MOTION.maxStill)
    })

    it('начало и конец набора, каждый шаг и строка, ответ «y», ответ агента; по возрастанию, без повторов', () => {
      const m = def.moments(AG, CLOCK, ctx)
      expect(m).toEqual(expect.arrayContaining([0, START, TYPED, 120, 122, 210, 216, 234, 236, 300, 390]))
      expect(m).toEqual([...new Set(m)].sort((a, b) => a - b))
    })
  })

  describe('appears', () => {
    it('запрос — когда набран целиком, шаг — со своей первой строки, ответ — с первого кадра проявления', () => {
      const at = def.appears!(AG, CLOCK, ctx)
      expect(at.get('prompt')).toBe(TYPED)
      // шаги — на своих репликах или позже, когда кончился набор и предыдущий шаг (кадры — из комментария к AG)
      expect(at.get('step:rd-page')).toBe(120)
      expect(at.get('step:route')).toBe(122)
      expect(at.get('step:page')).toBe(210)
      expect(at.get('step:fail')).toBe(216)
      expect(at.get('step:c2')).toBe(300)
      // ответ на кадре 390 начинает проявляться: непрозрачность там 0, видно — кадром позже
      expect(at.get('reply')).toBe(391)
      // режим виден с начала сцены — его в карте нет
      expect([...at.keys()].sort()).toEqual(['prompt', 'reply', 'step:c2', 'step:fail', 'step:page', 'step:rd-page', 'step:route'])
      // шаги ждут конца набора: запрос длиннее реплики — первый шаг приходит позже своей реплики
      const late = def.appears!({ ...AG, at: { ...AG.at, steps: [0, 1, 2, 2, 3] } }, CLOCK, ctx)
      expect(late.get('step:rd-page')).toBe(TYPED + MOTION.stagger)
      expect([...def.appears!(CHAT, CLOCK, ctx).keys()].sort()).toEqual(['code', 'prompt'])
    })

    it('совпадает с рисунком: за кадр до появления части её не видно (запрос ещё не набран), на кадре появления — видно', () => {
      const seen = (html: string, name: string) => (part(html, name) ?? '').includes('<text')
      for (const spec of [AG, CHAT]) {
        const end = view(spec, END)
        for (const [name, f] of def.appears!(spec, CLOCK, ctx)) {
          if (name === 'prompt') {
            // рамка ввода с «>» видна всегда, а запрос — набран целиком к кадру f
            expect(part(view(spec, f), name), `${name} на кадре ${f}`).toBe(part(end, name))
            expect(part(view(spec, f - 1), name), `${name} на кадре ${f - 1}`).not.toBe(part(end, name))
          } else {
            expect(seen(view(spec, f), name), `${name} на кадре ${f}`).toBe(true)
            expect(seen(view(spec, f - 1), name), `${name} на кадре ${f - 1}`).toBe(false)
          }
        }
      }
    })
  })
})

describe('GitLog', () => {
  const def = FRAMES.gitlog
  const row = (event: string, at: number) => ({ session: S, event, at })
  const GL: GitLogSpec = {
    type: 'gitlog',
    rows: [row('c1', 0), row('c2', 1), row('c3', 2), row('c4', 4)],
    heads: [
      { at: 0, branch: 'main', commit: 'c1' },
      { at: 1, branch: 'main', commit: 'c2' },
      { at: 2, branch: 'sets-form', commit: 'c3' },
      { at: 3, branch: 'main', commit: 'c3' },
      { at: 4, branch: 'main', commit: 'c4' },
    ],
  }
  const DIRTY: GitLogSpec = { type: 'gitlog', rows: [row('c1', 0), row('c2', 1), row('c3', 3)], dirty: { at: 2, until: 3, text: 'app/page.tsx' } }
  const problems = (spec: GitLogSpec, clock: Clock = CLOCK) => def.problems(spec, ctx, clock)
  const centerY = (r: Rect) => r.y + r.h / 2

  describe('layout', () => {
    const layout = def.layout(GL, ctx)

    it('части frame, commit:<событие>, head:<ветка> — все внутри SAFE', () => {
      expect(Object.keys(layout).sort()).toEqual(['commit:c1', 'commit:c2', 'commit:c3', 'commit:c4', 'frame', 'head:main', 'head:sets-form'])
      for (const [name, r] of Object.entries(layout)) expect(inside(r), name).toBe(true)
    })

    it('коммиты идут сверху вниз по порядку rows', () => {
      const ys = ['c1', 'c2', 'c3', 'c4'].map((e) => centerY(layout[`commit:${e}`]))
      expect(ys).toEqual([...ys].sort((a, b) => a - b))
      expect(new Set(ys).size).toBe(4)
    })

    it('коммит ветки sets-form — правее коммитов main; c4 снова на дорожке main', () => {
      expect(layout['commit:c3'].x).toBeGreaterThan(layout['commit:c1'].x)
      expect(layout['commit:c3'].x).toBeGreaterThan(layout['commit:c2'].x)
      expect(layout['commit:c4'].x).toBeCloseTo(layout['commit:c1'].x)
    })

    it('метка в конце сцены стоит у последнего коммита, на который указана', () => {
      expect(centerY(layout['head:main'])).toBeCloseTo(centerY(layout['commit:c4']))
      expect(centerY(layout['head:sets-form'])).toBeCloseTo(centerY(layout['commit:c3']))
      expect(layout['head:main'].x).not.toBeCloseTo(layout['head:sets-form'].x) // две метки на одном коммите не налезают
    })

    it('dirty: строка стоит под последним коммитом, который уже есть на её реплике', () => {
      const l = def.layout(DIRTY, ctx)
      expect(Object.keys(l).sort()).toEqual(['commit:c1', 'commit:c2', 'commit:c3', 'dirty', 'frame'])
      expect(centerY(l.dirty)).toBeCloseTo(centerY(l['commit:c3'])) // на месте будущего коммита c3
      expect(below(l.dirty, l['commit:c2'])).toBe(true)
      expect(inside(l.dirty)).toBe(true)
    })

    it('без heads и dirty — только коммиты', () => {
      expect(Object.keys(def.layout({ type: 'gitlog', rows: [row('c1', 0)] }, ctx)).sort()).toEqual(['commit:c1', 'frame'])
    })
  })

  describe('problems', () => {
    it('верные данные — без проблем', () => {
      expect(problems(GL)).toEqual([])
      expect(problems(DIRTY)).toEqual([])
    })

    it('ловит неизвестное событие, событие другого вида, событие дважды и пустой список', () => {
      expect(problems({ type: 'gitlog', rows: [row('zzz', 0)] }).join('\n')).toMatch(/zzz/)
      expect(problems({ type: 'gitlog', rows: [row('ls', 0)] })).not.toEqual([])
      expect(problems({ type: 'gitlog', rows: [row('c1', 0), row('c1', 1)] })).not.toEqual([])
      expect(problems({ type: 'gitlog', rows: [] })).not.toEqual([])
    })

    it('ловит реплику вне сцены', () => {
      expect(problems({ type: 'gitlog', rows: [row('c1', 9)] })).not.toEqual([])
      expect(problems({ ...GL, heads: [{ at: 9, branch: 'main', commit: 'c1' }] })).not.toEqual([])
      expect(problems({ ...DIRTY, dirty: { at: 2, until: 9, text: 'x' } })).not.toEqual([])
    })

    it('ловит коммит из heads не среди rows и метку раньше появления коммита', () => {
      expect(problems({ ...GL, heads: [{ at: 4, branch: 'main', commit: 'c-long' }] }).join('\n')).toMatch(/c-long/)
      expect(problems({ ...GL, heads: [{ at: 0, branch: 'main', commit: 'c2' }] }).join('\n')).toMatch(/c2/)
      expect(problems({ ...GL, heads: [{ at: 1, branch: 'main', commit: 'c2' }] })).toEqual([]) // та же реплика — можно
    })

    it('ловит dirty, у которого until раньше at', () => {
      expect(problems({ ...DIRTY, dirty: { at: 3, until: 2, text: 'x' } }).join('\n')).toMatch(/until/)
    })

    it('ловит dirty, который налезает на следующий коммит (тот появляется до until)', () => {
      expect(problems({ ...DIRTY, dirty: { at: 2, until: 4, text: 'x' } }).join('\n')).toMatch(/незакоммич/) // c3 появляется на реплике 3, до until
    })

    it('ловит коммит выше своего родителя и родителя, который появляется позже ребёнка', () => {
      expect(problems({ type: 'gitlog', rows: [row('c2', 0), row('c1', 1)] }).join('\n')).toMatch(/родител/)
      expect(problems({ type: 'gitlog', rows: [row('c1', 3), row('c2', 1)] }).join('\n')).toMatch(/родител/)
    })

    it('ловит сообщение, которое с метками веток не помещается в окно', () => {
      const long: GitLogSpec = { type: 'gitlog', rows: [row('c1', 0), row('c2', 0), row('c3', 0), row('c4', 0), row('c-long', 0)], heads: [{ at: 0, branch: 'sets-form', commit: 'c3' }] }
      expect(problems(long).join('\n')).toMatch(/помещается/)
      expect(problems({ ...long, heads: undefined, rows: long.rows.slice(0, 4) })).toEqual([])
    })

    it('ловит dirty-строку, которая не помещается в окно', () => {
      expect(problems({ ...DIRTY, dirty: { at: 2, until: 3, text: 'x'.repeat(120) } }).join('\n')).toMatch(/помещается/)
    })

    it('ловит то, что не успевает до конца сцены', () => {
      expect(problems(GL, SHORT).join('\n')).toMatch(/сцен/)
    })
  })

  describe('разметка', () => {
    it('коммит — точка, короткий хеш и сообщение; до своей реплики его нет', () => {
      expect(part(view(GL, START - 1), 'commit:c1')).toBeNull()
      const c1 = part(view(GL, START + MOTION.appear), 'commit:c1')!
      expect(c1).toContain('<circle')
      expect(plain(c1)).toBe('abc1234Первое сохранение')
      expect(part(view(GL, CLOCK.beat(1) - 1), 'commit:c2')).toBeNull()
      expect(part(view(GL, CLOCK.beat(1)), 'commit:c2')).not.toBeNull()
    })

    it('хеш soft, сообщение ink; точка main — ink, точка ветки — soft', () => {
      const html = view(GL, 400)
      const texts = (name: string) => [...part(html, name)!.matchAll(/<text[^>]*>/g)].map((m) => m[0])
      const [hash, msg] = texts('commit:c2')
      expect(hash).toContain(`fill="${T.soft}"`)
      expect(msg).toContain(`fill="${T.ink}"`)
      expect(/<circle[^>]*>/.exec(part(html, 'commit:c2')!)![0]).toContain(`fill="${T.ink}"`)
      expect(/<circle[^>]*>/.exec(part(html, 'commit:c3')!)![0]).toContain(`fill="${T.soft}"`)
    })

    it('точка ветки sets-form правее точек main, c4 возвращается на дорожку main', () => {
      const html = view(GL, 400)
      const cx = (name: string) => number(part(html, name)!, /<circle[^>]*cx="([\d.]+)"/)
      expect(cx('commit:c3')).toBeGreaterThan(cx('commit:c1'))
      expect(cx('commit:c2')).toBeCloseTo(cx('commit:c1'))
      expect(cx('commit:c4')).toBeCloseTo(cx('commit:c1'))
    })

    it('линия от родителя к коммиту прорисовывается за MOTION.draw кадров', () => {
      const at = CLOCK.beat(1)
      const dash = (frame: number) => {
        const m = /<path data-part="edge:c2"[^>]*stroke-dashoffset="([\d.]+)"/.exec(view(GL, frame))
        return m ? Number(m[1]) : null
      }
      expect(dash(at - 1)).toBeNull()
      expect(dash(at)).toBeCloseTo(1)
      const mid = dash(at + 5)!
      expect(mid).toBeGreaterThan(0)
      expect(mid).toBeLessThan(1)
      expect(dash(at + MOTION.draw)).toBeCloseTo(0)
      expect(dash(at + 100)).toBeCloseTo(0)
      expect(view(GL, at + 3)).toContain('stroke-dasharray="1"')
    })

    it('линия на другую дорожку идёт кривой от точки родителя к точке ребёнка', () => {
      const html = view(GL, 400)
      const d = /data-part="edge:c3"[^>]*d="([^"]+)"/.exec(html)![1]
      expect(d).toContain('C')
      const cx = (name: string) => number(part(html, name)!, /<circle[^>]*cx="([\d.]+)"/)
      expect(Number(/^M([\d.]+)/.exec(d)![1])).toBeCloseTo(cx('commit:c2'))
      expect(Number(/([\d.]+) [\d.]+$/.exec(d)![1])).toBeCloseTo(cx('commit:c3'))
      // у c1 родителей нет — линии нет
      expect(html).not.toContain('data-part="edge:c1"')
      expect(count(html, 'data-part="edge:')).toBe(3)
    })

    it('метка ветки: рамка 2 px, main — ink, остальные — soft; на первый показ появляется на месте', () => {
      const html = view(GL, 400)
      const main = part(html, 'head:main')!
      expect(main).toMatch(/<rect[^>]*stroke="#E9EBEE"[^>]*stroke-width="2"/)
      expect(plain(main)).toBe('main')
      const other = part(html, 'head:sets-form')!
      expect(other).toMatch(/<rect[^>]*stroke="#A3A9B1"[^>]*stroke-width="2"/)
      expect(plain(other)).toBe('sets-form')
      expect(part(view(GL, START - 1), 'head:main')).toBeNull()
    })

    it('head:main переезжает к новому коммиту за MOTION.move кадров и к beat(at) + 18 стоит у него', () => {
      const layout = def.layout(GL, ctx)
      const at = CLOCK.beat(4)
      const y = (frame: number) => number(part(view(GL, frame), 'head:main')!, /<rect[^>]*? y="([\d.]+)"/)
      const h = layout['head:main'].h
      const yc3 = centerY(layout['commit:c3']) - h / 2
      const yc4 = centerY(layout['commit:c4']) - h / 2
      expect(y(at - 1)).toBeCloseTo(yc3)
      expect(y(at + MOTION.move)).toBeCloseTo(yc4)
      expect(y(at + 100)).toBeCloseTo(yc4)
      const mid = y(at + 5)
      expect(mid).toBeGreaterThan(yc3)
      expect(mid).toBeLessThan(yc4)
      // ease-out: на пути в 5 кадров из 18 прошло больше трети
      expect((mid - yc3) / (yc4 - yc3)).toBeCloseTo(easeOut(5 / MOTION.move), 2)
    })

    it('две метки на одном коммите стоят рядом: sets-form и main у c3', () => {
      const html = view(GL, CLOCK.beat(3) + MOTION.move)
      const rect = (name: string) => /<rect[^>]*? x="([\d.]+)"[^>]*? y="([\d.]+)"/.exec(part(html, name)!)!
      expect(Number(rect('head:main')[2])).toBeCloseTo(Number(rect('head:sets-form')[2]))
      expect(Number(rect('head:main')[1])).not.toBeCloseTo(Number(rect('head:sets-form')[1]))
    })

    it('dirty: пунктирная строка «незакоммиченные правки: …» цвета warn, от at до until', () => {
      const at = CLOCK.beat(2)
      const until = CLOCK.beat(3)
      expect(part(view(DIRTY, at - 1), 'dirty')).toBeNull()
      const d = part(view(DIRTY, at + MOTION.appear), 'dirty')!
      expect(plain(d)).toBe('незакоммиченные правки: app/page.tsx')
      expect(d).toContain(`fill="${T.warn}"`)
      expect(d).toMatch(/stroke-dasharray="[\d. ]+"/)
      expect(d).toContain(`stroke="${T.warn}"`)
      expect(part(view(DIRTY, until - 1), 'dirty')).not.toBeNull()
      expect(part(view(DIRTY, until + MOTION.appear), 'dirty')).toBeNull() // растворилась
      expect(part(view(DIRTY, until + MOTION.appear), 'commit:c3')).not.toBeNull() // на её месте коммит
    })
  })

  describe('moments', () => {
    it('каждый коммит, переезд метки и границы dirty; по возрастанию, без повторов', () => {
      const m = def.moments(GL, CLOCK, ctx)
      expect(m).toEqual(expect.arrayContaining([0, CLOCK.beat(0), CLOCK.beat(1), CLOCK.beat(2), CLOCK.beat(3), CLOCK.beat(4)]))
      expect(m).toEqual([...new Set(m)].sort((a, b) => a - b))
      expect(def.moments(DIRTY, CLOCK, ctx)).toEqual(expect.arrayContaining([CLOCK.beat(2), CLOCK.beat(3)]))
    })
  })
})

describe('consoleText', () => {
  it('убирает %c и хвост со стилем: так сообщение показывает DevTools', () => {
    expect(consoleText('%cDownload the React DevTools for a better development experience: https://react.dev/link/react-devtools font-weight:bold')).toBe(
      'Download the React DevTools for a better development experience: https://react.dev/link/react-devtools',
    )
  })

  it('без %c текст не меняется, адреса с двоеточием остаются', () => {
    expect(consoleText('[HMR] connected')).toBe('[HMR] connected')
    expect(consoleText('Failed to load: https://example.com/a:b')).toBe('Failed to load: https://example.com/a:b')
    expect(consoleText('')).toBe('')
  })

  it('стилей убирается ровно столько, сколько маркеров %c: аргумент — объявления через «;»', () => {
    expect(consoleText('%cA %cB color:red font-weight:bold')).toBe('A B')
    expect(consoleText('%cтекст background:#222;')).toBe('текст')
    expect(consoleText('%cтекст color: red; font-size: 12px')).toBe('текст')
    // один маркер — один аргумент: второй хвост — уже текст сообщения
    expect(consoleText('%cA color:red font-weight:bold')).toBe('A color:red')
  })

  it('%c без хвоста-стиля: текст с «слово:значение» в конце не теряется', () => {
    expect(consoleText('%cServer ready on localhost:3000')).toBe('Server ready on localhost:3000')
    expect(consoleText('%cOpen http://localhost:3000')).toBe('Open http://localhost:3000')
    expect(consoleText('%cStatus: ok')).toBe('Status: ok')
    // а настоящий хвост-стиль после такого текста убирается
    expect(consoleText('%cServer ready on localhost:3000 color:green')).toBe('Server ready on localhost:3000')
  })

  it('маркеров больше, чем стилей: убирается, что есть', () => {
    expect(consoleText('%cA %cB color:red')).toBe('A B')
  })
})

describe('Browser', () => {
  const def = FRAMES.browser
  const BR: BrowserSpec = {
    type: 'browser',
    session: S,
    event: 'form',
    console: true,
    marks: [{ line: 'Вес должен быть числом, например 60', tone: 'err' }],
    at: { page: 0, action: 1, console: 2 },
  }
  const problems = (spec: BrowserSpec, clock: Clock = CLOCK, c: FrameCtx = ctx) => def.problems(spec, c, clock)
  const PAGE_AT = START // страница появляется на реплике 0
  const ACTION = CLOCK.beat(1)
  const CONSOLE = CLOCK.beat(2)
  const HINT = 'Вес должен быть числом, например 60'

  describe('layout', () => {
    const layout = def.layout(BR, ctx)

    it('части frame, url, page, field:, button:, console, console:<k> — внутри SAFE', () => {
      expect(layout.frame).toEqual({ x: SAFE.x, y: SAFE.y, w: SAFE.w, h: SAFE.h })
      expect(Object.keys(layout).sort()).toEqual(
        ['button:Сохранить подход', 'console', 'console:0', 'console:1', 'console:2', 'console:3', 'field:Повторы', 'field:Вес, кг', 'frame', 'page', 'url'].sort(),
      )
      for (const [name, r] of Object.entries(layout)) expect(inside(r), name).toBe(true)
    })

    it('страница выше панели Console; панель — около 40 % высоты окна', () => {
      expect(below(layout.console, layout.page)).toBe(true)
      expect(layout.console.h / SAFE.h).toBeGreaterThan(0.35)
      expect(layout.console.h / SAFE.h).toBeLessThan(0.45)
      expect(layout.console.y + layout.console.h).toBeCloseTo(SAFE.y + SAFE.h)
    })

    it('поля, кнопка и сообщения идут сверху вниз; поля и кнопка — в странице, сообщения — в панели', () => {
      const f1 = layout['field:Вес, кг']
      const f2 = layout['field:Повторы']
      const b = layout['button:Сохранить подход']
      expect(below(f2, f1)).toBe(true)
      expect(below(b, f2)).toBe(true)
      for (const r of [f1, f2, b]) {
        expect(r.y).toBeGreaterThanOrEqual(layout.page.y)
        expect(r.y + r.h).toBeLessThanOrEqual(layout.page.y + layout.page.h)
      }
      for (let k = 1; k < 4; k++) expect(below(layout[`console:${k}`], layout[`console:${k - 1}`])).toBe(true)
      for (let k = 0; k < 4; k++) {
        expect(layout[`console:${k}`].y).toBeGreaterThanOrEqual(layout.console.y)
        expect(layout[`console:${k}`].y + layout[`console:${k}`].h).toBeLessThanOrEqual(layout.console.y + layout.console.h + 0.01)
      }
    })

    it('первое сообщение консоли переносится на две строки окна, остальные — на одну', () => {
      expect(layout['console:0'].h).toBeCloseTo(2 * 36)
      expect(layout['console:1'].h).toBeCloseTo(36)
    })

    it('блок страницы стоит по центру окна по ширине своего содержимого: тут самая широкая строка — подпись и поле', () => {
      const field = layout['field:Вес, кг']
      expect(field.x - SAFE.x).toBeCloseTo(SAFE.x + SAFE.w - (field.x + field.w), 0)
      // кнопка начинается в колонке поля ввода, правее подписей, и не шире блока
      const button = layout['button:Сохранить подход']
      expect(button.x).toBeGreaterThan(field.x)
      expect(button.x + button.w).toBeLessThanOrEqual(field.x + field.w + 0.01)
    })

    it('блок центрируется по самой широкой строке страницы, а не по колонке: длинный текст двигает блок влево', () => {
      const long = 'Строка страницы шире строки с полем ввода и подписью'
      const wide: BrowserEvent = {
        ...(FIXTURE.events.find((e) => e.id === 'form') as BrowserEvent),
        id: 'wide-text',
        before: ['Тренировка', 'Вес, кг', 'Повторы', 'Сохранить подход', long],
        after: [],
      }
      const c2 = { ...ctx, find: makeFind([{ ...FIXTURE, events: [...FIXTURE.events, wide] }]) }
      const spec: BrowserSpec = { type: 'browser', session: S, event: 'wide-text', at: { page: 0 } }
      const width = textWidth(long, 28)
      expect(width).toBeGreaterThan(680) // шире подписи и поля
      expect(width).toBeLessThan(960)
      const x = number(view(spec, PAGE_AT + 60, CLOCK, c2), new RegExp(`<text[^>]*? x="([\\d.]+)"[^>]*>${long}</text>`))
      expect(x).toBeCloseTo(SAFE.x + (SAFE.w - width) / 2, 0)
      // поля при этом едут вместе с блоком
      expect(def.layout(spec, c2)['field:Вес, кг'].x).toBeCloseTo(x, 0)
      expect(problems(spec, CLOCK, c2)).toEqual([])
    })

    it('при action блок не прыгает: центр считается по строкам before и after вместе', () => {
      const long = 'Строка страницы шире строки с полем ввода и подписью'
      const grow: BrowserEvent = {
        ...(FIXTURE.events.find((e) => e.id === 'form') as BrowserEvent),
        id: 'grow',
        before: ['Тренировка', 'Вес, кг', 'Повторы', 'Сохранить подход'],
        after: ['Тренировка', 'Вес, кг', 'Повторы', 'Сохранить подход', long],
      }
      const c2 = { ...ctx, find: makeFind([{ ...FIXTURE, events: [...FIXTURE.events, grow] }]) }
      const spec: BrowserSpec = { type: 'browser', session: S, event: 'grow', at: { page: 0, action: 1 } }
      const fieldX = (frame: number) => number(part(view(spec, frame, CLOCK, c2), 'field:Вес, кг')!, /<rect[^>]*? x="([\d.]+)"/)
      expect(fieldX(ACTION - 1)).toBeCloseTo(fieldX(ACTION + 100), 5)
    })

    it('строки с одинаковым текстом не дают предупреждения React о ключах; marks красит обе', () => {
      const same: BrowserEvent = {
        ...(FIXTURE.events.find((e) => e.id === 'form') as BrowserEvent),
        id: 'dup',
        before: ['Тренировка', 'Сохранить подход', 'Сохранить подход', 'Сохранённые подходы', '60 кг × 8', '60 кг × 8'],
        after: ['Тренировка', 'Сохранить подход', 'Сохранить подход', 'Сохранённые подходы', '60 кг × 8', '60 кг × 8', '60 кг × 8'],
      }
      const c2 = { ...ctx, find: makeFind([{ ...FIXTURE, events: [...FIXTURE.events, same] }]) }
      const spec: BrowserSpec = { type: 'browser', session: S, event: 'dup', marks: [{ line: '60 кг × 8', tone: 'ok' }], at: { page: 0, action: 1 } }
      // предупреждение о повторных ключах даёт только клиентский рендер (renderToStaticMarkup его не видит)
      const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
      try {
        for (const frame of [PAGE_AT + 30, ACTION + 3, ACTION + 100]) {
          now.frame = frame
          const { Component } = frameDef(spec)
          const { container, unmount } = render(
            <svg>
              <Component spec={spec} clock={CLOCK} ctx={c2} />
            </svg>,
          )
          const rows = [...container.querySelectorAll('text')].filter((t) => t.textContent === '60 кг × 8')
          expect(rows.length, `@${frame}`).toBeGreaterThanOrEqual(2)
          for (const r of rows) expect(r.getAttribute('fill'), `@${frame}`).toBe(T.ok)
          expect(container.querySelectorAll('g[data-part="button:Сохранить подход"]').length, `@${frame}`).toBe(2)
          unmount()
        }
        expect(errors.mock.calls.map((c) => String(c[0])).join('\n')).not.toMatch(/key/i)
      } finally {
        errors.mockRestore()
      }
    })

    it('без console панели и сообщений нет, страница занимает всё окно', () => {
      const bare = def.layout({ ...BR, console: false, at: { page: 0, action: 1 } }, ctx)
      expect(Object.keys(bare).some((k) => k.startsWith('console'))).toBe(false)
      expect(bare.page.y + bare.page.h).toBeCloseTo(SAFE.y + SAFE.h)
    })

    it('consoleLines выбирает сообщения (с 1 включительно), k считается от нуля среди показанных', () => {
      const only = def.layout({ ...BR, consoleLines: [4, 4] }, ctx)
      expect(Object.keys(only).filter((k) => k.startsWith('console:'))).toEqual(['console:0'])
      const two = def.layout({ ...BR, consoleLines: [2, 3] }, ctx)
      expect(Object.keys(two).filter((k) => k.startsWith('console:')).sort()).toEqual(['console:0', 'console:1'])
      expect(two['console:0'].h).toBeCloseTo(36)
    })

    it('после action в странице строка подсказки: поля и кнопка на тех же местах, дальше — ниже', () => {
      const before = def.layout({ ...BR, at: { page: 0, console: 2 } }, ctx) // без action — страница «до»
      expect(layout['field:Вес, кг']).toEqual(before['field:Вес, кг'])
      expect(layout.page.h).toBeGreaterThanOrEqual(before.page.h)
    })
  })

  describe('problems', () => {
    it('верные данные — без проблем', () => {
      expect(problems(BR)).toEqual([])
      expect(problems({ ...BR, console: false, marks: undefined, at: { page: 0 } })).toEqual([])
      expect(problems({ ...BR, consoleLines: [4, 4] })).toEqual([])
    })

    it('ловит неизвестное событие и событие другого вида', () => {
      expect(problems({ ...BR, event: 'zzz' }).join('\n')).toMatch(/zzz/)
      expect(problems({ ...BR, event: 'ls' })).not.toEqual([])
    })

    it('ловит at.action и at.console раньше at.page', () => {
      const at = { page: 2, action: 3, console: 3 }
      expect(problems({ ...BR, at })).toEqual([])
      expect(problems({ ...BR, at: { ...at, action: 1 } }).join('\n')).toMatch(/at\.action.*at\.page/)
      expect(problems({ ...BR, at: { ...at, console: 1 } }).join('\n')).toMatch(/at\.console.*at\.page/)
      expect(problems({ ...BR, at: { page: 2, action: 2, console: 2 } })).toEqual([]) // та же реплика — можно
    })

    it('ловит реплики вне сцены', () => {
      expect(problems({ ...BR, at: { page: 9 } })).not.toEqual([])
      expect(problems({ ...BR, at: { page: 0, action: 9 } })).not.toEqual([])
      expect(problems({ ...BR, at: { page: 0, action: 1, console: 9 } })).not.toEqual([])
    })

    it('ловит urlAfter, который не адрес', () => {
      const bad: BrowserEvent = { ...(FIXTURE.events.find((e) => e.id === 'form') as BrowserEvent), id: 'bad-url', urlAfter: 'не адрес' }
      const c2 = { ...ctx, find: makeFind([{ ...FIXTURE, events: [...FIXTURE.events, bad] }]) }
      expect(problems({ ...BR, event: 'bad-url' }, CLOCK, c2).join('\n')).toMatch(/адрес «не адрес» не разбирается/)
    })

    it('ловит consoleLines без console, вне записи и с ошибкой диапазона', () => {
      expect(problems({ ...BR, console: false, consoleLines: [1, 1] }).join('\n')).toMatch(/consoleLines/)
      expect(problems({ ...BR, consoleLines: [1, 9] }).join('\n')).toMatch(/lines|консол/)
      expect(problems({ ...BR, consoleLines: [3, 2] })).not.toEqual([])
      expect(problems({ ...BR, consoleLines: [0, 1] })).not.toEqual([])
    })

    it('ловит console: true у записи без сообщений', () => {
      expect(problems({ ...BR, event: 'save', marks: undefined }).join('\n')).toMatch(/консол/)
    })

    it('ловит marks на строку, которой нет среди текстовых строк страницы', () => {
      expect(problems({ ...BR, marks: [{ line: 'Нет такой', tone: 'err' }] }).join('\n')).toMatch(/Нет такой/)
      expect(problems({ ...BR, marks: [{ line: 'Вес, кг', tone: 'ok' }] }).join('\n')).toMatch(/Вес, кг/) // подпись поля — не текст
      expect(problems({ ...BR, marks: [{ line: 'Подходов пока нет', tone: 'ok' }] })).toEqual([])
    })

    it('ловит страницу, которая не помещается', () => {
      const long: BrowserSpec = { type: 'browser', session: S, event: 'form-long', at: { page: 0 } }
      expect(problems(long).join('\n')).toMatch(/помещается/)
    })

    it('pageLines — окно прокручено к выбранным строкам: длинная страница помещается, заголовок — только первая строка записи', () => {
      const top: BrowserSpec = { type: 'browser', session: S, event: 'form-long', pageLines: [1, 12], at: { page: 0 } }
      expect(problems(top)).toEqual([])
      const html = view(top, 120)
      expect(plain(html)).toContain('Строка страницы 12')
      expect(plain(html)).not.toContain('Строка страницы 13')
      // первая строка записи — заголовок 40 px; у прокрученной страницы первая показанная строка — обычный текст 28 px
      expect(html).toMatch(/font-size:40px[^>]*>Строка страницы 1</)
      const scrolled: BrowserSpec = { ...top, pageLines: [8, 20], marks: [{ line: 'Строка страницы 8', tone: 'ok' }] }
      expect(problems(scrolled)).toEqual([])
      const html2 = view(scrolled, 120)
      expect(plain(html2)).not.toContain('Строка страницы 7')
      expect(html2).not.toMatch(/font-size:40px/)
      expect(html2).toMatch(/font-size:28px[^>]*>Строка страницы 8</)
      // строка вне показанных не красится, диапазон — внутри страницы, вместе с action — нельзя
      expect(problems({ ...top, marks: [{ line: 'Строка страницы 15', tone: 'ok' }] }).join('\n')).toMatch(/Строка страницы 15/)
      expect(problems({ ...top, pageLines: [1, 21] }).join('\n')).toMatch(/pageLines: \[1, 21\] вне записи/)
      expect(problems({ ...BR, console: false, pageLines: [1, 3] }).join('\n')).toMatch(/pageLines — только без at\.action/)
    })

    it('ловит консоль, которая не помещается в панель', () => {
      const noisy: BrowserEvent = {
        ...(FIXTURE.events.find((e) => e.id === 'form') as BrowserEvent),
        id: 'noisy',
        console: Array.from({ length: 12 }, (_, i) => ({ type: 'log', text: `сообщение ${i + 1}` })),
      }
      const c2 = { ...ctx, find: makeFind([{ ...FIXTURE, events: [...FIXTURE.events, noisy] }]) }
      expect(problems({ ...BR, event: 'noisy' }, CLOCK, c2).join('\n')).toMatch(/помещается/)
      expect(problems({ ...BR, event: 'noisy', consoleLines: [1, 7] }, CLOCK, c2)).toEqual([])
    })

    it('ловит подпись поля, которая вместе с полем ввода шире колонки страницы', () => {
      const label = 'Очень длинная подпись поля, не оставляющая места для ввода'
      const wide: BrowserEvent = {
        ...(FIXTURE.events.find((e) => e.id === 'form') as BrowserEvent),
        id: 'wide-label',
        fields: [{ label, value: '60' }],
        before: ['Тренировка', label],
        after: [],
      }
      const c2 = { ...ctx, find: makeFind([{ ...FIXTURE, events: [...FIXTURE.events, wide] }]) }
      expect(problems({ type: 'browser', session: S, event: 'wide-label', at: { page: 0 } }, CLOCK, c2).join('\n')).toMatch(/шире колонки/)
    })

    it('ловит то, что не успевает до конца сцены', () => {
      expect(problems(BR, SHORT).join('\n')).toMatch(/сцен/)
    })
  })

  describe('разметка', () => {
    it('вкладка — title записи, адрес — localhost:3000 и путь из url', () => {
      const html = view(BR, PAGE_AT + 30)
      expect(plain(html)).toContain('Тренировка')
      expect(plain(part(html, 'url')!)).toBe('localhost:3000/')
      const sets: BrowserSpec = { type: 'browser', session: S, event: 'form-long', at: { page: 0 } }
      expect(plain(part(view(sets, 40), 'url')!)).toBe('localhost:3000/sets?day=1')
    })

    it('поле: подпись и значение из записи, значение — Martian Mono', () => {
      const html = view(BR, PAGE_AT + 60)
      const weight = part(html, 'field:Вес, кг')!
      expect(plain(weight)).toBe('Вес, кг60 кг')
      expect(weight).toContain('Martian Mono')
      expect(weight).toContain('Golos Text')
      expect(plain(part(html, 'field:Повторы')!)).toContain('8')
    })

    it('кнопка — инверсия: фон ink, текст desk', () => {
      const button = part(view(BR, PAGE_AT + 60), 'button:Сохранить подход')!
      expect(button).toMatch(/<rect[^>]*fill="#E9EBEE"/)
      expect(button).toContain(`fill="${T.desk}"`)
      expect(plain(button)).toBe('Сохранить подход')
    })

    it('заголовок страницы — 40 px, 600; остальной текст — 28 px', () => {
      const html = view(BR, PAGE_AT + 60)
      const page = part(html, 'page')!
      expect(page).toContain('font-size:40px')
      expect(page).toContain('font-weight:600')
      expect(plain(page)).toContain('Тренировка')
      expect(plain(page)).toContain('Сохранённые подходы')
      expect(page).toContain('font-size:28px')
    })

    it('до action видны строки before, после — after: новая строка появляется за MOTION.appear', () => {
      expect(plain(view(BR, ACTION - 1))).not.toContain(HINT)
      expect(plain(view(BR, ACTION - 1))).toContain('Подходов пока нет')
      const mid = view(BR, ACTION + 3)
      expect(plain(mid)).toContain(HINT)
      const hint = (frame: number) => {
        const m = new RegExp(`<text[^>]*opacity="([\\d.]+)"[^>]*>${HINT}</text>`).exec(view(BR, frame))
        return m ? Number(m[1]) : null
      }
      expect(hint(ACTION - 1)).toBeNull()
      expect(hint(ACTION + 3)!).toBeGreaterThan(0)
      expect(hint(ACTION + 3)!).toBeLessThan(1)
      expect(hint(ACTION + MOTION.appear)).toBeCloseTo(1)
    })

    it('строки after, которых не было, сдвигают нижние вниз; поля и кнопка остаются на месте', () => {
      const y = (html: string, text: string) => number(html, new RegExp(`<text[^>]*? y="([\\d.]+)"[^>]*>${text}</text>`))
      const before = view(BR, ACTION - 1)
      const after = view(BR, ACTION + 100)
      expect(y(after, 'Сохранённые подходы')).toBeGreaterThan(y(before, 'Сохранённые подходы'))
      expect(y(after, 'Подходов пока нет')).toBeGreaterThan(y(before, 'Подходов пока нет'))
      // середина движения — между
      const mid = y(view(BR, ACTION + 5), 'Сохранённые подходы')
      expect(mid).toBeGreaterThan(y(before, 'Сохранённые подходы'))
      expect(mid).toBeLessThan(y(after, 'Сохранённые подходы'))
      // поле «Вес, кг» не двигается
      const field = (html: string) => number(part(html, 'field:Вес, кг')!, /<rect[^>]*? y="([\d.]+)"/)
      expect(field(before)).toBeCloseTo(field(after))
    })

    it('строка из before, которой нет в after, растворяется на action', () => {
      const ok: BrowserSpec = { type: 'browser', session: S, event: 'form', at: { page: 0, action: 1 } }
      const swap: BrowserEvent = {
        ...(FIXTURE.events.find((e) => e.id === 'form') as BrowserEvent),
        id: 'swap',
        after: ['Тренировка', 'Вес, кг', 'Повторы', 'Сохранить подход', 'Сохранённые подходы', '60 кг × 8'],
      }
      const c2 = { ...ctx, find: makeFind([{ ...FIXTURE, events: [...FIXTURE.events, swap] }]) }
      const spec = { ...ok, event: 'swap' }
      expect(plain(view(spec, ACTION - 1, CLOCK, c2))).toContain('Подходов пока нет')
      expect(plain(view(spec, ACTION + 3, CLOCK, c2))).toContain('Подходов пока нет') // ещё тает
      expect(plain(view(spec, ACTION + MOTION.appear, CLOCK, c2))).not.toContain('Подходов пока нет')
      expect(plain(view(spec, ACTION + MOTION.appear, CLOCK, c2))).toContain('60 кг × 8')
    })

    it('без action страница остаётся такой, как «до»', () => {
      const still: BrowserSpec = { ...BR, at: { page: 0, console: 2 } }
      expect(plain(view(still, 500))).not.toContain(HINT)
    })

    it('строка адреса: url записи до реплики action, urlAfter — с неё; без перехода и без action адрес не меняется', () => {
      const go: BrowserEvent = { ...(FIXTURE.events.find((e) => e.id === 'form') as BrowserEvent), id: 'go', url: 'http://localhost:3000/login', urlAfter: 'http://localhost:3000/trainer?day=1' }
      const c2 = { ...ctx, find: makeFind([{ ...FIXTURE, events: [...FIXTURE.events, go] }]) }
      const spec: BrowserSpec = { type: 'browser', session: S, event: 'go', at: { page: 0, action: 1 } }
      const bar = (s: BrowserSpec, frame: number, c: FrameCtx = c2) => plain(part(view(s, frame, CLOCK, c), 'url')!)
      expect(bar(spec, PAGE_AT)).toBe('localhost:3000/login')
      expect(bar(spec, ACTION - 1)).toBe('localhost:3000/login')
      expect(bar(spec, ACTION)).toBe('localhost:3000/trainer?day=1')
      expect(bar(spec, ACTION + 100)).toBe('localhost:3000/trainer?day=1')
      expect(bar({ ...spec, at: { page: 0 } }, ACTION + 100)).toBe('localhost:3000/login') // без action переход не показывают
      expect(bar(BR, ACTION + 100, ctx)).toBe('localhost:3000/') // в записи нет urlAfter
      expect(problems(spec, CLOCK, c2)).toEqual([])
    })

    it('marks красит строку страницы: err — T.err, ok — T.ok; без marks — ink', () => {
      const html = view(BR, ACTION + 100)
      expect(html).toMatch(new RegExp(`<text[^>]*fill="${T.err}"[^>]*>${HINT}</text>`))
      const ok = view({ ...BR, marks: [{ line: 'Подходов пока нет', tone: 'ok' }] }, ACTION + 100)
      expect(ok).toMatch(new RegExp(`<text[^>]*fill="${T.ok}"[^>]*>Подходов пока нет</text>`))
      const plainMarks = view({ ...BR, marks: undefined }, ACTION + 100)
      expect(plainMarks).toMatch(new RegExp(`<text[^>]*fill="${T.ink}"[^>]*>${HINT}</text>`))
    })

    it('страница появляется очередью строк по MOTION.stagger от реплики page', () => {
      const text = (frame: number) => plain(view(BR, frame))
      expect(text(PAGE_AT - 1)).not.toContain('Сохранить подход')
      expect(text(PAGE_AT + MOTION.stagger * 4)).not.toContain('Сохранённые подходы') // пятая строка начинает появляться на PAGE_AT + 8, с нулевой непрозрачностью не рисуется
      expect(text(PAGE_AT + MOTION.stagger * 4 + 1)).toContain('Сохранённые подходы')
      expect(text(PAGE_AT + MOTION.stagger * 5 + 1)).toContain('Подходов пока нет')
      expect(text(PAGE_AT + MOTION.stagger * 3 - 1)).not.toContain('Сохранить подход')
    })

    it('консоль: сообщения появляются на реплике console очередью; панель с вкладкой «Console» есть всегда', () => {
      expect(plain(view(BR, 5))).toContain('Console')
      expect(part(view(BR, CONSOLE - 1), 'console:0')).toBeNull()
      expect(part(view(BR, CONSOLE), 'console:0')).not.toBeNull()
      expect(part(view(BR, CONSOLE + 1), 'console:1')).toBeNull()
      expect(part(view(BR, CONSOLE + MOTION.stagger), 'console:1')).not.toBeNull()
      expect(part(view(BR, CONSOLE + 3 * MOTION.stagger), 'console:3')).not.toBeNull()
    })

    it('без at.console сообщения появляются вместе со страницей', () => {
      const same: BrowserSpec = { ...BR, at: { page: 1, action: 2 } }
      expect(part(view(same, CLOCK.beat(1) - 1), 'console:0')).toBeNull()
      expect(part(view(same, CLOCK.beat(1)), 'console:0')).not.toBeNull()
    })

    it('сообщение error: ✕ цвета err на подложке err 10 %, текст err', () => {
      const html = view(BR, CONSOLE + 20)
      const error = part(html, 'console:3')!
      expect(error).toContain(`data-icon="error"`)
      expect(error).toContain(`stroke="${T.err}"`)
      expect(error).toContain(alpha(T.err, 0.1))
      expect(plain(error)).toBe('Failed to load resource: the server responded with a status of 400 (Bad Request)')
      expect(error).toContain(`fill="${T.err}"`)
    })

    it('сообщение warning: ▲ цвета warn; остальные — без значка, текст soft', () => {
      const html = view(BR, CONSOLE + 20)
      const warn = part(html, 'console:2')!
      expect(warn).toContain('data-icon="warning"')
      expect(warn).toContain(`fill="${T.warn}"`)
      expect(warn).not.toContain(alpha(T.err, 0.1))
      for (const k of [0, 1]) {
        const msg = part(html, `console:${k}`)!
        expect(msg, `console:${k}`).not.toContain('data-icon')
        expect(msg).toContain(`fill="${T.soft}"`)
        expect(msg).not.toContain(alpha(T.err, 0.1))
      }
    })

    it('%c у сообщения убирается вместе с аргументом-стилем', () => {
      const info = plain(part(view(BR, CONSOLE + 20), 'console:0')!)
      expect(info.replace(/ /g, '')).toBe('Download the React DevTools for a better development experience: https://react.dev/link/react-devtools'.replace(/ /g, ''))
      expect(info).not.toContain('%c')
      expect(info).not.toContain('font-weight')
    })

    it('длинное сообщение переносится по словам: адрес не режется посреди слова', () => {
      const rows = [...part(view(BR, CONSOLE + 20), 'console:0')!.matchAll(/<text[^>]*>(.*?)<\/text>/g)].map((m) => plain(m[1]))
      expect(rows).toEqual(['Download the React DevTools for a better development experience:', 'https://react.dev/link/react-devtools'])
    })

    it('consoleLines показывает только выбранные сообщения', () => {
      const html = view({ ...BR, consoleLines: [4, 4] }, CONSOLE + 20)
      expect(plain(html)).toContain('Failed to load resource')
      expect(plain(html)).not.toContain('HMR')
      expect(plain(html)).not.toContain('Download the React DevTools')
      expect(html).not.toContain('data-part="console:1"')
    })

    it('без console панели нет, слова «Console» тоже', () => {
      const html = view({ ...BR, console: false, at: { page: 0, action: 1 } }, 300)
      expect(plain(html)).not.toContain('Console')
      expect(html).not.toContain('data-part="console')
    })

    it('значения полей видны сразу, как только появилась строка поля', () => {
      expect(part(view(BR, PAGE_AT + MOTION.stagger * 2 + 1), 'field:Вес, кг')).not.toBeNull()
    })
  })

  describe('moments', () => {
    it('страница, её строки, action, сообщения консоли; по возрастанию, без повторов', () => {
      const m = def.moments(BR, CLOCK, ctx)
      expect(m).toEqual(expect.arrayContaining([0, PAGE_AT, PAGE_AT + MOTION.stagger, ACTION, CONSOLE, CONSOLE + MOTION.stagger, CONSOLE + 3 * MOTION.stagger]))
      expect(m).toEqual([...new Set(m)].sort((a, b) => a - b))
    })
  })

  describe('appears', () => {
    // Подсказка встаёт над полем: на action поле съезжает вниз, а кнопка «Ещё раз» есть только после action
    const moved: BrowserEvent = {
      id: 'moved',
      kind: 'browser',
      url: 'http://localhost:3000/',
      title: 'Тренировка',
      fields: [{ label: 'Вес, кг', value: '60' }],
      buttons: ['Сохранить', 'Ещё раз'],
      before: ['Тренировка', 'Вес, кг', 'Сохранить'],
      after: ['Тренировка', 'Сначала введите вес', 'Вес, кг', 'Сохранить', 'Ещё раз'],
      console: [],
      network: [],
      server: [],
    }
    const c2: FrameCtx = { ...ctx, find: makeFind([{ ...FIXTURE, events: [...FIXTURE.events, moved] }]) }
    const MOVED: BrowserSpec = { type: 'browser', session: S, event: 'moved', at: { page: 0, action: 1 } }

    it('поля и кнопки — с первого кадра проявления в очереди страницы, сообщения консоли — на своём кадре, панель — с первым', () => {
      const at = def.appears!(BR, CLOCK, ctx)
      // строки страницы идут очередью от at.page по MOTION.stagger (поле веса — вторая) и проявляются: на кадре начала непрозрачность 0
      expect(at.get('field:Вес, кг')).toBe(PAGE_AT + MOTION.stagger + 1)
      expect(at.get('field:Повторы')).toBe(PAGE_AT + 2 * MOTION.stagger + 1)
      expect(at.get('button:Сохранить подход')).toBe(PAGE_AT + 3 * MOTION.stagger + 1)
      expect(at.get('console:0')).toBe(CONSOLE)
      expect(at.get('console:3')).toBe(CONSOLE + 3 * MOTION.stagger)
      expect(at.get('console')).toBe(CONSOLE)
      // строка адреса и область страницы видны с начала сцены
      expect(at.has('url')).toBe(false)
      expect(at.has('page')).toBe(false)
    })

    it('поле, которое action сдвигает, — когда пошло на своё место; новая кнопка — когда начала проявляться после action', () => {
      const at = def.appears!(MOVED, CLOCK, c2)
      expect(at.get('field:Вес, кг')).toBe(ACTION + 1)
      expect(at.get('button:Ещё раз')).toBe(ACTION + 1)
    })

    it('совпадает с рисунком: за кадр до появления части её не видно (или она ещё на прежнем месте), на кадре появления — видно', () => {
      // группа части целиком, с открывающим тегом: прозрачность полей и кнопок стоит на нём
      const group = (html: string, name: string) => new RegExp(`<g data-part="${name.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}"[^>]*>.*?</g>`, 's').exec(html)?.[0] ?? null
      for (const [name, f] of def.appears!(BR, CLOCK, ctx)) {
        if (name === 'console') continue // панель с вкладкой видна всегда, её «появление» — первое сообщение
        expect(group(view(BR, f), name), `${name} на кадре ${f}`).not.toBeNull()
        expect(group(view(BR, f - 1), name), `${name} на кадре ${f - 1}`).toBeNull()
      }
      expect(group(view(BR, CONSOLE), 'console:0')).not.toBeNull()
      // сдвинутое поле: на кадре action ещё на прежнем месте (как до action), кадром позже уже едет; новая кнопка — кадром позже action
      const field = (f: number) => group(view(MOVED, f, CLOCK, c2), 'field:Вес, кг')
      expect(field(ACTION)).toBe(field(ACTION - 1))
      expect(field(ACTION + 1)).not.toBe(field(ACTION))
      expect(group(view(MOVED, ACTION, CLOCK, c2), 'button:Ещё раз')).toBeNull()
      expect(group(view(MOVED, ACTION + 1, CLOCK, c2), 'button:Ещё раз')).not.toBeNull()
    })
  })
})

describe('размер текста и безопасная область', () => {
  const specs: FrameSpec[] = [
    { type: 'agent', session: S, event: 'ag', mode: 'Manual', ask: ['fail'], diffLines: 2, at: { prompt: 0, steps: [1, 1, 2, 2, 3], reply: 4 } },
    { type: 'agent', session: S, event: 'ag', chat: true, at: { prompt: 0, steps: [], reply: 1 } },
    {
      type: 'gitlog',
      rows: ['c1', 'c2', 'c3', 'c4'].map((event, at) => ({ session: S, event, at })),
      heads: [{ at: 1, branch: 'main', commit: 'c2' }, { at: 2, branch: 'sets-form', commit: 'c3' }],
      dirty: { at: 3, until: 4, text: 'app/page.tsx' },
    },
    { type: 'browser', session: S, event: 'form', console: true, marks: [{ line: 'Вес должен быть числом, например 60', tone: 'err' }], at: { page: 0, action: 1, console: 2 } },
    { type: 'browser', session: S, event: 'form', at: { page: 0, action: 1 } },
  ]

  it('все font-size в разметке не меньше 24', () => {
    for (const [i, spec] of specs.entries()) {
      for (const frame of [0, 33, 60, 130, 230, 400, 560]) {
        const sizes = fontSizes(view(spec, frame))
        expect(sizes.length, `${spec.type}#${i} @${frame}`).toBeGreaterThan(0)
        expect(Math.min(...sizes), `${spec.type}#${i} @${frame}`).toBeGreaterThanOrEqual(MIN_TEXT)
      }
    }
  })

  it('линии не тоньше 2 px', () => {
    for (const spec of specs) {
      for (const frame of [60, 400, 560]) {
        for (const m of view(spec, frame).matchAll(/stroke-width="([\d.]+)"/g)) expect(Number(m[1])).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('все части layout внутри SAFE и у каждой есть положительный размер', () => {
    for (const spec of specs) {
      const layout = frameDef(spec).layout(spec, ctx)
      for (const [name, r] of Object.entries(layout)) {
        expect(inside(r), `${spec.type}:${name}`).toBe(true)
        expect(r.w, `${spec.type}:${name}`).toBeGreaterThan(0)
        expect(r.h, `${spec.type}:${name}`).toBeGreaterThan(0)
      }
    }
  })

  it('цвета в разметке — только из темы (и прозрачность от них)', () => {
    const allowed = new Set<string>([...Object.values(T).filter((v) => v.startsWith('#')).map((v) => v.toUpperCase()), 'none'])
    for (const spec of specs) {
      for (const frame of [60, 400, 560]) {
        const html = view(spec, frame)
        for (const m of html.matchAll(/(?:fill|stroke)="(#[0-9A-Fa-f]{3,8})"/g)) expect(allowed.has(m[1].toUpperCase()), `${spec.type}: ${m[1]}`).toBe(true)
      }
    }
  })
})
