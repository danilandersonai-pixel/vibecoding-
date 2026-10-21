import { useState } from 'react'
import { Figure } from '../components/Figure'
import type { Block } from '../content/schema'

type Diagram = Extract<Block, { type: 'diagram' }>

const pct = (x: number) => `${x * 100}%`

// Живая схема: прозрачные зоны поверх схемы книги раскрывают пояснения, шаги листаются кнопками.
export function DiagramBlock({ block }: { block: Diagram }) {
  const [open, setOpen] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const active = block.hotspots.find((h) => h.id === open)
  const steps = block.steps ?? []

  return (
    <figure className="block diagram">
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
      {active && (
        <div className="hotspot-note" role="status">
          <strong>{active.title}</strong>
          <p>{active.text}</p>
        </div>
      )}
      {steps.length > 0 && (
        <div className="diagram-steps">
          <button type="button" onClick={() => setStep(step - 1)} disabled={step === 0}>
            ← Назад
          </button>
          <p aria-live="polite">
            Шаг {step + 1} из {steps.length}: {steps[step]}
          </p>
          <button type="button" onClick={() => setStep(step + 1)} disabled={step === steps.length - 1}>
            Дальше →
          </button>
        </div>
      )}
      <figcaption>
        {block.caption}
        {block.hotspots.length > 0 && <span className="diagram-hint"> · нажмите на часть схемы</span>}
      </figcaption>
    </figure>
  )
}
