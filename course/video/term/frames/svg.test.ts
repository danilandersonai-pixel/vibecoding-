import { readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { defsOf, drawn, isDrawable, rootFontSize, scopeMarkers, splitSvg } from './svg'

const FIGURES = resolve(dirname(fileURLToPath(import.meta.url)), '../../../content/figures')
const read = (name: string) => readFileSync(resolve(FIGURES, name), 'utf8')

describe('splitSvg', () => {
  it('1.1.svg: viewBox 760 × 410, больше десяти элементов, самый мелкий текст 11,5', () => {
    const { viewBox, children, minFont } = splitSvg(read('1.1.svg'))
    expect(viewBox).toEqual([0, 0, 760, 410])
    expect(children.length).toBeGreaterThan(10)
    expect(minFont).toBe(11.5)
  })

  it('элементы идут в порядке документа: сначала заголовок схемы, потом зона риска', () => {
    const { children } = splitSvg(read('1.1.svg'))
    expect(children[0]).toMatch(/^<text [^>]*>Вайб-кодинг — единственный режим/)
    expect(children[1]).toMatch(/^<rect [^>]*class="fg-riskzone"/)
  })

  it('вложенный элемент остаётся целиком в одном верхнем: <g> с детьми — один элемент', () => {
    const svg = '<svg viewBox="0 0 10 10" font-size="13"><g class="a"><text x="1">один</text><rect width="2"/></g><path d="M0 0L1 1"/></svg>'
    expect(splitSvg(svg).children).toEqual(['<g class="a"><text x="1">один</text><rect width="2"/></g>', '<path d="M0 0L1 1"/>'])
  })

  it('знак «>» внутри значения атрибута не закрывает тег', () => {
    const svg = '<svg viewBox="0 0 10 10"><text title="a>b" x="1">t</text><rect/></svg>'
    expect(splitSvg(svg).children).toEqual(['<text title="a>b" x="1">t</text>', '<rect/>'])
  })

  it('все схемы книги разбираются без потерь: элементы подряд дают содержимое <svg>', () => {
    const files = readdirSync(FIGURES).filter((f) => f.endsWith('.svg') && !f.startsWith('_'))
    expect(files.length).toBeGreaterThan(100)
    for (const f of files) {
      const svg = read(f)
      const { viewBox, children, minFont } = splitSvg(svg)
      const inner = svg.slice(svg.indexOf('>') + 1, svg.lastIndexOf('</svg>'))
      expect(children.join(''), f).toBe(inner)
      expect(viewBox[2], f).toBeGreaterThan(0)
      expect(viewBox[3], f).toBeGreaterThan(0)
      expect(minFont, f).toBeGreaterThan(8)
      expect(minFont, f).toBeLessThanOrEqual(13)
    }
  })

  it('самый мелкий размер: атрибуты текста; корневой берётся, только если есть текст без своего размера', () => {
    const own = '<svg viewBox="0 0 10 10" font-size="13"><text font-size="15">a</text><text font-size="12">b</text></svg>'
    expect(splitSvg(own).minFont).toBe(12)
    const inherit = '<svg viewBox="0 0 10 10" font-size="13"><text font-size="15">a</text><text>b</text></svg>'
    expect(splitSvg(inherit).minFont).toBe(13)
    const bigRoot = '<svg viewBox="0 0 10 10" font-size="13"><text font-size="15">a</text></svg>'
    expect(splitSvg(bigRoot).minFont).toBe(15)
  })

  it('без font-size на корне и без размеров у текста — 16, как по умолчанию в браузере; без текста — корневой размер', () => {
    expect(splitSvg('<svg viewBox="0 0 10 10"><text>a</text></svg>').minFont).toBe(16)
    expect(splitSvg('<svg viewBox="0 0 10 10" font-size="13"><rect/></svg>').minFont).toBe(13)
  })

  it('viewBox с запятыми и дробными числами; нет viewBox — ошибка', () => {
    expect(splitSvg('<svg viewBox="0,0,760.5,351.25"><rect/></svg>').viewBox).toEqual([0, 0, 760.5, 351.25])
    expect(() => splitSvg('<svg width="10"><rect/></svg>')).toThrow(/viewBox/)
    expect(() => splitSvg('<div>не схема</div>')).toThrow(/svg/)
  })
})

describe('rootFontSize', () => {
  it('размер текста схемы по умолчанию: font-size корня, 13 у схем книги', () => {
    expect(rootFontSize(read('1.1.svg'))).toBe(13)
    expect(rootFontSize('<svg viewBox="0 0 1 1"><text>a</text></svg>')).toBe(16)
  })
})

describe('defsOf', () => {
  it('маркеры стрелок из _defs.svg: содержимое <defs> без скрытой обёртки', () => {
    const inner = defsOf(read('_defs.svg'))
    for (const id of ['bk-arrow', 'bk-arrow-acc', 'bk-arrow-risk', 'bk-arrow-ok']) expect(inner).toContain(`id="${id}"`)
    expect(inner).not.toMatch(/display:\s*none|hidden/)
    expect(inner.startsWith('<marker')).toBe(true)
    expect(inner).not.toContain('<defs')
  })

  it('нет <defs> — пустая строка', () => {
    expect(defsOf('<svg></svg>')).toBe('')
  })
})

describe('scopeMarkers', () => {
  const line = '<path d="M147.2 133L171.2 133" class="fg-ln" marker-end="url(#bk-arrow)"/>'

  it('id маркеров и ссылки на них переезжают из bk-arrow… в term-arrow… с id ролика; все четыре цвета', () => {
    const inner = scopeMarkers(defsOf(read('_defs.svg')), 'ch-01')
    for (const name of ['arrow', 'arrow-acc', 'arrow-risk', 'arrow-ok']) expect(inner).toContain(`id="term-${name}-ch-01"`)
    expect(inner).not.toContain('bk-arrow')
    expect(scopeMarkers(line, 'ch-01')).toBe('<path d="M147.2 133L171.2 133" class="fg-ln" marker-end="url(#term-arrow-ch-01)"/>')
    expect(scopeMarkers('<path marker-end="url(#bk-arrow-acc)"/><path marker-start="url(#bk-arrow-risk)"/>', 'a')).toBe(
      '<path marker-end="url(#term-arrow-acc-a)"/><path marker-start="url(#term-arrow-risk-a)"/>',
    )
  })

  it('чужие id, классы и тексты не трогает', () => {
    const other = '<path class="fg-arrowhead" id="x" marker-end="url(#other)"/><text>bk-arrow</text>'
    expect(scopeMarkers(other, 'ch-01')).toBe(other)
  })

  it('схемы книги: после замены ни одной ссылки в bk-arrow, а ссылок столько же', () => {
    for (const f of readdirSync(FIGURES).filter((n) => n.endsWith('.svg') && !n.startsWith('_'))) {
      const svg = read(f)
      const out = scopeMarkers(svg, 'ch-01')
      expect(out, f).not.toContain('bk-arrow')
      expect((out.match(/url\(#term-arrow(-acc|-risk|-ok)?-ch-01\)/g) ?? []).length, f).toBe((svg.match(/url\(#bk-arrow(-acc|-risk|-ok)?\)/g) ?? []).length)
    }
  })
})

describe('isDrawable и drawn', () => {
  const line = '<path d="M147.2 133L171.2 133" class="fg-ln" marker-end="url(#bk-arrow)"/>'

  it('сплошные линии прорисовываются; пунктир, сетка, залитые контуры и прочие элементы — нет', () => {
    expect(isDrawable(line)).toBe(true)
    expect(isDrawable('<path d="M0 0L9 9" class="fg-ln-acc"/>')).toBe(true)
    expect(isDrawable('<path d="M0 0L9 9" class="fg-curve"/>')).toBe(true)
    expect(isDrawable('<path d="M0 0L9 9" class="fg-onln"/>')).toBe(true)
    expect(isDrawable('<path d="M85.6 182L85.6 236" class="fg-ln fg-dash fg-dots"/>')).toBe(false)
    expect(isDrawable('<path d="M0 0L9 9" class="fg-ln fg-dash"/>')).toBe(false)
    expect(isDrawable('<path d="M0 0L9 9" class="fg-grid"/>')).toBe(false)
    expect(isDrawable('<path d="M0 0L9 9Z" class="fg-bar"/>')).toBe(false)
    expect(isDrawable('<rect x="1" class="fg-ln"/>')).toBe(false)
    expect(isDrawable('<text class="fg-t">линия</text>')).toBe(false)
  })

  it('все пути схем книги с сплошной линией fg-ln* распознаются, а пунктирные нет', () => {
    for (const f of readdirSync(FIGURES).filter((n) => n.endsWith('.svg') && !n.startsWith('_'))) {
      for (const child of splitSvg(read(f)).children) {
        if (!child.startsWith('<path')) continue
        const cls = /class="([^"]*)"/.exec(child)?.[1] ?? ''
        const dashed = /\bfg-(dash|dots|grid|ghost)\b/.test(cls)
        const solid = /\bfg-(ln|ln-acc|ln-risk|ln-ok|curve|okln|riskln|accln|onln)\b/.test(cls)
        expect(isDrawable(child), `${f}: ${child}`).toBe(solid && !dashed)
      }
    }
  })

  it('drawn: pathLength 1 и stroke-dasharray 1; смещение 1 − p, наконечник — только когда линия дорисована', () => {
    const half = drawn(line, 0.25)
    expect(half).toContain('pathLength="1"')
    expect(half).toContain('stroke-dasharray:1')
    expect(half).toContain('stroke-dashoffset:0.75')
    expect(half).not.toContain('marker-end')
    const full = drawn(line, 1)
    expect(full).toContain('stroke-dashoffset:0')
    expect(full).toContain('marker-end="url(#bk-arrow)"')
    expect(drawn(line, 0)).toContain('stroke-dashoffset:1')
  })

  it('drawn сохраняет остальные атрибуты и склеивает с уже заданным style', () => {
    const out = drawn('<path d="M0 0L9 9" class="fg-ln" style="opacity:.5"/>', 0.5)
    expect(out).toContain('d="M0 0L9 9"')
    expect(out).toContain('class="fg-ln"')
    expect(out).toMatch(/style="stroke-dasharray:1;stroke-dashoffset:0\.5;opacity:\.5"/)
  })
})
