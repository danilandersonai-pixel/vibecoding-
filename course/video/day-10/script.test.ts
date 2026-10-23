import { describe, expect, it } from 'vitest'
import { scriptProblems, stagingProblems } from '../kit/checks'
import { sceneStart } from '../lib/timeline'
import { ANNA_FRIDAY, ANNA_WEEK, JOURNAL, MISSED_WEEK, KOSTYA_LB, KOSTYA_RECORD, recordOf, toKg, volumeOf } from './layout'
import { day10Script, STAGING } from './script'

// Текст реплик сцены — для проверки, что нужные слова прозвучали.
function sceneText(id: string): string {
  const start = sceneStart(day10Script, id)
  const scene = day10Script.scenes.find((s) => s.id === id)
  const end = start + (scene?.durationInFrames ?? 0)
  return day10Script.cues
    .filter((c) => c.from >= start && c.to <= end)
    .map((c) => c.text)
    .join(' ')
    .toLowerCase()
}

describe('сценарий ролика дня 10 «Рекорды и отчёты»', () => {
  it('проходит проверки ролика дня', () => {
    expect(scriptProblems(day10Script, 'day')).toEqual([])
  })

  it('четыре сцены: понедельник тренера, что строим, подводный камень, проверьте у себя', () => {
    expect(day10Script.scenes.map((s) => s.id)).toEqual(['s1-monday', 's2-build', 's3-empty', 's4-check'])
  })

  it('вступление: Марина, неделя подопечных, рекорды, объём и отчёт — только «зачем», без определений и подводного камня', () => {
    const text = sceneText('s1-monday')
    for (const word of ['марина', 'анны и кости', 'личные рекорды', 'объём нагрузки', 'отчёт для тренера']) expect(text, word).toContain(word)
    for (const word of ['самый большой вес', 'повторы × вес', 'nan', 'фунт', 'пуст']) expect(text, word).not.toContain(word)
    expect(day10Script.cues.filter((c) => c.to <= day10Script.scenes[0].durationInFrames).length).toBeLessThanOrEqual(3)
  })

  it('что строим: рекорд и объём определены словами, расчёт пятницы Анны, отчёт за неделю', () => {
    const text = sceneText('s2-build')
    for (const word of ['решаете вы', 'самый большой вес', 'повторы × вес', '5 × 52,5', '3 × 55', '690 кг', 'новый рекорд', 'отчёт']) expect(text, word).toContain(word)
  })

  it('подводный камень: пустой вес даёт NaN, фунты — ложный рекорд, свой вес; правила, тесты до кода, без заплатки', () => {
    const text = sceneText('s3-empty')
    for (const word of ['пустое поле', 'nan', 'фунтах', '135 кг', '61,2 кг', '62,5', 'свой вес', 'правила', 'тестами до кода', 'заплатку']) expect(text, word).toContain(word)
  })

  it('проверьте у себя: тесты по правилам, обычный и странный ввод, сломать нарочно, неделя с пропуском', () => {
    const text = sceneText('s4-check')
    for (const word of ['проверьте у себя', 'тесты', 'обычный случай', 'пустой вес', 'фунтов', '«52,5»', 'нарочно', 'с пропуском', '2 из 3', '1440 кг']) expect(text, word).toContain(word)
  })

  it('горячих точек три — рекорд и объём, пустое поле и фунты, тесты на расчёт; у каждой короткое пояснение (до 350 знаков)', () => {
    expect(day10Script.hotspots.map((h) => h.title)).toEqual(['Рекорд и объём', 'Пустое поле и фунты', 'Тесты на расчёт'])
    for (const h of day10Script.hotspots) {
      expect(h.text.length, h.title).toBeGreaterThan(20)
      expect(h.text.length, h.title).toBeLessThanOrEqual(350)
    }
  })

  it('реплики помещаются в две строки субтитров', () => {
    for (const c of day10Script.cues) expect(c.text.length, c.text).toBeLessThanOrEqual(92)
  })

  it('Олег — подопечный Димы: у Марины здесь Костя — в репликах, точках и журнале Марины Олега нет', () => {
    const texts = [...day10Script.cues.map((c) => c.text), ...day10Script.hotspots.flatMap((h) => [h.title, h.text])]
    for (const t of texts) expect(t, t).not.toContain('Олег')
    expect(sceneText('s3-empty')).toContain('костя был в зале, где блины в фунтах')
    const journal = JOURNAL.map(([, text]) => text)
    for (const t of journal) expect(t, t).not.toContain('Олег')
    expect(journal.filter((t) => t.startsWith('Костя ·')).length).toBeGreaterThan(0)
  })

  it('переходы и камера на месте, окна горячих точек — на неподвижных кадрах, вне переходов, выше субтитров', () => {
    expect(stagingProblems(day10Script, STAGING)).toEqual([])
  })
})

// Числа на экране считаются из данных layout.ts — здесь проверяем, что они верны.
describe('расчёты ролика дня 10', () => {
  it('объём — сумма повторов × вес по подходам: пятница Анны — 690 кг', () => {
    expect(ANNA_FRIDAY.map((s) => s.reps * s.kg)).toEqual([262.5, 262.5, 165])
    expect(volumeOf(ANNA_FRIDAY)).toBe(690)
  })

  it('рекорд — самый большой вес в упражнении: 55 кг, прежний — 52,5', () => {
    expect(recordOf(ANNA_FRIDAY)).toBe(55)
    expect(recordOf([...ANNA_WEEK[0].sets, ...ANNA_WEEK[1].sets])).toBe(52.5)
  })

  it('неделя Анны по дням 750, 762,5 и 690 кг, всего 2202,5 кг', () => {
    expect(ANNA_WEEK.map((d) => volumeOf(d.sets))).toEqual([750, 762.5, 690])
    expect(ANNA_WEEK.reduce((sum, d) => sum + volumeOf(d.sets), 0)).toBe(2202.5)
  })

  it('неделя с пропуском: 2 тренировки из 3, объём 1440 кг', () => {
    const done = MISSED_WEEK.filter((d) => d.sets.length > 0)
    expect(done.length).toBe(2)
    expect(MISSED_WEEK.length).toBe(3)
    expect(done.reduce((sum, d) => sum + volumeOf(d.sets), 0)).toBe(1440)
  })

  it('135 фунтов ≈ 61,2 кг — меньше прежнего рекорда Кости 62,5 кг', () => {
    expect(Math.round(toKg(KOSTYA_LB, 'lb') * 10) / 10).toBe(61.2)
    expect(toKg(KOSTYA_LB, 'lb')).toBeLessThan(KOSTYA_RECORD)
  })

  it('пустой вес, прочитанный как число, даёт NaN, и сумма с ним — тоже NaN', () => {
    const empty = Number.parseFloat('')
    expect(Number.isNaN(empty)).toBe(true)
    expect(Number.isNaN(750 + 5 * empty)).toBe(true)
  })
})
