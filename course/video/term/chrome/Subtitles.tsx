import { useContext } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import type { Cue } from '../../types'
import { SubtitlesShown } from '../../lib/subtitlesShown'
import { balanceText } from '../text'
import { alpha, CANVAS, SUBS, T } from '../theme'

// Субтитры кадра «Репозиторий»: реплика текущего кадра на плашке term-bg (88 %) в полосе y 896–1040,
// Golos Text 500 40 px / 1.4, не больше двух строк по 1500 px, выровненных по длине. Выключает их только плеер сайта — на обложке ролика.
export function TermSubtitles({ cues }: { cues: Cue[] }) {
  const frame = useCurrentFrame()
  const shown = useContext(SubtitlesShown)
  const cue = cues.find((c) => frame >= c.from && frame < c.to)
  if (!shown || !cue) return null
  // Строки считаются заранее, а не браузером: так перенос в кадре тот же, что проверяет урок (lessonProblems).
  const lines = balanceText(cue.text, SUBS.size, SUBS.maxWidth)
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: CANVAS.h - SUBS.bottom, pointerEvents: 'none' }}>
      <div
        style={{
          padding: '16px 24px',
          borderRadius: 6,
          background: alpha(T.termBg, 0.88),
          color: T.ink,
          fontFamily: T.font,
          fontSize: SUBS.size,
          fontWeight: 500,
          lineHeight: SUBS.lineHeight,
          textAlign: 'center',
        }}
      >
        {lines.map((line, i) => (
          <div key={i} data-line={i} style={{ whiteSpace: 'nowrap' }}>
            {line}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  )
}
