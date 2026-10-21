import { Easing } from 'remotion'

// Камера и переходы сцены: чистые функции от номера кадра, без React.

/** Ключ камеры: на кадре at центр кадра в координатах холста 1280×720, zoom 1 — весь кадр. */
export type CameraKey = { at: number; x: number; y: number; zoom: number }

export type Transition = 'fade' | 'slide' | 'zoom'

/** Длина появления и ухода сцены, кадров: в эти кадры сцена движется, горячим точкам там не место. */
export const TRANSITION_FRAMES = 10

/** Прямоугольник холста → где он на экране при камере cam (так же, как сдвигает холст KitScene). */
export function toScreen(r: { x: number; y: number; w: number; h: number }, cam: { x: number; y: number; zoom: number }) {
  return { x: 640 + (r.x - cam.x) * cam.zoom, y: 360 + (r.y - cam.y) * cam.zoom, w: r.w * cam.zoom, h: r.h * cam.zoom }
}

const WHOLE = { x: 640, y: 360, zoom: 1 }
const ease = Easing.inOut(Easing.cubic)
const easeOut = Easing.out(Easing.cubic)

/** Камера на кадре: плавно (ease in-out) между ключами (at по возрастанию); до первого и после последнего стоит. */
export function cameraAt(frame: number, keys: CameraKey[]): { x: number; y: number; zoom: number } {
  if (keys.length === 0) return { ...WHOLE }
  const first = keys[0]
  const last = keys[keys.length - 1]
  if (frame <= first.at) return { x: first.x, y: first.y, zoom: first.zoom }
  if (frame >= last.at) return { x: last.x, y: last.y, zoom: last.zoom }
  const i = keys.findIndex((k, n) => frame >= k.at && frame < keys[n + 1].at)
  const a = keys[i]
  const b = keys[i + 1]
  const t = ease((frame - a.at) / (b.at - a.at))
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, zoom: a.zoom + (b.zoom - a.zoom) * t }
}

/** Переход сцены: появление в первые length кадров и уход в последние length; в середине { 1, 0, 1 }. */
export function transitionAt(frame: number, duration: number, kind: Transition, length = TRANSITION_FRAMES): { opacity: number; dx: number; scale: number } {
  const entering = frame < duration - frame
  const p = Math.min(1, Math.max(0, Math.min(frame, duration - frame) / length))
  if (p >= 1) return { opacity: 1, dx: 0, scale: 1 }
  const k = 1 - easeOut(p)
  const sign = entering ? 1 : -1
  if (kind === 'slide') return { opacity: p, dx: sign * k * 80, scale: 1 }
  if (kind === 'zoom') return { opacity: p, dx: 0, scale: 1 - sign * k * 0.08 }
  return { opacity: p, dx: 0, scale: 1 }
}
