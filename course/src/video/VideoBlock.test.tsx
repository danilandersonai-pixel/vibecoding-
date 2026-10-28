import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { pilotRlsScript } from '../../video/pilot-rls/script'
import { videos } from './registry'
import { VideoBlock } from './VideoBlock'

type Handler = (e: { detail: unknown }) => void
type Spy = ReturnType<typeof vi.fn>
type FakePlayer = { pause: Spy; play: Spy; toggle: Spy; seekTo: Spy; initialFrame: unknown; emit: (name: string, detail?: unknown) => void }

const fake = vi.hoisted(() => ({ players: [] as FakePlayer[] }))

// Плеер Remotion подменён: ref со шпионами и событиями, запоминает кадр, с которого начал (initialFrame);
// загрузку ролика и отказ он ведёт как настоящий, загруженный ролик рисует внутри себя — в том же дереве React.
vi.mock('@remotion/player', async () => {
  const { createElement, forwardRef, useEffect, useImperativeHandle, useState } = await import('react')
  type Loaded = { default: () => unknown }
  type Props = { lazyComponent: () => Promise<Loaded>; errorFallback: (info: { error: Error }) => unknown; initialFrame?: number }
  const Player = forwardRef(function Player(props: Props, ref) {
    const [error, setError] = useState<Error | null>(null)
    const [video, setVideo] = useState<Loaded | null>(null)
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
      lazyComponent().then(setVideo, (e: Error) => {
        setError(e)
        api.emit('error', { error: e })
      })
    }, [api, lazyComponent])
    const content = error ? props.errorFallback({ error }) : video ? createElement(video.default as never) : null
    return createElement('div', { 'data-testid': 'player' }, content as never)
  })
  return { Player }
})

// Кадр ролика вне композиции Remotion: useCurrentFrame — всегда начало
vi.mock('remotion', async (importOriginal) => ({ ...(await importOriginal<typeof import('remotion')>()), useCurrentFrame: () => 0 }))

vi.mock('./registry', async () => {
  const { createElement } = await import('react')
  const { pilotRlsScript } = await import('../../video/pilot-rls/script')
  const { Subtitles } = await import('../../video/lib/Subtitles')
  const ok = () => Promise.resolve({ default: () => null })
  // Ролик с настоящими субтитрами: реплика идёт с первого кадра
  const withSubtitles = () => Promise.resolve({ default: () => createElement(Subtitles, { cues: [{ from: 0, to: 6000, text: 'Первая реплика' }] }) })
  // Ролик набора «Репозиторий»: кадр 1920 × 1080, три главы (1800 / 2400 / 1800 кадров из 6000), адреса MP4 нет
  const chaptered = {
    ...pilotRlsScript,
    id: 'chaptered',
    width: 1920,
    height: 1080,
    scenes: [{ id: 'всё', durationInFrames: 6000 }],
    cues: [],
    hotspots: [{ from: 2000, to: 2300, x: 960, y: 540, w: 192, h: 108, title: 'git log', text: 'История коммитов проекта' }],
    chapters: [
      { from: 0, title: 'Что узнаете' },
      { from: 1800, title: 'Четыре части приложения' },
      { from: 4200, title: 'Итог' },
    ],
    poster: 2100,
  }
  return {
    videos: {
      chaptered: { script: chaptered, load: ok },
      // Тот же ролик с пустым списком глав — для плеера это ролик без глав
      unchaptered: { script: { ...chaptered, chapters: [] }, load: ok },
      // Старый ролик с адресом MP4 в хранилище страницы
      withMp4: { script: pilotRlsScript, load: ok, mp4Url: '/_blob/00000000000000000000000000000000' },
      a: { script: pilotRlsScript, load: ok },
      b: { script: pilotRlsScript, load: ok },
      subs: { script: pilotRlsScript, load: withSubtitles },
      // 7789 кадров = 259,6 с: полная длительность округляется до 4:20, последний кадр — 4:19 целых секунд
      long: { script: { ...pilotRlsScript, scenes: [{ id: 'всё', durationInFrames: 7789 }] }, load: ok },
      broken: { script: pilotRlsScript, load: () => Promise.reject(new Error('Failed to fetch dynamically imported module')) },
      brokenWide: { script: chaptered, load: () => Promise.reject(new Error('Failed to fetch dynamically imported module')) },
    },
  }
})

const play = (id: string, instance: string) => window.dispatchEvent(new CustomEvent('vibecourse:video-play', { detail: { videoId: id, instance } }))
const cover = (title = 'Ролик') => screen.queryByRole('button', { name: `Смотреть ролик «${title}»` })
const poster = pilotRlsScript.hotspots[0].from

// Полноэкранный режим jsdom не умеет — подменяем его: вход и выход сообщают fullscreenchange, как браузер
function stubFullscreen() {
  const fs = { full: null as Element | null, change: () => void document.dispatchEvent(new Event('fullscreenchange')) }
  const enter = vi.fn((el: Element) => {
    fs.full = el
    fs.change()
    return Promise.resolve()
  })
  const exit = vi.fn(() => {
    fs.full = null
    fs.change()
    return Promise.resolve()
  })
  Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: true })
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => fs.full })
  Object.defineProperty(document, 'exitFullscreen', { configurable: true, value: exit })
  Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
    configurable: true,
    value: function (this: Element) {
      return enter(this)
    },
  })
  return { fs, enter, exit }
}

afterEach(() => {
  fake.players.length = 0
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  window.location.hash = ''
  for (const key of ['fullscreenEnabled', 'fullscreenElement', 'exitFullscreen'] as const) Reflect.deleteProperty(document, key)
  Reflect.deleteProperty(HTMLElement.prototype, 'requestFullscreen')
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

  it('сообщение об ошибке лежит внутри кадра и сжимается с ним: в кадре 1920 × 1080 шрифт крупнее', async () => {
    const { unmount } = render(<VideoBlock videoId="broken" title="Старый" />)
    expect(await screen.findByText('Ролик не загрузился')).not.toHaveClass('video-failed-wide')
    unmount()
    render(<VideoBlock videoId="brokenWide" title="Новый" />)
    expect(await screen.findByText('Ролик не загрузился')).toHaveClass('video-failed', 'video-failed-wide')
    // ролика нет — перематывать некуда: ни панели с подписью главы, ни списка глав
    expect(screen.queryByTestId('video-chapter')).toBeNull()
    expect(screen.queryByRole('list', { name: 'Главы ролика' })).toBeNull()
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

  it('субтитры ролика: на обложке их нет, после запуска — есть', async () => {
    const user = userEvent.setup()
    render(<VideoBlock videoId="subs" title="Ролик" />)
    await act(async () => {})
    expect(cover()).toBeInTheDocument()
    expect(screen.queryByText('Первая реплика')).toBeNull()
    await user.click(cover()!)
    expect(screen.getByText('Первая реплика')).toBeInTheDocument()
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

    const { fs, enter, exit } = stubFullscreen()
    const user = userEvent.setup()
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
      fs.full = null
      fs.change()
    })
    expect(screen.getByRole('button', { name: 'Во весь экран' })).toBeInTheDocument()

    const off = vi.spyOn(document, 'removeEventListener')
    unmount()
    expect(off.mock.calls.some(([name]) => name === 'fullscreenchange')).toBe(true)
  })

  it('«Дальше» во весь экран сначала выходит из полноэкранного режима, потом прокручивает', async () => {
    const { exit } = stubFullscreen()
    const user = userEvent.setup()
    // прокрутка запоминает, был ли в этот момент полноэкранный режим
    const fullAtScroll: (Element | null)[] = []
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => void fullAtScroll.push(document.fullscreenElement))
    render(
      <section>
        <VideoBlock videoId="a" title="Ролик" />
        <p>Дальше по теории</p>
      </section>,
    )
    await act(async () => {})
    await user.click(screen.getByRole('button', { name: 'Во весь экран' }))
    act(() => fake.players[0].emit('ended'))
    await user.click(screen.getByRole('button', { name: 'Дальше' }))
    await waitFor(() => expect(scroll).toHaveBeenCalledTimes(1))
    expect(exit).toHaveBeenCalledTimes(1)
    expect(fullAtScroll).toEqual([null])
    expect(scroll.mock.contexts[0]).toBe(screen.getByText('Дальше по теории'))
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

// Ролик «Репозиторий» в тестах: 6000 кадров = 3:20, главы с кадров 0, 1800 (1:00) и 4200 (2:20)
describe('VideoBlock: главы ролика', () => {
  const chapters = videos.chaptered.script.chapters!
  const seekBar = () => screen.getByRole('slider', { name: 'Перемотка' })
  const segments = (container: HTMLElement) => [...container.querySelectorAll<HTMLElement>('.video-seek-chapters > *')]
  const chapterButtons = () => within(screen.getByRole('list', { name: 'Главы ролика' })).getAllByRole('button')
  // Ролик пошёл и дошёл до кадра frame
  const playTo = (player: FakePlayer, frame: number) =>
    act(() => {
      player.emit('play')
      player.emit('frameupdate', { frame })
    })

  it('под перемоткой — сегменты по главам, ширина пропорциональна длине главы', async () => {
    const { container } = render(<VideoBlock videoId="chaptered" title="Ролик" />)
    await act(async () => {})
    const bar = container.querySelector('.video-seek-chapters')!
    // полоса для глаз: чтение с экрана и клавиатура остаются за ползунком, он на месте и в той же обёртке
    expect(bar).toHaveAttribute('aria-hidden', 'true')
    expect(seekBar().parentElement).toContainElement(bar as HTMLElement)
    const parts = segments(container)
    expect(parts).toHaveLength(3)
    // ширина — доля свободного места: сумма длин глав даёт весь ролик, зазоры 2 px вычитает сама раскладка
    const grow = parts.map((p) => Number(p.style.flexGrow))
    expect(grow).toEqual([1800, 2400, 1800])
    expect(grow.reduce((a, b) => a + b)).toBe(6000)
  })

  it('пройденная часть полосы закрашена: прошедшие главы целиком, текущая — по доле, остальные пусты', async () => {
    const { container } = render(<VideoBlock videoId="chaptered" title="Ролик" />)
    await act(async () => {})
    const player = fake.players[0]
    const fill = () => segments(container).map((p) => p.style.getPropertyValue('--fill'))
    expect(fill()).toEqual(['0%', '0%', '0%'])
    // кадр 3000 — ровно середина второй главы (1800…4200)
    playTo(player, 3000)
    expect(fill()).toEqual(['100%', '50%', '0%'])
    act(() => player.emit('ended'))
    expect(fill()).toEqual(['100%', '100%', '100%'])
  })

  it('подпись текущей главы рядом со временем: «2/3 · название», на кадре в начале — первая глава', async () => {
    render(<VideoBlock videoId="chaptered" title="Ролик" />)
    await act(async () => {})
    const player = fake.players[0]
    // пока ролик на обложке, время 0:00 и глава первая, хотя кадр обложки лежит во второй главе
    expect(screen.getByTestId('video-chapter')).toHaveTextContent('1/3 · Что узнаете')
    expect(screen.getByTestId('video-chapter')).toHaveClass('video-chapter')
    playTo(player, 3000)
    expect(screen.getByTestId('video-chapter')).toHaveTextContent('2/3 · Четыре части приложения')
    // граница главы принадлежит новой главе, последний кадр — последней
    act(() => player.emit('frameupdate', { frame: 1799 }))
    expect(screen.getByTestId('video-chapter')).toHaveTextContent('1/3 · Что узнаете')
    act(() => player.emit('frameupdate', { frame: 1800 }))
    expect(screen.getByTestId('video-chapter')).toHaveTextContent('2/3 · Четыре части приложения')
    act(() => player.emit('frameupdate', { frame: 5999 }))
    expect(screen.getByTestId('video-chapter')).toHaveTextContent('3/3 · Итог')
    // подпись идёт в строке панели, после времени
    expect(screen.getByTestId('video-time').nextElementSibling).toBe(screen.getByTestId('video-chapter'))
  })

  it('под строкой с длительностью — список глав: время начала и название, текущая отмечена', async () => {
    const { container } = render(<VideoBlock videoId="chaptered" title="Ролик" />)
    await act(async () => {})
    const list = screen.getByRole('list', { name: 'Главы ролика' })
    expect(list.tagName).toBe('OL')
    expect(list).toHaveClass('video-chapters')
    // список лежит в блоке ролика, сразу после строки «м:сс · N пояснений»
    const meta = container.querySelector('.video-meta')!
    expect(meta.nextElementSibling).toBe(list)
    expect(container.querySelector('figure')).toContainElement(list)
    const items = chapterButtons()
    expect(items.map((b) => b.textContent)).toEqual(['0:00 Что узнаете', '1:00 Четыре части приложения', '2:20 Итог'])
    expect(items.map((b) => b.querySelector('.video-chapter-time')?.textContent)).toEqual(['0:00', '1:00', '2:20'])
    for (const b of items) expect(b).toHaveAttribute('type', 'button')
    // до запуска — первая глава, дальше следом за кадром
    expect(items.map((b) => b.getAttribute('aria-current'))).toEqual(['true', null, null])
    playTo(fake.players[0], 3000)
    expect(chapterButtons().map((b) => b.getAttribute('aria-current'))).toEqual([null, 'true', null])
  })

  it.each([
    ['ролик на обложке', () => {}],
    ['ролик идёт', (p: FakePlayer) => playTo(p, 500)],
    ['ролик на паузе', (p: FakePlayer) => {
      playTo(p, 500)
      act(() => p.emit('pause'))
    }],
    ['ролик досмотрен', (p: FakePlayer) => {
      playTo(p, 500)
      act(() => p.emit('ended'))
    }],
  ])('нажатие на главу — перемотка к её началу и запуск: %s', async (_state, setup) => {
    const user = userEvent.setup()
    render(<VideoBlock videoId="chaptered" title="Ролик" />)
    await act(async () => {})
    const player = fake.players[0]
    setup(player)
    await user.click(chapterButtons()[2])
    expect(player.seekTo).toHaveBeenCalledTimes(1)
    expect(player.seekTo).toHaveBeenCalledWith(chapters[2].from)
    expect(player.play).toHaveBeenCalledTimes(1)
    expect(player.seekTo.mock.invocationCallOrder[0]).toBeLessThan(player.play.mock.invocationCallOrder[0])
    // идущий плеер перед перемоткой ставится на паузу: иначе его seekTo оставляет отметку «возобновить» и следующая «Пауза» не держится
    expect(player.pause).toHaveBeenCalledTimes(1)
    expect(player.pause.mock.invocationCallOrder[0]).toBeLessThan(player.seekTo.mock.invocationCallOrder[0])
    // обложки и экрана конца нет, текущая — третья глава
    expect(cover()).toBeNull()
    expect(screen.queryByRole('button', { name: 'Смотреть ещё раз' })).toBeNull()
    expect(chapterButtons().map((b) => b.getAttribute('aria-current'))).toEqual([null, null, 'true'])
    expect(screen.getByTestId('video-chapter')).toHaveTextContent('3/3 · Итог')
    expect(screen.getByTestId('video-time')).toHaveTextContent('2:20 / 3:20')
  })

  it('перемотка ползунком по-прежнему ставит нужный кадр и переключает главу', async () => {
    render(<VideoBlock videoId="chaptered" title="Ролик" />)
    await act(async () => {})
    fireEvent.change(seekBar(), { target: { value: '4300' } })
    expect(fake.players[0].seekTo).toHaveBeenCalledWith(4300)
    expect(screen.getByTestId('video-chapter')).toHaveTextContent('3/3 · Итог')
  })

  it('пояснение по размеру кадра ролика: x 960, w 192 при 1920 даёт left 50 %, width 10 %', async () => {
    render(<VideoBlock videoId="chaptered" title="Ролик" />)
    await act(async () => {})
    const player = fake.players[0]
    playTo(player, 2100)
    act(() => player.emit('pause'))
    // y 540 и h 108 при высоте 1080 — тоже 50 % и 10 %
    expect(screen.getByRole('button', { name: 'git log' })).toHaveStyle({ left: '50%', top: '50%', width: '10%', height: '10%' })
  })

  it('слой пояснений тёмного ролика (кадр 1920 × 1080) помечен is-dark, у старого 1280 × 720 — нет', async () => {
    const { container, unmount } = render(<VideoBlock videoId="chaptered" title="Новый" />)
    await act(async () => {})
    playTo(fake.players[0], 2100)
    act(() => fake.players[0].emit('pause'))
    expect(container.querySelector('.hotspot-layer')).toHaveClass('is-dark')
    unmount()
    fake.players.length = 0

    const old = render(<VideoBlock videoId="a" title="Старый" />)
    await act(async () => {})
    const zone = pilotRlsScript.hotspots.find((h) => h.title === 'client/18')!
    playTo(fake.players[0], zone.from + 5)
    act(() => fake.players[0].emit('pause'))
    expect(old.container.querySelector('.hotspot-layer')).not.toBeNull()
    expect(old.container.querySelector('.hotspot-layer')).not.toHaveClass('is-dark')
  })

  it('сцена до загрузки тёмного ролика (1920 × 1080) помечена is-dark, у старого 1280 × 720 — нет', async () => {
    const wide = render(<VideoBlock videoId="chaptered" title="Новый" />)
    // кадр ещё не нарисован — фон сцены уже тёмный, без белой вспышки
    expect(wide.container.querySelector('.video-stage')).toHaveClass('is-dark')
    wide.unmount()
    const old = render(<VideoBlock videoId="a" title="Старый" />)
    expect(old.container.querySelector('.video-stage')).not.toHaveClass('is-dark')
    await act(async () => {})
  })

  it('блок тёмного ролика (1920 × 1080) помечен is-term — в сетке дня он во всю ширину, у старого 1280 × 720 — нет', async () => {
    const wide = render(<VideoBlock videoId="chaptered" title="Новый" />)
    expect(wide.container.querySelector('figure.video')).toHaveClass('is-term')
    wide.unmount()
    const old = render(<VideoBlock videoId="a" title="Старый" />)
    expect(old.container.querySelector('figure.video')).not.toHaveClass('is-term')
    await act(async () => {})
  })

  it('у ролика без глав (и с пустым списком глав) панель и блок прежние', async () => {
    for (const id of ['a', 'unchaptered']) {
      const { container, unmount } = render(<VideoBlock videoId={id} title="Ролик" />)
      await act(async () => {})
      expect(container.querySelector('.video-seek-chapters'), id).toBeNull()
      expect(container.querySelector('.video-seek-wrap'), id).toBeNull()
      expect(screen.queryByTestId('video-chapter'), id).toBeNull()
      expect(screen.queryByRole('list', { name: 'Главы ролика' }), id).toBeNull()
      expect(container.querySelector('.video-chapters'), id).toBeNull()
      // ползунок — прямо в панели, как раньше
      expect(seekBar().parentElement).toHaveClass('video-controls')
      unmount()
    }
  })

  it('старый ролик 1280 × 720: пояснения считаются от 1280 × 720, как раньше', async () => {
    render(<VideoBlock videoId="a" title="Ролик" />)
    await act(async () => {})
    const player = fake.players[0]
    const zone = pilotRlsScript.hotspots.find((h) => h.title === 'client/18')!
    playTo(player, zone.from + 5)
    act(() => player.emit('pause'))
    expect(screen.getByRole('button', { name: 'client/18' })).toHaveStyle({
      left: `${(zone.x / 1280) * 100}%`,
      top: `${(zone.y / 720) * 100}%`,
      width: `${(zone.w / 1280) * 100}%`,
      height: `${(zone.h / 720) * 100}%`,
    })
  })

  it('«Скачать MP4» есть у ролика с адресом MP4 и не появляется у нового ролика без него', async () => {
    const use = vi.fn(() => Promise.resolve({ save: vi.fn() }))
    vi.stubGlobal('claude', { use })
    render(<VideoBlock videoId="withMp4" title="Старый" />)
    expect(await screen.findByRole('button', { name: 'Скачать MP4' })).toBeInTheDocument()
    cleanup()

    use.mockClear()
    render(<VideoBlock videoId="chaptered" title="Новый" />)
    await act(async () => {})
    expect(screen.queryByRole('button', { name: 'Скачать MP4' })).toBeNull()
    // и за возможностью скачивания блок даже не обращается: адреса нет
    expect(use).not.toHaveBeenCalled()
  })
})
