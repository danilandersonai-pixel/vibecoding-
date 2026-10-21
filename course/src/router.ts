import { useEffect, useState } from 'react'

export type Route = { name: 'map' } | { name: 'day'; n: number }

export const DAY_COUNT = 21

// Маршруты по якорю: #/ — карта, #/day/N — день. Всё неизвестное — карта.
export function parseRoute(hash: string): Route {
  const m = hash.match(/^#\/day\/(\d{1,2})$/)
  const n = m ? Number(m[1]) : 0
  return n >= 1 && n <= DAY_COUNT ? { name: 'day', n } : { name: 'map' }
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash))
  useEffect(() => {
    const onChange = () => {
      setRoute(parseRoute(window.location.hash))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
