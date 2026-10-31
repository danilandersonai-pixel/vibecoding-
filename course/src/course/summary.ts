import type { Day } from '../content/schema'
import { totalFrames } from '../../video/lib/timeline'
import { videos } from '../video/registry'

// Состав дня, обложка ролика и строка готовности — чистые функции, их строки показывают главная и страница дня.

// 260 → «4:20», 65 → «1:05»
export function formatDuration(seconds: number): string {
  const s = Math.round(seconds)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// Форма слова к числу: 1 видеоурок, 2 видеоурока, 5 и 11 видеоуроков, 21 видеоурок
export function plural(n: number, one: string, few: string, many: string): string {
  const mod100 = Math.abs(n) % 100
  const mod10 = mod100 % 10
  if (mod100 >= 11 && mod100 <= 14) return many
  if (mod10 === 1) return one
  if (mod10 >= 2 && mod10 <= 4) return few
  return many
}

export type VideoMeta = { seconds: number; posterFrame: number; hotspots: number }

// Длительность и кадр обложки ролика: poster сценария (у роликов «Репозиторий» — середина первого примера),
// без него — начало первой горячей точки (схема в этот момент готова), а без горячих точек — треть ролика. Неизвестный ролик — null.
export function videoMeta(videoId: string): VideoMeta | null {
  const script = videos[videoId]?.script
  if (!script) return null
  const frames = totalFrames(script)
  return {
    seconds: Math.round(frames / script.fps),
    posterFrame: script.poster ?? script.hotspots[0]?.from ?? Math.floor(frames / 3),
    hotspots: script.hotspots.length,
  }
}

// Сколько в дне видеоуроков и сколько они идут; ролики, которых нет в каталоге, не считаются
export function dayVideoSummary(day: Day): { count: number; seconds: number } {
  const metas = day.blocks.flatMap((b) => (b.type === 'video' ? [videoMeta(b.videoId)] : [])).filter((m) => m !== null)
  return { count: metas.length, seconds: metas.reduce((sum, m) => sum + m.seconds, 0) }
}

// «2 видеоурока (8:42), тест, 6 шагов практики» — только то, что в дне есть
export function daySummaryLine(day: Day): string {
  const video = dayVideoSummary(day)
  const parts: string[] = []
  if (video.count > 0) parts.push(`${video.count} ${plural(video.count, 'видеоурок', 'видеоурока', 'видеоуроков')} (${formatDuration(video.seconds)})`)
  if (day.quiz.length > 0) parts.push('тест')
  if (day.practice.length > 0) parts.push(`${day.practice.length} ${plural(day.practice.length, 'шаг', 'шага', 'шагов')} практики`)
  return parts.join(', ')
}

// Номера дней: подряд идущие сливаются в диапазон через «–», группы — через «, » («1–3, 5»)
function dayNumbers(days: Day[]): string {
  const groups: number[][] = []
  for (const n of days.map((d) => d.number).sort((a, b) => a - b)) {
    const last = groups[groups.length - 1]
    if (last && n === last[last.length - 1] + 1) last.push(n)
    else groups.push([n])
  }
  return groups.map((g) => (g.length === 1 ? `${g[0]}` : `${g[0]}–${g[g.length - 1]}`)).join(', ')
}

// Строка над картой: какие дни готовы полностью, а в каких пока есть цель (и ролики)
export function readinessLine(days: Day[]): string {
  const ready = days.filter((d) => d.status === 'ready')
  const drafts = days.filter((d) => d.status !== 'ready')
  if (drafts.length === 0) return 'Все дни курса готовы полностью.'

  const what = drafts.every((d) => dayVideoSummary(d).count > 0) ? 'цель и видеоуроки' : 'цель'
  const where = `${drafts.length === 1 ? 'дне' : 'днях'} ${dayNumbers(drafts)}`
  const tail = `уже есть ${what}, остальное появляется по мере готовности.`
  if (ready.length === 0) return `В ${where} ${tail}`
  return `Полностью ${ready.length === 1 ? 'готов день' : 'готовы дни'} ${dayNumbers(ready)}; в ${where} ${tail}`
}
