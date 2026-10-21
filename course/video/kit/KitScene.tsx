import type { ReactNode } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { theme } from '../theme'
import { cameraAt, transitionAt, type CameraKey, type Transition } from './camera'

type Props = {
  /** Плашка вверху слева (номер и название сцены). */
  chip: string
  /** Длина сцены в кадрах — от неё считается уход; внутри Sequence её не узнать. */
  duration: number
  transition?: Transition
  camera?: CameraKey[]
  children: ReactNode
}

// Сцена-холст 1280×720: бумажный фон, переход на входе и выходе, камера внутри холста.
export function KitScene({ chip, duration, transition = 'fade', camera, children }: Props) {
  const frame = useCurrentFrame()
  const t = transitionAt(frame, duration, transition)
  const cam = cameraAt(frame, camera ?? [])
  // точка (x, y) холста оказывается в центре кадра, увеличенная в zoom раз
  const view = `translate(${640 - cam.x * cam.zoom} ${360 - cam.y * cam.zoom}) scale(${cam.zoom})`

  return (
    <AbsoluteFill style={{ background: theme.paper }}>
      <AbsoluteFill style={{ opacity: t.opacity, transform: `translateX(${t.dx}px) scale(${t.scale})` }}>
        <svg viewBox="0 0 1280 720" width={1280} height={720} style={{ fontFamily: theme.font }}>
          <g transform={view}>{children}</g>
        </svg>
        <div style={{ position: 'absolute', left: 32, top: 24, padding: '6px 14px', borderRadius: 999, background: theme.accentTint, color: theme.accent, font: `600 20px ${theme.font}` }}>{chip}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
