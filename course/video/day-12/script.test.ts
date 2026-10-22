import { describe, expect, it } from 'vitest'
import { scriptProblems, stagingProblems } from '../kit/checks'
import { sceneStart } from '../lib/timeline'
import { CHAIN, INVITE, inviteCheck, PHONE_CHECKS, untilText } from './layout'
import { day12Script, STAGING } from './script'

// Текст реплик сцены — для проверки, что нужные слова прозвучали.
function sceneText(id: string): string {
  const start = sceneStart(day12Script, id)
  const scene = day12Script.scenes.find((s) => s.id === id)
  const end = start + (scene?.durationInFrames ?? 0)
  return day12Script.cues
    .filter((c) => c.from >= start && c.to <= end)
    .map((c) => c.text)
    .join(' ')
    .toLowerCase()
}

describe('сценарий ролика дня 12 «Приглашение по ссылке»', () => {
  it('проходит проверки ролика дня', () => {
    expect(scriptProblems(day12Script, 'day')).toEqual([])
  })

  it('четыре сцены: что строим сегодня, как работает приглашение, подводный камень, проверьте у себя', () => {
    expect(day12Script.scenes.map((s) => s.id)).toEqual(['s1-today', 's2-invite', 's3-forever', 's4-check'])
  })

  it('вступление: Марина, Анна, ссылка вместо ручного добавления и повторная проверка безопасности', () => {
    const text = sceneText('s1-today')
    for (const word of ['марина', 'анна', 'вручную', 'ссылку', 'новая дверь', 'заново проверяем безопасность']) expect(text, word).toContain(word)
  })

  it('что строим: кнопка, ссылка в мессенджере, вход, запись о тренере, прежние правила доступа', () => {
    const text = sceneText('s2-invite')
    for (const word of ['«пригласить подопечного»', 'мессенджере', 'входит или регистрируется', 'подопечная марины', 'правила доступа', 'только свои тренировки', 'самой ссылке']) expect(text, word).toContain(word)
  })

  it('подводный камень: вечная многоразовая ссылка, чат, незнакомые, угаданный адрес; исправление примера', () => {
    const text = sceneText('s3-forever')
    for (const word of ['подводный камень', 'вечная и многоразовая', 'общем чате', 'незнакомых', 'join/dima', 'решаете вы', 'в нашем примере', 'одноразовая', '48 часов', 'случайный код', 'из записи в базе', 'отозвать', 'только своё']) expect(text, word).toContain(word)
  })

  it('проверьте у себя: второй раз, отозванная, 49 часов тестом, только свои тренировки, аудит, тесты', () => {
    const text = sceneText('s4-check')
    for (const word of ['проверьте у себя', 'тестовым аккаунтом', 'второй раз', 'отзовите', '49 часов', 'только его тренировки', 'аудит безопасности', 'только отчёт', 'шесть вопросов', 'тестом', '«не работает для чужого»']) expect(text, word).toContain(word)
  })

  it('горячих точек четыре; у каждой короткое пояснение (до 350 знаков)', () => {
    expect(day12Script.hotspots.map((h) => h.title)).toEqual(['Путь приглашения', 'Приглашение с замком', 'Проверки приглашения', 'Повторный аудит'])
    for (const h of day12Script.hotspots) {
      expect(h.text.length, h.title).toBeGreaterThan(20)
      expect(h.text.length, h.title).toBeLessThanOrEqual(350)
    }
  })

  it('реплики помещаются в две строки субтитров', () => {
    for (const c of day12Script.cues) expect(c.text.length, c.text).toBeLessThanOrEqual(92)
  })

  it('переходы и камера на месте, окна горячих точек — на неподвижных кадрах, вне переходов, выше субтитров', () => {
    expect(stagingProblems(day12Script, STAGING)).toEqual([])
  })
})

describe('приглашение из примера считается верно', () => {
  it('ссылка живёт 48 часов: создана 22.10 в 18:00 — действует до 24.10, 18:00', () => {
    expect(INVITE.hours).toBe(48)
    expect(untilText(INVITE)).toBe('до 24.10, 18:00')
  })

  it('свежая ссылка пускает первого, второй раз — отказ «уже принято»', () => {
    const fresh = { ...INVITE, acceptedBy: null, revoked: false }
    expect(inviteCheck(fresh, INVITE.code, INVITE.createdAt + 3600_000)).toBe('ok')
    expect(inviteCheck({ ...fresh, acceptedBy: 'Анна' }, INVITE.code, INVITE.createdAt + 3600_000)).toBe('accepted')
  })

  it('через 49 часов — «срок истёк», отозванная — «отозвано», чужой код — «не найдено»', () => {
    const fresh = { ...INVITE, acceptedBy: null, revoked: false }
    expect(inviteCheck(fresh, INVITE.code, INVITE.createdAt + 49 * 3600_000)).toBe('expired')
    expect(inviteCheck({ ...fresh, revoked: true }, INVITE.code, INVITE.createdAt + 3600_000)).toBe('revoked')
    expect(inviteCheck(fresh, 'marina', INVITE.createdAt + 3600_000)).toBe('notfound')
  })

  it('цепочка проверок на экране идёт в том же порядке, что и в расчёте', () => {
    expect(CHAIN.map((c) => c.fails)).toEqual(['notfound', 'accepted', 'expired', 'revoked'])
  })

  it('экраны телефона в «проверьте у себя» совпадают с расчётом', () => {
    for (const p of PHONE_CHECKS) expect(inviteCheck(p.invite, p.code, p.at), p.screen.join(' ')).toBe(p.result)
  })
})
