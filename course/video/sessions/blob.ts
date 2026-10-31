import { createHash } from 'node:crypto'

// Хеш содержимого файла, как у `git hash-object`: sha1 от «blob <длина в байтах>\0» и самих байтов.
// Только для тестов и рекордера: в код кадров этот модуль не импортируется.
export function gitBlobHash(data: string | Uint8Array): string {
  const bytes = typeof data === 'string' ? Buffer.from(data, 'utf8') : data
  return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')
}
