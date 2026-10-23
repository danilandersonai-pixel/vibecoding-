import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { checkContent } from '../content-check'

function fixture(days: Record<string, unknown>, figures: string[] = []) {
  const root = mkdtempSync(join(tmpdir(), 'content-'))
  mkdirSync(join(root, 'days'))
  mkdirSync(join(root, 'figures'))
  for (const [name, data] of Object.entries(days)) writeFileSync(join(root, 'days', name), typeof data === 'string' ? data : JSON.stringify(data))
  for (const f of figures) writeFileSync(join(root, 'figures', `${f}.svg`), '<svg/>')
  return root
}

const draft = { id: 'day-02', number: 2, week: 1, status: 'draft', title: 'Черновик', goal: 'Цель' }

describe('checkContent', () => {
  it('настоящее содержание курса проходит проверку', () => {
    expect(checkContent(join(__dirname, '..', 'content'))).toEqual([])
  })

  it('называет файл и поле с ошибкой схемы', () => {
    const errors = checkContent(fixture({ 'day-02.json': { ...draft, week: 9 } }))
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/day-02\.json.*week/)
  })

  it('битый JSON — ошибка, а не падение', () => {
    expect(checkContent(fixture({ 'day-02.json': '{не json' }))[0]).toMatch(/day-02\.json/)
  })

  it('ссылка на несуществующую схему книги — ошибка', () => {
    const day = { ...draft, blocks: [{ type: 'idea', id: 'i', title: 'Мысль', text: 'Текст', figure: 'нет_такой' }] }
    expect(checkContent(fixture({ 'day-02.json': day }, ['abc_restaurant']))[0]).toMatch(/нет_такой/)
    expect(checkContent(fixture({ 'day-02.json': { ...day, blocks: [{ ...day.blocks[0], figure: 'abc_restaurant' }] } }, ['abc_restaurant']))).toEqual([])
  })
})
