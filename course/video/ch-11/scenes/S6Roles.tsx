import { interpolate, useCurrentFrame } from 'remotion'
import { Agent } from '../../actors/Agent'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP, trackAt } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Mark, Pill } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { theme } from '../../theme'
import { S6 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { CodeCard, MiniBot, Sun } from './parts'

const ID = 's6-roles'
const R = S6.roles
const AX = S6.axis
const BR = S6.bars
const F = S6.funnel
const CH = S6.chart

// где стоит Дима на каждой роли (масштаб 0,65: ступни на 45 ниже центра)
const SPOT = R.map((r) => ({ x: r.x + 56, y: r.top - 45 }))
const CODE = ['if (reps > 0)', '  save(set)']
// продолжение линии выше последнего столбика: следующее удвоение не помещается в график
const GUESS_H = S6.bars.hs[4] + 28

// Сцена 6: роль разработчика меняется — автор, редактор, постановщик, оркестратор; в один день Дима
// и автор, и оркестратор; основа неизменна. Горизонт задач METR растёт, продолжение линии — не гарантия;
// узким местом, вероятно, станет проверка.
export function S6Roles() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // лестница ролей: первая сразу, остальные — когда их называют
  const shown = [appear(frame, b(0) + 6), appear(frame, b(1) + 30), appear(frame, b(1) + 46), appear(frame, b(1) + 62)]
  const code = appear(frame, b(0) + 30) * (1 - appear(frame, b(0) + 150)) + appear(frame, b(1) + 128) * (1 - appear(frame, b(1) + 176))
  const codeStart = frame < b(1) ? b(0) + 40 : b(1) + 132
  const up = appear(frame, b(0) + 120, 20) * (1 - appear(frame, b(1) + 40))

  // Дима: вверх по ролям, утром — вниз к коду, днём — наверх к агентам
  const hop = (at: number, a: { x: number; y: number }, z: { x: number; y: number }): [number, number, number][] => [
    [at, a.x, a.y],
    [at + 12, (a.x + z.x) / 2, Math.min(a.y, z.y) - 70],
    [at + 24, z.x, z.y],
  ]
  const dima = trackAt(frame, [...hop(b(1) + 26, SPOT[0], SPOT[1]), ...hop(b(1) + 52, SPOT[1], SPOT[2]), ...hop(b(1) + 78, SPOT[2], SPOT[3]), ...hop(b(1) + 112, SPOT[3], SPOT[0]), ...hop(b(1) + 158, SPOT[0], SPOT[3])])
  const pose = stepAt<[Pose, Mood]>(frame, [
    [0, ['think', 'neutral']],
    [b(0) + 120, ['point', 'neutral']],
    [b(1) + 20, ['stand', 'neutral']],
    [b(1) + 136, ['think', 'neutral']],
    [b(1) + 182, ['point', 'happy']],
    [b(2) + 40, ['cheer', 'happy']],
    [b(3), ['stand', 'happy']],
  ])
  const sun = trackAt(frame, [
    [b(1) + 140, S6.sun.morning.x, S6.sun.morning.y],
    [b(1) + 170, S6.sun.day.x, S6.sun.day.y],
  ])
  const sunOn = appear(frame, b(1) + 100) * (1 - appear(frame, b(2) + 20))
  const bots = appear(frame, b(1) + 180)
  const base = appear(frame, b(2) + 10)

  // доска 2: горизонт задач — столбики удваиваются; продолжение линии — догадка
  // первые три столбика встают сразу после переезда камеры, ещё до реплики про METR
  const axis = appear(frame, b(2) + 176)
  const barAt = [b(2) + 184, b(2) + 192, b(2) + 200, b(3) + 56, b(3) + 70]
  const early = appear(frame, b(3) + 24)
  const late = appear(frame, b(3) + 96)
  const guess = appear(frame, b(4) + 20)
  const guessUp = interpolate(frame, [b(4) + 20, b(4) + 50], [0, 1], CLAMP)
  const noPromise = appear(frame, b(4) + 70)
  // справа агент, пока речь о горизонте; с реплики об узком месте его сменяет воронка
  const watcher = appear(frame, b(2) + 176) * (1 - appear(frame, b(5) + 2))
  const funnel = appear(frame, b(5) + 4)

  // узкое место: кода много, проверка узкая
  const pileAt = (i: number) => b(5) + 8 + i * 3
  const neck = appear(frame, b(5) + 30)
  const narrow = appear(frame, b(5) + 44)
  const outAt = [b(5) + 56, b(5) + 72, b(5) + 88]
  const learn = appear(frame, b(5) + 80)

  return (
    <KitScene chip="6 / 7 · Как меняется роль" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* лестница ролей */}
      {R.map((r, i) => {
        const h = S6.ground - r.top
        const a = shown[i]
        return (
          <g key={r.name}>
            <rect x={r.x} y={r.top} width={r.w} height={h} fill="none" stroke={theme.line} strokeWidth={3} strokeDasharray="10 8" opacity={1 - a} />
            <g opacity={a}>
              <rect x={r.x} y={r.top} width={r.w} height={h} fill={i === 3 ? theme.accentTint : theme.zone} stroke={theme.ink} strokeWidth={3} />
              <rect x={r.x} y={r.top - 6} width={r.w} height={10} rx={3} fill={i === 3 ? theme.accent : theme.ink} />
              <Label x={r.x + r.w / 2} y={r.top + 34} size={24} weight={700} color={i === 3 ? theme.accent : theme.ink}>
                {r.name}
              </Label>
              <Label x={r.x + r.w / 2} y={r.top + 62} size={20} weight={600} color={theme.soft}>
                {r.desc}
              </Label>
              {r.era.map((e, j) => (
                <Label key={e} x={r.x + r.w - 12} y={r.top - 18 - (r.era.length - 1 - j) * 22} anchor="end" size={18} weight={600} color={theme.alt}>
                  {e}
                </Label>
              ))}
            </g>
          </g>
        )
      })}
      <g opacity={up}>
        <Arrow x1={SPOT[0].x + 200} y1={SPOT[0].y - 30} x2={SPOT[2].x + 120} y2={SPOT[2].y - 60} color={theme.accent} dashed />
        <Pill x={SPOT[1].x + 150} y={SPOT[1].y - 120} w={290} text="задачи — всё чаще" color={theme.accent} fill={theme.accentTint} size={20} compact />
      </g>

      {/* утро: код сам; день: агенты */}
      <g opacity={code}>
        <CodeCard x={S6.code.x} y={S6.code.y} w={S6.code.w} h={S6.code.h} lines={CODE.map((l, i) => typed(l, frame, codeStart + i * 12, 30))} />
      </g>
      <g opacity={sunOn}>
        <Sun x={sun.x} y={sun.y} />
        <Label x={sun.x + 48} y={sun.y + 8} anchor="start" size={22} weight={700} color={theme.alt}>
          {frame >= b(1) + 156 ? 'день' : 'утро'}
        </Label>
      </g>
      <g opacity={bots}>
        {S6.bots.ys.map((y) => (
          <MiniBot key={y} x={S6.bots.x} y={y + 40} s={1.1} light={theme.ok} />
        ))}
      </g>
      <Coach x={dima.x} y={dima.y} scale={0.65} color={theme.alt} enterAt={b(0) + 16} pose={pose[0]} mood={pose[1]} />
      <g opacity={appear(frame, b(0) + 24)}>
        <Label x={dima.x - 52} y={dima.y - 40} anchor="end" size={20} weight={700} color={theme.alt}>
          Дима
        </Label>
      </g>

      {/* основа под всеми ролями */}
      <g opacity={base} transform={`translate(0 ${(1 - base) * 12})`}>
        <rect x={S6.base.x} y={S6.base.y} width={S6.base.w} height={S6.base.h} rx={10} fill={theme.okTint} stroke={theme.ok} strokeWidth={3} />
        <Mark x={S6.base.x + 34} y={S6.base.y + S6.base.h / 2} ok r={16} />
        <Label x={S6.base.x + S6.base.w / 2 + 16} y={S6.base.y + 36} size={22} weight={700}>
          Основа: отвечаете за результат и понимаете, что выпускаете
        </Label>
      </g>

      {/* доска 2: горизонт задач */}
      <Card x={CH.x} y={CH.y} w={CH.w} h={CH.h} stroke={theme.line}>
        <Label x={CH.x + 24} y={CH.y + 40} anchor="start" size={24} weight={700}>
          Горизонт задач агентов · METR
        </Label>
      </Card>
      <g opacity={axis}>
        <line x1={AX.x0} y1={AX.y} x2={AX.x1} y2={AX.y} stroke={theme.ink} strokeWidth={3} />
        <line x1={AX.x0} y1={AX.y} x2={AX.x0} y2={AX.top - 20} stroke={theme.ink} strokeWidth={3} />
        <Label x={AX.x0 + 12} y={AX.top - 16} anchor="start" size={18} weight={600} color={theme.soft}>
          длина задачи
        </Label>
        <Label x={AX.x1} y={AX.y + 30} anchor="end" size={18} weight={600} color={theme.soft}>
          время →
        </Label>
      </g>
      {BR.xs.map((x, i) => {
        const g = appear(frame, barAt[i], 14)
        return <rect key={x} x={x - BR.w / 2} y={AX.y - BR.hs[i] * g} width={BR.w} height={BR.hs[i] * g} rx={4} fill={i < 3 ? theme.line : theme.accent} />
      })}
      <g opacity={early}>
        <path d={`M${BR.xs[0]} ${AX.y + 12} v8 H${BR.xs[2]} v-8`} fill="none" stroke={theme.soft} strokeWidth={2.5} />
        <Label x={(BR.xs[0] + BR.xs[2]) / 2} y={AX.y + 44} size={18} weight={700} color={theme.soft}>
          ×2 за 4–7 мес.
        </Label>
      </g>
      <g opacity={late}>
        <path d={`M${BR.xs[2]} ${AX.y + 12} v8 H${BR.xs[4]} v-8`} fill="none" stroke={theme.accent} strokeWidth={2.5} />
        <Label x={(BR.xs[2] + BR.xs[4]) / 2 + 40} y={AX.y + 44} size={18} weight={700} color={theme.accent}>
          ×2 примерно за 3–4 мес.
        </Label>
        <Label x={(BR.xs[2] + BR.xs[4]) / 2 + 40} y={AX.y + 68} size={18} weight={600} color={theme.soft}>
          оценки начала 2026
        </Label>
      </g>
      <g opacity={guess}>
        {/* продолжение линии: выше последнего столбика и со стрелкой — дальше графика */}
        <rect x={BR.next - BR.w / 2} y={AX.y - GUESS_H * guessUp} width={BR.w} height={GUESS_H * guessUp} rx={4} fill="none" stroke={theme.alt} strokeWidth={3} strokeDasharray="7 6" />
        <path d={`M${BR.next} ${AX.y - GUESS_H - 12} l-10 14 h20 Z`} fill={theme.alt} opacity={guessUp >= 1 ? 1 : 0} />
        <Label x={BR.next + 34} y={AX.top + 40} anchor="start" size={20} weight={700} color={theme.alt}>
          задачи
        </Label>
        <Label x={BR.next + 34} y={AX.top + 66} anchor="start" size={20} weight={700} color={theme.alt}>
          на недели?
        </Label>
      </g>
      <g opacity={noPromise}>
        <Pill x={BR.next + 96} y={AX.y - 60} w={170} text="не гарантия" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>

      <g opacity={watcher}>
        <Agent x={S6.watcher.x} y={S6.watcher.y} scale={0.9} enterAt={b(2) + 176} pose={frame >= b(3) && frame < b(4) + 60 ? 'working' : 'idle'} />
      </g>

      {/* узкое место — проверка */}
      <path
        d={`M${F.x - F.wTop / 2} ${F.top} L${F.x - F.wNeck / 2} ${F.neck} V${F.neck + 50} M${F.x + F.wTop / 2} ${F.top} L${F.x + F.wNeck / 2} ${F.neck} V${F.neck + 50}`}
        fill="none"
        stroke={theme.ink}
        strokeWidth={4}
        opacity={funnel}
      />
      <g opacity={appear(frame, pileAt(0))}>
        <Label x={F.x} y={F.top - 96} size={20} weight={600} color={theme.soft}>
          код от агентов
        </Label>
      </g>
      {Array.from({ length: 15 }, (_, i) => {
        const row = Math.floor(i / 5)
        const col = i % 5
        const a = appear(frame, pileAt(i), 8)
        return <rect key={i} x={F.x - 170 + col * 70} y={F.top - 74 + row * 26 + (1 - a) * -20} width={60} height={20} rx={5} fill={theme.accentTint} stroke={theme.accent} strokeWidth={2} opacity={a} />
      })}
      <g opacity={neck}>
        <Pill x={F.x} y={F.neck} w={150} text="проверка" color={theme.accent} fill={theme.paper} size={22} />
      </g>
      <g opacity={narrow}>
        <Label x={F.x + 64} y={F.neck + 44} anchor="start" size={20} weight={700} color={theme.alt}>
          узкое место
        </Label>
      </g>
      {outAt.map((at, i) => (
        <g key={at} opacity={appear(frame, at, 8)}>
          <Mark x={F.x - 50 + i * 50} y={F.neck + 96} ok r={16} />
        </g>
      ))}
      <g opacity={learn}>
        <Pill x={S6.learn.x} y={S6.learn.y} w={420} text="учитесь ставить задачи и проверять" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
    </KitScene>
  )
}
