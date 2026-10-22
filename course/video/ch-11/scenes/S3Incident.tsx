import { interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { Phone } from '../../actors/Phone'
import { Server } from '../../actors/Server'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Mark, PhoneScreen, Pill } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { PHONE_FONT } from '../../kit/screens/layout'
import { theme } from '../../theme'
import { PHONE_SCALE, S3 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Moon } from './parts'

const ID = 's3-incident'
const SRC = S3.sources
const H = S3.hyp
const P = S3.pr
const T = S3.test
const C = S3.choices
const RK = S3.risk
const HB = S3.habits

// три источника дежурного агента: журнал, показатели, свежие правки
const SOURCES = ['Журналы', 'Показатели', 'Правки за 2 дня']
const LOG = ['02:13 ошибка сохранения', 'нет поля repeats']
const ERRORS = [1, 0, 1, 0, 1, 0, 9, 14, 18]
const DIFF = [
  { text: '- reps: set.reps', color: theme.risk, fill: theme.riskTint },
  { text: '+ reps: set.repeats', color: theme.ok, fill: theme.okTint },
]
const CHOICES = [
  { text: 'принять', color: theme.ok, fill: theme.okTint },
  { text: 'поправить', color: theme.alt, fill: theme.altTint },
  { text: 'отклонить', color: theme.risk, fill: theme.riskTint },
]
const HABITS = ['Тесты', 'Записи: что и почему сделано', 'Проверка результата']

// Сцена 3: ночной сбой. Подходы не сохраняются — инцидент; дежурный агент собирает журналы, показатели
// и свежие правки, строит гипотезу и присылает исправление пул-реквестом; решает Дима, на сбой пишут тест.
// Без человека чинить боевой сервер рискованно. Поверх — привычки на будущее.
export function S3Incident() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: ночь, ошибка на телефоне Анны, сервер краснеет, инцидент
  const night = appear(frame, 0, 10)
  const toast = appear(frame, b(0) + 46, 8)
  const failed = appear(frame, b(0) + 40, 10)
  const red = frame >= b(0) + 50 ? 0.55 + 0.45 * Math.sin(frame / 3) : 0
  const incident = appear(frame, b(0) + 76)
  const srcAt = [b(1) + 30, b(1) + 58, b(1) + 86]
  const asks = [0, 1, 2].map((i) => appear(frame, b(1) + 150 + i * 10, 8))
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(1) + 20, 'working'],
    [b(1) + 160, 'done'],
  ])

  // доска 2: гипотеза → пул-реквест; Дима решает; тест на сбой; риск без человека
  const hyp = appear(frame, b(2) + 14)
  const pr = appear(frame, b(2) + 34)
  const sent = appear(frame, b(2) + 26, 12)
  const choiceAt = [b(2) + 112, b(2) + 126, b(2) + 140]
  const picked = frame >= b(2) + 176
  const test = appear(frame, b(3) + 12)
  const toTest = appear(frame, b(3) + 4, 12)
  const risk = appear(frame, b(3) + 92)
  const riskDraw = interpolate(frame, [b(3) + 92, b(3) + 112], [0, 1], CLAMP)
  const dima = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(2) + 90, ['think', 'neutral']],
    [b(2) + 160, ['point', 'happy']],
    [b(3) + 60, ['stand', 'happy']],
    [b(3) + 100, ['stand', 'worried']],
  ])

  // поверх: привычки на будущее
  const habits = appear(frame, b(4) + 24)
  const habitAt = [b(4) + 44, b(4) + 72, b(4) + 132]

  return (
    <KitScene
      chip="3 / 7 · Ночной сбой: агент на дежурстве"
      duration={sceneDuration(ID)}
      {...STAGING[ID]}
      overlay={
        <g opacity={habits}>
          <rect x={0} y={0} width={1280} height={720} fill={theme.ink} opacity={0.18} />
          <Card x={HB.x} y={HB.y} w={HB.w} h={HB.h} stroke={theme.accent} fill={theme.paper}>
            <Label x={HB.x + 40} y={HB.y + 58} anchor="start" size={28} weight={700} color={theme.accent}>
              Привычки на будущее
            </Label>
            {HABITS.map((h, i) => {
              const a = appear(frame, habitAt[i])
              return (
                <g key={h} opacity={a} transform={`translate(${(1 - a) * 20} 0)`}>
                  <Mark x={HB.x + 62} y={HB.y + 124 + i * 74} ok r={20} />
                  <Label x={HB.x + 100} y={HB.y + 133 + i * 74} anchor="start" size={26} weight={600}>
                    {h}
                  </Label>
                </g>
              )
            })}
          </Card>
        </g>
      }
    >
      {/* ночь на доске 1 */}
      <rect x={-400} y={-200} width={1680} height={1100} fill={theme.ink} opacity={0.06 * night} />
      <Moon x={S3.moon.x} y={S3.moon.y} />
      <Pill x={S3.clock.x} y={S3.clock.y} w={110} text="02:14" color={theme.soft} size={22} compact />

      {/* телефон Анны: подход не сохранился */}
      <Phone x={S3.phone.x} y={S3.phone.y} scale={PHONE_SCALE} enterAt={2}>
        <PhoneScreen tapAt={b(0) + 30} listAt={0} list={['присед 3 × 10', 'тяга 3 × 8']} label="Сохранить">
          <g opacity={toast} transform={`translate(0 ${(1 - toast) * 10})`}>
            <rect x={-50} y={22} width={100} height={52} rx={8} fill={theme.risk} />
            <text x={0} y={44} textAnchor="middle" fill={theme.white} style={{ font: `700 ${PHONE_FONT}px ${theme.font}` }}>
              Подход не
            </text>
            <text x={0} y={63} textAnchor="middle" fill={theme.white} style={{ font: `700 ${PHONE_FONT}px ${theme.font}` }}>
              сохранён
            </text>
          </g>
        </PhoneScreen>
      </Phone>
      <Label x={S3.phone.x} y={S3.phone.y + 196} size={20} color={theme.soft}>
        телефон Анны
      </Label>
      <g opacity={failed}>
        <Arrow x1={S3.phone.x + 104} y1={S3.phone.y - 20} x2={S3.server.x - 84} y2={S3.phone.y - 20} color={theme.risk} dashed />
        <Mark x={(S3.phone.x + S3.server.x) / 2 + 10} y={S3.phone.y - 52} ok={false} r={16} />
      </g>
      <Server x={S3.server.x} y={S3.server.y} enterAt={4} />
      {[-60, -5, 50].map((dy) => (
        <circle key={dy} cx={S3.server.x - 48} cy={S3.server.y + dy} r={7} fill={theme.risk} opacity={red} />
      ))}
      <g opacity={incident} transform={`translate(${S3.alarm.x} ${S3.alarm.y}) scale(${0.8 + 0.2 * incident}) translate(${-S3.alarm.x} ${-S3.alarm.y})`}>
        <Pill x={S3.alarm.x} y={S3.alarm.y} w={190} text="Инцидент" color={theme.risk} fill={theme.riskTint} size={26} />
      </g>

      {/* дежурный агент и три источника */}
      {frame >= b(0) + 140 && <Agent x={S3.agent.x} y={S3.agent.y} scale={0.8} label="Дежурный агент" enterAt={b(0) + 140} pose={agent} />}
      {SOURCES.map((t, i) => {
        const y = SRC.y + i * (SRC.h + SRC.gap)
        const a = appear(frame, srcAt[i])
        return (
          <g key={t}>
            <rect x={SRC.x} y={y} width={SRC.w} height={SRC.h} rx={12} fill="none" stroke={theme.grid} strokeWidth={3} strokeDasharray="10 8" opacity={appear(frame, b(0) + 150) * (1 - a)} />
            <g opacity={a} transform={`translate(${(1 - a) * 16} 0)`}>
              <Card x={SRC.x} y={y} w={SRC.w} h={SRC.h} stroke={theme.accent}>
                <Label x={SRC.x + 20} y={y + 34} anchor="start" size={22} weight={700} color={theme.accent}>
                  {t}
                </Label>
                {i === 0 &&
                  LOG.map((l, j) => (
                    <text key={l} x={SRC.x + 20} y={y + 68 + j * 28} fill={j === 0 ? theme.risk : theme.ink} style={{ font: `500 20px ${theme.mono}` }}>
                      {typed(l, frame, srcAt[0] + 6 + j * 16, 50)}
                    </text>
                  ))}
                {i === 1 &&
                  ERRORS.map((v, j) => {
                    const h = 4 + v * 4 * appear(frame, srcAt[1] + 6 + j * 3, 8)
                    return <rect key={j} x={SRC.x + 24 + j * 30} y={y + SRC.h - 16 - h} width={20} height={h} rx={3} fill={v > 5 ? theme.risk : theme.line} />
                  })}
                {i === 1 && (
                  <Label x={SRC.x + SRC.w - 20} y={y + 34} anchor="end" size={20} weight={600} color={theme.risk}>
                    ошибки ↑
                  </Label>
                )}
                {i === 2 &&
                  DIFF.map((d, j) => (
                    <g key={d.text} opacity={appear(frame, srcAt[2] + 8 + j * 10, 8)}>
                      <rect x={SRC.x + 12} y={y + 46 + j * 32} width={SRC.w - 24} height={30} rx={4} fill={d.fill} />
                      <text x={SRC.x + 20} y={y + 68 + j * 32} fill={d.color} style={{ font: `500 20px ${theme.mono}`, whiteSpace: 'pre' }}>
                        {d.text}
                      </text>
                    </g>
                  ))}
              </Card>
            </g>
            <Arrow x1={SRC.x - 8} y1={y + SRC.h / 2} x2={S3.agent.x + 56} y2={S3.agent.y - 40 + i * 20} color={theme.accent} draw={appear(frame, srcAt[i] + 12, 12)} />
          </g>
        )
      })}
      {['?', '?', '?'].map((q, i) => (
        <g key={i} opacity={asks[i]}>
          <circle cx={S3.agent.x - 44 + i * 44} cy={S3.agent.y - 110 - (i % 2) * 18} r={17} fill={theme.alt} />
          <Label x={S3.agent.x - 44 + i * 44} y={S3.agent.y - 102 - (i % 2) * 18} size={22} weight={800} color={theme.white}>
            {q}
          </Label>
        </g>
      ))}

      {/* доска 2: гипотеза и пул-реквест — работа агента */}
      <g opacity={hyp}>
        <Card x={H.x} y={H.y} w={H.w} h={H.h} stroke={theme.alt}>
          <Label x={H.x + 22} y={H.y + 38} anchor="start" size={22} weight={700} color={theme.alt}>
            Гипотеза
          </Label>
          <Label x={H.x + 22} y={H.y + 82} anchor="start" size={20} weight={600}>
            {typed('Вчерашняя правка читает поле', frame, b(2) + 20, 50)}
          </Label>
          <Label x={H.x + 22} y={H.y + 114} anchor="start" size={20} weight={600}>
            {typed('repeats, а у подхода его нет', frame, b(2) + 40, 50)}
          </Label>
        </Card>
      </g>
      <Arrow x1={H.x + H.w + 8} y1={H.y + H.h / 2} x2={P.x - 8} y2={P.y + P.h / 2} color={theme.accent} draw={appear(frame, b(2) + 30, 10)} />
      <g opacity={pr}>
        <Card x={P.x} y={P.y} w={P.w} h={P.h} stroke={theme.accent}>
          <Label x={P.x + 22} y={P.y + 38} anchor="start" size={22} weight={700} color={theme.accent}>
            Пул-реквест: вернуть reps
          </Label>
          {[
            { text: '- reps: set.repeats', color: theme.risk, fill: theme.riskTint },
            { text: '+ reps: set.reps', color: theme.ok, fill: theme.okTint },
          ].map((d, j) => (
            <g key={d.text}>
              <rect x={P.x + 12} y={P.y + 62 + j * 36} width={P.w - 24} height={32} rx={4} fill={d.fill} />
              <text x={P.x + 22} y={P.y + 85 + j * 36} fill={d.color} style={{ font: `500 20px ${theme.mono}`, whiteSpace: 'pre' }}>
                {d.text}
              </text>
            </g>
          ))}
        </Card>
      </g>
      <Agent x={RK.x} y={RK.robot} scale={0.7} enterAt={b(2) - 10} pose={frame >= b(2) + 30 ? 'done' : 'working'} />
      <Arrow x1={RK.x - 60} y1={RK.robot - 20} x2={P.x + P.w + 10} y2={RK.robot - 20} color={theme.accent} draw={sent} />

      {/* решение за человеком */}
      {frame >= b(2) + 70 && <Coach x={S3.dima.x} y={S3.dima.y} scale={0.75} color={theme.alt} label="Дима" enterAt={b(2) + 70} pose={dima[0]} mood={dima[1]} />}
      {CHOICES.map((c, i) => {
        const on = picked && i === 0
        const a = appear(frame, choiceAt[i]) * (picked && i > 0 ? 0.4 : 1)
        return (
          <g key={c.text} opacity={a}>
            <Pill x={C.x} y={C.y + i * C.dy} w={C.w} text={c.text} color={c.color} fill={on ? c.fill : theme.paper} size={22} />
            {on && <Mark x={C.x + C.w / 2 + 26} y={C.y} ok r={16} />}
          </g>
        )
      })}
      <Arrow x1={P.x + 70} y1={P.y + P.h + 8} x2={C.x + 40} y2={C.y - 30} color={theme.accent} draw={appear(frame, b(2) + 104, 10)} />
      <Arrow x1={C.x + C.w / 2 + 50} y1={C.y} x2={T.x - 8} y2={T.y + 40} color={theme.ok} draw={toTest} />
      {/* место теста — пунктиром, пока его нет */}
      <rect x={T.x} y={T.y} width={T.w} height={T.h} rx={12} fill="none" stroke={theme.grid} strokeWidth={3} strokeDasharray="10 8" opacity={appear(frame, b(2) + 40) * (1 - test)} />
      <g opacity={test}>
        <Card x={T.x} y={T.y} w={T.w} h={T.h} stroke={theme.ok} fill={theme.okTint}>
          <Label x={T.x + 22} y={T.y + 38} anchor="start" size={22} weight={700} color={theme.ok}>
            Тест на этот сбой
          </Label>
          <Mark x={T.x + 38} y={T.y + 76} ok r={14} />
          <text x={T.x + 62} y={T.y + 83} fill={theme.ink} style={{ font: `500 20px ${theme.mono}` }}>
            подход с reps сохранён
          </text>
          <Label x={T.x + 22} y={T.y + 126} anchor="start" size={20} weight={600} color={theme.soft}>
            чтобы ошибка не вернулась
          </Label>
        </Card>
      </g>

      {/* риск: агент сам чинит боевой сервер */}
      <Server x={RK.x} y={RK.server} scale={0.55} label="Боевой сервер" enterAt={b(3) + 80} />
      <g opacity={risk}>
        <line x1={RK.x} y1={RK.robot + 96} x2={RK.x} y2={RK.robot + 96 + (RK.server - 56 - RK.robot - 96) * riskDraw} stroke={theme.risk} strokeWidth={4} strokeDasharray="9 7" />
        <Pill x={RK.x} y={RK.pill} w={250} text="без человека — риск" color={theme.risk} fill={theme.paper} size={20} compact />
      </g>
    </KitScene>
  )
}
