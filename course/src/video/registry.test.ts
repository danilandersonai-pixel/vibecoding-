import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { catalog } from '../../video/catalog'
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

  // Review Focus 4 недели 3: старых роликов (1280 × 720, kit/checks) в каталоге больше нет — последний, day-21, заменён уроком
  // набора «Репозиторий». Код кадра 1280 × 720 и «Скачать MP4» в плеере остаётся до решения об озвучке: его держат тесты на фикстуре
  // src/video/fixtures/old-video.json, а не ролики каталога
  it('у каждого ролика каталога width 1920', () => {
    const old = Object.entries(catalog).filter(([, e]) => e.script.width !== 1920 || e.script.height !== 1080).map(([id]) => id)
    expect(old).toEqual([])
  })

  // Ролик набора «Репозиторий» (1920 × 1080) — урок как данные: все его проверки (каркас, длина, реплики, кадры) — lessonProblems
  // в lessons/<id>/lesson.test.ts, сцен в нём много, по одной на мысль; здесь — что сценарий собран верно и длина в рамках своего вида.
  it('сценарий каждого ролика каталога собран верно, длина — в рамках своего вида', () => {
    for (const [id, entry] of Object.entries(catalog)) {
      expect(entry.title.length, id).toBeGreaterThan(0)
      expect(validateScript(entry.script), id).toEqual([])
      const [lo, hi] = LENGTH[entry.kind]
      expect(totalFrames(entry.script), id).toBeGreaterThanOrEqual(lo)
      expect(totalFrames(entry.script), id).toBeLessThanOrEqual(hi)
    }
  })

  // По тесту на ролик: код сцен компилируется при первой загрузке, и вместе 27 роликов
  // не укладывались в общие 5 секунд, когда машина занята.
  it.each(Object.keys(videos))('загрузка %s отдаёт компонент по умолчанию', async (id) => {
    const mod = await videos[id].load()
    expect(typeof mod.default).toBe('function')
  }, 20_000)

  // Ролик набора «Репозиторий» проверяет только тест его урока (lessonProblems и снимок сценария): без него ролик прошёл бы реестр по одной длине
  it.each(Object.keys(catalog).filter((id) => catalog[id].script.width === 1920))('у ролика 1920 × 1080 %s есть тест урока video/lessons/<id>/lesson.test.ts', (id) => {
    expect(existsSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../video/lessons', id, 'lesson.test.ts')), id).toBe(true)
  })

  // MP4 были только у старых роликов 1280 × 720; ролики набора «Репозиторий» смотрят в плеере, адреса и кнопки «Скачать MP4» у них нет
  it('у роликов 1920 × 1080 адреса MP4 нет', () => {
    const wide = Object.keys(catalog).filter((id) => catalog[id].script.width === 1920)
    for (const id of wide) expect(videos[id].mp4Url, id).toBeUndefined()
  })
})
