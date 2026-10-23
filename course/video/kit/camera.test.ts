import { describe, expect, it } from 'vitest'
import { cameraAt, toScreen, transitionAt, type CameraKey } from './camera'

const KEYS: CameraKey[] = [
  { at: 0, x: 640, y: 360, zoom: 1 },
  { at: 30, x: 400, y: 300, zoom: 2 },
]

describe('cameraAt', () => {
  it('без ключей камера смотрит на весь кадр', () => {
    expect(cameraAt(50, [])).toEqual({ x: 640, y: 360, zoom: 1 })
  })

  it('на середине между ключами значения строго между ключами', () => {
    const c = cameraAt(15, KEYS)
    expect(c.x).toBeLessThan(640)
    expect(c.x).toBeGreaterThan(400)
    expect(c.y).toBeLessThan(360)
    expect(c.y).toBeGreaterThan(300)
    expect(c.zoom).toBeGreaterThan(1)
    expect(c.zoom).toBeLessThan(2)
  })

  it('ease in-out: ход от ключа к ключу не линейный', () => {
    const early = cameraAt(5, KEYS)
    // линейно на кадре 5 было бы 640 - 240 * 5 / 30 = 600
    expect(early.x).toBeGreaterThan(600)
  })

  it('на последнем ключе и дальше стоит ровно на нём', () => {
    expect(cameraAt(30, KEYS)).toEqual({ x: 400, y: 300, zoom: 2 })
    expect(cameraAt(500, KEYS)).toEqual({ x: 400, y: 300, zoom: 2 })
  })

  it('до первого ключа стоит ровно на нём', () => {
    const later: CameraKey[] = [
      { at: 10, x: 100, y: 200, zoom: 1.5 },
      { at: 40, x: 400, y: 300, zoom: 2 },
    ]
    expect(cameraAt(-5, later)).toEqual({ x: 100, y: 200, zoom: 1.5 })
    expect(cameraAt(10, later)).toEqual({ x: 100, y: 200, zoom: 1.5 })
  })

  it('с одним ключом камера просто стоит', () => {
    expect(cameraAt(0, [{ at: 20, x: 300, y: 200, zoom: 3 }])).toEqual({ x: 300, y: 200, zoom: 3 })
    expect(cameraAt(99, [{ at: 20, x: 300, y: 200, zoom: 3 }])).toEqual({ x: 300, y: 200, zoom: 3 })
  })

  it('на трёх ключах идёт по сегментам', () => {
    const keys: CameraKey[] = [...KEYS, { at: 60, x: 900, y: 500, zoom: 1 }]
    expect(cameraAt(30, keys)).toEqual({ x: 400, y: 300, zoom: 2 })
    const c = cameraAt(45, keys)
    expect(c.x).toBeGreaterThan(400)
    expect(c.x).toBeLessThan(900)
    expect(cameraAt(60, keys)).toEqual({ x: 900, y: 500, zoom: 1 })
  })
})

describe('transitionAt', () => {
  it('на первом кадре сцена прозрачна', () => {
    expect(transitionAt(0, 300, 'fade').opacity).toBe(0)
  })

  it('в середине сцены ничего не двигается', () => {
    expect(transitionAt(150, 300, 'slide')).toEqual({ opacity: 1, dx: 0, scale: 1 })
    expect(transitionAt(150, 300, 'zoom')).toEqual({ opacity: 1, dx: 0, scale: 1 })
    expect(transitionAt(150, 300, 'fade')).toEqual({ opacity: 1, dx: 0, scale: 1 })
  })

  it('на последнем кадре сцена почти исчезла', () => {
    expect(transitionAt(299, 300, 'zoom').opacity).toBeLessThan(0.2)
    expect(transitionAt(299, 300, 'fade').opacity).toBeLessThan(0.2)
  })

  it('появление и уход занимают length кадров', () => {
    expect(transitionAt(10, 300, 'fade')).toEqual({ opacity: 1, dx: 0, scale: 1 })
    expect(transitionAt(290, 300, 'fade')).toEqual({ opacity: 1, dx: 0, scale: 1 })
    expect(transitionAt(5, 300, 'fade').opacity).toBeCloseTo(0.5)
    expect(transitionAt(295, 300, 'fade').opacity).toBeCloseTo(0.5)
    expect(transitionAt(5, 300, 'fade', 20).opacity).toBeCloseTo(0.25)
  })

  it('fade не двигает и не масштабирует', () => {
    const t = transitionAt(3, 300, 'fade')
    expect(t.dx).toBe(0)
    expect(t.scale).toBe(1)
  })

  it('slide въезжает справа и уезжает влево', () => {
    expect(transitionAt(2, 300, 'slide').dx).toBeGreaterThan(0)
    expect(transitionAt(297, 300, 'slide').dx).toBeLessThan(0)
  })

  it('zoom растёт при появлении и при уходе', () => {
    expect(transitionAt(2, 300, 'zoom').scale).toBeLessThan(1)
    expect(transitionAt(297, 300, 'zoom').scale).toBeGreaterThan(1)
  })

  it('короткая сцена не ломается: появление и уход делят её пополам', () => {
    const t = transitionAt(5, 10, 'fade')
    expect(t.opacity).toBeGreaterThan(0)
    expect(t.opacity).toBeLessThanOrEqual(1)
  })
})

describe('toScreen', () => {
  it('без приближения прямоугольник остаётся на месте', () => {
    expect(toScreen({ x: 100, y: 50, w: 200, h: 80 }, { x: 640, y: 360, zoom: 1 })).toEqual({ x: 100, y: 50, w: 200, h: 80 })
  })

  it('точка, на которую смотрит камера, — в центре кадра, размеры растут в zoom раз', () => {
    expect(toScreen({ x: 300, y: 200, w: 10, h: 20 }, { x: 300, y: 200, zoom: 2 })).toEqual({ x: 640, y: 360, w: 20, h: 40 })
  })

  it('совпадает со сдвигом холста в KitScene: translate(640 − x·zoom, 360 − y·zoom) scale(zoom)', () => {
    const cam = { x: 420, y: 310, zoom: 1.3 }
    const r = toScreen({ x: 250, y: 100, w: 60, h: 40 }, cam)
    expect(r.x).toBeCloseTo(640 - cam.x * cam.zoom + 250 * cam.zoom)
    expect(r.y).toBeCloseTo(360 - cam.y * cam.zoom + 100 * cam.zoom)
  })
})
