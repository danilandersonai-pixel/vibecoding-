import { Cards } from '../blocks/Cards'
import { MentorBlock } from '../blocks/MentorBlock'
import { Notes } from '../blocks/Notes'
import { Practice } from '../blocks/Practice'
import { Quiz } from '../blocks/Quiz'
import { BlockView } from '../components/BlockView'
import { getDay } from '../content/load'
import { DAY_COUNT } from '../router'

function Nav({ n }: { n: number }) {
  return (
    <nav className="day-nav">
      <a href="#/">
        <span aria-hidden="true">← </span>К карте
      </a>
      {n < DAY_COUNT && (
        <a href={`#/day/${n + 1}`}>
          Следующий день<span aria-hidden="true"> →</span>
        </a>
      )}
    </nav>
  )
}

function Soon() {
  return <p className="soon">Скоро</p>
}

// Страница дня: шесть блоков в порядке спецификации.
export function DayPage({ n }: { n: number }) {
  const day = getDay(n)
  if (!day) {
    return (
      <article className="day">
        <Nav n={n} />
        <h1>День {n}</h1>
        <p className="soon">Этот день ещё готовится.</p>
      </article>
    )
  }
  const { theory, practice } = day.minutes
  return (
    <article className="day">
      <Nav n={n} />
      <p className="day-kicker">
        День {day.number} · неделя {day.week}
        {day.status === 'draft' && <span className="badge">готовится</span>}
      </p>
      <h1>{day.title}</h1>

      <section className="day-section" aria-labelledby="why">
        <h2 id="why">Зачем сегодня</h2>
        <p>{day.goal}</p>
        {day.result && (
          <p>
            <strong>Результат дня:</strong> {day.result}
          </p>
        )}
        {theory + practice > 0 && (
          <p className="day-minutes">
            Теория ≈ {theory} мин · практика ≈ {practice} мин
          </p>
        )}
      </section>

      <section className="day-section" aria-labelledby="theory">
        <h2 id="theory">Теория</h2>
        {day.blocks.length ? day.blocks.map((b, i) => <BlockView key={i} block={b} dayId={day.id} />) : <Soon />}
      </section>

      <section className="day-section" aria-labelledby="quiz">
        <h2 id="quiz">Проверка понимания</h2>
        {day.quiz.length ? <Quiz day={day} /> : <Soon />}
      </section>

      <section className="day-section" aria-labelledby="practice">
        <h2 id="practice">Практика</h2>
        {day.practice.length ? <Practice dayId={day.id} steps={day.practice} /> : <Soon />}
      </section>

      <section className="day-section" aria-labelledby="mentor">
        <h2 id="mentor">Наставник</h2>
        {day.mentor.checklist.length ? <MentorBlock day={day} /> : <Soon />}
      </section>

      <section className="day-section" aria-labelledby="summary">
        <h2 id="summary">Итог дня</h2>
        <Notes dayId={day.id} />
        <Cards day={day} />
      </section>

      <Nav n={n} />
    </article>
  )
}
