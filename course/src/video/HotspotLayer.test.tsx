/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { VideoHotspot } from '../../video/types'
import { HotspotLayer, HotspotNote } from './HotspotLayer'

// Стили jsdom не загружает: правила зон читаются из самого video.css (как в styles/tokens.test.ts).
const here = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(resolve(here, '../styles/video.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

/** Правила, в списке селекторов которых есть зона пояснения (.video-hotspot, но не .video-hotspot-note): селектор → объявления. */
function zoneRules(): [string, Record<string, string>][] {
  const out: [string, Record<string, string>][] = []
  for (const [, selectors, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!/\.video-hotspot(?![\w-])/.test(selectors)) continue
    const decls: Record<string, string> = {}
    for (const decl of body.split(';')) {
      const colon = decl.indexOf(':')
      if (colon > 0) decls[decl.slice(0, colon).trim()] = decl.slice(colon + 1).trim()
    }
    out.push([selectors.trim(), decls])
  }
  return out
}
/** Объявления правил, где селектор стоит отдельным пунктом списка. */
function rule(selector: string): Record<string, string> {
  const own = zoneRules().filter(([s]) => s.split(',').some((x) => x.trim() === selector))
  return Object.assign({}, ...own.map(([, decls]) => decls))
}
const px = (v: string | undefined) => (v === '0' ? 0 : Number(/^(-?[\d.]+)px$/.exec(v ?? '')?.[1] ?? NaN))

// Узкая зона: одна буква строки терминала в кадре 1920 × 1080 (знак Martian Mono 24 px — 16,8 px)
const NARROW: VideoHotspot = { from: 100, to: 200, x: 120, y: 400, w: 16.8, h: 36, title: 'A', text: 'Одна буква: рамка не должна её закрыть.' }

describe('HotspotLayer', () => {
  it('рамка пояснения рисуется снаружи зоны, не закрывая её край', () => {
    render(<HotspotLayer hotspots={[NARROW]} width={1920} height={1080} frame={150} open={null} onToggle={() => {}} />)
    const zone = screen.getByRole('button', { name: 'A' })
    expect(zone).toHaveClass('video-hotspot')
    // кнопка — ровно прямоугольник части кадра: рамка его не ужимает и не сдвигает
    expect(zone).toHaveStyle({ left: `${(120 / 1920) * 100}%`, top: `${(400 / 1080) * 100}%`, width: `${(16.8 / 1920) * 100}%`, height: `${(36 / 1080) * 100}%` })

    // рамка — outline: рисуется за краем кнопки (outline-offset не меньше толщины рамки), а border внутри зоны нет
    const base = rule('.video-hotspot')
    expect(base.border).toBe('0')
    expect(base.outline).toBe('2px solid #16181B')
    const width = px(base.outline.split(' ')[0])
    expect(width).toBeGreaterThanOrEqual(2)
    expect(px(base['outline-offset'])).toBeGreaterThanOrEqual(width)
    // на тёмном кадре новых роликов рамка светлая — цвет того же outline
    expect(rule('.hotspot-layer.is-dark .video-hotspot')['outline-color']).toBe('#E9EBEE')
    // ни одно правило зоны (тёмный кадр, открытая, фокус, узкий экран) не возвращает рамку внутрь и не тянет outline на зону
    const rules = zoneRules()
    expect(rules.length).toBeGreaterThan(4)
    for (const [selector, decls] of rules) {
      for (const [prop, value] of Object.entries(decls)) {
        if (prop.startsWith('border') && prop !== 'border-radius') expect(value, `${selector} { ${prop} }`).toBe('0')
        if (prop === 'outline-offset') expect(px(value), `${selector} { ${prop} }`).toBeGreaterThanOrEqual(width)
      }
    }
  })

  it('нажатие на зону открывает её пояснение, повторное — закрывает; вне окна пояснения зоны нет', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    const { rerender } = render(<HotspotLayer hotspots={[NARROW]} width={1920} height={1080} frame={150} open={null} onToggle={onToggle} />)
    await user.click(screen.getByRole('button', { name: 'A' }))
    expect(onToggle).toHaveBeenLastCalledWith('A')
    rerender(<HotspotLayer hotspots={[NARROW]} width={1920} height={1080} frame={150} open="A" onToggle={onToggle} />)
    expect(screen.getByRole('button', { name: 'A' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'A' })).toHaveClass('is-open')
    await user.click(screen.getByRole('button', { name: 'A' }))
    expect(onToggle).toHaveBeenLastCalledWith(null)
    rerender(<HotspotLayer hotspots={[NARROW]} width={1920} height={1080} frame={200} open={null} onToggle={onToggle} />)
    expect(screen.queryByRole('button', { name: 'A' })).toBeNull()
  })

  it('панель пояснения — название и текст, role="status"', () => {
    render(<HotspotNote spot={NARROW} />)
    const note = screen.getByRole('status')
    expect(note).toHaveClass('video-hotspot-note')
    expect(note).toHaveTextContent('A')
    expect(note).toHaveTextContent(NARROW.text)
  })
})
