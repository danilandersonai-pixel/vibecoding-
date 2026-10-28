import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion'
import defs from '../../content/figures/_defs.svg?raw'
import restaurant from '../../content/figures/abc_restaurant.svg?raw'
import { find } from '../sessions'
import { bookRef } from './book'
import { Header } from './chrome/Header'
import { TermSubtitles } from './chrome/Subtitles'
import { Verdict } from './chrome/Verdict'
import type { Clock, FrameCtx } from './frame'
import { frameDef } from './frames'
import type { FrameSpec } from './frames'
import { appear } from './motion'
import { CANVAS, FIGURE_VARS, MONO, SAFE, T } from './theme'

// Временная композиция «term-check»: проверка набора на экране. На ней смотрят кадры задач 5–7; задача 8 её удалит.
// Кадры 0–59 — основа: шапка, субтитр, строка Martian Mono, схема книги.
// Дальше идут сцены кадров на настоящих записях s02-sets, по SCENE_FRAMES кадров каждая (три реплики — на кадрах 30, 120, 210 сцены):
//   60 Terminal (dev и server-строки save-bad), 390 Terminal (start-dev: код выхода 1), 720 Editor (route, дерево, подсветка),
//   1050 Editor (fix, набор), 1380 Editor (fix, подсказка ghost), 1710 Editor (read package.json, без дерева), 2040 Diff (route и fix, подсветка).
// Снимок сцены: npx remotion still video/index.ts term-check out.png --frame=N --browser-executable=…/headless_shell
// Метки ошибки: … --frame=50 --props='{"mistake":true}'. Части кадров рамками: … --props='{"parts":true}' (положение частей из layout — проверить, что они лежат на том, что видно).
export type TermCheckProps = { mistake: boolean; parts: boolean }

const CUES = [{ from: 10, to: 60, text: 'Телефон Анны — зал, его зовут фронтендом: всё, что видно и нажимается.' }]
const VERDICT: { at: number; kind: 'wrong' | 'right' }[] = [
  { at: 20, kind: 'wrong' },
  { at: 45, kind: 'right' },
]

const FIGURE = { w: 1590 } // схема 760 px шириной → 1590: самый мелкий текст (11,5 px) становится 24 px
const CELL = MONO.size * MONO.advance

function Base({ mistake }: Pick<TermCheckProps, 'mistake'>) {
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

const S2 = 's02-sets'
const TREE = { session: S2, commit: 'c-form' }
const BASE_FRAMES = 60
/** Сцена из трёх реплик: 30 + 3 · 90 + 30 кадров. */
const SCENE_LINES = 3
const SCENE_FRAMES = 30 + SCENE_LINES * 90 + 30

const SCENES: { spec: FrameSpec; cue: string }[] = [
  {
    spec: {
      type: 'terminal',
      items: [
        { session: S2, event: 'dev', at: 0 },
        { session: S2, event: 'save-bad', at: 1, lines: [227, 237] },
      ],
    },
    cue: 'Сервер запущен. Нажимаем «Сохранить подход» с пустым весом — в его выводе строка запроса.',
  },
  {
    spec: {
      type: 'terminal',
      items: [
        { session: S2, event: 'start-dev', at: 0 },
        { session: S2, event: 'scripts', at: 1 },
      ],
    },
    cue: 'Такого скрипта нет: команда завершилась с ошибкой, последняя строка красная.',
  },
  {
    spec: { type: 'editor', session: S2, event: 'route', tree: TREE, lines: [1, 17], highlight: [{ at: 1, lines: [13, 15] }] },
    cue: 'Файл маршрута: функция toNumber отличает пустое поле от нуля.',
  },
  {
    spec: { type: 'editor', session: S2, event: 'fix', tree: TREE, lines: [20, 36], typing: { at: 0 } },
    cue: 'В форму добавляются строки с ошибкой — они набираются.',
  },
  {
    spec: { type: 'editor', session: S2, event: 'fix', tree: TREE, lines: [20, 36], ghost: { at: 0, accept: 1 } },
    cue: 'Подсказка серым, принимаем её — строки становятся обычными.',
  },
  {
    spec: { type: 'editor', session: 's01-start', event: 'pkg', lines: [1, 18], highlight: [{ at: 1, lines: [3, 5] }] },
    cue: 'Прочитанный файл без дерева: package.json.',
  },
  {
    spec: {
      type: 'diff',
      items: [
        { session: S2, event: 'route', at: 0, lines: [1, 4] },
        { session: S2, event: 'fix', at: 1, lines: [9, 20] },
      ],
      highlight: [{ at: 2, event: 'fix', lines: [13, 15] }],
    },
    cue: 'Дифф: убранное красным, новое зелёным.',
  },
]

const CTX: FrameCtx = { find, lesson: { id: 'term-check', title: 'Проверка кадров', chapters: ['Терминал', 'Редактор', 'Дифф'], book: [] } }

const clockOf = (lines: number): Clock => ({ beat: (i) => 30 + i * 90, duration: 30 + lines * 90 + 30, lines })

function Scene({ spec, cue, parts }: { spec: FrameSpec; cue: string; parts: boolean }) {
  const clock = clockOf(SCENE_LINES)
  const { Component } = frameDef(spec)
  return (
    <AbsoluteFill style={{ background: T.desk }}>
      <svg viewBox={`0 0 ${CANVAS.w} ${CANVAS.h}`} width={CANVAS.w} height={CANVAS.h} style={{ position: 'absolute', inset: 0 }}>
        <Header lessonId="term-check" chapter={{ n: 2, total: 3, title: 'Кадры записей' }} book="" at={-100} />
        <Component spec={spec} clock={clock} ctx={CTX} />
        {parts &&
          Object.entries(frameDef(spec).layout(spec, CTX)).map(([name, r]) => (
            <g key={name}>
              <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="none" stroke={T.warn} strokeWidth={2} />
              <text x={r.x + r.w + 6} y={r.y + 20} fill={T.warn} style={{ font: `500 24px ${T.mono}` }}>
                {name}
              </text>
            </g>
          ))}
      </svg>
      <TermSubtitles cues={[{ from: 0, to: SCENE_FRAMES, text: cue }]} />
    </AbsoluteFill>
  )
}

/** Длина композиции term-check: основа и сцены кадров. */
export const TERM_CHECK_FRAMES = BASE_FRAMES + SCENES.length * SCENE_FRAMES

export function TermCheck({ mistake, parts }: TermCheckProps) {
  return (
    <>
      <Sequence from={0} durationInFrames={BASE_FRAMES}>
        <Base mistake={mistake} />
      </Sequence>
      {SCENES.map((scene, i) => (
        <Sequence key={i} from={BASE_FRAMES + i * SCENE_FRAMES} durationInFrames={SCENE_FRAMES}>
          <Scene {...scene} parts={parts} />
        </Sequence>
      ))}
    </>
  )
}
