import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

const clock = vi.hoisted(() => ({ frame: 0 }))
vi.mock('remotion', async (importOriginal) => ({ ...(await importOriginal<typeof import('remotion')>()), useCurrentFrame: () => clock.frame }))

import type { VideoHotspot } from '../types'
import { HotspotFrames } from './HotspotFrames'

const SPOTS: VideoHotspot[] = [
  { from: 10, to: 20, x: 100, y: 50, w: 200, h: 80, title: 'Первая', text: '' },
  { from: 15, to: 40, x: 600, y: 300, w: 120, h: 90, title: 'Вторая', text: '' },
]

afterEach(() => {
  clock.frame = 0
})

describe('HotspotFrames', () => {
  it('рисует рамки только тех точек, в окне которых кадр (конец окна не входит)', () => {
    clock.frame = 15
    const both = renderToStaticMarkup(<HotspotFrames hotspots={SPOTS} />)
    expect(both).toContain('Первая')
    expect(both).toContain('Вторая')
    expect(both).toContain('x="100" y="50" width="200" height="80"')
    clock.frame = 20
    const second = renderToStaticMarkup(<HotspotFrames hotspots={SPOTS} />)
    expect(second).not.toContain('Первая')
    expect(second).toContain('Вторая')
  })

  it('вне окон ничего не рисует', () => {
    clock.frame = 5
    expect(renderToStaticMarkup(<HotspotFrames hotspots={SPOTS} />)).toBe('')
  })

  it('подпись рамки не мельче 18 px', () => {
    clock.frame = 15
    const sizes = [...renderToStaticMarkup(<HotspotFrames hotspots={SPOTS} />).matchAll(/font:\s*\d+\s+([\d.]+)px/g)].map((m) => Number(m[1]))
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(18)
  })
})
