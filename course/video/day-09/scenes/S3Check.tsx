import { interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Database } from '../../actors/Database'
import { Phone } from '../../actors/Phone'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Mark, PhoneScreen, Pill, Slot } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { Diff, type DiffLine } from '../../kit/screens/Diff'
import { Editor } from '../../kit/screens/Editor'
import { diffHeight, terminalHeight } from '../../kit/screens/layout'
import { Terminal } from '../../kit/screens/Terminal'
import { theme } from '../../theme'
import { PHONE_SCALE, S3, S3_LIST_H, TERM_GREEN, TERM_RED, TEST_CODE } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Strike } from './parts'

const ID = 's3-check'
const LI = S3.list
const N = S3.notes

const CHECKS = ['Назначить шаблон, записать тренировку', 'Заменить упражнение — прошлое прежнее', 'Удалить упражнение — подходы на месте']
const NOTES = [
  { y: N.y1, slot: 'прошлое?', text: '✓ план тот же' },
  { y: N.y2, slot: 'подходы?', text: '✓ подходы на месте' },
]
// поломка нарочно: тренировка снова ссылается на шаблон вместо копии плана — и обратно
const BREAK: DiffLine[] = [
  { text: '  plan: copyOf(tpl.plan),', kind: 'del' },
  { text: '  templateId: tpl.id,', kind: 'add' },
]
const FIX: DiffLine[] = [
  { text: '  templateId: tpl.id,', kind: 'del' },
  { text: '  plan: copyOf(tpl.plan),', kind: 'add' },
]

// Сцена 3 (проверьте у себя): назначить шаблон тестовой подопечной и записать тренировку, заменить упражнение
// и повторы — прошлое прежнее, удалить упражнение — подходы на месте. Доска 2: тест от требования на тестовой базе,
// поломка нарочно (красный прогон), возврат копии (зелёный) — ошибка не вернётся незаметно.
export function S3Check() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: чек-лист, телефон тестовой подопечной, правки шаблона
  const listIn = appear(frame, b(0) + 10)
  const rowAt = CHECKS.map((_, i) => b(0) + 24 + i * 10)
  const markAt = [b(0) + 150, b(1) + 150, b(2) + 140]
  const active = frame < b(1) ? 0 : frame < b(2) ? 1 : frame < b(3) ? 2 : -1
  const tapAt = b(0) + 90
  const edit = appear(frame, b(1) + 40)
  const del = appear(frame, b(2) + 30)
  const noteAt = [b(1) + 110, b(2) + 100]
  const slots = appear(frame, b(1) + 24)
  // повторная проверка на телефоне — вспышка рамки экрана после каждой правки
  const recheck = [b(1) + 86, b(2) + 76].some((at) => frame >= at && frame < at + 16)

  // доска 2: тест, агент и тестовая база, поломка и прогоны
  const editorAt = b(3) + 20
  const toDb = interpolate(frame, [b(3) + 70, b(3) + 86], [0, 1], CLAMP)
  const live = appear(frame, b(3) + 96)
  const liveStrike = interpolate(frame, [b(3) + 110, b(3) + 122], [0, 1], CLAMP)
  const holders = appear(frame, b(3) + 40)
  const breakAt = b(5) + 16
  const fixAt = b(6) + 10
  const redAt = b(5) + 50
  const greenAt = b(6) + 40
  const redOk = appear(frame, b(5) + 140) * (frame < greenAt ? 1 : 0)
  const greenOk = appear(frame, b(6) + 100)
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(3) + 50, 'working'],
    [b(4) + 100, 'done'],
    [b(5) + 44, 'working'],
    [b(5) + 120, 'done'],
    [b(6) + 30, 'working'],
    [b(6) + 96, 'done'],
  ])

  return (
    <KitScene chip="3 / 3 · Проверьте у себя" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* чек-лист «проверьте у себя» */}
      <g opacity={listIn} transform={`translate(0 ${(1 - listIn) * 14})`}>
        <Card x={LI.x} y={LI.y} w={LI.w} h={S3_LIST_H} stroke={theme.accent} fill={theme.white}>
          <Label x={LI.x + 24} y={LI.y + 42} anchor="start" size={24} weight={700} color={theme.accent}>
            Проверьте у себя
          </Label>
          {CHECKS.map((t, i) => {
            const cy = LI.y + 64 + i * LI.row + LI.row / 2
            return (
              <g key={t} opacity={appear(frame, rowAt[i], 8)}>
                <line x1={LI.x + 18} y1={cy - LI.row / 2} x2={LI.x + LI.w - 18} y2={cy - LI.row / 2} stroke={theme.grid} strokeWidth={2} />
                {active === i && <rect x={LI.x + 8} y={cy - LI.row / 2 + 6} width={LI.w - 16} height={LI.row - 12} rx={10} fill={theme.accentTint} />}
                <circle cx={LI.x + 40} cy={cy} r={16} fill={theme.white} stroke={theme.accent} strokeWidth={3} />
                <Label x={LI.x + 40} y={cy + 7} size={20} weight={700} color={theme.accent}>
                  {String(i + 1)}
                </Label>
                <Label x={LI.x + 70} y={cy + 8} anchor="start" size={22} weight={600}>
                  {t}
                </Label>
                <circle cx={LI.x + LI.w - 40} cy={cy} r={16} fill="none" stroke={theme.grid} strokeWidth={2} strokeDasharray="4 4" />
                <g opacity={appear(frame, markAt[i], 8)}>
                  <Mark x={LI.x + LI.w - 40} y={cy} ok r={16} />
                </g>
              </g>
            )
          })}
        </Card>
      </g>

      {/* правки шаблона: замена, затем удаление */}
      <g opacity={edit}>
        <Pill x={S3.changes.x} y={S3.changes.y1} w={380} text="в шаблоне: Жим гантелей 3×12" color={theme.alt} fill={theme.altTint} size={20} compact />
      </g>
      <g opacity={del}>
        <Pill x={S3.changes.x} y={S3.changes.y2} w={400} text="из шаблона удалён жим гантелей" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>

      {/* телефон тестовой подопечной: прошлая тренировка */}
      <Phone x={S3.phone.x} y={S3.phone.y} scale={PHONE_SCALE} enterAt={b(0) + 30}>
        <PhoneScreen tapAt={tapAt} listAt={tapAt + 12} list={['Жим лёжа', '3×10, 40 кг', '✓ сделано']} label="Пн · неделя 1" />
        {recheck && <rect x={-54} y={-92} width={108} height={184} rx={6} fill="none" stroke={theme.ok} strokeWidth={4} />}
      </Phone>
      <g opacity={appear(frame, b(0) + 36)}>
        <Label x={S3.phone.x} y={S3.phone.y + 110 * PHONE_SCALE + 36} size={22} weight={600}>
          Тестовая подопечная
        </Label>
      </g>
      {NOTES.map((n, i) => {
        const g = appear(frame, noteAt[i])
        return (
          <g key={n.text}>
            <g opacity={slots * (1 - g)}>
              <Slot x={N.x - 125} y={n.y - 18} w={250} h={36} r={18} text={n.slot} />
            </g>
            <g opacity={g}>
              <Pill x={N.x} y={n.y} w={250} text={n.text} color={theme.ok} fill={theme.okTint} size={20} compact />
            </g>
          </g>
        )
      })}

      {/* доска 2: тест от требования */}
      {frame >= editorAt && <Editor x={S3.editor.x} y={S3.editor.y} w={S3.editor.w} at={editorAt} file="history.test.ts" lines={TEST_CODE} highlight={frame >= b(4) + 8 ? [1] : []} />}

      {/* агент гоняет тест на тестовой базе, не на живых данных */}
      {frame >= b(3) + 40 && <Agent x={S3.agent.x} y={S3.agent.y} scale={0.55} enterAt={b(3) + 40} pose={agent} />}
      <Arrow x1={S3.agent.x + 40} y1={S3.agent.y} x2={S3.db.x - 66} y2={S3.db.y} color={theme.accent} draw={toDb} />
      {frame >= b(3) + 56 && <Database x={S3.db.x} y={S3.db.y} scale={0.5} label="Тестовая база" enterAt={b(3) + 56} />}
      <g opacity={live}>
        <Pill x={S3.live.x} y={S3.live.y} w={180} text="живые данные" color={theme.risk} fill={theme.white} size={20} compact />
        <Strike x={S3.live.x - 80} y={S3.live.y} w={160} draw={liveStrike} />
        <g opacity={liveStrike}>
          <Mark x={S3.live.x + 112} y={S3.live.y} ok={false} r={14} />
        </g>
      </g>

      {/* пунктирные места: поломка нарочно и прогон теста */}
      <g opacity={holders * (1 - appear(frame, breakAt - 6))}>
        <Slot x={S3.diff.x} y={S3.diff.y} w={S3.diff.w} h={diffHeight(2)} r={12} text="поломка нарочно" />
      </g>
      <g opacity={holders * (1 - appear(frame, redAt - 6))}>
        <Slot x={S3.term.x} y={S3.term.y} w={S3.term.w} h={terminalHeight(TERM_RED.length)} r={12} text="прогон теста" />
      </g>

      {/* поломка нарочно и возврат копии */}
      <g opacity={appear(frame, breakAt - 6) * (frame < fixAt ? 1 : 0)}>
        <Label x={S3.diff.x} y={S3.diff.y - 12} anchor="start" size={20} weight={700} color={theme.risk}>
          assign.ts — ломаем нарочно
        </Label>
      </g>
      <g opacity={frame >= fixAt ? 1 : 0}>
        <Label x={S3.diff.x} y={S3.diff.y - 12} anchor="start" size={20} weight={700} color={theme.ok}>
          assign.ts — копия вернулась
        </Label>
      </g>
      {frame >= breakAt && frame < fixAt && <Diff key="break" x={S3.diff.x} y={S3.diff.y} w={S3.diff.w} at={breakAt} lines={BREAK} />}
      {frame >= fixAt && <Diff key="fix" x={S3.diff.x} y={S3.diff.y} w={S3.diff.w} at={fixAt} lines={FIX} />}

      {/* прогоны: красный после поломки, зелёный после возврата */}
      {frame >= redAt && frame < greenAt && <Terminal x={S3.term.x} y={S3.term.y} w={S3.term.w} at={redAt} lines={TERM_RED} />}
      {frame >= greenAt && <Terminal x={S3.term.x} y={S3.term.y} w={S3.term.w} at={greenAt} lines={TERM_GREEN} />}
      <g opacity={redOk}>
        <Pill x={S3.verdict.x} y={S3.verdict.y} w={440} text="покраснел — значит, тест работает" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      <g opacity={greenOk}>
        <Pill x={S3.verdict.x} y={S3.verdict.y} w={440} text="зелёный: ошибку поймает тест" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
    </KitScene>
  )
}
