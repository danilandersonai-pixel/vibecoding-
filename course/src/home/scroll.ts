// Переход внутри страницы — прокрутка, а не якорь «#…»: якорь занят маршрутом #/day/N.
// При «уменьшить движение» в системе — без анимации; где matchMedia нет (jsdom), — плавно.
export function scrollToElement(el: Element | null): void {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  el?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}

export function scrollToId(id: string): void {
  scrollToElement(document.getElementById(id))
}
