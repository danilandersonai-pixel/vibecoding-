// Ключ: кольцо и бородка; центр кольца — (x, y). Метафора «у каждого свой ключ» и секретного ключа.
export function KeyGlyph({ x, y, color, scale = 1 }: { x: number; y: number; color: string; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle r={8} fill="none" stroke={color} strokeWidth={4} />
      <path d="M8 0 H28 M22 0 V7 M27 0 V6" fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" />
    </g>
  )
}
