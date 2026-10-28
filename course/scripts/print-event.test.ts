import { describe, expect, it } from 'vitest'
import { makeFind } from '../video/sessions/types'
import { FRAMES } from '../video/term/frames'
import { FIXTURE, ctx } from '../video/term/frames/fixture'
// @ts-expect-error — скрипт на чистом JS, типы не нужны
import { formatEvent, loadRecord, listEvents } from './print-event.mjs'

const event = (id: string) => FIXTURE.events.find((e) => e.id === id)!

describe('formatEvent', () => {
  it('run: заголовок и вывод с номерами строк с 1 (по ним задаётся lines у Terminal)', () => {
    const lines: string[] = formatEvent(event('fail'))
    expect(lines[0]).toContain('fail')
    expect(lines[0]).toContain('npm test')
    expect(lines).toContain('1  > trainer-app@0.1.0 test')
    expect(lines).toContain('3  Ошибка: вес должен быть числом')
  })

  it('номера выравниваются по ширине самого большого', () => {
    const lines: string[] = formatEvent(event('many'))
    expect(lines).toContain(' 1  строка 1')
    expect(lines).toContain('40  строка 40')
  })

  it('browser: строки server', () => {
    const lines: string[] = formatEvent(event('save'))
    expect(lines).toContain('3   POST /api/sets 400 in 10ms')
  })

  it('commit: вывод коммита', () => {
    expect(formatEvent(event('c1')).join('\n')).toContain('1  [main abc1234] Первое сохранение')
  })

  it('file: дифф с номерами от первой «@@» (lines и highlight у Diff) и файл после правки (lines и highlight у Editor)', () => {
    const text: string = formatEvent(event('page')).join('\n')
    expect(text).toContain('+3 −1')
    // дифф: 1 — «@@», дальше строки как в записи со знаком в первой колонке
    expect(text).toMatch(/^ ?1 @@ -1,6 \+1,8 @@$/m)
    expect(text).toMatch(/^ ?5 \+  \/\/ вес в килограммах$/m)
    expect(text).toMatch(/^ ?7 -  return null$/m)
    // файл: номера строк файла, новые строки диффа помечены плюсом
    expect(text).toMatch(/^4 \+  \/\/ вес в килограммах$/m)
    expect(text).toMatch(/^5    const \[weight, setWeight\] = useState\(''\)$/m)
    expect(text).toMatch(/^8 {2}\}$/m)
  })

  it('read: текст файла с номерами строк', () => {
    const lines: string[] = formatEvent(event('pkg'))
    expect(lines).toContain('2    "name": "trainer-app",')
    expect(lines.join('\n')).not.toContain('+')
  })

  it('agent: нечего нумеровать — говорит об этом', () => {
    expect(formatEvent(event('ask')).join('\n')).toMatch(/нет строк/)
  })
})

describe('номера из печати совпадают с теми, по которым кадры выбирают строки', () => {
  const numberOf = (text: string, needle: string, from = 0) => {
    const rows = text.split('\n').slice(from)
    const row = rows.find((r) => r.includes(needle))!
    return Number(/^\s*(\d+)/.exec(row)![1])
  }

  it('Terminal.lines', () => {
    const n = numberOf(formatEvent(event('save')).join('\n'), 'POST /api/sets')
    const spec = { type: 'terminal' as const, items: [{ session: 'fixture', event: 'save', at: 0, lines: [n, n] as [number, number] }] }
    expect(FRAMES.terminal.problems(spec, ctx, { beat: (i) => 30 + i * 90, duration: 300, lines: 2 })).toEqual([])
    expect(Object.keys(FRAMES.terminal.layout(spec, ctx))).toContain('line:save:0')
    expect(n).toBe(3)
  })

  it('Diff.lines: номер строки «+» — та же строка в показанном диффе', () => {
    const printed = formatEvent(event('page')).join('\n')
    const n = numberOf(printed, '+  const [error')
    expect(n).toBe(8)
    const spec = { type: 'diff' as const, items: [{ session: 'fixture', event: 'page', at: 0, lines: [n, n] as [number, number] }] }
    expect(FRAMES.diff.problems(spec, ctx, { beat: (i) => 30 + i * 90, duration: 300, lines: 2 })).toEqual([])
    expect(Object.keys(FRAMES.diff.layout(spec, ctx))).toContain('line:page:0')
  })

  it('Editor.lines: номер строки файла', () => {
    const printed = formatEvent(event('page')).join('\n')
    const n = numberOf(printed, 'const [error', printed.split('\n').findIndex((r) => r.includes('файл')))
    expect(n).toBe(6)
    const spec = { type: 'editor' as const, session: 'fixture', event: 'page', lines: [n, n] as [number, number] }
    expect(Object.keys(FRAMES.editor.layout(spec, ctx))).toContain('line:6')
  })
})

describe('loadRecord и listEvents', () => {
  it('читает настоящую запись по id сессии', () => {
    const record = loadRecord('s02-sets')
    expect(record.id).toBe('s02-sets')
    const dev = record.events.find((e: { id: string }) => e.id === 'dev')
    expect(formatEvent(dev).join('\n')).toContain('8  ✓ Ready in 493ms')
    expect(makeFind([record])('s02-sets', 'dev', 'run').cmd).toBe('npm run dev')
  })

  it('нет такой сессии — понятная ошибка со списком записей', () => {
    expect(() => loadRecord('s99-нет')).toThrow(/s02-sets/)
  })

  it('listEvents: id, вид и подсказка для каждого события сессии', () => {
    const lines: string[] = listEvents(loadRecord('s02-sets'))
    expect(lines.some((l) => l.includes('dev') && l.includes('run'))).toBe(true)
    expect(lines.some((l) => l.includes('save-bad') && l.includes('browser'))).toBe(true)
  })
})
