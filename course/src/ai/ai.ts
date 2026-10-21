import { z } from 'zod'
import { getClaude, type SampleLike } from '../claude'

// ИИ на странице через возможность sample. Вызывается только по нажатию кнопки, никогда в цикле.

const PART_KEYS = ['goal', 'context', 'constraints', 'criteria', 'format'] as const

const PromptReviewSchema = z.object({
  parts: z.array(z.object({ key: z.enum(PART_KEYS), ok: z.boolean(), advice: z.string() })).min(1),
  summary: z.string(),
})

export type PromptReview = z.infer<typeof PromptReviewSchema>

export type AiError = { code: string; message: string }

export type Ai = {
  reviewPrompt(prompt: string, context: string, signal?: AbortSignal): Promise<PromptReview>
  ask(question: string, context: string, onText?: (t: string) => void, signal?: AbortSignal): Promise<string>
}

const MESSAGES: Record<string, string> = {
  not_granted: 'Разрешите ИИ в настройках страницы',
  sampling_disabled: 'ИИ недоступен для этого аккаунта',
  rate_limited: 'Лимит на сейчас исчерпан, попробуйте позже',
  refused: 'ИИ не стал отвечать на этот запрос',
}

export function aiErrorMessage(code: string): string {
  return MESSAGES[code] ?? 'Не получилось, попробуйте ещё раз'
}

// Ошибки, после которых ИИ в этом просмотре не заработает — блок сворачивается до подсказки.
export function isPermanentAiError(code: string): boolean {
  return code === 'not_granted' || code === 'sampling_disabled'
}

export function errorCode(e: unknown): string {
  return typeof e === 'object' && e !== null && 'code' in e && typeof e.code === 'string' ? e.code : 'upstream_error'
}

function reviewInstruction(prompt: string, context: string): string {
  return [
    'Ты проверяешь запрос, который ученик курса по вайб-кодингу написал для ИИ-агента.',
    'Оцени его по пяти элементам из книги «Вайб-кодинг на практике» (гл. 2): цель (goal), контекст (context), ограничения (constraints), критерии готовности (criteria), формат ответа (format).',
    `Тема дня: ${context}`,
    `Запрос ученика:\n<<<\n${prompt}\n>>>`,
    'Ответь только JSON без пояснений вокруг:',
    '{"parts":[{"key":"goal","ok":true,"advice":"…"},{"key":"context","ok":false,"advice":"…"},{"key":"constraints",…},{"key":"criteria",…},{"key":"format",…}],"summary":"…"}',
    'Все пять ключей по порядку. advice — одна короткая фраза по-русски: что добавить или почему уже хорошо. summary — одно-два предложения по-русски.',
  ].join('\n\n')
}

function askInstruction(question: string, context: string): string {
  return [
    'Ты — наставник курса по вайб-кодингу для начинающего. Отвечай по-русски, простыми словами, коротко — до 150 слов.',
    'Опирайся только на материал дня ниже. Если вопрос выходит за его рамки, так и скажи и подскажи, в какой главе книги «Вайб-кодинг на практике» искать.',
    `Материал дня:\n${context}`,
    `Вопрос ученика: ${question}`,
  ].join('\n\n')
}

function makeAi(sample: SampleLike): Ai {
  return {
    async reviewPrompt(prompt, context, signal) {
      const raw = await sample.json(reviewInstruction(prompt, context), { modelTier: 'quick', signal })
      const parsed = PromptReviewSchema.safeParse(raw)
      if (!parsed.success) throw { code: 'invalid_json', message: 'Ответ ИИ не в том формате' } satisfies AiError
      return parsed.data
    },
    async ask(question, context, onText, signal) {
      const { text } = await sample(askInstruction(question, context), { cache: false, signal, onText: onText ? (u) => onText(u.text) : undefined })
      return text
    },
  }
}

// null — курс открыт вне Claude или страница не может пользоваться ИИ.
export async function getAi(): Promise<Ai | null> {
  const claude = getClaude()
  if (!claude) return null
  try {
    const sample = (await claude.use('sample')) as SampleLike | null
    return sample ? makeAi(sample) : null
  } catch {
    return null
  }
}
