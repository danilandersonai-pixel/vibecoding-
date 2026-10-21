/** Размер подписи под героем в его координатах: на экране не мельче 18 px при любом масштабе. */
export function labelFontSize(scale: number): number {
  return Math.max(22, 18 / scale)
}
