import { interpolate, useCurrentFrame } from 'remotion'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP, trackAt } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Mark, Pill } from '../../kit/props'
import { theme } from '../../theme'
import { BOARD2, BOARD3, S2 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { MiniPhone } from './parts'

const ID = 's2-line'
const F = S2.free
const T = S2.taken
const X2 = BOARD2
const X3 = BOARD3

const FREE = ['идея: дневник тренировок', 'сценарий: записать подход', 'правило: тренер видит своих']
const TAKEN = ['их код', 'их тексты', 'их картинки и иконки', 'их оформление']
// деления шкалы: название в две строки, пояснение, вердикт
const NOTCHES = [
  { name: ['Вдохновение', ''], note: ['идея, общий подход', ''], verdict: 'безопасно', color: theme.ok },
  { name: ['Функциональный', 'аналог'], note: ['умеет то же,', 'код и облик свои'], verdict: 'наша цель', color: theme.accent },
  { name: ['Визуальный', 'двойник'], note: ['тот же вид', 'до пикселя'], verdict: 'рискованно', color: theme.alt },
  { name: ['Копия', ''], note: ['чужой код, тексты,', 'логотип, название'], verdict: 'нельзя', color: theme.risk },
]
const FRAMES = [
  { title: 'Условия сервиса', lines: ['могут запрещать разбор,', 'автосбор данных', 'и копирование контента'] },
  { title: 'Товарный знак', lines: ['имя, логотип, цвета', 'и узнаваемый вид:', 'путать людей нельзя'] },
  { title: 'Лицензия кода', lines: ['копилефт, например GPL:', 'взяли такой код —', 'откройте и свой'] },
]

// Сцена 2: где граница. Идеи и поведение свободны, исполнение защищено; шкала близости к эталону;
// ещё три рамки — условия сервиса, товарный знак, лицензия открытого кода.
export function S2Line() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: можно и нельзя
  const freeIn = appear(frame, b(0) + 10)
  const takenIn = appear(frame, b(0) + 70)
  const freeRow = [b(0) + 30, b(0) + 45, b(0) + 60].map((at) => appear(frame, at))
  const takenRow = [90, 102, 114, 126].map((d) => appear(frame, b(0) + d))
  const border = interpolate(frame, [b(0) + 135, b(0) + 160], [0, 1], CLAMP)
  const nobody = appear(frame, b(1) + 20)
  const guarded = appear(frame, b(1) + 65)
  const law = appear(frame, b(1) + 100)

  // доска 2: шкала
  const head = appear(frame, b(2) + 20)
  const bar = interpolate(frame, [b(2) + 30, b(2) + 60], [0, 1], CLAMP)
  const notchIn = [b(2) + 60, b(3) + 5, b(4) + 5, b(4) + 80].map((at) => appear(frame, at))
  const ours = trackAt(frame, [
    [b(3) + 10, S2.notches[0], 0],
    [b(3) + 40, S2.notches[1], 0],
  ])
  const oursIn = appear(frame, b(2) + 75)
  const goal = appear(frame, b(3) + 42)
  const twin = trackAt(frame, [
    [b(4) + 10, S2.notches[1], 0],
    [b(4) + 40, S2.notches[2], 0],
    [b(4) + 80, S2.notches[2], 0],
    [b(4) + 110, S2.notches[3], 0],
  ])
  const twinIn = appear(frame, b(4) + 8) * interpolate(frame, [b(5) - 20, b(5) - 8], [1, 0], CLAMP)
  const twinColor = frame >= b(4) + 100 ? theme.risk : theme.alt
  const twinNo = appear(frame, b(4) + 112)
  const brackets = [appear(frame, b(4) + 125), appear(frame, b(4) + 140)]

  // доска 3: три рамки
  const head3 = appear(frame, b(5) + 25)
  const frameIn = [35, 60, 85].map((d) => appear(frame, b(5) + d))
  const lit = [frame >= b(6) + 5, false, frame >= b(6) + 70]
  const open = appear(frame, b(6) + 95)
  const note = appear(frame, b(6) + 125)

  const by = S2.bar.y
  const segs = [theme.ok, theme.ok, theme.alt, theme.risk]
  const segW = (S2.bar.x1 - S2.bar.x0) / 4

  return (
    <KitScene chip="2 / 7 · Где проходит граница" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* доска 1: можно и нельзя */}
      <g opacity={freeIn}>
        <Card x={F.x} y={F.y} w={F.w} h={F.h} stroke={theme.ok} fill={theme.okTint} />
        <Label x={F.x + 30} y={F.y + 50} anchor="start" size={26} weight={700} color={theme.ok}>
          Можно: идеи и поведение
        </Label>
      </g>
      {FREE.map((t, i) => (
        <g key={t} opacity={freeRow[i]} transform={`translate(${(1 - freeRow[i]) * -16} 0)`}>
          <Mark x={F.x + 44} y={S2.rowY[i]} ok />
          <Label x={F.x + 72} y={S2.rowY[i] + 8} anchor="start" size={22} weight={500}>
            {t}
          </Label>
        </g>
      ))}
      <g opacity={nobody}>
        <Pill x={F.x + 470} y={S2.rowY[0]} text="ничья" color={theme.ok} fill={theme.paper} size={18} compact />
      </g>
      <g opacity={takenIn}>
        <Card x={T.x} y={T.y} w={T.w} h={T.h} stroke={theme.risk} fill={theme.riskTint} />
        <Label x={T.x + 30} y={T.y + 50} anchor="start" size={26} weight={700} color={theme.risk}>
          Нельзя: чужое исполнение
        </Label>
      </g>
      {TAKEN.map((t, i) => (
        <g key={t} opacity={takenRow[i]} transform={`translate(${(1 - takenRow[i]) * 16} 0)`}>
          <Mark x={T.x + 44} y={S2.rowY[i]} ok={false} />
          <Label x={T.x + 72} y={S2.rowY[i] + 8} anchor="start" size={22} weight={500}>
            {t}
          </Label>
        </g>
      ))}
      <g opacity={guarded}>
        <Pill x={T.x + T.w / 2} y={T.y + T.h - 40} text="защищено законом" color={theme.risk} fill={theme.paper} size={20} compact />
      </g>
      <line x1={640} y1={F.y - 6} x2={640} y2={F.y - 6 + (F.h + 12) * border} stroke={theme.risk} strokeWidth={4} strokeDasharray="10 8" opacity={border > 0 ? 1 : 0} />
      <g opacity={law}>
        <Label x={640} y={532} size={20} weight={500} color={theme.soft}>
          ст. 1259 ГК РФ: идеи и способы не охраняются — охраняется форма
        </Label>
      </g>

      {/* доска 2: шкала близости к эталону */}
      <g opacity={head}>
        <Label x={X2 + 640} y={112} size={26} weight={700}>
          Насколько близко к эталону
        </Label>
      </g>
      {segs.map((c, i) => (
        <rect key={i} x={S2.bar.x0 + i * segW} y={by - 8} width={Math.max(0, Math.min(segW, (S2.bar.x1 - S2.bar.x0) * bar - i * segW))} height={16} rx={i === 0 || i === 3 ? 8 : 0} fill={c} opacity={i === 1 ? 0.6 : 1} />
      ))}
      {NOTCHES.map((n, i) => {
        const x = S2.notches[i]
        return (
          <g key={n.verdict} opacity={notchIn[i]}>
            <circle cx={x} cy={by} r={14} fill={theme.paper} stroke={n.color} strokeWidth={4} />
            {n.name.map((l, j) => (
              <Label key={j} x={x} y={300 + j * 26} size={22} weight={700}>
                {l}
              </Label>
            ))}
            {n.note.map((l, j) => (
              <Label key={j} x={x} y={364 + j * 24} size={18} weight={500} color={theme.soft}>
                {l}
              </Label>
            ))}
            <Pill x={x} y={432} text={n.verdict} color={n.color} fill={theme.paper} compact />
          </g>
        )
      })}
      {/* наше приложение встаёт на «функциональный аналог» */}
      <g opacity={oursIn}>
        <MiniPhone x={ours.x} y={176} w={44} h={72} color={theme.accent} />
        <path d={`M${ours.x - 8} 222 L${ours.x + 8} 222 L${ours.x} 234 Z`} fill={theme.accent} />
      </g>
      <g opacity={goal}>
        <circle cx={S2.notches[1]} cy={by} r={22} fill="none" stroke={theme.accent} strokeWidth={4} />
      </g>
      {/* двойник и копия: дальше по шкале — опаснее */}
      <g opacity={twinIn}>
        <MiniPhone x={twin.x} y={176} w={44} h={72} color={twinColor} />
        <path d={`M${twin.x - 8} 222 L${twin.x + 8} 222 L${twin.x} 234 Z`} fill={twinColor} />
        <g opacity={twinNo}>
          <Mark x={twin.x + 30} y={150} ok={false} />
        </g>
      </g>
      <g opacity={brackets[0]}>
        <path d={`M${S2.notches[0] - 110} 466 V478 H${S2.notches[1] + 110} V466`} fill="none" stroke={theme.ok} strokeWidth={3} />
        <Label x={(S2.notches[0] + S2.notches[1]) / 2} y={508} size={20} weight={700} color={theme.ok}>
          свободно: идеи и поведение
        </Label>
      </g>
      <g opacity={brackets[1]}>
        <path d={`M${S2.notches[2] - 110} 466 V478 H${S2.notches[3] + 110} V466`} fill="none" stroke={theme.risk} strokeWidth={3} />
        <Label x={(S2.notches[2] + S2.notches[3]) / 2} y={508} size={20} weight={700} color={theme.risk}>
          запрещено: чужое исполнение
        </Label>
      </g>

      {/* доска 3: ещё три рамки */}
      <g opacity={head3}>
        <Label x={X3 + 640} y={84} size={26} weight={700}>
          Ещё три рамки
        </Label>
      </g>
      {FRAMES.map((f, i) => {
        const x = S2.cards.x + i * S2.cards.step
        const y = S2.cards.y + 10
        const cx = x + S2.cards.w / 2
        const on = lit[i]
        return (
          <g key={f.title} opacity={frameIn[i]} transform={`translate(0 ${(1 - frameIn[i]) * 16})`}>
            <Card x={x} y={y} w={S2.cards.w} h={S2.cards.h} stroke={on ? theme.risk : theme.line} fill={on ? theme.riskTint : theme.paper} />
            {i === 0 && (
              <g>
                <rect x={cx - 40} y={y + 30} width={80} height={104} rx={6} fill={theme.paper} stroke={theme.ink} strokeWidth={3} />
                {[0, 1, 2, 3, 4].map((k) => (
                  <line key={k} x1={cx - 26} y1={y + 52 + k * 16} x2={cx + 26 - (k % 2) * 14} y2={y + 52 + k * 16} stroke={theme.line} strokeWidth={3} strokeLinecap="round" />
                ))}
                <Mark x={cx + 44} y={y + 118} ok={false} r={18} />
              </g>
            )}
            {i === 1 && (
              <g>
                <circle cx={cx - 64} cy={y + 82} r={42} fill={theme.altTint} stroke={theme.alt} strokeWidth={4} />
                <Label x={cx - 64} y={y + 96} size={40} weight={700} color={theme.alt}>
                  Э
                </Label>
                <Label x={cx} y={y + 94} size={34} weight={700} color={theme.soft}>
                  ≈
                </Label>
                <circle cx={cx + 64} cy={y + 82} r={42} fill={theme.altTint} stroke={theme.alt} strokeWidth={4} />
                <Label x={cx + 64} y={y + 96} size={40} weight={700} color={theme.alt}>
                  Э
                </Label>
                <Mark x={cx + 100} y={y + 126} ok={false} r={18} />
              </g>
            )}
            {i === 2 && (
              <g>
                <rect x={cx - 150} y={y + 46} width={120} height={74} rx={10} fill={theme.codeBg} stroke={theme.ink} strokeWidth={3} />
                <text x={cx - 90} y={y + 92} textAnchor="middle" fill={theme.ink} style={{ font: `700 22px ${theme.mono}` }}>
                  GPL
                </text>
                <Arrow x1={cx - 22} y1={y + 83} x2={cx + 22} y2={y + 83} color={theme.ink} />
                <rect x={cx + 30} y={y + 46} width={120} height={74} rx={10} fill={open > 0 ? theme.accentTint : theme.paper} stroke={theme.accent} strokeWidth={3} />
                <Label x={cx + 90} y={y + 90} size={20} weight={700} color={theme.accent}>
                  ваш код
                </Label>
                <g opacity={open}>
                  <Pill x={cx + 90} y={y + 146} text="открыт" color={theme.accent} fill={theme.paper} size={18} compact />
                </g>
              </g>
            )}
            <Label x={cx} y={y + 200} size={24} weight={700} color={on ? theme.risk : theme.ink}>
              {f.title}
            </Label>
            {f.lines.map((l, j) => (
              <Label key={l} x={cx} y={y + 240 + j * 30} size={20} weight={500} color={theme.soft}>
                {l}
              </Label>
            ))}
          </g>
        )
      })}
      <g opacity={note}>
        <Pill x={X3 + 640} y={500} text="Это ориентир, а не юридическая консультация" color={theme.soft} fill={theme.paper} size={20} compact />
      </g>
    </KitScene>
  )
}
