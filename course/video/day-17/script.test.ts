import { describe, expect, it } from 'vitest'
import { scriptProblems, stagingProblems } from '../kit/checks'
import { sceneStart } from '../lib/timeline'
import { ANNA, CHECKS, daysBetween, FORM, HIPS, LINK_PUBLIC, LINK_SIGNED, MEASURED, mayRead, opens, PHOTOS, photoPath, RULE, SIGNED_MIN, TOKEN, TREND, WAIST, WEIGHT } from './layout'
import { day17Script, STAGING } from './script'

// Текст реплик сцены — для проверки, что нужные слова прозвучали.
function sceneText(id: string): string {
  const start = sceneStart(day17Script, id)
  const scene = day17Script.scenes.find((s) => s.id === id)
  const end = start + (scene?.durationInFrames ?? 0)
  return day17Script.cues
    .filter((c) => c.from >= start && c.to <= end)
    .map((c) => c.text)
    .join(' ')
    .toLowerCase()
}

describe('сценарий ролика дня 17 «Замеры и фото прогресса»', () => {
  it('проходит проверки ролика дня', () => {
    expect(scriptProblems(day17Script, 'day')).toEqual([])
  })

  it('четыре сцены: вступление, что строим сегодня, подводный камень, проверьте у себя', () => {
    expect(day17Script.scenes.map((s) => s.id)).toEqual(['s1-today', 's2-build', 's3-public', 's4-check'])
  })

  it('вступление короткое: зачем замеры и фото и почему важна приватность — без хранилища и ссылок', () => {
    const text = sceneText('s1-today')
    for (const word of ['весы', 'замеры', 'фото прогресса', 'личные данные', 'приватность']) expect(text, word).toContain(word)
    for (const word of ['хранилищ', 'ссылк', 'supabase', 'tea', '2,5', 'папк']) expect(text, word).not.toContain(word)
    expect(day17Script.cues.filter((c) => c.from < day17Script.scenes[0].durationInFrames).length).toBeLessThanOrEqual(3)
  })

  it('что строим: замеры — строки в базе и графики, фото — файлы в хранилище, в таблице только путь', () => {
    const text = sceneText('s2-build')
    for (const word of ['раз в неделю', 'замеры', 'строки в базе', 'графиках', 'с дня 6', 'в нашем примере', '2,5 см', 'файлы', 'хранилище файлов supabase', 'путь к файлу', 'папка 17', 'номер анны', 'присмотритесь']) expect(text, word).toContain(word)
  })

  it('подводный камень: публичная постоянная ссылка уходит в чат; Tea; исправление примера — приватное хранилище, правило, подписанная ссылка, удаление', () => {
    const text = sceneText('s3-public')
    for (const word of ['подводный камень', 'публичным', 'постоянная ссылка', 'без входа', 'общий чат', 'через год', 'tea', '72 000', 'решаете вы', 'в нашем примере', 'приватное', 'правило доступа', 'rls с дня 4', 'анна и её тренер марина', 'подписанную ссылку', 'пять минут', 'удаляет фото', 'файл в хранилище', 'строка в базе']) expect(text, word).toContain(word)
  })

  it('проверьте у себя: панель, окно инкогнито, срок ссылки, второй пользователь, удаление, аудит, до запуска', () => {
    const text = sceneText('s4-check')
    for (const word of ['проверьте у себя', 'в панели supabase', 'приватным', 'инкогнито', 'пять минут', 'ошибка', 'как в день 4', 'вторым пользователем', 'отказ', 'удалите', 'старая ссылка', 'аудит из дня 6', 'хранилища и правила', 'до запуска']) expect(text, word).toContain(word)
  })

  it('горячих точек три; у каждой короткое пояснение (до 350 знаков)', () => {
    expect(day17Script.hotspots.map((h) => h.title)).toEqual(['Фото: файл и путь', 'Приватное хранилище', 'Проверьте у себя'])
    for (const h of day17Script.hotspots) {
      expect(h.text.length, h.title).toBeGreaterThan(20)
      expect(h.text.length, h.title).toBeLessThanOrEqual(350)
    }
  })

  it('реплики помещаются в две строки субтитров', () => {
    for (const c of day17Script.cues) expect(c.text.length, c.text).toBeLessThanOrEqual(92)
  })

  it('переходы и камера на месте, окна горячих точек — на неподвижных кадрах, вне переходов, выше субтитров', () => {
    expect(stagingProblems(day17Script, STAGING)).toEqual([])
  })
})

describe('пример ролика дня 17 считается верно', () => {
  it('замеры раз в неделю, пять недель — это месяц: 28 дней от первого до последнего', () => {
    expect(MEASURED).toHaveLength(5)
    for (let i = 1; i < MEASURED.length; i++) expect(daysBetween(MEASURED[i - 1], MEASURED[i])).toBe(7)
    expect(daysBetween(MEASURED[0], MEASURED[MEASURED.length - 1])).toBe(28)
    for (const series of [WEIGHT, WAIST, HIPS]) expect(series).toHaveLength(MEASURED.length)
  })

  it('за месяц вес почти не сдвинулся (меньше 0,5 кг), а талия ушла на 2,5 см — так и звучит в реплике', () => {
    expect(Math.abs(WEIGHT[0] - WEIGHT[WEIGHT.length - 1])).toBeLessThan(0.5)
    expect(WAIST[0] - WAIST[WAIST.length - 1]).toBeCloseTo(2.5, 5)
    expect(sceneText('s2-build')).toContain('вес почти не сдвинулся')
    expect(sceneText('s2-build')).toContain('2,5 см')
  })

  it('графики: шкала вмещает все значения', () => {
    for (const v of WEIGHT) expect(v >= TREND.weight.min && v <= TREND.weight.max, String(v)).toBe(true)
    for (const v of WAIST) expect(v >= TREND.waist.min && v <= TREND.waist.max, String(v)).toBe(true)
  })

  it('форма замеров на телефоне — значения последней недели', () => {
    const fmt = (v: number) => String(v).replace('.', ',')
    expect(FORM.map((r) => r.value)).toEqual([`${fmt(WEIGHT[4])} кг`, `${fmt(WAIST[4])} см`, `${fmt(HIPS[4])} см`])
  })

  it('фото раз в две недели, последнее — в день последнего замера; путь начинается с папки Анны (17)', () => {
    expect(ANNA).toBe(17)
    for (let i = 1; i < PHOTOS.length; i++) expect(daysBetween(PHOTOS[i - 1], PHOTOS[i])).toBe(14)
    for (const d of PHOTOS) expect(MEASURED).toContain(d)
    expect(PHOTOS[PHOTOS.length - 1]).toBe(MEASURED[MEASURED.length - 1])
    for (const d of PHOTOS) expect(photoPath(d)).toBe(`17/${d}.jpg`)
  })

  it('ссылки — как у Supabase: публичная /public/…, подписанная /sign/… с токеном; строки не длиннее 40 знаков', () => {
    const last = photoPath(PHOTOS[PHOTOS.length - 1])
    expect(LINK_PUBLIC).toContain(`/public/photos/${last}`)
    expect(LINK_SIGNED).toContain(`/sign/photos/${last}`)
    expect(TOKEN.startsWith('?token=')).toBe(true)
    for (const s of [LINK_PUBLIC, LINK_SIGNED, TOKEN, ...PHOTOS.map(photoPath)]) expect(s.length, s).toBeLessThanOrEqual(40)
  })

  it('публичное хранилище открывает фото любому и навсегда; в приватном постоянной ссылки нет', () => {
    expect(opens('public', { kind: 'public' })).toBe(true)
    expect(opens('private', { kind: 'public' })).toBe(false)
  })

  it('подписанная ссылка живёт пять минут: свежая открывается, через пять минут и через час — нет', () => {
    expect(SIGNED_MIN).toBe(5)
    expect(opens('private', { kind: 'signed', ageMin: 0 })).toBe(true)
    expect(opens('private', { kind: 'signed', ageMin: SIGNED_MIN })).toBe(false)
    expect(opens('private', { kind: 'signed', ageMin: 60 })).toBe(false)
  })

  it('после удаления файла не открывается ни одна ссылка', () => {
    expect(opens('public', { kind: 'public' }, false)).toBe(false)
    expect(opens('private', { kind: 'signed', ageMin: 0 }, false)).toBe(false)
  })

  it('правило папки 17: читают Анна и её тренер Марина, а Дима, Олег и второй тестовый пользователь — нет', () => {
    expect(mayRead('Анна', ANNA)).toBe(true)
    expect(mayRead('Марина', ANNA)).toBe(true)
    expect(mayRead('Дима', ANNA)).toBe(false)
    expect(mayRead('Олег', ANNA)).toBe(false)
    expect(mayRead('тест 2', ANNA)).toBe(false)
    // строки правила на экране совпадают с правилом
    expect(RULE.map((r) => [r.who, r.ok])).toEqual(RULE.map((r) => [r.who, mayRead(r.viewer, ANNA)]))
    expect(RULE.map((r) => r.viewer)).toEqual(['Анна', 'Марина', 'Дима', 'Олег'])
  })

  it('чек-лист «Проверьте у себя» — пять проверок по порядку реплик', () => {
    expect(CHECKS).toHaveLength(5)
    for (const c of CHECKS) expect(c.length, c).toBeLessThanOrEqual(34)
  })
})
