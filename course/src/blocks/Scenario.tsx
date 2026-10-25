import { useState } from 'react'
import type { Block } from '../content/schema'
import { useCourseProgress } from '../progress/courseProgress'
import { setScenarioEnding } from '../progress/model'

type ScenarioBlock = Extract<Block, { type: 'scenario' }>

const ENDING_LABEL = { good: 'Хороший исход', bad: 'Плохой исход', neutral: 'Так тоже бывает' }

// Ситуация с выбором — карточка «бумаги» с кикером: история ветвится по узлам, концовка записывается в прогресс.
export function Scenario({ block, dayId }: { block: ScenarioBlock; dayId: string }) {
  const { update } = useCourseProgress()
  const [nodeId, setNodeId] = useState(block.start)
  const [path, setPath] = useState<string[]>([])
  const node = block.nodes[nodeId]

  function choose(label: string, next: string) {
    setPath([...path, label])
    setNodeId(next)
    const ending = block.nodes[next]?.ending
    if (ending) update((p) => setScenarioEnding(p, dayId, block.id, ending))
  }

  return (
    <div id={`block-${block.id}`} className={`block scenario paper${node.ending ? ` is-${node.ending}` : ''}`}>
      <p className="kicker block-kicker">Ситуация</p>
      <h3>{block.title}</h3>
      {path.length > 0 && (
        <ol className="scenario-path" aria-label="Ваши решения">
          {path.map((label, i) => (
            <li key={i}>{label}</li>
          ))}
        </ol>
      )}
      <p className="scenario-text" aria-live="polite">
        {node.text}
      </p>
      {node.ending ? (
        <div className="scenario-end">
          <strong>{ENDING_LABEL[node.ending]}.</strong>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setNodeId(block.start)
              setPath([])
            }}
          >
            Сыграть заново
          </button>
        </div>
      ) : (
        <div className="scenario-choices">
          {node.choices.map((c) => (
            <button key={c.label} type="button" className="btn scenario-choice" onClick={() => choose(c.label, c.next)}>
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
