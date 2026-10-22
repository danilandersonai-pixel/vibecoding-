import { describe, expect, it } from 'vitest'
import { scriptProblems, stagingProblems } from '../kit/checks'
import { sceneStart } from '../lib/timeline'
import { ANNA_LAST, CLIENTS, COPIES, daysBetween, FRESH_COPY, PYRAMID, REPORT, REQUESTS, RESTORE_MIN, SPEED, TODAY } from './layout'
import { day14Script, STAGING } from './script'

// Текст реплик сцены — для проверки, что нужные слова прозвучали.
function sceneText(id: string): string {
  const start = sceneStart(day14Script, id)
  const scene = day14Script.scenes.find((s) => s.id === id)
  const end = start + (scene?.durationInFrames ?? 0)
  return day14Script.cues
    .filter((c) => c.from >= start && c.to <= end)
    .map((c) => c.text)
    .join(' ')
    .toLowerCase()
}

describe('сценарий ролика дня 14 «Надёжность»', () => {
  it('проходит проверки ролика дня', () => {
    expect(scriptProblems(day14Script, 'day')).toEqual([])
  })

  it('четыре сцены: вступление, что строим сегодня, подводный камень, проверьте у себя', () => {
    expect(day14Script.scenes.map((s) => s.id)).toEqual(['s1-today', 's2-build', 's3-restore', 's4-check'])
  })

  it('вступление короткое: четыре части надёжности без примеров, которые разбирают следующие сцены', () => {
    const text = sceneText('s1-today')
    for (const word of ['каждый день', 'надёжность', 'тесты', 'скорость', 'отслеживание ошибок', 'резервные копии', 'не видно']) expect(text, word).toContain(word)
    for (const word of ['анна', 'playwright', 'запрос', 'восстанов', 'стектрейс']) expect(text, word).not.toContain(word)
    expect(day14Script.cues.filter((c) => c.from < day14Script.scenes[0].durationInFrames).length).toBeLessThanOrEqual(3)
  })

  it('что строим: тесты главного сценария, замер скорости, отчёт об ошибке, ночные копии вне досягаемости агента', () => {
    const text = sceneText('s2-build')
    for (const word of ['главный сценарий', 'сквозной тест', 'playwright', 'интеграционные', 'модульные', 'vitest', 'сначала замер', '21 запрос', '«сделай быстрее»', 'понятное сообщение', 'стектрейс', 'целиком', 'каждую ночь', 'нет доступа']) expect(text, word).toContain(word)
  })

  it('подводный камень: из копии ни разу не восстанавливали; пробное восстановление в отдельную базу, проверка, время, шаги', () => {
    const text = sceneText('s3-restore')
    for (const word of ['подводный камень', 'ни разу не пробовал', 'запаск', 'пробное восстановление', 'отдельную тестовую базу', 'не поверх рабочей', 'вчерашняя тренировка анны', 'девять дней', 'оповещение', 'засекаем время', 'шаги']) expect(text, word).toContain(word)
  })

  it('проверьте у себя: тесты и нарочная поломка, медленный экран, тестовая ошибка, восстановление вчерашней копии', () => {
    const text = sceneText('s4-check')
    for (const word of ['проверьте у себя', 'запустите тесты', 'сломайте', 'самый медленный экран', 'сначала замерить', 'тестовую ошибку', 'отслеживании', 'вчерашнюю копию', 'тестовую базу', 'сколько минут']) expect(text, word).toContain(word)
  })

  it('горячих точек четыре; у каждой короткое пояснение (до 350 знаков)', () => {
    expect(day14Script.hotspots.map((h) => h.title)).toEqual(['Три уровня тестов', 'Отчёт об ошибке', 'Пробное восстановление', 'Проверьте у себя'])
    for (const h of day14Script.hotspots) {
      expect(h.text.length, h.title).toBeGreaterThan(20)
      expect(h.text.length, h.title).toBeLessThanOrEqual(350)
    }
  })

  it('реплики помещаются в две строки субтитров', () => {
    for (const c of day14Script.cues) expect(c.text.length, c.text).toBeLessThanOrEqual(92)
  })

  it('переходы и камера на месте, окна горячих точек — на неподвижных кадрах, вне переходов, выше субтитров', () => {
    expect(stagingProblems(day14Script, STAGING)).toEqual([])
  })
})

describe('пример ролика дня 14 считается верно', () => {
  it('N+1: на 20 подопечных — 1 запрос за списком и по одному за каждым, всего 21; после правки — 2', () => {
    expect(CLIENTS).toBe(20)
    expect(REQUESTS.before).toBe(1 + CLIENTS)
    expect(REQUESTS.after).toBe(2)
    expect(sceneText('s2-build')).toContain(`на ${CLIENTS} подопечных`)
    expect(sceneText('s2-build')).toContain(`${REQUESTS.before} запрос`)
  })

  it('замер — пример: почти четыре секунды до правки, меньше секунды после', () => {
    expect(SPEED.before).toBeGreaterThan(3.5)
    expect(SPEED.before).toBeLessThan(4)
    expect(SPEED.after).toBeLessThan(1)
    expect(sceneText('s2-build')).toContain('почти четыре секунды')
  })

  it('самой свежей копии девять дней, а вчерашняя тренировка Анны позже неё и попадает в новую копию', () => {
    expect(daysBetween(COPIES[0], TODAY)).toBe(9)
    expect(daysBetween(ANNA_LAST, TODAY)).toBe(1)
    expect(daysBetween(COPIES[0], ANNA_LAST)).toBeGreaterThan(0)
    expect(daysBetween(ANNA_LAST, FRESH_COPY)).toBeGreaterThanOrEqual(0)
    // копии идут от свежей к старой
    for (let i = 1; i < COPIES.length; i++) expect(daysBetween(COPIES[i], COPIES[i - 1])).toBe(1)
  })

  it('время восстановления — пример в минутах, оно же звучит в реплике', () => {
    expect(sceneText('s3-restore')).toContain(`${RESTORE_MIN} минут`)
  })

  it('отчёт об ошибке: текст ошибки, стектрейс, экран, шаги, номер подопечной и версия; строки кода не длиннее 40 знаков', () => {
    expect(REPORT.map((r) => r.tag)).toEqual(['ошибка', 'где', 'экран', 'шаги', 'кто', 'версия'])
    expect(REPORT.find((r) => r.tag === 'кто')?.text).toContain('№17')
    for (const r of REPORT) expect(r.text.length, r.text).toBeLessThanOrEqual(40)
  })

  it('пирамида тестов сверху вниз: сквозные, интеграционные, модульные', () => {
    expect(PYRAMID.map((t) => t.name)).toEqual(['сквозные', 'интеграционные', 'модульные'])
  })
})
