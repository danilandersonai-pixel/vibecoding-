import { interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { useAppear, useTrack } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { CLAMP } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Cloud, Mark } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { AgentChat } from '../../kit/screens/AgentChat'
import { Diff } from '../../kit/screens/Diff'
import { Terminal, type TermLine } from '../../kit/screens/Terminal'
import { theme } from '../../theme'
import { S3 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Flag } from './parts'

const ID = 's3-git'
const C = S3.commits
const MAIN = S3.mainY
const BRANCH = S3.branchY
// агент на «уровне»: центр фигуры над линией (ноги — на линии)
const ON_MAIN = MAIN - 39
const ON_BRANCH = BRANCH - 39

const TERM: { line: TermLine; at: number }[] = [
  { line: { text: 'claude', kind: 'cmd' }, at: 0 },
  { line: { text: '> Добавь форму подхода', kind: 'out' }, at: 40 },
  { line: { text: 'Читаю workout.ts…', kind: 'out' }, at: 75 },
  { line: { text: '✓ Готово: форма подхода', kind: 'ok' }, at: 110 },
]

// Точка-сохранение (коммит): кружок на линии, флажок и подпись.
function Commit({ x, y, at, up, text, color = theme.accent, below = true }: { x: number; y: number; at: number; up: number; text: string; color?: string; below?: boolean }) {
  const frame = useCurrentFrame()
  const on = interpolate(frame, [at, at + 10], [0, 1], CLAMP)
  return (
    <g opacity={on}>
      <Flag cx={x} cy={y} up={up} color={color} />
      <circle cx={x} cy={y} r={14} fill={color} stroke={theme.paper} strokeWidth={4} />
      <Label x={x} y={below ? y + 42 : y + 34} size={20} color={theme.ink} weight={600}>
        {text}
      </Label>
    </g>
  )
}

// Сцена 3: агент работает в терминале; Git — сохранения в игре: коммиты, репозиторий на GitHub,
// откат после поломки, ветка для опытов, дифф и пул-реквест; привычка «коммит перед правкой».
export function S3Git() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()
  const flag = (at: number) => interpolate(frame, [at, at + 12], [0, 1], CLAMP)

  // агент: у терминала → на уровень → по сохранениям → в яму → снова у «графика веса» → по ветке → влили
  const walk = useTrack([
    [b(1) + 20, 760, 200],
    [b(1) + 50, C.start, ON_MAIN],
    [b(2) + 10, C.start, ON_MAIN],
    [b(2) + 40, C.form, ON_MAIN],
    [b(2) + 70, C.form, ON_MAIN],
    [b(2) + 100, C.chart, ON_MAIN],
    [b(4) + 20, C.chart, ON_MAIN],
    [b(4) + 50, C.pit, ON_MAIN],
    [b(4) + 65, C.pit, ON_MAIN + 50],
    [b(4) + 104, C.chart, ON_MAIN],
    [b(5) + 60, C.chart, ON_MAIN],
    [b(5) + 70, S3.branchUp, ON_MAIN],
    [b(5) + 90, S3.branchUp + 100, ON_BRANCH],
    [b(5) + 115, C.screen, ON_BRANCH],
    [b(6) + 40, C.screen, ON_BRANCH],
    [b(6) + 90, C.fixes, ON_BRANCH],
    [b(7) + 100, C.fixes, ON_BRANCH],
    [b(7) + 120, S3.branchDown, ON_BRANCH],
    [b(7) + 135, C.merged, ON_MAIN],
  ])
  const agentScale = interpolate(frame, [b(1) + 20, b(1) + 50], [0.9, 0.55], CLAMP)
  const fallen = frame >= b(4) + 65 && frame < b(4) + 104
  const fall = interpolate(frame, [b(4) + 50, b(4) + 65], [1, 0], CLAMP)
  const moving = [
    [b(1) + 20, b(1) + 50],
    [b(2) + 10, b(2) + 40],
    [b(2) + 70, b(2) + 100],
    [b(4) + 20, b(4) + 50],
    [b(5) + 60, b(5) + 115],
    [b(6) + 40, b(6) + 90],
    [b(7) + 100, b(7) + 135],
  ].some(([a, z]) => frame > a && frame < z)
  // на старте уровня агент подпрыгивает — как герой игры
  const hop = frame >= b(1) + 95 && frame < b(1) + 113 ? -Math.sin(((frame - b(1) - 95) / 18) * Math.PI) * 22 : 0
  const bob = (moving && frame > b(1) + 50 ? -Math.abs(Math.sin(frame / 3)) * 4 : 0) + hop
  const saves = [b(1) + 60, b(2) + 40, b(2) + 100, b(4) + 104, b(5) + 115, b(6) + 90, b(7) + 135, b(8) + 80]
  const justSaved = saves.some((s) => frame >= s && frame < s + 25)
  const pose: AgentPose = frame < b(1) ? stepAt<AgentPose>(frame, [[0, 'idle'], [b(0) + 40, 'working'], [b(0) + 110, 'done']]) : justSaved ? 'done' : moving ? 'working' : 'idle'

  // терминал: строки появляются по одной
  const term = TERM.filter((t) => frame >= b(0) + t.at).map((t) => t.line)
  const termOut = interpolate(frame, [b(1) + 10, b(1) + 30], [1, 0], CLAMP)

  // уровень, сохранения, облако
  const ground = interpolate(frame, [b(1) + 10, b(1) + 60], [0, 1], CLAMP)
  const toast = (at: number) => interpolate(frame, [at, at + 8, at + 60, at + 70], [0, 1, 1, 0], CLAMP)
  // облако уходит до наезда на яму, чтобы его не резал край кадра
  const cloud = useAppear(b(3) + 5) * interpolate(frame, [b(4) - 10, b(4)], [1, 0], CLAMP)
  const upload = interpolate(frame, [b(3) + 40, b(3) + 70], [0, 1], CLAMP)
  const repoWord = useAppear(b(3) + 60)

  // поломка и откат
  const pit = useAppear(b(4) + 10) * interpolate(frame, [b(5), b(5) + 20], [1, 0], CLAMP)
  const broken = useAppear(b(4) + 50)
  const back = interpolate(frame, [b(4) + 75, b(4) + 105], [0, 1], CLAMP)
  const backWord = useAppear(b(4) + 90) * interpolate(frame, [b(5) + 10, b(5) + 24], [1, 0], CLAMP)

  // ветка, дифф, пул-реквест
  const branch = interpolate(frame, [b(5) + 20, b(5) + 60, b(6) + 20, b(6) + 60], [0, 0.42, 0.42, 1], CLAMP)
  const branchWord = useAppear(b(5) + 40)
  const mainSafe = useAppear(b(5) + 120)
  const pr = useAppear(b(7) + 5)
  const checks = useAppear(b(7) + 50)
  const approved = useAppear(b(7) + 70)
  const pressed = frame >= b(7) + 90 && frame < b(7) + 100
  const merge = interpolate(frame, [b(7) + 95, b(7) + 120], [0, 1], CLAMP)
  const mergedWord = useAppear(b(7) + 110)
  const diffOut = interpolate(frame, [b(8), b(8) + 10], [1, 0], CLAMP)

  const branchPath = `M${C.chart} ${MAIN} H${S3.branchUp} C ${S3.branchUp + 50} ${MAIN}, ${S3.branchUp + 50} ${BRANCH}, ${S3.branchUp + 100} ${BRANCH} H${S3.branchDown}`
  const mergePath = `M${S3.branchDown} ${BRANCH} C ${S3.branchDown + 50} ${BRANCH}, ${C.merged - 50} ${MAIN}, ${C.merged} ${MAIN}`

  return (
    <KitScene chip="3 / 6 · Git — сохранения в игре" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* терминал: агент работает текстом */}
      <g opacity={termOut}>
        <Terminal x={S3.term.x} y={S3.term.y} w={S3.term.w} at={b(0) + 5} lines={term} />
      </g>

      {/* уровень игры: основная линия проекта */}
      <line x1={70} y1={MAIN} x2={70 + (2490 - 70) * ground} y2={MAIN} stroke={theme.line} strokeWidth={6} strokeLinecap="round" opacity={ground > 0 ? 1 : 0} />

      {/* яма «график сломан» и откат */}
      <g opacity={pit}>
        <rect x={C.pit - 30} y={MAIN - 8} width={60} height={16} fill={theme.paper} />
        <path d={`M${C.pit - 30} ${MAIN - 6} l8 12 l8 -12 l8 12 l8 -12 l8 12 l8 -12 l6 10`} fill="none" stroke={theme.risk} strokeWidth={3} />
        <g opacity={broken}>
          <Mark x={C.pit} y={MAIN - 50} ok={false} r={16} />
          <Label x={C.pit} y={MAIN + 42} size={20} color={theme.risk} weight={600}>
            график сломан
          </Label>
        </g>
      </g>
      <path d={`M${C.pit - 6} ${MAIN + 50} C ${C.pit - 40} ${MAIN + 100}, ${C.chart + 60} ${MAIN + 100}, ${C.chart + 8} ${MAIN + 58}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - back} fill="none" stroke={theme.accent} strokeWidth={4} opacity={backWord > 0 || back < 1 ? 1 : 0} />
      <g opacity={backWord}>
        <path d={`M${C.chart + 8} ${MAIN + 58} l16 2 l-6 14 Z`} fill={theme.accent} />
        <Label x={(C.pit + C.chart) / 2} y={MAIN + 104} size={22} color={theme.accent} weight={700}>
          откат
        </Label>
      </g>

      {/* ветка: копия для опытов; вливается в главную после проверки */}
      <path d={branchPath} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - branch} fill="none" stroke={theme.alt} strokeWidth={5} />
      <path d={mergePath} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - merge} fill="none" stroke={theme.alt} strokeWidth={5} />
      <g opacity={branchWord}>
        <Label x={1190} y={BRANCH - 14} size={22} color={theme.alt} weight={700}>
          ветка
        </Label>
      </g>
      <g opacity={mainSafe}>
        <Label x={1130} y={MAIN + 42} size={20} color={theme.soft} weight={600}>
          главная версия цела
        </Label>
      </g>

      {/* сохранения */}
      <Commit x={C.start} y={MAIN} at={b(1) + 55} up={flag(b(1) + 60)} text="начало" />
      <Commit x={C.form} y={MAIN} at={b(2) + 30} up={flag(b(2) + 40)} text="форма подхода" />
      <Commit x={C.chart} y={MAIN} at={b(2) + 90} up={flag(b(2) + 100)} text="график веса" />
      <Commit x={C.screen} y={BRANCH} at={b(5) + 105} up={flag(b(5) + 115)} text="новый экран" color={theme.alt} />
      <Commit x={C.fixes} y={BRANCH} at={b(6) + 80} up={flag(b(6) + 90)} text="правки" color={theme.alt} />
      <Commit x={C.merged} y={MAIN} at={b(7) + 120} up={flag(b(7) + 125)} text="экран влит" />
      <Commit x={C.before} y={MAIN} at={b(8) + 70} up={flag(b(8) + 80)} text="до графика" />
      {[
        { at: b(2) + 40, x: C.form, text: 'сохранено: форма подхода' },
        { at: b(2) + 100, x: C.chart, text: 'сохранено: график веса' },
        { at: b(8) + 80, x: C.before, text: 'сохранено: до графика' },
      ].map((t) => (
        <g key={t.text} opacity={toast(t.at)}>
          <Card x={t.x - 135} y={MAIN - 136} w={270} h={40} stroke={theme.accent} fill={theme.paper}>
            <Label x={t.x} y={MAIN - 109} size={20} color={theme.accent} weight={600}>
              {t.text}
            </Label>
          </Card>
        </g>
      ))}

      {/* агент-игрок */}
      {!fallen && (
        <g opacity={frame >= b(4) + 50 && frame < b(4) + 65 ? fall : 1}>
          <Agent x={walk.x} y={walk.y + bob} scale={agentScale} {...(frame < b(1) + 20 ? {} : { label: '' })} enterAt={frame < b(4) + 104 ? b(0) + 10 : b(4) + 104} pose={pose} />
        </g>
      )}

      {/* GitHub: репозиторий — проект со всей историей */}
      <g opacity={cloud}>
        <Cloud x={S3.cloud.x} y={S3.cloud.y} w={S3.cloud.w} h={S3.cloud.h} stroke={theme.accent} />
        <Label x={S3.cloud.x + S3.cloud.w / 2} y={S3.cloud.y + 110} size={28} weight={700}>
          GitHub
        </Label>
        <g opacity={repoWord}>
          <Label x={S3.cloud.x + S3.cloud.w / 2} y={S3.cloud.y + 144} size={20} color={theme.accent} weight={600}>
            репозиторий: проект + история
          </Label>
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={S3.cloud.x + S3.cloud.w / 2 - 40 + i * 40} cy={S3.cloud.y + 166} r={8} fill={theme.accent} />
          ))}
          <line x1={S3.cloud.x + S3.cloud.w / 2 - 40} y1={S3.cloud.y + 166} x2={S3.cloud.x + S3.cloud.w / 2 + 40} y2={S3.cloud.y + 166} stroke={theme.accent} strokeWidth={3} />
        </g>
      </g>
      <path d={`M${C.chart + 40} ${MAIN - 90} C ${C.chart + 120} ${MAIN - 160}, ${S3.cloud.x - 40} ${S3.cloud.y + S3.cloud.h}, ${S3.cloud.x + 40} ${S3.cloud.y + S3.cloud.h - 6}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - upload} fill="none" stroke={theme.accent} strokeWidth={3} opacity={upload > 0 ? 0.8 * interpolate(frame, [b(4) - 10, b(4)], [1, 0], CLAMP) : 0} />

      {/* доска 2: дифф и пул-реквест; в конце — чат «сделай коммит» */}
      {frame >= b(6) && frame < b(8) + 10 && (
        <g opacity={diffOut}>
          <Diff
            x={S3.diff.x}
            y={S3.diff.y}
            w={S3.diff.w}
            at={b(6) + 30}
            lines={[
              { text: '<h1>Подходы</h1>', kind: 'same' },
              { text: '<button>Сохранить</button>', kind: 'del' },
              { text: '<button>Сохранить подход</button>', kind: 'add' },
              { text: '<p>Объём: 480 кг</p>', kind: 'add' },
            ]}
          />
        </g>
      )}
      {frame >= b(8) && (
        <AgentChat
          x={S3.diff.x}
          y={S3.diff.y}
          w={S3.diff.w}
          at={b(8) + 5}
          messages={[
            { from: 'me', text: 'Перед графиком сделай коммит' },
            { from: 'agent', text: 'Готово: коммит «до графика».' },
          ]}
        />
      )}
      <g opacity={pr}>
        <Card x={S3.pr.x} y={S3.pr.y} w={S3.pr.w} h={S3.pr.h}>
          <Label x={S3.pr.x + 22} y={S3.pr.y + 36} anchor="start" size={22} weight={700}>
            Пул-реквест: новый экран
          </Label>
          <text x={S3.pr.x + 22} y={S3.pr.y + 72} style={{ font: `500 20px ${theme.mono}` }} fill={theme.ink}>
            SetScreen.tsx <tspan fill={theme.ok}>+2</tspan> <tspan fill={theme.risk}>−1</tspan>
          </text>
          <g opacity={checks}>
            <Label x={S3.pr.x + 22} y={S3.pr.y + 106} anchor="start" size={20} color={theme.ok} weight={600}>
              ✓ проверки пройдены
            </Label>
          </g>
          <g opacity={approved}>
            <Label x={S3.pr.x + 22} y={S3.pr.y + 136} anchor="start" size={20} color={theme.ok} weight={600}>
              ✓ изменения одобрены
            </Label>
          </g>
          <rect x={S3.pr.x + 22} y={S3.pr.y + 154} width={150} height={44} rx={10} fill={pressed ? theme.ink : theme.ok} />
          <Label x={S3.pr.x + 97} y={S3.pr.y + 184} size={22} color={theme.paper} weight={700}>
            Merge
          </Label>
          <g opacity={mergedWord}>
            <Label x={S3.pr.x + 192} y={S3.pr.y + 184} anchor="start" size={22} color={theme.alt} weight={700}>
              ветка влита в главную
            </Label>
          </g>
        </Card>
      </g>
    </KitScene>
  )
}
