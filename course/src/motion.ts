import { useLayoutEffect, useRef, type CSSProperties, type RefObject } from 'react'

// Движение курса: коротко и только в ответ на действие (длительности и кривые — --dur-*, --ease-* в tokens.css).
// Без matchMedia (jsdom, очень старые браузеры) и при «уменьшить движение» в системе анимаций нет — всё сразу на месте.
export function motionAllowed(): boolean {
  if (typeof window.matchMedia !== 'function') return false
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Вид перехода между экранами: page — смена раздела, forward/back — листание дней вперёд и назад, theme — смена темы.
// Его читает CSS (data-transition на <html>), пока идёт переход
export type TransitionKind = 'page' | 'forward' | 'back' | 'theme'

type ViewTransitionDoc = Document & { startViewTransition?: (update: () => void) => { finished: Promise<void> } }

// Смена вида внутри перехода браузера (View Transitions): старый снимок уходит, новый появляется.
// transitionsAvailable — браузер умеет переходы и движение не выключено. Нет поддержки или движение выключено — update выполняется сразу, без анимации.
// update должен менять страницу синхронно (React — через flushSync), иначе браузер снимет ещё старый вид.
export function transitionsAvailable(): boolean {
  return typeof (document as ViewTransitionDoc).startViewTransition === 'function' && motionAllowed()
}

// Номер последнего перехода: новый переход прерывает прежний, и снимать data-transition может только последний
let lastTransition = 0

export function withViewTransition(kind: TransitionKind, update: () => void): void {
  const doc = document as ViewTransitionDoc
  if (!transitionsAvailable() || !doc.startViewTransition) {
    update()
    return
  }
  const root = document.documentElement
  const mine = ++lastTransition
  root.dataset.transition = kind
  const clear = () => {
    if (lastTransition === mine) delete root.dataset.transition
  }
  try {
    doc.startViewTransition(update).finished.then(clear, clear)
  } catch {
    clear()
    update()
  }
}

// Появление блока при первом показе на экране: data-reveal="wait" до показа, "go" — когда блок попал в окно
// (CSS запускает анимацию один раз). Ставится до первой отрисовки, чтобы блок не мигнул готовым видом.
// Без IntersectionObserver или при выключенном движении атрибута нет — блок сразу в готовом виде
export function useReveal<T extends HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined' || !motionAllowed()) return
    el.dataset.reveal = 'wait'
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        el.dataset.reveal = 'go'
        observer.disconnect()
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return ref
}

// Строка терминала, которая «печатается» при первом показе блока с useReveal (класс .type-line, base.css):
// i — место в очереди, chars — примерно знаков в строке (столько шагов у печати; 8–48)
export function typeLine(i: number, chars: number): CSSProperties {
  return { '--i': i, '--steps': Math.max(8, Math.min(48, Math.round(chars))) } as CSSProperties
}
