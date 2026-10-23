import { useState } from 'react'
import { Figure } from '../components/Figure'
import type { Block } from '../content/schema'

type Diagram = Extract<Block, { type: 'diagram' }>

const pct = (x: number) => `${x * 100}%`

// Живая схема — карточка «бумаги» с кикером «Схема»: прозрачные зоны поверх схемы книги раскрывают пояснения,
// под схемой подпись, шаги листаются кнопками. На телефоне схема прокручивается вбок внутри карточки.
export function DiagramBlock({ block }: { block: Diagram }) {
  const [open, setOpen] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const active = block.hotspots.find((h) => h.id === open)
  const steps = block.steps ?? []

  return (
    <div className="block diagram paper">
      <p className="kicker block-kicker">Схема</p>
      <figure className="diagram-figure">
        <div className="diagram-scroll">
          <div className="diagram-stage">
            <Figure id={block.figure} />
            {block.hotspots.map((h) => (
              <button
                key={h.id}
                type="button"
                className={`hotspot${open === h.id ? ' is-open' : ''}`}
                style={{ left: pct(h.x), top: pct(h.y), width: pct(h.w), height: pct(h.h) }}
                aria-label={h.title}
                aria-pressed={open === h.id}
                onClick={() => setOpen(open === h.id ? null : h.id)}
              />
            ))}
          </div>
        </div>
        <figcaption>
          {block.caption}
          {block.hotspots.length > 0 && <span className="diagram-hint"> · нажмите на часть схемы</span>}
        </figcaption>
      </figure>
      {active && (
        <div className="hotspot-note" role="status">
          <strong>{active.title}</strong>
          <p>{active.text}</p>
        </div>
      )}
      {steps.length > 0 && (
        <div className="diagram-steps">
          <button type="button" className="btn" onClick={() => setStep(step - 1)} disabled={step === 0}>
            ← Назад
          </button>
          <p aria-live="polite">
            Шаг {step + 1} из {steps.length}: {steps[step]}
          </p>
          <button type="button" className="btn" onClick={() => setStep(step + 1)} disabled={step === steps.length - 1}>
            Дальше →
          </button>
        </div>
      )}
    </div>
  )
}
