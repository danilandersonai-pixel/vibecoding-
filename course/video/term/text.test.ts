import { describe, expect, it } from 'vitest'
import { ch01Script } from '../lessons/ch-01/script'
import { chAbcScript } from '../lessons/ch-abc/script'
import { balanceText, fitText, monoChars, textWidth, wrapMono, wrapText } from './text'
import { GOLOS, MEASURED_ADVANCE, MEASURED_GOLOS, MONO, SUBS } from './theme'

describe('monoChars', () => {
  it('считает знаки Martian Mono по замеренной ширине знака', () => {
    expect(monoChars(1728)).toBe(Math.floor(1728 / (24 * MONO.advance)))
    expect(monoChars(1728, 32)).toBe(Math.floor(1728 / (32 * MONO.advance)))
  })

  it('ровно по ширине строки знаки помещаются, без запаса — нет', () => {
    const cell = 24 * MONO.advance
    expect(monoChars(cell * 10)).toBe(10)
    expect(monoChars(cell * 10 - 0.5)).toBe(9)
    expect(monoChars(0)).toBe(0)
  })
})

describe('wrapMono', () => {
  it('переносит по ширине: 25 знаков при 10 в строке — 10, 10 и 5', () => {
    expect(wrapMono('a'.repeat(25), 10).map((l) => l.length)).toEqual([10, 10, 5])
  })

  it('короткая строка остаётся одной, пустая — одной пустой, отступ не пропадает', () => {
    expect(wrapMono('ls -la', 10)).toEqual(['ls -la'])
    expect(wrapMono('', 10)).toEqual([''])
    expect(wrapMono('  ab', 10)).toEqual(['  ab'])
  })

  it('склейка строк даёт исходный текст', () => {
    const line = 'git commit -m "первое сохранение проекта" --no-verify'
    expect(wrapMono(line, 12).join('')).toBe(line)
  })

  it('ширина меньше одного знака не зацикливает перенос', () => {
    expect(wrapMono('abc', 0)).toEqual(['a', 'b', 'c'])
  })
})

describe('fitText', () => {
  it('обрезает с «…» так, чтобы вся строка была не длиннее maxChars', () => {
    expect(fitText('абвгде', 4)).toBe('абв…')
    expect(fitText('абвгде', 6)).toBe('абвгде')
    expect(fitText('абвгде', 5)).toBe('абвг…')
    expect(fitText('абвгде', 1)).toBe('…')
    expect(fitText('абвгде', 0)).toBe('')
  })
})

describe('textWidth и wrapText', () => {
  const REPLY = 'Кухня проверяет, что это Анна и что вес — число, и считает объём, а потом кладёт подход на склад и отправляет ответ назад.'

  it('ширина — число знаков на размер и среднюю ширину знака Golos Text', () => {
    expect(textWidth('', 40)).toBe(0)
    expect(textWidth('абвг', 40)).toBeCloseTo(4 * 40 * GOLOS.avg)
  })

  it('реплика из 120 знаков при 40 px и 1500 px — не больше двух строк', () => {
    const text = REPLY.slice(0, 120)
    expect(text).toHaveLength(120)
    const lines = wrapText(text, SUBS.size, SUBS.maxWidth)
    expect(lines.length).toBeLessThanOrEqual(2)
    for (const line of lines) expect(textWidth(line, SUBS.size)).toBeLessThanOrEqual(SUBS.maxWidth)
  })

  it('переносит по словам и ничего не теряет', () => {
    const lines = wrapText(REPLY, 40, 900)
    expect(lines.length).toBeGreaterThan(1)
    expect(lines.join(' ')).toBe(REPLY)
    for (const line of lines) expect(textWidth(line, 40)).toBeLessThanOrEqual(900)
  })

  it('слово шире строки режется по знакам, пустой текст — одна пустая строка', () => {
    const lines = wrapText('а'.repeat(100), 40, 400)
    expect(lines.length).toBeGreaterThan(1)
    for (const line of lines) expect(textWidth(line, 40)).toBeLessThanOrEqual(400)
    expect(lines.join('')).toBe('а'.repeat(100))
    expect(wrapText('', 40, 400)).toEqual([''])
  })

  it('все реплики роликов ch-abc и ch-01 (уроки «Репозиторий») при 40 px помещаются в две строки по 1500 px', () => {
    const cues = [...chAbcScript.cues, ...ch01Script.cues]
    expect(cues.length).toBeGreaterThan(80)
    const long = cues.filter((c) => wrapText(c.text, SUBS.size, SUBS.maxWidth).length > SUBS.maxLines)
    expect(long.map((c) => c.text)).toEqual([])
  })
})

describe('balanceText', () => {
  // Жадный перенос оставляет во второй строке одно слово: «терминал.»
  const WIDOW = 'Сервер запущен, страница открывается на localhost, и вывод идёт в терминал.'

  it('две строки выравниваются по длине: во второй строке не одно висячее слово', () => {
    const greedy = wrapText(WIDOW, SUBS.size, SUBS.maxWidth)
    expect(greedy).toHaveLength(2)
    expect(greedy[1].split(' ')).toHaveLength(1)
    const lines = balanceText(WIDOW, SUBS.size, SUBS.maxWidth)
    expect(lines).toHaveLength(2)
    expect(lines.join(' ')).toBe(WIDOW)
    expect(lines[1].split(' ').length).toBeGreaterThan(1)
    const [a, b] = lines.map((l) => [...l].length)
    expect(Math.abs(a - b)).toBeLessThanOrEqual(12)
    for (const line of lines) expect(textWidth(line, SUBS.size)).toBeLessThanOrEqual(SUBS.maxWidth)
  })

  it('строк столько же, сколько у жадного переноса: одна остаётся одной, три — тремя', () => {
    expect(balanceText('Коротко и ясно.', SUBS.size, SUBS.maxWidth)).toEqual(['Коротко и ясно.'])
    const three = 'Слово '.repeat(40).trim()
    expect(wrapText(three, SUBS.size, SUBS.maxWidth)).toHaveLength(4)
    expect(balanceText(three, SUBS.size, SUBS.maxWidth)).toHaveLength(4)
    expect(balanceText('', SUBS.size, SUBS.maxWidth)).toEqual([''])
  })
})

// Review Focus 5: константы не меньше замера (node scripts/measure-fonts.mjs) — иначе текст вылезет за окно.
describe('замер шрифтов', () => {
  it('ширина знака Martian Mono не меньше 0,6 em и не меньше замера', () => {
    expect(MONO.advance).toBeGreaterThanOrEqual(0.6)
    expect(MONO.advance).toBeGreaterThanOrEqual(MEASURED_ADVANCE)
    expect(MONO.advance - MEASURED_ADVANCE).toBeLessThan(0.01)
  })

  it('средняя ширина знака Golos Text не меньше замера и не больше его на 0,01 em', () => {
    expect(GOLOS.avg).toBeGreaterThanOrEqual(MEASURED_GOLOS)
    expect(GOLOS.avg - MEASURED_GOLOS).toBeLessThan(0.01)
  })
})
