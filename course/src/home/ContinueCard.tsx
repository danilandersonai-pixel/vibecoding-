import type { Day } from '../content/schema'
import { RouteLink } from '../components/RouteLink'
import type { CurrentDay } from '../course/currentDay'
import { daySummaryLine } from '../course/summary'
import { DAY_COUNT } from '../router'
import { scrollToId } from './scroll'

// Карточка HEAD — где вы сейчас: текущий день, его цель и состав, одна кнопка в день.
// Подпись говорит, первый ли это заход; счёт пройденного и серия — в боковой панели
export function ContinueCard({ state, day }: { state: CurrentDay; day: Day }) {
  const kicker = state.allDone ? `Пройдено ${state.doneCount} из ${DAY_COUNT}` : state.returning ? 'Вы остановились здесь' : 'С чего начать'
  const summary = state.allDone ? '' : daySummaryLine(day)
  return (
    <section className="paper continue" aria-label="Продолжить обучение">
      <div className="continue-body">
        <p className="continue-kicker">
          <span className="head-chip">HEAD</span>
          <span>{kicker}</span>
          {!state.allDone && <span>{`день ${String(day.number).padStart(2, '0')}, неделя ${day.week}`}</span>}
        </p>
        <h2 className="continue-title">{state.allDone ? 'Курс пройден' : day.title}</h2>
        <p className="continue-goal">{state.allDone ? 'Любой день можно пройти заново — выберите его на карте.' : day.goal}</p>
        {summary && <p className="continue-meta">{summary}</p>}
      </div>
      {state.allDone ? (
        <button type="button" className="btn btn-primary continue-btn" onClick={() => scrollToId('map')}>
          К карте
        </button>
      ) : (
        <RouteLink to={`#/day/${day.number}`} className="btn btn-primary continue-btn">
          {state.returning ? 'Продолжить' : 'Начать'}
        </RouteLink>
      )}
    </section>
  )
}
