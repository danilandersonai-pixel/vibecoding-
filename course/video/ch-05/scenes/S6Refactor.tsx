import { interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Phone } from '../../actors/Phone'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP, trackAt } from '../../kit/motion'
import { Arrow, Label } from '../../kit/parts'
import { Mark, PhoneScreen, Pill } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { PHONE_SCALE, S6 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { CodeBlock } from './parts'

const ID = 's6-refactor'
const BG = S6.big
const L = S6.loop
const FL = S6.filter

// «запахи» огромной функции
const SMELLS = [
  { text: 'повтор ×3', mono: false },
  { text: '4700 — что это?', mono: false },
  { text: 'TODO: доделать', mono: true },
  { text: 'мёртвый код', mono: false },
]
// после уборки: три маленькие функции с понятными именами
const PARTS = ['sumReps()', 'averageWeight()', 'totalVolume()']
const MECH = ['переименовать', 'вынести функцию', 'заменить везде']
// цикл безопасного рефакторинга (рис. 5.5)
const NODES = [
  { title: 'Сначала тесты', sub: 'на нынешнее поведение', color: theme.ok },
  { title: 'Маленький шаг', sub: 'только устройство', color: theme.accent },
  { title: 'Тесты зелёные?', sub: 'проверка после шага', color: theme.alt },
]
// левые края блоков автоматических проверок
const boxX = FL.ws.map((_, i) => FL.x + FL.ws.slice(0, i).reduce((sum, w) => sum + w + FL.gap, 0))
// автоматические проверки до человека (рис. ch5_filter)
const FILTER = [
  { title: 'Код от ИИ', sub: '', color: theme.line },
  { title: 'Линтер', sub: 'дубли, мёртвый код', color: theme.accent },
  { title: 'Форматтер', sub: 'единый вид', color: theme.accent },
  { title: 'Проверка типов', sub: 'число или текст', color: theme.accent },
  { title: 'Вы', sub: 'смысл', color: theme.ok },
]

// Сцена 6: рефакторинг делает код своим (s33): огромная функция с «запахами» → три понятные, снаружи всё
// как раньше. Механику ИИ делает отлично, перестройку без плана — нет. Цикл маленьких шагов под тестами;
// мусор ловит автоматика (s31).
export function S6Refactor() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: огромная функция и её запахи → три маленькие
  const smellAt = SMELLS.map((_, i) => b(0) + 40 + i * 16)
  const smellOut = interpolate(frame, [b(1) + 10, b(1) + 24], [1, 0], CLAMP)
  const bigOut = interpolate(frame, [b(1) + 20, b(1) + 36], [1, 0], CLAMP)
  const partAt = PARTS.map((_, i) => b(1) + 30 + i * 12)
  const yours = frame >= b(1) + 110
  const phone = appear(frame, b(1) + 50)
  const same = appear(frame, b(1) + 120)
  const mechAt = MECH.map((_, i) => b(2) + 30 + i * 30)
  const noPlan = appear(frame, b(3) + 20)
  const noPlanX = appear(frame, b(3) + 60)
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(2) + 20, 'working'],
    [b(2) + 130, 'done'],
    [b(3) + 10, 'idle'],
  ])

  // доска 2: цикл — шаг, тесты, коммит; один раз тесты покраснели — откат шага
  const nodeAt = [b(4) + 20, b(4) + 36, b(4) + 52, b(4) + 68, b(4) + 84]
  const B = { x: L.xs[1] + L.w / 2, y: L.y + L.h / 2 }
  const C = { x: L.xs[2] + L.w / 2, y: L.y + L.h / 2 }
  const D = { x: L.xs[2] + L.w / 2, y: L.commitY + L.h / 2 }
  const E = { x: L.undoX + L.w / 2, y: L.y + L.h / 2 }
  type K = [number, number, number]
  const lap = (t: number, bad: boolean): K[] =>
    bad
      ? [
          [t, B.x, B.y],
          [t + 14, C.x, C.y],
          [t + 28, E.x, E.y],
          [t + 46, B.x, B.y],
        ]
      : [
          [t, B.x, B.y],
          [t + 14, C.x, C.y],
          [t + 28, D.x, D.y],
          [t + 46, B.x, B.y],
        ]
  // три круга подряд: шаг удался, шаг откатили, снова удался
  const laps = [b(4) + 70, b(4) + 122, b(4) + 174]
  const token = trackAt(frame, [...lap(laps[0], false), ...lap(laps[1], true), ...lap(laps[2], false)])
  const tokenOn = frame >= laps[0] && frame < laps[2] + 48
  const near = (p: { x: number; y: number }) => tokenOn && Math.hypot(token.x - p.x, token.y - p.y) < 40
  const commitAt = [laps[0] + 28, laps[2] + 28]
  const commits = commitAt.filter((at) => frame >= at).length
  // мусор едет из кода в линтер и пропадает
  const filterAt = FILTER.map((_, i) => b(5) + 10 + i * 12)
  const junk = [0, 1, 2].map((i) => {
    const t0 = b(5) + 76 + i * 16
    const p = trackAt(frame, [
      [t0, boxX[0] + FL.ws[0] / 2, FL.y - 18],
      [t0 + 22, boxX[1] + FL.ws[1] / 2, FL.y - 18],
    ])
    const on = frame >= t0 && frame < t0 + 30
    return { ...p, on, fade: interpolate(frame, [t0 + 20, t0 + 30], [1, 0], CLAMP) }
  })

  const node = (x: number, y: number, n: { title: string; sub: string; color: string }, g: number, hot: boolean) => (
    <g opacity={g}>
      <rect x={x} y={y} width={L.w} height={L.h} rx={14} fill={theme.paper} />
      <rect x={x} y={y} width={L.w} height={L.h} rx={14} fill={hot ? theme.accentTint : theme.paper} stroke={n.color} strokeWidth={3} />
      <Label x={x + L.w / 2} y={y + 32} size={22} weight={700} color={n.color}>
        {n.title}
      </Label>
      <Label x={x + L.w / 2} y={y + 60} size={18} weight={500} color={theme.soft}>
        {n.sub}
      </Label>
    </g>
  )

  return (
    <KitScene chip="6 / 7 · Рефакторинг" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* доска 1: огромная функция и её «запахи» */}
      <g opacity={appear(frame, b(0) + 10)}>
        <Pill x={BG.x + BG.w / 2} y={BG.y - 26} text={yours ? 'понятен вам — значит, ваш' : 'чужой: всё в одной функции'} color={yours ? theme.ok : theme.risk} fill={yours ? theme.okTint : theme.riskTint} size={20} compact />
      </g>
      <g opacity={bigOut * appear(frame, b(0) + 10)}>
        <CodeBlock x={BG.x} y={BG.y} w={BG.w} h={BG.h} title="totalVolume()" rows={14} color={theme.risk} />
      </g>
      {SMELLS.map((sm, i) => {
        const g = appear(frame, smellAt[i]) * smellOut
        const y = S6.smellYs[i]
        return (
          <g key={sm.text} opacity={g}>
            <line x1={BG.x + BG.w - 30} y1={y} x2={S6.smellX - 90} y2={y} stroke={theme.risk} strokeWidth={2.5} strokeDasharray="6 5" />
            <circle cx={BG.x + BG.w - 30} cy={y} r={6} fill={theme.risk} />
            <Pill x={S6.smellX} y={y} w={180} text={sm.text} color={theme.risk} fill={theme.paper} size={20} mono={sm.mono} compact />
          </g>
        )
      })}
      {PARTS.map((p, i) => {
        const g = appear(frame, partAt[i])
        return (
          <g key={p} opacity={g} transform={`translate(0 ${(1 - g) * 14})`}>
            <CodeBlock x={BG.x} y={BG.y + i * 128} w={BG.w} h={100} title={p} rows={2} color={theme.ok} />
          </g>
        )
      })}

      {/* снаружи — как раньше */}
      <g opacity={phone}>
        <Phone x={S6.phone.x} y={S6.phone.y} scale={PHONE_SCALE}>
          <PhoneScreen tapAt={-100} listAt={0} list={['Жим: 1500 кг']} label="Объём" />
        </Phone>
      </g>
      <g opacity={same}>
        <Pill x={S6.phone.x} y={524} text="работает как раньше" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>

      {/* механику ИИ делает отлично, перестройку без плана — нет */}
      <Agent x={S6.agent.x} y={S6.agent.y} scale={0.75} enterAt={b(2)} pose={agent} />
      {MECH.map((m, i) => (
        <g key={m} opacity={appear(frame, mechAt[i])} transform={`translate(${(1 - appear(frame, mechAt[i])) * -14} 0)`}>
          <Pill x={S6.chips.x} y={S6.chips.ys[i]} w={S6.chips.w - 60} text={m} color={theme.ok} fill={theme.okTint} size={22} />
          <Mark x={S6.chips.x + S6.chips.w / 2 - 6} y={S6.chips.ys[i]} ok r={15} />
        </g>
      ))}
      <g opacity={noPlan}>
        <Pill x={S6.chips.x} y={366} text="перестроить всё без плана" color={theme.risk} fill={theme.riskTint} size={20} compact />
        <Label x={S6.chips.x} y={414} size={18} weight={500} color={theme.soft}>
          может сломать договорённости
        </Label>
      </g>
      <g opacity={noPlanX}>
        <Mark x={S6.chips.x + 174} y={366} ok={false} r={15} />
      </g>

      {/* доска 2: цикл маленьких шагов под тестами */}
      {/* фишка едет по стрелкам и прячется под узлом, в который вошла */}
      {tokenOn && <circle cx={token.x} cy={token.y} r={11} fill={theme.alt} stroke={theme.paper} strokeWidth={3} />}
      {node(L.xs[0], L.y, NODES[0], appear(frame, nodeAt[0]), false)}
      {node(L.xs[1], L.y, NODES[1], appear(frame, nodeAt[1]), near(B))}
      {node(L.xs[2], L.y, NODES[2], appear(frame, nodeAt[2]), near(C))}
      {node(L.xs[2], L.commitY, { title: 'Коммит', sub: 'точка возврата', color: theme.ok }, appear(frame, nodeAt[3]), near(D))}
      {node(L.undoX, L.y, { title: 'Откат шага', sub: 'и шаг поменьше', color: theme.risk }, appear(frame, nodeAt[4]), near(E))}
      <Arrow x1={L.xs[0] + L.w + 6} y1={B.y} x2={L.xs[1] - 8} y2={B.y} color={theme.ink} draw={appear(frame, nodeAt[1])} />
      <Arrow x1={L.xs[1] + L.w + 6} y1={B.y} x2={L.xs[2] - 8} y2={C.y} color={theme.ink} draw={appear(frame, nodeAt[2])} />
      <Arrow x1={C.x} y1={L.y + L.h + 6} x2={D.x} y2={L.commitY - 8} color={theme.ok} draw={appear(frame, nodeAt[3])} />
      <Arrow x1={L.xs[2] + L.w + 6} y1={C.y} x2={L.undoX - 8} y2={E.y} color={theme.risk} draw={appear(frame, nodeAt[4])} />
      <g opacity={appear(frame, nodeAt[3])}>
        <Label x={C.x + 14} y={L.y + L.h + 42} anchor="start" size={20} weight={700} color={theme.ok}>
          да
        </Label>
        {/* от коммита — к следующему шагу */}
        <path d={`M${L.xs[2] - 6} ${D.y} H${B.x} V${L.y + L.h + 14}`} fill="none" stroke={theme.ink} strokeWidth={3} />
        <path d={`M${B.x} ${L.y + L.h + 4} l-7 12 h14 Z`} fill={theme.ink} />
        <Label x={B.x + 14} y={D.y - 12} anchor="start" size={18} weight={600} color={theme.soft}>
          следующий шаг
        </Label>
      </g>
      <g opacity={appear(frame, nodeAt[4])}>
        <Label x={(L.xs[2] + L.w + L.undoX) / 2} y={C.y - 14} size={20} weight={700} color={theme.risk}>
          нет
        </Label>
        {/* откат — снова к шагу, только меньше */}
        <path d={`M${E.x} ${L.y - 6} V${L.y - 34} H${B.x} V${L.y - 12}`} fill="none" stroke={theme.risk} strokeWidth={3} strokeDasharray="8 6" />
        <path d={`M${B.x} ${L.y - 4} l-7 -12 h14 Z`} fill={theme.risk} />
      </g>
      {[0, 1].slice(0, commits).map((k) => (
        <g key={k} opacity={appear(frame, commitAt[k])}>
          <circle cx={L.xs[2] + L.w + 40 + k * 44} cy={D.y} r={14} fill={theme.okTint} stroke={theme.ok} strokeWidth={3} />
          <path d={`M${L.xs[2] + L.w + 33 + k * 44} ${D.y} l5 6 l9 -11`} fill="none" stroke={theme.ok} strokeWidth={3} strokeLinecap="round" />
        </g>
      ))}

      {/* мусор ловит автоматика: линтер, форматтер, проверка типов */}
      {FILTER.map((f, i) => {
        const g = appear(frame, filterAt[i])
        const x = boxX[i]
        return (
          <g key={f.title} opacity={g}>
            <rect x={x} y={FL.y} width={FL.ws[i]} height={FL.h} rx={12} fill={theme.paper} stroke={f.color} strokeWidth={3} />
            <Label x={x + FL.ws[i] / 2} y={FL.y + (f.sub ? 32 : 46)} size={22} weight={700} color={f.color === theme.line ? theme.ink : f.color}>
              {f.title}
            </Label>
            {f.sub && (
              <Label x={x + FL.ws[i] / 2} y={FL.y + 60} size={18} weight={500} color={theme.soft}>
                {f.sub}
              </Label>
            )}
            {i > 0 && <Arrow x1={boxX[i - 1] + FL.ws[i - 1] + 4} y1={FL.y + FL.h / 2} x2={x - 6} y2={FL.y + FL.h / 2} color={theme.ink} draw={g} />}
          </g>
        )
      })}
      {/* мусор едет над блоками из кода в линтер и там пропадает */}
      {junk.map((j, i) => j.on && <rect key={i} x={j.x - 9} y={j.y - 9} width={18} height={18} rx={4} fill={theme.risk} opacity={j.fade} transform={`rotate(${frame * 6} ${j.x} ${j.y})`} />)}
    </KitScene>
  )
}
