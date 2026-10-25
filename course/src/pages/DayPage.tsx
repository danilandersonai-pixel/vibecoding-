import { Cards } from '../blocks/Cards'
import { MentorBlock } from '../blocks/MentorBlock'
import { Notes } from '../blocks/Notes'
import { Practice } from '../blocks/Practice'
import { Quiz } from '../blocks/Quiz'
import { BlockView } from '../components/BlockView'
import { RouteLink } from '../components/RouteLink'
import { getDay } from '../content/load'
import type { Block, Day } from '../content/schema'
import { dayParts, type PartId } from '../course/dayParts'
import { plural } from '../course/summary'
import { DayHeader } from '../day/DayHeader'
import { DayToc } from '../day/DayToc'
import { DraftNotice } from '../day/DraftNotice'
import { NextDayCard } from '../day/NextDayCard'
import { PartHeading } from '../day/PartHeading'
import { useCourseProgress } from '../progress/courseProgress'
import type { Progress } from '../progress/model'
import { useSearchArrival } from '../search/goTo'

// Содержимое части дня; «Зачем сегодня» — в шапке дня (DayHeader)
function PartBody({ id, day }: { id: PartId; day: Day }) {
  switch (id) {
    case 'theory': {
      // Мысли и ролики нумеруются только между собой: «Мысль 2 из 6», хотя перед ней ролики и схема
      const ideas = day.blocks.filter((b) => b.type === 'idea')
      const videos = day.blocks.filter((b) => b.type === 'video')
      const view = (b: Block, i: number) => (
        <BlockView
          key={i}
          block={b}
          dayId={day.id}
          ideaIndex={b.type === 'idea' ? { i: ideas.indexOf(b) + 1, n: ideas.length } : undefined}
          videoIndex={b.type === 'video' ? videos.indexOf(b) + 1 : undefined}
        />
      )
      // Подряд идущие ролики — одной сеткой: два в ряд на широком экране
      const runs: { at: number; blocks: Block[] }[] = []
      day.blocks.forEach((b, i) => {
        const last = runs[runs.length - 1]
        if (b.type === 'video' && last?.blocks[0].type === 'video') last.blocks.push(b)
        else runs.push({ at: i, blocks: [b] })
      })
      return runs.map(({ at, blocks }) =>
        blocks[0].type === 'video' ? (
          <div key={at} className="video-grid">
            {blocks.map((b, j) => view(b, at + j))}
          </div>
        ) : (
          view(blocks[0], at)
        ),
      )
    }
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

// «Сделано a из b шагов» — справа в заголовке «Практики»; у самого блока практики своего счёта нет
function stepsLine(day: Day, progress: Progress): string {
  const steps = progress.days[day.id]?.steps ?? {}
  const done = day.practice.filter((s) => steps[s.id]).length
  const total = day.practice.length
  return `Сделано ${done} из ${total} ${plural(total, 'шага', 'шагов', 'шагов')}`
}

// Страница дня: синяя шапка во всю ширину, под ней план дня и части — только те, где есть содержание;
// вместо пустых частей одна карточка «Остальное готовится», в конце — «Следующий день».
// Пришли из поиска — после отрисовки страница прокручивается к найденному месту
export function DayPage({ n }: { n: number }) {
  const { progress } = useCourseProgress()
  useSearchArrival(n)
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
        <DayToc parts={parts} showProgress={day.status !== 'draft'} />
        <main className="day-main">
          {parts.map(
            (p, i) =>
              p.available &&
              p.id !== 'why' && (
                <section key={p.id} id={`part-${p.id}`} className="day-part" aria-labelledby={`part-${p.id}-title`}>
                  <PartHeading part={p} index={i} extra={p.id === 'practice' ? stepsLine(day, progress) : undefined} />
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
