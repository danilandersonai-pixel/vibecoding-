import { useCurrentFrame } from 'remotion'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear } from '../../kit/motion'
import { Label } from '../../kit/parts'
import { Callout, Pill, Slot } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { S1, S1_ROWS, S1_TITLES } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { AppCard } from './parts'

const ID = 's1-intro'
const C = S1.cards
const SL = S1.slot

// Сцена 1 (короткое вступление): ваше приложение умеет главное — то же, что эталоны А и Б.
// Если всё одинаково, тренеру незачем переходить; сегодня ищем причину выбрать вас — отличие.
export function S1Intro() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // ваше приложение и эталон Б — сразу, эталон А — когда камера отъезжает
  const cardAt = [b(0) + 100, b(0) + 4, b(0) + 4]
  const tickAt = (c: number) => S1_ROWS.map((_, i) => (c === 0 ? b(0) + 118 + i * 8 : c === 1 ? b(0) + 70 + i * 10 : b(0) + 22 + i * 12))

  // всё одинаково → тренеру незачем переходить
  const eqAt = [b(1) + 8, b(1) + 20]
  const ask = useAppear(b(1) + 70)

  // место для отличия: пунктиром → «ваше отличие»
  const slot = appear(frame, b(2) + 4, 12)
  const fill = appear(frame, b(2) + 50, 12)
  const none = useAppear(b(2) + 90)

  const coach = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(1) + 60, ['think', 'worried']],
    [b(2) + 50, ['point', 'neutral']],
  ])

  return (
    <KitScene chip="1 / 4 · Зачем отличие" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* три карточки с одинаковыми умениями */}
      {S1_TITLES.map((t, c) => (
        <g key={t} opacity={appear(frame, cardAt[c], 12)}>
          <AppCard x={C.x[c]} y={C.y} w={C.w} h={C.h} title={t} rows={S1_ROWS} tickAt={tickAt(c)} rowY={S1.rowY} row={S1.row} color={c === 2 ? theme.accent : theme.line} />
        </g>
      ))}
      {eqAt.map((at, i) => (
        <g key={at} opacity={appear(frame, at, 10)}>
          <Label x={C.x[i + 1] - 35} y={C.y + C.h / 2 + 14} size={44} weight={800} color={theme.soft}>
            =
          </Label>
        </g>
      ))}

      {/* тренер: зачем мне переходить? */}
      {frame >= b(0) + 136 && <Coach x={S1.coach.x} y={S1.coach.y} scale={0.6} label="Тренер" color={theme.soft} enterAt={b(0) + 136} pose={coach[0]} mood={coach[1]} />}
      <g opacity={ask}>
        <Callout x={450} y={392} tx={S1.coach.x + 18} ty={S1.coach.y - 40} text="зачем мне переходить?" color={theme.soft} />
      </g>

      {/* место для отличия под вашим приложением */}
      <g opacity={slot * (1 - fill)}>
        <Slot x={SL.x} y={SL.y} w={SL.w} h={SL.h} text="отличие" />
      </g>
      <g opacity={fill}>
        <rect x={SL.x} y={SL.y} width={SL.w} height={SL.h} rx={12} fill={theme.accentTint} stroke={theme.accent} strokeWidth={3} />
        <Label x={SL.x + 24} y={SL.y + 41} anchor="start" size={24} weight={800} color={theme.accent}>
          ваше отличие
        </Label>
        <circle cx={SL.x + SL.w - 40} cy={SL.y + SL.h / 2} r={20} fill={theme.white} stroke={theme.accent} strokeWidth={3} />
        <Label x={SL.x + SL.w - 40} y={SL.y + SL.h / 2 + 9} size={26} weight={800} color={theme.accent}>
          ?
        </Label>
      </g>
      <g opacity={none}>
        <Pill x={SL.x - 130} y={SL.y + SL.h / 2} text="у эталонов нет" color={theme.soft} size={20} compact />
      </g>
    </KitScene>
  )
}
