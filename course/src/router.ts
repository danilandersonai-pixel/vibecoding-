import { useEffect, useState } from 'react'

export type Route = { name: 'map' } | { name: 'day'; n: number }

export const DAY_COUNT = 21

const NAVIGATE_EVENT = 'vibecourse:navigate'

// Маршруты по якорю: #/ — карта, #/day/N — день. Всё неизвестное — карта.
export function parseRoute(hash: string): Route {
  const m = hash.match(/^#\/day\/(\d{1,2})$/)
  const n = m ? Number(m[1]) : 0
  return n >= 1 && n <= DAY_COUNT ? { name: 'day', n } : { name: 'map' }
}

// Переход из скрипта. В просмотрщике Claude якорь может не меняться — тогда маршрут переключается событием.
export function navigate(hash: string) {
  try {
    if (window.location.hash !== hash) window.location.hash = hash
  } catch {
    // Якорь недоступен — хватит события ниже.
  }
  window.dispatchEvent(new CustomEvent(NAVIGATE_EVENT, { detail: hash }))
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash))
  useEffect(() => {
    const go = (hash: string) => {
      setRoute((cur) => {
        const next = parseRoute(hash)
        return JSON.stringify(next) === JSON.stringify(cur) ? cur : next
      })
      window.scrollTo(0, 0)
    }
    const onHash = () => go(window.location.hash)
    const onNavigate = (e: Event) => go((e as CustomEvent<string>).detail)
    window.addEventListener('hashchange', onHash)
    window.addEventListener(NAVIGATE_EVENT, onNavigate)
    return () => {
      window.removeEventListener('hashchange', onHash)
      window.removeEventListener(NAVIGATE_EVENT, onNavigate)
    }
  }, [])
  return route
}
