import { useCurrentFrame } from 'remotion'
import { Client } from '../../actors/Client'
import { Coach } from '../../actors/Coach'
import type { Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Mark, Pill, Slot } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { theme } from '../../theme'
import { S1 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Door, Lock } from './parts'

const ID = 's1-today'
const M = S1.manual
const L = S1.link
const P = S1.plan

// поле формы: подпись слева, рамка и набираемый текст
function Field({ x, y, label, text }: { x: number; y: number; label: string; text: string }) {
  return (
    <g>
      <Label x={x} y={y + 25} anchor="start" size={20} color={theme.soft}>
        {label}
      </Label>
      <rect x={x + 86} y={y} width={250} height={36} rx={7} fill={theme.white} stroke={theme.line} strokeWidth={2.5} />
      <Label x={x + 100} y={y + 25} anchor="start" size={20} weight={500}>
        {text}
      </Label>
    </g>
  )
}

// Сцена 1 (что строим сегодня): сейчас Марина добавляет подопечных вручную; сегодня — ссылка и зачем она
// (тренеру без ручного ввода, подопечному меньше шагов); ссылка — новая дверь, после неё — проверка безопасности.
export function S1Today() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // вручную: карточка, имя и почта набираются, ожидание
  const manual = appear(frame, 4, 12)
  const wait = appear(frame, b(0) + 120, 12)
  const manualDim = 1 - 0.5 * appear(frame, b(1) + 80, 12)

  // по ссылке — зачем: тренеру без ручного ввода, подопечному меньше шагов (сам путь — в сцене 2)
  const slotB = appear(frame, b(1) - 4, 10) // место — уже на общем плане
  const linkHead = appear(frame, b(1) + 8, 10)
  const link = appear(frame, b(1) + 30, 10)
  const forCoach = appear(frame, b(1) + 76, 10)
  const forClient = appear(frame, b(1) + 132, 10)
  const arrow = appear(frame, b(1) + 112, 18)

  // план дня: места пунктиром, затем две карточки
  const planSlots = appear(frame, b(1) + 150, 12)
  const plan1 = appear(frame, b(2) + 8, 12)
  const plan2 = appear(frame, b(2) + 70, 12)
  const after = appear(frame, b(2) + 110, 14)

  const marina = stepAt<Pose>(frame, [
    [0, 'stand'],
    [b(0) + 100, 'think'],
    [b(1), 'point'],
    [b(1) + 76, 'cheer'],
    [b(1) + 140, 'stand'],
    [b(2), 'point'],
    [b(2) + 140, 'stand'],
  ])
  const anna = stepAt<Pose>(frame, [
    [0, 'stand'],
    [b(1) + 134, 'cheer'],
    [b(2) + 20, 'stand'],
  ])

  return (
    <KitScene chip="1 / 4 · Что строим сегодня" duration={sceneDuration(ID)} {...STAGING[ID]}>
      <Coach x={S1.marina.x} y={S1.marina.y} scale={0.9} label="Марина" pose={marina} mood={frame < b(1) ? 'neutral' : 'happy'} />

      {/* сейчас: вручную, по почте */}
      <g opacity={manual * manualDim}>
        <Card x={M.x} y={M.y} w={M.w} h={M.h} stroke={theme.line} fill={theme.paper}>
          <Label x={M.x + 24} y={M.y + 40} anchor="start" size={22} weight={700} color={theme.soft}>
            Сейчас: вручную
          </Label>
          <Field x={M.x + 24} y={M.y + 62} label="Имя" text={typed('Анна', frame, b(0) + 30, 12)} />
          <Field x={M.x + 24} y={M.y + 112} label="Почта" text={typed('anna@mail.ru', frame, b(0) + 56, 24)} />
          <g opacity={wait}>
            <Pill x={M.x + M.w / 2} y={M.y + 190} text="ждём, пока Анна войдёт…" color={theme.soft} size={20} compact />
          </g>
        </Card>
      </g>

      {/* сегодня: по ссылке */}
      <g opacity={slotB * (1 - linkHead)}>
        <Slot x={L.x} y={L.y} w={L.w} h={L.h} text="сегодня" />
      </g>
      <g opacity={linkHead}>
        <Card x={L.x} y={L.y} w={L.w} h={L.h} stroke={theme.accent} fill={theme.paper}>
          <Label x={L.x + 24} y={L.y + 40} anchor="start" size={22} weight={700} color={theme.accent}>
            Сегодня: по ссылке
          </Label>
          <g opacity={link}>
            <Pill x={L.x + L.w / 2} y={L.y + 86} text="trener.app/join/…" color={theme.accent} fill={theme.accentTint} size={20} mono />
          </g>
          <g opacity={forCoach}>
            <Mark x={L.x + 40} y={L.y + 144} ok r={12} />
            <Label x={L.x + 62} y={L.y + 151} anchor="start" size={20} weight={600}>
              Марине — без ручного ввода
            </Label>
          </g>
          <g opacity={forClient}>
            <Mark x={L.x + 40} y={L.y + 190} ok r={12} />
            <Label x={L.x + 62} y={L.y + 197} anchor="start" size={20} weight={600}>
              Анне — меньше шагов
            </Label>
          </g>
        </Card>
      </g>
      <Arrow x1={L.x + L.w + 6} y1={L.y + 86} x2={S1.anna.x - 66} y2={S1.anna.y - 40} color={theme.accent} draw={arrow} />
      <Client x={S1.anna.x} y={S1.anna.y} scale={0.9} label="Анна" enterAt={b(1) + 100} pose={anna} mood="happy" />

      {/* план дня: приглашение — новая дверь; после неё — проверка безопасности */}
      {P.x.map((x, i) => (
        <g key={x} opacity={planSlots * (1 - (i === 0 ? plan1 : plan2))}>
          <Slot x={x} y={P.y} w={P.w} h={P.h} />
        </g>
      ))}
      <g opacity={plan1}>
        <Card x={P.x[0]} y={P.y} w={P.w} h={P.h} stroke={theme.accent} fill={theme.paper}>
          <Door x={P.x[0] + 50} y={P.y + 50} scale={0.56} color={theme.accent} />
          <Label x={P.x[0] + 96} y={P.y + 44} anchor="start" size={22} weight={700}>
            Приглашение по ссылке
          </Label>
          <Label x={P.x[0] + 96} y={P.y + 76} anchor="start" size={20} color={theme.soft}>
            новая дверь в приложение
          </Label>
        </Card>
      </g>
      <Arrow x1={P.x[0] + P.w + 4} y1={P.y + P.h / 2} x2={P.x[1] - 6} y2={P.y + P.h / 2} color={theme.ok} draw={after} />
      <g opacity={plan2}>
        <Card x={P.x[1]} y={P.y} w={P.w} h={P.h} stroke={theme.ok} fill={theme.paper}>
          <Lock x={P.x[1] + 50} y={P.y + 52} scale={1.1} color={theme.ok} />
          <Label x={P.x[1] + 96} y={P.y + 44} anchor="start" size={22} weight={700}>
            Проверка безопасности
          </Label>
          <Label x={P.x[1] + 96} y={P.y + 76} anchor="start" size={20} color={theme.soft}>
            заново, после новой двери
          </Label>
        </Card>
      </g>
    </KitScene>
  )
}
