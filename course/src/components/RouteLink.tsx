import type { ReactNode } from 'react'
import { navigate } from '../router'

// Ссылка внутри курса: обычный <a> для доступности, переход — из скрипта. label — доступное имя для ссылки-значка,
// current — ссылка на открытую страницу (aria-current="page"), onFollow — свой переход вместо navigate(to)
// (например, history.back()). С Ctrl/⌘/Shift — как обычная ссылка
export function RouteLink({ to, className, children, testId, label, current, onFollow }: { to: string; className?: string; children: ReactNode; testId?: string; label?: string; current?: boolean; onFollow?: () => void }) {
  return (
    <a
      href={to}
      className={className}
      data-testid={testId}
      aria-label={label}
      aria-current={current ? 'page' : undefined}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        if (onFollow) onFollow()
        else navigate(to)
      }}
    >
      {children}
    </a>
  )
}
