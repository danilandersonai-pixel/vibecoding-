import { describe, expect, it } from 'vitest'
import type { FrameCtx } from '../frame'
import { monoChars } from '../text'
import { MONO, SAFE } from '../theme'
import { agendaProblems, plan } from './agendaPlan'
import type { AgendaSpec } from './agendaPlan'
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
