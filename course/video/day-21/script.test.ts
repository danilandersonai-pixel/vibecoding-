import { describe, expect, it } from 'vitest'
import { scriptProblems, stagingProblems } from '../kit/checks'
import { sceneStart } from '../lib/timeline'
import { DATA_ROWS, FAILS, PLAN, POLICY, RELEASE_CHECK, TODO_ITEMS } from './layout'
import { day21Script, STAGING } from './script'

// Текст реплик сцены — для проверки, что нужные слова прозвучали.
function sceneText(id: string): string {
  const start = sceneStart(day21Script, id)
  const scene = day21Script.scenes.find((s) => s.id === id)
  const end = start + (scene?.durationInFrames ?? 0)
  return day21Script.cues
    .filter((c) => c.from >= start && c.to <= end)
    .map((c) => c.text)
    .join(' ')
    .toLowerCase()
}

describe('сценарий ролика дня 21 «Запуск»', () => {
  it('проходит проверки ролика дня', () => {
    expect(scriptProblems(day21Script, 'day')).toEqual([])
  })

  it('четыре сцены: что строим, подводный камень, проверьте у себя, итог курса', () => {
    expect(day21Script.scenes.map((s) => s.id)).toEqual(['s1-build', 's2-policy', 's3-check', 's4-next'])
  })

  it('что строим: свой домен, страница о продукте и политика конфиденциальности', () => {
    const text = sceneText('s1-build')
    for (const word of ['бета-тест', 'запуск', 'дня 7', 'свой домен', 'регистратора', 'vercel', 'dns-записи', 'https', 'страница о продукте', 'для кого', 'что умеет', 'как начать', 'день 15', 'политика конфиденциальности']) expect(text, word).toContain(word)
  })

  it('подводный камень: шаблон без данных о здоровье, затем политика от своих данных — пять вопросов и юрист', () => {
    const text = sceneText('s2-policy')
    for (const word of ['подводный камень', 'данные о здоровье', 'шаблон', 'замеры', 'фото', 'дневник питания', 'анна', 'кто видит', 'что собираем', 'зачем', 'где хранится', 'как удалить', 'анну — только марина', 'supabase', 'своей страны', 'юрист']) expect(text, word).toContain(word)
  })

  it('проверьте у себя: данные против политики, удаление, телефон, чек-лист главы 7 и истории главы 8', () => {
    const text = sceneText('s3-check')
    for (const word of ['проверьте у себя', 'таблицы и хранилища', 'дня 6', 'в политике', 'комментарии', 'кнопки удаления', 'ещё нет', 'удалите', 'на телефоне', 'день 7', 'чек-лист главы 7', '«сделано»', '«не знаю»', '«не сделано»', 'руками', 'до запуска', 'истории провалов', 'главы 8']) expect(text, word).toContain(word)
  })

  it('итог курса: от идеи в двух абзацах к приложению на своём домене, план на месяц и итоговый тест', () => {
    const text = sceneText('s4-next')
    for (const word of ['в первый день', 'двух абзацах', 'своём домене', 'двух ролей', 'бета-тест', 'план развития на месяц', 'итоговый тест курса', 'удачного запуска']) expect(text, word).toContain(word)
  })

  it('юридическое — осторожно: ни названий законов, ни штрафов, только «закон своей страны» и юрист', () => {
    const all = [...day21Script.cues.map((c) => c.text), ...day21Script.hotspots.map((h) => h.text)].join(' ')
    expect(all).not.toMatch(/ФЗ|GDPR|штраф|обязан/i)
  })

  it('политика отвечает на пять вопросов и называет имя и почту; комментарии в ней забыты — их находит проверка в сцене 3', () => {
    expect(POLICY.map((p) => p.q)).toEqual(['Что собираем', 'Зачем', 'Кто видит', 'Где хранится', 'Как удалить'])
    const answers = POLICY.map((p) => `${p.a} ${p.a2 ?? ''}`).join(' ')
    expect(answers).not.toMatch(/коммент/i)
    for (const word of ['имя', 'почта', 'вес и замеры', 'фото', 'питание']) expect(answers, word).toContain(word)
    expect(POLICY[2].a).toMatch(/подопечный и его тренер/)
  })

  it('список агента — с профилями (имя, почта), комментарии — последней строкой; удаление — строки и фото', () => {
    expect(DATA_ROWS[0]).toMatch(/имя, почта/)
    expect(DATA_ROWS[DATA_ROWS.length - 1]).toMatch(/комментарии/)
    expect(TODO_ITEMS[1]).toBe('удаление: строки и фото')
  })

  it('чек-лист главы 7 — шесть пунктов, истории главы 8 — шесть провалов книги', () => {
    expect(RELEASE_CHECK).toHaveLength(6)
    expect(FAILS.map((f) => f.name)).toEqual(['Replit', 'Tea', 'Lovable', 's1ngularity', 'Cline', 'PocketOS'])
  })

  it('план на месяц берёт отложенное из отзывов: тёмная тема Олега (день 8) и приглашение по номеру Кирилла (день 19)', () => {
    const plan = PLAN.join(' ')
    for (const word of ['тёмная тема', 'Олег', 'по номеру', 'Кирилл', 'ошибок', 'копию', 'агенту']) expect(plan, word).toContain(word)
  })

  it('горячих точек четыре — домен, политика, чек-лист, план; у каждой короткое пояснение (до 350 знаков)', () => {
    expect(day21Script.hotspots.map((h) => h.title)).toEqual(['Свой домен', 'Политика по своим данным', 'Чек-лист перед первым релизом', 'План на месяц'])
    for (const h of day21Script.hotspots) {
      expect(h.text.length, h.title).toBeGreaterThan(20)
      expect(h.text.length, h.title).toBeLessThanOrEqual(350)
    }
  })

  it('реплики помещаются в две строки субтитров', () => {
    for (const c of day21Script.cues) expect(c.text.length, c.text).toBeLessThanOrEqual(92)
  })

  it('переходы и камера на месте, окна горячих точек — на неподвижных кадрах, вне переходов, выше субтитров', () => {
    expect(stagingProblems(day21Script, STAGING)).toEqual([])
  })
})
