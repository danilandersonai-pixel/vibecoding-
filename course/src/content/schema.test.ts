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

  it('отклоняет карточку сортировки с несуществующей корзиной', () => {
    const day = clone(validDay)
    const sort = day.blocks.find((b) => 'kind' in b && b.kind === 'sort')! as { items: { bucket: string }[] }
    sort.items[0].bucket = 'нет-такой'
    const r = DaySchema.safeParse(day)
    expect(r.success).toBe(false)
    expect(r.error!.issues.some((i) => i.path.includes('bucket'))).toBe(true)
  })

  it('отклоняет «найди ошибку» с номером строки за концом кода', () => {
    const day = clone(validDay)
    const bug = day.blocks.find((b) => 'kind' in b && b.kind === 'find-the-bug')! as { bugLines: number[]; lines: string[] }
    bug.bugLines = [bug.lines.length]
    expect(DaySchema.safeParse(day).success).toBe(false)
  })

  it('принимает черновик только с обязательными полями', () => {
    const r = DaySchema.safeParse({ id: 'day-10', number: 10, week: 2, status: 'draft', title: 'Черновик', goal: 'Цель' })
    expect(r.success).toBe(true)
    expect(r.data!.quiz).toEqual([])
    expect(r.data!.weekTest).toEqual([])
    expect(r.data!.minutes).toEqual({ theory: 0, practice: 0 })
  })
})

describe('DaySchema: итоговый тест недели (weekTest)', () => {
  // Последний день недели 1 — день 7; вопросы теста недели того же вида, что и вопросы теста дня
  const question = (n: number) => ({ id: `w${n}`, question: `Вопрос недели ${n}`, options: ['а', 'б', 'в'], correct: n % 3, explanation: 'Глава 1' })
  const lastDayOfWeek = (count: number) => ({ ...clone(validDay), id: 'day-07', number: 7, week: 1, weekTest: Array.from({ length: count }, (_, i) => question(i + 1)) })

  it('у дня 7 тест недели из 8–12 вопросов проходит схему и сохраняется', () => {
    for (const count of [8, 10, 12]) {
      const r = DaySchema.safeParse(lastDayOfWeek(count))
      expect(r.success, JSON.stringify(r.error?.issues)).toBe(true)
      expect(r.data!.weekTest).toHaveLength(count)
    }
  })

  it('отклоняет номер верного ответа, равный числу вариантов, и указывает путь weekTest', () => {
    const day = lastDayOfWeek(10)
    day.weekTest[3].correct = day.weekTest[3].options.length
    const r = DaySchema.safeParse(day)
    expect(r.success).toBe(false)
    expect(r.error!.issues.map((i) => i.path)).toEqual([['weekTest', 3, 'correct']])
  })

  it('отклоняет тест недели не в последнем дне недели', () => {
    // valid-day — день 9 недели 2: последний день недели 2 — 14
    for (const day of [{ ...clone(validDay), weekTest: [question(1)] }, { ...lastDayOfWeek(10), id: 'day-06', number: 6 }]) {
      const r = DaySchema.safeParse(day)
      expect(r.success).toBe(false)
      expect(r.error!.issues).toEqual([expect.objectContaining({ path: ['weekTest'], message: 'Итоговый тест недели — только в последнем дне недели' })])
    }
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
