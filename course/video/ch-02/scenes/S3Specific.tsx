import { interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Mark, Pill, Slot } from '../../kit/props'
import { grow, stepAt, typed } from '../../kit/reveal'
import { theme } from '../../theme'
import { S3 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Doc, Say } from './parts'

const ID = 's3-specific'
const R = S3.rules
const Q = S3.req
const D = S3.doc
const BAR_H = [34, 62, 100, 146, 190, 146, 100, 62, 34]
const MID = 4

// пять правил конкретности (s15) на примерах приложения тренера
const RULES = [
  { title: 'Проверка вместо оценки', vague: 'побыстрее', exact: 'открывается за 1 с даже при 10 000 записей', mono: false },
  { title: 'Точное место', vague: 'где-то в списке', exact: 'src/workouts.tsx, loadWorkouts()', mono: true },
  { title: 'Пример входа и выхода', vague: 'посчитай объём', exact: '3 подхода × 10 раз × 50 кг → 1500 кг', mono: false },
  { title: 'Чего не делать', vague: 'о запретах молчим', exact: 'не трогай настройки базы данных', mono: false },
  { title: 'Одна задача — один запрос', vague: 'экран + оплата + чат', exact: 'сейчас — только экран тренировок', mono: false },
]
// запрос, который проверяют на коллеге; последняя строка — ответ на его вопрос
const REQUEST = ['Экран «Мои тренировки» для подопечной.', 'Только её тренировки, без чужих.', 'Открывается за 1 с при 10 000 записей.', 'Не трогай настройки базы данных.']
const ADDED = 'Показывать неделю вперёд.'

// Сцена 3: конкретность. Модель не переспрашивает и закрывает пробел «средним»; пять правил конкретности;
// проверка запроса на коллеге; в хорошем запросе нет кода — только решения и условия.
export function S3Specific() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: пробел в запросе → «средний» ответ
  const req = useAppear(b(0) + 4)
  const ask = useAppear(b(0) + 30)
  const noAsk = interpolate(frame, [b(0) + 66, b(0) + 80], [0, 1], CLAMP)
  const barsGrow = BAR_H.map((_, i) => grow(frame, b(0) + 84 + i * 4, 16))
  const middle = useAppear(b(0) + 128)
  const toGap = interpolate(frame, [b(0) + 138, b(0) + 156], [0, 1], CLAMP)
  const filled = frame >= b(0) + 158
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(0) + 90, 'working'],
    [b(0) + 160, 'done'],
  ])

  // доска 2: подписанные места всех пяти правил уже стоят, когда камера туда едет (кадр не пустует);
  // правила по репликам — строка, затем точная формулировка; пятое готово до окна горячей точки
  const slots = useAppear(b(1) - 40)
  const rowAt = [b(1) + 30, b(2) + 8, b(3) + 8, b(4) + 4, b(4) + 48]
  const exactAt = [b(1) + 70, b(2) + 50, b(3) + 46, b(4) + 24, b(4) + 62]

  // доска 3: коллега читает запрос, спрашивает — дописываем ответ
  const doc = useAppear(b(5) + 6)
  const question = useAppear(b(5) + 50) * interpolate(frame, [b(5) + 150, b(5) + 160], [1, 0], CLAMP)
  const addAt = b(5) + 112
  const clear = useAppear(b(5) + 160)
  const noCode = useAppear(b(6) + 20)
  const model = useAppear(b(6) + 90)
  const dima = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(5) + 20, ['think', 'neutral']],
    [b(5) + 50, ['point', 'worried']],
    [b(5) + 112, ['think', 'neutral']],
    [b(5) + 160, ['stand', 'happy']],
    [b(6) + 30, ['cheer', 'happy']],
  ])

  const barX = (i: number) => S3.bars.x + i * (S3.bars.w + S3.bars.gap)
  const midTop = S3.bars.y - BAR_H[MID]

  return (
    <KitScene chip="3 / 6 · Конкретность и ясность" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* запрос с пробелом */}
      <g opacity={req}>
        <Card x={Q.x} y={Q.y} w={Q.w} h={Q.h} stroke={theme.accent}>
          <Label x={Q.x + 20} y={Q.y + 36} anchor="start" size={20} color={theme.soft} weight={600}>
            Запрос
          </Label>
          <Label x={Q.x + 20} y={Q.y + 76} anchor="start" size={24} weight={700}>
            Ускорь список тренировок
          </Label>
          <rect x={Q.x + 20} y={Q.y + 96} width={Q.w - 40} height={42} rx={10} fill={filled ? theme.codeBg : theme.paper} stroke={filled ? theme.line : theme.risk} strokeWidth={2.5} strokeDasharray={filled ? undefined : '8 6'} />
          <Label x={Q.x + Q.w / 2} y={Q.y + 124} size={20} color={filled ? theme.soft : theme.risk} weight={600}>
            {filled ? 'как у всех' : 'насколько быстрее?'}
          </Label>
        </Card>
      </g>

      {/* модель не переспросит */}
      <g opacity={ask}>
        <g opacity={1 - noAsk * 0.55}>
          <Say x={S3.agent.x - 30} y={236} text="Что значит «побыстрее»?" size={20} />
        </g>
        <line x1={S3.agent.x - 190} y1={236} x2={S3.agent.x - 190 + 320 * noAsk} y2={236} stroke={theme.risk} strokeWidth={5} strokeLinecap="round" opacity={noAsk > 0 ? 1 : 0} />
        <g opacity={noAsk}>
          <Pill x={S3.agent.x - 30} y={176} text="не спросит" color={theme.risk} fill={theme.riskTint} size={20} compact />
        </g>
      </g>
      <Agent x={S3.agent.x} y={S3.agent.y} scale={0.9} enterAt={b(0) + 10} pose={agent} />

      {/* решения из интернета: модель берёт среднее */}
      {BAR_H.map((h, i) => {
        const g = barsGrow[i]
        const isMid = i === MID
        return <rect key={i} x={barX(i)} y={S3.bars.y - h * g} width={S3.bars.w} height={h * g} rx={6} fill={isMid && middle > 0 ? theme.alt : theme.grid} opacity={g > 0 ? 1 : 0} />
      })}
      <g opacity={barsGrow[0]}>
        <Label x={barX(MID) + S3.bars.w / 2} y={S3.bars.y + 32} size={20} color={theme.soft} weight={600}>
          решения из интернета
        </Label>
      </g>
      <g opacity={middle}>
        <Pill x={barX(MID) + S3.bars.w / 2} y={midTop - 26} text="среднее" color={theme.alt} size={20} compact />
      </g>
      <Arrow x1={barX(MID) - 6} y1={midTop - 26} x2={Q.x + Q.w + 8} y2={Q.y + 117} color={theme.alt} draw={toGap} />

      {/* доска 2: места пяти правил — слева правило, справа точная формулировка */}
      {RULES.map((r, i) => {
        const y = R.y + i * R.row
        return (
          <g key={r.title} opacity={slots}>
            <g opacity={1 - appear(frame, rowAt[i], 6)}>
              <Slot x={R.x + 4} y={y + 10} w={440} h={R.row - 20} text={`правило ${i + 1}`} />
            </g>
            <g opacity={1 - appear(frame, exactAt[i] - 6, 6)}>
              <Slot x={R.x + 536} y={y + 14} w={R.w - 536} h={R.row - 28} text="точная формулировка" />
            </g>
          </g>
        )
      })}

      {/* доска 2: пять правил конкретности */}
      {RULES.map((r, i) => {
        const y = R.y + i * R.row
        const cy = y + R.row / 2
        const a = appear(frame, rowAt[i])
        const shown = frame >= exactAt[i]
        const strike = interpolate(frame, [exactAt[i] - 16, exactAt[i] - 4], [0, 1], CLAMP)
        // ширина «расплывчатой» фразы в кавычках — под зачёркивание
        const vagueW = (r.vague.length + 2) * 20 * 0.52
        return (
          <g key={r.title} opacity={a} transform={`translate(${(1 - a) * -24} 0)`}>
            {i > 0 && <line x1={R.x + 10} y1={y} x2={R.x + R.w - 10} y2={y} stroke={theme.grid} strokeWidth={2} />}
            <circle cx={R.x + 30} cy={cy} r={20} fill={theme.accent} />
            <Label x={R.x + 30} y={cy + 7} size={20} color={theme.white} weight={700}>
              {String(i + 1)}
            </Label>
            <Label x={R.x + 66} y={cy - 6} anchor="start" size={22} weight={700}>
              {r.title}
            </Label>
            <Label x={R.x + 66} y={cy + 24} anchor="start" size={20} color={theme.risk} weight={500}>
              {`«${r.vague}»`}
            </Label>
            <line x1={R.x + 62} y1={cy + 17} x2={R.x + 62 + (vagueW + 8) * strike} y2={cy + 17} stroke={theme.risk} strokeWidth={3} opacity={strike > 0 ? 1 : 0} />
            <g opacity={appear(frame, exactAt[i] - 6, 6)}>
              <path d={`M${R.x + 470} ${cy} H${R.x + 520} m-12 -8 l12 8 l-12 8`} fill="none" stroke={theme.ok} strokeWidth={3} />
              <rect x={R.x + 536} y={y + 14} width={R.w - 536} height={R.row - 28} rx={10} fill={theme.okTint} stroke={theme.ok} strokeWidth={2} />
              <text x={R.x + 554} y={cy + 7} fill={theme.ink} style={{ font: `${r.mono ? 500 : 600} 20px ${r.mono ? theme.mono : theme.font}` }}>
                {shown ? typed(r.exact, frame, exactAt[i], 48) : ''}
              </text>
            </g>
          </g>
        )
      })}

      {/* доска 3: проверка на коллеге */}
      <g opacity={doc}>
        <Doc x={D.x} y={D.y} w={D.w} h={70 + (REQUEST.length + 1) * D.row} title="Запрос" color={theme.accent}>
          {REQUEST.map((t, i) => (
            <Label key={t} x={D.x + 24} y={D.y + 84 + i * D.row} anchor="start" size={22} weight={500}>
              {t}
            </Label>
          ))}
          {frame >= addAt && (
            <g>
              <rect x={D.x + 14} y={D.y + 84 + REQUEST.length * D.row - 32} width={D.w - 28} height={44} rx={8} fill={theme.okTint} opacity={appear(frame, addAt, 8)} />
              <Label x={D.x + 24} y={D.y + 84 + REQUEST.length * D.row} anchor="start" size={22} color={theme.ok} weight={700}>
                {typed(ADDED, frame, addAt + 4, 30)}
              </Label>
            </g>
          )}
        </Doc>
      </g>
      <g opacity={doc}>
        <Pill x={S3.dima.x} y={150} text="коллега, не видевший проект" color={theme.soft} size={20} compact />
      </g>
      <g opacity={question}>
        <Say x={S3.dima.x + 30} y={236} text="А тренировки за какой срок?" size={20} />
      </g>
      <g opacity={clear}>
        <Say x={S3.dima.x + 30} y={236} text="Теперь всё понятно" size={20} color={theme.ok} fill={theme.okTint} />
      </g>
      <Coach x={S3.dima.x} y={S3.dima.y} scale={0.8} color={theme.alt} label="Дима" enterAt={b(5) + 10} pose={dima[0]} mood={dima[1]} />

      {/* кода в запросе нет */}
      <g opacity={noCode}>
        <Pill x={D.x + D.w / 2 - 24} y={D.y + 70 + (REQUEST.length + 1) * D.row + 40} text="ни строчки кода — только решения и условия" color={theme.accent} size={20} compact />
        <Mark x={D.x + D.w - 6} y={D.y + 70 + (REQUEST.length + 1) * D.row + 40} ok />
      </g>
      <g opacity={model}>
        <Pill x={D.x + D.w / 2 - 24} y={D.y + 70 + (REQUEST.length + 1) * D.row + 92} text="как писать код — решит модель" color={theme.soft} size={20} compact />
      </g>
    </KitScene>
  )
}
