import { describe, expect, it } from 'vitest'
import { scriptProblems, stagingProblems } from '../kit/checks'
import { sceneStart } from '../lib/timeline'
import { BLANK, CLIENT, EMPTY_STATES, fitsScreen, HAND, LAST30, NEW_COACH_EMPTY, TODAY } from './layout'
import { day15Script, STAGING } from './script'

// Текст реплик сцены — для проверки, что нужные слова прозвучали.
function sceneText(id: string): string {
  const start = sceneStart(day15Script, id)
  const scene = day15Script.scenes.find((s) => s.id === id)
  const end = start + (scene?.durationInFrames ?? 0)
  return day15Script.cues
    .filter((c) => c.from >= start && c.to <= end)
    .map((c) => c.text)
    .join(' ')
    .toLowerCase()
}

describe('сценарий ролика дня 15 «Первое знакомство и полировка»', () => {
  it('проходит проверки ролика дня', () => {
    expect(scriptProblems(day15Script, 'day')).toEqual([])
  })

  it('четыре сцены: план дня, первое знакомство, подводный камень, проверьте у себя', () => {
    expect(day15Script.scenes.map((s) => s.id)).toEqual(['s1-today', 's2-first', 's3-empty', 's4-check'])
  })

  it('вступление короткое: старые тренеры и новый, план дня — без подробностей следующих сцен', () => {
    const text = sceneText('s1-today')
    for (const word of ['марина и дима', 'наташа, новый тренер', 'впервые', 'первое знакомство', 'пустые экраны', 'полировка', 'доступности']) expect(text, word).toContain(word)
    for (const word of ['белый лист', 'клавиатур', 'скриншот', 'пригласить']) expect(text, word).not.toContain(word)
    expect(day15Script.cues.filter((c) => c.from < day15Script.scenes[0].durationInFrames).length).toBeLessThanOrEqual(3)
  })

  it('что строим: первый экран с одним шагом — пригласить подопечного; полировка по скриншоту', () => {
    const text = sceneText('s2-first')
    for (const word of ['зарегистрировалась', 'первым', 'не все разделы', 'один ясный первый шаг', 'пригласить подопечного', 'приглашение по ссылке', 'полировка', 'снимите экран', '«кнопка бледная»', 'остальное не трогай']) expect(text, word).toContain(word)
  })

  it('подводный камень: пустой экран без подсказки — Наташа уходит; исправленный экран говорит, что делать, и даёт кнопку', () => {
    const text = sceneText('s3-empty')
    for (const word of ['подводный камень', 'пустой экран без подсказки', 'анна', 'олег', 'рома', 'белый лист', 'ни кнопки', 'закрывает приложение', 'последних 30%', 'что здесь будет', 'что сделать', 'кнопку', '«назначить»', 'без подопечных', '«пригласить первого»', 'для ромы']) expect(text, word).toContain(word)
  })

  it('проверьте у себя: путь нового тренера, пустые списки, клавиатура, контраст, подписи, показ новому человеку', () => {
    const text = sceneText('s4-check')
    for (const word of ['проверьте у себя', 'новым тренером', 'без подсказок', 'пустым каждый список', 'клавиатурой', 'фокус', 'контраст', 'скринридер', 'проверьте сами', 'не видел', 'растерялся']) expect(text, word).toContain(word)
  })

  it('горячих точек три — первый экран, пустой экран с подсказкой, проверка доступности; пояснения до 350 знаков', () => {
    expect(day15Script.hotspots.map((h) => h.title)).toEqual(['Первый экран нового тренера', 'Пустой экран с подсказкой', 'Проверка доступности'])
    for (const h of day15Script.hotspots) {
      expect(h.text.length, h.title).toBeGreaterThan(20)
      expect(h.text.length, h.title).toBeLessThanOrEqual(350)
    }
  })

  it('реплики помещаются в две строки субтитров', () => {
    for (const c of day15Script.cues) expect(c.text.length, c.text).toBeLessThanOrEqual(92)
  })

  it('переходы и камера на месте, окна горячих точек — на неподвижных кадрах, вне переходов, выше субтитров', () => {
    expect(stagingProblems(day15Script, STAGING)).toEqual([])
  })
})

describe('экраны примера', () => {
  it('у каждого исправленного пустого экрана три части: что здесь будет, что сделать и кнопка', () => {
    expect(EMPTY_STATES.map((e) => e.screen)).toEqual(['Тренировки', 'Тренировки'])
    for (const e of [...EMPTY_STATES, ...NEW_COACH_EMPTY]) {
      expect(e.what.length, e.screen).toBeGreaterThan(0)
      expect(e.todo.length, e.screen).toBeGreaterThan(0)
      expect(e.button.length, e.screen).toBeGreaterThan(0)
    }
    // кнопки — те, что звучат в реплике: с подопечным — «Назначить», без подопечных — «Пригласить первого»
    expect(EMPTY_STATES.map((e) => e.button)).toEqual(['Назначить', 'Пригласить первого'])
  })

  it('у нового тренера без подопечных каждый пустой список ведёт к приглашению — в порядке реплики', () => {
    expect(NEW_COACH_EMPTY.map((e) => e.screen)).toEqual(['Подопечные', 'Тренировки', 'Рекорды'])
    for (const e of NEW_COACH_EMPTY) expect(e.button, e.screen).toBe('Пригласить первого')
  })

  it('«Назначить» — только когда подопечный уже есть: он пришёл по ссылке и звучит в реплике', () => {
    expect(CLIENT).toBe('Рома')
    const text = day15Script.cues.map((c) => c.text).join(' ')
    expect(text).toContain('первый подопечный, Рома')
  })

  it('последние 30% — все семь областей таблицы главы 3, среди них необычные случаи', () => {
    expect(LAST30).toHaveLength(7)
    expect(LAST30).toContain('необычные случаи:')
  })

  it('пустой экран из подводного камня — без слов и без кнопки', () => {
    expect(BLANK.screen).toBe('Тренировки')
    expect(BLANK.what).toEqual([])
    expect(BLANK.todo).toEqual([])
    expect(BLANK.button).toBe('')
  })

  it('надписи экранов помещаются в ширину телефона', () => {
    for (const e of [...EMPTY_STATES, ...NEW_COACH_EMPTY]) {
      for (const line of [...e.what, ...e.todo]) expect(fitsScreen(line, 20), line).toBe(true)
      expect(fitsScreen(e.button, 20, 40), e.button).toBe(true)
    }
    expect(HAND.w).toBeGreaterThan(200)
  })

  it('в «проверьте у себя» пять дел — по порядку реплик', () => {
    expect(TODAY).toHaveLength(5)
  })
})
