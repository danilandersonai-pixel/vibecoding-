import { describe, expect, it } from 'vitest'
import { scriptProblems, stagingProblems } from '../kit/checks'
import { sceneStart } from '../lib/timeline'
import { ch09Script, STAGING } from './script'

// Текст реплик сцены — для проверки, что нужные слова прозвучали.
function sceneText(id: string): string {
  const start = sceneStart(ch09Script, id)
  const scene = ch09Script.scenes.find((s) => s.id === id)
  const end = start + (scene?.durationInFrames ?? 0)
  return ch09Script.cues
    .filter((c) => c.from >= start && c.to <= end)
    .map((c) => c.text)
    .join(' ')
    .toLowerCase()
}

describe('сценарий ролика «Этика вайб-кодинга»', () => {
  it('проходит проверки ролика главы', () => {
    expect(scriptProblems(ch09Script, 'chapter')).toEqual([])
  })

  it('шесть сцен: цитата в эссе, чей код, лицензии и данные, честно о роли ИИ, предвзятость, золотые правила', () => {
    expect(ch09Script.scenes.map((s) => s.id)).toEqual(['s1-essay', 's2-owner', 's3-license', 's4-honest', 's5-bias', 's6-rules'])
  })

  it('в метафоре чужие слова в эссе берут в кавычках и со ссылкой, а у кода условия — в лицензии', () => {
    const text = sceneText('s1-essay')
    for (const word of ['эссе', 'кавычк', 'ссылк', 'лицензи', 'юрист']) expect(text, word).toContain(word)
  })

  it('чей код: автор — человек, доклад Бюро авторского права США 2025 года, Гражданский кодекс, вклад', () => {
    const text = sceneText('s2-owner')
    for (const word of ['человек', 'бюро авторского права сша', '2025', 'гражданский кодекс', 'вклад', '«сгенерировать»']) expect(text, word).toContain(word)
  })

  it('лицензии и данные: копилефт и GPL, закрытый продукт, сканер лицензий в CI, фильтр совпадений, условия инструмента', () => {
    const text = sceneText('s3-license')
    for (const word of ['лицензи', 'копилефт', 'gpl', 'закрыт', 'сканер лицензий', 'ci', 'фильтр дословных совпадений', 'учится', 'корпоративн']) expect(text, word).toContain(word)
  })

  it('прозрачность: Co-Authored-By, пул-реквест, Gentoo и NetBSD, учёба, заказчик, ИИ — инструмент', () => {
    const text = sceneText('s4-honest')
    for (const word of ['co-authored-by', 'пул-реквест', 'gentoo', 'netbsd', 'собеседовани', 'заказчик', 'инструмент', 'отвечает человек']) expect(text, word).toContain(word)
  })

  it('предвзятость: значение по умолчанию, только латиница, имена из книги, проверка клавиатурой', () => {
    const text = sceneText('s5-bias')
    for (const word of ['предвзятость', 'по умолчанию', 'латиниц', 'ёлкина', "o'connor", 'мария-луиза', 'клавиатур', 'на разных']) expect(text, word).toContain(word)
  })

  it('золотые правила: все восемь по порядку и итог', () => {
    const text = sceneText('s6-rules')
    for (const word of [
      'ответственность не делегируется',
      'понимай',
      'защищай чужие данные',
      'уважай лицензии',
      'будь честен о роли ии',
      'проверяй на разных людях',
      'не автоматизируй вред',
      'учись, а не только получай',
      'итог',
    ])
      expect(text, word).toContain(word)
    const order = ['первое', 'второе', 'третье', 'четвёртое', 'пятое', 'шестое', 'седьмое', 'восьмое'].map((w) => text.indexOf(w))
    expect(order.every((at) => at >= 0)).toBe(true)
    expect([...order].sort((a, b) => a - b)).toEqual(order)
  })

  it('горячих точек семь, у каждой короткое пояснение (до 350 знаков)', () => {
    expect(ch09Script.hotspots.map((h) => h.title)).toEqual([
      'Кому принадлежит код',
      'Лицензии и копилефт',
      'Ваши данные в инструменте',
      'Метка об участии ИИ',
      'Где важна прозрачность',
      'Справедливая проверка имени',
      'Восемь правил',
    ])
    for (const h of ch09Script.hotspots) {
      expect(h.text.length, h.title).toBeGreaterThan(20)
      expect(h.text.length, h.title).toBeLessThanOrEqual(350)
    }
  })

  it('реплики помещаются в две строки субтитров', () => {
    for (const c of ch09Script.cues) expect(c.text.length, c.text).toBeLessThanOrEqual(92)
  })

  it('переходы и камера на месте, окна горячих точек — на неподвижных кадрах, вне переходов, выше субтитров', () => {
    expect(stagingProblems(ch09Script, STAGING)).toEqual([])
  })
})
