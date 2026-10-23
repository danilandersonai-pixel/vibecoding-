import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

const clock = vi.hoisted(() => ({ frame: 0 }))
vi.mock('remotion', async (importOriginal) => ({ ...(await importOriginal<typeof import('remotion')>()), useCurrentFrame: () => clock.frame }))

import { Subtitles } from './Subtitles'
import { SubtitlesShown } from './subtitlesShown'

const CUES = [{ from: 10, to: 40, text: 'Первая реплика' }]

afterEach(() => {
  clock.frame = 0
})

describe('Subtitles', () => {
  it('по умолчанию показывает текущую реплику — как в MP4 и Studio', () => {
    clock.frame = 20
    expect(renderToStaticMarkup(<Subtitles cues={CUES} />)).toContain('Первая реплика')
  })

  it('выключенные субтитры не рисуются', () => {
    clock.frame = 20
    const html = renderToStaticMarkup(
      <SubtitlesShown.Provider value={false}>
        <Subtitles cues={CUES} />
      </SubtitlesShown.Provider>,
    )
    expect(html).toBe('')
  })
})
