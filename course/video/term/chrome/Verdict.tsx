import { useCurrentFrame } from 'remotion'
import { appear } from '../motion'
import { alpha, HEADER, MONO, T } from '../theme'
import { BASELINE, CELL, RIGHT } from './layout'

type Props = {
  /** Сцена с ролью «ошибка»: в шапке метка «Типичная ошибка». */
  mistake: boolean
  /** Вердикты по кадрам: с кадра at показан «Неверно» (wrong) или «Верно» (right); следующий заменяет прошлый. */
  verdict: { at: number; kind: 'wrong' | 'right' }[]
}

const LABEL = { mistake: 'Типичная ошибка', wrong: 'Неверно', right: 'Верно' }
const COLOR = { mistake: T.err, wrong: T.err, right: T.ok }
const PAD = 14
const GAP = 16
const PILL = { y: HEADER.y + 3, h: HEADER.h - 10 }

const pillWidth = (label: string) => [...label].length * CELL + 2 * PAD

// Метка-плашка в шапке: рамка 2 px и текст цвета состояния, фон — он же на 12 %.
function Pill({ label, color, right, opacity = 1, dy = 0 }: { label: string; color: string; right: number; opacity?: number; dy?: number }) {
  const w = pillWidth(label)
  return (
    <g opacity={opacity} transform={`translate(0 ${dy})`}>
      <rect x={right - w + 1} y={PILL.y + 1} width={w - 2} height={PILL.h - 2} rx={6} fill={alpha(color, 0.12)} stroke={color} strokeWidth={2} />
      <text x={right - PAD} y={BASELINE} fill={color} textAnchor="end" style={{ fontFamily: T.mono, fontSize: MONO.size, fontWeight: 500, fontVariantLigatures: 'none' }}>
        {label}
      </text>
    </g>
  )
}

// Метки сцены-ошибки справа в шапке, на месте ссылки на книгу (в такой сцене Header получает book=''):
// «Типичная ошибка» (err) на всю сцену, рядом «Неверно» (err), затем «Верно» (ok). Рисуется <g> поверх общего <svg>.
export function Verdict({ mistake, verdict }: Props) {
  const frame = useCurrentFrame()
  const started = verdict.filter((v) => frame >= v.at)
  const last = started.length > 0 ? started.reduce((a, b) => (b.at >= a.at ? b : a)) : null
  if (!mistake && !last) return null
  // «Типичная ошибка» стоит левее места под самый широкий вердикт, поэтому не прыгает, когда он появляется.
  const slot = verdict.length > 0 ? pillWidth(LABEL.wrong) + GAP : 0
  return (
    <g>
      {mistake && <Pill label={LABEL.mistake} color={COLOR.mistake} right={RIGHT - slot} />}
      {last && <Pill label={LABEL[last.kind]} color={COLOR[last.kind]} right={RIGHT} opacity={appear(frame, last.at)} dy={(1 - appear(frame, last.at)) * 6} />}
    </g>
  )
}
