import { z } from 'zod'
import type { Day } from '../content/schema'

// Прогресс по курсу — чистые функции без часов и хранилищ; время подставляет вызывающий.

const DayProgressSchema = z.object({
  steps: z.record(z.string(), z.boolean()),
  quiz: z.object({ best: z.number(), total: z.number(), answers: z.record(z.string(), z.number()) }),
  trainers: z.record(z.string(), z.boolean()),
  scenarios: z.record(z.string(), z.string()),
  notes: z.string(),
  mentorAccepted: z.boolean(),
  completedAt: z.string().optional(),
})

const ProgressSchema = z.object({
  version: z.literal(1),
  updatedAt: z.string(),
  days: z.record(z.string(), DayProgressSchema),
  streak: z.object({ lastDate: z.string().nullable(), count: z.number() }),
  cards: z.record(z.string(), z.enum(['know', 'repeat'])),
})

export type DayProgress = z.infer<typeof DayProgressSchema>
export type Progress = z.infer<typeof ProgressSchema>
export type DayStatus = 'not-started' | 'in-progress' | 'done'

const PASS_SHARE = 0.8

export function emptyProgress(): Progress {
  return { version: 1, updatedAt: new Date(0).toISOString(), days: {}, streak: { lastDate: null, count: 0 }, cards: {} }
}

function emptyDay(): DayProgress {
  return { steps: {}, quiz: { best: 0, total: 0, answers: {} }, trainers: {}, scenarios: {}, notes: '', mentorAccepted: false }
}

function withDay(p: Progress, dayId: string, fn: (d: DayProgress) => DayProgress): Progress {
  return { ...p, days: { ...p.days, [dayId]: fn(p.days[dayId] ?? emptyDay()) } }
}

export function markStep(p: Progress, dayId: string, stepId: string, done: boolean): Progress {
  return withDay(p, dayId, (d) => ({ ...d, steps: { ...d.steps, [stepId]: done } }))
}

export function recordQuiz(p: Progress, dayId: string, answers: Record<string, number>, score: number, total: number): Progress {
  return withDay(p, dayId, (d) => ({ ...d, quiz: { best: Math.max(d.quiz.best, score), total, answers } }))
}

export function setTrainerDone(p: Progress, dayId: string, trainerId: string, done: boolean): Progress {
  return withDay(p, dayId, (d) => ({ ...d, trainers: { ...d.trainers, [trainerId]: done } }))
}

export function setScenarioEnding(p: Progress, dayId: string, scenarioId: string, ending: string): Progress {
  return withDay(p, dayId, (d) => ({ ...d, scenarios: { ...d.scenarios, [scenarioId]: ending } }))
}

export function setNotes(p: Progress, dayId: string, notes: string): Progress {
  return withDay(p, dayId, (d) => ({ ...d, notes }))
}

export function setMentorAccepted(p: Progress, dayId: string, accepted: boolean): Progress {
  return withDay(p, dayId, (d) => ({ ...d, mentorAccepted: accepted }))
}

export function setCard(p: Progress, term: string, mark: 'know' | 'repeat'): Progress {
  return { ...p, cards: { ...p.cards, [term]: mark } }
}

function nextDate(date: string): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

export function touchStreak(p: Progress, today: string): Progress {
  const { lastDate, count } = p.streak
  if (lastDate === today) return p
  const continued = lastDate !== null && nextDate(lastDate) === today
  return { ...p, streak: { lastDate: today, count: continued ? count + 1 : 1 } }
}

export function dayStatus(p: Progress, day: Day): DayStatus {
  const d = p.days[day.id]
  if (!d) return 'not-started'
  const stepsDone = day.practice.every((s) => d.steps[s.id])
  const quizPassed = day.quiz.length === 0 || (d.quiz.total > 0 && d.quiz.best / d.quiz.total >= PASS_SHARE)
  if (stepsDone && quizPassed && d.mentorAccepted) return 'done'
  const touched =
    Object.values(d.steps).some(Boolean) ||
    d.quiz.total > 0 ||
    Object.values(d.trainers).some(Boolean) ||
    Object.keys(d.scenarios).length > 0 ||
    d.notes.trim() !== '' ||
    d.mentorAccepted
  return touched ? 'in-progress' : 'not-started'
}

function orFlags(a: Record<string, boolean>, b: Record<string, boolean>): Record<string, boolean> {
  const out = { ...a }
  for (const [k, v] of Object.entries(b)) out[k] = Boolean(out[k]) || v
  return out
}

function mergeDay(older: DayProgress, newer: DayProgress): DayProgress {
  const bestQuiz = newer.quiz.best >= older.quiz.best ? newer.quiz : older.quiz
  const completed = [older.completedAt, newer.completedAt].filter((x): x is string => Boolean(x)).sort()[0]
  return {
    steps: orFlags(older.steps, newer.steps),
    quiz: { best: bestQuiz.best, total: bestQuiz.total || older.quiz.total, answers: newer.quiz.total > 0 ? newer.quiz.answers : older.quiz.answers },
    trainers: orFlags(older.trainers, newer.trainers),
    scenarios: { ...older.scenarios, ...newer.scenarios },
    notes: newer.notes || older.notes,
    mentorAccepted: older.mentorAccepted || newer.mentorAccepted,
    ...(completed ? { completedAt: completed } : {}),
  }
}

// Объединяет без потерь: отметки — «сделано хоть где-то», лучший тест — максимум, остальное — из более нового.
export function mergeProgress(a: Progress, b: Progress): Progress {
  const [older, newer] = a.updatedAt <= b.updatedAt ? [a, b] : [b, a]
  const days: Record<string, DayProgress> = { ...older.days }
  for (const [id, d] of Object.entries(newer.days)) days[id] = days[id] ? mergeDay(days[id], d) : d
  return {
    version: 1,
    updatedAt: newer.updatedAt,
    days,
    streak: newer.streak.count >= older.streak.count ? newer.streak : older.streak,
    cards: { ...older.cards, ...newer.cards },
  }
}

export function parseProgress(raw: unknown): Progress {
  const parsed = ProgressSchema.safeParse(raw)
  return parsed.success ? parsed.data : emptyProgress()
}
