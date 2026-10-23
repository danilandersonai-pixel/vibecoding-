// Кладёт книгу рядом с курсом (public/book.html), чтобы ссылки book.html#… работали в dev и в сборке.
import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
mkdirSync(join(root, 'public'), { recursive: true })
copyFileSync(join(root, '..', 'vibe-coding-na-praktike-2026-10.html'), join(root, 'public', 'book.html'))
