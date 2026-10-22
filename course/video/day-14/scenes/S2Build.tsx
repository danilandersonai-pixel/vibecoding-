import { useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Database } from '../../actors/Database'
import { Phone } from '../../actors/Phone'
import { KitScene } from '../../kit/KitScene'
import { appear, trackAt } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Mark, Pill, Slot, Browser } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { Mono } from '../../kit/screens/Window'
import { theme } from '../../theme'
import { BOARD2, PYRAMID, PYRAMID_BOTTOM, pyramidWidth, REPORT, REPORT_HEAD, REPORT_ROW, REQUESTS, S2, secText, SPEED, tierTop } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Caution, CopyDoc, Night, SafeBox, SetFailed, SetForm, Spinner, Watch } from './parts'

const ID = 's2-build'
const CH = S2.chart
const P = S2.pyramid
const L = S2.list
const M = S2.measure
const RP = S2.report
const V = S2.vault

// точки графика Анны: вес в приседе по тренировкам, последняя — новая
const POINTS = [50, 55, 57.5, 60]
const px = (i: number) => CH.x + 70 + i * 80
const py = (w: number) => CH.y + 200 - (w - 45) * 6
// цвета ярусов пирамиды сверху вниз
const TIER = [
  { color: theme.accent, fill: theme.accentTint },
  { color: theme.alt, fill: theme.altTint },
  { color: theme.ok, fill: theme.okTint },
]

/** Ярус пирамиды i: трапеция по ширине пирамиды на верхней и нижней кромке. */
function tierPath(i: number): string {
  const top = tierTop(i)
  const bottom = top + P.tier
  const wt = pyramidWidth(top) / 2
  const wb = pyramidWidth(bottom) / 2
  return `M${P.cx - wt} ${top} H${P.cx + wt} L${P.cx + wb} ${bottom} H${P.cx - wb} Z`
}

// Сцена 2 (что строим сегодня): тесты главного сценария и пирамида; скорость — замер, N+1 и один
// общий запрос; ошибка на телефоне Анны и отчёт с подробностями; копии каждую ночь вне досягаемости агента.
export function S2Build() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // ---- тесты: путь подхода от телефона Анны до графика Марины ----
  const flow = appear(frame, b(0) + 30, 12)
  const saveAt = b(0) + 56
  const runAt = b(1) + 34
  const busy = (frame >= saveAt + 8 && frame < saveAt + 22) || (frame >= runAt + 8 && frame < runAt + 22)
  const pointIn = appear(frame, b(0) + 92, 10)
  const flash = frame >= b(1) + 78 && frame < b(1) + 96 ? 1 : 0
  const packet = (at: number) =>
    trackAt(frame, [
      [at + 4, S2.phone.x + 30, S2.phone.y + 70],
      [at + 16, S2.phone.x + 96, S2.phone.y],
      [at + 34, px(3), py(60)],
    ])
  const packetOn = (at: number) => frame >= at + 4 && frame < at + 34
  const runner = appear(frame, b(1) + 6, 10)
  const passed = appear(frame, b(1) + 96, 10)
  const tierAt = [b(1) + 112, b(2) + 24, b(2) + 100]
  const pyramidSlot = appear(frame, b(0) + 24, 12) * (1 - appear(frame, tierAt[0], 10))

  // ---- скорость: список грузится почти 4 секунды → замер → один общий запрос ----
  const speedSlots = appear(frame, b(0) + 24, 12)
  const loadFrom = b(3) + 14
  const loaded = frame >= loadFrom + Math.round(SPEED.before * 30)
  const fixedAt = b(5) + 120
  const fixed = frame >= fixedAt
  const timerIn = appear(frame, loadFrom, 8)
  const timerText = fixed ? secText(SPEED.after) : secText(Math.min(SPEED.before, Math.max(0, Math.floor(((frame - loadFrom) / 30) * 10) / 10)))
  const measureIn = appear(frame, b(4) + 6, 10)
  const timeRow = appear(frame, b(4) + 24, 10)
  const reqFrom = b(4) + 40
  const sent = Math.max(0, Math.min(REQUESTS.before, Math.floor((frame - reqFrom) / 3) + 1))
  const reqRow = appear(frame, reqFrom, 8)
  const oneQuery = appear(frame, fixedAt - 8, 12)
  const note = appear(frame, fixedAt + 10, 10)
  const sheetOn = frame >= b(5) + 12 && frame < b(5) + 42
  const sheet = trackAt(frame, [
    [b(5) + 12, M.x + 6, M.y + M.h + 8],
    [b(5) + 40, S2.agent.x, S2.agent.y - 34],
  ])
  const vague = appear(frame, b(5) + 62, 10)

  // ---- ошибки (доска 2): подход не сохранился → понятное сообщение → отчёт вам ----
  const tap2 = b(6) + 40
  const failed = frame >= tap2 + 26
  const clear = appear(frame, b(6) + 112, 10)
  const reportSlot = appear(frame, b(6) + 24, 10) * (1 - appear(frame, b(7), 8))
  const errOn = frame >= b(6) + 140 && frame < b(6) + 172
  const err = trackAt(frame, [
    [b(6) + 140, S2.phone2.x + 40, S2.phone2.y - 40],
    [b(6) + 168, RP.x + 120, RP.y + 40],
  ])
  const card = appear(frame, b(7), 10)
  const rowAt = REPORT.map((_, i) => b(7) + 8 + i * 9)
  const giveOn = frame >= b(7) + 130 && frame < b(7) + 152
  const give = trackAt(frame, [
    [b(7) + 130, RP.x + 250, RP.y + RP.h + 20],
    [b(7) + 150, S2.agent2.x - 20, S2.agent2.y - 30],
  ])
  const whole = appear(frame, b(7) + 150, 10)

  // ---- копии (доска 2): каждую ночь — в хранилище, куда агенту доступа нет ----
  const copySlots = appear(frame, b(8) + 24, 10)
  const vaultIn = appear(frame, b(8) + 40, 10)
  const nightIn = appear(frame, b(8) + 52, 10)
  const docOn = frame >= b(8) + 60 && frame < b(8) + 90
  const doc = trackAt(frame, [
    [b(8) + 60, S2.db2.x + 70, S2.db2.y],
    [b(8) + 88, V.x + V.w / 2, V.y + 150],
  ])
  const stackAt = [b(8) + 70, b(8) + 80, b(8) + 90]
  const noLine = appear(frame, b(8) + 106, 20)
  const noMark = appear(frame, b(8) + 124, 8)
  const noPill = appear(frame, b(8) + 130, 10)

  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(5) + 40, 'working'],
    [b(5) + 110, 'done'],
  ])
  const agent2 = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(7) + 150, 'working'],
    [b(8) + 100, 'idle'],
  ])

  const listRows = 4
  const noX = S2.agent2.x + 42
  const noY = S2.noAccess.y - 8
  const vx = V.x + 40
  const vy = V.y + V.h + 12

  return (
    <KitScene chip="2 / 4 · Что строим сегодня" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* ===== доска 1: тесты ===== */}
      <g opacity={runner}>
        <Pill x={S2.runner.x} y={S2.runner.y} text="сквозной тест · Playwright" color={theme.accent} fill={theme.accentTint} size={20} compact />
      </g>
      <g opacity={passed}>
        <Pill x={S2.runner.x + 236} y={S2.runner.y} text="✓ прошёл" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      <Phone x={S2.phone.x} y={S2.phone.y} enterAt={b(0) + 6}>
        <SetForm who="Анна" title="Присед" value="5 × 60 кг" tapAt={frame >= runAt - 4 ? runAt : saveAt} busy={busy} />
      </Phone>
      <Arrow x1={S2.phone.x + 66} y1={S2.phone.y} x2={CH.x - 8} y2={S2.phone.y} color={theme.accent} draw={flow} />
      <Browser x={CH.x} y={CH.y} w={CH.w} h={CH.h} at={b(0) + 16} url="/clients/17">
        <Label x={CH.w - 16} y={27} anchor="end" size={18} weight={700} color={theme.accent}>
          Марина
        </Label>
        <Label x={20} y={74} anchor="start" size={20} weight={800}>
          Анна · присед
        </Label>
        <line x1={30} y1={204} x2={CH.w - 24} y2={204} stroke={theme.grid} strokeWidth={2} />
      </Browser>
      {frame >= b(0) + 26 && (
        <g opacity={appear(frame, b(0) + 26, 10)}>
          <path d={POINTS.slice(0, 3).map((w, i) => `${i === 0 ? 'M' : 'L'}${px(i)} ${py(w)}`).join(' ')} fill="none" stroke={theme.accent} strokeWidth={4} strokeLinejoin="round" />
          {POINTS.slice(0, 3).map((w, i) => (
            <circle key={w} cx={px(i)} cy={py(w)} r={6} fill={theme.paper} stroke={theme.accent} strokeWidth={3.5} />
          ))}
        </g>
      )}
      <g opacity={pointIn}>
        <line x1={px(2)} y1={py(57.5)} x2={px(3)} y2={py(60)} stroke={theme.ok} strokeWidth={4} />
        {flash > 0 && <circle cx={px(3)} cy={py(60)} r={18} fill={theme.okTint} stroke={theme.ok} strokeWidth={2} />}
        <circle cx={px(3)} cy={py(60)} r={8} fill={theme.okTint} stroke={theme.ok} strokeWidth={4} />
        <Label x={px(3)} y={py(60) - 18} size={18} weight={800} color={theme.ok}>
          60 кг
        </Label>
      </g>
      {packetOn(saveAt) && <circle cx={packet(saveAt).x} cy={packet(saveAt).y} r={9} fill={theme.accent} />}
      {packetOn(runAt) && (
        <g transform={`translate(${packet(runAt).x} ${packet(runAt).y})`}>
          <circle r={12} fill={theme.white} stroke={theme.accent} strokeWidth={3} />
          <path d="M-4 -6 L6 0 L-4 6 Z" fill={theme.accent} />
        </g>
      )}

      {/* пирамида тестов: место пунктиром, ярусы по реплике */}
      <g opacity={pyramidSlot}>
        <Slot x={P.cx - P.base / 2} y={P.top} w={P.base} h={PYRAMID_BOTTOM - P.top} text="уровни тестов" />
      </g>
      {PYRAMID.map((tier, i) => {
        const on = appear(frame, tierAt[i], 12)
        const top = tierTop(i)
        return (
          <g key={tier.name} opacity={on} transform={`translate(0 ${(1 - on) * 12})`}>
            <path d={tierPath(i)} fill={theme.white} stroke={TIER[i].color} strokeWidth={3} strokeLinejoin="round" />
            <path d={tierPath(i)} fill={TIER[i].fill} />
            <Label x={P.cx} y={top + P.tier / 2 + 7} size={18} weight={700} color={TIER[i].color}>
              {tier.text}
            </Label>
          </g>
        )
      })}

      {/* ===== доска 1: скорость ===== */}
      <g opacity={speedSlots * (1 - appear(frame, b(3) + 4, 8))}>
        <Slot x={L.x} y={L.y} w={L.w} h={L.h} text="скорость" />
      </g>
      <g opacity={speedSlots * (1 - measureIn)}>
        <Slot x={M.x} y={M.y} w={M.w} h={M.h} text="замер" />
      </g>
      {frame >= b(3) + 4 && (
        <Browser x={L.x} y={L.y} w={L.w} h={L.h} at={b(3) + 4} url="/clients">
          <Label x={L.w - 14} y={27} anchor="end" size={18} weight={700} color={theme.accent}>
            Марина
          </Label>
          <Label x={20} y={74} anchor="start" size={20} weight={800}>
            Подопечные
          </Label>
          {!loaded && frame >= loadFrom && (
            <g>
              <Spinner x={L.w / 2} y={180} r={20} />
              <Label x={L.w / 2} y={236} size={18} color={theme.soft}>
                загрузка…
              </Label>
            </g>
          )}
          {loaded &&
            Array.from({ length: listRows + 1 }, (_, i) => (
              <g key={i} opacity={appear(frame, loadFrom + Math.round(SPEED.before * 30) + i * 3, 6)}>
                <rect x={16} y={90 + i * 44} width={L.w - 32} height={36} rx={7} fill={theme.white} stroke={i === 0 ? theme.ok : theme.grid} strokeWidth={2} />
                {i === 0 ? (
                  <Label x={30} y={115} anchor="start" size={18} weight={600}>
                    Анна · вчера
                  </Label>
                ) : (
                  <rect x={30} y={102 + i * 44} width={120 + ((i * 37) % 60)} height={12} rx={6} fill={theme.grid} />
                )}
              </g>
            ))}
          {loaded && (
            <Label x={L.w / 2} y={326} size={18} color={theme.soft}>
              и ещё 15
            </Label>
          )}
        </Browser>
      )}
      <g opacity={timerIn}>
        <Watch x={S2.timer.x - 62} y={S2.timer.y} r={13} t={fixed ? 0.1 : Math.min(1, (frame - loadFrom) / (SPEED.before * 30))} />
        <Pill x={S2.timer.x} y={S2.timer.y} w={92} text={timerText} color={fixed ? theme.ok : loaded ? theme.risk : theme.ink} fill={theme.white} size={20} compact />
      </g>

      {/* замер: время и число запросов; после правки — новые значения */}
      <g opacity={measureIn}>
        <Card x={M.x} y={M.y} w={M.w} h={M.h} stroke={theme.alt} fill={theme.white}>
          <Label x={M.x + 18} y={M.y + 36} anchor="start" size={22} weight={800}>
            Замер
          </Label>
          <Label x={M.x + M.w - 16} y={M.y + 36} anchor="end" size={18} color={theme.soft}>
            пример
          </Label>
          <line x1={M.x + 14} y1={M.y + 52} x2={M.x + M.w - 14} y2={M.y + 52} stroke={theme.grid} strokeWidth={2} />
        </Card>
      </g>
      <g opacity={timeRow}>
        <Label x={M.x + 18} y={M.y + 90} anchor="start" size={20} color={theme.soft}>
          время
        </Label>
        <Label x={M.x + M.w - 16} y={M.y + 90} anchor="end" size={20} weight={800} color={fixed ? theme.ok : theme.risk}>
          {fixed ? `3,8 → ${secText(SPEED.after)}` : secText(SPEED.before)}
        </Label>
      </g>
      <g opacity={reqRow}>
        <Label x={M.x + 18} y={M.y + 128} anchor="start" size={20} color={theme.soft}>
          запросов
        </Label>
        <Label x={M.x + M.w - 16} y={M.y + 128} anchor="end" size={20} weight={800} color={fixed ? theme.ok : theme.risk}>
          {fixed ? `${REQUESTS.before} → ${REQUESTS.after}` : String(sent)}
        </Label>
      </g>
      <g opacity={note}>
        <Label x={M.x + M.w / 2} y={M.y + 168} size={18} weight={700} color={theme.ok}>
          один общий запрос
        </Label>
      </g>
      <Database x={S2.db.x} y={S2.db.y} scale={0.5} enterAt={b(4) + 16} />
      {Array.from({ length: REQUESTS.before }, (_, k) => {
        const at = reqFrom + k * 3
        if (frame < at || frame >= at + 14 || fixed) return null
        const p = trackAt(frame, [
          [at, L.x + L.w + 4, L.y + 180],
          [at + 14, S2.db.x - 58, S2.db.y - 14],
        ])
        return <circle key={k} cx={p.x} cy={p.y} r={6} fill={theme.risk} />
      })}
      <g opacity={oneQuery}>
        <Arrow x1={L.x + L.w + 6} y1={L.y + 180} x2={S2.db.x - 60} y2={S2.db.y - 14} color={theme.ok} draw={oneQuery} />
      </g>
      {sheetOn && (
        <g transform={`translate(${sheet.x} ${sheet.y})`}>
          <Pill x={0} y={0} text="3,8 с · 21" color={theme.alt} fill={theme.white} size={18} compact />
        </g>
      )}
      <Agent x={S2.agent.x} y={S2.agent.y} scale={0.45} label="" enterAt={b(5) + 4} pose={agent} />
      <g opacity={vague}>
        <Pill x={S2.vague.x} y={S2.vague.y} text="«сделай быстрее»" color={theme.risk} fill={theme.riskTint} size={20} compact />
        <line x1={S2.vague.x - 96} y1={S2.vague.y} x2={S2.vague.x + 96} y2={S2.vague.y} stroke={theme.risk} strokeWidth={3} />
        <Mark x={S2.vague.x + 122} y={S2.vague.y} ok={false} r={13} />
      </g>

      {/* ===== доска 2: ошибка на телефоне Анны и отчёт ===== */}
      <Phone x={S2.phone2.x} y={S2.phone2.y} enterAt={b(6) + 10}>
        {failed ? <SetFailed who="Анна" /> : <SetForm who="Анна" title="Выпады" value="8 × 20 кг" tapAt={tap2} busy={frame >= tap2 + 8} />}
      </Phone>
      <g opacity={clear}>
        <Pill x={S2.phone2.x} y={S2.phone2.y + 142} text="понятно ✓" color={theme.ok} fill={theme.okTint} size={18} compact />
      </g>
      <g opacity={reportSlot}>
        <Slot x={RP.x} y={RP.y} w={RP.w} h={RP.h} text="отслеживание ошибок" />
      </g>
      {errOn && (
        <g transform={`translate(${err.x} ${err.y})`}>
          <Pill x={0} y={0} text="ошибка" color={theme.risk} fill={theme.white} size={18} compact />
        </g>
      )}
      <g opacity={card}>
        <Card x={RP.x} y={RP.y} w={RP.w} h={RP.h} stroke={theme.risk} fill={theme.white}>
          <Caution x={RP.x + 34} y={RP.y + 32} />
          <Label x={RP.x + 64} y={RP.y + 40} anchor="start" size={22} weight={800}>
            Отслеживание ошибок
          </Label>
          <line x1={RP.x + 16} y1={RP.y + 58} x2={RP.x + RP.w - 16} y2={RP.y + 58} stroke={theme.grid} strokeWidth={2} />
        </Card>
      </g>
      {REPORT.map((r, i) => {
        const y = RP.y + REPORT_HEAD + i * REPORT_ROW + 26
        return (
          <g key={r.tag} opacity={appear(frame, rowAt[i], 8)}>
            <Label x={RP.x + 20} y={y} anchor="start" size={18} color={theme.soft} weight={600}>
              {r.tag}
            </Label>
            {r.mono ? (
              <Mono x={RP.x + 100} y={y} size={18} fill={i === 0 ? theme.risk : theme.ink}>
                {r.text}
              </Mono>
            ) : (
              <Label x={RP.x + 100} y={y} anchor="start" size={20} weight={600}>
                {r.text}
              </Label>
            )}
          </g>
        )
      })}
      {giveOn && <CopyDoc x={give.x} y={give.y} s={0.6} color={theme.risk} />}
      <Agent x={S2.agent2.x} y={S2.agent2.y} scale={0.45} label="" enterAt={b(7) + 100} pose={agent2} />
      <g opacity={whole}>
        <Pill x={S2.whole.x} y={S2.whole.y} text="целиком, без пересказа" color={theme.accent} fill={theme.white} size={20} compact />
      </g>

      {/* ===== доска 2: копии ===== */}
      <g opacity={copySlots * (1 - vaultIn)}>
        <Slot x={V.x} y={V.y} w={V.w} h={V.h} text="копии" />
      </g>
      <g opacity={copySlots * (1 - appear(frame, b(8) + 30, 8))}>
        <Slot x={S2.db2.x - 80} y={S2.db2.y - 54} w={160} h={136} text="база" />
      </g>
      <Database x={S2.db2.x} y={S2.db2.y} scale={0.6} label="Рабочая база" enterAt={b(8) + 30} />
      <g opacity={nightIn}>
        <Arrow x1={S2.db2.x + 80} y1={S2.db2.y} x2={V.x - 8} y2={S2.db2.y} color={theme.ok} draw={nightIn} />
        <Night x={(S2.db2.x + 80 + V.x) / 2} y={S2.db2.y - 34} />
        <Label x={(S2.db2.x + 80 + V.x) / 2} y={S2.db2.y + 32} size={18} color={theme.soft} weight={700}>
          каждую
        </Label>
        <Label x={(S2.db2.x + 80 + V.x) / 2} y={S2.db2.y + 54} size={18} color={theme.soft} weight={700}>
          ночь
        </Label>
      </g>
      <g opacity={vaultIn}>
        <Card x={V.x} y={V.y} w={V.w} h={V.h} stroke={theme.ok} fill={theme.white}>
          <Label x={V.x + 18} y={V.y + 38} anchor="start" size={22} weight={800}>
            Копии
          </Label>
          <SafeBox x={V.x + V.w - 32} y={V.y + 30} s={0.8} />
          <line x1={V.x + 14} y1={V.y + 56} x2={V.x + V.w - 14} y2={V.y + 56} stroke={theme.grid} strokeWidth={2} />
        </Card>
      </g>
      {docOn && <CopyDoc x={doc.x} y={doc.y} s={0.8} />}
      {stackAt.map((at, i) => (
        <g key={at} opacity={appear(frame, at, 8)}>
          <CopyDoc x={V.x + 56 + i * 48} y={V.y + 140 - (i % 2) * 10} s={0.9} />
        </g>
      ))}
      <g opacity={noLine}>
        <line x1={noX} y1={noY} x2={noX + (vx - noX) * noLine} y2={noY + (vy - noY) * noLine} stroke={theme.risk} strokeWidth={3} strokeDasharray="8 7" />
      </g>
      <g opacity={noMark}>
        <Mark x={vx} y={vy} ok={false} r={14} />
      </g>
      <g opacity={noPill}>
        <Pill x={BOARD2 + 860} y={S2.noAccess.y - 20} text="нет доступа" color={theme.risk} fill={theme.riskTint} size={18} compact />
      </g>
    </KitScene>
  )
}
