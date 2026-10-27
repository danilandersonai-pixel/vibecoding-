import { RouteLink } from '../components/RouteLink'
import { ThemeToggle } from '../components/ThemeToggle'
import { getDays } from '../content/load'
import { currentDay } from '../course/currentDay'
import { plural } from '../course/summary'
import { GraphButton } from '../graph/GraphButton'
import { dayStatus } from '../progress/model'
import { useCourseProgress } from '../progress/courseProgress'
import { DAY_COUNT } from '../router'
import { SearchButton } from '../search/SearchButton'

// Боковая панель курса — шапка сайта (banner) на главной и в днях: название, разделы, прогресс и тема.
// Больше 960 px — колонка слева во всю высоту; до 960 px — строка сверху: название и разделы в один ряд,
// «Сегодня» и прогресс скрыты, у «Поиска», «Графа» и темы — только значки (доступные имена остаются).
// Прогресс — 21 клетка, как сетка коммитов: пройденный день залит, текущий — в рамке
export function SiteBar({ current }: { current: 'map' | 'day' }) {
  const { progress } = useCourseProgress()
  const days = getDays()
  const state = currentDay(progress, days)
  const streak = progress.streak.count
  return (
    <header className="sitebar">
      <div className="sitebar-brand">
        <span className="sitebar-name">Вайб-курс</span>
        <span className="sitebar-branch" aria-hidden="true">
          ветка main
        </span>
      </div>
      <nav className="sitebar-links" aria-label="Разделы">
        <RouteLink to="#/" className="sitebar-link sitebar-map" current={current === 'map'}>
          Карта<span className="sitebar-map-tail"> курса</span>
        </RouteLink>
        {!state.allDone && (
          <RouteLink to={`#/day/${state.n}`} className="sitebar-link sitebar-today">
            Сегодня{' '}
            <span className="sitebar-today-day">{`день ${String(state.n).padStart(2, '0')}`}</span>
          </RouteLink>
        )}
        <SearchButton className="sitebar-link sitebar-search" />
        <GraphButton className="sitebar-link" />
        <a className="sitebar-link sitebar-book" href="book.html" target="_blank" rel="noopener">
          Книга
        </a>
        <ThemeToggle className="sitebar-link" />
      </nav>
      <section className="sitebar-progress" aria-label="Прогресс">
        <p className="sitebar-count">
          Пройдено <span className="sitebar-count-num">{`${state.doneCount} из ${DAY_COUNT}`}</span>
        </p>
        <ol className="sitebar-cells" aria-hidden="true">
          {days.map((d) => (
            <li
              key={d.number}
              className={dayStatus(progress, d) === 'done' ? 'is-done' : !state.allDone && d.number === state.n ? 'is-now' : undefined}
            />
          ))}
        </ol>
        {streak > 0 && <p className="sitebar-streak">{`Серия: ${streak} ${plural(streak, 'день', 'дня', 'дней')} подряд`}</p>}
      </section>
    </header>
  )
}
