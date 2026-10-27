import { RouteLink } from '../components/RouteLink'
import { getWeeks } from '../content/load'
import type { Day } from '../content/schema'
import { dayVideoSummary, formatDuration, plural } from '../course/summary'
import { DAY_COUNT } from '../router'

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

const pad = (n: number) => String(n).padStart(2, '0')

// Строка над днём: путь (вайб-курс / неделя N / день NN) и стрелки к соседним дням
export function DayBar({ day }: { day: Day }) {
  return (
    <nav className="topbar day-bar" aria-label="Дни курса">
      <p className="crumbs">
        вайб-курс <span className="crumbs-sep">/</span> {`неделя ${day.week}`} <span className="crumbs-sep">/</span>{' '}
        <span className="crumbs-here">{`день ${pad(day.number)}`}</span>
      </p>
      <div className="day-bar-days">
        <DayStep n={day.number - 1} label="Предыдущий день" arrow="←" />
        <span className="day-count">
          <span className="visually-hidden">{`День ${day.number} из ${DAY_COUNT}`}</span>
          <span aria-hidden="true">{`${pad(day.number)} / ${DAY_COUNT}`}</span>
        </span>
        <DayStep n={day.number + 1} label="Следующий день" arrow="→" />
      </div>
    </nav>
  )
}

// Состав дня — только то, что в дне есть: подпись и значение, как столбцы ls
function dayFacts(day: Day): [string, string][] {
  const video = dayVideoSummary(day)
  const { theory, practice } = day.minutes
  const facts: [string, string][] = []
  if (video.count > 0) facts.push(['видеоуроки', `${video.count} (${formatDuration(video.seconds)})`])
  if (theory > 0) facts.push(['теория', `≈ ${theory} мин`])
  if (practice > 0) facts.push(['практика', `≈ ${practice} мин`])
  if (day.quiz.length > 0) facts.push(['тест', `${day.quiz.length} ${plural(day.quiz.length, 'вопрос', 'вопроса', 'вопросов')}`])
  return facts
}

// Шапка дня — часть «Зачем сегодня»: день и неделя, тема, цель, состав и «Результат дня» строкой диффа.
// К ней ведёт первый пункт плана дня
export function DayHeader({ day }: { day: Day }) {
  const week = getWeeks().find((w) => w.number === day.week)
  const facts = dayFacts(day)
  return (
    <section id="part-why" className="day-hero" aria-label="Зачем сегодня">
      <p className="day-kicker">
        <span>{`день ${pad(day.number)}`}</span>
        <span>{`неделя ${day.week}`}</span>
        {week && <span className="day-kicker-week">{week.title}</span>}
      </p>
      <h1 className="day-title">{day.title}</h1>
      <p className="day-goal">{day.goal}</p>
      {facts.length > 0 && (
        <dl className="day-facts">
          {facts.map(([label, value]) => (
            <div key={label} className="day-fact">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {day.result && (
        <div className="day-result">
          <p className="day-result-kicker">Результат дня</p>
          <p className="day-result-text">
            <span aria-hidden="true">+ </span>
            {day.result}
          </p>
        </div>
      )}
    </section>
  )
}
