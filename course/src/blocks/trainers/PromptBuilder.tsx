import { useState } from 'react'
import type { Block, PromptPart } from '../../content/schema'
import { useCourseProgress } from '../../progress/courseProgress'
import { setTrainerDone } from '../../progress/model'
import { evaluatePrompt } from './evaluate'

type Trainer = Extract<Block, { kind: 'prompt-builder' }>
type PartKey = PromptPart['key']

// Варианты одной части в устойчивом порядке, чтобы хорошие не стояли всегда первыми.
function options(part: PromptPart): string[] {
  return [...part.good, ...part.bad].sort((a, b) => a.localeCompare(b, 'ru'))
}

export function PromptBuilder({ block, dayId }: { block: Trainer; dayId: string }) {
  const { update } = useCourseProgress()
  const [chosen, setChosen] = useState<Partial<Record<PartKey, string>>>({})
  const [result, setResult] = useState<ReturnType<typeof evaluatePrompt> | null>(null)
  const labelOf = (key: PartKey) => block.parts.find((p) => p.key === key)?.label ?? key

  function check() {
    const r = evaluatePrompt(block.parts, chosen)
    setResult(r)
    if (r.ok) update((p) => setTrainerDone(p, dayId, block.id, true))
  }

  return (
    <div id={`block-${block.id}`} className="block trainer paper">
      <p className="kicker block-kicker">Тренажёр</p>
      <h3>Собери запрос</h3>
      <p className="trainer-task">Задача: {block.task}</p>
      {block.parts.map((part) => (
        <fieldset key={part.key} className={`prompt-part${result?.missing.includes(part.key) ? ' is-missing' : ''}${result?.weak.includes(part.key) ? ' is-weak' : ''}`}>
          <legend>{part.label}</legend>
          {options(part).map((opt) => (
            <label key={opt} className="prompt-option">
              <input
                type="radio"
                name={`${block.id}-${part.key}`}
                checked={chosen[part.key] === opt}
                onChange={() => {
                  setChosen({ ...chosen, [part.key]: opt })
                  setResult(null)
                }}
              />
              {opt}
            </label>
          ))}
        </fieldset>
      ))}
      <button type="button" className="btn btn-primary" onClick={check}>
        Проверить запрос
      </button>
      {result && (
        <div className="trainer-result" role="status">
          {result.ok ? (
            <p className="is-ok">Запрос собран: у агента есть всё, чтобы сделать задачу без догадок.</p>
          ) : (
            <>
              {result.missing.length > 0 && <p>Не хватает: {result.missing.map(labelOf).join(', ')}.</p>}
              {result.weak.length > 0 && <p>Слабо сформулировано: {result.weak.map(labelOf).join(', ')} — агенту придётся угадывать.</p>}
            </>
          )}
        </div>
      )}
    </div>
  )
}
