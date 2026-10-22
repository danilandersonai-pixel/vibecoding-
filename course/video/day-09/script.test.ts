import { describe, expect, it } from 'vitest'
import { scriptProblems, stagingProblems } from '../kit/checks'
import { sceneStart } from '../lib/timeline'
import { CYCLE, TEST_CODE, TERM_RED } from './layout'
import { day09Script, STAGING } from './script'

// Текст реплик сцены (в нижнем регистре) — для проверки, что нужные слова прозвучали.
function sceneText(id: string): string {
  const start = sceneStart(day09Script, id)
  const scene = day09Script.scenes.find((s) => s.id === id)
  const end = start + (scene?.durationInFrames ?? 0)
  return day09Script.cues
    .filter((c) => c.from >= start && c.to <= end)
    .map((c) => c.text)
    .join(' ')
    .toLowerCase()
}

describe('сценарий ролика дня 9 «Программы тренировок»', () => {
  it('проходит проверки ролика дня', () => {
    expect(scriptProblems(day09Script, 'day')).toEqual([])
  })

  it('три сцены: что строим сегодня, подводный камень, проверьте у себя', () => {
    expect(day09Script.scenes.map((s) => s.id)).toEqual(['s1-build', 's2-pitfall', 's3-check'])
  })

  it('что строим: библиотека упражнений, шаблон, цикл по неделям, назначение и модель данных', () => {
    const text = sceneText('s1-build')
    for (const word of ['библиотека упражнений', 'шаблон', 'цикл по неделям', 'назначает', 'модель данных', 'ссылается', 'копию']) expect(text, word).toContain(word)
  })

  it('подводный камень: правка шаблона меняет прошлую тренировку; ссылка, каскад, копия и версии', () => {
    const text = sceneText('s2-pitfall')
    for (const word of ['правит шаблон', 'прошлую неделю', 'ссылка', 'каскадном удалении', 'копию плана', 'версии', 'решаете вы']) expect(text, word).toContain(word)
  })

  it('проверьте у себя: правка и удаление в шаблоне, тест на тестовой базе, поломка нарочно', () => {
    const text = sceneText('s3-check')
    for (const word of ['проверьте у себя', 'прежней', 'на месте', 'тестом', 'тестовой базе', 'из требования', 'сломайте нарочно', 'покраснел', 'зелёный']) expect(text, word).toContain(word)
  })

  it('цикл по неделям: подходов поровну, повторов от недели к неделе меньше', () => {
    expect(CYCLE.map((w) => w.week)).toEqual(['Н1', 'Н2', 'Н3', 'Н4'])
    for (let i = 1; i < CYCLE.length; i++) {
      expect(CYCLE[i].sets).toBe(CYCLE[0].sets)
      expect(CYCLE[i].reps).toBeLessThan(CYCLE[i - 1].reps)
    }
  })

  it('код теста и вывод терминала: строки не длиннее 40 знаков, тест ждёт прежний план, а красный прогон показывает новый', () => {
    for (const line of [...TEST_CODE, ...TERM_RED.map((l) => l.text)]) expect(line.length, line).toBeLessThanOrEqual(40)
    expect(TEST_CODE.join('\n')).toContain("toBe('Жим лёжа 3×10')")
    expect(TEST_CODE.join('\n')).toContain("'Жим гантелей 3×12'")
    expect(TERM_RED.map((l) => l.text).join('\n')).toContain("Received: 'Жим гантелей 3×12'")
  })

  it('горячих точек пять, у каждой пояснение не длиннее 350 знаков', () => {
    expect(day09Script.hotspots.map((h) => h.title)).toEqual(['Программа тренировок', 'Модель данных', 'Ссылка вместо копии', 'Копия или версия', 'Тест на историю'])
    for (const h of day09Script.hotspots) {
      expect(h.text.length, h.title).toBeGreaterThan(20)
      expect(h.text.length, h.title).toBeLessThanOrEqual(350)
    }
  })

  it('реплики помещаются в две строки субтитров', () => {
    for (const c of day09Script.cues) expect(c.text.length, c.text).toBeLessThanOrEqual(96)
  })

  it('переходы и камера на месте, окна горячих точек — на неподвижных кадрах, вне переходов, выше субтитров', () => {
    expect(stagingProblems(day09Script, STAGING)).toEqual([])
  })
})
