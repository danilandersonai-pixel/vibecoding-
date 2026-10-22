import { describe, expect, it } from 'vitest'
import { scriptProblems, stagingProblems } from '../kit/checks'
import { sceneStart } from '../lib/timeline'
import {
  ACCESS,
  dayTotal,
  EMPTY_WEEK,
  FAT_KCAL,
  kcalOf,
  KJ_PER_KCAL,
  looksLikeKj,
  MAX_KCAL_PER_100,
  OATS,
  OATS_KJ,
  parseGrams,
  portion,
  rowsRounded,
  ru,
  TARGETS,
  TESTS,
  TUESDAY,
  TUESDAY_KJ,
  TUESDAY_PER100,
  WEEK,
  weekAverage,
} from './layout'
import { day16Script, STAGING } from './script'

// Текст реплик сцены — для проверки, что нужные слова прозвучали.
function sceneText(id: string): string {
  const start = sceneStart(day16Script, id)
  const scene = day16Script.scenes.find((s) => s.id === id)
  const end = start + (scene?.durationInFrames ?? 0)
  return day16Script.cues
    .filter((c) => c.from >= start && c.to <= end)
    .map((c) => c.text)
    .join(' ')
    .toLowerCase()
}

describe('сценарий ролика дня 16 «Питание»', () => {
  it('проходит проверки ролика дня', () => {
    expect(scriptProblems(day16Script, 'day')).toEqual([])
  })

  it('три сцены: что строим сегодня, подводный камень, проверьте у себя', () => {
    expect(day16Script.scenes.map((s) => s.id)).toEqual(['s1-build', 's2-units', 's3-check'])
  })

  it('что строим: цели КБЖУ от Марины, дневник Анны с порцией по этикетке, сводка за неделю, доступ только своим', () => {
    const text = sceneText('s1-build')
    for (const word of ['цели тренера', 'дневник', 'сводка', 'марина', 'анне', 'кбжу', 'на 100 граммов', '60 граммов', '350 ккал', '210 ккал', '1456 ккал', '1500', 'за неделю', 'данные о здоровье', 'только анна и её тренер', 'диме']) expect(text, word).toContain(word)
  })

  it('подводный камень: на 100 г против порции, килоджоули, округление строк против итога; правила решаете вы', () => {
    const text = sceneText('s2-units')
    for (const word of ['подводный камень', 'единицы и округления', 'тихо портит', '«ккал»', 'по 100 граммов', '1159 ккал', '1456', 'килоджоули', '1464', 'кдж', '878 ккал', 'перебор', 'округляет', 'в каждой строке', '110 граммов', 'точные числа', '109,4', '«не добрала»', 'правила решаете вы', 'единица', '900 ккал', 'чистый жир', 'переспросите', 'один раз', 'одной функцией']) expect(text, word).toContain(word)
  })

  it('проверьте у себя: тесты по правилам до кода — обычный, странный и пустой ввод, совпадение итогов, чужой тренер', () => {
    const text = sceneText('s3-check')
    for (const word of ['проверьте у себя', 'тесты', 'по этим правилам', 'до кода', 'обычный случай', '210 ккал', 'странный ввод', '«52,5»', 'запятой', '52,5 грамма', '1464', '«это кдж?»', 'совпасть', 'пустой ввод', '«нет записей»', 'по шести дням', 'дима', 'олега', 'дневник анны']) expect(text, word).toContain(word)
  })

  it('горячих точек четыре — порция, килоджоули, два итога, тесты; у каждой короткое пояснение (до 350 знаков)', () => {
    expect(day16Script.hotspots.map((h) => h.title)).toEqual(['Порция по этикетке', 'Килоджоули вместо калорий', 'Один день — два итога', 'Тесты на расчёт'])
    for (const h of day16Script.hotspots) {
      expect(h.text.length, h.title).toBeGreaterThan(20)
      expect(h.text.length, h.title).toBeLessThanOrEqual(350)
    }
  })

  it('реплики помещаются в две строки субтитров и обходятся без латиницы', () => {
    for (const c of day16Script.cues) {
      expect(c.text.length, c.text).toBeLessThanOrEqual(92)
      expect(/[A-Za-z]/.test(c.text), c.text).toBe(false)
    }
  })

  it('переходы и камера на месте, окна горячих точек — на неподвижных кадрах, вне переходов, выше субтитров', () => {
    expect(stagingProblems(day16Script, STAGING)).toEqual([])
  })
})

// Числа на экране считаются из данных layout.ts — здесь проверяем, что они верны.
describe('расчёты ролика дня 16', () => {
  it('порция = значение на 100 г × граммы / 100: 60 г овсянки — 210 ккал и 7,2 г белка', () => {
    expect(portion(OATS.kcal, 60)).toBe(210)
    expect(portion(OATS.protein, 60)).toBeCloseTo(7.2, 10)
  })

  it('у каждого продукта и у целей калории сходятся с белками, жирами и углеводами (4, 9 и 4 ккал на грамм)', () => {
    for (const f of TUESDAY) expect(kcalOf(f.per100), f.name).toBe(f.per100.kcal)
    expect(kcalOf(TARGETS)).toBe(TARGETS.kcal)
    expect(TARGETS).toEqual({ kcal: 1500, protein: 110, fat: 60, carbs: 130 })
  })

  it('вторник Анны: строки 210, 186, 252, 335, 242, 231 — итог 1456 ккал (точно 1455,9), строки и итог сходятся', () => {
    expect(TUESDAY.map((f) => Math.round(portion(f.per100.kcal, f.grams)))).toEqual([210, 186, 252, 335, 242, 231])
    expect(ru(dayTotal(TUESDAY, 'kcal'))).toBe('1455,9')
    expect(Math.round(dayTotal(TUESDAY, 'kcal'))).toBe(1456)
    expect(rowsRounded(TUESDAY, 'kcal')).toBe(1456)
  })

  it('белок вторника: по строкам с округлением 7 + 16 + 10 + 34 + 34 + 9 = 110, точно 109,4 → 109 — цель 110 «выполнена» и «не добрала»', () => {
    expect(TUESDAY.map((f) => Math.round(portion(f.per100.protein, f.grams)))).toEqual([7, 16, 10, 34, 34, 9])
    expect(TUESDAY.map((f) => ru(portion(f.per100.protein, f.grams)))).toEqual(['7,2', '15,6', '9,6', '34', '34', '9'])
    expect(rowsRounded(TUESDAY, 'protein')).toBe(110)
    expect(ru(dayTotal(TUESDAY, 'protein'))).toBe('109,4')
    expect(Math.round(dayTotal(TUESDAY, 'protein'))).toBe(109)
    expect(rowsRounded(TUESDAY, 'protein')).toBeGreaterThanOrEqual(TARGETS.protein)
    expect(dayTotal(TUESDAY, 'protein')).toBeLessThan(TARGETS.protein)
  })

  it('число с этикетки вместо порции: будто по 100 г каждого — 1159 ккал вместо 1456', () => {
    expect(TUESDAY_PER100.map((f) => f.per100.kcal)).toEqual([350, 155, 105, 197, 121, 231])
    expect(TUESDAY_PER100.reduce((sum, f) => sum + f.per100.kcal, 0)).toBe(1159)
  })

  it('килоджоули: 350 ккал × 4,184 ≈ 1464 кДж; 1464 в поле «ккал» даёт овсянке 878 ккал, дню — 2124', () => {
    expect(KJ_PER_KCAL).toBe(4.184)
    expect(OATS_KJ).toBe(1464)
    expect(Math.round(portion(OATS_KJ, 60))).toBe(878)
    expect(Math.round(dayTotal(TUESDAY_KJ, 'kcal'))).toBe(2124)
    expect(rowsRounded(TUESDAY_KJ, 'kcal')).toBe(2124)
  })

  it('больше 900 ккал на 100 г не бывает: 9 ккал в грамме чистого жира; 1464 — повод спросить, 350 и 900 — нет', () => {
    expect(MAX_KCAL_PER_100).toBe(FAT_KCAL * 100)
    expect(MAX_KCAL_PER_100).toBe(900)
    expect(looksLikeKj(OATS_KJ)).toBe(true)
    expect(looksLikeKj(OATS.kcal)).toBe(false)
    expect(looksLikeKj(900)).toBe(false)
  })

  it('«52,5» с запятой — 52,5 г и 184 ккал овсянки; parseFloat отрезал бы до 52 (182 ккал), Number дал бы NaN', () => {
    expect(parseGrams('52,5')).toBe(52.5)
    expect(parseGrams('60')).toBe(60)
    expect(Math.round(portion(OATS.kcal, parseGrams('52,5')))).toBe(184)
    expect(Number.parseFloat('52,5')).toBe(52)
    expect(Math.round(portion(OATS.kcal, 52))).toBe(182)
    expect(Number.isNaN(Number('52,5'))).toBe(true)
  })

  it('сводка недели: вторник — тот же итог, что в дневнике; в среднем 1489 ккал и 107 г белка', () => {
    expect(WEEK[1]).toEqual({ day: 'Вт', kcal: dayTotal(TUESDAY, 'kcal'), protein: dayTotal(TUESDAY, 'protein') })
    expect(WEEK.map((d) => (d.kcal === null ? null : Math.round(d.kcal)))).toEqual([1512, 1456, 1468, 1531, 1390, 1623, 1440])
    expect(Math.round(weekAverage(WEEK, 'kcal') ?? 0)).toBe(1489)
    expect(Math.round(weekAverage(WEEK, 'protein') ?? 0)).toBe(107)
  })

  it('неделя с пустым четвергом: среднее по 6 дням — 1482 ккал, с нулём за четверг вышло бы 1270', () => {
    expect(EMPTY_WEEK[3].kcal).toBeNull()
    expect(EMPTY_WEEK.filter((d) => d.kcal !== null).length).toBe(6)
    expect(Math.round(weekAverage(EMPTY_WEEK, 'kcal') ?? 0)).toBe(1482)
    expect(Math.round(EMPTY_WEEK.reduce((sum, d) => sum + (d.kcal ?? 0), 0) / 7)).toBe(1270)
    expect(weekAverage(EMPTY_WEEK.map((d) => ({ ...d, kcal: null, protein: null })), 'kcal')).toBeNull()
  })

  it('дневник Анны видят только Анна и её тренер Марина; Дима видит дневник Олега', () => {
    expect(ACCESS.anna).toEqual(['Анна', 'Марина'])
    expect(ACCESS.oleg).toEqual(['Олег', 'Дима'])
  })

  it('тесты на экране — с числами из расчёта', () => {
    expect(TESTS.map((t) => t.text)).toEqual(['60 г овсянки → 210 ккал', '«52,5» г → 52,5 г, а не 52', '1464 на 100 г → «это кДж?»', 'итог Анны = итог Марины', 'пустой день → «нет записей»', 'Дима не видит дневник Анны'])
  })
})
