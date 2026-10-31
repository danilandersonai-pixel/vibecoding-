import { describe, expect, it, test } from 'vitest'
import type { FrameCtx } from '../frame'
import { monoChars } from '../text'
import { MONO, SAFE } from '../theme'
import { AGENDA, agendaLayout, agendaProblems, NAME_X, plan } from './agendaPlan'
import type { AgendaSpec } from './agendaPlan'
import { fitWidth } from './fit'
import { CLOCK, ctx } from './fixture'

// План ролика: кикер — название первой главы урока строкой Martian Mono 24 px над названием урока; в ширину SAFE он не переносится.
const SPEC: AgendaSpec = { type: 'agenda' }
const withFirst = (first: string): FrameCtx => ({ ...ctx, lesson: { ...ctx.lesson, chapters: [first, 'Четыре части приложения', 'Итог'] } })

describe('Agenda: кикер', () => {
  it('кикер «Что узнаете» помещается по ширине', () => {
    const p = plan(SPEC, withFirst('Что узнаете'), CLOCK)
    expect(p.kicker.text).toBe('Что узнаете')
    expect(p.kicker.w).toBeCloseTo([...'Что узнаете'].length * MONO.size * MONO.advance, 6)
    expect(p.kicker.w).toBeLessThanOrEqual(SAFE.w)
    expect(agendaProblems(SPEC, withFirst('Что узнаете'), CLOCK)).toEqual([])
    // во всю ширину SAFE — ещё помещается, на знак длиннее — проблема: кикер в одну строку, переноса у него нет
    const cols = monoChars(SAFE.w)
    expect(agendaProblems(SPEC, withFirst('к'.repeat(cols)), CLOCK)).toEqual([])
    const over = agendaProblems(SPEC, withFirst('к'.repeat(cols + 1)), CLOCK)
    expect(over).toHaveLength(1)
    expect(over[0]).toMatch(/^кикер «к+…»: шире строки \(\d+ px при 1728\)/)
  })
})

// Ролик дня: план перечисляет, что строим сегодня (items), а не главы урока. Номера — с 01; длинный пункт переносится по словам
// в ширину от NAME_X до правого края SAFE, не больше двух строк, и следующий пункт опускается на перенос.
describe('Agenda: пункты items', () => {
  const day: FrameCtx = { ...ctx, lesson: { ...ctx.lesson, title: 'Отзывы и фоновые агенты', chapters: ['Что строим сегодня', 'Пример', 'Подводный камень', 'Проверьте у себя'] } }
  const LONG = 'Задача агенту в четыре части: цель, контекст, ограничения и как проверить, что всё готово.'

  test('agenda: пункты items вместо глав — по порядку, номера 01…', () => {
    const items = ['Отзывы — в три стопки', 'Задача агенту', 'Приёмка']
    const p = plan({ type: 'agenda', items }, day, CLOCK)
    expect(p.items.map((i) => i.name)).toEqual(items)
    expect(p.items.map((i) => i.num)).toEqual(['01', '02', '03'])
    expect(p.items.map((i) => i.lines)).toEqual(items.map((i) => [i]))
    expect(p.kicker.text).toBe('Что строим сегодня')
    expect(p.problems).toEqual([])
    expect(Object.keys(agendaLayout({ type: 'agenda', items }, day)).sort()).toEqual(['frame', 'item:0', 'item:1', 'item:2'])
  })

  test('agenda: без items — главы урока без первой и последней, номера с 02, как раньше', () => {
    const five: FrameCtx = { ...ctx, lesson: { ...ctx.lesson, chapters: ['Что узнаете', 'Четыре части приложения', 'Git: история проекта', 'От компьютера к сайту', 'Итог'] } }
    const p = plan({ type: 'agenda' }, five, CLOCK)
    expect(p.items.map((i) => [i.num, i.name])).toEqual([
      ['02', 'Четыре части приложения'],
      ['03', 'Git: история проекта'],
      ['04', 'От компьютера к сайту'],
    ])
    // строки по одной, шаг — прежний: до 88 px
    expect(p.items.map((i) => i.lines.length)).toEqual([1, 1, 1])
    expect(p.items[1].y - p.items[0].y).toBe(p.pitch)
    expect(p.pitch).toBe(AGENDA.pitch.max)
  })

  test('agenda: длинный пункт переносится и не выходит за SAFE', () => {
    expect([...LONG].length).toBe(90)
    const spec: AgendaSpec = { type: 'agenda', items: ['Отзывы — в три стопки', LONG, 'Приёмка без чтения кода'] }
    const p = plan(spec, day, CLOCK)
    const long = p.items[1]
    expect(long.lines).toHaveLength(2)
    expect(long.lines.join(' ')).toBe(LONG)
    // строки выровнены по длине: последняя не короче 40 % первой (жадный перенос дал бы 78 + 11 знаков, висячий хвост)
    const [head, tail] = long.lines.map((l) => [...l].length)
    expect(tail).toBeGreaterThanOrEqual(0.4 * head)
    // каждая строка — от NAME_X и не дальше правого края SAFE (по ширине с запасом FIT), и часть — тоже
    for (const line of long.lines) expect(NAME_X + fitWidth(line, AGENDA.name.size)).toBeLessThanOrEqual(SAFE.x + SAFE.w)
    for (const it of p.items) expect(it.rect.x + it.rect.w).toBeLessThanOrEqual(SAFE.x + SAFE.w)
    expect(long.rect.h).toBe(2 * AGENDA.name.line)
    // шаг строк растёт на перенос: третий пункт ниже второго на шаг и ещё одну строку
    expect(long.y - p.items[0].y).toBe(p.pitch)
    expect(p.items[2].y - long.y).toBe(p.pitch + AGENDA.name.line)
    expect(p.group.y + p.group.h).toBe(p.items[2].y + AGENDA.name.line)
    expect(p.problems).toEqual([])
    expect(agendaProblems(spec, day, CLOCK)).toEqual([])
  })

  test('agenda: пункт в три строки — проблема', () => {
    const three = `${LONG} ${LONG}`
    const bad = agendaProblems({ type: 'agenda', items: ['Отзывы — в три стопки', three] }, day, CLOCK)
    expect(bad).toHaveLength(1)
    expect(bad[0]).toMatch(/^item:1 «Задача агенту.*…»: пункт занимает 3 строки, а можно не больше 2/)
  })

  test('agenda: at не по числу items — проблема', () => {
    const items = ['Отзывы — в три стопки', 'Задача агенту', 'Приёмка']
    const bad = agendaProblems({ type: 'agenda', items, at: [0, 1] }, day, CLOCK)
    expect(bad).toHaveLength(1)
    expect(bad[0]).toMatch(/^at: 2 реплик на 3 пунктов — у каждого пункта своя реплика/)
    expect(agendaProblems({ type: 'agenda', items, at: [0, 1, 2] }, day, CLOCK)).toEqual([])
  })

  test('agenda: пункт без текста — проблема', () => {
    const bad = agendaProblems({ type: 'agenda', items: ['Отзывы — в три стопки', '', '  '] }, day, CLOCK)
    expect(bad).toEqual([expect.stringMatching(/^item:1: пункт без текста/), expect.stringMatching(/^item:2: пункт без текста/)])
  })

  test('agenda: глава из нескольких слов в 85 знаков — две строки без проблемы; слово в 120 букв — шире строки', () => {
    const chapter = 'Как устроено приложение тренера: от кнопки на экране до записей в базе данных и назад'
    expect([...chapter].length).toBe(85)
    const two: FrameCtx = { ...ctx, lesson: { ...ctx.lesson, chapters: ['Что узнаете', chapter, 'Итог'] } }
    const p = plan({ type: 'agenda' }, two, CLOCK)
    expect(p.items[0].num).toBe('02')
    expect(p.items[0].lines).toHaveLength(2)
    expect(p.items[0].lines.join(' ')).toBe(chapter)
    expect(agendaProblems({ type: 'agenda' }, two, CLOCK)).toEqual([])
    const word: FrameCtx = { ...ctx, lesson: { ...ctx.lesson, chapters: ['Что узнаете', 'д'.repeat(120), 'Итог'] } }
    expect(agendaProblems({ type: 'agenda' }, word, CLOCK)).toEqual([expect.stringMatching(/^item:0 «д+…»: слово «д+…» шире строки \(\d+ px при 1728\)/)])
  })

  test('agenda: items без пунктов — проблема', () => {
    expect(agendaProblems({ type: 'agenda', items: [] }, day, CLOCK)).toEqual([expect.stringMatching(/^items: в плане нет ни одного пункта/)])
  })
})
