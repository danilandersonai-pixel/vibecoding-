/** Шрифт в координатах героя: base в натуральную величину, а на экране не мельче 18 px при любом масштабе. */
export function screenFont(base: number, scale: number): number {
  return Math.max(base, 18 / scale)
}

/** Размер подписи под героем в его координатах: на экране не мельче 18 px при любом масштабе. */
export function labelFontSize(scale: number): number {
  return screenFont(22, scale)
}
