import { RouteLink } from '../components/RouteLink'
import { getDays, getWeeks } from '../content/load'
import type { Day } from '../content/schema'
import { commitHash } from '../course/commitHash'
import { currentDay } from '../course/currentDay'
import { dayVideoSummary, plural, readinessLine } from '../course/summary'
import { dayStatus, type Progress } from '../progress/model'

type Mark = 'done' | 'now' | 'ahead'

const MARKS: Mark[] = ['done', 'now', 'ahead']
const LABEL: Record<Mark, string> = { done: 'пройден', now: 'сейчас', ahead: 'впереди' }

// Карта «Путь от идеи до запуска» — как git log: линия ветки слева, недели — отметки на ней, дни — коммиты.
// Пройденный день — точка, короткий хеш и зелёная ✓; «сейчас» — строка-инверсия с HEAD (первый непройденный день);
// впереди — пустой кружок. Строка дня — ссылка в день
export function RouteMap({ progress }: { progress: Progress }) {
  const days = getDays()
  const state = currentDay(progress, days)
  const markOf = (day: Day): Mark =>
    dayStatus(progress, day) === 'done' ? 'done' : !state.allDone && day.number === state.n ? 'now' : 'ahead'

  return (
    <section id="map" className="route" aria-labelledby="map-title">
      <div className="route-head">
        <h2 id="map-title" className="route-title">
          Путь от идеи до запуска
        </h2>
        <ul className="route-legend" aria-label="Обозначения">
          {MARKS.map((m) => (
            <li key={m} className={`route-legend-${m}`}>
              {LABEL[m]}
            </li>
          ))}
        </ul>
      </div>
      <p className="route-ready">{readinessLine(days)}</p>

      <div className="route-log">
        {getWeeks().map((week) => (
          <section key={week.number} className="route-week" aria-labelledby={`week-${week.number}`}>
            <div className="route-week-head">
              <p className="route-week-num">{`неделя ${week.number}`}</p>
              <h3 id={`week-${week.number}`} className="route-week-title">
                {week.title}
              </h3>
              <p className="route-week-result">{week.result}</p>
            </div>
            <ol className="route-days">
              {days
                .filter((d) => d.week === week.number)
                .map((day) => {
                  const m = markOf(day)
                  const videos = dayVideoSummary(day).count
                  const hash = m === 'done' ? commitHash(day.id, progress.days[day.id]?.completedAt) : m === 'now' ? 'HEAD' : ''
                  return (
                    <li key={day.number} className={`route-day is-${m}`}>
                      <RouteLink to={`#/day/${day.number}`} className="route-row" testId="day-card">
                        <span className="route-hash" aria-hidden="true">
                          {hash}
                        </span>
                        <span className="route-row-num">{`день ${String(day.number).padStart(2, '0')}`}</span>
                        <span className="route-row-title">{day.title}</span>
                        <span className="route-row-video">{videos > 0 ? `${videos} ${plural(videos, 'ролик', 'ролика', 'роликов')}` : ''}</span>
                        <span className={`route-mark is-${m}`}>
                          {m === 'done' && <span aria-hidden="true">✓ </span>}
                          {m === 'ahead' ? '' : LABEL[m]}
                        </span>
                      </RouteLink>
                    </li>
                  )
                })}
            </ol>
          </section>
        ))}
      </div>
    </section>
  )
}
