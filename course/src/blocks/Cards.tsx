import { useState } from 'react'
import glossary from '../../content/glossary.json'
import type { Day } from '../content/schema'
import { getDays } from '../content/load'
import { useCourseProgress } from '../progress/courseProgress'
import { setCard } from '../progress/model'

const definitions = new Map(glossary.map((g) => [g.term, g.definition]))

function Card({ term }: { term: string }) {
  const { progress, update } = useCourseProgress()
  const [shown, setShown] = useState(false)
  const mark = progress.cards[term]
  return (
    <li className={`card${mark ? ` is-${mark}` : ''}`}>
      <button type="button" className="card-term" aria-expanded={shown} onClick={() => setShown(!shown)}>
        {term}
      </button>
      {shown && <p className="card-def">{definitions.get(term) ?? 'Определения нет в словаре книги.'}</p>}
      <div className="card-actions">
        <button type="button" aria-pressed={mark === 'know'} onClick={() => update((p) => setCard(p, term, 'know'))}>
          Знаю
        </button>
        <button type="button" aria-pressed={mark === 'repeat'} onClick={() => update((p) => setCard(p, term, 'repeat'))}>
          Повторить
        </button>
      </div>
    </li>
  )
}

// Карточки терминов дня и те, что с прошлых дней отмечены «повторить».
export function Cards({ day }: { day: Day }) {
  const { progress } = useCourseProgress()
  const earlier = getDays()
    .filter((d) => d.number < day.number)
    .flatMap((d) => d.cards)
  const repeat = [...new Set(earlier)].filter((t) => progress.cards[t] === 'repeat' && !day.cards.includes(t))
  if (day.cards.length === 0 && repeat.length === 0) return null
  return (
    <div className="cards">
      {day.cards.length > 0 && (
        <>
          <h3>Термины дня</h3>
          <ul className="card-list">
            {day.cards.map((t) => (
              <Card key={t} term={t} />
            ))}
          </ul>
        </>
      )}
      {repeat.length > 0 && (
        <>
          <h3>Повторить с прошлых дней</h3>
          <ul className="card-list">
            {repeat.map((t) => (
              <Card key={t} term={t} />
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
