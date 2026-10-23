// При «уменьшить движение» в системе — без анимации; где matchMedia нет (jsdom), — плавно.
export function scrollBehavior(): ScrollBehavior {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  return reduce ? 'auto' : 'smooth'
}

// Переход внутри страницы — прокрутка, а не якорь «#…»: якорь занят маршрутом #/day/N.
export function scrollToElement(el: Element | null): void {
  el?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })
}

export function scrollToId(id: string): void {
  scrollToElement(document.getElementById(id))
}
