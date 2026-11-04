import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

// Кадр и <Sequence> тест подменяет сам: вне композиции Remotion Sequence требует useVideoConfig. Подмена показывает сцену, пока кадр
// в её окне, и отдаёт ей кадр от её начала — как настоящий Sequence; остальное (AbsoluteFill, interpolate…) настоящее.
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

import { ch01 } from '../lessons/ch-01/lesson'
import { chAbc } from '../lessons/ch-abc/lesson'
import { buildLesson } from './build'
import { LessonVideo } from './LessonVideo'
import type { Lesson } from './lesson'

// Кадр середины первой схемы урока: на нём шапка, растушёвка, обрезка кадра и стрелки схемы
function figureFrame(lesson: Lesson): number {
  const b = buildLesson(lesson).scenes.find((s) => s.scene.frame.type === 'figure' && s.chapter > 0)!
  return b.start + Math.floor(b.duration * 0.8)
}

function render(lesson: Lesson): string {
  now.frame = figureFrame(lesson)
  return renderToStaticMarkup(createElement(LessonVideo, { lesson }))
}

const ids = (html: string) => [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])
const refs = (html: string) => [...html.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1])

describe('LessonVideo: id внутри SVG', () => {
  const a = render(chAbc)
  const b = render(ch01)

  it('кадры не пустые: шапка, обрезка кадра, стрелки схемы на месте', () => {
    for (const html of [a, b]) {
      expect(html).toContain('data-header="1"')
      expect(html).toContain('<clipPath')
      expect(refs(html).length).toBeGreaterThan(3)
      expect(html).toContain('marker-end="url(#')
    }
  })

  it('два ролика дня 1 не делят ни одного id: url(#…) одного не попадёт в элемент другого', () => {
    expect(ids(a).length).toBeGreaterThan(5)
    expect(ids(b).length).toBeGreaterThan(5)
    expect(ids(a).filter((id) => ids(b).includes(id))).toEqual([])
  })

  it('внутри ролика id не повторяются (одна сцена на экране — одни маркеры)', () => {
    for (const html of [a, b]) {
      const all = ids(html)
      expect(all.filter((id, i) => all.indexOf(id) !== i)).toEqual([])
    }
  })

  it('как в браузере: на странице два ролика, и каждая ссылка url(#…) находит первый элемент с таким id — в своём ролике', () => {
    document.body.innerHTML = `<div data-lesson="a">${a}</div><div data-lesson="b">${b}</div>`
    for (const [name, html] of [['a', a], ['b', b]] as const) {
      expect(refs(html).length).toBeGreaterThan(0)
      for (const id of refs(html)) {
        const target = document.getElementById(id)
        expect(target, `нет элемента #${id}`).not.toBeNull()
        expect(target!.closest('[data-lesson]')!.getAttribute('data-lesson'), `#${id} из ролика ${name}`).toBe(name)
      }
    }
    document.body.innerHTML = ''
  })

  it('клип номера главы лежит в шапке своего ролика, на него ссылается группа с номером; у роликов с разной длиной id клипы стоят в разных местах', () => {
    const clip = (html: string) => /<clipPath id="([^"]+)"><rect x="([\d.]+)"/.exec(html.slice(html.indexOf('data-header')))!
    for (const html of [a, b]) expect(html).toContain(`clip-path="url(#${clip(html)[1]})"`)
    // «ch-abc» и «ch-01» — шесть и пять знаков: x номера главы у них разный, поэтому чужой клип обрезал бы номер
    expect(clip(a)[2]).not.toBe(clip(b)[2])
  })
})
