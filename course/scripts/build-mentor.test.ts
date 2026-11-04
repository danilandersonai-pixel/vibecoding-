import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import day1 from '../content/days/day-01.json'
import day2 from '../content/days/day-02.json'
import day3 from '../content/days/day-03.json'
import day4 from '../content/days/day-04.json'
// @ts-expect-error — скрипт на чистом JS, типы не нужны
import { buildMentor } from './build-mentor.mjs'

describe('build-mentor', () => {
  const out = mkdtempSync(join(tmpdir(), 'mentor-'))
  buildMentor(join(__dirname, '..', 'content', 'days'), out)

  it('пишет чек-лист готового дня со всеми пунктами и вопросами', () => {
    const md = readFileSync(join(out, 'day-01.md'), 'utf8')
    expect(md).toContain('День 1')
    for (const c of day1.mentor.checklist) expect(md).toContain(c.text)
    for (const q of day1.mentor.questions) expect(md).toContain(q)
    expect(md).toContain('[auto: file]')
  })

  it('готовый день 2 получает свой чек-лист', () => {
    const md = readFileSync(join(out, 'day-02.md'), 'utf8')
    expect(md).toContain('# День 2 — Эталоны и спецификация')
    for (const c of day2.mentor.checklist) expect(md).toContain(c.text)
    for (const q of day2.mentor.questions) expect(md).toContain(q)
  })

  it('готовый день 3 получает свой чек-лист', () => {
    const md = readFileSync(join(out, 'day-03.md'), 'utf8')
    expect(md).toContain('# День 3 — Прототип экранов')
    for (const c of day3.mentor.checklist) expect(md).toContain(c.text)
    for (const q of day3.mentor.questions) expect(md).toContain(q)
  })

  it('готовый день 4 получает свой чек-лист с проверками rls, tests и secrets', () => {
    const md = readFileSync(join(out, 'day-04.md'), 'utf8')
    expect(md).toContain('# День 4 — Вход для двух ролей и защита данных')
    for (const c of day4.mentor.checklist) expect(md).toContain(c.text)
    for (const q of day4.mentor.questions) expect(md).toContain(q)
    for (const auto of ['file', 'rls', 'tests', 'secrets']) expect(md).toContain(`[auto: ${auto}]`)
  })

  // Дни 2–7 наполняются один за другим, поэтому черновики здесь — из недели 2
  it('для черновиков файлы не создаёт', () => {
    expect(existsSync(join(out, 'day-08.md'))).toBe(false)
    expect(existsSync(join(out, 'day-10.md'))).toBe(false)
  })
})
