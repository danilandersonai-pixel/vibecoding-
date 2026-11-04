import { expect, it } from 'vitest'
import { chapterIndexAt, clock } from './chapters'

const chapters = [
  { from: 0, title: 'А' },
  { from: 300, title: 'Б' },
  { from: 900, title: 'В' },
]

it('кадр принадлежит последней главе, начавшейся не позже него; кадр начала главы — уже в ней', () => {
  expect([0, 1, 299, 300, 899, 900, 5000].map((f) => chapterIndexAt(chapters, f))).toEqual([0, 0, 0, 1, 1, 2, 2])
})

it('кадр раньше первой главы относится к первой, а без глав номера нет', () => {
  expect(chapterIndexAt([{ from: 60, title: 'А' }], 10)).toBe(0)
  expect(chapterIndexAt([], 10)).toBe(-1)
})

it('время «м:сс» — целые прошедшие секунды', () => {
  expect([0, 29, 30, 1799, 1800, 4200, 7788].map((f) => clock(f, 30))).toEqual(['0:00', '0:00', '0:01', '0:59', '1:00', '2:20', '4:19'])
})
