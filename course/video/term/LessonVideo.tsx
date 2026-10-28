import type { JSX } from 'react'
import { useMemo } from 'react'
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion'
import type { VideoHotspot } from '../types'
import type { BuiltScene } from './build'
import { buildLesson, cameraKeys, headerRight, lessonCtx, sceneAt, sceneBook, sceneFade, sceneParts, sceneReserve, sceneVerdict } from './build'
import { cameraAt } from './camera'
import { Header, HeaderBook } from './chrome/Header'
import { TermSubtitles } from './chrome/Subtitles'
import { Verdict } from './chrome/Verdict'
import type { FrameCtx } from './frame'
import { frameDef } from './frames'
import type { Lesson } from './lesson'
import { textWidth } from './text'
import { CANVAS, HEADER, MOTION, T } from './theme'

// Общий ролик урока: один <svg viewBox="0 0 1920 1080"> на фоне desk. Сцены — в <Sequence> по началу, в сцене — группа камеры
// с кадром. Сцена проявляется за 8 кадров со сдвигом 16 px и столько же уходит после своего конца, поверх — следующая.
// Шапка одна на весь ролик: на границе глав номер прокручивается 12 кадров; справа — ссылка на книгу сцены или метки ошибки
// (у сцены mistake), при смене прежняя уходит и приходит новая (headerRight). Субтитры — поверх всего.
// debugSpots — рамки пояснений там, где они будут на экране.

// Камера не заходит на шапку: кадр под ней обрезается
const VIEW_TOP = HEADER.y + HEADER.h + 8
const VIEW_CLIP = 'lesson-view'
/** Подпись отладочной рамки пояснения: кегль и высота плашки. */
const LABEL = { size: 28, h: 40 }

type SceneProps = { b: BuiltScene; ctx: FrameCtx; first: boolean }

function SceneView({ b, ctx, first }: SceneProps) {
  const frame = useCurrentFrame()
  const keys = useMemo(() => cameraKeys(b, sceneParts(b, ctx)), [b, ctx])
  const { opacity, dy } = sceneFade(frame, b.duration, first)
  const cam = cameraAt(frame, keys)
  const { Component } = frameDef(b.scene.frame)
  return (
    <g data-scene={b.id} opacity={opacity} clipPath={`url(#${VIEW_CLIP})`}>
      <g transform={`translate(0 ${dy})`}>
        <g transform={`translate(${CANVAS.w / 2} ${CANVAS.h / 2}) scale(${cam.zoom}) translate(${-cam.x} ${-cam.y})`}>
          <Component spec={b.scene.frame} clock={b.clock} ctx={ctx} />
        </g>
      </g>
    </g>
  )
}

// Шапка ролика: кадр — от начала ролика, вердикты сцены сдвигаются на её начало
function LessonHeader({ lesson, scenes }: { lesson: Lesson; scenes: BuiltScene[] }) {
  const frame = useCurrentFrame()
  const b = sceneAt(scenes, frame)
  const start = scenes.find((s) => s.chapter === b.chapter)!.start
  return (
    <g data-header="1">
      <Header
        lessonId={lesson.id}
        chapter={{ n: b.chapter + 1, total: lesson.chapters.length, title: lesson.chapters[b.chapter].title }}
        book=""
        reserve={sceneReserve(lesson, b)}
        at={start}
      />
      {headerRight(lesson, scenes, frame).map(({ b: s, opacity }) => (
        <g key={s.start} opacity={opacity}>
          {s.scene.role === 'mistake' ? <Verdict mistake verdict={sceneVerdict(s).map((v) => ({ ...v, at: s.start + v.at }))} /> : <HeaderBook text={sceneBook(lesson, s)} />}
        </g>
      ))}
    </g>
  )
}

// Отладка: рамки пояснений, живых на этом кадре, с названием — для снимков кадров (lesson-stills.mjs).
function SpotFrames({ hotspots }: { hotspots: VideoHotspot[] }) {
  const frame = useCurrentFrame()
  return (
    <g data-debug="spots">
      {hotspots
        .filter((h) => frame >= h.from && frame < h.to)
        .map((h) => {
          // Подпись над рамкой (или под ней, если сверху шапка) на плашке, чтобы читалась поверх кадра
          const top = h.y > VIEW_TOP + LABEL.h ? h.y - LABEL.h - 4 : h.y + h.h + 4
          return (
            <g key={`${h.from}-${h.title}`}>
              <rect x={h.x} y={h.y} width={h.w} height={h.h} fill="none" stroke={T.warn} strokeWidth={3} strokeDasharray="12 8" />
              <rect x={h.x} y={top} width={textWidth(h.title, LABEL.size) + 24} height={LABEL.h} rx={4} fill={T.termBg} stroke={T.warn} strokeWidth={2} />
              <text x={h.x + 12} y={top + LABEL.h - 11} fill={T.warn} style={{ fontFamily: T.font, fontSize: LABEL.size, fontWeight: 600 }}>
                {h.title}
              </text>
            </g>
          )
        })}
    </g>
  )
}

export function LessonVideo({ lesson, debugSpots = false }: { lesson: Lesson; debugSpots?: boolean }): JSX.Element {
  const ctx = useMemo(() => lessonCtx(lesson), [lesson])
  const { script, scenes } = useMemo(() => buildLesson(lesson, ctx), [lesson, ctx])
  const last = scenes.length - 1
  return (
    <AbsoluteFill style={{ background: T.desk }}>
      <svg viewBox={`0 0 ${CANVAS.w} ${CANVAS.h}`} width={CANVAS.w} height={CANVAS.h} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <clipPath id={VIEW_CLIP}>
            <rect x={0} y={VIEW_TOP} width={CANVAS.w} height={CANVAS.h - VIEW_TOP} />
          </clipPath>
        </defs>
        {scenes.map((b, i) => (
          <Sequence key={b.start} name={b.id} from={b.start} durationInFrames={b.duration + (i < last ? MOTION.sceneFade : 0)} layout="none">
            <SceneView b={b} ctx={ctx} first={i === 0} />
          </Sequence>
        ))}
        <LessonHeader lesson={lesson} scenes={scenes} />
        {debugSpots && <SpotFrames hotspots={script.hotspots} />}
      </svg>
      <TermSubtitles cues={script.cues} />
    </AbsoluteFill>
  )
}
