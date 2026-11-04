import type { Rect } from './frame'
import { easeOut } from './motion'
import { CANVAS, MOTION, SAFE } from './theme'

// Камера кадра «Репозиторий»: чистые функции без React. Холст 1920 × 1080, центр кадра — (960, 540).

/** Камера: на какую точку холста смотрит центр кадра и во сколько раз увеличено; zoom 1 — весь кадр. */
export type Shot = { x: number; y: number; zoom: number }
/** Ключ камеры: с кадра at камера плывёт к кадру shot. */
export type CameraKey = { at: number } & Shot

const CENTER = { x: CANVAS.w / 2, y: CANVAS.h / 2 }

/** Весь кадр. */
export const WHOLE: Shot = { x: CENTER.x, y: CENTER.y, zoom: 1 }

/**
 * Камера на кадре frame. Ключи идут по возрастанию at; до первого камера стоит на нём.
 * К каждому следующему ключу она плывёт MOTION.move кадров после его at, по ease-out, от того места, где была в этот момент
 * (если прошлое движение не закончилось, скачка нет).
 */
export function cameraAt(frame: number, keys: CameraKey[]): Shot {
  if (keys.length === 0) return { ...WHOLE }
  const shot = (k: CameraKey): Shot => ({ x: k.x, y: k.y, zoom: k.zoom })
  // Положение камеры на кадре f, если учитывать ключи 0…n.
  const at = (f: number, n: number): Shot => {
    if (n === 0) return shot(keys[0])
    const key = keys[n]
    if (f < key.at) return at(f, n - 1)
    if (f - key.at >= MOTION.move) return shot(key)
    const from = at(key.at, n - 1)
    const p = easeOut((f - key.at) / MOTION.move)
    return { x: from.x + (key.x - from.x) * p, y: from.y + (key.y - from.y) * p, zoom: from.zoom + (key.zoom - from.zoom) * p }
  }
  return at(frame, keys.length - 1)
}

/** Прямоугольник холста → где он на экране при камере cam (так сдвигает и увеличивает холст кадр). */
export function toScreen(r: Rect, cam: Shot): Rect {
  return { x: CENTER.x + (r.x - cam.x) * cam.zoom, y: CENTER.y + (r.y - cam.y) * cam.zoom, w: r.w * cam.zoom, h: r.h * cam.zoom }
}

/**
 * Наезд на часть кадра: часть в центр, zoom — вписать её в безопасную область с полем 48 px, не больше 1,6 и не меньше 1.
 * keep — окно кадра (часть 'frame'): камера сдвигается от центра части ровно настолько, чтобы окно не отъезжало от краёв SAFE экрана
 * и за ним не открывался пустой стол; часть при этом остаётся в SAFE экрана (её увеличенный размер меньше SAFE).
 */
export function focusShot(r: Rect, keep?: Rect): Shot {
  const zoom = Math.max(1, Math.min(1.6, (SAFE.w - 96) / r.w, (SAFE.h - 96) / r.h))
  const shot = { x: r.x + r.w / 2, y: r.y + r.h / 2, zoom }
  if (!keep) return shot
  // Край keep на экране — не внутри SAFE: центр камеры между lo и hi; keep меньше экрана — по его центру
  const clamp = (v: number, lo: number, hi: number) => (lo > hi ? (lo + hi) / 2 : Math.min(Math.max(v, lo), hi))
  return {
    x: clamp(shot.x, keep.x + (CENTER.x - SAFE.x) / zoom, keep.x + keep.w - (SAFE.x + SAFE.w - CENTER.x) / zoom),
    y: clamp(shot.y, keep.y + (CENTER.y - SAFE.y) / zoom, keep.y + keep.h - (SAFE.y + SAFE.h - CENTER.y) / zoom),
    zoom,
  }
}
