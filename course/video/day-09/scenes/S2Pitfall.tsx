import { interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Client } from '../../actors/Client'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP, trackAt } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Callout, Mark, Pill } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { theme } from '../../theme'
import { BOARD2, S2, S2_CARD_H, S2_TPL_H, TEMPLATE } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Strike, You } from './parts'

const ID = 's2-pitfall'
const R = S2.row
const T = S2.template
const C = S2.card
const P1 = S2.panel1
const P2 = S2.panel2

// записанные подходы Анны: вес по строкам (присед, жим)
const KG = ['50 кг', '40 кг']
const rowY = (top: number, i: number) => top + 64 + i * R + R / 2
const DAYS = [
  { title: 'Анна · Пн, неделя 1', card: S2.monCard },
  { title: 'Анна · Чт, неделя 1', card: S2.thuCard },
]

// Сцена 2 (подводный камень): Анна сделала понедельник и четверг; Марина меняет в шаблоне жим лёжа на жим гантелей —
// и прошлая неделя Анны переписана: тренировка ссылается на шаблон. Удаление приседа с каскадом стирает подходы.
// Доска 2: способ 1 — копия плана при назначении, способ 2 — версии шаблона; будущие недели решаете вы, ИИ даёт варианты.
export function S2Pitfall() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: прошлая неделя Анны
  const cardAt = [b(0) + 12, b(0) + 40]
  const rowAt = [b(0) + 50, b(0) + 90]
  const doneAt = [b(0) + 110, b(0) + 124]
  const tplIn = appear(frame, b(1) - 6)
  // правка шаблона: жим лёжа → жим гантелей
  const editHi = appear(frame, b(1) + 40, 8)
  const editStrike = interpolate(frame, [b(1) + 50, b(1) + 62], [0, 1], CLAMP)
  const editAt = b(1) + 66
  const edited = frame >= editAt
  const editPill = appear(frame, b(1) + 40) * interpolate(frame, [b(4) + 10, b(4) + 20], [1, 0], CLAMP)
  // история переписана
  const flipAt = [b(2) + 36, b(2) + 56]
  const say = appear(frame, b(2) + 70) * interpolate(frame, [b(3) + 4, b(3) + 14], [1, 0], CLAMP)
  // ссылки на шаблон
  const linkAt = [b(3) + 16, b(3) + 24, b(3) + 32, b(3) + 40]
  const linkPill = appear(frame, b(3) + 50)
  // концы ссылок у шаблона вспыхивают: план берётся отсюда
  const pulse = interpolate(frame, [b(3) + 90, b(3) + 104, b(3) + 118], [0, 1, 0], CLAMP)
  // удаление приседа с каскадом
  const delHi = appear(frame, b(4) + 20, 8)
  const delStrike = interpolate(frame, [b(4) + 24, b(4) + 36], [0, 1], CLAMP)
  const deleted = frame >= b(4) + 40
  const goneAt = [b(4) + 54, b(4) + 62]
  const delPill = appear(frame, b(4) + 20)

  // доска 2: способ 1 — копия
  const p1 = appear(frame, b(5) + 50)
  const tpl1 = appear(frame, b(5) + 60)
  const copyDraw = interpolate(frame, [b(5) + 90, b(5) + 106], [0, 1], CLAMP)
  const annaCopy = appear(frame, b(5) + 100)
  const copyFly = b(5) + 104
  const tplEditHi = appear(frame, b(6) + 10, 8)
  const tplEditStrike = interpolate(frame, [b(6) + 16, b(6) + 28], [0, 1], CLAMP)
  const tplEditAt = b(6) + 32
  const newDraw = interpolate(frame, [b(6) + 50, b(6) + 66], [0, 1], CLAMP)
  const newCard = appear(frame, b(6) + 60)
  // пунктирные места: новое назначение (способ 1) и вопрос о будущих неделях
  const newSlot = appear(frame, b(5) + 60) * (1 - newCard)
  const askSlot = appear(frame, b(5) + 60) * (1 - appear(frame, b(8) + 10))
  const newFly = b(6) + 66
  const kept = appear(frame, b(6) + 110)
  // способ 2 — версии
  const slot2 = appear(frame, b(5) + 50) * (1 - appear(frame, b(7) + 6))
  const p2 = appear(frame, b(7) + 6)
  const v1 = appear(frame, b(7) + 24)
  const v2 = appear(frame, b(7) + 56)
  const annaV = appear(frame, b(7) + 96)
  const annaVDraw = interpolate(frame, [b(7) + 104, b(7) + 120], [0, 1], CLAMP)
  const newV = appear(frame, b(7) + 126)
  const newVDraw = interpolate(frame, [b(7) + 134, b(7) + 150], [0, 1], CLAMP)
  // будущие недели: вопрос и варианты от ИИ
  const ask = appear(frame, b(8) + 10)
  const optAt = [b(8) + 44, b(8) + 58]

  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(1) + 30, ['point', 'neutral']],
    [b(1) + 100, ['stand', 'neutral']],
    [b(2) + 60, ['surprised', 'worried']],
    [b(3) + 10, ['think', 'worried']],
    [b(4) + 10, ['point', 'worried']],
    [b(4) + 60, ['stand', 'worried']],
  ])
  const anna = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'happy']],
    [b(0) + 120, ['cheer', 'happy']],
    [b(1), ['stand', 'happy']],
    [b(2) + 40, ['surprised', 'worried']],
    [b(3) + 20, ['think', 'worried']],
    [b(4) + 56, ['surprised', 'worried']],
    [b(4) + 80, ['stand', 'worried']],
    [b(4) + 150, ['think', 'worried']],
  ])
  const you = stepAt<[Pose, Mood]>(frame, [
    [0, ['think', 'neutral']],
    [b(8) + 80, ['point', 'neutral']],
    [b(8) + 150, ['stand', 'happy']],
  ])
  const agent = stepAt<AgentPose>(frame, [
    [0, 'working'],
    [b(8) + 60, 'done'],
    [b(8) + 130, 'idle'],
  ])

  // карточка тренировки Анны на доске 1: строка 0 — присед, строка 1 — жим
  const dayCard = (d: (typeof DAYS)[number], n: number) => {
    const { x, y, w } = d.card
    const a = appear(frame, cardAt[n])
    return (
      <g key={d.title} opacity={a} transform={`translate(0 ${(1 - a) * 14})`}>
        <Card x={x} y={y} w={w} h={S2_CARD_H} stroke={theme.accent} fill={theme.white}>
          <Label x={x + 22} y={y + 40} anchor="start" size={22} weight={700} color={theme.accent}>
            {d.title}
          </Label>
          {[0, 1].map((i) => {
            const cy = rowY(y, i)
            const flipped = i === 1 && frame >= flipAt[n]
            const gone = i === 0 && frame >= goneAt[n]
            const name = i === 0 ? 'Присед 3×10' : flipped ? 'Жим гантелей 3×10' : 'Жим лёжа 3×10'
            return (
              <g key={i} opacity={appear(frame, rowAt[i], 8)}>
                <line x1={x + 16} y1={cy - R / 2} x2={x + w - 16} y2={cy - R / 2} stroke={theme.grid} strokeWidth={2} />
                {gone ? (
                  <g>
                    <rect x={x + 10} y={cy - R / 2 + 6} width={w - 20} height={R - 12} rx={8} fill={theme.riskTint} stroke={theme.risk} strokeWidth={2.5} strokeDasharray="8 6" />
                    <Label x={x + w / 2} y={cy + 7} size={20} weight={700} color={theme.risk}>
                      подходы удалены
                    </Label>
                  </g>
                ) : (
                  <g>
                    {flipped && <rect x={x + 10} y={cy - R / 2 + 6} width={w - 20} height={R - 12} rx={8} fill={theme.riskTint} opacity={appear(frame, flipAt[n], 6)} />}
                    <Label x={x + 22} y={cy + 7} anchor="start" size={20} weight={600} color={flipped ? theme.risk : theme.ink}>
                      {name}
                    </Label>
                    <Label x={x + w - 58} y={cy + 7} anchor="end" size={20} weight={600} color={theme.soft}>
                      {KG[i]}
                    </Label>
                    <g opacity={appear(frame, doneAt[i], 8)}>
                      <Mark x={x + w - 34} y={cy} ok={!flipped} r={13} />
                    </g>
                  </g>
                )}
              </g>
            )
          })}
        </Card>
      </g>
    )
  }

  return (
    <KitScene chip="2 / 3 · Подводный камень" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* доска 1: две прошлые тренировки Анны */}
      {DAYS.map(dayCard)}
      <Client x={S2.anna.x} y={S2.anna.y} scale={0.7} color={theme.accent} label="Анна" enterAt={0} pose={anna[0]} mood={anna[1]} />
      <g opacity={say}>
        <Callout x={108} y={170} tx={110} ty={244} text="жала штангу!" color={theme.risk} size={20} />
      </g>

      {/* ссылки строк тренировок на строки шаблона */}
      {DAYS.flatMap((d, n) =>
        [0, 1].map((i) => {
          const k = n * 2 + i
          const draw = interpolate(frame, [linkAt[k], linkAt[k] + 16], [0, 1], CLAMP)
          if (draw <= 0) return null
          const x1 = d.card.x + d.card.w
          const y1 = rowY(d.card.y, i)
          const x2 = T.x
          const y2 = rowY(T.y, i)
          const color = i === 0 && deleted ? theme.risk : theme.accent
          return (
            <g key={k}>
              <line x1={x1} y1={y1} x2={x1 + (x2 - x1) * draw} y2={y1 + (y2 - y1) * draw} stroke={color} strokeWidth={3} strokeDasharray="8 6" />
              <circle cx={x1} cy={y1} r={5} fill={color} />
              {draw >= 1 && <circle cx={x2} cy={y2} r={5 + 5 * pulse} fill={color} />}
            </g>
          )
        }),
      )}
      <g opacity={linkPill}>
        <Pill x={705} y={160} w={110} text="ссылка" color={theme.accent} fill={theme.white} size={20} compact />
      </g>

      {/* шаблон «Сила»: правка жима и удаление приседа */}
      <g opacity={tplIn}>
        <Card x={T.x} y={T.y} w={T.w} h={S2_TPL_H} stroke={theme.alt} fill={theme.white}>
          <Label x={T.x + 22} y={T.y + 40} anchor="start" size={22} weight={700} color={theme.alt}>
            Шаблон «Сила» · Пн и Чт
          </Label>
          {TEMPLATE.map((row, i) => {
            const cy = rowY(T.y, i)
            const isEdit = i === 1
            const isDel = i === 0
            return (
              <g key={row.name}>
                <line x1={T.x + 16} y1={cy - R / 2} x2={T.x + T.w - 16} y2={cy - R / 2} stroke={theme.grid} strokeWidth={2} />
                {isDel && deleted ? (
                  <g>
                    <rect x={T.x + 10} y={cy - R / 2 + 6} width={T.w - 20} height={R - 12} rx={8} fill="none" stroke={theme.risk} strokeWidth={2.5} strokeDasharray="8 6" />
                    <Label x={T.x + T.w / 2} y={cy + 7} size={20} weight={700} color={theme.risk}>
                      удалено
                    </Label>
                  </g>
                ) : (
                  <g>
                    {isEdit && <rect x={T.x + 10} y={cy - R / 2 + 6} width={T.w - 20} height={R - 12} rx={8} fill={theme.altTint} opacity={editHi} />}
                    {isDel && <rect x={T.x + 10} y={cy - R / 2 + 6} width={T.w - 20} height={R - 12} rx={8} fill={theme.riskTint} opacity={delHi} />}
                    <Label x={T.x + 22} y={cy + 7} anchor="start" size={20} weight={600} color={isEdit && edited ? theme.alt : theme.ink}>
                      {isEdit && edited ? typed('Жим гантелей', frame, editAt, 30) : row.name}
                    </Label>
                    <Label x={T.x + T.w - 22} y={cy + 7} anchor="end" size={20} weight={700} color={theme.accent}>
                      {row.plan}
                    </Label>
                    {isEdit && !edited && <Strike x={T.x + 20} y={cy} w={110} draw={editStrike} color={theme.alt} />}
                    {isDel && <Strike x={T.x + 20} y={cy} w={T.w - 40} draw={delStrike} />}
                  </g>
                )}
              </g>
            )
          })}
        </Card>
      </g>
      <g opacity={editPill}>
        <Pill x={T.x + T.w / 2} y={T.y + S2_TPL_H + 44} w={250} text="правка шаблона" color={theme.alt} fill={theme.altTint} size={20} compact />
      </g>
      <g opacity={delPill}>
        <Pill x={T.x + T.w / 2} y={T.y + S2_TPL_H + 44} w={270} text="удаление с каскадом" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>
      <Coach x={S2.marina.x} y={S2.marina.y} scale={0.7} color={theme.accent} label="Марина" enterAt={6} pose={marina[0]} mood={marina[1]} />

      {/* доска 2, способ 1: копия плана при назначении */}
      <g opacity={p1}>
        <rect x={P1.x} y={P1.y} width={P1.w} height={P1.h} rx={14} fill={theme.zone} stroke={theme.accent} strokeWidth={3} />
        <Label x={P1.x + 22} y={P1.y + 38} anchor="start" size={22} weight={700} color={theme.accent}>
          Способ 1 · копия
        </Label>
      </g>
      <g opacity={tpl1}>
        <MiniCard x={P1.x + C.left} y={C.top} title="Шаблон «Сила»" color={theme.alt}>
          <rect x={P1.x + C.left + 8} y={C.top + 56} width={C.w - 16} height={36} rx={8} fill={theme.altTint} opacity={tplEditHi} />
          <Label x={P1.x + C.left + 18} y={C.top + 81} anchor="start" size={20} weight={600} color={frame >= tplEditAt ? theme.alt : theme.ink}>
            {frame >= tplEditAt ? typed('Жим гантелей 3×10', frame, tplEditAt, 30) : 'Жим лёжа 3×10'}
          </Label>
          {frame < tplEditAt && <Strike x={P1.x + C.left + 16} y={C.top + 74} w={100} draw={tplEditStrike} color={theme.alt} />}
        </MiniCard>
      </g>
      <Arrow x1={P1.x + C.left + C.w + 4} y1={C.top + C.h / 2} x2={P1.x + C.right - 4} y2={C.top + C.h / 2} color={theme.accent} draw={copyDraw} />
      <g opacity={copyDraw}>
        <Label x={P1.x + (C.left + C.w + C.right) / 2} y={C.top + C.h / 2 - 14} size={18} weight={700} color={theme.accent}>
          копия
        </Label>
      </g>
      <g opacity={annaCopy}>
        <MiniCard x={P1.x + C.right} y={C.top} title="Анна · неделя 1" color={kept > 0 ? theme.ok : theme.accent}>
          {frame >= copyFly + 20 && (
            <Label x={P1.x + C.right + 18} y={C.top + 81} anchor="start" size={20} weight={600}>
              Жим лёжа 3×10
            </Label>
          )}
          <g opacity={kept}>
            <Mark x={P1.x + C.right + C.w - 26} y={C.top + 74} ok r={13} />
          </g>
        </MiniCard>
      </g>
      <Arrow x1={P1.x + C.left + C.w + 4} y1={C.top + C.h - 10} x2={P1.x + C.right - 4} y2={C.bottom + C.h / 2} color={theme.accent} draw={newDraw} />
      <g opacity={newSlot}>
        <rect x={P1.x + C.right} y={C.bottom} width={C.w} height={C.h} rx={12} fill="none" stroke={theme.grid} strokeWidth={3} strokeDasharray="10 8" />
        <Label x={P1.x + C.right + C.w / 2} y={C.bottom + C.h / 2 + 8} size={20} weight={700} color={theme.line}>
          новое назначение
        </Label>
      </g>
      <g opacity={newCard}>
        <MiniCard x={P1.x + C.right} y={C.bottom} title="Новое назначение" color={theme.accent}>
          {frame >= newFly + 16 && (
            <Label x={P1.x + C.right + 18} y={C.bottom + 81} anchor="start" size={20} weight={600} color={theme.alt}>
              Жим гантелей 3×10
            </Label>
          )}
        </MiniCard>
      </g>
      {/* копия плана в полёте: из шаблона в тренировку */}
      {[
        { at: copyFly, y2: C.top + 74, text: 'Жим лёжа 3×10', color: theme.accent },
        { at: newFly, y2: C.bottom + 74, text: 'Жим гантелей 3×10', color: theme.alt },
      ].map((f) => {
        if (frame < f.at || frame >= f.at + 20) return null
        const w = Math.round(f.text.length * 18 * 0.56 + 28)
        const p = trackAt(frame, [
          [f.at, P1.x + C.left + 18 + w / 2, C.top + 74],
          [f.at + 18, P1.x + C.right + 18 + w / 2, f.y2],
        ])
        return <Pill key={f.at} x={p.x} y={p.y} w={w} text={f.text} color={f.color} fill={theme.white} size={18} compact />
      })}

      {/* способ 2: версии шаблона — сначала пунктирное место */}
      <g opacity={slot2}>
        <rect x={P2.x} y={P2.y} width={P2.w} height={P2.h} rx={14} fill="none" stroke={theme.grid} strokeWidth={3} strokeDasharray="10 8" />
        <Label x={P2.x + P2.w / 2} y={P2.y + P2.h / 2 + 8} size={22} weight={700} color={theme.line}>
          способ 2
        </Label>
      </g>
      <g opacity={p2}>
        <rect x={P2.x} y={P2.y} width={P2.w} height={P2.h} rx={14} fill={theme.zone} stroke={theme.accent} strokeWidth={3} />
        <Label x={P2.x + 22} y={P2.y + 38} anchor="start" size={22} weight={700} color={theme.accent}>
          Способ 2 · версии
        </Label>
      </g>
      <g opacity={v1}>
        <MiniCard x={P2.x + C.left} y={C.top} title="Версия 1" color={theme.alt}>
          <Label x={P2.x + C.left + 18} y={C.top + 81} anchor="start" size={20} weight={600}>
            Жим лёжа 3×10
          </Label>
        </MiniCard>
      </g>
      <g opacity={v2} transform={`translate(0 ${(1 - v2) * 14})`}>
        <MiniCard x={P2.x + C.left} y={C.bottom} title="Версия 2" color={theme.alt}>
          <Label x={P2.x + C.left + 18} y={C.bottom + 81} anchor="start" size={20} weight={600} color={theme.alt}>
            Жим гантелей 3×10
          </Label>
        </MiniCard>
      </g>
      <g opacity={annaV}>
        <MiniCard x={P2.x + C.right} y={C.top} title="Анна · неделя 1" color={theme.accent}>
          <Label x={P2.x + C.right + 18} y={C.top + 81} anchor="start" size={20} weight={600} color={theme.accent}>
            по версии 1
          </Label>
        </MiniCard>
      </g>
      <Arrow x1={P2.x + C.right - 4} y1={C.top + C.h / 2} x2={P2.x + C.left + C.w + 4} y2={C.top + C.h / 2} color={theme.accent} draw={annaVDraw} />
      <g opacity={newV}>
        <MiniCard x={P2.x + C.right} y={C.bottom} title="Новое назначение" color={theme.accent}>
          <Label x={P2.x + C.right + 18} y={C.bottom + 81} anchor="start" size={20} weight={600} color={theme.accent}>
            по версии 2
          </Label>
        </MiniCard>
      </g>
      <Arrow x1={P2.x + C.right - 4} y1={C.bottom + C.h / 2} x2={P2.x + C.left + C.w + 4} y2={C.bottom + C.h / 2} color={theme.accent} draw={newVDraw} />

      {/* будущие недели Анны: решаете вы, ИИ предлагает варианты */}
      <g opacity={askSlot}>
        <rect x={BOARD2 + 640 - 210} y={S2.question.y - 18} width={420} height={36} rx={18} fill="none" stroke={theme.grid} strokeWidth={2.5} strokeDasharray="8 6" />
        <Label x={BOARD2 + 640} y={S2.question.y + 7} size={20} weight={600} color={theme.line}>
          а будущие недели?
        </Label>
      </g>
      <g opacity={ask}>
        <Pill x={BOARD2 + 640} y={S2.question.y} w={420} text="будущие недели Анны — как быть?" color={theme.alt} fill={theme.white} size={20} compact />
      </g>
      {[
        { t: 'А · оставить как были', w: 290 },
        { t: 'Б · перевести на новый план', w: 360 },
      ].map((o, i) => (
        <g key={o.t} opacity={appear(frame, optAt[i])} transform={`translate(0 ${(1 - appear(frame, optAt[i])) * 10})`}>
          <Pill x={BOARD2 + 640 + (i === 0 ? -S2.options.dx : S2.options.dx)} y={S2.options.y} w={o.w} text={o.t} color={theme.ink} fill={theme.white} size={20} compact />
        </g>
      ))}
      {frame >= b(8) + 20 && <You x={S2.you.x} y={S2.you.y} scale={0.5} enterAt={b(8) + 20} pose={you[0]} mood={you[1]} />}
      {frame >= b(8) + 24 && <Agent x={S2.agent.x} y={S2.agent.y} scale={0.5} label="ИИ" enterAt={b(8) + 24} pose={agent} />}
    </KitScene>
  )
}

/** Карточка панели доски 2: заголовок и место под одну строку плана (дети — в координатах холста). */
function MiniCard({ x, y, title, color, children }: { x: number; y: number; title: string; color: string; children?: React.ReactNode }) {
  return (
    <Card x={x} y={y} w={C.w} h={C.h} stroke={color} fill={theme.white}>
      <Label x={x + 18} y={y + 36} anchor="start" size={20} weight={700} color={color}>
        {title}
      </Label>
      <line x1={x + 14} y1={y + 52} x2={x + C.w - 14} y2={y + 52} stroke={theme.grid} strokeWidth={2} />
      {children}
    </Card>
  )
}
