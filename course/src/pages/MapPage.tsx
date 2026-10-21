import { getDay } from '../content/load'
import { dayStatus, type DayStatus } from '../progress/model'
import { useCourseProgress } from '../progress/courseProgress'
import { DAY_COUNT } from '../router'

const STATUS_LABEL: Record<DayStatus, string> = { 'not-started': 'не начат', 'in-progress': 'в процессе', done: 'пройден' }
const WEEKS = [
  { n: 1, title: 'Неделя 1. Вся книга и первая работающая версия' },
  { n: 2, title: 'Неделя 2. Функциональность до уровня конкурентов' },
  { n: 3, title: 'Неделя 3. Доводка до продукта' },
]

function daysWord(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'день'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня'
  return 'дней'
}

export function MapPage() {
  const { progress } = useCourseProgress()
  const numbers = Array.from({ length: DAY_COUNT }, (_, i) => i + 1)
  const statuses = numbers.map((n) => {
    const day = getDay(n)
    return { n, day, status: day ? dayStatus(progress, day) : ('not-started' as const) }
  })
  const done = statuses.filter((s) => s.status === 'done').length
  const streak = progress.streak.count

  return (
    <>
      <header className="shell-head">
        <h1>Вайб-кодинг: курс на 21 день</h1>
        <p>По книге «Вайб-кодинг на практике»</p>
      </header>
      <div className="summary" aria-label="Итоги курса">
        <div className="summary-item">
          <span className="summary-value">{Math.round((done / DAY_COUNT) * 100)}%</span>
          <span className="summary-label">курса пройдено</span>
        </div>
        <div className="summary-item">
          <span className="summary-value">{streak}</span>
          <span className="summary-label">{daysWord(streak)} подряд</span>
        </div>
      </div>
      {WEEKS.map((week) => (
        <section key={week.n} className="week">
          <h2>{week.title}</h2>
          <ol className="day-grid">
            {statuses
              .filter((s) => (s.day?.week ?? Math.ceil(s.n / 7)) === week.n)
              .map(({ n, day, status }) => (
                <li key={n}>
                  <a className={`day-card is-${status}`} href={`#/day/${n}`} data-testid="day-card">
                    <span className="day-num">День {n}</span>
                    <span className="day-title">{day?.title ?? 'Тема уточняется'}</span>
                    <span className="day-status">{STATUS_LABEL[status]}</span>
                    {(!day || day.status === 'draft') && <span className="badge">готовится</span>}
                  </a>
                </li>
              ))}
          </ol>
        </section>
      ))}
    </>
  )
}
