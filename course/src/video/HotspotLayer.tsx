import { useState } from 'react'
import type { VideoHotspot } from '../../video/types'

const pctX = (v: number) => `${(v / 1280) * 100}%`
const pctY = (v: number) => `${(v / 720) * 100}%`

// Зоны кадра на паузе: нажатие на объект показывает пояснение.
export function HotspotLayer({ hotspots, frame }: { hotspots: VideoHotspot[]; frame: number }) {
  const [open, setOpen] = useState<string | null>(null)
  const active = hotspots.filter((h) => frame >= h.from && frame < h.to)
  const shown = active.find((h) => h.title === open)
  return (
    <div className="hotspot-layer">
      {active.map((h) => (
        <button
          key={h.title}
          type="button"
          className={`video-hotspot${open === h.title ? ' is-open' : ''}`}
          style={{ left: pctX(h.x), top: pctY(h.y), width: pctX(h.w), height: pctY(h.h) }}
          aria-label={h.title}
          aria-pressed={open === h.title}
          onClick={() => setOpen(open === h.title ? null : h.title)}
        />
      ))}
      {shown && (
        <div className="video-hotspot-note" role="status">
          <strong>{shown.title}</strong>
          <p>{shown.text}</p>
        </div>
      )}
    </div>
  )
}
