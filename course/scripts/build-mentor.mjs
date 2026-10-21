// Чек-листы наставника из файлов дней курса: day-NN.md для каждого готового дня.
// Запуск: node scripts/build-mentor.mjs <daysDir> <outDir>
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

function dayMarkdown(day) {
  const lines = [`# День ${day.number} — ${day.title}`, '', `**Цель:** ${day.goal}`, '', `**Результат дня:** ${day.result}`, '', '## Чек-лист', '']
  for (const c of day.mentor.checklist) lines.push(`- [ ] ${c.text}${c.auto ? ` [auto: ${c.auto}]` : ''}`)
  lines.push('', '## Вопросы автору', '')
  day.mentor.questions.forEach((q, i) => lines.push(`${i + 1}. ${q}`))
  lines.push('', '## Практика дня: критерии «готово»', '')
  for (const s of day.practice) lines.push(`- ${s.title} — готово, когда: ${s.done}`)
  return lines.join('\n') + '\n'
}

export function buildMentor(daysDir, outDir) {
  mkdirSync(outDir, { recursive: true })
  const written = []
  for (const file of readdirSync(daysDir).filter((f) => /^day-\d{2}\.json$/.test(f)).sort()) {
    const day = JSON.parse(readFileSync(join(daysDir, file), 'utf8'))
    if (day.status !== 'ready') continue
    const name = file.replace('.json', '.md')
    writeFileSync(join(outDir, name), dayMarkdown(day))
    written.push(name)
  }
  return written
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [daysDir, outDir] = process.argv.slice(2)
  if (!daysDir || !outDir) {
    console.error('Использование: node scripts/build-mentor.mjs <daysDir> <outDir>')
    process.exit(1)
  }
  console.log(`Чек-листы: ${buildMentor(daysDir, outDir).join(', ') || 'нет готовых дней'}`)
}
