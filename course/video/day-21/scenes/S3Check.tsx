import { useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { KitScene } from '../../kit/KitScene'
import { appear } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Mark, Pill, Slot } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { AgentChat, type ChatMessage } from '../../kit/screens/AgentChat'
import { Mono } from '../../kit/screens/Window'
import { theme } from '../../theme'
import { AGENT3, AGENT8, BY_HAND, CH7, CH7_H, CH8, CH8_H, CHAT8, DATA, DATA_H, DATA_ROWS, DEL, DOMAIN, FAILS, PHONE3, RELEASE_CHECK, TODO, TODO_H, TODO_ITEMS, UNDER_Y } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { MiniPhone, NumberDot, Padlock, StatusPill } from './parts'

const ID = 's3-check'
const COMMENTS = DATA_ROWS.length - 1
// чек-лист главы 7 — запросом агенту, как советует книга (s45)
const CHAT: ChatMessage[] = [
  { from: 'me', text: 'Пройди чек-лист главы 7 для моего проекта: по каждому пункту — «сделано», «не знаю» или «не сделано».' },
  { from: 'agent', text: 'Сделано — 4, не знаю — 1, не сделано — 1.' },
]

// Сцена 3 (проверьте у себя): агент перечисляет таблицы и хранилища (как аудит дня 6) — каждый пункт ищем
// в политике, забытые комментарии («ноет колено», день 11) дописываем; кнопки удаления аккаунта ещё нет —
// её делает агент, потом удаление тестового аккаунта стирает строки и фото; новый адрес на телефоне (день 7).
// Чек-лист главы 7 — запросом агенту: «сделано», «не знаю», «не сделано»; пару «сделано» — руками, остальное —
// до запуска. Истории провалов главы 8 — тоже чек-лист.
export function S3Check() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // что сделать у себя: строки сразу (крупно), галочки — по репликам
  const todo = appear(frame, b(0) + 4, 12)
  const rowIn = TODO_ITEMS.map((_, i) => b(0) + 12 + i * 8)
  const todoAt = [b(1) + 182, b(3) + 170, b(4) + 120]

  // список агента — когда камера отъехала (b(0) + 70)
  const data = appear(frame, b(0) + 74, 12)
  const dataAt = DATA_ROWS.map((_, i) => b(0) + 96 + i * 14)
  const places = appear(frame, b(0) + 84, 12)
  const foundAt = [b(1) + 14, b(1) + 22, b(1) + 30, b(1) + 38, b(1) + 46]
  const missing = appear(frame, b(1) + 72, 8)
  const knee = appear(frame, b(1) + 116, 10)
  const fixed = appear(frame, b(1) + 178, 8)

  // кнопки удаления ещё нет — агент её делает; потом удаление тестового аккаунта; новый адрес на телефоне
  const del = appear(frame, b(2) + 8, 12)
  const fresh = appear(frame, b(2) + 34, 10)
  const whatAt = [b(2) + 120, b(2) + 150]
  const goneAt = [b(3) + 90, b(3) + 130]
  const phone = appear(frame, b(4) + 8, 12)
  const addr = appear(frame, b(4) + 40, 10)
  const path = appear(frame, b(4) + 104, 10)

  // доска 2: чек-лист главы 7 (справа — запрос агенту), потом истории главы 8 на месте чата
  const rowAt = RELEASE_CHECK.map((_, i) => b(5) + 30 + i * 10)
  const statusAt = RELEASE_CHECK.map((_, i) => b(5) + 96 + i * 14)
  const chatAt = b(5) + 36
  const chatOut = 1 - appear(frame, b(7), 10)
  const handAt = [b(6) + 20, b(6) + 44]
  const closeAt = b(6) + 96
  const legend = appear(frame, b(6) + 24, 10)
  const closed = appear(frame, b(6) + 122, 10)
  const ch8 = appear(frame, b(7) + 10, 12)
  const failAt = FAILS.map((_, i) => b(7) + 20 + i * 8)
  const safeAt = FAILS.map((_, i) => b(7) + 84 + i * 16)
  const ask = appear(frame, b(7) + 60, 10)

  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(0) + 84, 'working'],
    [b(0) + 176, 'done'],
    [b(1) + 140, 'working'],
    [b(1) + 182, 'done'],
    [b(2) + 30, 'working'],
    [b(2) + 150, 'done'],
  ])
  const agent8 = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(5) + 60, 'working'],
    [b(5) + 166, 'done'],
  ])

  return (
    <KitScene chip="3 / 4 · Проверьте у себя" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* ---- доска 1: что сделать у себя ---- */}
      <g opacity={todo}>
        <Card x={TODO.x} y={TODO.y} w={TODO.w} h={TODO_H} stroke={theme.ink} fill={theme.white}>
          <Label x={TODO.x + 24} y={TODO.y + 40} anchor="start" size={24} weight={800}>
            Проверьте у себя
          </Label>
          <line x1={TODO.x + 14} y1={TODO.y + TODO.head - 4} x2={TODO.x + TODO.w - 14} y2={TODO.y + TODO.head - 4} stroke={theme.grid} strokeWidth={2} />
        </Card>
      </g>
      {TODO_ITEMS.map((t, i) => {
        const cy = TODO.y + TODO.head + TODO.row / 2 + i * TODO.row
        const done = i < todoAt.length ? appear(frame, todoAt[i], 8) : 0
        return (
          <g key={t} opacity={appear(frame, rowIn[i], 10)}>
            <NumberDot x={TODO.x + 36} y={cy} n={i + 1} color={done > 0 ? theme.ok : theme.accent} />
            <Label x={TODO.x + 64} y={cy + 7} anchor="start" size={21}>
              {t}
            </Label>
            <g opacity={done}>
              <Mark x={TODO.x + TODO.w - 34} y={cy} ok r={14} />
            </g>
          </g>
        )
      })}

      {/* что хранит приложение (список агента) и есть ли это в политике */}
      <g opacity={data}>
        <Card x={DATA.x} y={DATA.y} w={DATA.w} h={DATA_H} stroke={theme.accent} fill={theme.white}>
          <Label x={DATA.x + 24} y={DATA.y + 40} anchor="start" size={22} weight={800}>
            Что хранит приложение
          </Label>
          <Label x={DATA.x + DATA.w - 24} y={DATA.y + 40} anchor="end" size={18} color={theme.soft}>
            в политике
          </Label>
          <line x1={DATA.x + 14} y1={DATA.y + DATA.head - 4} x2={DATA.x + DATA.w - 14} y2={DATA.y + DATA.head - 4} stroke={theme.grid} strokeWidth={2} />
        </Card>
      </g>
      {DATA_ROWS.map((r, i) => {
        const cy = DATA.y + DATA.head + DATA.row / 2 + i * DATA.row
        const isComments = i === COMMENTS
        return (
          <g key={r} opacity={appear(frame, dataAt[i], 8)}>
            <Label x={DATA.x + 24} y={cy + 7} anchor="start" size={20} weight={isComments ? 700 : 600} color={isComments && missing > 0 && fixed === 0 ? theme.risk : theme.ink}>
              {r}
            </Label>
            {!isComments && (
              <g opacity={appear(frame, foundAt[i], 6)}>
                <Mark x={DATA.x + DATA.w - 60} y={cy} ok r={13} />
              </g>
            )}
          </g>
        )
      })}
      {(() => {
        const cy = DATA.y + DATA.head + DATA.row / 2 + COMMENTS * DATA.row
        return (
          <g>
            <g opacity={missing * (1 - fixed)}>
              <Mark x={DATA.x + DATA.w - 60} y={cy} ok={false} r={13} />
            </g>
            <g opacity={knee}>
              <Pill x={DATA.x + 360} y={cy} text="«ноет колено»" color={theme.risk} fill={theme.riskTint} size={18} compact />
            </g>
            <g opacity={fixed}>
              <Mark x={DATA.x + DATA.w - 60} y={cy} ok r={13} />
              <Label x={DATA.x + DATA.w - 84} y={cy + 6} anchor="end" size={18} weight={700} color={theme.ok}>
                дописали
              </Label>
            </g>
          </g>
        )
      })()}
      <Agent x={AGENT3.x} y={AGENT3.y} scale={0.55} enterAt={b(0) + 78} pose={agent} />

      {/* кнопки удаления ещё нет: агент её делает — уходят строки и фото; потом удаление тестового аккаунта */}
      <g opacity={places * (1 - del)}>
        <Slot x={DEL.x} y={DEL.y} w={DEL.w} h={DEL.h} r={12} text="удаление" />
      </g>
      <g opacity={del}>
        <Card x={DEL.x} y={DEL.y} w={DEL.w} h={DEL.h} stroke={theme.risk} fill={theme.white} />
        <g opacity={1 - fresh}>
          <Slot x={DEL.x + 16} y={DEL.y + 14} w={212} h={40} r={10} text="кнопки нет" />
        </g>
        <g opacity={fresh}>
          <rect x={DEL.x + 16} y={DEL.y + 14} width={212} height={40} rx={10} fill={theme.risk} />
          <Label x={DEL.x + 122} y={DEL.y + 41} size={20} weight={700} color={theme.white}>
            Удалить аккаунт
          </Label>
        </g>
        <line x1={DEL.x + 14} y1={DEL.y + 66} x2={DEL.x + DEL.w - 14} y2={DEL.y + 66} stroke={theme.grid} strokeWidth={2} />
        {['строки в базе', 'фото в хранилище'].map((t, i) => {
          const cy = DEL.y + 92 + i * 34
          const gone = appear(frame, goneAt[i], 10)
          return (
            <g key={t} opacity={appear(frame, whatAt[i], 10)}>
              <Label x={DEL.x + 20} y={cy + 7} anchor="start" size={20} color={gone > 0 ? theme.soft : theme.ink}>
                {t}
              </Label>
              <line x1={DEL.x + 18} y1={cy} x2={DEL.x + 18 + (t.length * 11.2 + 4) * gone} y2={cy} stroke={theme.risk} strokeWidth={3} />
              <g opacity={gone}>
                <Mark x={DEL.x + DEL.w - 26} y={cy} ok r={12} />
              </g>
            </g>
          )
        })}
      </g>

      {/* новый адрес на телефоне: замок, главный путь */}
      <g opacity={places * (1 - phone)}>
        <Slot x={PHONE3.x} y={PHONE3.y} w={PHONE3.w} h={PHONE3.h} r={12} text="телефон" />
      </g>
      <g opacity={phone}>
        <Card x={PHONE3.x} y={PHONE3.y} w={PHONE3.w} h={PHONE3.h} stroke={theme.accent} fill={theme.white} />
        <MiniPhone x={PHONE3.x + 18} y={PHONE3.y + 18} w={60} h={110} />
        <Label x={PHONE3.x + 96} y={PHONE3.y + 38} anchor="start" size={18} color={theme.soft}>
          на телефоне
        </Label>
      </g>
      <g opacity={addr}>
        <Padlock x={PHONE3.x + 106} y={PHONE3.y + 72} />
        <Mono x={PHONE3.x + 122} y={PHONE3.y + 80} fill={theme.ink}>
          {DOMAIN}
        </Mono>
      </g>
      <g opacity={path}>
        <Mark x={PHONE3.x + 108} y={PHONE3.y + 114} ok r={12} />
        <Label x={PHONE3.x + 128} y={PHONE3.y + 120} anchor="start" size={18} weight={700} color={theme.ok}>
          главный путь
        </Label>
      </g>

      {/* ---- доска 2: чек-лист главы 7 перед первым релизом ---- */}
      <Card x={CH7.x} y={CH7.y} w={CH7.w} h={CH7_H} stroke={theme.ok} fill={theme.white}>
        <Label x={CH7.x + 24} y={CH7.y + 42} anchor="start" size={22} weight={800}>
          Чек-лист перед первым релизом
        </Label>
        <Pill x={CH7.x + CH7.w - 74} y={CH7.y + 36} text="глава 7" color={theme.soft} fill={theme.paper} size={18} compact />
        <line x1={CH7.x + 14} y1={CH7.y + CH7.head - 4} x2={CH7.x + CH7.w - 14} y2={CH7.y + CH7.head - 4} stroke={theme.grid} strokeWidth={2} />
      </Card>
      {RELEASE_CHECK.map((r, i) => {
        const cy = CH7.y + CH7.head + CH7.row / 2 + i * CH7.row
        const on = appear(frame, rowAt[i], 8)
        const hand = BY_HAND.indexOf(i)
        const status = r.first !== 'done' && frame >= closeAt + (r.first === 'todo' ? 20 : 0) ? 'fixed' : r.first
        return (
          <g key={r.text}>
            <g opacity={1 - on}>
              <Slot x={CH7.x + 18} y={cy - 19} w={CH7.w - 36} h={38} r={8} color={theme.grid} />
            </g>
            <g opacity={on}>
              <NumberDot x={CH7.x + 36} y={cy} n={i + 1} color={theme.ok} />
              <Label x={CH7.x + 64} y={cy + 7} anchor="start" size={20}>
                {r.text}
              </Label>
            </g>
            <g opacity={appear(frame, statusAt[i], 8)}>
              <StatusPill x={CH7.x + CH7.w - 92} y={cy} status={status} />
            </g>
            {hand >= 0 && (
              <g opacity={appear(frame, handAt[hand], 8)}>
                <Mark x={CH7.x + CH7.w - 186} y={cy} ok r={12} />
              </g>
            )}
          </g>
        )
      })}
      <g opacity={legend}>
        <Pill x={CH7.x + 150} y={UNDER_Y} text="✓ — проверено руками" color={theme.ok} fill={theme.white} size={18} compact />
      </g>
      <g opacity={closed}>
        <Pill x={CH7.x + 460} y={UNDER_Y} text="закрыто — до запуска" color={theme.ok} fill={theme.okTint} size={18} compact />
      </g>

      {/* чек-лист — запросом агенту; потом на этом месте — истории провалов главы 8 */}
      <g opacity={chatOut}>
        {frame >= chatAt && <AgentChat x={CHAT8.x} y={CHAT8.y} w={CHAT8.w} at={chatAt} messages={CHAT} />}
        <Agent x={AGENT8.x} y={AGENT8.y} scale={0.55} enterAt={b(5) + 30} pose={agent8} />
      </g>

      {/* истории провалов главы 8: про каждую — возможно ли у нас? */}
      <g opacity={ch8}>
        <Card x={CH8.x} y={CH8.y} w={CH8.w} h={CH8_H} stroke={theme.risk} fill={theme.white}>
          <Label x={CH8.x + 24} y={CH8.y + 42} anchor="start" size={22} weight={800}>
            Истории провалов · глава 8
          </Label>
          <line x1={CH8.x + 14} y1={CH8.y + CH8.head - 4} x2={CH8.x + CH8.w - 14} y2={CH8.y + CH8.head - 4} stroke={theme.grid} strokeWidth={2} />
        </Card>
      </g>
      {FAILS.map((f, i) => {
        const cy = CH8.y + CH8.head + CH8.row / 2 + i * CH8.row
        return (
          <g key={f.name} opacity={appear(frame, failAt[i], 8)}>
            <Label x={CH8.x + 24} y={cy + 7} anchor="start" size={20} weight={800}>
              {f.name}
            </Label>
            <Label x={CH8.x + CH8.lessonX} y={cy + 6} anchor="start" size={18} color={theme.soft}>
              {f.lesson}
            </Label>
            <g opacity={appear(frame, safeAt[i], 8)}>
              <Mark x={CH8.x + CH8.w - 32} y={cy} ok r={13} />
            </g>
          </g>
        )
      })}
      <g opacity={ask}>
        <Pill x={CH8.x + CH8.w / 2} y={UNDER_Y} text="про каждую: возможно ли это у нас?" color={theme.risk} fill={theme.white} size={18} compact />
      </g>
    </KitScene>
  )
}
