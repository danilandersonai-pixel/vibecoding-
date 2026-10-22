import { describe, expect, it } from 'vitest'
import { scriptProblems, stagingProblems } from '../kit/checks'
import { sceneStart } from '../lib/timeline'
import { differs, editSet, EDITED, fitsNote, fitsRow, kgText, NOTES, PLAN, PLAN_NEW, setText, SETS, storeBlind, storeOnce, TODAY, VOLUME, VOLUME_DOUBLE, VOLUME_EDITED, volumeOf } from './layout'
import { day18Script, STAGING } from './script'

// Текст реплик сцены — для проверки, что нужные слова прозвучали.
function sceneText(id: string): string {
  const start = sceneStart(day18Script, id)
  const scene = day18Script.scenes.find((s) => s.id === id)
  const end = start + (scene?.durationInFrames ?? 0)
  return day18Script.cues
    .filter((c) => c.from >= start && c.to <= end)
    .map((c) => c.text)
    .join(' ')
    .toLowerCase()
}

describe('сценарий ролика дня 18 «Тренировка без интернета»', () => {
  it('проходит проверки ролика дня', () => {
    expect(scriptProblems(day18Script, 'day')).toEqual([])
  })

  it('четыре сцены: зачем, что строим, подводный камень, проверьте у себя', () => {
    expect(day18Script.scenes.map((s) => s.id)).toEqual(['s1-today', 's2-build', 's3-double', 's4-check'])
  })

  it('вступление короткое: только зачем и план дня — без очереди, номеров и дублей из следующих сцен', () => {
    const text = sceneText('s1-today')
    for (const word of ['подвальном', 'связь', 'последних 30%', 'без интернета', 'связь вернётся']) expect(text, word).toContain(word)
    for (const word of ['очеред', 'номер', 'дважды', 'дубл', '775']) expect(text, word).not.toContain(word)
    expect(day18Script.cues.filter((c) => c.from < day18Script.scenes[0].durationInFrames).length).toBeLessThanOrEqual(3)
  })

  it('что строим: подход сначала на телефоне, очередь с пометкой, отправка после ответа сервера', () => {
    const text = sceneText('s2-build')
    for (const word of ['на телефоне', '5 × 50 кг', 'очередь', '«не отправлено»', 'по порядку', 'связь вернулась', '«принято»', '«отправлено»', 'у марины', '775 кг']) expect(text, word).toContain(word)
  })

  it('подводный камень: повтор после потерянного ответа и защита от дублей, затем конфликт и правило', () => {
    const text = sceneText('s3-double')
    for (const word of ['подводный камень', 'двойная отправка', 'конфликт', 'потерялся', 'ещё раз', '1050 кг', '775', 'оба настоящие', 'свой номер', 'один раз', 'защита от дублей', 'явно']) expect(text, word).toContain(word)
    for (const word of ['без связи', '4 повтора', '52,5 кг', 'одна запись', 'затрёт', 'только марина', 'только анна', 'расхождение']) expect(text, word).toContain(word)
  })

  it('проверьте у себя: режим полёта, перезапуск, ровно три у тренера, тест на повтор, нарочная поломка, конфликт', () => {
    const text = sceneText('s4-check')
    for (const word of ['проверьте у себя', 'режим полёта', 'три подхода', 'на месте', 'ровно три', 'тест', 'тем же номером', 'одна строка', 'сломайте', 'не покраснел', 'конфликт', 'новый план', 'молча']) expect(text, word).toContain(word)
  })

  it('горячих точек четыре — очередь, номер подхода, план и подходы, проверка; пояснения до 350 знаков', () => {
    expect(day18Script.hotspots.map((h) => h.title)).toEqual(['Очередь на телефоне', 'Номер подхода', 'План и подходы — отдельно', 'Проверка без интернета'])
    for (const h of day18Script.hotspots) {
      expect(h.text.length, h.title).toBeGreaterThan(20)
      expect(h.text.length, h.title).toBeLessThanOrEqual(350)
    }
  })

  it('реплики помещаются в две строки субтитров', () => {
    for (const c of day18Script.cues) expect(c.text.length, c.text).toBeLessThanOrEqual(92)
  })

  it('переходы и камера на месте, окна горячих точек — на неподвижных кадрах, вне переходов, выше субтитров', () => {
    expect(stagingProblems(day18Script, STAGING)).toEqual([])
  })
})

describe('пример: подходы Анны, повтор и конфликт', () => {
  it('три подхода с разными номерами; объём — сумма повторов × вес: 250 + 250 + 275 = 775 кг', () => {
    expect(SETS.map(setText)).toEqual(['5 × 50 кг', '5 × 50 кг', '5 × 55 кг'])
    expect(new Set(SETS.map((s) => s.id)).size).toBe(3)
    expect(volumeOf(SETS)).toBe(775)
    expect(kgText(volumeOf(SETS))).toBe('775 кг')
  })

  it('без защиты повтор третьего подхода записывается второй раз: четыре строки и 1050 кг', () => {
    const stored = storeBlind(SETS, SETS[2])
    expect(stored).toHaveLength(4)
    expect(volumeOf(stored)).toBe(1050)
  })

  it('с защитой повтор с тем же номером пропускается: три строки и 775 кг', () => {
    const stored = storeOnce(storeOnce(SETS, SETS[2]), SETS[2])
    expect(stored).toHaveLength(3)
    expect(volumeOf(stored)).toBe(775)
  })

  it('два одинаковых по содержанию подхода с разными номерами — оба настоящие и оба записаны', () => {
    expect(setText(SETS[0])).toBe(setText(SETS[1]))
    expect(storeOnce([SETS[0]], SETS[1])).toHaveLength(2)
  })

  it('правка без связи меняет только свой подход: 4 × 55, объём 250 + 250 + 220 = 720 кг', () => {
    const edited = editSet(SETS, 'e05b', { reps: 4 })
    expect(edited.map(setText)).toEqual(['5 × 50 кг', '5 × 50 кг', '4 × 55 кг'])
    expect(volumeOf(edited)).toBe(720)
    expect(SETS[2].reps).toBe(5)
  })

  it('новый план меняет только план: 52,5 кг в третьем подходе, а сделанное расходится с ним и это видно', () => {
    expect(PLAN.map(setText)).toEqual(['5 × 50 кг', '5 × 50 кг', '5 × 55 кг'])
    expect(PLAN_NEW.map(setText)).toEqual(['5 × 50 кг', '5 × 50 кг', '5 × 52,5 кг'])
    const edited = editSet(SETS, 'e05b', { reps: 4 })
    expect(differs(PLAN_NEW[2], edited[2])).toBe(true)
    expect(differs(PLAN_NEW[0], edited[0])).toBe(false)
  })

  it('строки подходов с номером и пометки помещаются на экран телефона', () => {
    for (const s of [...SETS, ...EDITED]) expect(fitsRow(setText(s)), setText(s)).toBe(true)
    for (const n of Object.values(NOTES)) expect(fitsNote(n), n).toBe(true)
    expect(NOTES.plan).toBe('новый план: 52,5')
  })

  it('числа на экране — из расчёта: 775, 1050 и 720 кг', () => {
    expect([VOLUME, VOLUME_DOUBLE, VOLUME_EDITED].map(kgText)).toEqual(['775 кг', '1050 кг', '720 кг'])
  })

  it('в «проверьте у себя» шесть дел — по порядку реплик', () => {
    expect(TODAY).toHaveLength(6)
  })
})
