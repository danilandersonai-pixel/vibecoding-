import type { ReactNode } from 'react'
import type { Part } from '../course/dayParts'

// Заголовок части дня: номер 01–06 моноширинным (пройдена — зелёная ✓) и название, справа — счёт шагов практики.
// index — место части в плане дня с нуля; extra — то, что стоит справа (счёт шагов практики).
export function PartHeading({ part, index, extra }: { part: Part; index: number; extra?: ReactNode }) {
  return (
    <div className="part-head">
      <span className={`part-num${part.done ? ' is-done' : ''}`} aria-hidden="true">
        {part.done ? '✓' : String(index + 1).padStart(2, '0')}
      </span>
      <h2 id={`part-${part.id}-title`} className="part-title">
        {part.title}
      </h2>
      {extra && <div className="part-extra">{extra}</div>}
    </div>
  )
}
