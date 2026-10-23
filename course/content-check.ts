import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { DaySchema } from './src/content/schema'

// Проверка содержания курса до сборки: ошибка в данных должна ломать сборку, а не страницу.
// Возвращает понятные ошибки вида «day-02.json: blocks.0.figure: …»; пустой список — всё в порядке.
export function checkContent(contentDir: string): string[] {
  const daysDir = join(contentDir, 'days')
  const figuresDir = join(contentDir, 'figures')
  const errors: string[] = []
  for (const file of readdirSync(daysDir).filter((f) => f.endsWith('.json')).sort()) {
    let raw: unknown
    try {
      raw = JSON.parse(readFileSync(join(daysDir, file), 'utf8'))
    } catch (e) {
      errors.push(`${file}: не читается как JSON (${(e as Error).message})`)
      continue
    }
    const parsed = DaySchema.safeParse(raw)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) errors.push(`${file}: ${issue.path.join('.') || '(весь файл)'}: ${issue.message}`)
      continue
    }
    parsed.data.blocks.forEach((b, i) => {
      if ((b.type === 'idea' || b.type === 'diagram') && b.figure && !existsSync(join(figuresDir, `${b.figure}.svg`))) {
        errors.push(`${file}: blocks.${i}.figure: нет схемы «${b.figure}» в content/figures`)
      }
    })
  }
  return errors
}
