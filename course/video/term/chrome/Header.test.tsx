import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

// Кадр и <Sequence> тест подменяет сам, как LessonVideo.test.tsx: вне композиции Remotion Sequence требует useVideoConfig.
// Подмена показывает сцену, пока кадр в её окне, и отдаёт ей кадр от её начала — как настоящий Sequence.
const now = vi.hoisted(() => ({ frame: 0 }))
vi.mock('remotion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('remotion')>()
  const react = await import('react')
  const Local = react.createContext<number | null>(null)
  return {
    ...actual,
    useCurrentFrame: () => react.useContext(Local) ?? now.frame,
    Sequence: ({ from, durationInFrames, children }: { from: number; durationInFrames: number; children: React.ReactNode }) => {
      const parent = react.useContext(Local) ?? now.frame
      const local = parent - from
      return local >= 0 && local < durationInFrames ? react.createElement(Local.Provider, { value: local }, children) : null
    },
  }
})

import { buildLesson } from '../build'
import { fixtureLesson } from '../fixture-lesson'
import type { Lesson } from '../lesson'
import { LessonVideo } from '../LessonVideo'
import { MOTION } from '../theme'
import { Header } from './Header'

// Шапка ролика на кадре frame: разметка от группы шапки до конца общего <svg> (шапка в нём последняя, субтитры — вне svg;
// у схем книги в сценах свои вложенные <svg>, поэтому конец — последний)
function header(lesson: Lesson, frame: number): string {
  now.frame = frame
  const html = renderToStaticMarkup(createElement(LessonVideo, { lesson }))
  return html.slice(html.indexOf('data-header="1"'), html.lastIndexOf('</svg>'))
}

const opacity = (html: string, re: RegExp) => Number(re.exec(html)?.[1] ?? NaN)
// Название главы — текст «/05 · …» шапки; правая часть — группа headerRight со ссылкой на книгу
const titleOpacity = (html: string) => opacity(html, /<text [^>]*opacity="([\d.e-]+)"[^>]*>\/05 · /)
const bookOpacity = (html: string) => opacity(html, /<g opacity="([\d.e-]+)"><text [^>]*>книга · /)

describe('Header: смена главы', () => {
  it('правая часть шапки и название главы меняются на одном кадре', () => {
    // Глава 3 с длинным названием начинается после сцены mistake главы 2: справа были «Типичная ошибка» и «Верно», станет ссылка на книгу
    const long = 'Как код с компьютера разработчика попадает на сайт'
    const l = structuredClone(fixtureLesson)
    l.chapters[2].title = long
    const at = buildLesson(l).scenes.find((s) => s.id === 'site-envs')!.start

    const before = header(l, at - 1)
    expect(before).toContain('/05 · Четыре части приложения')
    expect(before).toContain('>Типичная ошибка<')
    expect(before).toContain('>Верно<')
    expect(before).not.toContain(long)

    for (let t = 0; t <= MOTION.chapter; t++) {
      const html = header(l, at + t)
      // с кадра at — ни прежнего названия, ни прежних меток: обе половины шапки уже новые
      expect(html, `кадр at + ${t}`).toContain(`/05 · ${long}`)
      expect(html, `кадр at + ${t}`).not.toContain('Четыре части приложения')
      expect(html, `кадр at + ${t}`).not.toContain('>Типичная ошибка<')
      expect(html, `кадр at + ${t}`).not.toContain('>Верно<')
      // и проявляются они вместе: ни одна не опаздывает
      expect(bookOpacity(html), `кадр at + ${t}`).toBeCloseTo(titleOpacity(html), 6)
    }
    expect(titleOpacity(header(l, at))).toBe(0)
    expect(titleOpacity(header(l, at + 1))).toBeGreaterThan(0)
    expect(titleOpacity(header(l, at + MOTION.chapter))).toBe(1)
  })

  it('до кадра at смены ещё нет: название видно, номер не крутится', () => {
    now.frame = 90
    const html = renderToStaticMarkup(createElement('svg', null, createElement(Header, { lessonId: 'ch-abc', chapter: { n: 2, total: 7, title: 'Git: история проекта' }, book: '', at: 100 })))
    expect(html).toContain('Git: история проекта')
    expect(opacity(html, /<text [^>]*opacity="([\d.e-]+)"[^>]*>\/07 · /)).toBe(1)
    expect(html).not.toContain('>01<')
    expect(html).toContain('>02<')
  })
})
