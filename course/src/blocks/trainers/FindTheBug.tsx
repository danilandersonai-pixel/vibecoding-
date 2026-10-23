import { useState } from 'react'
import type { Block } from '../../content/schema'
import { useCourseProgress } from '../../progress/courseProgress'
import { setTrainerDone } from '../../progress/model'
import { evaluateBugs } from './evaluate'

type Trainer = Extract<Block, { kind: 'find-the-bug' }>

export function FindTheBug({ block, dayId }: { block: Trainer; dayId: string }) {
  const { update } = useCourseProgress()
  const [clicked, setClicked] = useState<number[]>([])
  const [result, setResult] = useState<ReturnType<typeof evaluateBugs> | null>(null)

  function toggle(line: number) {
    setResult(null)
    setClicked(clicked.includes(line) ? clicked.filter((l) => l !== line) : [...clicked, line])
  }

  function check() {
    const r = evaluateBugs(block.bugLines, clicked)
    setResult(r)
    // Пройден, только если найдено всё и без лишних строк — иначе хватило бы нажать на всё подряд.
    if (r.missed.length === 0 && r.wrong.length === 0) update((p) => setTrainerDone(p, dayId, block.id, true))
  }

  function lineState(i: number): string {
    if (!result) return clicked.includes(i) ? ' is-picked' : ''
    if (result.found.includes(i)) return ' is-found'
    if (result.wrong.includes(i)) return ' is-wrong'
    return ''
  }

  return (
    <div className="block trainer">
      <h3>Найди ошибку: {block.title}</h3>
      <p className="trainer-task">Нажмите на строки, где проблема, и проверьте.</p>
      <ol className="code-lines">
        {block.lines.map((line, i) => (
          <li key={i}>
            <button type="button" className={`code-line${lineState(i)}`} aria-pressed={clicked.includes(i)} onClick={() => toggle(i)}>
              <code>{line || ' '}</code>
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="btn" onClick={check} disabled={clicked.length === 0}>
        Проверить
      </button>
      {result && (
        <div className="trainer-result" role="status">
          {result.missed.length === 0 && result.wrong.length === 0 ? (
            <p className="is-ok">Всё найдено.</p>
          ) : (
            <p>
              Найдено {result.found.length} из {block.bugLines.length}
              {result.wrong.length > 0 && `, лишних строк: ${result.wrong.length}`}.
            </p>
          )}
          {result.missed.length === 0 && <p>{block.explanation}</p>}
        </div>
      )}
    </div>
  )
}
