import { AbsoluteFill, useCurrentFrame } from 'remotion'
import defs from '../../content/figures/_defs.svg?raw'
import restaurant from '../../content/figures/abc_restaurant.svg?raw'
import { bookRef } from './book'
import { Header } from './chrome/Header'
import { TermSubtitles } from './chrome/Subtitles'
import { Verdict } from './chrome/Verdict'
import { appear } from './motion'
import { CANVAS, FIGURE_VARS, MONO, SAFE, T } from './theme'

// Временная композиция «term-check» (60 кадров): проверка основы набора на экране — шапка, субтитр, строка Martian Mono,
// схема книги. На нём смотрят кадры задач 5–7; задача 8 её удалит.
// Метки ошибки: npx remotion still video/index.ts term-check out.png --frame=50 --props='{"mistake":true}'.
export type TermCheckProps = { mistake: boolean }

const CUES = [{ from: 10, to: 60, text: 'Телефон Анны — зал, его зовут фронтендом: всё, что видно и нажимается.' }]
const VERDICT: { at: number; kind: 'wrong' | 'right' }[] = [
  { at: 20, kind: 'wrong' },
  { at: 45, kind: 'right' },
]

const FIGURE = { w: 1590 } // схема 760 px шириной → 1590: самый мелкий текст (11,5 px) становится 24 px
const CELL = MONO.size * MONO.advance

export function TermCheck({ mistake }: TermCheckProps) {
  const frame = useCurrentFrame()
  const zeros = 40
  return (
    <AbsoluteFill style={{ background: T.desk }}>
      {/* Маркеры стрелок схем; не hidden: в display:none Chrome стрелок не рисует */}
      <div dangerouslySetInnerHTML={{ __html: defs }} />
      <div
        className="figure"
        style={{ ...FIGURE_VARS, position: 'absolute', left: SAFE.x + (SAFE.w - FIGURE.w) / 2, top: SAFE.y, width: FIGURE.w, opacity: appear(frame, 0) }}
        dangerouslySetInnerHTML={{ __html: restaurant }}
      />
      <svg viewBox={`0 0 ${CANVAS.w} ${CANVAS.h}`} width={CANVAS.w} height={CANVAS.h} style={{ position: 'absolute', inset: 0 }}>
        <Header lessonId="ch-abc" chapter={{ n: 2, total: 7, title: 'Git: история проекта' }} book={mistake ? '' : bookRef(['sa3'], 56)} at={0} />
        <Verdict mistake={mistake} verdict={mistake ? VERDICT : []} />
        {/* Рамка шириной в zeros знаков по замеренной ширине: нули должны ложиться в неё вплотную */}
        <rect x={SAFE.x} y={832} width={zeros * CELL} height={40} fill="none" stroke={T.line} strokeWidth={2} />
        <text x={SAFE.x} y={860} fill={T.ink} style={{ fontFamily: T.mono, fontSize: MONO.size, fontWeight: 500, fontVariantLigatures: 'none' }}>
          {'0'.repeat(zeros)}
        </text>
        <text x={SAFE.x + zeros * CELL + 48} y={860} fill={T.ok} style={{ fontFamily: T.mono, fontSize: MONO.size, fontWeight: 500, fontVariantLigatures: 'none' }}>
          {'$ git commit -m "первое сохранение"'}
        </text>
      </svg>
      <TermSubtitles cues={CUES} />
    </AbsoluteFill>
  )
}
