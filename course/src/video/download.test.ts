import { describe, expect, it, vi } from 'vitest'
import { saveVideo } from './download'

// Поддельный ответ: Response из Node не принимает Blob из jsdom.
const okFetch = (async () => ({ ok: true, blob: async () => new Blob(['mp4'], { type: 'video/mp4' }) })) as unknown as typeof fetch

describe('saveVideo', () => {
  it('скачивает файл и передаёт его на сохранение', async () => {
    const downloads = { save: vi.fn(async () => undefined) }
    await expect(saveVideo('/_blob/1', 'pilot-rls.mp4', downloads, okFetch)).resolves.toBeNull()
    expect(downloads.save).toHaveBeenCalledWith({ filename: 'pilot-rls.mp4', data: expect.any(Blob) })
  })

  it('отказ сохранения — понятное сообщение, а не падение', async () => {
    const downloads = { save: vi.fn(async () => Promise.reject({ code: 'unavailable' })) }
    await expect(saveVideo('/_blob/1', 'pilot-rls.mp4', downloads, okFetch)).resolves.toBe('Скачать не получилось, попробуйте позже')
  })

  it('зритель отказался — без сообщения об ошибке', async () => {
    const downloads = { save: vi.fn(async () => Promise.reject({ code: 'declined' })) }
    await expect(saveVideo('/_blob/1', 'pilot-rls.mp4', downloads, okFetch)).resolves.toBeNull()
  })
})
