import { describe, expect, it } from 'vitest'
import { cameraAt, focusShot, toScreen, WHOLE, type CameraKey } from './camera'
import { MOTION, SAFE } from './theme'

const KEYS: CameraKey[] = [
  { at: 0, ...WHOLE },
  { at: 100, x: 600, y: 400, zoom: 1.6 },
]

describe('toScreen', () => {
  it('при камере на весь кадр прямоугольник остаётся на месте', () => {
    const r = { x: 960, y: 540, w: 100, h: 100 }
    expect(toScreen(r, WHOLE)).toEqual(r)
  })

  it('центр камеры уходит в центр холста, размеры растут вместе с zoom', () => {
    expect(toScreen({ x: 600, y: 400, w: 100, h: 50 }, { x: 600, y: 400, zoom: 2 })).toEqual({ x: 960, y: 540, w: 200, h: 100 })
    expect(toScreen({ x: 700, y: 400, w: 100, h: 50 }, { x: 600, y: 400, zoom: 2 }).x).toBe(1160)
  })
})

describe('focusShot', () => {
  it('небольшая часть в центре — zoom 1,6 и центр на ней', () => {
    expect(focusShot({ x: 760, y: 440, w: 400, h: 200 })).toEqual({ x: 960, y: 540, zoom: 1.6 })
  })

  it('большая часть вписывается в безопасное поле с запасом 48 px', () => {
    const r = { x: 200, y: 120, w: 1200, h: 300 }
    const shot = focusShot(r)
    expect(shot.zoom).toBeCloseTo((SAFE.w - 96) / r.w)
    expect(shot.x).toBe(800)
    expect(shot.y).toBe(270)
    expect(r.w * shot.zoom).toBeCloseTo(SAFE.w - 96)
  })

  it('высокая часть ограничена по высоте, а самая большая не отдаляет камеру дальше кадра', () => {
    expect(focusShot({ x: 0, y: 0, w: 100, h: 500 }).zoom).toBeCloseTo((SAFE.h - 96) / 500)
    expect(focusShot({ x: 0, y: 0, w: 100, h: 1360 }).zoom).toBe(1)
    expect(focusShot({ x: 0, y: 0, w: 1920, h: 1080 }).zoom).toBe(1)
  })
})

describe('cameraAt', () => {
  it('без ключей — весь кадр', () => {
    expect(cameraAt(50, [])).toEqual(WHOLE)
  })

  it('до первого ключа — первый', () => {
    expect(cameraAt(-5, KEYS)).toEqual(WHOLE)
    expect(cameraAt(0, KEYS)).toEqual(WHOLE)
    expect(cameraAt(100, [{ at: 100, x: 10, y: 20, zoom: 1.2 }])).toEqual({ x: 10, y: 20, zoom: 1.2 })
    expect(cameraAt(50, [{ at: 100, x: 10, y: 20, zoom: 1.2 }])).toEqual({ x: 10, y: 20, zoom: 1.2 })
  })

  it('движение к следующему ключу начинается на его at и кончается через MOTION.move кадров точно на нём', () => {
    expect(cameraAt(100, KEYS)).toEqual(WHOLE)
    expect(cameraAt(100 + MOTION.move, KEYS)).toEqual({ x: 600, y: 400, zoom: 1.6 })
    expect(cameraAt(100 + MOTION.move + 50, KEYS)).toEqual({ x: 600, y: 400, zoom: 1.6 })
  })

  it('на полпути — между ключами, причём ease-out: больше половины пути', () => {
    const mid = cameraAt(100 + MOTION.move / 2, KEYS)
    expect(mid.x).toBeLessThan(WHOLE.x + (600 - WHOLE.x) / 2)
    expect(mid.x).toBeGreaterThan(600)
    expect(mid.zoom).toBeGreaterThan(1)
    expect(mid.zoom).toBeLessThan(1.6)
  })

  it('новый ключ раньше конца прошлого движения продолжает его с текущего места, без скачка', () => {
    const keys: CameraKey[] = [...KEYS, { at: 109, x: 200, y: 300, zoom: 1.3 }]
    const before = cameraAt(109, keys)
    expect(before).toEqual(cameraAt(109, KEYS))
    expect(cameraAt(110, keys).x).toBeLessThan(before.x)
    expect(cameraAt(109 + MOTION.move, keys)).toEqual({ x: 200, y: 300, zoom: 1.3 })
  })
})
