import { errorCode } from '../ai/ai'
import type { DownloadsLike } from '../claude'

// Сохраняет MP4 ролика через возможность downloads: в просмотрщике Claude ссылки с download не работают.
// Возвращает текст ошибки для зрителя или null, если всё в порядке (или зритель сам отказался).
export async function saveVideo(url: string, filename: string, downloads: DownloadsLike, fetchImpl: typeof fetch = fetch): Promise<string | null> {
  try {
    const res = await fetchImpl(url)
    if (!res.ok) return 'Файл ролика недоступен'
    await downloads.save({ filename, data: await res.blob() })
    return null
  } catch (e) {
    return errorCode(e) === 'declined' ? null : 'Скачать не получилось, попробуйте позже'
  }
}
