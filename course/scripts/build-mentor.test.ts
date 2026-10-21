import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import day1 from '../content/days/day-01.json'
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

  it('для черновиков файлы не создаёт', () => {
    expect(existsSync(join(out, 'day-02.md'))).toBe(false)
    expect(existsSync(join(out, 'day-04.md'))).toBe(false)
  })
})
