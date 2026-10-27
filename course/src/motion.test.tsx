import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { motionAllowed, transitionsAvailable, useReveal, withViewTransition } from './motion'

const root = document.documentElement
// Переход браузера подменяется прямо на document: в типах DOM он обязательный, поэтому — через свой тип
type Loose = { startViewTransition?: unknown }
const loose = document as unknown as Loose
const dropTransitions = () => Reflect.deleteProperty(document, 'startViewTransition')

// matchMedia: «уменьшить движение» включено (reduce) или нет
function stubMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: reduce && q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} }))
}

// Подменённый переход браузера: вызывает update сразу, finished — обещание, которое тест завершает сам
function stubTransitions() {
  let finish = () => {}
  const start = vi.fn((update: () => void) => {
    update()
    return { finished: new Promise<void>((res) => (finish = res)) }
  })
  loose.startViewTransition = start
  return { start, finish: () => finish() }
}

// Подменённый IntersectionObserver: show() — блок попал в окно
function stubObserver() {
  const made: { cb: IntersectionObserverCallback; disconnect: ReturnType<typeof vi.fn> }[] = []
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      disconnect = vi.fn()
      cb: IntersectionObserverCallback
      constructor(cb: IntersectionObserverCallback) {
        this.cb = cb
        made.push(this)
      }
      observe() {}
      unobserve() {}
    },
  )
  const show = (on = true) => made[0].cb([{ isIntersecting: on } as IntersectionObserverEntry], {} as IntersectionObserver)
  return { made, show }
}

function Block() {
  const ref = useReveal<HTMLDivElement>()
  return (
    <div ref={ref} data-testid="block">
      текст
    </div>
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  dropTransitions()
  delete root.dataset.transition
})

describe('motionAllowed', () => {
  it('без matchMedia (старый браузер, jsdom) — движения нет', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(motionAllowed()).toBe(false)
  })
  it('«уменьшить движение» выключено — можно, включено — нельзя', () => {
    stubMotion(false)
    expect(motionAllowed()).toBe(true)
    stubMotion(true)
    expect(motionAllowed()).toBe(false)
  })
})

describe('withViewTransition', () => {
  it('браузер не умеет переходы — смена сразу, без data-transition', () => {
    stubMotion(false)
    const update = vi.fn()
    expect(transitionsAvailable()).toBe(false)
    withViewTransition('page', update)
    expect(update).toHaveBeenCalledOnce()
    expect(root).not.toHaveAttribute('data-transition')
  })
  it('«уменьшить движение» — сразу, переход браузера не запускается', () => {
    stubMotion(true)
    const { start } = stubTransitions()
    const update = vi.fn()
    withViewTransition('forward', update)
    expect(update).toHaveBeenCalledOnce()
    expect(start).not.toHaveBeenCalled()
  })
  it('переход идёт: вид перехода на <html>, после конца снимается', async () => {
    stubMotion(false)
    const { start, finish } = stubTransitions()
    const update = vi.fn()
    withViewTransition('back', update)
    expect(start).toHaveBeenCalledOnce()
    expect(update).toHaveBeenCalledOnce()
    expect(root).toHaveAttribute('data-transition', 'back')
    finish()
    await Promise.resolve()
    await Promise.resolve()
    expect(root).not.toHaveAttribute('data-transition')
  })
  it('новый переход прерывает прежний: конец прежнего не снимает вид нового', async () => {
    stubMotion(false)
    const first = stubTransitions()
    withViewTransition('forward', () => {})
    const second = stubTransitions()
    withViewTransition('forward', () => {})
    first.finish()
    await Promise.resolve()
    await Promise.resolve()
    expect(root).toHaveAttribute('data-transition', 'forward')
    second.finish()
    await Promise.resolve()
    await Promise.resolve()
    expect(root).not.toHaveAttribute('data-transition')
  })
  it('переход браузера упал — смена всё равно выполняется', () => {
    stubMotion(false)
    loose.startViewTransition = () => {
      throw new Error('нет')
    }
    const update = vi.fn()
    withViewTransition('theme', update)
    expect(update).toHaveBeenCalledOnce()
    expect(root).not.toHaveAttribute('data-transition')
  })
})

describe('useReveal', () => {
  it('без движения атрибута нет — блок сразу готов', () => {
    stubMotion(true)
    stubObserver()
    const { getByTestId } = render(<Block />)
    expect(getByTestId('block')).not.toHaveAttribute('data-reveal')
  })
  it('без IntersectionObserver атрибута нет', () => {
    stubMotion(false)
    vi.stubGlobal('IntersectionObserver', undefined)
    const { getByTestId } = render(<Block />)
    expect(getByTestId('block')).not.toHaveAttribute('data-reveal')
  })
  it('ждёт показа (wait), на экране — go, наблюдатель отключается; уход с экрана до показа ничего не меняет', () => {
    stubMotion(false)
    const { made, show } = stubObserver()
    const { getByTestId } = render(<Block />)
    const block = getByTestId('block')
    expect(block).toHaveAttribute('data-reveal', 'wait')
    show(false)
    expect(block).toHaveAttribute('data-reveal', 'wait')
    show()
    expect(block).toHaveAttribute('data-reveal', 'go')
    expect(made[0].disconnect).toHaveBeenCalled()
  })
})
