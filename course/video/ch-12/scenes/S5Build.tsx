import { interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { Phone } from '../../actors/Phone'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP, trackAt } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Mark, Pill } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { AgentChat, type ChatMessage } from '../../kit/screens/AgentChat'
import { theme } from '../../theme'
import { PHONE_FONT, PHONE_SCALE, phoneFont, S5, TABLE_COLS, TABLE_HEAD, TABLE_ROW } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'

const ID = 's5-build'
const TB = S5.table

const CHAT: ChatMessage[] = [
  { from: 'me', text: 'Новая сессия. Вот spec.md — собери по нему первую версию.' },
  { from: 'agent', text: 'Читаю spec.md. Свой стек, срезы по сценариям, тесты.' },
]
const ROWS = [
  { what: 'Записать подход', has: 'есть → есть', verdict: 'готово', color: theme.ok },
  { what: 'Подходы тренеру', has: 'нет → есть', verdict: 'наше отличие', color: theme.accent },
  { what: 'Дневник питания', has: 'есть → нет', verdict: 'позже', color: theme.alt },
  { what: 'Рейтинг друзей', has: 'есть → нет', verdict: 'не делаем', color: theme.soft },
]
const PALETTE = [theme.accent, theme.ok, theme.alt, theme.ink]

// Своё приложение на телефоне: сначала каркас, потом в своих цветах.
function OwnScreen({ styled, flash }: { styled: number; flash: number }) {
  const F = PHONE_FONT
  return (
    <g>
      <rect x={-50} y={-84} width={100} height={24} rx={6} fill={styled > 0 ? theme.accent : theme.grid} />
      <g opacity={styled}>
        <text y={-67} textAnchor="middle" fill={theme.white} style={{ font: `600 ${F}px ${theme.font}` }}>
          Подходы
        </text>
      </g>
      {[0, 1, 2].map((i) => (
        <rect key={i} x={-50} y={-48 + i * 32} width={100} height={26} rx={6} fill={theme.paper} stroke={styled > 0 ? theme.accent : theme.grid} strokeWidth={2} />
      ))}
      <g opacity={styled}>
        {['Жим 60 × 8', 'Присед 80 × 5', 'Тяга 90 × 5'].map((t, i) => (
          <text key={t} x={-44} y={-30.5 + i * 32} fill={theme.ink} style={{ font: `500 ${F}px ${theme.font}` }}>
            {t}
          </text>
        ))}
      </g>
      <rect x={-50} y={54} width={100} height={30} rx={10} fill={styled > 0 ? theme.accent : theme.grid} />
      <g opacity={styled}>
        <text y={74} textAnchor="middle" fill={theme.white} style={{ font: `600 ${F}px ${theme.font}` }}>
          Сохранить
        </text>
      </g>
      {flash > 0 && <rect x={-54} y={-92} width={108} height={184} rx={6} fill={theme.white} opacity={flash} />}
    </g>
  )
}

// Экран сценария «записать подход» на двух телефонах (эталон и наше) в масштабе S5.phoneScale.
function SetScreen({ color, weight, pressed, result, extra, wrong }: { color: string; weight: string; pressed: boolean; result: string; extra?: string; wrong?: boolean }) {
  const F = phoneFont(S5.phoneScale)
  return (
    <g>
      <text y={-66} textAnchor="middle" fill={theme.ink} style={{ font: `700 ${F}px ${theme.font}` }}>
        Жим лёжа
      </text>
      <rect x={-48} y={-54} width={96} height={26} rx={5} fill={theme.paper} stroke={theme.grid} strokeWidth={2} />
      <text x={-42} y={-36} fill={weight === '' ? theme.soft : theme.ink} style={{ font: `500 ${F}px ${theme.font}` }}>
        {weight === '' ? 'вес: —' : `вес: ${weight}`}
      </text>
      <rect x={-48} y={-18} width={96} height={30} rx={8} fill={pressed ? theme.ink : color} />
      <text y={2} textAnchor="middle" fill={theme.white} style={{ font: `600 ${F}px ${theme.font}` }}>
        Сохранить
      </text>
      {result !== '' && (
        <g>
          <rect x={-50} y={22} width={100} height={28} rx={6} fill={wrong ? theme.riskTint : result.startsWith('✓') ? theme.okTint : theme.riskTint} stroke={wrong ? theme.risk : result.startsWith('✓') ? theme.ok : theme.risk} strokeWidth={2} />
          <text y={41} textAnchor="middle" fill={theme.ink} style={{ font: `600 ${F}px ${theme.font}` }}>
            {result}
          </text>
        </g>
      )}
      {extra && (
        <text y={74} textAnchor="middle" fill={theme.accent} style={{ font: `600 ${F}px ${theme.font}` }}>
          {extra}
        </text>
      )}
    </g>
  )
}

// Сцена 5: шаг 4 — сборка в новой сессии только по спецификации, своё оформление;
// шаг 5 — сверка: таблица паритета и главные сценарии в двух приложениях рядом.
export function S5Build() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: новая сессия
  const fresh = appear(frame, b(0) + 30)
  const specIn = appear(frame, b(0) + 50)
  const shots = trackAt(frame, [
    [b(1) + 6, 760, S5.bag.y + 54],
    [b(1) + 30, 440, S5.bag.y + 54],
  ])
  const shotsIn = appear(frame, b(1) + 4)
  const shotsNo = appear(frame, b(1) + 32)
  const strike = interpolate(frame, [b(1) + 36, b(1) + 50], [0, 1], CLAMP)
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(0) + 90, 'working'],
    [b(1) + 70, 'done'],
    [b(2), 'idle'],
    [b(2) + 100, 'working'],
    [b(2) + 130, 'done'],
  ])
  const phoneIn = appear(frame, b(1) + 62)
  const styled = appear(frame, b(2) + 115, 8)
  const flash = interpolate(frame, [b(2) + 110, b(2) + 115, b(2) + 124], [0, 0.8, 0], CLAMP)
  const mood = appear(frame, b(2) + 5)
  const design = appear(frame, b(2) + 55)
  const dot = PALETTE.map((_, i) => appear(frame, b(2) + 66 + i * 6, 8))
  const font = appear(frame, b(2) + 92)
  const button = appear(frame, b(2) + 102)

  // доска 2: таблица паритета и два приложения рядом
  const table = appear(frame, b(3) + 20)
  const rowIn = ROWS.map((_, i) => appear(frame, b(3) + 34 + i * 18))
  const pillIn = ROWS.map((_, i) => appear(frame, b(3) + 46 + i * 18))
  const phones = appear(frame, b(4) + 6)
  const second = frame >= b(5)
  const weight = second ? '' : typed('60', frame, b(4) + 20, 15)
  const tapAt = second ? b(5) + 24 : b(4) + 40
  const pressed = frame >= tapAt && frame < tapAt + 8
  const done = frame >= tapAt + 12
  const theirs = !done ? '' : second ? 'Введите вес' : '✓ 60 × 8'
  const ours = !done ? '' : second ? '✓ 0 × 8' : '✓ 60 × 8'
  const seen = !second && frame >= b(4) + 75
  const okVerdict = appear(frame, b(4) + 95) * interpolate(frame, [b(5) - 6, b(5) + 4], [1, 0], CLAMP)
  const badVerdict = appear(frame, b(5) + 60)
  const dima = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(4) + 20, ['point', 'neutral']],
    [b(4) + 95, ['stand', 'happy']],
    [b(5) + 40, ['think', 'worried']],
    [b(5) + 75, ['point', 'neutral']],
  ])

  const colX = [TB.x + 20, TB.x + 20 + TABLE_COLS[0], TB.x + TABLE_COLS[0] + TABLE_COLS[1] + TABLE_COLS[2] / 2]
  const tableH = TABLE_HEAD + ROWS.length * TABLE_ROW
  const [p1, p2] = S5.phones

  return (
    <KitScene chip="5 / 7 · Собрать заново и сверить" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* доска 1: новая сессия, в ней только спецификация */}
      {frame >= b(0) && <AgentChat x={S5.chat.x} y={S5.chat.y} w={S5.chat.w} at={b(0) + 4} messages={CHAT} />}
      <g opacity={fresh}>
        <Pill x={S5.chat.x + S5.chat.w - 94} y={S5.chat.y + 20} text="новая сессия" color={theme.accent} fill={theme.paper} size={18} compact />
      </g>
      <g opacity={specIn}>
        <Label x={S5.bag.x} y={S5.bag.y + 8} anchor="start" size={20} weight={600} color={theme.soft}>
          в сессии:
        </Label>
        <Pill x={S5.bag.x + 200} y={S5.bag.y} text="spec.md" color={theme.ok} fill={theme.okTint} size={20} mono compact />
        <Mark x={S5.bag.x + 280} y={S5.bag.y - 18} ok />
      </g>
      {frame >= b(1) + 4 && (
        <g opacity={shotsIn * (1 - 0.5 * strike)}>
          <Pill x={shots.x} y={shots.y} text="скриншоты эталона" color={theme.risk} fill={theme.paper} size={20} compact />
          <line x1={shots.x - 110} y1={shots.y} x2={shots.x - 110 + 220 * strike} y2={shots.y} stroke={theme.risk} strokeWidth={4} strokeLinecap="round" opacity={strike > 0 ? 1 : 0} />
          <g opacity={shotsNo}>
            <Mark x={shots.x + 118} y={shots.y - 18} ok={false} />
          </g>
        </g>
      )}
      <Agent x={S5.agent.x} y={S5.agent.y} scale={0.62} enterAt={b(0) + 60} pose={agent} />

      {/* характер словами → своя дизайн-система */}
      <g opacity={mood}>
        <Card x={S5.mood.x} y={S5.mood.y} w={S5.mood.w} h={S5.mood.h} stroke={theme.accent} />
        <Label x={S5.mood.x + 20} y={S5.mood.y + 30} anchor="start" size={18} weight={600} color={theme.soft}>
          Характер — словами
        </Label>
        <Label x={S5.mood.x + 20} y={S5.mood.y + 70} anchor="start" size={22} weight={600}>
          {typed('бодрый, для зала,', frame, b(2) + 18, 30)}
        </Label>
        <Label x={S5.mood.x + 20} y={S5.mood.y + 102} anchor="start" size={22} weight={600}>
          {typed('крупные кнопки', frame, b(2) + 38, 30)}
        </Label>
      </g>
      <g opacity={design}>
        <Card x={S5.design.x} y={S5.design.y} w={S5.design.w} h={S5.design.h} stroke={theme.accent} />
        <Label x={S5.design.x + 20} y={S5.design.y + 34} anchor="start" size={20} weight={700}>
          Своя дизайн-система
        </Label>
        {PALETTE.map((c, i) => (
          <circle key={c} cx={S5.design.x + 40 + i * 50} cy={S5.design.y + 80} r={18 * dot[i]} fill={c} />
        ))}
        <g opacity={dot[3]}>
          <Label x={S5.design.x + 236} y={S5.design.y + 87} anchor="start" size={20} weight={500} color={theme.soft}>
            цвета
          </Label>
        </g>
        <g opacity={font}>
          <Label x={S5.design.x + 22} y={S5.design.y + 160} anchor="start" size={44} weight={700}>
            Аа
          </Label>
          <Label x={S5.design.x + 100} y={S5.design.y + 152} anchor="start" size={20} weight={500} color={theme.soft}>
            шрифт
          </Label>
        </g>
        <g opacity={button}>
          <rect x={S5.design.x + 20} y={S5.design.y + 186} width={S5.design.w - 40} height={44} rx={14} fill={theme.accent} />
          <Label x={S5.design.x + S5.design.w / 2} y={S5.design.y + 215} size={20} weight={700} color={theme.paper}>
            Сохранить подход
          </Label>
        </g>
      </g>
      <g opacity={phoneIn}>
        <Phone x={S5.phone.x} y={S5.phone.y} scale={PHONE_SCALE}>
          <OwnScreen styled={styled} flash={flash} />
        </Phone>
        <Pill x={S5.phone.x} y={520} text="своё приложение" color={theme.accent} fill={theme.accentTint} size={20} compact />
      </g>

      {/* доска 2: таблица паритета */}
      <g opacity={table}>
        <Card x={TB.x} y={TB.y} w={TB.w} h={tableH} />
        <rect x={TB.x + 2} y={TB.y + 2} width={TB.w - 4} height={TABLE_HEAD - 2} rx={10} fill={theme.codeBg} />
        {['Возможность', 'У них → у нас', 'Решение'].map((t, i) => (
          <Label key={t} x={colX[i]} y={TB.y + 33} anchor={i === 2 ? 'middle' : 'start'} size={18} weight={700} color={theme.soft}>
            {t}
          </Label>
        ))}
      </g>
      {ROWS.map((r, i) => {
        const cy = TB.y + TABLE_HEAD + i * TABLE_ROW + TABLE_ROW / 2
        return (
          <g key={r.what} opacity={rowIn[i]}>
            {i > 0 && <line x1={TB.x + 12} y1={cy - TABLE_ROW / 2} x2={TB.x + TB.w - 12} y2={cy - TABLE_ROW / 2} stroke={theme.grid} strokeWidth={2} />}
            <Label x={colX[0]} y={cy + 7} anchor="start" size={20} weight={600}>
              {r.what}
            </Label>
            <Label x={colX[1]} y={cy + 7} anchor="start" size={20} weight={500} color={theme.soft}>
              {r.has}
            </Label>
            <g opacity={pillIn[i]}>
              <Pill x={colX[2]} y={cy} text={r.verdict} color={r.color} fill={theme.paper} size={18} compact />
            </g>
          </g>
        )
      })}

      {/* два приложения рядом: один и тот же сценарий */}
      <g opacity={phones}>
        <Pill x={p1} y={128} text="Эталон А" color={theme.alt} fill={theme.altTint} size={20} compact />
        <Pill x={p2} y={128} text="Наше" color={theme.accent} fill={theme.accentTint} size={20} compact />
        <Phone x={p1} y={S5.phoneY} scale={S5.phoneScale}>
          <SetScreen color={theme.alt} weight={weight} pressed={pressed} result={theirs} />
        </Phone>
        <Phone x={p2} y={S5.phoneY} scale={S5.phoneScale}>
          <SetScreen color={theme.accent} weight={weight} pressed={pressed} result={ours} extra={seen ? 'Марина видит' : undefined} wrong={second && done} />
        </Phone>
      </g>
      <g opacity={okVerdict}>
        <Pill x={(p1 + p2) / 2} y={490} text="отличие задумано" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      <g opacity={badVerdict}>
        <Pill x={(p1 + p2) / 2} y={490} text="0 кг — не задумано → задача" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>
      {frame >= b(4) && <Coach x={S5.dima.x} y={S5.dima.y} scale={0.6} color={theme.alt} label="Дима" enterAt={b(4)} pose={dima[0]} mood={dima[1]} />}
    </KitScene>
  )
}
