import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { theme } from '../theme'
import type { VideoHotspot } from '../types'

// Отладка: рамки горячих точек на кадрах их окон — для проверочных кадров (проп showHotspots ролика).
export function HotspotFrames({ hotspots }: { hotspots: VideoHotspot[] }) {
  const frame = useCurrentFrame()
  const live = hotspots.filter((h) => frame >= h.from && frame < h.to)
  if (live.length === 0) return null
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <svg viewBox="0 0 1280 720" width={1280} height={720}>
        {live.map((h) => (
          <g key={h.title}>
            <rect x={h.x} y={h.y} width={h.w} height={h.h} fill={theme.riskTint} stroke={theme.risk} strokeWidth={3} strokeDasharray="10 6" />
            <text x={h.x + 4} y={h.y > 30 ? h.y - 8 : h.y + h.h + 22} fill={theme.risk} style={{ font: `700 18px ${theme.font}` }}>
              {h.title}
            </text>
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  )
}
