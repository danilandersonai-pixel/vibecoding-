import { describe, expect, it } from 'vitest'
import { scriptProblems, stagingProblems } from '../kit/checks'
import { sceneStart } from '../lib/timeline'
import { ch04Script, STAGING } from './script'

// Текст реплик сцены — для проверки, что нужные слова прозвучали.
function sceneText(id: string): string {
  const start = sceneStart(ch04Script, id)
  const scene = ch04Script.scenes.find((s) => s.id === id)
  const end = start + (scene?.durationInFrames ?? 0)
  return ch04Script.cues
    .filter((c) => c.from >= start && c.to <= end)
    .map((c) => c.text)
    .join(' ')
    .toLowerCase()
}

describe('сценарий ролика «Что остаётся человеку»', () => {
  it('проходит проверки ролика главы', () => {
    expect(scriptProblems(ch04Script, 'chapter')).toEqual([])
  })

  it('шесть сцен: шахматист, что отдать ИИ, буква Т, репетитор и риск, режим наставника, осознанный рост', () => {
    expect(ch04Script.scenes.map((s) => s.id)).toEqual(['s1-chess', 's2-delegate', 's3-t-shape', 's4-tutor', 's5-mentor', 's6-growth'])
  })

  it('в метафоре шахматист играет с компьютером: машина считает ходы, план выбирает человек', () => {
    const text = sceneText('s1-chess')
    for (const word of ['шахматист', 'компьютер', 'ход', 'план', 'вкус']) expect(text, word).toContain(word)
  })

  it('матрица делегирования: цена ошибки и лёгкость проверки', () => {
    const text = sceneText('s2-delegate')
    for (const word of ['ошибка', 'проверить', 'агент', 'пароли']) expect(text, word).toContain(word)
  })

  it('буква Т: ширину закрывает ИИ, глубину строит человек, лучшая ножка новичка — предметная область', () => {
    const text = sceneText('s3-t-shape')
    for (const word of ['буква т', 'перекладина', 'ножка', 'глубоко', 'предметная область']) expect(text, word).toContain(word)
  })

  it('правила новичка и режим наставника: пятнадцать минут, наводящие вопросы, три раза подряд, побочный чат', () => {
    const text = `${sceneText('s4-tutor')} ${sceneText('s5-mentor')}`
    for (const word of ['пятнадцать', 'своими словами', 'тест', 'портфолио', 'наводящие вопросы', 'три раза подряд', 'побочный чат', '/btw']) expect(text, word).toContain(word)
  })

  it('осознанный рост: цикл «попытка, разбор, вывод», журнал запросов, шаблоны и правила', () => {
    const text = sceneText('s6-growth')
    for (const word of ['попытка, разбор, вывод', 'журнал запросов', 'раз в неделю', 'шаблон', 'правила']) expect(text, word).toContain(word)
  })

  it('горячих точек восемь, у каждой есть пояснение', () => {
    expect(ch04Script.hotspots.map((h) => h.title)).toEqual([
      'Матрица делегирования',
      'Вы и ваши агенты',
      'Куда углубляться',
      'Шесть правил для начинающих',
      'Запрос наставнику',
      'Побочный чат',
      'Журнал запросов',
      'Что устаревает, а что остаётся',
    ])
    for (const h of ch04Script.hotspots) expect(h.text.length, h.title).toBeGreaterThan(20)
  })

  it('реплики помещаются в две строки субтитров', () => {
    for (const c of ch04Script.cues) expect(c.text.length, c.text).toBeLessThanOrEqual(96)
  })

  it('переходы и камера на месте, окна горячих точек — на неподвижных кадрах, вне переходов, выше субтитров', () => {
    expect(stagingProblems(ch04Script, STAGING)).toEqual([])
  })
})
