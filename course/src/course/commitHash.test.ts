import { describe, expect, it } from 'vitest'
import { getDays } from '../content/load'
import { commitHash } from './commitHash'

const AT = '2026-10-20T09:15:00.000Z'

describe('commitHash', () => {
  it('7 шестнадцатеричных знаков, как короткий хеш git — у каждого дня курса', () => {
    for (const day of getDays()) {
      expect(commitHash(day.id, undefined)).toMatch(/^[0-9a-f]{7}$/)
      expect(commitHash(day.id, AT)).toMatch(/^[0-9a-f]{7}$/)
    }
  })

  it('ведущие нули не теряются: всё равно 7 знаков', () => {
    // для этого времени FNV-1a даёт 0x068e9abb — меньше 0x10000000
    expect(commitHash('day-01', '2026-10-20T09:00:06.000Z')).toBe('068e9ab')
  })

  it('стабильно: тот же день и то же время — тот же хеш, и между запусками тоже', () => {
    expect(commitHash('day-01', AT)).toBe(commitHash('day-01', AT))
    // закреплённые значения: смена расчёта поменяла бы хеши у всех учеников
    expect(commitHash('day-01', undefined)).toBe('ad8ada1')
    expect(commitHash('day-01', AT)).toBe('d853c13')
    expect(commitHash('day-02', undefined)).toBe('d38d548')
  })

  it('зависит от времени зачёта и от дня', () => {
    expect(commitHash('day-01', AT)).not.toBe(commitHash('day-01', undefined))
    expect(commitHash('day-01', AT)).not.toBe(commitHash('day-01', '2026-10-20T09:15:01.000Z'))
    expect(commitHash('day-01', AT)).not.toBe(commitHash('day-02', AT))
    // у дней курса без времени зачёта хеши не совпадают
    const hashes = getDays().map((d) => commitHash(d.id, undefined))
    expect(new Set(hashes).size).toBe(hashes.length)
  })
})
