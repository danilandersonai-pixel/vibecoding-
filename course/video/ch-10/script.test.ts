import { describe, expect, it } from 'vitest'
import { scriptProblems, stagingProblems } from '../kit/checks'
import { sceneStart } from '../lib/timeline'
import { ch10Script, STAGING } from './script'

// Текст реплик сцены (в нижнем регистре) — для проверки, что нужные слова книги прозвучали.
function sceneText(id: string): string {
  const start = sceneStart(ch10Script, id)
  const scene = ch10Script.scenes.find((s) => s.id === id)
  const end = start + (scene?.durationInFrames ?? 0)
  return ch10Script.cues
    .filter((c) => c.from >= start && c.to <= end)
    .map((c) => c.text)
    .join(' ')
    .toLowerCase()
}

describe('сценарий ролика «Фоновые агенты»', () => {
  it('проходит проверки ролика главы', () => {
    expect(scriptProblems(ch10Script, 'chapter')).toEqual([])
  })

  it('семь сцен: стажёр, что такое фоновый агент, параллельные сессии, где застревает, права и задача, приёмка, возможности Claude Code', () => {
    expect(ch10Script.scenes.map((s) => s.id)).toEqual(['s1-intern', 's2-agent', 's3-parallel', 's4-stuck', 's5-task', 's6-accept', 's7-tools'])
  })

  it('метафора: стажёр получает записку, работу принимают по чек-листу и возвращают на доработку', () => {
    const text = sceneText('s1-intern')
    for (const word of ['стажёр', 'записк', 'чек-лист', 'доработк', 'фоновый агент']) expect(text, word).toContain(word)
  })

  it('четыре ступени, песочница, круг и пул-реквест — как в книге', () => {
    const text = sceneText('s2-agent')
    for (const word of ['автодополнение', 'чат', 'агент рядом', 'агент в фоне', 'песочниц', 'план шага', 'пул-реквест']) expect(text, word).toContain(word)
  })

  it('где работает Claude и параллельные сессии в своих копиях проекта', () => {
    const text = sceneText('s3-parallel')
    for (const word of ['local', 'cloud', 'ssh', 'одновременно', 'ветк', 'worktree', 'отдельно']) expect(text, word).toContain(word)
  })

  it('где агент застревает: не та задача, зацикливание, подгонка теста, вредная инструкция, перегрузка проверки', () => {
    const text = sceneText('s4-stuck')
    for (const word of ['получше', 'зацикливание', 'остановите агента', 'ослабляет тест', 'вредную инструкцию', 'десять пул-реквестов']) expect(text, word).toContain(word)
  })

  it('права агента и записка из четырёх частей: задача, контекст, готово, нельзя', () => {
    const text = sceneText('s5-task')
    for (const word of ['права', 'ключи', 'задача', 'контекст', 'готово, если', 'нельзя', '20–30 минут']) expect(text, word).toContain(word)
  })

  it('приёмка без чтения кода: описание, файлы, проверки, руками, вопрос агенту', () => {
    const text = sceneText('s6-accept')
    for (const word of ['описание', 'список файлов', 'проверки', 'руками', 'спросите у агента', 'не принимайте']) expect(text, word).toContain(word)
  })

  it('возможности Claude Code из раздела s83 названы все семь', () => {
    const text = sceneText('s7-tools')
    for (const word of ['навыки', 'хуки', 'подагенты', 'плагины', 'по расписанию', 'remote control', 'claude in chrome']) expect(text, word).toContain(word)
  })

  it('горячих точек десять, у каждой пояснение не длиннее 350 знаков', () => {
    expect(ch10Script.hotspots.map((h) => h.title)).toEqual([
      'Агент рядом или в фоне',
      'Из чего состоит агент',
      'Где работает Claude',
      'Несколько сессий',
      'Зацикливание',
      'Ловушки фонового агента',
      'Права агента',
      'Задача для агента',
      'Приёмка пул-реквеста',
      'Возможности Claude Code',
    ])
    for (const h of ch10Script.hotspots) {
      expect(h.text.length, h.title).toBeGreaterThan(20)
      expect(h.text.length, h.title).toBeLessThanOrEqual(350)
    }
  })

  it('реплики помещаются в две строки субтитров', () => {
    for (const c of ch10Script.cues) expect(c.text.length, c.text).toBeLessThanOrEqual(96)
  })

  it('переходы и камера на месте, окна горячих точек — на неподвижных кадрах, вне переходов, выше субтитров', () => {
    expect(stagingProblems(ch10Script, STAGING)).toEqual([])
  })
})
