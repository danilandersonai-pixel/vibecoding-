import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

// Кадр, который «видят» окна и телефон, задаёт тест: к кадру 100 всё уже появилось.
vi.mock('remotion', async (importOriginal) => ({ ...(await importOriginal<typeof import('remotion')>()), useCurrentFrame: () => 100 }))

import { theme } from '../theme'
import { Browser, Callout, Cloud, KeyGlyph, Mark, PhoneScreen, Pill, Slot } from './props'
import { PHONE_FONT, PHONE_SCALE } from './screens/layout'

const svg = (node: React.ReactNode) => renderToStaticMarkup(<svg>{node}</svg>)

// Ширина, высота и толщина линии первой рамки (rect) в разметке.
function frameOf(markup: string) {
  const m = markup.match(/<rect[^>]*?\swidth="([\d.]+)"[^>]*?\sheight="([\d.]+)"[^>]*?\sstroke-width="([\d.]+)"/)
  if (!m) throw new Error('в разметке нет рамки')
  return { w: Number(m[1]), h: Number(m[2]), stroke: Number(m[3]) }
}

// Все цвета линий (stroke) в разметке без повторов.
const strokesOf = (markup: string) => [...new Set([...markup.matchAll(/\sstroke="([^"]+)"/g)].map((m) => m[1]))]

const sizesOf = (markup: string) => [...markup.matchAll(/font:\s*\d+\s+([\d.]+)px/g)].map((m) => Number(m[1]))

describe('Pill', () => {
  it('без w ширина считается от текста: длинный текст шире короткого', () => {
    const short = frameOf(svg(<Pill x={100} y={100} text="да" />))
    const long = frameOf(svg(<Pill x={100} y={100} text="разница в пару пунктов — шум" />))
    expect(long.w).toBeGreaterThan(short.w)
    expect(short.w).toBeGreaterThan(0)
  })

  it('с w рамка ровно такой ширины, текст не влияет', () => {
    expect(frameOf(svg(<Pill x={100} y={100} w={250} text="да" />)).w).toBe(250)
    expect(frameOf(svg(<Pill x={100} y={100} w={250} text="разница в пару пунктов — шум" />)).w).toBe(250)
  })

  it('моноширинный текст без w шире обычного: знаки в нём шире', () => {
    const plain = frameOf(svg(<Pill x={100} y={100} text="myapp.ru" />))
    const mono = frameOf(svg(<Pill x={100} y={100} text="myapp.ru" mono />))
    expect(mono.w).toBeGreaterThan(plain.w)
  })

  it('размер шрифта по умолчанию — не меньше 18', () => {
    const sizes = sizesOf(svg(<Pill x={100} y={100} text="да" />))
    expect(sizes).toHaveLength(1)
    expect(sizes[0]).toBeGreaterThanOrEqual(18)
  })

  it('обычная плашка: высота size + 20, рамка 3', () => {
    const f = frameOf(svg(<Pill x={0} y={0} text="да" size={20} />))
    expect(f.h).toBe(40)
    expect(f.stroke).toBe(3)
    expect(frameOf(svg(<Pill x={0} y={0} text="да" size={30} />)).h).toBe(50)
  })

  it('compact: высота size + 16, рамка 2,5', () => {
    const f = frameOf(svg(<Pill x={0} y={0} text="да" size={20} compact />))
    expect(f.h).toBe(36)
    expect(f.stroke).toBe(2.5)
    expect(frameOf(svg(<Pill x={0} y={0} text="да" size={30} compact />)).h).toBe(46)
  })

  it('размер по умолчанию: 22 у обычной плашки, 18 у compact; свой size важнее', () => {
    expect(sizesOf(svg(<Pill x={0} y={0} text="да" />))).toEqual([22])
    expect(sizesOf(svg(<Pill x={0} y={0} text="да" compact />))).toEqual([18])
    expect(sizesOf(svg(<Pill x={0} y={0} text="да" compact size={24} />))).toEqual([24])
    expect(frameOf(svg(<Pill x={0} y={0} text="да" compact />)).h).toBe(34)
  })

  it('compact без w: ширина от текста по размеру 18', () => {
    const wide = frameOf(svg(<Pill x={0} y={0} text="разница в пару пунктов — шум" compact />))
    expect(wide.w).toBe(Math.round('разница в пару пунктов — шум'.length * 18 * 0.56 + 28))
  })
})

describe('Mark, Cloud, KeyGlyph', () => {
  it('Mark рисует галочку цветом ok, а крестик цветом risk', () => {
    expect(strokesOf(svg(<Mark x={10} y={10} ok />))).toEqual([theme.ok])
    expect(strokesOf(svg(<Mark x={10} y={10} ok={false} />))).toEqual([theme.risk])
  })

  it('Mark: галочка и крестик — разные линии', () => {
    expect(svg(<Mark x={10} y={10} ok />)).not.toBe(svg(<Mark x={10} y={10} ok={false} />))
  })

  it('Cloud рисует контур и детей внутри', () => {
    const markup = svg(
      <Cloud x={0} y={0} w={200} h={100}>
        <circle data-test="inside" r={3} />
      </Cloud>,
    )
    expect(markup).toContain('<path')
    expect(markup).toContain('data-test="inside"')
  })

  it('KeyGlyph ставится в точку и масштабируется', () => {
    expect(svg(<KeyGlyph x={40} y={50} color="#123456" scale={2} />)).toContain('translate(40 50) scale(2)')
  })
})

describe('Browser', () => {
  it('показывает адрес и страницу в детях', () => {
    const markup = svg(
      <Browser x={0} y={0} w={500} h={300} at={0} url="localhost:3000">
        <circle data-test="page" r={3} />
      </Browser>,
    )
    expect(markup).toContain('localhost:3000')
    expect(markup).toContain('data-test="page"')
  })

  it('весь текст в окне не мельче 18', () => {
    const sizes = sizesOf(svg(<Browser x={0} y={0} w={500} h={300} at={0} url="localhost:3000" />))
    expect(sizes.length).toBeGreaterThan(0)
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(18)
  })
})

describe('PhoneScreen', () => {
  it('телефон в масштабе PHONE_SCALE делает текст экрана не мельче 18 px в кадре', () => {
    expect(PHONE_FONT * PHONE_SCALE).toBeGreaterThanOrEqual(18)
  })

  it('рисует кнопку и список после listAt', () => {
    const markup = svg(<PhoneScreen tapAt={10} listAt={50} list={['Жим', 'Присед']} />)
    expect(markup).toContain('Жим')
    expect(markup).toContain('Присед')
  })

  it('весь текст экрана — размера PHONE_FONT, а в кадре при PHONE_SCALE не мельче 18', () => {
    const sizes = sizesOf(svg(<PhoneScreen tapAt={10} listAt={50} list={['Жим', 'Присед']} />))
    expect(sizes.length).toBeGreaterThan(1)
    for (const size of sizes) {
      expect(size).toBe(PHONE_FONT)
      expect(size * PHONE_SCALE).toBeGreaterThanOrEqual(18)
    }
  })

  it('подпись кнопки по умолчанию «Мои тренировки», свою подпись выводит', () => {
    expect(svg(<PhoneScreen tapAt={10} listAt={50} list={[]} />)).toContain('Мои тренировки')
    const custom = svg(<PhoneScreen tapAt={10} listAt={50} list={[]} label="Мои замеры" />)
    expect(custom).toContain('Мои замеры')
    expect(custom).not.toContain('Мои тренировки')
  })

  it('подпись кнопки белая из темы', () => {
    expect(svg(<PhoneScreen tapAt={10} listAt={50} list={[]} />)).toContain(`fill="${theme.white}"`)
  })
})

describe('Callout', () => {
  const line = (markup: string) => {
    const m = markup.match(/<line x1="([\d.-]+)" y1="([\d.-]+)" x2="([\d.-]+)" y2="([\d.-]+)"/)
    if (!m) throw new Error('в разметке нет указки')
    return m.slice(1).map(Number)
  }
  it('указка кончается точкой у говорящего (tx, ty)', () => {
    const m = svg(<Callout x={400} y={200} tx={300} ty={320} text="Вроде работает!" />)
    const [, , x2, y2] = line(m)
    expect([x2, y2]).toEqual([300, 320])
    expect(m).toContain('<circle cx="300" cy="320"')
    expect(m).toContain('Вроде работает!')
  })
  it('говорящий ниже — указка от нижнего края плашки, выше — от верхнего', () => {
    const [, below] = line(svg(<Callout x={400} y={200} tx={300} ty={320} text="да" />))
    const [, above] = line(svg(<Callout x={400} y={200} tx={300} ty={80} text="да" />))
    expect(below).toBeGreaterThan(200)
    expect(above).toBeLessThan(200)
  })
  it('шрифт по умолчанию не мельче 18 px', () => {
    for (const size of sizesOf(svg(<Callout x={400} y={200} tx={300} ty={320} text="да" />))) expect(size).toBeGreaterThanOrEqual(18)
  })
})

describe('Pill mono', () => {
  it('моноширинная плашка без лигатур', () => {
    expect(svg(<Pill x={100} y={100} text="a => b" mono />)).toContain('font-variant-ligatures:none')
  })
})

describe('Slot', () => {
  it('пунктирная рамка с левым верхним углом в (x, y) и заданным размером', () => {
    const m = svg(<Slot x={40} y={60} w={200} h={90} />)
    expect(m).toContain('<rect x="40" y="60" width="200" height="90"')
    expect(m).toContain('stroke-dasharray')
    expect(m).not.toContain('<text')
  })
  it('подпись — бледная, по центру места, не мельче 18 px', () => {
    const m = svg(<Slot x={40} y={60} w={200} h={90} text="пул-реквест" />)
    expect(m).toContain('пул-реквест')
    expect(m).toContain(`fill="${theme.soft}"`)
    expect(m).toMatch(/<text x="140"/)
    for (const size of sizesOf(m)) expect(size).toBeGreaterThanOrEqual(18)
  })
})
