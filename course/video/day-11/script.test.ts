import { describe, expect, it } from 'vitest'
import { scriptProblems, stagingProblems } from '../kit/checks'
import { sceneStart } from '../lib/timeline'
import { canRead, COMMENTS, deliverAt, EXERCISES, POLICY, SETS_EACH, SPAM, SQL_CREATE, TERM } from './layout'
import { day11Script, STAGING } from './script'

// Текст реплик сцены (в нижнем регистре) — для проверки, что нужные слова прозвучали.
function sceneText(id: string): string {
  const start = sceneStart(day11Script, id)
  const scene = day11Script.scenes.find((s) => s.id === id)
  const end = start + (scene?.durationInFrames ?? 0)
  return day11Script.cues
    .filter((c) => c.from >= start && c.to <= end)
    .map((c) => c.text)
    .join(' ')
    .toLowerCase()
}

describe('сценарий ролика дня 11 «Комментарии и уведомления»', () => {
  it('проходит проверки ролика дня', () => {
    expect(scriptProblems(day11Script, 'day')).toEqual([])
  })

  it('три сцены: что строим сегодня, подводный камень, проверьте у себя', () => {
    expect(day11Script.scenes.map((s) => s.id)).toEqual(['s1-build', 's2-pitfall', 's3-check'])
  })

  it('что строим: комментарии и уведомления обоим, функция целиком, решения до кода', () => {
    const text = sceneText('s1-build')
    for (const word of ['комментарии', 'уведомления', '«марина ответила»', '«анна завершила тренировку»', 'целиком', 'правила доступа', 'кто видит комментарий']) expect(text, word).toContain(word)
  })

  it('подводный камень: таблица без RLS отдаёт чужое, затем спам уведомлений и правила', () => {
    const text = sceneText('s2-pitfall')
    for (const word of ['через sql', 'rls сам не включается', 'олег', 'данные о здоровье', 'публичный ключ', 'включите rls', 'подопечный этой тренировки и его тренер', 'о каждом записанном подходе', '15 уведомлений', '23:40', 'выключает уведомления', 'решаете вы', 'одно на тренировку', 'тишина ночью', 'настройки']) expect(text, word).toContain(word)
  })

  it('проверьте у себя: вход под чужим, пусто, тест, 15 подходов — одно уведомление, ночью — утром', () => {
    const text = sceneText('s3-check')
    for (const word of ['проверьте у себя', 'другого тренера', 'чужих комментариев', 'тестом', '15 подходов', 'одно', 'утром', 'марина']) expect(text, word).toContain(word)
  })

  it('правило доступа: комментарий видят только подопечный тренировки и его тренер', () => {
    const anna = COMMENTS.filter((c) => c.workout === 'anna')
    const oleg = COMMENTS.filter((c) => c.workout === 'oleg')
    expect(anna.length).toBeGreaterThan(0)
    expect(oleg.length).toBeGreaterThan(0)
    for (const c of anna) {
      expect(canRead('Анна', c)).toBe(true)
      expect(canRead('Марина', c)).toBe(true)
      expect(canRead('Олег', c)).toBe(false)
      expect(canRead('Дима', c)).toBe(false)
    }
    for (const c of oleg) {
      expect(canRead('Олег', c)).toBe(true)
      expect(canRead('Дима', c)).toBe(true)
      expect(canRead('Анна', c)).toBe(false)
    }
  })

  it('код таблицы, политики и терминала: строки не длиннее 40 знаков, политика — на чтение по участникам тренировки', () => {
    for (const line of [...SQL_CREATE, ...POLICY, ...TERM.map((l) => l.text)]) expect(line.length, line).toBeLessThanOrEqual(40)
    const policy = POLICY.join('\n')
    for (const part of ['alter table comments', 'enable row level security', 'create policy', 'on comments for select', 'workout_id', 'auth.uid()', 'client_id', 'coach_id']) expect(policy, part).toContain(part)
    expect(SQL_CREATE.join('\n')).toContain('create table comments')
  })

  it('спам: пять упражнений по три подхода — 15 уведомлений; ночью уведомление ждёт утра', () => {
    expect(EXERCISES * SETS_EACH).toBe(15)
    expect(SPAM).toHaveLength(15)
    expect(SPAM[14]).toBe('Анна: подход 15')
    expect(deliverAt('23:40')).toBe('08:00')
    expect(deliverAt('02:15')).toBe('08:00')
    expect(deliverAt('18:30')).toBe('18:30')
  })

  it('горячих точек четыре, у каждой пояснение не длиннее 350 знаков', () => {
    expect(day11Script.hotspots.map((h) => h.title)).toEqual(['Комментарии целиком', 'Правило для комментариев', 'Правила уведомлений', 'Проверка чужим входом'])
    for (const h of day11Script.hotspots) {
      expect(h.text.length, h.title).toBeGreaterThan(20)
      expect(h.text.length, h.title).toBeLessThanOrEqual(350)
    }
  })

  it('реплики помещаются в две строки субтитров', () => {
    for (const c of day11Script.cues) expect(c.text.length, c.text).toBeLessThanOrEqual(92)
  })

  it('переходы и камера на месте, окна горячих точек — на неподвижных кадрах, вне переходов, выше субтитров', () => {
    expect(stagingProblems(day11Script, STAGING)).toEqual([])
  })
})
