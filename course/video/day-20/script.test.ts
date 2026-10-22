import { describe, expect, it } from 'vitest'
import { scriptProblems, stagingProblems } from '../kit/checks'
import { sceneStart } from '../lib/timeline'
import { BETA, BIG, DAY19, FIX_COMMIT, KSENIA_OK, LEVELS, PIPELINE, POLINA_WEEK, queue, REMARKS, REPRO, saves, TERM_GREEN, TERM_RED, TODAY } from './layout'
import { day20Script, STAGING } from './script'

// Текст реплик сцены — для проверки, что нужные слова прозвучали.
function sceneText(id: string): string {
  const start = sceneStart(day20Script, id)
  const scene = day20Script.scenes.find((s) => s.id === id)
  const end = start + (scene?.durationInFrames ?? 0)
  return day20Script.cues
    .filter((c) => c.from >= start && c.to <= end)
    .map((c) => c.text)
    .join(' ')
    .toLowerCase()
}

describe('сценарий ролика дня 20 «Бета-тест: исправления»', () => {
  it('проходит проверки ролика дня', () => {
    expect(scriptProblems(day20Script, 'day')).toEqual([])
  })

  it('четыре сцены: зачем, что строим сегодня, подводный камень, проверьте у себя', () => {
    expect(day20Script.scenes.map((s) => s.id)).toEqual(['s1-why', 's2-build', 's3-all', 's4-check'])
  })

  it('вступление короткое: только зачем — без ступеней, теста и коммита следующих сцен', () => {
    const text = sceneText('s1-why')
    for (const word of ['бета-теста', 'с дня 19', 'шесть замечаний', 'четырёх тренеров', 'день 21', 'услышали', 'исправляем', '«исправлено»', 'кто нашёл']) expect(text, word).toContain(word)
    for (const word of ['ступен', 'тест повтор', 'коммит', 'тимур', 'ксени', 'агент']) expect(text, word).not.toContain(word)
    expect(day20Script.cues.filter((c) => c.from < day20Script.scenes[0].durationInFrames).length).toBeLessThanOrEqual(3)
  })

  it('что строим: очередь по тяжести (ступени — пример), затем круг одного исправления', () => {
    const text = sceneText('s2-build')
    for (const word of ['по тяжести', 'стопки в день 8, только ступеней у нас четыре', 'данные пропадают', 'видны чужим', 'не даёт работать', 'раздражает', '«было бы хорошо»']) expect(text, word).toContain(word)
    for (const word of ['ксения', 'ошибка', 'всё пропало', 'наверх', 'отчёт кирилла', 'вторая', 'третья', 'подождут внизу', 'по одному', 'сверху вниз']) expect(text, word).toContain(word)
    for (const word of ['тест повторяет беду', 'отчёте об ошибке', 'с дня 14', 'красный', 'беда поймана', 'правит код', 'тест не трогает', 'зелёный', 'один маленький коммит', 'выложена', '«исправлено» говорит ксения', 'только тогда', 'следующее']) expect(text, word).toContain(word)
  })

  it('подводный камень: всё сразу одним коммитом, без новых тестов, новая беда, поиск пополам, главная беда осталась, откат', () => {
    const text = sceneText('s3-all')
    for (const word of ['подводный камень', 'всё сразу', 'все шесть замечаний', 'один коммит', '23 файла', 'толком нельзя', 'новых тестов нет', 'полины', 'съехали на день', 'делением пополам', 'главы 5', 'шесть правок', 'какая', 'ксения', 'снова не сохранилась', 'главная беда осталась', 'откатить', 'удачные тоже', 'шаг вперёд — два назад', 'главы 3']) expect(text, word).toContain(word)
  })

  it('«шаг вперёд — два назад» (глава 3) — о новой беде после правок, а не об откате', () => {
    const start = sceneStart(day20Script, 's3-all')
    const lines = day20Script.cues.filter((c) => c.from >= start && c.from < start + day20Script.scenes[2].durationInFrames).map((c) => c.text.toLowerCase())
    const calendar = lines.find((l) => l.includes('съехали на день'))
    const rollback = lines.find((l) => l.includes('откатить'))
    expect(calendar).toContain('«шаг вперёд — два назад» из главы 3')
    expect(rollback).not.toContain('шаг вперёд')
  })

  it('проверьте у себя: ступени, шаги до беды, красный тест, фоновый агент, коммит, тренер, следующее', () => {
    const text = sceneText('s4-check')
    for (const word of ['проверьте у себя', 'четырём ступеням', 'верхнее', 'шаги', 'тест', 'упасть', 'фоновому агенту', 'как в день 8', 'зелёный', 'один коммит', 'выкладка', 'тренера повторить', 'следующее', 'список подождёт']) expect(text, word).toContain(word)
  })

  it('горячих точек четыре; у каждой короткое пояснение (до 350 знаков)', () => {
    expect(day20Script.hotspots.map((h) => h.title)).toEqual(['Очередь по тяжести', 'Круг одного исправления', 'Один коммит на всё', 'Проверьте у себя'])
    for (const h of day20Script.hotspots) {
      expect(h.text.length, h.title).toBeGreaterThan(20)
      expect(h.text.length, h.title).toBeLessThanOrEqual(350)
    }
  })

  it('ступени — решение примера: пояснение точки так и говорит', () => {
    expect(day20Script.hotspots[0].text).toContain('решение нашего примера')
  })

  it('реплики помещаются в две строки субтитров', () => {
    for (const c of day20Script.cues) expect(c.text.length, c.text).toBeLessThanOrEqual(92)
  })

  it('переходы и камера на месте, окна горячих точек — на неподвижных кадрах, вне переходов, выше субтитров', () => {
    expect(stagingProblems(day20Script, STAGING)).toEqual([])
  })
})

describe('пример ролика дня 20 верен', () => {
  it('шесть замечаний от четырёх тренеров: четыре — из списка дня 19, ещё два пришли за неделю', () => {
    expect(BETA).toEqual(['Полина', 'Кирилл', 'Тимур', 'Ксения'])
    expect(REMARKS).toHaveLength(6)
    for (const r of REMARKS) expect(BETA, r.who).toContain(r.who)
    for (const who of BETA) expect(REMARKS.some((r) => r.who === who), who).toBe(true)
    // первые четыре строки — те же, что в списке дня 19, в том же порядке
    expect(REMARKS.slice(0, 4).map((r) => [r.who, r.id])).toEqual(DAY19.map((d) => [d.who, d.id]))
    expect(sceneText('s1-why')).toContain('шесть замечаний от четырёх тренеров')
  })

  it('ступеней четыре, у каждого замечания своя ступень', () => {
    expect(LEVELS.map((l) => l.n)).toEqual([1, 2, 3, 4])
    for (const r of REMARKS) expect([1, 2, 3, 4], r.id).toContain(r.level)
  })

  it('очередь — по ступеням сверху вниз, как в репликах: Ксения, отчёт Кирилла, дата и рекорды, номер и выгрузка', () => {
    const q = queue(REMARKS)
    expect(q.map((r) => r.id)).toEqual(['save', 'report', 'date', 'records', 'phone', 'export'])
    for (let i = 1; i < q.length; i++) expect(q[i].level).toBeGreaterThanOrEqual(q[i - 1].level)
    expect(q[0].who).toBe('Ксения')
    expect(q[1].who).toBe('Кирилл')
    // список — в порядке поступления, а не по тяжести
    expect(REMARKS.map((r) => r.id)).not.toEqual(q.map((r) => r.id))
  })

  it('тест повторяет беду по шагам из отчёта об ошибке: упражнение не из библиотеки, «Сохранить»', () => {
    expect(REPRO.steps).toHaveLength(3)
    expect(REPRO.steps[1]).toContain('не из библиотеки')
    expect(REPRO.steps[2]).toContain('«Сохранить»')
    expect(REPRO.expect).toContain('сохранена')
  })

  it('до исправления тренировка с новым упражнением не сохраняется — тест красный; после — сохраняется, тест зелёный', () => {
    expect(saves({ newExercise: true }, false)).toBe(false)
    expect(saves({ newExercise: false }, false)).toBe(true) // обычная тренировка и раньше сохранялась
    expect(saves({ newExercise: true }, true)).toBe(true)
    expect(saves({ newExercise: false }, true)).toBe(true)
    expect(TERM_RED[1].text.startsWith('FAIL')).toBe(true)
    expect(TERM_RED[2].text).toContain('ошибка сохранения')
    expect(TERM_GREEN[1].text.startsWith('PASS')).toBe(true)
    expect(TERM_GREEN[1].text.slice(4)).toBe(TERM_RED[1].text.slice(4))
    expect(KSENIA_OK).toContain('Сохранилась')
  })

  it('исправление — один маленький коммит: правка и новый тест; большой коммит — все шесть правок и ни одного нового теста', () => {
    expect(FIX_COMMIT.files).toHaveLength(2)
    expect(FIX_COMMIT.files).toContain('новый тест')
    expect(BIG.fixes).toHaveLength(REMARKS.length)
    expect(BIG.fixes).toEqual(REMARKS.map((r) => r.fix))
    expect(BIG.newTests).toBe(0)
    expect(sceneText('s3-all')).toContain(`${BIG.files} файла`)
    // реплика называет правки, которые есть в коммите
    for (const word of ['сохранение', 'отчёт', 'даты', 'приглашения']) expect(sceneText('s3-all'), word).toContain(word)
  })

  it('у Полины каждая тренировка съехала ровно на день', () => {
    expect(POLINA_WEEK.before).toHaveLength(POLINA_WEEK.after.length)
    POLINA_WEEK.before.forEach((d, i) => expect(POLINA_WEEK.after[i] - d).toBe(1))
  })

  it('круг одного исправления — пять шагов по порядку реплик; чек-лист «Сегодня у себя» — шесть пунктов', () => {
    expect(PIPELINE).toEqual(['тест повторяет', 'правим код', 'один коммит', 'выкладка', 'тренер: ✓'])
    expect(TODAY).toHaveLength(6)
    for (const t of TODAY) expect(t.length, t).toBeLessThanOrEqual(30)
  })

  it('строки терминала не длиннее 40 знаков', () => {
    for (const l of [...TERM_RED, ...TERM_GREEN]) expect(l.text.length, l.text).toBeLessThanOrEqual(40)
  })
})
