import { interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Mark, Pill } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { Diff, type DiffLine } from '../../kit/screens/Diff'
import { Editor } from '../../kit/screens/Editor'
import { type TermLine } from '../../kit/screens/layout'
import { Terminal } from '../../kit/screens/Terminal'
import { theme } from '../../theme'
import { S7 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { CodeBlock, Magnifier } from './parts'

const ID = 's7-tests'
const R = S7.req
const T = S7.test
const OC = S7.outcomes
const RC = S7.recap

const RED: TermLine[] = [
  { text: 'npm test', kind: 'cmd' },
  { text: 'FAIL  пустая тренировка', kind: 'err' },
  { text: 'Expected: 0  Received: NaN', kind: 'err' },
]
const GREEN: TermLine[] = [
  { text: 'npm test', kind: 'cmd' },
  { text: 'PASS  пустая тренировка', kind: 'ok' },
  { text: '1 passed, 0 failed', kind: 'ok' },
]
// ИИ правит код, а не тест
const FIX: DiffLine[] = [
  { text: 'if (!sets.length) return 0', kind: 'add' },
  { text: 'const reps = sum(…)', kind: 'same' },
]
// ярусы пирамиды снизу вверх: название, пояснение, сколько тестов (квадратики)
const TIERS = [
  { title: 'Модульные', sub: 'одна часть · много · быстро', n: 12, color: theme.ok, fill: theme.okTint },
  { title: 'Интеграционные', sub: 'части вместе · тестовая база', n: 5, color: theme.accent, fill: theme.accentTint },
  { title: 'Сквозные', sub: 'путь человека · мало', n: 2, color: theme.alt, fill: theme.altTint },
]
const RECAP = [
  { title: 'Четыре прохода', sub: 'от обзора до краёв' },
  { title: 'Причина', sub: 'стектрейс, пополам' },
  { title: 'Порядок', sub: 'рефакторинг' },
  { title: 'Тесты', sub: 'от требований' },
]

// Сцена 7: тесты (s34). ИИ пишет их быстро, но к готовой функции подгоняет; пишем от требования Марины,
// красный тест → ИИ правит код (рис. 5.6). Пирамида: модульные, интеграционные, сквозные (рис. 5.7).
// Проверка самих тестов поломкой (рис. 5.8). Итог главы.
export function S7Tests() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: тест «от кода» закрепляет ошибку → тест от требования Марины
  const testAt = b(0) + 24
  const fromCode = appear(frame, b(0) + 50) * interpolate(frame, [b(1) + 50, b(1) + 62], [1, 0], CLAMP)
  const codeArrow = interpolate(frame, [b(0) + 60, b(0) + 72], [0, 1], CLAMP)
  const fitted = appear(frame, b(0) + 120) * interpolate(frame, [b(1) + 50, b(1) + 62], [1, 0], CLAMP)
  const fast = appear(frame, b(0) + 40) * interpolate(frame, [b(0) + 150, b(0) + 162], [1, 0], CLAMP)
  const req = appear(frame, b(1) + 30)
  const reqArrow = interpolate(frame, [b(1) + 64, b(1) + 78], [0, 1], CLAMP)
  const fixAt = b(1) + 84
  const expected = frame >= fixAt ? `toBe(${typed('0', frame, fixAt + 10, 10) || ''})` : 'toBe(NaN)'
  const fromReq = appear(frame, b(1) + 120) * interpolate(frame, [b(2) - 6, b(2) + 4], [1, 0], CLAMP)
  const redAt = b(2) + 8
  const diffAt = b(2) + 76
  const greenAt = b(2) + 120
  const untouched = appear(frame, b(2) + 150)
  const agent = stepAt<AgentPose>(frame, [
    [0, 'working'],
    [b(0) + 60, 'done'],
    [b(1), 'idle'],
    [b(2) + 66, 'working'],
    [b(2) + 130, 'done'],
  ])
  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(1) + 24, ['point', 'neutral']],
    [b(2) + 60, ['think', 'worried']],
    [b(2) + 140, ['cheer', 'happy']],
  ])

  // доска 2: пирамида тестов
  const tierAt = [b(3) + 30, b(4) + 10, b(4) + 56]
  // пунктирные контуры всех ярусов — сразу, как камера подъехала; заливаются по репликам
  const outline = appear(frame, b(3) + 14)
  const example = appear(frame, b(3) + 96)

  // доска 3: поломка нарочно и что скажут тесты; итог
  const codeAt = b(5) + 30
  const broken = frame >= b(5) + 70
  const outcomeAt = [b(5) + 100, b(5) + 130]
  const dim = interpolate(frame, [b(6), b(6) + 14], [0, 0.94], CLAMP)
  const recap = appear(frame, b(6) + 10)
  const recapAt = RECAP.map((_, i) => b(6) + 26 + i * 20)

  const testLines = [`test('пустая тренировка', () => {`, `  expect(totalVolume([])).${expected}`, '})']

  return (
    <KitScene chip="7 / 7 · Три вида тестов" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* доска 1: ИИ пишет тест быстро — но от готового кода */}
      <Agent x={S7.agent.x} y={S7.agent.y} scale={0.8} enterAt={0} pose={agent} />
      <g opacity={fast}>
        <Pill x={S7.agent.x} y={S7.agent.y - 104} text="тесты — быстро" color={theme.accent} fill={theme.accentTint} size={20} compact />
      </g>
      <g opacity={fromCode}>
        <CodeBlock x={S7.diff.x} y={S7.diff.y} w={S7.diff.w} h={100} title="volume.ts" rows={2} />
      </g>
      <Arrow x1={S7.diff.x - 6} y1={S7.diff.y + 50} x2={T.x + T.w + 8} y2={T.y + 80} color={theme.risk} draw={codeArrow * (fromCode > 0 ? 1 : 0)} />
      {frame >= testAt && <Editor x={T.x} y={T.y} w={T.w} at={testAt} file="volume.test.ts" lines={testLines} highlight={frame >= b(0) + 110 ? [2] : []} />}
      <g opacity={fitted}>
        <Pill x={T.x + T.w / 2} y={T.y + 190} text="подогнан под ошибку" color={theme.risk} fill={theme.riskTint} size={22} />
      </g>

      {/* требование Марины → тест от требования */}
      <Coach x={S7.marina.x} y={S7.marina.y} scale={0.85} label="Марина" enterAt={b(1)} pose={marina[0]} mood={marina[1]} />
      <g opacity={req}>
        <Card x={R.x} y={R.y} w={R.w} h={R.h} stroke={theme.accent}>
          <Label x={R.x + 20} y={R.y + 38} anchor="start" size={22} weight={700} color={theme.accent}>
            Требование
          </Label>
          <Label x={R.x + 20} y={R.y + 78} anchor="start" size={20} weight={600}>
            пустая тренировка —
          </Label>
          <Label x={R.x + 20} y={R.y + 108} anchor="start" size={20} weight={600}>
            объём 0 кг
          </Label>
        </Card>
      </g>
      <Arrow x1={R.x + R.w + 6} y1={R.y + 70} x2={T.x - 8} y2={T.y + 80} color={theme.accent} draw={reqArrow} />
      <g opacity={fromReq}>
        <Pill x={T.x + T.w / 2} y={T.y + 190} text="тест от требования" color={theme.ok} fill={theme.okTint} size={22} />
      </g>

      {/* красный тест → ИИ правит код → зелёный */}
      {frame >= redAt && frame < greenAt && <Terminal x={S7.term.x} y={S7.term.y} w={S7.term.w} at={redAt} lines={RED} />}
      {/* повторный запуск: команда уже набрана, строки PASS появляются сразу после смены окна */}
      {frame >= greenAt && <Terminal x={S7.term.x} y={S7.term.y} w={S7.term.w} at={greenAt - 30} lines={GREEN} />}
      <g opacity={appear(frame, diffAt - 6)}>
        <Label x={S7.diff.x} y={S7.diff.y - 14} anchor="start" size={20} weight={700} color={theme.ink}>
          ИИ правит volume.ts
        </Label>
      </g>
      {frame >= diffAt && <Diff x={S7.diff.x} y={S7.diff.y} w={S7.diff.w} at={diffAt} lines={FIX} />}
      <g opacity={untouched}>
        <Pill x={S7.diff.x + S7.diff.w / 2} y={S7.diff.y + 160} text="тест не менялся" color={theme.ok} fill={theme.okTint} size={22} />
      </g>

      {/* доска 2: пирамида тестов — сначала пустые контуры трёх ярусов */}
      <g opacity={outline}>
        {S7.tiers.map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} rx={14} fill="none" stroke={theme.line} strokeWidth={3} strokeDasharray="10 8" />
        ))}
      </g>
      {TIERS.map((t, i) => {
        const g = appear(frame, tierAt[i])
        const r = S7.tiers[i]
        const sq = 16
        const sqX = r.x + r.w - 24 - t.n * (sq + 6)
        return (
          <g key={t.title} opacity={g} transform={`translate(0 ${(1 - g) * 16})`}>
            <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={14} fill={t.fill} stroke={t.color} strokeWidth={3} />
            <Label x={r.x + r.w / 2 - (i === 2 ? 20 : 0)} y={r.y + 42} size={26} weight={700} color={t.color}>
              {t.title}
            </Label>
            <Label x={r.x + r.w / 2 - (i === 2 ? 20 : 0)} y={r.y + 76} size={20} weight={500} color={theme.ink}>
              {t.sub}
            </Label>
            {Array.from({ length: t.n }, (_, k) => (
              <rect key={k} x={sqX + k * (sq + 6)} y={r.y + 14} width={sq} height={sq} rx={4} fill={t.color} opacity={appear(frame, tierAt[i] + 10 + k * 2, 6)} />
            ))}
          </g>
        )
      })}

      <g opacity={example}>
        <rect x={S7.tiers[0].x + S7.tiers[0].w - 24 - 12 * 22 - 4} y={S7.tiers[0].y + 10} width={24} height={24} rx={6} fill="none" stroke={theme.ink} strokeWidth={3} />
        <Pill x={S7.tiers[0].x + S7.tiers[0].w / 2} y={S7.tiers[0].y + S7.tiers[0].h + 32} text="например, подсчёт объёма" color={theme.ok} fill={theme.paper} size={20} compact />
      </g>

      {/* доска 3: сломайте код нарочно */}
      {frame >= codeAt && (
        <Editor
          x={S7.code.x}
          y={S7.code.y}
          w={S7.code.w}
          at={codeAt}
          file="volume.ts"
          lines={[
            'function totalVolume(sets) {',
            '  if (!sets.length) return 0',
            "  const reps = sum(sets, 'reps')",
            '  const kg = sets.reduce(addLoad, 0)',
            '  const avg = kg / reps',
            broken ? '  return reps + avg' : '  return reps * avg',
            '}',
          ]}
          highlight={broken ? [6] : []}
        />
      )}
      <g opacity={appear(frame, b(5) + 76)}>
        <Pill x={S7.code.x + S7.code.w / 2} y={S7.code.y + 324} text="* → +  поломка нарочно" color={theme.risk} fill={theme.riskTint} size={22} />
      </g>
      {[
        { title: 'Тесты покраснели', sub: 'заметили — им можно верить', ok: true },
        { title: 'Тесты зелёные', sub: 'ничего не проверяют', ok: false },
      ].map((o, i) => {
        const g = appear(frame, outcomeAt[i])
        const y = OC.y + i * (OC.h + OC.gap)
        return (
          <g key={o.title} opacity={g} transform={`translate(${(1 - g) * 16} 0)`}>
            <Card x={OC.x} y={y} w={OC.w} h={OC.h} stroke={o.ok ? theme.ok : theme.risk} fill={o.ok ? theme.okTint : theme.riskTint}>
              <Label x={OC.x + 28} y={y + 60} anchor="start" size={26} weight={700} color={o.ok ? theme.ok : theme.risk}>
                {o.title}
              </Label>
              <Label x={OC.x + 28} y={y + 104} anchor="start" size={22} weight={500}>
                {o.sub}
              </Label>
            </Card>
            <Mark x={OC.x + OC.w - 44} y={y + OC.h / 2} ok={o.ok} r={22} />
          </g>
        )
      })}

      {/* итог главы */}
      <rect x={S7.code.x - 100} y={40} width={1400} height={600} fill={theme.paper} opacity={dim} />
      <g opacity={recap}>
        <Card x={RC.x} y={RC.y} w={RC.w} h={RC.h} stroke={theme.accent} />
        <Label x={RC.x + RC.w / 2} y={RC.y + 50} size={28} weight={700}>
          Код от ИИ — ваш код
        </Label>
      </g>
      {RECAP.map((r, i) => {
        const g = appear(frame, recapAt[i])
        const cx = RC.x + RC.w / 8 + (i * RC.w) / 4
        const cy = RC.y + 140
        return (
          <g key={r.title} opacity={g} transform={`translate(0 ${(1 - g) * 12})`}>
            {i === 0 && <Magnifier x={cx - 8} y={cy - 8} r={26} />}
            {i === 1 && (
              <g>
                <circle cx={cx} cy={cy} r={30} fill={theme.riskTint} stroke={theme.risk} strokeWidth={4} />
                <text x={cx} y={cy + 9} textAnchor="middle" fill={theme.risk} style={{ font: `700 26px ${theme.font}` }}>
                  7
                </text>
              </g>
            )}
            {i === 2 && [0, 1, 2].map((k) => <rect key={k} x={cx - 36} y={cy - 32 + k * 24} width={72} height={18} rx={5} fill={theme.okTint} stroke={theme.ok} strokeWidth={2.5} />)}
            {i === 3 && <Mark x={cx} y={cy} ok r={30} />}
            <Label x={cx} y={cy + 76} size={24} weight={700}>
              {r.title}
            </Label>
            <Label x={cx} y={cy + 106} size={20} weight={500} color={theme.soft}>
              {r.sub}
            </Label>
          </g>
        )
      })}
    </KitScene>
  )
}
