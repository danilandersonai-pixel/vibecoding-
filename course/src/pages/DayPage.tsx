import { Cards } from '../blocks/Cards'
import { MentorBlock } from '../blocks/MentorBlock'
import { Notes } from '../blocks/Notes'
import { Practice } from '../blocks/Practice'
import { Quiz } from '../blocks/Quiz'
import { BlockView } from '../components/BlockView'
import { RouteLink } from '../components/RouteLink'
import { getDay } from '../content/load'
import type { Day } from '../content/schema'
import { dayParts, type PartId } from '../course/dayParts'
import { DayHeader } from '../day/DayHeader'
import { DayToc } from '../day/DayToc'
import { DraftNotice } from '../day/DraftNotice'
import { NextDayCard } from '../day/NextDayCard'
import { PartHeading } from '../day/PartHeading'
import { useCourseProgress } from '../progress/courseProgress'

// Содержимое части дня; «Зачем сегодня» — в шапке дня (DayHeader)
function PartBody({ id, day }: { id: PartId; day: Day }) {
  switch (id) {
    case 'theory':
      return day.blocks.map((b, i) => <BlockView key={i} block={b} dayId={day.id} />)
    case 'quiz':
      return <Quiz day={day} />
    case 'practice':
      return <Practice dayId={day.id} steps={day.practice} />
    case 'mentor':
      return <MentorBlock day={day} />
    case 'summary':
      return (
        <>
          <Notes dayId={day.id} />
          <Cards day={day} />
        </>
      )
    case 'why':
      return null
  }
}

// Страница дня: синяя шапка во всю ширину, под ней план дня и части — только те, где есть содержание;
// вместо пустых частей одна карточка «Остальное готовится», в конце — «Следующий день»
export function DayPage({ n }: { n: number }) {
  const { progress } = useCourseProgress()
  const day = getDay(n)
  if (!day) {
    return (
      <main className="day-cover">
        <div className="day-wrap day-cover-inner">
          <h1 className="day-title">День не найден</h1>
          <p>
            <RouteLink to="#/" className="btn btn-cover next-day-btn">
              К карте
            </RouteLink>
          </p>
        </div>
      </main>
    )
  }
  const parts = dayParts(day, progress)
  const missing = parts.filter((p) => !p.available).map((p) => p.id)
  return (
    <>
      <DayHeader day={day} />
      <div className="day-wrap day-layout">
        <DayToc parts={parts} />
        <main className="day-main">
          {parts.map(
            (p, i) =>
              p.available &&
              p.id !== 'why' && (
                <section key={p.id} id={`part-${p.id}`} className="day-part" aria-labelledby={`part-${p.id}-title`}>
                  <PartHeading part={p} index={i} />
                  <PartBody id={p.id} day={day} />
                </section>
              ),
          )}
          {missing.length > 0 && <DraftNotice missing={missing} />}
          <NextDayCard day={day} />
        </main>
      </div>
    </>
  )
}
