import type { CSSProperties } from 'react'
import type { Day } from '../content/schema'
import { IconArrow } from '../components/icons'
import { RouteLink } from '../components/RouteLink'
import type { CurrentDay } from '../course/currentDay'
import { daySummaryLine, plural } from '../course/summary'
import { DAY_COUNT } from '../router'
import { scrollToId } from './scroll'

// Карточка «Продолжить» под обложкой: сколько пройдено, где остановились и одна кнопка в текущий день
export function ContinueCard({ state, day, streak }: { state: CurrentDay; day: Day; streak: number }) {
  const share = state.doneCount / DAY_COUNT
  const percent = Math.round(share * 100)
  const lead = state.allDone ? 'Любой день можно пройти заново — выберите его на карте.' : daySummaryLine(day)
  const kicker = state.allDone
    ? `Пройдено ${state.doneCount} из ${DAY_COUNT}`
    : state.returning
      ? `Вы остановились здесь · пройдено ${state.doneCount} из ${DAY_COUNT}`
      : 'С чего начать'

  return (
    <section className="paper continue" aria-label="Продолжить обучение">
      <div className="continue-ring" style={{ '--ring': `${share * 360}deg` } as CSSProperties} role="img" aria-label={`Пройдено ${percent}% курса`}>
        <span className="continue-percent">{percent}%</span>
      </div>
      <div className="continue-body">
        <p className="kicker">{kicker}</p>
        <h2 className="continue-title">{state.allDone ? 'Курс пройден' : `День ${day.number} · ${day.title}`}</h2>
        {(lead || streak > 0) && (
          <p className="continue-meta">
            {lead && <span>{lead}</span>}
            {lead && streak > 0 && <span aria-hidden="true">·</span>}
            {streak > 0 && <span className="continue-streak">{`${streak} ${plural(streak, 'день', 'дня', 'дней')} подряд`}</span>}
          </p>
        )}
      </div>
      {state.allDone ? (
        <button type="button" className="btn btn-primary continue-btn" onClick={() => scrollToId('map')}>
          К карте
          <IconArrow />
        </button>
      ) : (
        <RouteLink to={`#/day/${day.number}`} className="btn btn-primary continue-btn">
          {state.returning ? 'Продолжить' : 'Начать'}
          <IconArrow />
        </RouteLink>
      )}
    </section>
  )
}
