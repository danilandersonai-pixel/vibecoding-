import { useCurrentFrame } from 'remotion'
import { Client } from '../../actors/Client'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { Server } from '../../actors/Server'
import { KitScene } from '../../kit/KitScene'
import { appear, trackAt } from '../../kit/motion'
import { Arrow, Label } from '../../kit/parts'
import { Slot } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { theme } from '../../theme'
import { COACH, HAND, kgText, rowTop, S2, screenOf, SCREEN, setText, SETS, VOLUME } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Avatar, Handset, Panel, ScreenTitle, SetInput, SetPacket, SetRow, Signal, StatusBar } from './parts'

const ID = 's2-build'
const P = S2.phone
const C = S2.coach

/** Кружок с номером шага: «1» — сначала, «2» — потом. */
function StepBadge({ x, y, n, on }: { x: number; y: number; n: number; on: number }) {
  return (
    <g opacity={on}>
      <circle cx={x} cy={y} r={20} fill={theme.alt} stroke={theme.white} strokeWidth={3} />
      <Label x={x} y={y + 8} size={22} weight={800} color={theme.white}>
        {String(n)}
      </Label>
    </g>
  )
}

// Сцена 2 (что строим сегодня): подход сначала сохраняется на телефоне и встаёт в очередь с пометкой
// «не отправлено»; связь вернулась — очередь уходит по порядку, пометка меняется только после ответа
// сервера «принято»; у Марины три подхода, объём 775 кг.
export function S2Build() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()
  const s = screenOf(P)

  // сначала телефон, потом сервер
  // «1» и «2» уходят, когда камера отъезжает
  const badges = 1 - appear(frame, b(3) - 10, 10)
  const one = appear(frame, b(0) + 24, 10) * badges
  const path = appear(frame, b(0) + 50, 20)
  const two = appear(frame, b(0) + 96, 10) * badges

  // три подхода: набор, нажатие «Сохранить», строка
  const typeAt = [b(1) + 14, b(2) + 76, b(2) + 116]
  const tapAt = [b(1) + 54, b(2) + 94, b(2) + 134]
  const saved = tapAt.map((t) => t + 6)
  const shown = saved.filter((t) => frame >= t).length
  const cur = Math.min(shown, 2)
  const value = shown < 3 && frame >= typeAt[cur] ? typed(setText(SETS[cur]), frame, typeAt[cur], 24) : ''
  const toast = appear(frame, saved[0] + 4, 8) * (1 - appear(frame, b(2) - 10, 10))
  const glow = appear(frame, b(2) + 6, 8) * (1 - appear(frame, b(2) + 66, 10))
  // счётчик очереди вспыхивает, пока висит «записан на телефоне»
  const countPulse = Math.max(glow, appear(frame, saved[0] + 50, 8) * (1 - appear(frame, saved[0] + 84, 10)))

  // связь вернулась: подходы уходят по порядку, ответы «принято» возвращаются
  const net = appear(frame, b(3) + 40, 12)
  const sendAt = [b(3) + 70, b(3) + 100, b(3) + 130]
  const replyAt = [b(4) + 10, b(4) + 40, b(4) + 70]
  const FLY = 24
  const acked = replyAt.filter((t) => frame >= t + FLY).length
  const serverPulse = sendAt.some((t) => frame >= t + FLY && frame < t + FLY + 10) ? 1 : 0

  // экран Марины: места — после отъезда камеры, подходы и объём — по реплике
  const coachIn = appear(frame, b(3) + 26, 12)
  const feed = appear(frame, b(5), 12)
  const rowIn = [b(5) + 14, b(5) + 26, b(5) + 38]
  const vol = appear(frame, b(5) + 56, 12)

  const anna = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(1) + 8, ['point', 'neutral']],
    [saved[0] + 10, ['stand', 'happy']],
    [b(2) + 70, ['point', 'neutral']],
    [saved[2] + 10, ['stand', 'happy']],
    [b(3) + 44, ['cheer', 'happy']],
    [b(4), ['stand', 'happy']],
  ])
  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(5) + 60, ['cheer', 'happy']],
    [b(5) + 110, ['stand', 'happy']],
  ])

  const rowX = s.x + s.w - 70
  const rowMid = (i: number) => rowTop(s, i) + 30

  return (
    <KitScene chip="2 / 4 · Что строим" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* телефон Анны: подходы, очередь, ввод */}
      <Client x={S2.anna.x} y={S2.anna.y} scale={0.75} label="Анна" enterAt={4} pose={anna[0]} mood={anna[1]} />
      <Handset x={P.x} y={P.y}>
        <StatusBar s={s} net={net} />
        <ScreenTitle s={s} title="Присед" count={shown - acked} pulse={countPulse} />
        {SETS.map((set, i) =>
          frame < saved[i] ? (
            <Slot key={set.id} x={s.x + 12} y={rowTop(s, i)} w={s.w - 24} h={SCREEN.rowH} text="подход" />
          ) : (
            <SetRow key={set.id} s={s} i={i} text={setText(set)} sent={appear(frame, replyAt[i] + FLY, 8)} flash={frame < saved[i] + 20 ? 1 : 0} glow={i === 0 ? glow : 0} />
          ),
        )}
        <SetInput s={s} value={value} tapAt={tapAt.find((t) => frame >= t && frame < t + 18)} />
        <g opacity={toast}>
          <rect x={s.x + 6} y={s.y + SCREEN.form - 6} width={s.w - 12} height={SCREEN.formH + 12} fill={theme.white} />
          <rect x={s.x + 12} y={s.y + SCREEN.form} width={s.w - 24} height={SCREEN.formH} rx={23} fill={theme.ink} />
          <Label x={s.x + s.w / 2} y={s.y + SCREEN.form + 30} size={20} weight={600} color={theme.white}>
            записан на телефоне
          </Label>
        </g>
      </Handset>
      <StepBadge x={P.x + HAND.w - 6} y={P.y + 6} n={1} on={one} />

      {/* путь к серверу и значок сети */}
      <line x1={P.x + HAND.w + 12} y1={S2.server.y} x2={S2.server.x - 58} y2={S2.server.y} stroke={theme.line} strokeWidth={3} strokeDasharray="8 8" opacity={path} />
      <Signal x={S2.signal.x} y={S2.signal.y} on={net} label={net > 0.5 ? 'есть сеть' : 'нет сети'} />
      {serverPulse > 0 && <circle cx={S2.server.x} cy={S2.server.y - 5} r={62} fill={theme.accentTint} />}
      <Server x={S2.server.x} y={S2.server.y} scale={0.75} enterAt={b(0) + 60} />
      <StepBadge x={S2.server.x + 50} y={S2.server.y - 70} n={2} on={two} />

      {/* подходы уходят по одному, ответы «принято» — обратно */}
      {SETS.map((set, i) => {
        if (frame < sendAt[i] || frame >= sendAt[i] + FLY) return null
        const p = trackAt(frame, [
          [sendAt[i], rowX, rowMid(i)],
          [sendAt[i] + FLY, S2.server.x - 20, S2.server.y - 30],
        ])
        return <SetPacket key={set.id} x={p.x} y={p.y} text={setText(set)} />
      })}
      {replyAt.map((t, i) => {
        if (frame < t || frame >= t + FLY) return null
        const p = trackAt(frame, [
          [t, S2.server.x - 20, S2.server.y + 30],
          [t + FLY, rowX, rowMid(i) + 14],
        ])
        return <SetPacket key={t} x={p.x} y={p.y} text="принято" color={theme.ok} />
      })}

      {/* экран Марины */}
      <g opacity={coachIn}>
        <Panel x={C.x} y={C.y} w={C.w} h={C.h} title="Экран Марины" icon={<Avatar x={C.x + 32} y={C.y + 30} color={theme.accent} letter="М" />}>
          <Label x={C.x + 24} y={C.y + COACH.sub} anchor="start" size={20} weight={600} color={theme.soft}>
            Анна · присед · сегодня
          </Label>
          {SETS.map((set, i) => {
            const y = C.y + COACH.rowTop + i * COACH.rowStep
            const on = appear(frame, rowIn[i], 10)
            return (
              <g key={set.id}>
                <g opacity={1 - on}>
                  <Slot x={C.x + 20} y={y} w={C.w - 40} h={COACH.rowH} text="подход" />
                </g>
                <g opacity={on}>
                  <rect x={C.x + 20} y={y} width={C.w - 40} height={COACH.rowH} rx={8} fill={theme.okTint} stroke={theme.ok} strokeWidth={2} />
                  <Label x={C.x + 40} y={y + 29} anchor="start" size={22} weight={700}>
                    {setText(set)}
                  </Label>
                </g>
              </g>
            )
          })}
          <g opacity={1 - vol}>
            <Slot x={C.x + 20} y={C.y + COACH.volume - 30} w={C.w - 40} h={40} text="объём" />
          </g>
          <g opacity={vol}>
            <Label x={C.x + 24} y={C.y + COACH.volume} anchor="start" size={22} weight={600} color={theme.soft}>
              объём
            </Label>
            <Label x={C.x + C.w - 24} y={C.y + COACH.volume} anchor="end" size={26} weight={800} color={theme.ok}>
              {kgText(VOLUME)}
            </Label>
          </g>
        </Panel>
      </g>
      <Arrow x1={S2.server.x + 62} y1={S2.server.y - 40} x2={C.x - 8} y2={S2.server.y - 40} color={theme.ok} draw={feed} />
      <Coach x={S2.marina.x} y={S2.marina.y} scale={0.6} label="Марина" color={theme.accent} enterAt={b(3) + 34} pose={marina[0]} mood={marina[1]} />
    </KitScene>
  )
}
