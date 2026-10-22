import { useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Coach } from '../../actors/Coach'
import { type Mood, type Pose } from '../../actors/Person'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear, trackAt } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Callout, Mark, Pill, Slot } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { terminalHeight } from '../../kit/screens/layout'
import { Terminal } from '../../kit/screens/Terminal'
import { theme } from '../../theme'
import { B2, cardAt, FIX_COMMIT, KSENIA_OK, laneY, LEVELS, PIPELINE, pipeX, REMARKS, REPRO, S2, S2_LIST_H, slotOf, TERM_GREEN, TERM_RED, TEST_H } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { LevelHead, RemarkCard, RemarkRow } from './parts'

const ID = 's2-build'
const L = S2.list
const LN = S2.lane
const C = S2.card
const T = B2.test
const listRowTop = (i: number) => L.y + L.head + i * L.row
const idx = (id: string) => REMARKS.findIndex((r) => r.id === id)

// Сцена 2 (что строим сегодня). Доска 1: неразобранный список раскладывается по четырём ступеням тяжести
// (ступени — пример; как стопки дня 8), чиним по одному, сверху вниз. Доска 2: круг одного исправления —
// тест по шагам из отчёта об ошибке красный → агент правит код, тест не трогает → тест зелёный →
// один маленький коммит → выкладка → Ксения подтверждает → только тогда следующее.
export function S2Build() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: что первым? места ступеней — после отъезда камеры (b(0) + 86)
  const what = appear(frame, b(0) + 30, 10) * (1 - appear(frame, b(3), 8))
  const laneSlot = [0, 1, 2, 3].map((i) => appear(frame, b(0) + 92 + i * 8, 10))
  const example = useAppear(b(0) + 150)
  const headAt = [b(1) + 10, b(1) + 100, b(2) + 10, b(2) + 70]

  // карточки летят из списка на свои ступени — по репликам
  const flyAt: Record<string, number> = { save: b(3) + 130, report: b(4) + 20, date: b(4) + 116, records: b(4) + 136, phone: b(5) + 8, export: b(5) + 28 }
  const saveHot = appear(frame, b(3) + 10, 10) * (1 - appear(frame, flyAt.save, 8))
  const lost = appear(frame, b(3) + 70, 10) * (1 - appear(frame, flyAt.save, 8))
  const listOut = 1 - appear(frame, b(5) + 84, 12)
  const oneArrow = appear(frame, b(5) + 94, 14)
  const onePill = [b(5) + 100, b(5) + 118]

  // доска 2: круг одного исправления (места нарисованы заранее: камера приезжает на b(6) + 74)
  const stepAt5 = [b(6) + 78, b(7) + 116, b(8) + 56, b(8) + 136, b(9) + 150]
  const testIn = useAppear(b(6) + 80)
  const subAt = b(6) + 92
  const stepRowAt = [b(6) + 104, b(6) + 118, b(6) + 132]
  const expectAt = b(6) + 148
  const redAt = b(7) + 4
  const caught = useAppear(b(7) + 88)
  const keepTest = useAppear(b(7) + 156)
  const greenAt = b(8) + 4
  const commitIn = useAppear(b(8) + 56)
  const releaseIn = useAppear(b(8) + 136)
  const coachSlot = 1 - appear(frame, b(9) + 4, 8)
  const repeat = appear(frame, b(9) + 50, 10) * (1 - appear(frame, b(9) + 146, 6))
  const okSay = useAppear(b(9) + 150)
  const queueIn = useAppear(b(6) + 84)
  const strike = appear(frame, b(10) + 14, 16)
  const next = useAppear(b(10) + 44)

  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(7) + 112, 'working'],
    [b(8) + 24, 'done'],
  ])
  const ksenia = stepAt<[Pose, Mood]>(frame, [
    [0, ['think', 'neutral']],
    [b(9) + 150, ['cheer', 'happy']],
  ])

  return (
    <KitScene chip="2 / 4 · Очередь и одно исправление" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* ===== доска 1: неразобранный список ===== */}
      <g opacity={listOut}>
        <Card x={L.x} y={L.y} w={L.w} h={S2_LIST_H} stroke={theme.line} fill={theme.white}>
          <Label x={L.x + 20} y={L.y + 36} anchor="start" size={22} weight={800}>
            Список замечаний
          </Label>
          <line x1={L.x + 16} y1={L.y + L.head - 4} x2={L.x + L.w - 16} y2={L.y + L.head - 4} stroke={theme.grid} strokeWidth={2} />
        </Card>
        <g opacity={what}>
          <Pill x={L.x + L.w - 86} y={L.y + 28} text="что первым?" color={theme.alt} fill={theme.altTint} size={18} compact />
        </g>
        {REMARKS.map((r, i) => {
          const gone = appear(frame, flyAt[r.id], 6)
          const top = listRowTop(i)
          return (
            <g key={r.id}>
              {i > 0 && <line x1={L.x + 16} y1={top} x2={L.x + L.w - 16} y2={top} stroke={theme.grid} strokeWidth={1.5} />}
              {r.id === 'save' && <rect x={L.x + 8} y={top + 4} width={L.w - 16} height={L.row - 8} rx={8} fill={theme.riskTint} opacity={saveHot} />}
              <g opacity={1 - 0.65 * gone}>
                <RemarkRow x={L.x + 20} y={top + 34} who={r.who} text={r.text} nameW={96} />
              </g>
            </g>
          )
        })}
        <g opacity={lost}>
          <Pill x={L.x + L.w - 76} y={listRowTop(idx('save')) + 26} text="всё пропало" color={theme.risk} fill={theme.white} size={18} compact />
        </g>
      </g>

      {/* чиним по одному, сверху вниз — на месте списка */}
      <Arrow x1={S2.arrow.x} y1={S2.arrow.y1} x2={S2.arrow.x} y2={S2.arrow.y2} color={theme.accent} draw={oneArrow} />
      {onePill.map((at, i) => (
        <g key={at} opacity={appear(frame, at, 10)}>
          <Pill x={S2.arrow.x} y={i === 0 ? 262 : 344} text={i === 0 ? 'по одному' : 'сверху вниз'} color={theme.accent} fill={theme.white} size={22} />
        </g>
      ))}

      {/* четыре ступени: места, заголовки — по реплике */}
      <g opacity={example}>
        <Pill x={LN.x + LN.w - 150} y={62} text="ступени — наш пример" color={theme.soft} fill={theme.paper} size={18} compact />
      </g>
      {LEVELS.map((lv, i) => {
        const y = laneY(i)
        const on = appear(frame, headAt[i], 10)
        return (
          <g key={lv.n}>
            <g opacity={laneSlot[i] * (1 - on)}>
              <Slot x={LN.x} y={y} w={LN.head} h={LN.h} text={`ступень ${lv.n}`} />
            </g>
            <g opacity={laneSlot[i]}>
              {[0, 1].map((k) => {
                const p = cardAt(i, k)
                return <Slot key={k} x={p.x} y={p.y} w={C.w} h={C.h} color={theme.grid} />
              })}
            </g>
            <g opacity={on}>
              <LevelHead x={LN.x} y={y} w={LN.head} h={LN.h} n={lv.n} title={lv.title} sub={lv.sub} />
            </g>
          </g>
        )
      })}
      {REMARKS.map((r, i) => {
        const at = flyAt[r.id]
        if (frame < at) return null
        const s = slotOf(r.id)
        const to = cardAt(s.lane, s.k)
        const p = trackAt(frame, [
          [at, L.x + 150, listRowTop(i) - 10],
          [at + 28, to.x, to.y],
        ])
        return <RemarkCard key={r.id} x={p.x} y={p.y} w={C.w} h={C.h} who={r.who} text={r.text} level={r.level} />
      })}

      {/* ===== доска 2: круг одного исправления ===== */}
      {PIPELINE.map((s, i) => {
        const x = pipeX(i)
        const on = appear(frame, stepAt5[i], 10)
        return (
          <g key={s}>
            <rect x={x} y={B2.pipe.y} width={B2.pipe.w} height={B2.pipe.h} rx={B2.pipe.h / 2} fill={on > 0 ? theme.okTint : theme.paper} stroke={on > 0 ? theme.ok : theme.grid} strokeWidth={3} strokeDasharray={on > 0 ? undefined : '9 7'} />
            <Label x={x + B2.pipe.w / 2} y={B2.pipe.y + 35} size={19} weight={800} color={on > 0 ? theme.ok : theme.soft}>
              {s}
            </Label>
            {i > 0 && <Arrow x1={x - B2.pipe.gap + 2} y1={B2.pipe.y + B2.pipe.h / 2} x2={x - 3} y2={B2.pipe.y + B2.pipe.h / 2} color={on > 0 ? theme.ok : theme.grid} />}
          </g>
        )
      })}

      {/* тест по шагам из отчёта об ошибке */}
      <g opacity={1 - testIn}>
        <Slot x={T.x} y={T.y} w={T.w} h={TEST_H} text="тест по шагам беды" />
      </g>
      <g opacity={testIn}>
        <Card x={T.x} y={T.y} w={T.w} h={TEST_H} stroke={theme.accent} fill={theme.white}>
          <Label x={T.x + 20} y={T.y + 36} anchor="start" size={20} weight={800} color={theme.accent}>
            Тест: тренировка с новым упражнением
          </Label>
          <line x1={T.x + 16} y1={T.y + T.head - 6} x2={T.x + T.w - 16} y2={T.y + T.head - 6} stroke={theme.grid} strokeWidth={2} />
        </Card>
      </g>
      {frame >= subAt && (
        <Label x={T.x + 20} y={T.y + 64} anchor="start" size={18} weight={600} color={theme.soft}>
          {typed('шаги — из отчёта об ошибке · день 14', frame, subAt, 60)}
        </Label>
      )}
      {REPRO.steps.map((s, i) => {
        const y = T.y + T.head + i * T.row
        return (
          <g key={s} opacity={appear(frame, stepRowAt[i], 8)}>
            <circle cx={T.x + 34} cy={y + 20} r={13} fill={theme.accentTint} stroke={theme.accent} strokeWidth={2.5} />
            <Label x={T.x + 34} y={y + 26} size={18} weight={800} color={theme.accent}>
              {String(i + 1)}
            </Label>
            <Label x={T.x + 60} y={y + 27} anchor="start" size={20} weight={600}>
              {s}
            </Label>
          </g>
        )
      })}
      <g opacity={appear(frame, expectAt, 8)}>
        <line x1={T.x + 16} y1={T.y + T.head + REPRO.steps.length * T.row + 4} x2={T.x + T.w - 16} y2={T.y + T.head + REPRO.steps.length * T.row + 4} stroke={theme.grid} strokeWidth={2} />
        <Label x={T.x + 20} y={T.y + TEST_H - 18} anchor="start" size={20} weight={800} color={theme.ok}>
          {REPRO.expect}
        </Label>
      </g>

      {/* терминал: тест красный, потом зелёный — тот же тест */}
      <g opacity={1 - appear(frame, redAt, 6)}>
        <Slot x={B2.term.x} y={B2.term.y} w={B2.term.w} h={terminalHeight(TERM_RED.length)} text="запуск теста" />
      </g>
      {frame >= redAt && (
        <g opacity={1 - appear(frame, greenAt + 4, 6)}>
          <Terminal x={B2.term.x} y={B2.term.y} w={B2.term.w} at={redAt} lines={TERM_RED} />
        </g>
      )}
      {frame >= greenAt && <Terminal x={B2.term.x} y={B2.term.y} w={B2.term.w} at={greenAt} lines={TERM_GREEN} />}
      <g opacity={caught * (1 - appear(frame, greenAt, 8))}>
        <Pill x={B2.caught.x} y={B2.caught.y} text="беда поймана" color={theme.risk} fill={theme.riskTint} size={18} compact />
      </g>

      {/* агент правит код, а тест не трогает */}
      <Agent x={B2.agent.x} y={B2.agent.y} scale={0.6} enterAt={b(6) + 70} pose={agent} />
      <g opacity={keepTest}>
        <Callout x={B2.agentSay.x} y={B2.agentSay.y} tx={B2.agent.x} ty={B2.agent.y + 80} text="тест не трогаю" color={theme.accent} />
      </g>

      {/* один маленький коммит и выкладка */}
      <g opacity={1 - commitIn}>
        <Slot x={B2.commit.x} y={B2.commit.y} w={B2.commit.w} h={B2.commit.h} text="коммит" />
      </g>
      <g opacity={commitIn}>
        <Card x={B2.commit.x} y={B2.commit.y} w={B2.commit.w} h={B2.commit.h} stroke={theme.ok} fill={theme.white}>
          <Label x={B2.commit.x + 20} y={B2.commit.y + 30} anchor="start" size={22} weight={800}>
            {`Один коммит · ${FIX_COMMIT.files.length} файла`}
          </Label>
          <Label x={B2.commit.x + 20} y={B2.commit.y + 56} anchor="start" size={18} weight={600} color={theme.soft}>
            {FIX_COMMIT.files.join(' + ')}
          </Label>
        </Card>
      </g>
      <Arrow x1={B2.release.x} y1={B2.commit.y + B2.commit.h + 2} x2={B2.release.x} y2={B2.release.y - 19} color={theme.ok} draw={releaseIn} />
      <g opacity={releaseIn}>
        <Pill x={B2.release.x} y={B2.release.y} text="новая версия выложена" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>

      {/* «исправлено» говорит Ксения: повторяет те же шаги (место — пунктиром, пока её нет) */}
      <g opacity={coachSlot}>
        <Slot x={B2.test.x} y={B2.coachSlot.y} w={B2.test.w} h={B2.coachSlot.h} text="тренер проверяет у себя" />
      </g>
      <Coach x={B2.ksenia.x} y={B2.ksenia.y} scale={0.5} label="Ксения" color={theme.ink} enterAt={b(9) + 6} pose={ksenia[0]} mood={ksenia[1]} />
      <g opacity={repeat}>
        <Pill x={B2.okCallout.x} y={B2.okCallout.y} text="повторяет те же шаги" color={theme.soft} fill={theme.white} size={18} compact />
      </g>
      <g opacity={okSay}>
        <Callout x={B2.okCallout.x} y={B2.okCallout.y} tx={B2.ksenia.x + 22} ty={B2.ksenia.y - 30} text={KSENIA_OK} color={theme.ok} fill={theme.white} />
      </g>

      {/* очередь: верхнее вычеркнуто, следующее — отчёт Кирилла */}
      <g opacity={1 - queueIn}>
        <Slot x={B2.queue.x} y={B2.queue.y} w={B2.queue.w} h={B2.queue.h} text="очередь" />
      </g>
      <g opacity={queueIn}>
        <Card x={B2.queue.x} y={B2.queue.y} w={B2.queue.w} h={B2.queue.h} stroke={theme.line} fill={theme.white}>
          <Label x={B2.queue.x + 14} y={B2.queue.y + 26} anchor="start" size={18} weight={800} color={theme.soft}>
            Очередь
          </Label>
        </Card>
        <rect x={B2.queue.x + 6} y={B2.queue.y + 62} width={B2.queue.w - 12} height={28} rx={7} fill={theme.altTint} opacity={next} />
        <RemarkRow x={B2.queue.x + 14} y={B2.queue.y + 54} who="1" text="Ксения" nameW={22} color={theme.risk} struck={strike} />
        <g opacity={0.6 + 0.4 * next}>
          <RemarkRow x={B2.queue.x + 14} y={B2.queue.y + 83} who="2" text="отчёт Кирилла" nameW={22} color={theme.alt} />
        </g>
      </g>
      <g opacity={strike}>
        <Mark x={B2.queue.x + B2.queue.w - 26} y={B2.queue.y + 47} ok r={13} />
      </g>
    </KitScene>
  )
}
