import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { VideoBlock } from './VideoBlock'

type Handler = (e: { detail: unknown }) => void
type FakePlayer = { pause: ReturnType<typeof vi.fn>; emit: (name: string, detail?: unknown) => void }

const fake = vi.hoisted(() => ({ players: [] as FakePlayer[] }))

// Плеер Remotion подменён: ref с pause-шпионом и событиями; загрузку ролика и отказ он ведёт как настоящий.
vi.mock('@remotion/player', async () => {
  const { createElement, forwardRef, useEffect, useImperativeHandle, useState } = await import('react')
  type Props = { lazyComponent: () => Promise<unknown>; errorFallback: (info: { error: Error }) => unknown }
  const Player = forwardRef(function Player(props: Props, ref) {
    const [error, setError] = useState<Error | null>(null)
    const [api] = useState(() => {
      const handlers = new Map<string, Set<Handler>>()
      const p = {
        pause: vi.fn(),
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
      broken: { script: pilotRlsScript, load: () => Promise.reject(new Error('Failed to fetch dynamically imported module')) },
    },
  }
})

const play = (id: string, instance: string) => window.dispatchEvent(new CustomEvent('vibecourse:video-play', { detail: { videoId: id, instance } }))

afterEach(() => {
  fake.players.length = 0
})

describe('VideoBlock', () => {
  it('если код ролика не загрузился, показывает «Ролик не загрузился», а название и страница остаются', async () => {
    render(<VideoBlock videoId="broken" title="Сломанный ролик" />)
    expect(await screen.findByText('Ролик не загрузился')).toBeInTheDocument()
    expect(screen.getByText('Сломанный ролик')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Смотреть' })).toBeNull()
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
