import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('remotion', async (importOriginal) => ({ ...(await importOriginal<typeof import('remotion')>()), useCurrentFrame: () => 50 }))

import { KitScene } from './KitScene'

// Разметка сцены с камерой (приближение 2) и полнокадровым наложением.
function render() {
  return renderToStaticMarkup(
    <KitScene chip="1 / 1 · Проба" duration={100} camera={[{ at: 0, x: 300, y: 200, zoom: 2 }]} overlay={<rect data-test="flash" width={1280} height={720} />}>
      <circle data-test="child" r={10} />
    </KitScene>,
  )
}

describe('KitScene', () => {
  it('холст сдвинут и увеличен по камере', () => {
    expect(render()).toContain('translate(40 -40) scale(2)')
  })

  it('наложение лежит вне камеры: во втором svg поверх холста, без сдвига', () => {
    const [, canvas, overlay] = render().split('<svg')
    expect(canvas).toContain('data-test="child"')
    expect(canvas).not.toContain('data-test="flash"')
    expect(overlay).toContain('data-test="flash"')
    expect(overlay).not.toContain('scale(')
  })

  it('без наложения второго svg нет', () => {
    const markup = renderToStaticMarkup(
      <KitScene chip="1 / 1" duration={100}>
        <circle r={10} />
      </KitScene>,
    )
    expect(markup.split('<svg')).toHaveLength(2)
  })
})
