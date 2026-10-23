import { interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Client } from '../../actors/Client'
import { Database } from '../../actors/Database'
import { Hacker } from '../../actors/Hacker'
import type { Mood, Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Browser, Mark, Pill } from '../../kit/props'
import { revealCount, stepAt, typed } from '../../kit/reveal'
import { theme } from '../../theme'
import { S2 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'

const ID = 's2-injection'
const G = S2.grid
const B = S2.bars
const FQ = S2.freq
const F = S2.form
const GL = S2.glue
const PC = S2.parcel
const PM = S2.param
const RS = S2.result
const IC = S2.idor
const BR = S2.browser

// что ввели в поле «Почта» вместо адреса (пример со схемы книги)
const EVIL = "x' OR '1'='1"
// чьи записи лежат в базе
const ROWS = ['Анна', 'Олег', 'Ира', 'Макс']
// ширина знака моноширинного шрифта 20 px
const CH = 12.04
const MONO = (size: number) => ({ font: `600 ${size}px ${theme.mono}`, whiteSpace: 'pre' as const })

// Сцена 2: по отчёту Veracode 2026 модели выбирают надёжный путь лишь в 56% случаев (55% год назад):
// модель повторяет частое. Инъекция через поле «Почта»: склейка отдаёт все записи, параметр — нет.
// Подмена номера в адресе (IDOR) — коротко, карточкой с отсылкой к ролику дня 4.
export function S2Injection() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: сотня моделей и доля надёжных решений
  const gridShown = revealCount(frame, b(0) + 8, 0.6, G.cols * G.rows)
  const split = frame >= b(0) + 100
  const bar26 = interpolate(frame, [b(0) + 60, b(0) + 100], [0, 1], CLAMP)
  const half = appear(frame, b(0) + 150) * (1 - appear(frame, b(1) + 66, 10))
  const bar25 = interpolate(frame, [b(1) + 6, b(1) + 40], [0, 1], CLAMP)
  const smarter = appear(frame, b(1) + 50)
  const agentIn = b(1) + 76
  const freq = interpolate(frame, [b(1) + 84, b(1) + 116], [0, 1], CLAMP)
  const pick = interpolate(frame, [b(1) + 126, b(1) + 142], [0, 1], CLAMP)
  const goalOk = appear(frame, b(1) + 150)
  const goalNo = appear(frame, b(1) + 176)
  const ask = appear(frame, b(2) + 4)

  // доска 2: опасный путь; пока безопасного нет, он стоит ниже, по центру
  const rise = interpolate(frame, [b(4) - 10, b(4) + 14], [S2.rise, 0], CLAMP)
  // пока кода и базы нет, форма с вводом стоит посередине доски
  const shift = interpolate(frame, [b(3) - 12, b(3) + 4], [S2.shift, 0], CLAMP)
  const formAt = b(2) + 64
  const typeAt = b(2) + 86
  const hackerIn = appear(frame, b(2) + 70) * (1 - appear(frame, b(3) - 6, 10))
  const notMail = appear(frame, b(2) + 132) * (1 - appear(frame, b(4) - 10, 10))
  const toGlue = interpolate(frame, [b(3), b(3) + 14], [0, 1], CLAMP)
  const glue = appear(frame, b(3) + 6)
  const hot = appear(frame, b(3) + 56)
  const toDb = interpolate(frame, [b(3) + 66, b(3) + 80], [0, 1], CLAMP)
  const dbIn = appear(frame, b(3) + 72)
  const leak = frame >= b(3) + 100
  const leakPill = appear(frame, b(3) + 116)

  // доска 2: безопасный путь
  const parcel = appear(frame, b(4) + 10)
  const toParam = interpolate(frame, [b(4) + 30, b(4) + 44], [0, 1], CLAMP)
  const param = appear(frame, b(4) + 38)
  const toResult = interpolate(frame, [b(4) + 66, b(4) + 80], [0, 1], CLAMP)
  const result = appear(frame, b(4) + 76)

  // поверх: подмена номера
  const card = appear(frame, b(5) + 26)
  const swap = frame >= b(5) + 76
  const leakOleg = frame >= b(5) + 92
  const tagIdor = appear(frame, b(5) + 100)
  const tagDay = appear(frame, b(5) + 130)

  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(1) + 96, 'working'],
    [b(1) + 140, 'done'],
    [b(2) + 4, 'idle'],
  ])
  const hacker = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [typeAt - 4, ['point', 'happy']],
  ])
  const share = (p: number) => B.w * p

  return (
    <KitScene
      chip="2 / 7 · Дыры в коде от ИИ"
      duration={sceneDuration(ID)}
      {...STAGING[ID]}
      overlay={
        card > 0 ? (
          <g opacity={card}>
            <rect x={0} y={0} width={1280} height={720} fill={theme.ink} opacity={0.62} />
            <Card x={IC.x} y={IC.y} w={IC.w} h={IC.h} fill={theme.paper} stroke={theme.risk} />
            <Browser x={BR.x} y={BR.y} w={BR.w} h={BR.h} at={b(5) + 30} url={swap ? `…/client/1${typed('8', frame, b(5) + 76, 30)}` : '…/client/17'}>
              <text x={24} y={98} fill={swap ? theme.risk : theme.ink} style={{ font: `700 26px ${theme.font}` }}>
                {swap ? 'Тренировки Олега' : 'Тренировки Анны'}
              </text>
              {[0, 1].map((i) => (
                <rect key={i} x={24} y={118 + i * 30} width={BR.w - 48 - i * 120} height={20} rx={6} fill={swap ? theme.riskTint : theme.grid} />
              ))}
            </Browser>
            {/* чья страница открыта: сначала своя (Анна), после подмены — чужая (Олег) */}
            <ellipse cx={swap ? S2.oleg.x : S2.anna.x} cy={S2.anna.y - 8} rx={70} ry={64} fill={swap ? theme.riskTint : theme.accentTint} stroke={swap ? theme.risk : theme.accent} strokeWidth={3} />
            <Client x={S2.anna.x} y={S2.anna.y} scale={0.75} label="Анна, №17" />
            <Client x={S2.oleg.x} y={S2.oleg.y} scale={0.75} label="Олег, №18" mood={leakOleg ? 'worried' : 'neutral'} />
            <g opacity={tagIdor}>
              <Pill x={BR.x + BR.w / 2} y={BR.y + BR.h + 60} text="IDOR: 17 → 18 — и видно чужое" color={theme.risk} fill={theme.riskTint} size={22} />
            </g>
            <g opacity={tagDay}>
              <Pill x={(IC.x + IC.x + IC.w) / 2} y={IC.y + IC.h - 52} text="как закрыть это в базе — в ролике дня 4" color={theme.accent} fill={theme.accentTint} size={22} />
            </g>
          </g>
        ) : undefined
      }
    >
      {/* доска 1: больше сотни моделей */}
      <g opacity={appear(frame, b(0))}>
        <Label x={G.x} y={G.y - 20} anchor="start" size={24} weight={700}>
          Veracode, 2026: больше 100 моделей
        </Label>
      </g>
      {Array.from({ length: gridShown }, (_, i) => {
        const x = G.x + (i % G.cols) * (G.size + G.gap)
        const y = G.y + Math.floor(i / G.cols) * (G.size + G.gap)
        // после полосы 2026 года — 56% зелёные
        const safe = i < Math.round(G.cols * G.rows * 0.56)
        return <rect key={i} x={x} y={y} width={G.size} height={G.size} rx={5} fill={split ? (safe ? theme.ok : theme.risk) : theme.accent} opacity={0.85} />
      })}

      <g opacity={half}>
        <Pill x={G.x + (G.cols * (G.size + G.gap) - G.gap) / 2} y={S2.half.y} w={420} text="опасных решений — почти половина" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>

      {/* доля надёжных решений: 2026 и год назад */}
      {[
        { label: '2026', p: 0.56, t: bar26, y: B.y },
        { label: 'год назад', p: 0.55, t: bar25, y: B.y + B.h + B.gap },
      ].map((r) => (
        <g key={r.label} opacity={r.t > 0 ? 1 : 0}>
          <Label x={B.x - 14} y={r.y + B.h / 2 + 8} anchor="end" size={22} weight={700}>
            {r.label}
          </Label>
          <rect x={B.x} y={r.y} width={share(r.p) * r.t} height={B.h} rx={10} fill={theme.ok} />
          <rect x={B.x + share(r.p) + 4} y={r.y} width={(share(1 - r.p) - 4) * r.t} height={B.h} rx={10} fill={theme.riskTint} stroke={theme.risk} strokeWidth={3} />
          <g opacity={r.t >= 1 ? 1 : 0}>
            <Label x={B.x + 12} y={r.y + B.h / 2 + 8} anchor="start" size={21} weight={700} color={theme.white}>
              {`надёжно ${Math.round(r.p * 100)}%`}
            </Label>
            <Label x={B.x + share(r.p) + share(1 - r.p) / 2 + 2} y={r.y + B.h / 2 + 8} size={20} weight={700} color={theme.risk}>
              опасно
            </Label>
          </g>
        </g>
      ))}
      <g opacity={smarter}>
        <Pill x={S2.smarter.x} y={S2.smarter.y} text="умнее, но не безопаснее" color={theme.risk} fill={theme.paper} size={20} compact />
      </g>

      {/* модель повторяет частое */}
      {frame >= agentIn && <Agent x={S2.agent.x} y={S2.agent.y} scale={0.65} enterAt={agentIn} pose={agent} />}
      <g opacity={freq > 0 ? 1 : 0}>
        <Label x={FQ.x} y={FQ.y - 16} anchor="start" size={20} weight={600} color={theme.soft}>
          как часто встречается в открытом коде
        </Label>
        <rect x={FQ.x} y={FQ.y} width={FQ.w * 0.8 * freq} height={FQ.h} rx={8} fill={theme.risk} stroke={pick > 0 ? theme.ink : 'none'} strokeWidth={pick > 0 ? 3 : 0} />
        <Label x={FQ.x + 14} y={FQ.y + FQ.h / 2 + 7} anchor="start" size={20} weight={700} color={theme.white} opacity={freq >= 1 ? 1 : 0}>
          склейка строк
        </Label>
        <rect x={FQ.x} y={FQ.y + FQ.h + FQ.gap} width={FQ.w * 0.2 * freq} height={FQ.h} rx={8} fill={theme.ok} />
        <Label x={FQ.x + FQ.w * 0.2 + 12} y={FQ.y + FQ.h * 1.5 + FQ.gap + 7} anchor="start" size={20} weight={700} color={theme.ok} opacity={freq >= 1 ? 1 : 0}>
          параметр
        </Label>
      </g>
      <Arrow x1={FQ.x - 8} y1={FQ.y + FQ.h / 2} x2={S2.agent.x + 52} y2={S2.agent.y - 40} color={theme.risk} draw={pick} />
      <g opacity={goalOk}>
        <Pill x={S2.goal.x} y={S2.goal.ok} text="цель модели: «работает»" color={theme.ok} fill={theme.okTint} size={20} compact />
        <Mark x={S2.goal.x + 172} y={S2.goal.ok} ok r={16} />
      </g>
      <g opacity={goalNo}>
        <Pill x={S2.goal.x} y={S2.goal.no} text="«не взломают» — если попросить" color={theme.risk} fill={theme.paper} size={20} compact />
      </g>
      <g opacity={ask}>
        <Pill x={S2.goal.x} y={S2.ask.y} text="просите прямо: «защити от инъекций»" color={theme.accent} fill={theme.accentTint} size={20} compact />
      </g>

      {/* доска 2, верх: опасно — ввод приклеен к запросу */}
      <g transform={`translate(${shift} ${rise})`}>
        <g opacity={appear(frame, formAt)}>
          <Label x={F.x} y={F.y - 16} anchor="start" size={22} weight={700} color={theme.risk}>
            Опасно: запрос склеен с вводом
          </Label>
        </g>
        {frame >= formAt && (
          <Browser x={F.x} y={F.y} w={F.w} h={F.h} at={formAt} url="вход">
            <text x={24} y={74} fill={theme.soft} style={{ font: `600 20px ${theme.font}` }}>
              Почта
            </text>
            <rect x={24} y={86} width={F.w - 48} height={42} rx={8} fill={theme.paper} stroke={frame >= typeAt ? theme.risk : theme.grid} strokeWidth={frame >= typeAt ? 3 : 2} />
            <text x={36} y={114} fill={theme.risk} style={MONO(20)}>
              {typed(EVIL, frame, typeAt, 14)}
            </text>
            <rect x={24} y={140} width={110} height={30} rx={8} fill={theme.accent} />
            <text x={79} y={161} textAnchor="middle" fill={theme.white} style={{ font: `600 18px ${theme.font}` }}>
              Войти
            </text>
          </Browser>
        )}
        <g opacity={hackerIn}>
          <g transform={`translate(${2 * S2.hacker.x} 0) scale(-1 1)`}>
            <Hacker x={S2.hacker.x} y={S2.hacker.y} scale={0.8} pose={hacker[0]} mood={hacker[1]} />
          </g>
        </g>
        <g opacity={notMail}>
          <Pill x={F.x + F.w / 2} y={F.y + F.h + 30} text="не адрес, а команда" color={theme.risk} fill={theme.paper} size={20} compact />
        </g>
        <Arrow x1={F.x + F.w + 8} y1={F.y + 100} x2={GL.x - 8} y2={GL.y + 100} color={theme.risk} draw={toGlue} />
        <g opacity={glue}>
          <Card x={GL.x} y={GL.y} w={GL.w} h={GL.h} stroke={theme.risk}>
            <Label x={GL.x + 20} y={GL.y + 36} anchor="start" size={20} weight={700}>
              Код склеивает
            </Label>
            <text x={GL.x + 20} y={GL.y + 84} fill={theme.ink} style={MONO(20)}>
              {typed('SELECT * FROM clients', frame, b(3) + 12, 40)}
            </text>
            <rect x={GL.x + 14 + 14 * CH} y={GL.y + 102} width={(EVIL.length + 2) * CH + 12} height={32} rx={6} fill={theme.riskTint} stroke={theme.risk} strokeWidth={2} opacity={hot} />
            <text x={GL.x + 20} y={GL.y + 124} fill={theme.ink} style={MONO(20)}>
              {typed('WHERE email = ', frame, b(3) + 28, 40)}
              <tspan fill={theme.risk}>{frame >= b(3) + 40 ? `'${EVIL}'` : ''}</tspan>
            </text>
          </Card>
        </g>
        <Arrow x1={GL.x + GL.w + 8} y1={GL.y + 100} x2={S2.db.x - 92} y2={S2.db.y} color={theme.risk} draw={toDb} />
        <g opacity={dbIn}>
          <Database x={S2.db.x} y={S2.db.y} scale={0.62} label="База" rows={ROWS.map((t) => ({ text: t, color: leak ? theme.risk : theme.ok }))} />
        </g>
        <g opacity={leakPill}>
          <Pill x={S2.leak.x} y={S2.leak.y} text="выдала все записи" color={theme.risk} fill={theme.riskTint} size={20} compact />
        </g>
      </g>

      {/* доска 2, низ: безопасно — значение отдельно, параметром */}
      <g opacity={parcel}>
        <Label x={PC.x} y={PC.y - 24} anchor="start" size={22} weight={700} color={theme.ok}>
          Безопасно: значение — параметром
        </Label>
        <Card x={PC.x} y={PC.y} w={PC.w} h={PC.h} stroke={theme.ok}>
          <rect x={PC.x + 20} y={PC.y + 22} width={PC.w - 40} height={44} rx={8} fill={theme.codeBg} stroke={theme.line} strokeWidth={2} />
          <text x={PC.x + 34} y={PC.y + 51} fill={theme.ink} style={MONO(20)}>
            {`$1 = ${EVIL}`}
          </text>
          <Label x={PC.x + 20} y={PC.y + 100} anchor="start" size={20} weight={600} color={theme.ok}>
            пакет с наклейкой: просто текст
          </Label>
        </Card>
      </g>
      <Arrow x1={PC.x + PC.w + 8} y1={PM.y + 90} x2={PM.x - 8} y2={PM.y + 90} color={theme.ok} draw={toParam} />
      <g opacity={param}>
        <Card x={PM.x} y={PM.y} w={PM.w} h={PM.h} stroke={theme.ok}>
          <Label x={PM.x + 20} y={PM.y + 36} anchor="start" size={20} weight={700}>
            Запрос отдельно от значения
          </Label>
          <text x={PM.x + 20} y={PM.y + 84} fill={theme.ink} style={MONO(20)}>
            SELECT * FROM clients
          </text>
          <text x={PM.x + 20} y={PM.y + 124} fill={theme.ink} style={MONO(20)}>
            {'WHERE email = '}
            <tspan fill={theme.ok}>$1</tspan>
          </text>
        </Card>
      </g>
      <Arrow x1={PM.x + PM.w + 8} y1={PM.y + 90} x2={RS.x - 8} y2={RS.y + 66} color={theme.ok} draw={toResult} />
      <g opacity={result}>
        <Card x={RS.x} y={RS.y} w={RS.w} h={RS.h} stroke={theme.ok} fill={theme.okTint}>
          <Mark x={RS.x + 40} y={RS.y + 46} ok r={20} />
          <Label x={RS.x + 72} y={RS.y + 54} anchor="start" size={22} weight={700} color={theme.ok}>
            совпадений нет
          </Label>
          <Label x={RS.x + 24} y={RS.y + 100} anchor="start" size={20} weight={500} color={theme.soft}>
            для базы — строка
          </Label>
        </Card>
      </g>
    </KitScene>
  )
}
