import { useEffect } from 'react'
import { scrollToId } from '../home/scroll'
import { navigate } from '../router'
import type { SearchTarget } from './courseIndex'

// Переход к найденному месту. Открыт этот же день — просто прокрутка. Другой день — цель запоминается,
// а страница дня прокручивает к ней сама после отрисовки (useSearchArrival), один раз. В обоих случаях фокус — на найденном месте.

let shownDay: number | null = null
// Цель в другом дне; waitHash — ждём hashchange: useRoute на нём ещё раз сбрасывает прокрутку в начало,
// а приходит событие отдельной задачей, уже после отрисовки нового дня
let arrival: { target: SearchTarget; waitHash: boolean } | null = null

// Сколько кадров ждать цель, которой ещё нет на странице (помощник ИИ появляется, когда узнает, есть ли ИИ)
const WAIT_FRAMES = 60

// Прокрутка к найденному месту и фокус на нём: следующий Tab пойдёт от этого места, а не от начала страницы.
// Своего фокуса у блока нет — tabindex="-1": фокус только из скрипта, в обход по Tab блок не попадает
function reach(id: string) {
  scrollToId(id)
  const el = document.getElementById(id)
  if (!el) return
  if (!el.hasAttribute('tabindex') && el.tabIndex < 0) el.tabIndex = -1
  el.focus({ preventScroll: true })
}

function reachWhenReady(id: string, frames = WAIT_FRAMES) {
  if (document.getElementById(id) || frames === 0) reach(id)
  else requestAnimationFrame(() => reachWhenReady(id, frames - 1))
}

function arrive() {
  if (!arrival || arrival.waitHash || arrival.target.day !== shownDay) return
  const { anchor } = arrival.target
  arrival = null
  reachWhenReady(anchor)
}

function onHashSettled() {
  if (arrival) arrival.waitHash = false
  arrive()
}

function currentHash(): string {
  try {
    return window.location.hash
  } catch {
    return ''
  }
}

export function goToResult(target: SearchTarget): void {
  if (shownDay === target.day) {
    reachWhenReady(target.anchor)
    return
  }
  const hash = `#/day/${target.day}`
  const before = currentHash()
  arrival = { target, waitHash: false }
  navigate(hash)
  // В просмотрщике Claude якорь может не смениться — тогда hashchange не придёт и ждать нечего
  if (before !== hash && currentHash() === hash) {
    arrival.waitHash = true
    window.addEventListener('hashchange', onHashSettled, { once: true })
  }
}

// Страница дня отмечает, что день n открыт, и после отрисовки прокручивает к цели, запомненной goToResult.
// Открыт другой день — цель забывается: если hashchange так и не пришёл, она не сработает при следующем переходе
export function useSearchArrival(n: number) {
  useEffect(() => {
    shownDay = n
    if (arrival && arrival.target.day !== n) {
      arrival = null
      window.removeEventListener('hashchange', onHashSettled)
    }
    arrive()
    return () => {
      if (shownDay === n) shownDay = null
    }
  }, [n])
}
