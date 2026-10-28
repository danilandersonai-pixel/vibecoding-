import { describe, expect, it } from 'vitest'
import { getDays } from '../content/load'
import fixture from '../content/fixtures/valid-day.json'
import { DaySchema, type Day } from '../content/schema'
import { pilotRlsScript } from '../../video/pilot-rls/script'
import { videos } from '../video/registry'
import { daySummaryLine, dayVideoSummary, formatDuration, plural, readinessLine, videoMeta } from './summary'

const days = getDays()

// Синтетический день на основе фикстуры: меняются номер, id, статус и блоки. Без роликов — пустой черновик.
function makeDay(number: number, status: Day['status'], withVideos: boolean): Day {
  const id = `day-${String(number).padStart(2, '0')}`
  return DaySchema.parse({ ...structuredClone(fixture), number, id, status, blocks: withVideos ? fixture.blocks : [] })
}

describe('summary', () => {
  it('formatDuration', () => {
    expect(formatDuration(260)).toBe('4:20')
    expect(formatDuration(65)).toBe('1:05')
    expect(formatDuration(0)).toBe('0:00')
  })

  it('обложка ролика — начало первой горячей точки', () => {
    const meta = videoMeta('pilot-rls')!
    expect(meta.posterFrame).toBe(pilotRlsScript.hotspots[0].from)
    expect(meta.seconds).toBe(203)
    expect(meta.hotspots).toBe(pilotRlsScript.hotspots.length)
    expect(videoMeta('нет')).toBeNull()
  })

  it('обложка ролика с poster — этот кадр (середина первого примера), а не горячая точка', () => {
    const script = { ...pilotRlsScript, id: 'poster-test', width: 1920 as const, height: 1080 as const, poster: 1234 }
    videos['poster-test'] = { script, load: videos['pilot-rls'].load }
    try {
      expect(videoMeta('poster-test')!.posterFrame).toBe(1234)
    } finally {
      delete videos['poster-test']
    }
  })

  it('plural', () => {
    const forms = [1, 2, 5, 11, 21, 22].map((n) => plural(n, 'видеоурок', 'видеоурока', 'видеоуроков'))
    expect(forms).toEqual(['видеоурок', 'видеоурока', 'видеоуроков', 'видеоуроков', 'видеоурок', 'видеоурока'])
  })

  it('dayVideoSummary: ролики дня и их длительность; неизвестные ролики не считаются', () => {
    expect(dayVideoSummary(days[0])).toEqual({ count: 2, seconds: 538 })
    const unknown = DaySchema.parse({ ...structuredClone(fixture), blocks: [{ type: 'video', videoId: 'нет', title: 'Нет такого' }] })
    expect(dayVideoSummary(unknown)).toEqual({ count: 0, seconds: 0 })
  })

  it('состав дня 1', () => {
    expect(daySummaryLine(days[0])).toBe('2 видеоурока (8:58), тест, 6 шагов практики')
  })

  it('состав чернового дня 4', () => {
    expect(daySummaryLine(days[3])).toBe('1 видеоурок (3:23)')
  })

  it('состав дня без роликов — без скобок, части через запятую', () => {
    expect(daySummaryLine(makeDay(4, 'draft', false))).toBe('тест, 1 шаг практики')
  })

  it('строка готовности: готов день 1, черновики 2–21 с роликами', () => {
    expect(readinessLine(days)).toBe('Полностью готов день 1; в днях 2–21 уже есть цель и видеоуроки, остальное появляется по мере готовности.')
  })

  it('строка готовности: готовы дни 1–3 и 5, черновик 4 без роликов', () => {
    const list = [makeDay(1, 'ready', true), makeDay(2, 'ready', true), makeDay(3, 'ready', true), makeDay(4, 'draft', false), makeDay(5, 'ready', true)]
    expect(readinessLine(list)).toBe('Полностью готовы дни 1–3, 5; в дне 4 уже есть цель, остальное появляется по мере готовности.')
  })

  it('строка готовности: у части черновиков нет роликов — только «цель»', () => {
    const list = [makeDay(1, 'ready', true), makeDay(2, 'draft', true), makeDay(3, 'draft', false)]
    expect(readinessLine(list)).toBe('Полностью готов день 1; в днях 2–3 уже есть цель, остальное появляется по мере готовности.')
  })

  it('строка готовности: готовых дней нет', () => {
    const list = [makeDay(1, 'draft', true), makeDay(2, 'draft', true)]
    expect(readinessLine(list)).toBe('В днях 1–2 уже есть цель и видеоуроки, остальное появляется по мере готовности.')
  })

  it('строка готовности: все готовы', () => {
    const list = [makeDay(1, 'ready', true), makeDay(2, 'ready', true)]
    expect(readinessLine(list)).toBe('Все дни курса готовы полностью.')
  })
})
