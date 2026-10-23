import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { pilotRlsScript } from '../../video/pilot-rls/script'
import { VideoBlock } from './VideoBlock'

type Handler = (e: { detail: unknown }) => void
type Spy = ReturnType<typeof vi.fn>
type FakePlayer = { pause: Spy; play: Spy; toggle: Spy; seekTo: Spy; initialFrame: unknown; emit: (name: string, detail?: unknown) => void }

const fake = vi.hoisted(() => ({ players: [] as FakePlayer[] }))

// Плеер Remotion подменён: ref со шпионами и событиями, запоминает кадр, с которого начал (initialFrame);
// загрузку ролика и отказ он ведёт как настоящий.
vi.mock('@remotion/player', async () => {
  const { createElement, forwardRef, useEffect, useImperativeHandle, useState } = await import('react')
  type Props = { lazyComponent: () => Promise<unknown>; errorFallback: (info: { error: Error }) => unknown; initialFrame?: number }
  const Player = forwardRef(function Player(props: Props, ref) {
    const [error, setError] = useState<Error | null>(null)
    const [api] = useState(() => {
      const handlers = new Map<string, Set<Handler>>()
      const p = {
        initialFrame: props.initialFrame,
        pause: vi.fn(),
        play: vi.fn(),
        toggle: vi.fn(),
        seekTo: vi.fn(),
        getCurrentFrame: () => 0,
        addEventListener: (name: string, h: Handler) => void (handlers.get(name) ?? handlers.set(name, new Set()).get(name))!.add(h),
        removeEventListener: (name: string, h: Handler) => void handlers.get(name)?.delete(h),
        emit: (name: string, detail: unknown = {}) => handlers.get(name)?.forEach((h) => h({ detail })),
      }
      fake.players.push(p)
      return p
    })
    useImperativeHandle(ref, () => api, [api])
    const { lazyComponent } = props
    useEffect(() => {
      lazyComponent().catch((e: Error) => {
        setError(e)
        api.emit('error', { error: e })
      })
    }, [api, lazyComponent])
    return createElement('div', { 'data-testid': 'player' }, error ? (props.errorFallback({ error }) as never) : null)
  })
  return { Player }
})

vi.mock('./registry', async () => {
  const { pilotRlsScript } = await import('../../video/pilot-rls/script')
  const ok = () => Promise.resolve({ default: () => null })
  return {
    videos: {
      a: { script: pilotRlsScript, load: ok },
      b: { script: pilotRlsScript, load: ok },
      // 7789 кадров = 259,6 с: полная длительность округляется до 4:20, последний кадр — 4:19 целых секунд
      long: { script: { ...pilotRlsScript, scenes: [{ id: 'всё', durationInFrames: 7789 }] }, load: ok },
      broken: { script: pilotRlsScript, load: () => Promise.reject(new Error('Failed to fetch dynamically imported module')) },
    },
  }
})

const play = (id: string, instance: string) => window.dispatchEvent(new CustomEvent('vibecourse:video-play', { detail: { videoId: id, instance } }))
const cover = (title = 'Ролик') => screen.queryByRole('button', { name: `Смотреть ролик «${title}»` })
const poster = pilotRlsScript.hotspots[0].from

afterEach(() => {
  fake.players.length = 0
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  window.location.hash = ''
})

describe('VideoBlock', () => {
  it('если код ролика не загрузился, показывает «Ролик не загрузился», а название и страница остаются', async () => {
    render(<VideoBlock videoId="broken" title="Сломанный ролик" />)
    expect(await screen.findByText('Ролик не загрузился')).toBeInTheDocument()
    expect(screen.getByText('Сломанный ролик')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Смотреть' })).toBeNull()
    // ни обложки с кнопкой ▶, ни панели
    expect(cover('Сломанный ролик')).toBeNull()
    expect(screen.queryByRole('slider', { name: 'Перемотка' })).toBeNull()
  })

  it('другой ролик на том же месте не наследует ошибку загрузки', async () => {
    const { rerender } = render(<VideoBlock videoId="broken" title="Ролик" />)
    await screen.findByText('Ролик не загрузился')
    rerender(<VideoBlock videoId="a" title="Ролик" />)
    await act(async () => {})
    expect(screen.queryByText('Ролик не загрузился')).toBeNull()
    expect(screen.getByRole('button', { name: 'Смотреть' })).toBeInTheDocument()
  })

  it('загрузившийся ролик ошибки не показывает', async () => {
    render(<VideoBlock videoId="a" title="Ролик" />)
    await act(async () => {})
    expect(screen.queryByText('Ролик не загрузился')).toBeNull()
    expect(screen.getByRole('button', { name: 'Смотреть' })).toBeInTheDocument()
  })

  it('до запуска — обложка на кадре первой горячей точки, рамок точек нет', async () => {
    render(<VideoBlock videoId="a" title="Ролик" index={2} />)
    await act(async () => {})
    const player = fake.players[0]
    expect(player.initialFrame).toBe(poster)
    // настоящий плеер сообщает кадр, на котором стоит, — это кадр обложки, где уже есть горячая точка
    act(() => player.emit('frameupdate', { frame: poster }))
    expect(cover()).toBeInTheDocument()
    expect(screen.getByText('Видеоурок 2')).toBeInTheDocument()
    expect(screen.getByText('3:23')).toBeInTheDocument()
    for (const h of pilotRlsScript.hotspots) expect(screen.queryByRole('button', { name: h.title })).toBeNull()
    expect(screen.queryByText(/Нажмите на подсвеченное/)).toBeNull()
    // время в панели — с начала ролика, полная длительность — та же, что на обложке
    expect(screen.getByTestId('video-time')).toHaveTextContent('0:00 / 3:23')
  })

  it('нажатие на обложку запускает ролик с начала', async () => {
    const user = userEvent.setup()
    render(<VideoBlock videoId="a" title="Ролик" />)
    await act(async () => {})
    const player = fake.players[0]
    await user.click(cover()!)
    expect(player.seekTo).toHaveBeenCalledWith(0)
    expect(player.play).toHaveBeenCalledTimes(1)
    expect(player.seekTo.mock.invocationCallOrder[0]).toBeLessThan(player.play.mock.invocationCallOrder[0])
    expect(cover()).toBeNull()
  })

  it('после запуска на паузе — рамки точек и подсказка, пока ролик идёт — их нет', async () => {
    const user = userEvent.setup()
    render(<VideoBlock videoId="a" title="Ролик" />)
    await act(async () => {})
    const player = fake.players[0]
    await user.click(cover()!)
    const zone = pilotRlsScript.hotspots.find((h) => h.title === 'client/18')!
    act(() => {
      player.emit('play')
      player.emit('frameupdate', { frame: zone.from + 5 })
    })
    expect(screen.getByRole('button', { name: 'Пауза' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'client/18' })).toBeNull()
    act(() => player.emit('pause'))
    expect(screen.getByRole('button', { name: 'client/18' })).toBeInTheDocument()
    expect(screen.getByText('Нажмите на подсвеченное, чтобы узнать подробнее')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Смотреть' })).toBeInTheDocument()
  })

  it('кнопка панели: до запуска — с начала, потом — пауза и продолжение', async () => {
    const user = userEvent.setup()
    render(<VideoBlock videoId="a" title="Ролик" />)
    await act(async () => {})
    const player = fake.players[0]
    await user.click(screen.getByRole('button', { name: 'Смотреть' }))
    expect(player.seekTo).toHaveBeenCalledWith(0)
    expect(player.play).toHaveBeenCalledTimes(1)
    expect(cover()).toBeNull()
    act(() => player.emit('play'))
    await user.click(screen.getByRole('button', { name: 'Пауза' }))
    expect(player.toggle).toHaveBeenCalledTimes(1)
  })

  it('перемотка до запуска убирает обложку и ставит ролик на выбранный кадр', async () => {
    render(<VideoBlock videoId="a" title="Ролик" />)
    await act(async () => {})
    const player = fake.players[0]
    fireEvent.change(screen.getByRole('slider', { name: 'Перемотка' }), { target: { value: '900' } })
    expect(player.seekTo).toHaveBeenCalledWith(900)
    expect(cover()).toBeNull()
    expect(screen.getByTestId('video-time')).toHaveTextContent('0:30 / 3:23')
  })

  it('после конца — «Смотреть ещё раз» и «Дальше»', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/day/4'
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView')
    render(
      <section>
        <div className="video-grid">
          <VideoBlock videoId="a" title="Первый" />
          <VideoBlock videoId="b" title="Второй" />
        </div>
        <article data-testid="next">Мысль после роликов</article>
      </section>,
    )
    await act(async () => {})
    const [first, second] = fake.players
    expect(screen.queryByRole('button', { name: 'Смотреть ещё раз' })).toBeNull()
    act(() => {
      first.emit('play')
      first.emit('pause')
      first.emit('ended')
      second.emit('ended')
    })
    const [againFirst] = screen.getAllByRole('button', { name: 'Смотреть ещё раз' })
    const [nextFirst, nextSecond] = screen.getAllByRole('button', { name: 'Дальше' })
    // на экране конца рамок точек нет
    for (const h of pilotRlsScript.hotspots) expect(screen.queryByRole('button', { name: h.title })).toBeNull()

    // «Дальше» — к следующему материалу: после первого ролика второй, после последнего — то, что идёт за сеткой
    await user.click(nextFirst)
    expect(scroll.mock.contexts[0]).toBe(screen.getByText('Второй').closest('figure'))
    expect(scroll.mock.calls[0][0]).toMatchObject({ behavior: 'smooth' })
    await user.click(nextSecond)
    expect(scroll.mock.contexts[1]).toBe(screen.getByTestId('next'))
    expect(window.location.hash).toBe('#/day/4')

    await user.click(againFirst)
    expect(first.seekTo).toHaveBeenLastCalledWith(0)
    expect(first.play).toHaveBeenCalledTimes(1)
    expect(screen.getAllByRole('button', { name: 'Смотреть ещё раз' })).toHaveLength(1)
  })

  it('в конце ролика в панели текущее время равно полной длительности', async () => {
    render(<VideoBlock videoId="long" title="Ролик" />)
    await act(async () => {})
    const player = fake.players[0]
    act(() => {
      player.emit('play')
      player.emit('frameupdate', { frame: 7788 })
      player.emit('pause')
    })
    // на паузе — целые прошедшие секунды, как раньше
    expect(screen.getByTestId('video-time')).toHaveTextContent('4:19 / 4:20')
    act(() => player.emit('ended'))
    expect(screen.getByTestId('video-time')).toHaveTextContent('4:20 / 4:20')
  })

  it('«Дальше» при «уменьшить движение» прокручивает без анимации', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(prefers-reduced-motion: reduce)' }))
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView')
    render(
      <section>
        <VideoBlock videoId="a" title="Ролик" />
        <p>Дальше по теории</p>
      </section>,
    )
    await act(async () => {})
    act(() => fake.players[0].emit('ended'))
    await user.click(screen.getByRole('button', { name: 'Дальше' }))
    expect(scroll.mock.contexts[0]).toBe(screen.getByText('Дальше по теории'))
    expect(scroll.mock.calls[0][0]).toMatchObject({ behavior: 'auto' })
  })

  it('строка под роликом: длительность и число пояснений', async () => {
    render(<VideoBlock videoId="a" title="Ролик" />)
    await act(async () => {})
    expect(screen.getByRole('heading', { name: 'Ролик' })).toBeInTheDocument()
    expect(screen.getByText('3:23 · 3 пояснения по нажатию')).toBeInTheDocument()
  })

  it('«Во весь экран» — только если браузер умеет; подпись меняется, выход — той же кнопкой и по Esc', async () => {
    render(<VideoBlock videoId="a" title="Ролик" />)
    await act(async () => {})
    expect(screen.queryByRole('button', { name: 'Во весь экран' })).toBeNull()
    cleanup()

    // Полноэкранный режим jsdom не умеет — подменяем его: вход и выход сообщают fullscreenchange, как браузер
    let full: Element | null = null
    const change = () => document.dispatchEvent(new Event('fullscreenchange'))
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: true })
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => full })
    const enter = vi.fn((el: Element) => {
      full = el
      change()
      return Promise.resolve()
    })
    const exit = vi.fn(() => {
      full = null
      change()
      return Promise.resolve()
    })
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
      configurable: true,
      value: function (this: Element) {
        return enter(this)
      },
    })
    Object.defineProperty(document, 'exitFullscreen', { configurable: true, value: exit })
    const user = userEvent.setup()
    try {
      const { unmount } = render(<VideoBlock videoId="a" title="Ролик" />)
      await act(async () => {})
      await user.click(screen.getByRole('button', { name: 'Во весь экран' }))
      // во весь экран — блок с кадром и панелью, а не одна страница
      const [[screenEl]] = enter.mock.calls
      expect(screenEl).toContainElement(screen.getByTestId('player'))
      expect(screenEl).toContainElement(screen.getByRole('slider', { name: 'Перемотка' }))
      await user.click(screen.getByRole('button', { name: 'Выйти из полноэкранного режима' }))
      expect(exit).toHaveBeenCalledTimes(1)
      expect(screen.getByRole('button', { name: 'Во весь экран' })).toBeInTheDocument()

      // Esc: браузер выходит сам и сообщает fullscreenchange
      await user.click(screen.getByRole('button', { name: 'Во весь экран' }))
      act(() => {
        full = null
        change()
      })
      expect(screen.getByRole('button', { name: 'Во весь экран' })).toBeInTheDocument()

      const off = vi.spyOn(document, 'removeEventListener')
      unmount()
      expect(off.mock.calls.some(([name]) => name === 'fullscreenchange')).toBe(true)
    } finally {
      for (const key of ['fullscreenEnabled', 'fullscreenElement', 'exitFullscreen'] as const) Reflect.deleteProperty(document, key)
      Reflect.deleteProperty(HTMLElement.prototype, 'requestFullscreen')
    }
  })

  it('неизвестный ролик — «Ролик готовится»', () => {
    render(<VideoBlock videoId="нет-такого" title="Будущий ролик" />)
    expect(screen.getByText('Ролик готовится')).toBeInTheDocument()
  })

  it('запуск ролика рассылает событие vibecourse:video-play с videoId', () => {
    const seen: unknown[] = []
    const listener = (e: Event) => seen.push((e as CustomEvent).detail)
    window.addEventListener('vibecourse:video-play', listener)
    render(<VideoBlock videoId="a" title="Ролик" />)
    act(() => fake.players[0].emit('play'))
    window.removeEventListener('vibecourse:video-play', listener)
    expect(seen).toHaveLength(1)
    expect(seen[0]).toMatchObject({ videoId: 'a' })
  })

  it('запуск чужого ролика ставит этот на паузу', () => {
    render(<VideoBlock videoId="a" title="Ролик" />)
    act(() => play('b', 'чужой'))
    expect(fake.players[0].pause).toHaveBeenCalledTimes(1)
  })

  it('два блока одного ролика: запуск одного ставит на паузу другой, но не себя', () => {
    render(
      <>
        <VideoBlock videoId="a" title="Первый" />
        <VideoBlock videoId="a" title="Второй" />
      </>,
    )
    act(() => fake.players[1].emit('play'))
    expect(fake.players[0].pause).toHaveBeenCalledTimes(1)
    expect(fake.players[1].pause).not.toHaveBeenCalled()
  })

  it('после ухода со страницы блок на события не отзывается', () => {
    const { unmount } = render(<VideoBlock videoId="a" title="Ролик" />)
    const player = fake.players[0]
    unmount()
    play('b', 'чужой')
    expect(player.pause).not.toHaveBeenCalled()
  })
})
