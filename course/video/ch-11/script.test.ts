import { describe, expect, it } from 'vitest'
import { scriptProblems, stagingProblems } from '../kit/checks'
import { sceneStart } from '../lib/timeline'
import { ch11Script, STAGING } from './script'

// Текст всех реплик сцены — для проверки, что названы нужные факты книги.
function sceneText(id: string): string {
  const scene = ch11Script.scenes.find((s) => s.id === id)
  if (!scene) throw new Error(`Нет сцены «${id}»`)
  const start = sceneStart(ch11Script, id)
  return ch11Script.cues
    .filter((c) => c.from >= start && c.to <= start + scene.durationInFrames)
    .map((c) => c.text)
    .join(' ')
}

describe('сценарий ролика «Что дальше»', () => {
  it('проходит проверки ролика главы', () => {
    expect(scriptProblems(ch11Script, 'chapter')).toEqual([])
  })

  it('семь сцен: лестница, тесты, ночной сбой, дизайн, спецификация, роли, речь как слой', () => {
    expect(ch11Script.scenes.map((s) => s.id)).toEqual(['s1-stairs', 's2-tests', 's3-incident', 's4-design', 's5-pm', 's6-roles', 's7-words'])
  })

  it('в сцене-метафоре — три ступени: машинный код, языки программирования, обычная речь', () => {
    const text = sceneText('s1-stairs')
    for (const word of ['лестниц', 'машинный код', 'языки программирования', 'обычная речь', 'что нужно, а не как', 'не обещания', '2026']) expect(text, word).toContain(word)
  })

  it('во второй сцене — сопровождение, тест из требования до кода и сквозной тест', () => {
    const text = sceneText('s2-tests')
    for (const word of ['сопровождение', 'агент', 'Требование Марины', 'тест ещё до кода', 'обновит и тест', 'Сквозной тест', 'вёрстку']) expect(text, word).toContain(word)
  })

  it('в сцене сбоя — инцидент, дежурный агент, пул-реквест, решение человека и тест на сбой', () => {
    const text = sceneText('s3-incident')
    for (const word of ['инцидент', 'Дежурный агент', 'журналы', 'показатели', 'гипотезы', 'пул-реквест', 'решает Дима', 'тест', 'без человека']) expect(text, word).toContain(word)
  })

  it('в сцене дизайна — дизайн-система, подстройка под опыт, риски и выбор за человеком', () => {
    const text = sceneText('s4-design')
    for (const word of ['Дизайн-система', 'в одном стиле', 'Анне — подсказки', 'горячие клавиши', 'данные о человеке', 'выбираете вы']) expect(text, word).toContain(word)
  })

  it('в сцене менеджмента — спецификация в центре, черновики задач, новая математика оценок', () => {
    const text = sceneText('s5-pm')
    for (const word of ['ясность дорожает', 'спецификация', 'черновики задач', 'Новая математика оценок', 'вы уже менеджер', '«готово»']) expect(text, word).toContain(word)
  })

  it('в сцене ролей — четыре роли, горизонт задач METR с цифрами книги и оговорка про тренд', () => {
    const text = sceneText('s6-roles')
    for (const word of ['Автор', 'редактор', 'постановщик', 'оркестратор', 'METR', '4–7 месяцев', '3–4', 'начала 2026', 'не гарантия', 'проверка']) expect(text, word).toContain(word)
  })

  it('в последней сцене — неоднозначность речи, точные средства, код как чертёж и индустрия', () => {
    const text = sceneText('s7-words')
    for (const word of ['«Сделай кнопку побольше»', 'типы', 'тесты и контракты', 'спецификации', 'чертёж', 'Вайб-кодинг', 'проверке']) expect(text, word).toContain(word)
  })

  it('горячих точек семь, у каждой пояснение не длиннее 350 знаков', () => {
    expect(ch11Script.hotspots.map((h) => h.title)).toEqual(['Тесты из требований', 'Разбор инцидента', 'Куда движется дизайн', 'Проект с агентами', 'Горизонт задач', 'Что, вероятно, нас ждёт', 'Точные средства'])
    for (const h of ch11Script.hotspots) {
      expect(h.text.length, h.title).toBeGreaterThan(20)
      expect(h.text.length, h.title).toBeLessThanOrEqual(350)
    }
  })

  it('реплики помещаются в две строки субтитров', () => {
    for (const c of ch11Script.cues) expect(c.text.length, c.text).toBeLessThanOrEqual(92)
  })

  it('переходы и камера на месте, окна горячих точек — на неподвижных кадрах, вне переходов, выше субтитров', () => {
    expect(stagingProblems(ch11Script, STAGING)).toEqual([])
  })
})
