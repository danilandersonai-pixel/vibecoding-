import { describe, expect, it } from 'vitest'
import type { FrameCtx } from '../frame'
import { SAFE } from '../theme'
import { CLOCK, ctx } from './fixture'
import { plan, recapLayout, recapProblems } from './recapPlan'
import type { RecapSpec } from './recapPlan'

// Итог: блок книги стоит у нижнего края SAFE и растёт вверх — с длинным списком разделов он может уйти выше SAFE, под шапку.
const withBook = (book: string[]): FrameCtx => ({ ...ctx, lesson: { ...ctx.lesson, book } })
const SEVEN: RecapSpec = { type: 'recap', items: Array.from({ length: 7 }, (_, i) => ({ text: `Вывод ${i + 1}: короткая строка итога`, at: Math.min(i, 5) })) }

describe('Recap: блок книги', () => {
  it('блок книги не выходит выше SAFE при семи выводах', () => {
    // шесть разделов Азбуки, как у ролика ch-abc: абзацем («Азбука», под ней названия через « · ») — под семью выводами и внутри SAFE
    const abc = withBook(['sa1', 'sa2', 'sa3', 'sa4', 'sa5', 'sa6'])
    const layout = recapLayout(SEVEN, abc)
    expect(layout.book.y).toBeGreaterThanOrEqual(SAFE.y)
    expect(layout.book.y + layout.book.h).toBeCloseTo(SAFE.y + SAFE.h, 6)
    expect(layout['item:6'].y + layout['item:6'].h).toBeLessThanOrEqual(layout.book.y)
    expect(recapProblems(SEVEN, abc, CLOCK)).toEqual([])

    // одиннадцать разделов главы 1, как у ch-01: блок книги в SAFE, а семь выводов над ним не помещаются — это проблема пунктов
    const ch1 = withBook(['s5', 's6', 's7', 's8', 's9', 's10', 's11', 's12', 's77', 's78', 's79'])
    expect(recapLayout(SEVEN, ch1).book.y).toBeGreaterThanOrEqual(SAFE.y)
    expect(recapProblems(SEVEN, ch1, CLOCK)).toEqual([expect.stringMatching(/^не помещается: пункты доходят до y \d+, а блок книги начинается с y \d+/)])

    // двадцать разделов четырнадцати глав вперемешку (подряд из одной главы нет — абзацами не сжать): по строке на раздел, выше SAFE
    const chapters = ['s1', 'sa1', 's5', 's14', 's21', 's24', 's29', 's36', 's42', 's48', 's57', 's62', 's70', 's84']
    const huge = withBook([...chapters, 's2', 'sa2', 's6', 's15', 's22', 's25'])
    const p = plan(SEVEN, huge, CLOCK)
    expect(p.book!.sections).toHaveLength(20)
    expect(p.book!.y).toBeLessThan(SAFE.y)
    const bad = recapProblems(SEVEN, huge, CLOCK)
    expect(bad).toHaveLength(1)
    expect(bad[0]).toMatch(/^не помещается: блок книги выходит выше SAFE — его верх на y -?\d+, а SAFE начинается с y 96/)
  })
})
