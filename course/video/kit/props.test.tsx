import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

// Кадр, который «видят» окна и телефон, задаёт тест: к кадру 100 всё уже появилось.
vi.mock('remotion', async (importOriginal) => ({ ...(await importOriginal<typeof import('remotion')>()), useCurrentFrame: () => 100 }))

import { Browser, Cloud, KeyGlyph, Mark, PhoneScreen, Pill } from './props'
import { PHONE_FONT, PHONE_SCALE } from './screens/layout'

const svg = (node: React.ReactNode) => renderToStaticMarkup(<svg>{node}</svg>)

// Ширина и высота первой рамки (rect) в разметке.
function frameOf(markup: string) {
  const m = markup.match(/<rect[^>]*?\swidth="([\d.]+)"[^>]*?\sheight="([\d.]+)"/)
  if (!m) throw new Error('в разметке нет рамки')
  return { w: Number(m[1]), h: Number(m[2]) }
}

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

  it('высота растёт с размером шрифта; compact — плотнее обычной плашки', () => {
    expect(frameOf(svg(<Pill x={0} y={0} text="да" size={30} />)).h).toBeGreaterThan(frameOf(svg(<Pill x={0} y={0} text="да" size={20} />)).h)
    expect(frameOf(svg(<Pill x={0} y={0} text="да" size={20} compact />)).h).toBeLessThan(frameOf(svg(<Pill x={0} y={0} text="да" size={20} />)).h)
  })
})

describe('Mark, Cloud, KeyGlyph', () => {
  it('Mark рисует галочку зелёным и крестик красным', () => {
    expect(svg(<Mark x={10} y={10} ok />)).toContain('stroke="#')
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
    expect(markup).toContain('Мои тренировки')
    expect(markup).toContain('Жим')
    expect(markup).toContain('Присед')
  })
})
