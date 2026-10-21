import { describe, expect, it } from 'vitest'
import { DaySchema } from './schema'
import validDay from './fixtures/valid-day.json'

const files = import.meta.glob('../../content/days/*.json', { eager: true, import: 'default' })

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))

describe('DaySchema', () => {
  it('принимает правильный день со всеми типами блоков', () => {
    expect(DaySchema.safeParse(validDay).success).toBe(true)
  })

  it('отклоняет готовый день с 4 вопросами теста и указывает путь quiz', () => {
    const day = clone(validDay)
    day.quiz = day.quiz.slice(0, 4)
    const r = DaySchema.safeParse(day)
    expect(r.success).toBe(false)
    expect(r.error!.issues.some((i) => i.path[0] === 'quiz')).toBe(true)
  })

  it('отклоняет номер верного ответа вне вариантов', () => {
    const day = clone(validDay)
    day.quiz[0].correct = 5
    expect(DaySchema.safeParse(day).success).toBe(false)
  })

  it('отклоняет ситуацию со ссылкой на несуществующий узел', () => {
    const day = clone(validDay)
    const sc = day.blocks.find((b) => b.type === 'scenario')! as { nodes: Record<string, { choices: { next: string }[] }> }
    sc.nodes.n1.choices[0].next = 'нет-такого'
    expect(DaySchema.safeParse(day).success).toBe(false)
  })

  it('принимает черновик только с обязательными полями', () => {
    const r = DaySchema.safeParse({ id: 'day-10', number: 10, week: 2, status: 'draft', title: 'Черновик', goal: 'Цель' })
    expect(r.success).toBe(true)
    expect(r.data!.quiz).toEqual([])
    expect(r.data!.minutes).toEqual({ theory: 0, practice: 0 })
  })
})

describe('файлы content/days', () => {
  it('есть хотя бы один файл дня', () => {
    expect(Object.keys(files).length).toBeGreaterThan(0)
  })

  for (const [path, data] of Object.entries(files)) {
    it(`${path} проходит схему`, () => {
      const r = DaySchema.safeParse(data)
      expect(r.success, JSON.stringify(r.error?.issues)).toBe(true)
    })
  }

  it('номера дней уникальны и id совпадает с номером', () => {
    const days = Object.values(files).map((d) => DaySchema.parse(d))
    const numbers = days.map((d) => d.number)
    expect(new Set(numbers).size).toBe(numbers.length)
    for (const d of days) expect(d.id).toBe(`day-${String(d.number).padStart(2, '0')}`)
  })
})
