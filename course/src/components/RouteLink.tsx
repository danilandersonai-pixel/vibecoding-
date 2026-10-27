import type { ReactNode } from 'react'
import { navigate } from '../router'

// Ссылка внутри курса: обычный <a> для доступности, переход — из скрипта. label — доступное имя для ссылки-значка,
// current — ссылка на открытую страницу (aria-current="page")
export function RouteLink({ to, className, children, testId, label, current }: { to: string; className?: string; children: ReactNode; testId?: string; label?: string; current?: boolean }) {
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
        navigate(to)
      }}
    >
      {children}
    </a>
  )
}
