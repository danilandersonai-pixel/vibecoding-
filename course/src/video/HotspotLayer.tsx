import { useState } from 'react'
import type { VideoHotspot } from '../../video/types'

// Зоны кадра на паузе: нажатие на объект показывает пояснение. Координаты зон — в пикселях кадра ролика,
// width × height — его размер (1280 × 720 у старых роликов, 1920 × 1080 у новых): положение и размер считаются в процентах от него.
// Новые ролики всегда тёмные, старые — светлые: на тёмном кадре рамка светлая (класс is-dark).
export function HotspotLayer({ hotspots, width, height, frame }: { hotspots: VideoHotspot[]; width: number; height: number; frame: number }) {
  const pctX = (v: number) => `${(v / width) * 100}%`
  const pctY = (v: number) => `${(v / height) * 100}%`
  const [open, setOpen] = useState<string | null>(null)
  const active = hotspots.filter((h) => frame >= h.from && frame < h.to)
  const shown = active.find((h) => h.title === open)
  return (
    <div className={width === 1920 ? 'hotspot-layer is-dark' : 'hotspot-layer'}>
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
