import { z } from 'zod'

// Содержание дня курса. Черновик требует только заголовок и цель, готовый день — всё.

const BookRefSchema = z.object({ section: z.string().min(1), label: z.string().min(1) })

const HotspotSchema = z.object({
  id: z.string().min(1),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  w: z.number().min(0).max(1),
  h: z.number().min(0).max(1),
  title: z.string().min(1),
  text: z.string().min(1),
})

const PromptPartKey = z.enum(['goal', 'context', 'constraints', 'criteria', 'format'])

const VideoBlock = z.object({ type: z.literal('video'), videoId: z.string().min(1), title: z.string().min(1) })
const IdeaBlock = z.object({
  type: z.literal('idea'),
  id: z.string().min(1),
  title: z.string().min(1),
  text: z.string().min(1),
  figure: z.string().optional(),
  bookRef: BookRefSchema.optional(),
})
const DiagramBlock = z.object({
  type: z.literal('diagram'),
  id: z.string().min(1),
  figure: z.string().min(1),
  caption: z.string().min(1),
  hotspots: z.array(HotspotSchema),
  steps: z.array(z.string().min(1)).optional(),
})
const PromptBuilderTrainer = z.object({
  type: z.literal('trainer'),
  kind: z.literal('prompt-builder'),
  id: z.string().min(1),
  task: z.string().min(1),
  parts: z
    .array(z.object({ key: PromptPartKey, label: z.string().min(1), good: z.array(z.string().min(1)).min(1), bad: z.array(z.string().min(1)) }))
    .min(1),
})
const FindTheBugTrainer = z.object({
  type: z.literal('trainer'),
  kind: z.literal('find-the-bug'),
  id: z.string().min(1),
  title: z.string().min(1),
  lines: z.array(z.string()).min(1),
  bugLines: z.array(z.number().int().min(0)).min(1),
  explanation: z.string().min(1),
})
const SortTrainer = z.object({
  type: z.literal('trainer'),
  kind: z.literal('sort'),
  id: z.string().min(1),
  title: z.string().min(1),
  buckets: z.array(z.object({ id: z.string().min(1), label: z.string().min(1) })).min(2),
  items: z.array(z.object({ id: z.string().min(1), text: z.string().min(1), bucket: z.string().min(1) })).min(1),
})
const ScenarioNode = z.object({
  text: z.string().min(1),
  choices: z.array(z.object({ label: z.string().min(1), next: z.string().min(1) })),
  ending: z.enum(['good', 'bad', 'neutral']).optional(),
})
const ScenarioBlock = z.object({
  type: z.literal('scenario'),
  id: z.string().min(1),
  title: z.string().min(1),
  start: z.string().min(1),
  nodes: z.record(z.string(), ScenarioNode),
})
const AiHelperBlock = z.object({
  type: z.literal('ai-helper'),
  id: z.string().min(1),
  mode: z.enum(['prompt-review', 'ask']),
  title: z.string().min(1),
  placeholder: z.string().min(1),
  context: z.string().min(1),
})

export const BlockSchema = z.union([
  VideoBlock,
  IdeaBlock,
  DiagramBlock,
  PromptBuilderTrainer,
  FindTheBugTrainer,
  SortTrainer,
  ScenarioBlock,
  AiHelperBlock,
])

const QuizQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  correct: z.number().int().min(0),
  explanation: z.string().min(1),
})
const PracticeStepSchema = z.object({ id: z.string().min(1), title: z.string().min(1), prompt: z.string().optional(), done: z.string().min(1) })
const MentorCheckSchema = z.object({ id: z.string().min(1), text: z.string().min(1), auto: z.enum(['tests', 'lint', 'secrets', 'rls', 'file']).optional() })

export const DaySchema = z
  .object({
    id: z.string().regex(/^day-\d{2}$/),
    number: z.number().int().min(1).max(21),
    week: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    status: z.enum(['ready', 'draft']),
    title: z.string().min(1),
    goal: z.string().min(1),
    result: z.string().default(''),
    minutes: z.object({ theory: z.number().min(0), practice: z.number().min(0) }).default({ theory: 0, practice: 0 }),
    blocks: z.array(BlockSchema).default([]),
    quiz: z.array(QuizQuestionSchema).default([]),
    practice: z.array(PracticeStepSchema).default([]),
    mentor: z
      .object({ command: z.string(), checklist: z.array(MentorCheckSchema), questions: z.array(z.string().min(1)) })
      .default({ command: '', checklist: [], questions: [] }),
    cards: z.array(z.string().min(1)).default([]),
  })
  .superRefine((day, ctx) => {
    day.quiz.forEach((q, i) => {
      if (q.correct >= q.options.length) {
        ctx.addIssue({ code: 'custom', path: ['quiz', i, 'correct'], message: 'Номер верного ответа вне списка вариантов' })
      }
    })
    day.blocks.forEach((b, i) => {
      if (b.type !== 'scenario') return
      if (!b.nodes[b.start]) ctx.addIssue({ code: 'custom', path: ['blocks', i, 'start'], message: `Нет стартового узла «${b.start}»` })
      for (const [name, node] of Object.entries(b.nodes)) {
        node.choices.forEach((c, j) => {
          if (!b.nodes[c.next]) {
            ctx.addIssue({ code: 'custom', path: ['blocks', i, 'nodes', name, 'choices', j, 'next'], message: `Нет узла «${c.next}»` })
          }
        })
      }
    })
    if (day.status !== 'ready') return
    const need = (ok: boolean, path: string, message: string) => {
      if (!ok) ctx.addIssue({ code: 'custom', path: [path], message })
    }
    need(day.result.length > 0, 'result', 'У готового дня должен быть результат')
    need(day.blocks.length > 0, 'blocks', 'У готового дня должна быть теория')
    need(day.quiz.length >= 5, 'quiz', 'В тесте готового дня нужно не меньше 5 вопросов')
    need(day.practice.length >= 1, 'practice', 'У готового дня нужен хотя бы один шаг практики')
    need(day.mentor.checklist.length >= 1, 'mentor', 'У наставника нужен хотя бы один пункт чек-листа')
    need(day.mentor.questions.length >= 2, 'mentor', 'У наставника нужно не меньше 2 вопросов')
  })

export type Day = z.infer<typeof DaySchema>
export type Block = z.infer<typeof BlockSchema>
export type Hotspot = z.infer<typeof HotspotSchema>
export type BookRef = z.infer<typeof BookRefSchema>
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>
export type PracticeStep = z.infer<typeof PracticeStepSchema>
export type MentorCheck = z.infer<typeof MentorCheckSchema>
export type PromptPart = z.infer<typeof PromptBuilderTrainer>['parts'][number]
