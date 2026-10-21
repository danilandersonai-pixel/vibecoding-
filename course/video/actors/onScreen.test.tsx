import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('remotion', async (importOriginal) => ({
  ...(await importOriginal<typeof import('remotion')>()),
  useCurrentFrame: () => 0,
  useVideoConfig: () => ({ fps: 30, width: 1280, height: 720, durationInFrames: 300, id: 'test' }),
}))

import { Database } from './Database'
import { Packet } from './Packet'

const SCALES = [0.42, 0.5, 0.6, 0.8, 0.95, 1, 1.25]
const ROWS = [
  { text: '17 · Анна', color: '#2B3FBF' },
  { text: '19 · Игорь', color: '#B7791F' },
]

// Размеры шрифтов в разметке (в координатах героя).
function fonts(markup: string): number[] {
  return [...markup.matchAll(/font:\s*\d+\s+([\d.]+)px/g)].map((m) => Number(m[1]))
}

describe('текст внутри героев на экране не мельче 18 px', () => {
  it('строки базы данных — при любом масштабе', () => {
    for (const scale of SCALES) {
      const sizes = fonts(renderToStaticMarkup(<svg>{<Database x={0} y={0} scale={scale} rows={ROWS} />}</svg>))
      expect(sizes.length, String(scale)).toBeGreaterThan(1)
      expect(Math.min(...sizes) * scale, String(scale)).toBeGreaterThanOrEqual(18)
    }
  })

  it('надпись запроса — при любом масштабе', () => {
    for (const scale of SCALES) {
      const sizes = fonts(renderToStaticMarkup(<svg>{<Packet x={0} y={0} scale={scale} text="client/18" />}</svg>))
      expect(Math.min(...sizes) * scale, String(scale)).toBeGreaterThanOrEqual(18)
    }
  })

  it('крупный текст помещается: строка базы и карточка запроса растут вместе с ним', () => {
    const db = renderToStaticMarkup(<svg>{<Database x={0} y={0} scale={0.5} rows={ROWS} />}</svg>)
    const font = Math.min(...fonts(db))
    const rowWidth = Number(/<rect x="-?[\d.]+" y="-?[\d.]+" width="([\d.]+)"/.exec(db.slice(db.indexOf('<g opacity')))?.[1])
    // моноширинный знак ≈ 0,6 em; слева полоска владельца и отступ
    expect(rowWidth).toBeGreaterThan('19 · Игорь'.length * font * 0.6 + 20)

    const packet = renderToStaticMarkup(<svg>{<Packet x={0} y={0} scale={0.5} text="client/18" />}</svg>)
    const packetWidth = Number(/<rect x="-?[\d.]+" y="-?[\d.]+" width="([\d.]+)"/.exec(packet)?.[1])
    expect(packetWidth).toBeGreaterThan('client/18'.length * Math.min(...fonts(packet)) * 0.6 + 20)
  })

  it('в натуральную величину размеры прежние', () => {
    const db = renderToStaticMarkup(<svg>{<Database x={0} y={0} rows={ROWS} />}</svg>)
    expect(db).toContain('500 18px')
    expect(db).toContain('width="192" height="32"')
    const packet = renderToStaticMarkup(<svg>{<Packet x={0} y={0} text="client/17" />}</svg>)
    expect(packet).toContain('600 20px')
    expect(packet).toContain('width="153" height="48"')
  })
})
