import { RouteLink } from '../components/RouteLink'
import { getDay } from '../content/load'
import type { Day } from '../content/schema'
import { daySummaryLine } from '../course/summary'
import { DAY_COUNT } from '../router'

// Конец дня — строка под линейкой: следующий день, его состав и «Перейти»; после последнего дня — «Курс завершён» и «К карте»
export function NextDayCard({ day }: { day: Day }) {
  const next = day.number < DAY_COUNT ? getDay(day.number + 1) : undefined
  const summary = next ? daySummaryLine(next) : ''
  return (
    <section className="next-day">
      <div className="next-day-text">
        {next ? (
          <>
            <p className="kicker next-day-kicker">Следующий день</p>
            <h2 className="next-day-title">{`День ${next.number}. ${next.title}`}</h2>
            {summary && <p className="next-day-meta">{summary}</p>}
          </>
        ) : (
          <h2 className="next-day-title">Курс завершён</h2>
        )}
      </div>
      <RouteLink to={next ? `#/day/${next.number}` : '#/'} className="btn btn-primary next-day-btn">
        {next ? 'Перейти' : 'К карте'}
      </RouteLink>
    </section>
  )
}
