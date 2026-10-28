import { describe, expect, it } from 'vitest'
import { catalog } from '../../video/catalog'
import { scriptProblems } from '../../video/kit/checks'
import { totalFrames, validateScript } from '../../video/lib/timeline'
import { LENGTH } from '../../video/term/problems'
import { videos } from './registry'

describe('реестр роликов', () => {
  it('в реестре те же ролики, что в каталоге', () => {
    expect(Object.keys(videos).sort()).toEqual(Object.keys(catalog).sort())
  })

  it('у каждой записи есть сценарий и загрузка, id сценария совпадает с ключом', () => {
    for (const [id, entry] of Object.entries(videos)) {
      expect(entry.script, id).toBeDefined()
      expect(typeof entry.load, id).toBe('function')
      expect(entry.script.id, id).toBe(id)
    }
  })

  // Старый ролик (1280 × 720) проверяет kit/checks: сцена на раздел книги, 5–7 сцен. Ролик набора «Репозиторий» (1920 × 1080) —
  // урок как данные: все его проверки (каркас, длина, реплики, кадры) — lessonProblems в lessons/<id>/lesson.test.ts, сцен в нём
  // много, по одной на мысль; здесь — что сценарий собран верно и длина в рамках своего вида.
  it('сценарий каждого ролика каталога проходит проверки своего вида', () => {
    for (const [id, entry] of Object.entries(catalog)) {
      expect(entry.title.length, id).toBeGreaterThan(0)
      if (entry.script.width === 1920) {
        expect(validateScript(entry.script), id).toEqual([])
        const [lo, hi] = LENGTH[entry.kind]
        expect(totalFrames(entry.script), id).toBeGreaterThanOrEqual(lo)
        expect(totalFrames(entry.script), id).toBeLessThanOrEqual(hi)
      } else {
        expect(scriptProblems(entry.script, entry.kind), id).toEqual([])
      }
    }
  })

  // По тесту на ролик: код сцен компилируется при первой загрузке, и вместе 27 роликов
  // не укладывались в общие 5 секунд, когда машина занята.
  it.each(Object.keys(videos))('загрузка %s отдаёт компонент по умолчанию', async (id) => {
    const mod = await videos[id].load()
    expect(typeof mod.default).toBe('function')
  }, 20_000)

  // MP4 есть только у старых роликов 1280 × 720; новые (1920 × 1080, набор «Репозиторий») смотрят в плеере, адреса и кнопки «Скачать MP4» у них нет
  it.each(Object.keys(catalog).filter((id) => catalog[id].script.width === 1280))('у старого ролика %s есть адрес MP4 в хранилище страницы', (id) => {
    expect(videos[id].mp4Url).toMatch(/^\/_blob\/[0-9a-f]{32}$/)
  })

  it('у роликов 1920 × 1080 адреса MP4 нет', () => {
    const wide = Object.keys(catalog).filter((id) => catalog[id].script.width === 1920)
    for (const id of wide) expect(videos[id].mp4Url, id).toBeUndefined()
  })
})
