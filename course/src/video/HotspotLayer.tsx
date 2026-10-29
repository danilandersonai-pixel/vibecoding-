import type { VideoHotspot } from '../../video/types'
import { isTermScript } from './termScript'

type LayerProps = {
  hotspots: VideoHotspot[]
  width: number
  height: number
  frame: number
  /** Название открытого пояснения или null; саму панель рисует HotspotNote — рядом с кадром, а не в нём. */
  open: string | null
  /** Нажатие на зону: открыть её пояснение (название) или закрыть открытое (null). */
  onToggle: (title: string | null) => void
}

// Зоны кадра на паузе: нажатие на объект показывает пояснение. Координаты зон — в пикселях кадра ролика,
// width × height — его размер (1280 × 720 у старых роликов, 1920 × 1080 у новых): положение и размер считаются в процентах от него.
// Зона — ровно прямоугольник части кадра, рамка рисуется снаружи (outline в video.css): узкую зону она не закрывает.
// Новые ролики всегда тёмные, старые — светлые: на тёмном кадре рамка светлая (класс is-dark).
export function HotspotLayer({ hotspots, width, height, frame, open, onToggle }: LayerProps) {
  const pctX = (v: number) => `${(v / width) * 100}%`
  const pctY = (v: number) => `${(v / height) * 100}%`
  const active = hotspots.filter((h) => frame >= h.from && frame < h.to)
  return (
    <div className={isTermScript({ width }) ? 'hotspot-layer is-dark' : 'hotspot-layer'}>
      {active.map((h) => (
        <button
          key={h.title}
          type="button"
          className={`video-hotspot${open === h.title ? ' is-open' : ''}`}
          style={{ left: pctX(h.x), top: pctY(h.y), width: pctX(h.w), height: pctY(h.h) }}
          aria-label={h.title}
          aria-pressed={open === h.title}
          onClick={() => onToggle(open === h.title ? null : h.title)}
        />
      ))}
    </div>
  )
}

// Панель открытого пояснения. Стоит сразу за сценой кадра (VideoBlock): на компьютере лежит поверх низа кадра,
// на экране уже 600 px — под кадром, чтобы не закрывать сцену (video.css).
export function HotspotNote({ spot }: { spot: VideoHotspot }) {
  return (
    <div className="video-hotspot-note" role="status">
      <strong>{spot.title}</strong>
      <p>{spot.text}</p>
    </div>
  )
}
