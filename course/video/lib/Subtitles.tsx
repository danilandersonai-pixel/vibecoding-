import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { theme } from '../theme'
import type { Cue } from '../types'

// Субтитры всегда в кадре: текущая реплика на полупрозрачной плашке внизу.
export function Subtitles({ cues }: { cues: Cue[] }) {
  const frame = useCurrentFrame()
  const cue = cues.find((c) => frame >= c.from && frame < c.to)
  if (!cue) return null
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 36, pointerEvents: 'none' }}>
      <div
        style={{
          maxWidth: 1040,
          padding: '12px 24px',
          borderRadius: 12,
          background: 'rgba(28,30,34,.78)',
          color: '#FFFFFF',
          font: `500 32px/1.35 ${theme.font}`,
          textAlign: 'center',
        }}
      >
        {cue.text}
      </div>
    </AbsoluteFill>
  )
}
