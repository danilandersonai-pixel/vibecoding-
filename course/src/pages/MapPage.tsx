import { getDay, getDays } from '../content/load'
import { currentDay } from '../course/currentDay'
import { ContinueCard } from '../home/ContinueCard'
import { coverCta } from '../home/cta'
import { DaySteps } from '../home/DaySteps'
import { HomeCover } from '../home/HomeCover'
import { RouteMap } from '../home/RouteMap'
import { useCourseProgress } from '../progress/courseProgress'

// Главная: обложка во всю ширину (шапка внутри), под ней «Продолжить», «Как проходит день» и карта-путь
export function MapPage() {
  const { progress } = useCourseProgress()
  const state = currentDay(progress, getDays())
  return (
    <>
      <HomeCover cta={coverCta(state)} />
      <main className="home-wrap home-main">
        <ContinueCard state={state} day={getDay(state.n)!} streak={progress.streak.count} />
        <DaySteps />
        <RouteMap progress={progress} />
      </main>
    </>
  )
}
