import { useCurrentFrame } from 'remotion'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Callout, Mark, Pill, Slot } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { PLAN, planX, S1, S1_ROW, screenOf, SECTIONS } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Handset, ScreenHead } from './parts'

const ID = 's1-today'
const P = S1.phone
const PL = S1.plan

// Сцена 1 (короткое вступление): Марина и Дима знают меню наизусть, Наташа, новый тренер, видит его
// впервые, и подсказать некому; план дня — первое знакомство, пустые экраны, полировка, доступность.
export function S1Today() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()
  const s = screenOf(P)

  // меню: строки и галочки «знаем, где что»
  const phone = appear(frame, 4, 12)
  const rowAt = SECTIONS.map((_, i) => b(0) + 24 + i * 8)
  const tickAt = SECTIONS.map((_, i) => b(0) + 70 + i * 14)
  const known = appear(frame, b(0) + 110, 10)
  // Наташа: галочки уходят, вместо них вопросы
  const ticksOut = 1 - appear(frame, b(1) + 30, 10)
  const askAt = SECTIONS.map((_, i) => b(1) + 44 + i * 8)
  const where = appear(frame, b(1) + 70, 10)
  const alone = appear(frame, b(1) + 110, 10)
  // план дня: места — когда камера отъехала, карточки — по реплике
  const slots = appear(frame, b(1) + 30, 12)
  const cardAt = PLAN.map((_, i) => b(2) + 12 + i * 24)
  const first = appear(frame, b(2) + 124, 12)

  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 60, ['point', 'happy']],
    [b(0) + 130, ['stand', 'happy']],
  ])
  const dima = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 90, ['cheer', 'happy']],
    [b(1), ['stand', 'happy']],
  ])
  const nat = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(1) + 40, ['think', 'worried']],
    [b(2) + 20, ['stand', 'neutral']],
    [b(2) + 124, ['point', 'happy']],
  ])

  return (
    <KitScene chip="1 / 4 · План дня" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* Марина и Дима знают меню наизусть */}
      <Coach x={S1.marina.x} y={S1.marina.y} scale={0.8} label="Марина" color={theme.accent} enterAt={b(0) + 2} pose={marina[0]} mood={marina[1]} />
      <Coach x={S1.dima.x} y={S1.dima.y} scale={0.8} label="Дима" color={theme.alt} enterAt={b(0) + 12} pose={dima[0]} mood={dima[1]} />
      <g opacity={known}>
        <Callout x={200} y={190} tx={S1.marina.x + 14} ty={S1.marina.y - 62} text="всё знакомо" color={theme.accent} />
      </g>

      {/* меню приложения тренера */}
      <g opacity={phone}>
        <Handset x={P.x} y={P.y} w={P.w} h={P.h}>
          <ScreenHead s={s} title="Меню тренера" />
          {SECTIONS.map((t, i) => {
            const y = s.y + S1_ROW.top + i * S1_ROW.step
            return (
              <g key={t} opacity={appear(frame, rowAt[i], 8)}>
                <rect x={s.x + 12} y={y} width={s.w - 24} height={S1_ROW.h} rx={8} fill={theme.paper} stroke={theme.grid} strokeWidth={2} />
                <Label x={s.x + 26} y={y + 24} anchor="start" size={20} weight={600}>
                  {t}
                </Label>
                <g opacity={appear(frame, tickAt[i], 8) * ticksOut}>
                  <Mark x={s.x + s.w - 32} y={y + S1_ROW.h / 2} ok r={11} />
                </g>
                <g opacity={appear(frame, askAt[i], 8)}>
                  <circle cx={s.x + s.w - 32} cy={y + S1_ROW.h / 2} r={12} fill={theme.altTint} stroke={theme.alt} strokeWidth={2.5} />
                  <Label x={s.x + s.w - 32} y={y + S1_ROW.h / 2 + 7} size={18} weight={800} color={theme.alt}>
                    ?
                  </Label>
                </g>
              </g>
            )
          })}
        </Handset>
      </g>

      {/* Наташа, новый тренер: видит меню впервые, подсказать некому */}
      <Coach x={S1.nat.x} y={S1.nat.y} scale={0.8} label="Наташа" color={theme.ink} enterAt={b(1) + 16} pose={nat[0]} mood={nat[1]} />
      <g opacity={where}>
        <Callout x={1060} y={190} tx={S1.nat.x + 16} ty={S1.nat.y - 62} text="с чего начать?" color={theme.ink} />
      </g>
      <g opacity={alone}>
        <Pill x={S1.nat.x} y={424} w={224} text="подсказать некому" color={theme.soft} size={20} compact />
      </g>

      {/* план дня */}
      {PLAN.map((t, i) => {
        const x = planX(i)
        const on = i === 0 ? first : 0
        return (
          <g key={t}>
            <g opacity={slots * (1 - appear(frame, cardAt[i], 10))}>
              <Slot x={x} y={PL.y} w={PL.w} h={PL.h} text={String(i + 1)} />
            </g>
            <g opacity={appear(frame, cardAt[i], 10)}>
              <Card x={x} y={PL.y} w={PL.w} h={PL.h} stroke={on > 0 ? theme.accent : theme.line} fill={theme.white}>
                <rect x={x + 3} y={PL.y + 3} width={PL.w - 6} height={PL.h - 6} rx={10} fill={theme.accentTint} opacity={on} />
                <circle cx={x + 28} cy={PL.y + PL.h / 2} r={17} fill={theme.accent} />
                <Label x={x + 28} y={PL.y + PL.h / 2 + 7} size={20} weight={800} color={theme.white}>
                  {String(i + 1)}
                </Label>
                <Label x={x + 54} y={PL.y + PL.h / 2 + 7} anchor="start" size={20} weight={700}>
                  {t}
                </Label>
              </Card>
            </g>
          </g>
        )
      })}
    </KitScene>
  )
}
