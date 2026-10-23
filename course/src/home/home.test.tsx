import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getDay, getDays } from '../content/load'
import { currentDay } from '../course/currentDay'
import { CourseProgressContext, useCourseProgress } from '../progress/courseProgress'
import { emptyProgress, type Progress } from '../progress/model'
import { finishDay } from '../test/progress'
import { ContinueCard } from './ContinueCard'
import { coverCta } from './cta'
import { DaySteps } from './DaySteps'
import { HomeCover } from './HomeCover'
import { scrollToId } from './scroll'

// Верх главной так, как его соберёт MapPage; карта — пустое место с id="map" для прокрутки
function Top() {
  const { progress } = useCourseProgress()
  const state = currentDay(progress, getDays())
  return (
    <>
      <HomeCover cta={coverCta(state)} />
      <ContinueCard state={state} day={getDay(state.n)!} streak={progress.streak.count} />
      <DaySteps />
      <div id="map" />
    </>
  )
}

function renderTop(progress: Progress = emptyProgress()) {
  render(
    <CourseProgressContext.Provider value={{ progress, update: () => {}, storeKind: 'memory' }}>
      <Top />
    </CourseProgressContext.Provider>,
  )
  return within(screen.getByRole('region', { name: 'Продолжить обучение' }))
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('верх главной', () => {
  it('новичок: кнопка «Начать день 1» и карточка «С чего начать»', () => {
    const card = renderTop()
    expect(screen.getByRole('link', { name: 'Начать день 1' })).toHaveAttribute('href', '#/day/1')
    expect(card.getByText('С чего начать')).toBeInTheDocument()
    expect(card.getByText('День 1 · Азбука и знакомство с моделями')).toBeInTheDocument()
    expect(card.getByText('2 видеоурока · 8:42 · тест · 6 шагов практики')).toBeInTheDocument()
    expect(card.getByText('0%')).toBeInTheDocument()
    expect(card.getByRole('link', { name: 'Начать' })).toHaveAttribute('href', '#/day/1')
    expect(card.queryByText(/подряд/)).toBeNull()
  })

  it('вернувшийся: «Продолжить день 2», пройдено 1 из 21, серия', () => {
    const progress = { ...finishDay(emptyProgress(), getDay(1)!), streak: { lastDate: '2026-10-22', count: 3 } }
    const card = renderTop(progress)
    expect(screen.getByRole('link', { name: 'Продолжить день 2' })).toHaveAttribute('href', '#/day/2')
    expect(card.getByText('Вы остановились здесь · пройдено 1 из 21')).toBeInTheDocument()
    expect(card.getByText(`День 2 · ${getDay(2)!.title}`)).toBeInTheDocument()
    expect(card.getByText('5%')).toBeInTheDocument()
    expect(card.getByText('3 дня подряд')).toBeInTheDocument()
    expect(card.getByRole('link', { name: 'Продолжить' })).toHaveAttribute('href', '#/day/2')
  })

  it('всё пройдено: «Курс пройден»', async () => {
    const user = userEvent.setup()
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView')
    const card = renderTop(getDays().reduce(finishDay, emptyProgress()))
    expect(card.getByText('Курс пройден')).toBeInTheDocument()
    expect(card.getByText('100%')).toBeInTheDocument()
    expect(card.queryByRole('link', { name: 'Продолжить' })).toBeNull()
    await user.click(card.getByRole('button', { name: 'К карте' }))
    expect(scroll).toHaveBeenCalledTimes(1)
    expect(scroll.mock.contexts[0]).toBe(document.getElementById('map'))
  })

  it('книга открывается в новой вкладке', () => {
    renderTop()
    const book = screen.getByRole('link', { name: 'Книга' })
    expect(book).toHaveAttribute('href', 'book.html')
    expect(book).toHaveAttribute('target', '_blank')
    expect(book).toHaveAttribute('rel', 'noopener')
  })

  it('«Карта» в шапке прокручивает к карте', async () => {
    const user = userEvent.setup()
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView')
    renderTop()
    await user.click(screen.getByRole('button', { name: 'Карта' }))
    expect(scroll.mock.contexts[0]).toBe(document.getElementById('map'))
  })

  it('обложка: заголовок, подзаголовок и диф по спецификации', () => {
    renderTop()
    expect(screen.getByText('Практический курс · по книге «Вайб-кодинг на практике»')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Своё приложение с ИИ за 21 день' })).toBeInTheDocument()
    expect(
      screen.getByText('Каждый день — короткая теория, видеоурок и практика в Claude Code. К концу курса у вас работает приложение для тренера и его подопечных.'),
    ).toBeInTheDocument()
    expect(document.querySelector('pre')?.textContent).toBe(
      [
        '@@ 21 день @@',
        '- «сделай мне приложение» и надежда',
        '- код, который никто не читал',
        '+ спецификация, план, маленькие шаги',
        '+ тесты, защита данных, запуск',
      ].join('\n'),
    )
  })

  it('факты обложки: 27 видеоуроков', () => {
    renderTop()
    const facts = within(screen.getByRole('banner')).getAllByRole('listitem').map((li) => li.textContent)
    expect(facts).toEqual(['21 день · 3 недели', '27 видеоуроков', 'Практика в Claude Code', 'Наставник в Claude Code'])
  })

  it('«Как устроен курс» прокручивает к шагам, адрес не меняется', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/'
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView')
    renderTop()
    await user.click(screen.getByRole('button', { name: 'Как устроен курс' }))
    expect(scroll).toHaveBeenCalledTimes(1)
    expect(scroll.mock.contexts[0]).toBe(document.getElementById('how'))
    expect(window.location.hash).toBe('#/')
  })

  it('«Как проходит день»: четыре шага по порядку', () => {
    renderTop()
    const how = within(document.getElementById('how')!)
    expect(how.getByRole('heading', { name: 'Как проходит день' })).toBeInTheDocument()
    expect(how.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Видеоурок',
      'Теория и тест',
      'Практика в Claude Code',
      'Наставник проверяет',
    ])
    expect(how.getByText('короткий ролик с пояснениями по нажатию')).toBeInTheDocument()
    expect(how.getByText('мысли из книги, схемы, тренажёры и проверка понимания')).toBeInTheDocument()
    expect(how.getByText('готовые запросы: копируете и делаете шаг за шагом')).toBeInTheDocument()
    expect(how.getByText('команда /mentor сверяет сделанное в вашем проекте')).toBeInTheDocument()
  })
})

describe('scrollToId', () => {
  it('прокручивает плавно, а при «уменьшить движение» — без анимации', () => {
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView')
    render(<div id="target" />)
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    scrollToId('target')
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query === '(prefers-reduced-motion: reduce)' }))
    scrollToId('target')
    expect(scroll.mock.calls).toEqual([[{ behavior: 'smooth', block: 'start' }], [{ behavior: 'auto', block: 'start' }]])
  })

  it('нет элемента — ничего не делает', () => {
    const scroll = vi.spyOn(Element.prototype, 'scrollIntoView')
    expect(() => scrollToId('nowhere')).not.toThrow()
    expect(scroll).not.toHaveBeenCalled()
  })
})
