import { describe, expect, it } from 'vitest'
import { catalog } from '../../video/catalog'
import { scriptProblems } from '../../video/kit/checks'
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

  it('сценарий каждого ролика каталога проходит проверки своего вида', () => {
    for (const [id, entry] of Object.entries(catalog)) {
      expect(entry.title.length, id).toBeGreaterThan(0)
      expect(scriptProblems(entry.script, entry.kind), id).toEqual([])
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
