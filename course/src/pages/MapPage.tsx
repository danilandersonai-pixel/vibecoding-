import { Shell } from '../components/Shell'
import { getDay, getDays } from '../content/load'
import { currentDay } from '../course/currentDay'
import { ContinueCard } from '../home/ContinueCard'
import { coverCta } from '../home/cta'
import { HomeCover } from '../home/HomeCover'
import { RouteMap } from '../home/RouteMap'
import { useCourseProgress } from '../progress/courseProgress'

// Главная: боковая панель, строка пути, вводный блок с «Как проходит день», карточка HEAD (текущий день) и карта-лог
export function MapPage() {
  const { progress } = useCourseProgress()
  const state = currentDay(progress, getDays())
  return (
    <Shell current="map">
      <div className="topbar">
        <p className="crumbs">
          вайб-курс <span className="crumbs-sep">/</span> <span className="crumbs-here">карта курса</span>
        </p>
      </div>
      <main className="page home-main">
        <HomeCover cta={coverCta(state)} />
        <ContinueCard state={state} day={getDay(state.n)!} />
        <RouteMap progress={progress} />
      </main>
    </Shell>
  )
}
