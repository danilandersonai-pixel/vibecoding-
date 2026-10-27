import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { transitionsAvailable, withViewTransition, type TransitionKind } from './motion'

export type Route = { name: 'map' } | { name: 'day'; n: number } | { name: 'graph'; node?: string }

export const DAY_COUNT = 21

const NAVIGATE_EVENT = 'vibecourse:navigate'

// Маршруты по якорю: #/ — карта, #/day/N — день, #/graph — граф знаний, #/graph/<id узла> — граф с выбранным узлом
// (id закодирован encodeURIComponent; битая кодировка — общий вид графа). Всё неизвестное — карта.
export function parseRoute(hash: string): Route {
  const graph = hash.match(/^#\/graph(?:\/(.*))?$/)
  if (graph) {
    if (!graph[1]) return { name: 'graph' }
    try {
      return { name: 'graph', node: decodeURIComponent(graph[1]) }
    } catch {
      return { name: 'graph' }
    }
  }
  const m = hash.match(/^#\/day\/(\d{1,2})$/)
  const n = m ? Number(m[1]) : 0
  return n >= 1 && n <= DAY_COUNT ? { name: 'day', n } : { name: 'map' }
}

// Переход из скрипта. В просмотрщике Claude якорь может не меняться — тогда маршрут переключается событием.
// replace — без новой записи истории (replaceState не шлёт hashchange — маршрут переключает то же событие)
export function navigate(hash: string, { replace = false }: { replace?: boolean } = {}) {
  try {
    if (window.location.hash !== hash) {
      if (replace) history.replaceState(null, '', hash)
      else window.location.hash = hash
    }
  } catch {
    // Якорь недоступен — хватит события ниже.
  }
  window.dispatchEvent(new CustomEvent(NAVIGATE_EVENT, { detail: hash }))
}

// Подписка на переходы: сменился якорь (hashchange) или переход из скрипта (navigate). Слушатель получает новый якорь;
// возвращает отписку
export function onNavigation(listener: (hash: string) => void): () => void {
  const onHash = () => listener(window.location.hash)
  const onNavigate = (e: Event) => listener((e as CustomEvent<string>).detail)
  window.addEventListener('hashchange', onHash)
  window.addEventListener(NAVIGATE_EVENT, onNavigate)
  return () => {
    window.removeEventListener('hashchange', onHash)
    window.removeEventListener(NAVIGATE_EVENT, onNavigate)
  }
}

const sameRoute = (a: Route, b: Route) => JSON.stringify(a) === JSON.stringify(b)

// Какой переход показать между экранами: листание дня — вперёд или назад, смена раздела — page.
// Смена узла внутри графа и тот же экран — без перехода (null)
export function transitionKind(from: Route, to: Route): TransitionKind | null {
  if (from.name === 'day' && to.name === 'day') return to.n === from.n ? null : to.n > from.n ? 'forward' : 'back'
  return from.name === to.name ? null : 'page'
}

// Текущий маршрут. Смена экрана идёт внутри перехода браузера (withViewTransition): прокрутка в начало
// и новая страница — уже под снимком старой. Повторное событие о том же адресе (navigate шлёт своё,
// затем приходит hashchange) только сбрасывает прокрутку, как раньше
export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash))
  // Последний запрошенный маршрут: переход браузера применяет его не сразу, а события могут прийти раньше
  const wanted = useRef(route)
  useEffect(
    () =>
      onNavigation((hash) => {
        const next = parseRoute(hash)
        const from = wanted.current
        if (sameRoute(next, from)) {
          window.scrollTo(0, 0)
          return
        }
        wanted.current = next
        const kind = transitionKind(from, next)
        // flushSync — только внутри перехода (его обработчик идёт отдельной задачей): navigate бывает и из эффектов
        if (kind && transitionsAvailable()) {
          withViewTransition(kind, () => {
            window.scrollTo(0, 0)
            flushSync(() => setRoute(next))
          })
          return
        }
        setRoute(next)
        window.scrollTo(0, 0)
      }),
    [],
  )
  return route
}
