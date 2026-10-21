import type { ReactNode } from 'react'
import { navigate } from '../router'

// Ссылка внутри курса: обычный <a> для доступности, переход — из скрипта.
export function RouteLink({ to, className, children, testId }: { to: string; className?: string; children: ReactNode; testId?: string }) {
  return (
    <a
      href={to}
      className={className}
      data-testid={testId}
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
