import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Person, type Mood, type Pose } from './Person'

const poses: Pose[] = ['stand', 'point', 'think', 'cheer', 'surprised']
const moods: Mood[] = ['neutral', 'happy', 'worried']

// Разметка героя внутри svg, как в кадре ролика.
function render(props: { pose?: Pose; mood?: Mood; accessory?: 'whistle' | 'dumbbell' | 'hood' } = {}) {
  return renderToStaticMarkup(
    <svg>
      <Person color="#2B3FBF" {...props} />
    </svg>,
  )
}

// Путь рта: отдельный элемент с data-part="mouth".
function mouth(mood: Mood) {
  const match = /<path[^>]*data-part="mouth"[^>]*>/.exec(render({ mood }))
  return match?.[0] ?? ''
}

describe('Person', () => {
  it('поза point отличается от stand', () => {
    expect(render({ pose: 'point' })).not.toBe(render({ pose: 'stand' }))
  })

  it('каждая из пяти поз даёт разную разметку', () => {
    const markups = poses.map((pose) => render({ pose }))
    expect(new Set(markups).size).toBe(poses.length)
  })

  it('без pose совпадает с pose="stand"', () => {
    expect(render()).toBe(render({ pose: 'stand' }))
  })

  it('без mood совпадает с mood="neutral"', () => {
    expect(render()).toBe(render({ mood: 'neutral' }))
  })

  it('happy и worried дают разные рты', () => {
    const happy = mouth('happy')
    const worried = mouth('worried')
    expect(happy).not.toBe('')
    expect(worried).not.toBe('')
    expect(happy).not.toBe(worried)
    expect(new Set(moods.map(mouth)).size).toBe(moods.length)
  })

  it('руки — два отдельных пути в каждой позе', () => {
    for (const pose of poses) {
      const arms = render({ pose }).match(/data-part="arm"/g) ?? []
      expect(arms).toHaveLength(2)
    }
  })

  it('аксессуары остаются на месте', () => {
    expect(render({ accessory: 'whistle' })).toContain('<rect')
    expect(render({ accessory: 'hood' })).toContain('M-34 -40')
  })
})
