import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import day1 from '../content/days/day-01.json'
import day2 from '../content/days/day-02.json'
import day3 from '../content/days/day-03.json'
import day4 from '../content/days/day-04.json'
import day5 from '../content/days/day-05.json'
import day6 from '../content/days/day-06.json'
import day7 from '../content/days/day-07.json'
// @ts-expect-error — скрипт на чистом JS, типы не нужны
import { buildMentor } from './build-mentor.mjs'

describe('build-mentor', () => {
  const daysDir = join(__dirname, '..', 'content', 'days')
  const out = mkdtempSync(join(tmpdir(), 'mentor-'))
  buildMentor(daysDir, out)

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

  it('готовый день 5 получает свой чек-лист с проверками tests, lint и file', () => {
    const md = readFileSync(join(out, 'day-05.md'), 'utf8')
    expect(md).toContain('# День 5 — Основной цикл тренировки')
    for (const c of day5.mentor.checklist) expect(md).toContain(c.text)
    for (const q of day5.mentor.questions) expect(md).toContain(q)
    for (const auto of ['tests', 'lint', 'file']) expect(md).toContain(`[auto: ${auto}]`)
  })

  it('готовый день 6 получает свой чек-лист с проверками secrets, tests и rls', () => {
    const md = readFileSync(join(out, 'day-06.md'), 'utf8')
    expect(md).toContain('# День 6 — График прогресса и безопасность')
    for (const c of day6.mentor.checklist) expect(md).toContain(c.text)
    for (const q of day6.mentor.questions) expect(md).toContain(q)
    for (const auto of ['secrets', 'tests', 'rls']) expect(md).toContain(`[auto: ${auto}]`)
  })

  it('готовый день 7 получает свой чек-лист с проверками file и tests', () => {
    const md = readFileSync(join(out, 'day-07.md'), 'utf8')
    expect(md).toContain('# День 7 — Публикация и первая проба')
    for (const c of day7.mentor.checklist) expect(md).toContain(c.text)
    for (const q of day7.mentor.questions) expect(md).toContain(q)
    for (const auto of ['file', 'tests']) expect(md).toContain(`[auto: ${auto}]`)
  })

  // Статусы — из самих файлов дней, как их читает скрипт: дни наполняются один за другим, и номера готовых дней не зашиты
  const ready = readdirSync(daysDir)
    .filter((f) => /^day-\d{2}\.json$/.test(f))
    .map((f) => JSON.parse(readFileSync(join(daysDir, f), 'utf8')) as { id: string; status: string })
    .filter((d) => d.status === 'ready')

  it('у каждого готового дня есть чек-лист', () => {
    expect(ready.length).toBeGreaterThan(0)
    for (const d of ready) expect(existsSync(join(out, `${d.id}.md`)), d.id).toBe(true)
  })

  // Папка дней подставная: готовый день 1 и черновик дня 21 — настоящих черновиков в курсе больше нет (день 21 готов).
  // У черновика всё содержание дня 1: файл решает статус, а не то, наполнен ли день
  it('для черновика файл не создаёт', () => {
    const fixtureDays = mkdtempSync(join(tmpdir(), 'mentor-days-'))
    const fixtureOut = mkdtempSync(join(tmpdir(), 'mentor-out-'))
    const draft = { ...day1, id: 'day-21', number: 21, week: 3, status: 'draft' }
    writeFileSync(join(fixtureDays, 'day-01.json'), JSON.stringify(day1))
    writeFileSync(join(fixtureDays, 'day-21.json'), JSON.stringify(draft))
    expect(buildMentor(fixtureDays, fixtureOut)).toEqual(['day-01.md'])
    expect(readdirSync(fixtureOut)).toEqual(['day-01.md'])
    expect(existsSync(join(fixtureOut, 'day-21.md'))).toBe(false)
  })
})
