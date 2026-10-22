import { useCurrentFrame } from 'remotion'
import { Client } from '../../actors/Client'
import { Coach } from '../../actors/Coach'
import type { Pose } from '../../actors/Person'
import { Phone } from '../../actors/Phone'
import { Server } from '../../actors/Server'
import { KitScene } from '../../kit/KitScene'
import { appear } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Browser, Pill, Slot } from '../../kit/props'
import { PHONE_SCALE } from '../../kit/screens/layout'
import { stepAt, typed } from '../../kit/reveal'
import { theme } from '../../theme'
import { S2, S2_BTN, S2_LINK, S2_ROW } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Lens, Lock, PhoneList, PhoneLogin, PhoneMsg } from './parts'

const ID = 's2-invite'
const B = S2.browser
const C = S2.chat
const R = S2.rls
const D = S2.db
const LINK = 'trener.app/join/marina'
const BASE = 'trener.app/join/'

// Сцена 2 (что строим сегодня): кнопка у Марины → ссылка в мессенджере → Анна открывает, входит →
// сервер записывает «Анна — подопечная Марины» → Анна в списке, у Анны программа; правила доступа прежние;
// в конце камера подъезжает к самой ссылке.
export function S2Invite() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // браузер Марины: нажатие, ссылка, новая строка списка
  const tap = b(0) + 36
  const ripple = frame >= tap && frame < tap + 18 ? (frame - tap) / 18 : 0
  const linkAt = b(0) + 56
  const link = appear(frame, linkAt, 8)
  const shown = typed(LINK, frame, linkAt + 4, 30)
  const rowIn = appear(frame, b(3) + 10, 10)

  // мессенджер и телефон Анны
  const later = appear(frame, b(1) - 30, 12) // места справа и внизу — к отъезду камеры
  const toChat = appear(frame, b(1) + 6, 18)
  const chat = appear(frame, b(1) + 14, 10)
  const toPhone = appear(frame, b(1) + 56, 14)
  const screen = stepAt<'invite' | 'login' | 'done' | 'program'>(frame, [
    [0, 'invite'],
    [b(2) + 16, 'login'],
    [b(2) + 92, 'done'],
    [b(3) + 54, 'program'],
  ])

  // сервер и база, правила доступа
  const toServer = appear(frame, b(2) + 62, 14)
  const toDb = appear(frame, b(2) + 100, 14)
  const dbRow = appear(frame, b(2) + 112, 10)
  const rls = appear(frame, b(4) + 8, 12)
  const rlsLine = appear(frame, b(4) + 40, 10)
  const locked = appear(frame, b(4) + 56, 10)

  // в конце — только ссылка: остальное гаснет, камера подъезжает
  const rest = 1 - appear(frame, b(5) - 2, 16)
  const look = appear(frame, b(5) + 30, 10)
  const slide = appear(frame, b(5) + 90, 30)
  const mark = appear(frame, b(5) + 122, 10)

  const marina = stepAt<Pose>(frame, [
    [0, 'stand'],
    [b(0), 'point'],
    [b(1) + 20, 'stand'],
    [b(3) + 8, 'cheer'],
    [b(4), 'stand'],
    [b(5) + 20, 'think'],
  ])
  const anna = stepAt<Pose>(frame, [
    [0, 'stand'],
    [b(2) - 4, 'point'],
    [b(2) + 92, 'stand'],
    [b(3) + 60, 'cheer'],
    [b(4) + 10, 'stand'],
  ])

  return (
    <KitScene chip="2 / 4 · Как работает приглашение" duration={sceneDuration(ID)} {...STAGING[ID]}>
      <Coach x={S2.marina.x} y={S2.marina.y} scale={0.72} label="Марина" pose={marina} mood={frame >= b(5) + 20 ? 'neutral' : 'happy'} />

      {/* браузер Марины: кнопка, ссылка, список подопечных */}
      <Browser x={B.x} y={B.y} w={B.w} h={B.h} at={0} url="trener.app/clients">
        <Label x={20} y={76} anchor="start" size={22} weight={700}>
          Подопечные Марины
        </Label>
        <rect x={S2_BTN.x} y={S2_BTN.y} width={S2_BTN.w} height={S2_BTN.h} rx={10} fill={theme.accent} />
        <Label x={S2_BTN.x + S2_BTN.w / 2} y={S2_BTN.y + 29} size={20} weight={700} color={theme.white}>
          + Пригласить подопечного
        </Label>
        {ripple > 0 && <circle cx={S2_BTN.x + S2_BTN.w / 2} cy={S2_BTN.y + S2_BTN.h / 2} r={14 + ripple * 60} fill="none" stroke={theme.accent} strokeWidth={3} opacity={1 - ripple} />}
        <g opacity={1 - link}>
          <Slot x={S2_LINK.x} y={S2_LINK.y} w={S2_LINK.w} h={S2_LINK.h} text="ссылка" />
        </g>
        <g opacity={link}>
          <rect x={S2_LINK.x} y={S2_LINK.y} width={S2_LINK.w} height={S2_LINK.h} rx={8} fill={theme.accentTint} stroke={look > 0 ? theme.alt : theme.accent} strokeWidth={3 + look * 2} />
          <rect x={S2_LINK.x + 14 + BASE.length * 12 - 3} y={S2_LINK.y + 8} width={6 * 12 + 6} height={28} rx={6} fill={theme.altTint} opacity={mark} />
          <text x={S2_LINK.x + 14} y={S2_LINK.y + 29} style={{ font: `500 20px ${theme.mono}`, whiteSpace: 'pre' }} fill={theme.ink}>
            {shown.slice(0, BASE.length)}
            <tspan fill={look > 0 ? theme.alt : theme.ink} fontWeight={look > 0 ? 700 : 500} textDecoration={look > 0 ? 'underline' : undefined}>
              {shown.slice(BASE.length)}
            </tspan>
          </text>
          <g opacity={look}>
            <Lens x={S2_LINK.x + 334 - slide * 36} y={S2_LINK.y + 20} />
          </g>
        </g>
        <Label x={20} y={228} anchor="start" size={18} color={theme.soft} weight={600}>
          Мои подопечные
        </Label>
        <g opacity={1 - rowIn}>
          <Slot x={S2_ROW.x} y={S2_ROW.y} w={S2_ROW.w} h={S2_ROW.h} r={8} />
        </g>
        <g opacity={rowIn}>
          <rect x={S2_ROW.x} y={S2_ROW.y} width={S2_ROW.w} height={S2_ROW.h} rx={8} fill={theme.okTint} stroke={theme.ok} strokeWidth={2.5} />
          <Label x={S2_ROW.x + 16} y={S2_ROW.y + 25} anchor="start" size={20} weight={700}>
            Анна
          </Label>
          <Pill x={S2_ROW.x + S2_ROW.w - 60} y={S2_ROW.y + S2_ROW.h / 2} text="новая" color={theme.ok} fill={theme.white} size={18} compact />
        </g>
      </Browser>

      <g opacity={rest}>
        {/* мессенджер: ссылка уходит Анне */}
        <Arrow x1={B.x + B.w + 4} y1={B.y + S2_LINK.y + 22} x2={C.x - 6} y2={C.y + 100} color={theme.accent} draw={toChat} />
        <g opacity={later * (1 - chat)}>
          <Slot x={C.x} y={C.y} w={C.w} h={C.h} text="мессенджер" />
        </g>
        <g opacity={chat}>
          <Card x={C.x} y={C.y} w={C.w} h={C.h} stroke={theme.line} fill={theme.paper}>
            <Label x={C.x + 20} y={C.y + 34} anchor="start" size={20} color={theme.soft} weight={600}>
              Мессенджер · Анна
            </Label>
            <rect x={C.x + 16} y={C.y + 50} width={C.w - 32} height={104} rx={14} fill={theme.accentTint} stroke={theme.accent} strokeWidth={2} />
            <Label x={C.x + 32} y={C.y + 86} anchor="start" size={20} weight={500}>
              {typed('Анна, вот ссылка:', frame, b(1) + 22, 30)}
            </Label>
            <text x={C.x + 32} y={C.y + 126} fill={theme.accent} style={{ font: `600 18px ${theme.mono}`, whiteSpace: 'pre' }}>
              {typed(LINK, frame, b(1) + 40, 40)}
            </text>
          </Card>
        </g>
        <Arrow x1={C.x + C.w + 4} y1={C.y + 100} x2={S2.phone.x - 98} y2={C.y + 100} color={theme.accent} draw={toPhone} />

        {/* телефон Анны: приглашение → вход → готово → программа от Марины */}
        <Phone x={S2.phone.x} y={S2.phone.y} scale={PHONE_SCALE} enterAt={b(1) + 60}>
          {screen === 'invite' && frame >= b(1) + 70 && <PhoneMsg lines={['Приглашение', 'от Марины']} button="Принять" tapAt={b(2) + 2} />}
          {screen === 'login' && <PhoneLogin />}
          {screen === 'done' && <PhoneMsg lines={['Готово:', 'тренер Марина']} color={theme.ok} ok />}
          {screen === 'program' && <PhoneList title="Программа" rows={['Пн · присед', 'Ср · жим', 'Пт · тяга']} note="от Марины" />}
        </Phone>
        <Client x={S2.anna.x} y={S2.anna.y} scale={0.66} label="Анна" enterAt={b(1) + 64} pose={anna} mood="happy" />

        {/* сервер записывает связь в базу */}
        <Arrow x1={S2.phone.x - 24} y1={S2.phone.y + 168} x2={S2.server.x + 30} y2={S2.server.y - 50} color={theme.ok} draw={toServer} />
        <Server x={S2.server.x} y={S2.server.y} scale={0.5} enterAt={b(2) + 58} />
        <Arrow x1={S2.server.x - 44} y1={S2.server.y} x2={D.x + D.w + 8} y2={S2.server.y} color={theme.ok} draw={toDb} />
        <g opacity={later}>
          <Card x={D.x} y={D.y} w={D.w} h={D.h} stroke={theme.line} fill={theme.paper}>
            <Label x={D.x + 18} y={D.y + 30} anchor="start" size={18} color={theme.soft} weight={600}>
              База · кто чей подопечный
            </Label>
            <rect x={D.x + 14} y={D.y + 42} width={D.w - 28} height={34} rx={6} fill={theme.paper} stroke={theme.alt} strokeWidth={2.5} opacity={1 - 0.5 * locked} />
            <text x={D.x + 28} y={D.y + 65} fill={theme.ink} opacity={1 - 0.5 * locked} style={{ font: `500 18px ${theme.mono}`, whiteSpace: 'pre' }}>
              Олег → тренер Дима
            </text>
            <g opacity={locked}>
              <Lock x={D.x + D.w - 38} y={D.y + 58} scale={0.5} color={theme.alt} />
            </g>
            <g opacity={1 - dbRow}>
              <Slot x={D.x + 14} y={D.y + 84} w={D.w - 28} h={34} r={6} />
            </g>
            <g opacity={dbRow}>
              <rect x={D.x + 14} y={D.y + 84} width={D.w - 28} height={34} rx={6} fill={theme.accentTint} stroke={theme.accent} strokeWidth={2.5} />
              <text x={D.x + 28} y={D.y + 107} fill={theme.ink} style={{ font: `600 18px ${theme.mono}`, whiteSpace: 'pre' }}>
                Анна → тренер Марина
              </text>
            </g>
          </Card>
        </g>

        {/* правила доступа к строкам — прежние */}
        <g opacity={later * (1 - rls)}>
          <Slot x={R.x} y={R.y} w={R.w} h={R.h} text="правила доступа" />
        </g>
        <g opacity={rls}>
          <Card x={R.x} y={R.y} w={R.w} h={R.h} stroke={theme.ok} fill={theme.paper}>
            <Lock x={R.x + 44} y={R.y + 56} scale={1.1} color={theme.ok} />
            <Label x={R.x + 84} y={R.y + 44} anchor="start" size={20} weight={700}>
              Правила доступа: прежние
            </Label>
            <g opacity={rlsLine}>
              <Label x={R.x + 84} y={R.y + 78} anchor="start" size={20} weight={500}>
                Анна видит только своё
              </Label>
            </g>
          </Card>
        </g>
      </g>
    </KitScene>
  )
}
