import { IconVideo } from '../components/icons'
import { RouteLink } from '../components/RouteLink'
import { getDays, getWeeks } from '../content/load'
import type { Day } from '../content/schema'
import { currentDay } from '../course/currentDay'
import { dayVideoSummary, plural, readinessLine } from '../course/summary'
import { dayStatus, type Progress } from '../progress/model'

type Mark = 'done' | 'now' | 'ahead'

const MARKS: Mark[] = ['done', 'now', 'ahead']
const LABEL: Record<Mark, string> = { done: 'пройден', now: 'сейчас', ahead: 'впереди' }

// Карта «Путь от идеи до запуска»: три недели, в каждой семь дней на линии пути.
// «Сейчас» — текущий день (первый непройденный), остальные непройденные — «впереди».
export function RouteMap({ progress }: { progress: Progress }) {
  const days = getDays()
  const state = currentDay(progress, days)
  const markOf = (day: Day): Mark =>
    dayStatus(progress, day) === 'done' ? 'done' : !state.allDone && day.number === state.n ? 'now' : 'ahead'

  return (
    <section id="map" className="route" aria-labelledby="map-title">
      <div className="route-head">
        <div className="route-heading">
          <p className="kicker route-kicker">Карта курса</p>
          <h2 id="map-title" className="route-title">
            Путь от идеи до запуска
          </h2>
        </div>
        <ul className="route-legend" aria-label="Обозначения">
          {MARKS.map((m) => (
            <li key={m}>
              <span className={`route-dot is-${m}`} aria-hidden="true" />
              {LABEL[m]}
            </li>
          ))}
        </ul>
      </div>
      <p className="route-ready">{readinessLine(days)}</p>

      <div className="route-weeks">
        {getWeeks().map((week) => (
          <section key={week.number} className="paper route-week">
            <div className="route-week-info">
              <p className="route-week-num" aria-hidden="true">
                {String(week.number).padStart(2, '0')}
              </p>
              <p className="kicker">Неделя {week.number}</p>
              <h3 className="route-week-title">{week.title}</h3>
              <p className="route-week-result">{week.result}</p>
            </div>
            <ol className="route-days">
              {days
                .filter((d) => d.week === week.number)
                .map((day) => {
                  const m = markOf(day)
                  const videos = dayVideoSummary(day).count
                  return (
                    <li key={day.number} className={`route-day is-${m}`}>
                      <span className={`route-dot is-${m}`} aria-hidden="true" />
                      <RouteLink to={`#/day/${day.number}`} className="route-row" testId="day-card">
                        <span className="route-row-num">День {day.number}</span>
                        <span className="route-row-title">{day.title}</span>
                        {videos > 0 && (
                          <span className="route-row-video">
                            <IconVideo size={16} />
                            {`${videos} ${plural(videos, 'ролик', 'ролика', 'роликов')}`}
                          </span>
                        )}
                        {m !== 'ahead' && <span className={`route-mark is-${m}`}>{LABEL[m]}</span>}
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
