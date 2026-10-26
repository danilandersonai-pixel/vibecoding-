import { Agent } from '../components/illustrations'
import { RouteLink } from '../components/RouteLink'
import { getWeeks } from '../content/load'
import type { Day } from '../content/schema'
import { dayVideoSummary, formatDuration, plural } from '../course/summary'
import { GraphButton } from '../graph/GraphButton'
import { DAY_COUNT } from '../router'
import { SearchButton } from '../search/SearchButton'

// Стрелка к соседнему дню; у первого и последнего дня — неактивная, без адреса
function DayStep({ n, label, arrow }: { n: number; label: string; arrow: string }) {
  if (n < 1 || n > DAY_COUNT) {
    return (
      <span className="day-step" role="link" aria-disabled="true" aria-label={label}>
        {arrow}
      </span>
    )
  }
  return (
    <RouteLink to={`#/day/${n}`} className="day-step" label={label}>
      {arrow}
    </RouteLink>
  )
}

// Метки состава дня — только то, что в дне есть
function dayFacts(day: Day): string[] {
  const video = dayVideoSummary(day)
  const { theory, practice } = day.minutes
  const facts: string[] = []
  if (video.count > 0) facts.push(`${video.count} ${plural(video.count, 'видеоурок', 'видеоурока', 'видеоуроков')} · ${formatDuration(video.seconds)}`)
  if (theory > 0) facts.push(`Теория ≈ ${theory} мин`)
  if (practice > 0) facts.push(`Практика ≈ ${practice} мин`)
  if (day.quiz.length > 0) facts.push(`Тест · ${day.quiz.length} ${plural(day.quiz.length, 'вопрос', 'вопроса', 'вопросов')}`)
  return facts
}

// Шапка дня — синий лист во всю ширину: переходы, тема, цель, состав и результат дня.
// Тема, цель и результат и есть часть «Зачем сегодня»: к ней ведёт первый пункт плана дня.
export function DayHeader({ day }: { day: Day }) {
  const week = getWeeks().find((w) => w.number === day.week)
  const facts = dayFacts(day)
  return (
    <header className="day-cover">
      <div className="day-wrap day-cover-inner">
        <nav className="day-bar" aria-label="Дни курса">
          <div className="day-bar-group">
            <span className="day-mark" aria-hidden="true">
              В
            </span>
            <RouteLink to="#/" className="day-bar-link">
              <span aria-hidden="true">←</span>Карта курса
            </RouteLink>
            <SearchButton className="day-search" />
            <GraphButton className="day-graph" />
          </div>
          <div className="day-bar-group day-bar-days">
            <DayStep n={day.number - 1} label="Предыдущий день" arrow="←" />
            <span className="day-count">{`День ${day.number} из ${DAY_COUNT}`}</span>
            <DayStep n={day.number + 1} label="Следующий день" arrow="→" />
          </div>
        </nav>

        <section id="part-why" className="day-hero" aria-label="Зачем сегодня">
          <div className="day-hero-text">
            <p className="kicker day-kicker">
              {[`День ${String(day.number).padStart(2, '0')}`, `Неделя ${day.week}`, week?.title].filter(Boolean).join(' · ')}
            </p>
            <h1 className="day-title">{day.title}</h1>
            <p className="day-goal">{day.goal}</p>
            {facts.length > 0 && (
              <ul className="day-facts">
                {facts.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            )}
          </div>
          {day.result && (
            <div className="day-result">
              <Agent size={68} />
              <div className="day-result-body">
                <p className="kicker day-result-kicker">Результат дня</p>
                <p className="day-result-text">{day.result}</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </header>
  )
}
