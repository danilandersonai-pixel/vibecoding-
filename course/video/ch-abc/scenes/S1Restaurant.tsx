import { interpolate, useCurrentFrame } from 'remotion'
import { Client } from '../../actors/Client'
import { Database } from '../../actors/Database'
import { Packet } from '../../actors/Packet'
import type { Mood, Pose } from '../../actors/Person'
import { Phone } from '../../actors/Phone'
import { Server } from '../../actors/Server'
import { useAppear, useTrack } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { Card, Label } from '../../kit/parts'
import { stepAt, typed } from '../../kit/reveal'
import { theme } from '../../theme'
import { DB_ROWS, PHONE_FONT, PHONE_SCALE, S1, ZONE_BOTTOM, ZONE_TOP, ZONES } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { clamp } from './clamp'
import { Mark, Waiter } from './parts'

const ID = 's1-restaurant'
const F = PHONE_FONT

// Экран телефона Анны: подход (вес и повторы), кнопка «Сохранить подход», после ответа — новая строка.
function SetScreen({ weight, reps, pressed, ripple, saved }: { weight: string; reps: string; pressed: boolean; ripple: number; saved: number }) {
  const field = (y: number, label: string, value: string) => (
    <g>
      <rect x={-48} y={y} width={96} height={24} rx={5} fill={theme.paper} stroke={theme.grid} strokeWidth={2} />
      <text x={-42} y={y + 17} fill={theme.soft} style={{ font: `500 ${F}px ${theme.font}` }}>
        {label}
      </text>
      <text x={42} y={y + 17} textAnchor="end" fill={theme.ink} style={{ font: `600 ${F}px ${theme.font}` }}>
        {value}
      </text>
    </g>
  )
  return (
    <g>
      <text x={0} y={-68} textAnchor="middle" fill={theme.ink} style={{ font: `700 ${F}px ${theme.font}` }}>
        Жим лёжа
      </text>
      {field(-58, 'вес', weight)}
      {field(-28, 'повторы', reps)}
      <rect x={-50} y={6} width={100} height={40} rx={8} fill={pressed ? theme.ink : theme.accent} />
      <text x={0} y={23} textAnchor="middle" fill={theme.paper} style={{ font: `600 ${F}px ${theme.font}` }}>
        Сохранить
      </text>
      <text x={0} y={39} textAnchor="middle" fill={theme.paper} style={{ font: `600 ${F}px ${theme.font}` }}>
        подход
      </text>
      {ripple > 0 && <circle cx={0} cy={26} r={12 + ripple * 34} fill="none" stroke={theme.accent} strokeWidth={3} opacity={1 - ripple} />}
      <g opacity={saved} transform={`translate(0 ${(1 - saved) * 8})`}>
        <rect x={-50} y={56} width={100} height={26} rx={6} fill={theme.okTint} stroke={theme.ok} strokeWidth={2} />
        <text x={0} y={74} textAnchor="middle" fill={theme.ink} style={{ font: `600 ${F}px ${theme.font}` }}>
          ✓ 60 кг × 8
        </text>
      </g>
    </g>
  )
}

// Сцена 1: заказ «Сохранить подход» идёт по ресторану — зал (фронтенд), официант (API),
// кухня (бэкенд на сервере), склад (база данных) — и ответ возвращается тем же путём.
export function S1Restaurant() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()
  const W = S1.waiter

  // телефон: вес и повторы набираются, затем нажатие
  const weight = typed('60 кг', frame, b(0) + 20, 12)
  const reps = typed('8', frame, b(0) + 58, 12)
  const tapAt = b(0) + 105
  const ripple = frame >= tapAt && frame < tapAt + 18 ? (frame - tapAt) / 18 : 0
  const orderAt = tapAt + 12

  // официант: стоит у зала → несёт заказ к кухне → возвращается; потом так же с ответом
  const waiter = useTrack([
    [b(3) + 100, W.x, W.y],
    [b(3) + 150, W.far, W.y],
    [b(4) + 30, W.far, W.y],
    [b(4) + 80, W.x, W.y],
    [b(7), W.x, W.y],
    [b(7) + 25, W.far, W.y],
    [b(7) + 50, W.far, W.y],
    [b(7) + 80, W.x, W.y],
  ])
  const walking = (frame > b(3) + 100 && frame < b(3) + 150) || (frame > b(4) + 30 && frame < b(4) + 80) || (frame > b(7) && frame < b(7) + 25) || (frame > b(7) + 50 && frame < b(7) + 80)
  const bob = walking ? -Math.abs(Math.sin(frame / 3)) * 5 : 0
  const carrying = (frame >= b(3) + 40 && frame < b(4) + 5) || (frame >= b(7) + 50 && frame < b(7) + 85)

  // заказ: из кнопки → ждёт у края зала → на поднос → с официантом к кухне → на кухню
  const order = useTrack([
    [orderAt, S1.phone.x, S1.phone.y + 42],
    [orderAt + 25, S1.wait.x, S1.wait.y],
    [b(3) + 15, S1.wait.x, S1.wait.y],
    [b(3) + 40, W.x, S1.lane],
    [b(3) + 100, W.x, S1.lane],
    [b(3) + 150, W.far, S1.lane],
    [b(4) + 5, W.far, S1.lane],
    [b(4) + 30, S1.server.x, S1.server.y - 20],
  ])
  const orderOn = frame >= orderAt && frame < b(4) + 30
  const orderFade = interpolate(frame, [b(4) + 22, b(4) + 30], [1, 0], clamp)
  // с кухни на склад
  const toDb = useTrack([
    [b(6) + 10, S1.server.x, S1.lane],
    [b(6) + 40, S1.db.x, S1.lane],
  ])
  const toDbOn = frame >= b(6) + 10 && frame < b(6) + 42
  // ответ: склад → кухня → поднос → зал → телефон
  const reply = useTrack([
    [b(7) + 5, S1.db.x, S1.lane],
    [b(7) + 30, S1.server.x, S1.lane],
    [b(7) + 50, W.far, S1.lane],
    [b(7) + 80, W.x, S1.lane],
    [b(7) + 85, W.x, S1.lane],
    [b(7) + 105, S1.phone.x, S1.phone.y + 100],
  ])
  const replyOn = frame >= b(7) + 5 && frame < b(7) + 105
  const replyFade = interpolate(frame, [b(7) + 97, b(7) + 105], [1, 0], clamp)
  const saved = useAppear(b(7) + 105)

  // части ресторана появляются по одной; подсвечена та, о которой реплика
  const lit = [frame >= b(2) && frame < b(3), frame >= b(3) && frame < b(4), frame >= b(4) && frame < b(6), frame >= b(6) && frame < b(7)]
  const techAt = [b(2) + 60, b(3) + 55, b(4) + 15, b(6) + 15]
  // итог: сначала только зал, затем весь ресторан
  const onlyHall = frame >= b(9) && frame < b(9) + 80
  const allTicked = frame >= b(9) + 80
  // меню, проверки и подпись склада уходят до наезда на телефон: внизу кадра там субтитры
  const details = interpolate(frame, [b(7) + 30, b(7) + 42], [1, 0], clamp)
  const prompt = useAppear(b(8) + 10)
  const boxes = useAppear(b(8) + 70)

  const question = useAppear(b(1)) * interpolate(frame, [b(3), b(3) + 10], [1, 0], clamp)
  const menu = useAppear(b(3) + 75)
  const always = useAppear(b(4) + 90)
  const checks = [b(5) + 20, b(5) + 60, b(5) + 105]
  const rowSaved = frame >= b(6) + 42
  const forCoach = useAppear(b(6) + 90)

  // Анна радуется подходу → нажимает → «куда уходит?» → радуется новой строке
  const anna = stepAt<[Pose, Mood]>(frame, [
    [0, ['cheer', 'happy']],
    [b(0) + 50, ['stand', 'neutral']],
    [b(0) + 92, ['point', 'neutral']],
    [b(1), ['think', 'neutral']],
    [b(2), ['stand', 'neutral']],
    [b(7) + 105, ['cheer', 'happy']],
    [b(8), ['stand', 'happy']],
  ])
  const waiterPose: Pose = carrying ? 'cheer' : frame >= b(4) + 5 && frame < b(4) + 30 ? 'point' : 'stand'

  const rows = [...DB_ROWS, rowSaved ? { text: 'Анна · 60 × 8', color: theme.accent } : { text: '', color: theme.grid, dim: true }]

  return (
    <KitScene chip="1 / 6 · Приложение — это ресторан" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {ZONES.map((z, i) => {
        const shown = interpolate(frame, [b(1) + 30 + i * 8, b(1) + 42 + i * 8], [0, 1], clamp)
        const on = lit[i] || (onlyHall && i === 0) || allTicked
        const dim = onlyHall && i > 0 ? 0.35 : 1
        const ticked = (onlyHall && i === 0) || allTicked
        return (
          <g key={z.id} opacity={shown * dim}>
            <rect x={z.x} y={ZONE_TOP} width={z.w} height={ZONE_BOTTOM - ZONE_TOP} rx={22} fill={on ? theme.accentTint : theme.zone} stroke={on ? theme.accent : 'none'} strokeWidth={3} />
            <Label x={z.x + z.w / 2} y={116} size={28} weight={700}>
              {z.word}
            </Label>
            <g opacity={interpolate(frame, [techAt[i], techAt[i] + 12], [0, 1], clamp)}>
              <Label x={z.x + z.w / 2} y={150} size={24} color={theme.accent} weight={700}>
                {z.tech}
              </Label>
            </g>
            <g opacity={boxes}>{ticked ? <Mark x={z.x + z.w - 30} y={106} ok /> : <circle cx={z.x + z.w - 30} cy={106} r={14} fill={theme.paper} stroke={theme.line} strokeWidth={3} />}</g>
          </g>
        )
      })}

      {/* зал: Анна и телефон */}
      <Client x={S1.anna.x} y={S1.anna.y} scale={0.6} color={theme.accent} label="Анна" enterAt={b(0) - 6} pose={anna[0]} mood={anna[1]} />
      <Phone x={S1.phone.x} y={S1.phone.y} scale={PHONE_SCALE}>
        <SetScreen weight={weight} reps={reps} pressed={frame >= tapAt && frame < tapAt + 10} ripple={ripple} saved={saved} />
      </Phone>
      <g opacity={question}>
        <text x={S1.wait.x + 100} y={S1.wait.y + 16} textAnchor="middle" fill={theme.risk} style={{ font: `700 48px ${theme.font}` }}>
          ?
        </text>
      </g>

      {/* официант и меню */}
      {frame >= b(3) && <Waiter x={waiter.x} y={waiter.y + bob} scale={0.85} enterAt={b(3)} pose={waiterPose} mood={carrying ? 'happy' : 'neutral'} />}
      <g opacity={menu * details}>
        <Card x={ZONES[1].x + 16} y={430} w={ZONES[1].w - 32} h={100}>
          <Label x={ZONES[1].x + 32} y={458} anchor="start" size={18} color={theme.soft} weight={600}>
            меню
          </Label>
          <Label x={ZONES[1].x + 32} y={486} anchor="start" size={20} weight={500}>
            · сохранить подход
          </Label>
          <Label x={ZONES[1].x + 32} y={514} anchor="start" size={20} weight={500}>
            · дать подходы
          </Label>
        </Card>
      </g>

      {/* кухня: сервер и проверки */}
      <Server x={S1.server.x} y={S1.server.y} enterAt={b(1) + 60} />
      <g opacity={always}>
        <circle cx={S1.server.x - 74} cy={186} r={6} fill={theme.ok} />
        <Label x={S1.server.x - 60} y={193} anchor="start" size={18} color={theme.ok} weight={600}>
          не выключается
        </Label>
      </g>
      <g opacity={useAppear(b(5)) * details}>
        <Card x={ZONES[2].x + 16} y={442} w={ZONES[2].w - 32} h={92}>
          {['✓ это Анна', '✓ вес — число', '= объём 480 кг'].map((t, i) => (
            <g key={t} opacity={interpolate(frame, [checks[i], checks[i] + 10], [0, 1], clamp)}>
              <Label x={ZONES[2].x + 34} y={468 + i * 25} anchor="start" size={20} color={i < 2 ? theme.ok : theme.ink} weight={600}>
                {t}
              </Label>
            </g>
          ))}
        </Card>
      </g>

      {/* склад: база данных */}
      <g opacity={useAppear(b(1) + 68)}>
        <Database x={S1.db.x} y={S1.db.y} rows={rows} />
      </g>
      <g opacity={forCoach * details}>
        <Label x={ZONES[3].x + ZONES[3].w / 2} y={476} size={20} color={theme.accent} weight={600}>
          отсюда данные
        </Label>
        <Label x={ZONES[3].x + ZONES[3].w / 2} y={502} size={20} color={theme.accent} weight={600}>
          для графика Марины
        </Label>
      </g>

      {/* заказ и ответ в пути */}
      {orderOn && (
        <g opacity={orderFade}>
          <Packet x={order.x} y={order.y + (carrying ? bob : 0)} text="60 кг × 8" enterAt={orderAt} />
        </g>
      )}
      {toDbOn && (
        <g opacity={interpolate(frame, [b(6) + 34, b(6) + 42], [1, 0], clamp)}>
          <Packet x={toDb.x} y={toDb.y} text="60 кг × 8" />
        </g>
      )}
      {replyOn && (
        <g opacity={replyFade}>
          <Packet x={reply.x} y={reply.y + (carrying ? bob : 0)} text="✓ сохранено" color={theme.ok} />
        </g>
      )}

      {/* итог: какие части просить у ИИ */}
      <g opacity={prompt}>
        <Card x={380} y={452} w={520} h={74} stroke={theme.accent} fill={theme.paper}>
          <Label x={640} y={498} size={24} color={theme.ink} weight={600}>
            {frame < b(9) ? '«Сделай приложение для тренера»' : onlyHall ? 'красивая страница → только зал' : 'вход и данные → весь ресторан'}
          </Label>
        </Card>
      </g>
    </KitScene>
  )
}
