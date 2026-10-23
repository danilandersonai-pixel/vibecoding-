import { describe, expect, it } from 'vitest'
import { scriptProblems, stagingProblems } from '../kit/checks'
import { sceneStart } from '../lib/timeline'
import { COACH_FEED, PARITY, PILES, REVIEWS, SLICE, SPEC, nextPile, pileCount, tallestPile } from './layout'
import { day13Script, STAGING } from './script'

// Текст реплик сцены — для проверки, что нужные слова прозвучали.
function sceneText(id: string): string {
  const start = sceneStart(day13Script, id)
  const scene = day13Script.scenes.find((s) => s.id === id)
  const end = start + (scene?.durationInFrames ?? 0)
  return day13Script.cues
    .filter((c) => c.from >= start && c.to <= end)
    .map((c) => c.text)
    .join(' ')
    .toLowerCase()
}

describe('сценарий ролика дня 13 «Своё отличие»', () => {
  it('проходит проверки ролика дня', () => {
    expect(scriptProblems(day13Script, 'day')).toEqual([])
  })

  it('четыре сцены: вступление, что строим сегодня, подводный камень, проверьте у себя', () => {
    expect(day13Script.scenes.map((s) => s.id)).toEqual(['s1-intro', 's2-pain', 's3-copy', 's4-check'])
  })

  it('вступление короткое: приложение умеет главное, что у эталонов, нужна причина выбрать вас — без жалоб и стопок из сцены 2', () => {
    const text = sceneText('s1-intro')
    for (const word of ['эталон', 'главное', 'незачем', 'отличие']) expect(text, word).toContain(word)
    for (const word of ['жалоб', 'стопк', 'марина', 'анна', 'срез']) expect(text, word).not.toContain(word)
    expect(day13Script.cues.filter((c) => c.from < day13Script.scenes[0].durationInFrames).length).toBeLessThanOrEqual(3)
  })

  it('что строим: жалобы на эталоны слово в слово, стопки; самая высокая у нас уже закрыта — следующая; общая боль тренеров и срез: правка веса на тренировке', () => {
    const text = sceneText('s2-pain')
    for (const word of ['жалобы', 'отзывы', 'не хватает', 'слово в слово', 'одну стопку', 'тренер не видит', 'уже есть', 'следующую стопку', 'марина', 'дима', 'общая', 'срез', 'на тренировке', 'сразу', '45 кг']) expect(text, word).toContain(word)
  })

  it('подводный камень: функции «как у них», сотни функций эталона, неудачные решения, боль Марины, таблица паритета', () => {
    const text = sceneText('s3-copy')
    for (const word of ['подводный камень', 'конкурентов', '«как у них»', 'сотни функций', 'неудачные решения', 'зачем', 'поправить вес', 'пока та тренируется', 'таблицу паритета', 'не делаем']) expect(text, word).toContain(word)
  })

  it('проверьте у себя: жалобы дословно, стопки, вопрос тренерам, один сценарий, спецификация и паритет, показ без подсказок', () => {
    const text = sceneText('s4-check')
    for (const word of ['проверьте у себя', 'дословно', 'стопкам', 'тренеров', 'один сценарий целиком', 'правка марины', 'спецификацию', '«наше отличие»', 'без подсказки', 'покажите снова']) expect(text, word).toContain(word)
  })

  it('горячих точек три — стопки жалоб, гонка за эталоном, отличие в таблице паритета; у каждой короткое пояснение (до 350 знаков)', () => {
    expect(day13Script.hotspots.map((h) => h.title)).toEqual(['Стопки жалоб', 'Гонка за эталоном', 'Отличие в таблице паритета'])
    for (const h of day13Script.hotspots) {
      expect(h.text.length, h.title).toBeGreaterThan(20)
      expect(h.text.length, h.title).toBeLessThanOrEqual(350)
    }
  })

  it('реплики помещаются в две строки субтитров и обходятся без латиницы', () => {
    for (const c of day13Script.cues) {
      expect(c.text.length, c.text).toBeLessThanOrEqual(92)
      expect(/[A-Za-z]/.test(c.text), c.text).toBe(false)
    }
  })

  it('переходы и камера на месте, окна горячих точек — на неподвижных кадрах, вне переходов, выше субтитров', () => {
    expect(stagingProblems(day13Script, STAGING)).toEqual([])
  })
})

// Стопки на экране собираются из отзывов в layout.ts — проверяем, что счёт верный и пример честный.
describe('данные ролика дня 13', () => {
  it('каждый отзыв лежит в одной из стопок, счёт под стопкой совпадает с числом отзывов в ней', () => {
    for (const r of REVIEWS) expect(r.pile, r.text).toBeLessThan(PILES.length)
    expect(PILES.map((_, i) => pileCount(i))).toEqual([3, 2, 1])
    expect(PILES.map((p) => p.count)).toEqual(PILES.map((_, i) => `${pileCount(i)}`))
  })

  it('самая высокая стопка — «тренер не видит» (у нас уже закрыта), следующая — «поправка поздно»', () => {
    expect(PILES[tallestPile()].head).toBe('тренер не видит')
    expect(PILES[nextPile()].head).toBe('поправка поздно')
  })

  it('отличия в таблице паритета и спецификации согласованы: видеть подходы — уже есть, правка веса на тренировке — новое', () => {
    const seen = PARITY.find((p) => p.what === 'тренер видит подходы')
    const live = PARITY.find((p) => p.what === 'правка на тренировке')
    expect(seen).toMatchObject({ them: 'нет → есть', decision: 'наше отличие (уже)' })
    expect(live).toMatchObject({ them: 'нет → делаем', decision: 'наше отличие' })
    expect(SPEC.join('\n')).toContain('Тренер видит подходы — уже')
    expect(SPEC.join('\n')).toContain('Правка веса на тренировке')
  })

  it('срез: тренер меняет вес следующего подхода, Анна видит новый вес; числа на экранах из одних данных', () => {
    expect(SLICE).toEqual({ reps: 10, from: 40, to: 45 })
    expect(SLICE.to).toBeGreaterThan(SLICE.from)
    expect(COACH_FEED.map((r) => r.text)).toEqual(['подход 1 · 10 × 40 кг', 'подход 2 · 10 × 40 кг'])
  })

  it('на экране Марины только её подопечная Анна: подходы Олега видит Дима, а не Марина', () => {
    expect(COACH_FEED.every((row) => row.who === 'Анна')).toBe(true)
  })
})
