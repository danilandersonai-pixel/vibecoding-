import { useEffect, useRef, useState } from 'react'
import { aiErrorMessage, errorCode, getAi, isPermanentAiError, type Ai, type PromptReview } from '../ai/ai'
import type { Block } from '../content/schema'

type Helper = Extract<Block, { type: 'ai-helper' }>

const PART_LABEL: Record<PromptReview['parts'][number]['key'], string> = {
  goal: 'Цель',
  context: 'Контекст',
  constraints: 'Ограничения',
  criteria: 'Критерии готовности',
  format: 'Формат',
}

// ИИ прямо на странице: оценка запроса по ЦКОКФ или вопрос по теме дня.
export function AiHelper({ block }: { block: Helper }) {
  const [ai, setAi] = useState<Ai | null | undefined>(undefined)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [answer, setAnswer] = useState('')
  const [review, setReview] = useState<PromptReview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [blocked, setBlocked] = useState<string | null>(null)
  const inFlight = useRef(false)
  const ctl = useRef<AbortController | null>(null)

  useEffect(() => {
    let alive = true
    void getAi().then((a) => alive && setAi(a))
    return () => {
      alive = false
      ctl.current?.abort()
    }
  }, [])

  const isReview = block.mode === 'prompt-review'
  const action = isReview ? 'Оценить запрос' : 'Спросить ИИ'

  async function submit() {
    if (!ai || inFlight.current || !input.trim()) return
    inFlight.current = true
    setBusy(true)
    setError(null)
    setAnswer('')
    setReview(null)
    ctl.current = new AbortController()
    try {
      if (isReview) setReview(await ai.reviewPrompt(input, block.context, ctl.current.signal))
      else setAnswer(await ai.ask(input, block.context, setAnswer, ctl.current.signal))
    } catch (e) {
      const code = errorCode(e)
      if (code === 'cancelled') return
      if (code === 'refused') setAnswer('')
      if (isPermanentAiError(code)) setBlocked(aiErrorMessage(code))
      else setError(aiErrorMessage(code))
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  if (ai === undefined) return null
  if (ai === null || blocked) {
    return (
      <div className="block ai-helper is-off">
        <h3>{block.title}</h3>
        <p className="soon">{blocked ?? 'ИИ доступен, когда курс открыт в Claude'}</p>
      </div>
    )
  }

  return (
    <div className="block ai-helper">
      <h3>{block.title}</h3>
      <textarea rows={isReview ? 5 : 3} value={input} placeholder={block.placeholder} aria-label={block.title} onChange={(e) => setInput(e.target.value)} />
      <button type="button" className="btn" disabled={busy || !input.trim()} onClick={() => void submit()}>
        {action}
      </button>
      {busy && !answer && <p className="soon">ИИ думает…</p>}
      {error && (
        <p className="ai-error" role="alert">
          {error}
        </p>
      )}
      {answer && (
        <div className="ai-answer" aria-live="polite">
          {answer.split(/\n{2,}/).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}
      {review && (
        <div className="ai-review" aria-live="polite">
          <ul>
            {review.parts.map((p) => (
              <li key={p.key} className={p.ok ? 'is-ok-part' : 'is-weak-part'}>
                <strong>
                  {p.ok ? '✓' : '✗'} {PART_LABEL[p.key]}:
                </strong>{' '}
                {p.advice}
              </li>
            ))}
          </ul>
          <p>{review.summary}</p>
        </div>
      )}
    </div>
  )
}
