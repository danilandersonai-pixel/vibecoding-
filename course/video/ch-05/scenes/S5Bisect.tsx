import { useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { KitScene } from '../../kit/KitScene'
import { appear, trackAt } from '../../kit/motion'
import { Arrow, Label } from '../../kit/parts'
import { Pill } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { Diff, type DiffLine } from '../../kit/screens/Diff'
import { type TermLine } from '../../kit/screens/layout'
import { Terminal } from '../../kit/screens/Terminal'
import { theme } from '../../theme'
import { S5 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Commit, type CommitState } from './parts'

const ID = 's5-bisect'

const TERM: TermLine[] = [
  { text: 'git bisect start', kind: 'cmd' },
  { text: 'git bisect bad', kind: 'cmd' },
  { text: 'git bisect good 1f3a9c2', kind: 'cmd' },
  { text: 'Bisecting: 3 revisions left…', kind: 'out' },
  { text: '7c2e4d1 is the first bad commit', kind: 'ok' },
]
// что поменял коммит 7: поле с подходами переименовано
const CHANGE: DiffLine[] = [
  { text: 'const rows = await load(id)', kind: 'same' },
  { text: '  return { sets: rows }', kind: 'del' },
  { text: '  return { items: rows }', kind: 'add' },
]
// кандидаты в «первый плохой» после каждой проверки
const COUNTS = [7, 4, 2, 1]

const cx = (n: number) => S5.x0 + (n - 1) * S5.dx

// Сцена 5: поиск поломки делением пополам (рис. 5.4): коммит 1 работал, 8 — нет; проверяем 4, 6, 7 —
// седьмой первый плохой. Так ищет git bisect; агент запускает его сам и показывает изменение.
export function S5Bisect() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // кадры проверок: начало (синий) и итог
  const test4 = [b(1) + 30, b(1) + 70]
  const test6 = [b(2) + 6, b(2) + 40]
  const test7 = [b(2) + 76, b(2) + 112]
  const state = (n: number): CommitState => {
    if (n === 1) return frame >= b(0) + 70 ? 'good' : 'idle'
    if (n === 8) return frame >= b(0) + 90 ? 'bad' : 'idle'
    const t = n === 4 ? test4 : n === 6 ? test6 : n === 7 ? test7 : null
    if (!t || frame < t[0]) return 'idle'
    if (frame < t[1]) return 'test'
    return n === 7 ? 'bad' : 'good'
  }
  // скобка кандидатов: от первого до последнего подозреваемого
  const range = trackAt(frame, [
    [test4[1] + 8, 2, 8],
    [test4[1] + 26, 5, 8],
    [test6[1] + 8, 5, 8],
    [test6[1] + 26, 7, 8],
    [test7[1] + 8, 7, 8],
    [test7[1] + 26, 7, 7],
  ])
  const count = stepAt(frame, [
    [0, 7],
    [test4[1] + 16, 4],
    [test6[1] + 16, 2],
    [test7[1] + 16, 1],
  ])
  const bracket = appear(frame, b(0) + 120)
  // отсеянные и ещё не проверенные коммиты бледнеют; проверенные остаются цветными
  const dim = (n: number) => frame >= b(0) + 120 && (n < Math.round(range.x) || n > Math.round(range.y)) && state(n) === 'idle'
  const firstBad = appear(frame, test7[1] + 20)
  const halfAt = COUNTS.map((_, i) => b(3) + 10 + i * 14)

  // доска 2: агент запускает git bisect, изменение седьмого коммита
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(4) + 20, 'working'],
    [b(4) + 140, 'done'],
  ])
  const termAt = b(4) + 20
  const diffAt = b(4) + 120
  const cause = appear(frame, b(4) + 160)

  const left = cx(range.x) - S5.r - 14
  const right = cx(range.y) + S5.r + 14

  return (
    <KitScene chip="5 / 7 · Поиск делением пополам" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* ряд коммитов: от старых к новым */}
      <g opacity={appear(frame, b(0) + 4)}>
        <line x1={cx(1)} y1={S5.rowY} x2={cx(8)} y2={S5.rowY} stroke={theme.grid} strokeWidth={6} />
        <Label x={cx(1) - S5.r} y={S5.rowY - S5.r - 16} anchor="start" size={18} weight={600} color={theme.soft}>
          старые
        </Label>
        <Label x={cx(8) + S5.r} y={S5.rowY - S5.r - 16} anchor="end" size={18} weight={600} color={theme.soft}>
          новые
        </Label>
      </g>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => {
        const g = appear(frame, b(0) + 6 + n * 5, 8)
        return (
          <g key={n} opacity={g}>
            <Commit x={cx(n)} y={S5.rowY} r={S5.r} n={n} state={state(n)} dim={dim(n)} />
          </g>
        )
      })}
      <g opacity={appear(frame, b(0) + 72)}>
        <Label x={cx(1)} y={S5.rowY + S5.r + 30} size={20} weight={700} color={theme.ok}>
          работало
        </Label>
      </g>
      <g opacity={appear(frame, b(0) + 92)}>
        <Label x={cx(8)} y={S5.rowY + S5.r + 30} size={20} weight={700} color={theme.risk}>
          сломано
        </Label>
      </g>

      {/* скобка подозреваемых и их число */}
      <g opacity={bracket}>
        <path d={`M${left} ${S5.bracketY + 14} V${S5.bracketY} H${right} V${S5.bracketY + 14}`} fill="none" stroke={theme.alt} strokeWidth={4} strokeLinejoin="round" />
        <Pill x={(left + right) / 2} y={S5.bracketY - 26} text={count === 1 ? 'остался один' : `кандидатов: ${count}`} color={theme.alt} fill={theme.altTint} size={20} compact />
      </g>

      {/* ответы на проверках: хорошо или плохо */}
      {[
        { n: 4, at: test4[1], ok: true },
        { n: 6, at: test6[1], ok: true },
        { n: 7, at: test7[1], ok: false },
      ].map((c) => (
        <g key={c.n} opacity={appear(frame, c.at)} transform={`translate(0 ${(1 - appear(frame, c.at)) * 8})`}>
          <Pill x={c.ok ? cx(c.n) : cx(c.n) + 24} y={S5.checkY} text={c.ok ? 'хорошо' : firstBad > 0 ? 'первый плохой' : 'плохо'} color={c.ok ? theme.ok : theme.risk} fill={c.ok ? theme.okTint : theme.riskTint} size={20} compact />
        </g>
      ))}

      {/* с каждой проверкой — вдвое меньше */}
      {COUNTS.map((c, i) => (
        <g key={c} opacity={appear(frame, halfAt[i])}>
          <Pill x={420 + i * 150} y={S5.countY} text={String(c)} color={theme.alt} fill={c === 1 ? theme.altTint : theme.paper} size={24} />
          {i > 0 && <Arrow x1={420 + (i - 1) * 150 + 30} y1={S5.countY} x2={420 + i * 150 - 30} y2={S5.countY} color={theme.alt} draw={appear(frame, halfAt[i])} />}
        </g>
      ))}
      <g opacity={appear(frame, halfAt[0])}>
        <Label x={350} y={S5.countY + 8} anchor="end" size={20} weight={600} color={theme.soft}>
          кандидатов:
        </Label>
      </g>

      {/* доска 2: агент запускает git bisect и показывает изменение */}
      <Agent x={S5.agent.x} y={S5.agent.y} scale={0.8} enterAt={b(4) - 10} pose={agent} />
      {frame >= termAt && <Terminal x={S5.term.x} y={S5.term.y} w={S5.term.w} at={termAt} lines={TERM} />}
      <g opacity={appear(frame, diffAt - 6)}>
        <Label x={S5.diff.x} y={S5.diff.y - 16} anchor="start" size={22} weight={700} color={theme.risk}>
          Коммит 7
        </Label>
      </g>
      {frame >= diffAt && <Diff x={S5.diff.x} y={S5.diff.y} w={S5.diff.w} at={diffAt} lines={CHANGE} />}
      <g opacity={cause}>
        <Pill x={S5.diff.x + S5.diff.w / 2} y={S5.diff.y + 200} w={420} text="поле переименовали — причина" color={theme.ok} fill={theme.okTint} size={22} />
      </g>
    </KitScene>
  )
}
