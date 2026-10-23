import { interpolate, useCurrentFrame } from 'remotion'
import type { Mood, Pose } from '../../actors/Person'
import { Hacker } from '../../actors/Hacker'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP, trackAt } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Mark, Pill } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { S1 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Baker, Bell, Guest, Padlock, Pie, Shop } from './parts'

const ID = 's1-bakery'
const C = S1.cards

// три вещи хозяйки: до реплики — номер с вопросом, на своей реплике — название
const THINGS = ['замок', 'сигнализация', 'пробная партия']
// что каждая вещь значит для приложения тренера
const MEANING = [
  { title: 'Замок', app: 'защита в коде', ex: ['параметры, проверка', 'владельца, лимит попыток'] },
  { title: 'Сигнализация', app: 'автоматические проверки', ex: ['сканеры и тесты', 'при каждом изменении'] },
  { title: 'Пробная партия', app: 'выпуск по шагам', ex: ['сначала немногим,', 'откат за минуты'] },
]
// реакции гостей на пробный пирог
const GUESTS: [Pose, Mood][] = [
  ['cheer', 'happy'],
  ['stand', 'happy'],
  ['think', 'worried'],
]

// Сцена 1 (метафора): до продажи нового пирога хозяйка ставит надёжный замок, включает сигнализацию
// и даёт пирог на пробу нескольким гостям; для приложения это защита в коде, проверки и выпуск по шагам.
export function S1Bakery() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // реплика 1: пекарня, хозяйка, новый пирог, три вещи
  const shop = appear(frame, b(0))
  const newPie = appear(frame, b(0) + 40)
  const listIn = [0, 1, 2].map((i) => appear(frame, b(0) + 80 + i * 14, 10))
  const named = [b(1), b(2), b(3)].map((at) => frame >= at)

  // реплика 2: дешёвый и надёжный замки, надёжный едет на дверь
  const cheapIn = appear(frame, b(1) + 10)
  const goodIn = appear(frame, b(1) + 24)
  const verdict = appear(frame, b(1) + 50)
  const choose = appear(frame, b(1) + 72)
  const cheapOut = interpolate(frame, [b(1) + 92, b(1) + 108], [1, 0], CLAMP)
  const lockPos = trackAt(frame, [
    [b(1) + 92, S1.good.x, S1.good.y],
    [b(1) + 110, 640, 230],
    [b(1) + 128, S1.doorLock.x, S1.doorLock.y],
  ])
  const lockScale = interpolate(frame, [b(1) + 92, b(1) + 128], [1, 0.62], CLAMP)

  // реплика 3: ночь, гость у окна, колокол звенит сам
  const bell = appear(frame, b(2) + 6)
  const night = interpolate(frame, [b(2) + 20, b(2) + 40, b(3) - 14, b(3)], [0, 0.42, 0.42, 0], CLAMP)
  const thief = trackAt(frame, [
    [b(2) + 40, S1.thief.from, S1.thief.y],
    [b(2) + 84, S1.thief.to, S1.thief.y],
    [b(2) + 112, S1.thief.to, S1.thief.y],
    [b(2) + 146, S1.thief.from + 100, S1.thief.y],
  ])
  const thiefOn = frame >= b(2) + 40 && frame < b(2) + 146
  const ring = frame >= b(2) + 90 && frame < b(3) - 4 ? (frame - b(2) - 90) / 60 : 0
  const alarm = interpolate(frame, [b(2) + 92, b(2) + 100, b(3) - 10, b(3)], [0, 1, 1, 0], CLAMP)

  // реплика 4: поднос с пробной партией, три гостя, реакции и два исхода
  const away = interpolate(frame, [b(2) + 14, b(2) + 28, b(3), b(3) + 12], [1, 0, 0, 1], CLAMP)
  const tray = appear(frame, b(3) + 20)
  const fly = interpolate(frame, [b(3) + 60, b(3) + 82], [0, 1], CLAMP)
  const react = frame >= b(3) + 90
  const okOut = appear(frame, b(3) + 110)
  const noOut = appear(frame, b(3) + 150)
  const pies = frame >= b(3) + 116 ? 6 : 2

  // реплика 5: доска 2 — три карточки
  const cardIn = [0, 1, 2].map((i) => appear(frame, b(4) + 14 + i * 34))

  const baker = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 36, ['point', 'happy']],
    [b(0) + 100, ['stand', 'happy']],
    [b(1) + 10, ['think', 'neutral']],
    [b(1) + 72, ['cheer', 'happy']],
    [b(1) + 130, ['stand', 'happy']],
    [b(3), ['point', 'neutral']],
    [b(3) + 90, ['stand', 'happy']],
    [b(3) + 150, ['think', 'worried']],
  ])
  const thiefPose = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(2) + 84, ['point', 'happy']],
    [b(2) + 96, ['surprised', 'worried']],
  ])

  return (
    <KitScene chip="1 / 7 · Замок, сигнализация, пробная партия" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* тротуар */}
      <rect x={40} y={S1.ground} width={790} height={10} rx={5} fill={theme.desk} />

      <g opacity={shop}>
        <Shop shop={S1.shop} door={S1.door} win={S1.window} pies={pies} />
      </g>

      {/* колокол сигнализации на стене */}
      <g opacity={bell}>
        <line x1={S1.shop.x + S1.shop.w} y1={S1.bell.y - 30} x2={S1.bell.x} y2={S1.bell.y - 30} stroke={theme.ink} strokeWidth={4} />
        <Bell x={S1.bell.x} y={S1.bell.y} ring={ring} />
      </g>

      {/* надёжный замок: сначала рядом с дешёвым, потом на двери */}
      <g opacity={goodIn}>
        <Padlock x={lockPos.x} y={lockPos.y} scale={lockScale} />
      </g>
      <g opacity={cheapIn * cheapOut}>
        <Padlock x={S1.cheap.x} y={S1.cheap.y} cheap />
        <g opacity={verdict}>
          <Mark x={S1.cheap.x + 34} y={S1.cheap.y - 34} ok={false} r={16} />
          <Pill x={S1.cheap.x - 10} y={S1.cheap.y + 64} text="дешевле и чаще" color={theme.risk} fill={theme.paper} compact />
        </g>
        <g opacity={choose}>
          <Mark x={S1.good.x + 40} y={S1.good.y - 40} ok r={16} />
          <Pill x={S1.good.x + 10} y={S1.good.y + 64} text="надёжный" color={theme.ok} fill={theme.okTint} compact />
        </g>
      </g>

      {/* хозяйка и новый пирог */}
      <g opacity={away}>
        <Baker x={S1.baker.x} y={S1.baker.y} scale={0.85} label="Хозяйка" enterAt={b(0) + 10} pose={baker[0]} mood={baker[1]} />
      </g>
      <g opacity={newPie * (1 - appear(frame, b(1), 10))}>
        <Pie x={S1.baker.x + 110} y={S1.baker.y - 70} s={0.9} />
        <Pill x={S1.baker.x + 110} y={S1.baker.y - 130} text="новый пирог" color={theme.alt} fill={theme.paper} compact />
      </g>

      {/* пробная партия: поднос, гости, исходы */}
      <g opacity={tray}>
        <rect x={S1.tray.x - 140} y={S1.tray.y} width={280} height={10} rx={5} fill={theme.line} />
        {[-80, 0, 80].map((dx, i) => {
          const g = S1.guests[i]
          const px = S1.tray.x + dx + (g - S1.tray.x - dx) * fly
          const py = S1.tray.y - 2 + (S1.guestY - 60 - S1.tray.y + 2) * fly
          return <Pie key={dx} x={px} y={py} s={0.55} />
        })}
      </g>
      {S1.guests.map((x, i) => (
        <g key={x}>{frame >= b(3) + 30 + i * 8 && <Guest x={x} y={S1.guestY} scale={0.6} enterAt={b(3) + 30 + i * 8} pose={react ? GUESTS[i][0] : 'stand'} mood={react ? GUESTS[i][1] : 'neutral'} />}</g>
      ))}
      <g opacity={okOut}>
        <Pill x={S1.outcomes.x} y={S1.outcomes.ok} text="понравился → печём всем" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      <g opacity={noOut}>
        <Pill x={S1.outcomes.x} y={S1.outcomes.no} text="нет → убираем с витрины" color={theme.risk} fill={theme.paper} size={20} compact />
      </g>

      {/* ночь: затемнение, луна, ночной гость, тревога */}
      <rect x={-200} y={-200} width={1700} height={1000} fill={theme.ink} opacity={night} />
      <g opacity={night / 0.42}>
        <circle cx={S1.moon.x} cy={S1.moon.y} r={44} fill={theme.paper} opacity={0.25} />
        <circle cx={S1.moon.x} cy={S1.moon.y} r={28} fill={theme.paper} />
      </g>
      {ring > 0 && <Bell x={S1.bell.x} y={S1.bell.y} ring={ring} />}
      {thiefOn && (
        <g transform={`translate(${2 * thief.x} 0) scale(-1 1)`}>
          <Hacker x={thief.x} y={thief.y} scale={0.7} pose={thiefPose[0]} mood={thiefPose[1]} />
        </g>
      )}
      <g opacity={alarm}>
        <Pill x={S1.bell.x + 40} y={S1.bell.y - 80} text="звенит сама" color={theme.risk} fill={theme.paper} size={20} compact />
      </g>

      {/* три вещи хозяйки — поверх ночи */}
      {THINGS.map((t, i) => (
        <g key={t} opacity={listIn[i]}>
          <Pill x={S1.list.x} y={S1.list.y + i * S1.list.dy} w={230} text={named[i] ? `${i + 1} · ${t}` : `${i + 1} · ?`} color={named[i] ? theme.accent : theme.line} fill={named[i] ? theme.accentTint : theme.paper} compact />
        </g>
      ))}

      {/* доска 2: что это значит для приложения */}
      {MEANING.map((m, i) => {
        const x = C.x + i * (C.w + C.gap)
        const cx = x + C.w / 2
        return (
          <g key={m.title} opacity={cardIn[i]} transform={`translate(0 ${(1 - cardIn[i]) * 20})`}>
            <Card x={x} y={C.y} w={C.w} h={C.h} stroke={theme.accent} />
            {i === 0 && <Padlock x={cx} y={C.y + 84} />}
            {i === 1 && <Bell x={cx} y={C.y + 76} />}
            {i === 2 && (
              <g>
                <Pie x={cx - 50} y={C.y + 108} s={0.7} />
                <Pie x={cx + 50} y={C.y + 108} s={0.7} />
                <Pie x={cx} y={C.y + 76} s={0.7} />
              </g>
            )}
            <Label x={cx} y={C.y + 164} size={26} weight={700}>
              {m.title}
            </Label>
            <path d={`M${cx} ${C.y + 184} V${C.y + 214}`} stroke={theme.accent} strokeWidth={3} />
            <path d={`M${cx - 8} ${C.y + 208} L${cx} ${C.y + 220} L${cx + 8} ${C.y + 208}`} fill="none" stroke={theme.accent} strokeWidth={3} />
            <Label x={cx} y={C.y + 254} size={23} weight={700} color={theme.accent}>
              {m.app}
            </Label>
            {m.ex.map((line, j) => (
              <Label key={line} x={cx} y={C.y + 294 + j * 28} size={20} weight={500} color={theme.soft}>
                {line}
              </Label>
            ))}
          </g>
        )
      })}
    </KitScene>
  )
}
