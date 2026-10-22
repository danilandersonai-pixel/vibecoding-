import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

// Кадр, который «видят» экраны, задаёт тест.
const clock = vi.hoisted(() => ({ frame: 0 }))
vi.mock('remotion', async (importOriginal) => ({ ...(await importOriginal<typeof import('remotion')>()), useCurrentFrame: () => clock.frame }))

import { AgentChat } from './AgentChat'
import { Chart } from './Chart'
import { Checklist } from './Checklist'
import { Diff } from './Diff'
import { Editor } from './Editor'
import { chatLayout, niceMax, terminalStarts, wrapText, type TermLine } from './layout'
import { Spotlight } from './Spotlight'
import { Mono } from './Window'
import { Terminal } from './Terminal'

const LINES: TermLine[] = [
  { text: 'npm test', kind: 'cmd' },
  { text: '> trainer@1.0.0 test', kind: 'out' },
  { text: '✓ 12 тестов пройдено', kind: 'ok' },
  { text: '✗ нет файла client.ts', kind: 'err' },
]

const CHAT = [
  { from: 'me' as const, text: 'Добавь Олегу тренировку на среду' },
  { from: 'agent' as const, text: 'Готово: у Олега в среду силовая. Проверил тесты, все проходят.' },
]

// Все экраны на одном кадре, как в ролике.
function everything() {
  return renderToStaticMarkup(
    <svg>
      <Terminal x={0} y={0} w={600} at={0} lines={LINES} />
      <Editor x={0} y={0} w={580} at={0} file="client.ts" lines={['const a = 1', 'const b = 2']} highlight={[2]} />
      <Diff x={0} y={0} w={600} at={0} lines={[{ text: 'a', kind: 'del' }, { text: 'b', kind: 'add' }, { text: 'c', kind: 'same' }]} />
      <AgentChat x={0} y={0} w={600} at={0} messages={CHAT} />
      <Chart x={0} y={0} w={580} at={0} kind="bars" values={[3, 4, 2]} labels={['Пн', 'Вт', 'Ср']} unit="тренировок" />
      <Chart x={0} y={0} w={580} at={0} kind="line" values={[60, 62.5, 65]} labels={['1', '2', '3']} unit="кг" />
      <Checklist x={0} y={0} w={580} at={0} items={['Один', 'Два', 'Три']} done={2} />
      <Spotlight x={100} y={100} r={50} />
    </svg>,
  )
}

afterEach(() => {
  clock.frame = 0
})

describe('экраны', () => {
  it('весь текст на экранах не мельче 18 px', () => {
    for (const frame of [0, 30, 90, 400]) {
      clock.frame = frame
      const sizes = [...everything().matchAll(/font:\s*\d+\s+([\d.]+)px/g)].map((m) => Number(m[1]))
      expect(sizes.length).toBeGreaterThan(0)
      expect(Math.min(...sizes)).toBeGreaterThanOrEqual(18)
    }
  })
})

describe('Terminal', () => {
  it('начала строк идут по возрастанию, команда занимает больше времени, чем вывод', () => {
    const starts = terminalStarts(LINES, 0)
    expect(starts).toHaveLength(LINES.length)
    expect(starts.every((s, i) => i === 0 || s > starts[i - 1])).toBe(true)
    expect(starts[1] - starts[0]).toBeGreaterThan(starts[2] - starts[1])
  })

  it('команда набирается, вывод появляется после неё', () => {
    const [cmdAt, outAt] = terminalStarts(LINES, 0)
    const render = (frame: number) => {
      clock.frame = frame
      return renderToStaticMarkup(<svg><Terminal x={0} y={0} w={600} at={0} lines={LINES} /></svg>)
    }
    expect(render(cmdAt + 4)).toContain('npm')
    expect(render(cmdAt + 4)).not.toContain('npm test')
    expect(render(cmdAt + 4)).not.toContain('trainer@1.0.0')
    expect(render(outAt)).toContain('npm test')
    expect(render(outAt)).toContain('trainer@1.0.0')
    expect(render(outAt)).not.toContain('12 тестов')
    expect(render(400)).toContain('нет файла client.ts')
  })
})

describe('AgentChat', () => {
  it('перенос по словам укладывается в ширину', () => {
    const lines = wrapText('Готово: у Олега в среду силовая. Проверил тесты, все проходят.', 24)
    expect(lines.length).toBeGreaterThan(1)
    expect(lines.every((l) => l.length <= 24)).toBe(true)
    expect(lines.join(' ')).toBe('Готово: у Олега в среду силовая. Проверил тесты, все проходят.')
  })

  it('сообщения идут одно за другим, ответ агента печатается', () => {
    const { items } = chatLayout(CHAT, 600, 0)
    expect(items[1].start).toBeGreaterThan(items[0].start)
    expect(items[1].top).toBeGreaterThan(items[0].top)
    const render = (frame: number) => {
      clock.frame = frame
      return renderToStaticMarkup(<svg><AgentChat x={0} y={0} w={600} at={0} messages={CHAT} /></svg>)
    }
    expect(render(items[1].start - 1)).not.toContain('Готово')
    expect(render(items[1].start + 8)).toContain('Готово')
    expect(render(items[1].start + 8)).not.toContain('все проходят')
    expect(render(400)).toContain('все проходят')
  })
})

describe('Chart', () => {
  it('верх шкалы красивый и не меньше максимума', () => {
    expect(niceMax(72.5)).toBe(80)
    expect(niceMax(6)).toBe(6)
    expect(niceMax(0)).toBe(1)
    for (const v of [1, 7, 13, 99, 101, 250]) expect(niceMax(v)).toBeGreaterThanOrEqual(v)
  })

  it('столбики растут от нуля до высоты, пропорциональной значению', () => {
    const heights = (frame: number) => {
      clock.frame = frame
      const html = renderToStaticMarkup(<svg><Chart x={0} y={0} w={580} at={0} kind="bars" values={[3, 4]} /></svg>)
      return [...html.matchAll(/<rect[^>]*height="([\d.]+)"[^>]*rx="6"[^>]*fill="#2B3FBF"/g)].map((m) => Number(m[1]))
    }
    expect(heights(0)).toEqual([0, 0])
    const [a, b] = heights(200)
    expect(a).toBeGreaterThan(0)
    expect(b / a).toBeCloseTo(4 / 3, 5)
  })
})

describe('Checklist', () => {
  it('галочки появляются по одной и не больше done', () => {
    const ticks = (frame: number) => {
      clock.frame = frame
      const html = renderToStaticMarkup(<svg><Checklist x={0} y={0} w={580} at={0} items={['Один', 'Два', 'Три']} done={2} /></svg>)
      return (html.match(/stroke-dashoffset="0"/g) ?? []).length
    }
    expect(ticks(0)).toBe(0)
    expect(ticks(16 + 8)).toBe(1)
    expect(ticks(400)).toBe(2)
  })
})

describe('Spotlight', () => {
  it('затемняет всё, кроме круга', () => {
    clock.frame = 100
    const html = renderToStaticMarkup(<svg><Spotlight x={100} y={120} r={50} /></svg>)
    expect(html).toContain('fill-rule="evenodd"')
    expect(html).toContain('cx="100"')
    expect(html).toContain('r="50"')
  })
})

describe('Mono', () => {
  it('код без лигатур: => и <= не склеиваются в стрелку и знак', () => {
    const m = renderToStaticMarkup(<svg><Mono x={0} y={0} fill="#000">{'() => x <= 100'}</Mono></svg>)
    expect(m).toContain('font-variant-ligatures:none')
  })
})
