import type { ReactNode } from 'react'
import { SiteBar } from '../home/SiteBar'

// Оболочка главной и страницы дня: боковая панель (шапка сайта) и рабочая область справа.
// Экран графа живёт без неё: ему нужна вся ширина окна
export function Shell({ current, children }: { current: 'map' | 'day'; children: ReactNode }) {
  return (
    <div className="shell">
      <SiteBar current={current} />
      <div className="shell-body">{children}</div>
    </div>
  )
}
