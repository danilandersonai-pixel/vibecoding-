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

  it('загрузка отдаёт компонент по умолчанию', async () => {
    for (const [id, entry] of Object.entries(videos)) {
      const mod = await entry.load()
      expect(typeof mod.default, id).toBe('function')
    }
  })

  it('у пилота есть адрес MP4 в хранилище страницы', () => {
    expect(videos['pilot-rls'].mp4Url).toBe('/_blob/08c8f08ad24664e9822024a19eda61ef')
  })
})
