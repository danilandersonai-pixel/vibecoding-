import { interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Client } from '../../actors/Client'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP, trackAt } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Pill } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { theme } from '../../theme'
import { CYCLE, LIBRARY, S1, S1_CAL_H, S1_CAL_W, S1_LIB_H, S1_TABLE_H, S1_TPL_H, TEMPLATE } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Calendar, Table, TemplateChip, You } from './parts'

const ID = 's1-build'
const L = S1.library
const T = S1.template
const W = S1.weeks
const TB = S1.tables
const TW = S1.tableW

// центр строки i библиотеки и шаблона (по вертикали)
const libY = (i: number) => L.y + 64 + i * L.row + L.row / 2
const tplY = (i: number) => T.y + T.head + i * T.row + T.row / 2
const chipW = (t: string) => Math.round(t.length * 18 * 0.56 + 28)

// Сцена 1: Марина пишет каждую тренировку вручную → сегодня по одной части: библиотека упражнений,
// шаблон из библиотеки (подходы и повторы), цикл по неделям, назначение заполняет календари.
// Доска 2: модель данных — четыре таблицы; ИИ предлагает схему, решаете вы; вопрос «ссылка или копия?».
export function S1Build() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // листки «вручную» — по одному; уходят, когда появляется библиотека
  const manualAt = S1.manual.map((_, i) => b(0) + 24 + i * 16)
  const manualOut = interpolate(frame, [b(1) + 4, b(1) + 18], [1, 0], CLAMP)
  const again = appear(frame, b(0) + 120) * manualOut

  // пунктирные места будущих частей — как только камера отъехала
  const slots = appear(frame, b(1) + 24)
  const libIn = appear(frame, b(1) + 24)
  const libRowAt = LIBRARY.map((_, i) => b(1) + 44 + i * 14)
  const once = appear(frame, b(1) + 120)
  const tplIn = appear(frame, b(2) + 10)
  // упражнения перелетают из библиотеки в шаблон
  const flyAt = TEMPLATE.map((_, i) => b(2) + 40 + i * 22)
  const weekAt = CYCLE.map((_, i) => b(3) + 20 + i * 16)
  const trend = appear(frame, b(3) + 100)

  // назначение: листок шаблона летит к календарю Анны, клетки заполняются по одной
  const sendAt = b(4) + 16
  const fillAt = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => sendAt + 28 + k * 6)

  // доска 2: модель данных
  const tableAt = [b(5) + 40, b(5) + 54, b(5) + 68, b(5) + 82]
  const linkDraw = interpolate(frame, [b(5) + 110, b(5) + 130], [0, 1], CLAMP)
  const askDraw = interpolate(frame, [b(6) + 6, b(6) + 26], [0, 1], CLAMP)
  const ask = appear(frame, b(6) + 24)

  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 30, ['think', 'worried']],
    [b(1) + 10, ['stand', 'neutral']],
    [b(1) + 30, ['point', 'neutral']],
    [b(3), ['stand', 'happy']],
    [b(4) + 4, ['point', 'happy']],
    [b(4) + 80, ['stand', 'happy']],
  ])
  const anna = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(4) + 6, ['surprised', 'happy']],
    [fillAt[7] + 4, ['cheer', 'happy']],
  ])
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(5) + 40, 'working'],
    [b(5) + 100, 'done'],
    [b(6) + 80, 'idle'],
  ])
  const you = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(5) + 120, ['point', 'neutral']],
    [b(6) + 10, ['think', 'neutral']],
    [b(6) + 120, ['point', 'neutral']],
  ])

  return (
    <KitScene chip="1 / 3 · Что строим сегодня" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* листки, которые Марина пишет вручную каждую неделю */}
      <g opacity={manualOut}>
        {S1.manual.map((m, i) => {
          const a = appear(frame, manualAt[i], 8)
          const cx = m.x + S1.manualW / 2
          const cy = m.y + S1.manualH / 2
          return (
            <g key={i} opacity={a} transform={`rotate(${m.r} ${cx} ${cy}) translate(0 ${(1 - a) * -14})`}>
              <Card x={m.x} y={m.y} w={S1.manualW} h={S1.manualH} stroke={theme.line} fill={theme.white}>
                <Label x={m.x + 16} y={m.y + 30} anchor="start" size={20} weight={700}>
                  {m.who}
                </Label>
                <Label x={m.x + 16} y={m.y + 60} anchor="start" size={20} weight={500} color={theme.soft}>
                  {typed('Присед 3×10, жим…', frame, manualAt[i] + 4, 60)}
                </Label>
              </Card>
            </g>
          )
        })}
      </g>
      <g opacity={again}>
        <Pill x={450} y={472} w={290} text="и так каждую неделю" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>

      {/* пунктирные места: шаблон, недели и календари */}
      <g opacity={slots * (1 - tplIn)}>
        <rect x={T.x} y={T.y} width={T.w} height={S1_TPL_H} rx={12} fill="none" stroke={theme.grid} strokeWidth={3} strokeDasharray="10 8" />
        <Label x={T.x + T.w / 2} y={T.y + S1_TPL_H / 2 + 8} size={22} weight={700} color={theme.line}>
          шаблон
        </Label>
      </g>
      {CYCLE.map((wk, i) => (
        <g key={wk.week} opacity={slots * (1 - appear(frame, weekAt[i]))}>
          <rect x={W.x + i * (W.w + W.gap)} y={W.y} width={W.w} height={W.h} rx={10} fill="none" stroke={theme.grid} strokeWidth={3} strokeDasharray="8 6" />
        </g>
      ))}
      <g opacity={slots * (1 - appear(frame, b(4) - 10))}>
        <rect x={S1.anna.x - S1_CAL_W / 2} y={S1.cal.y} width={S1_CAL_W} height={S1_CAL_H} rx={12} fill="none" stroke={theme.grid} strokeWidth={3} strokeDasharray="10 8" />
        <Label x={S1.anna.x} y={S1.cal.y + S1_CAL_H / 2 + 8} size={20} weight={700} color={theme.line}>
          календарь
        </Label>
      </g>

      {/* 1 · библиотека упражнений */}
      <g opacity={libIn} transform={`translate(0 ${(1 - libIn) * 14})`}>
        <Card x={L.x} y={L.y} w={L.w} h={S1_LIB_H} stroke={theme.accent} fill={theme.white}>
          <Label x={L.x + 20} y={L.y + 40} anchor="start" size={22} weight={700} color={theme.accent}>
            Библиотека упражнений
          </Label>
          {LIBRARY.map((name, i) => {
            const used = TEMPLATE.findIndex((t) => t.lib === i)
            const lit = used >= 0 && frame >= flyAt[used] && frame < flyAt[used] + 24
            return (
              <g key={name} opacity={appear(frame, libRowAt[i], 8)}>
                <line x1={L.x + 16} y1={libY(i) - L.row / 2} x2={L.x + L.w - 16} y2={libY(i) - L.row / 2} stroke={theme.grid} strokeWidth={2} />
                {lit && <rect x={L.x + 8} y={libY(i) - L.row / 2 + 4} width={L.w - 16} height={L.row - 8} rx={8} fill={theme.accentTint} />}
                <Label x={L.x + 20} y={libY(i) + 7} anchor="start" size={20} weight={600}>
                  {name}
                </Label>
              </g>
            )
          })}
        </Card>
      </g>
      <g opacity={once}>
        <Pill x={L.x + L.w / 2} y={L.y + S1_LIB_H + 36} w={250} text="каждое — один раз" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>

      {/* 2 · шаблон программы из упражнений библиотеки */}
      <g opacity={tplIn} transform={`translate(0 ${(1 - tplIn) * 14})`}>
        <Card x={T.x} y={T.y} w={T.w} h={S1_TPL_H} stroke={theme.accent} fill={theme.white}>
          <Label x={T.x + 20} y={T.y + 38} anchor="start" size={22} weight={700} color={theme.accent}>
            Шаблон «Сила»
          </Label>
          <Label x={T.x + 20} y={T.y + 70} anchor="start" size={20} weight={500} color={theme.soft}>
            Пн и Чт · 4 недели
          </Label>
          {TEMPLATE.map((row, i) => {
            const landed = frame >= flyAt[i] + 20
            return (
              <g key={row.name}>
                <line x1={T.x + 16} y1={tplY(i) - T.row / 2} x2={T.x + T.w - 16} y2={tplY(i) - T.row / 2} stroke={theme.grid} strokeWidth={2} />
                {landed && (
                  <>
                    <Label x={T.x + 20} y={tplY(i) + 7} anchor="start" size={20} weight={600}>
                      {row.name}
                    </Label>
                    <Label x={T.x + T.w - 20} y={tplY(i) + 7} anchor="end" size={20} weight={700} color={theme.accent}>
                      {typed(row.plan, frame, flyAt[i] + 22, 20)}
                    </Label>
                  </>
                )}
              </g>
            )
          })}
        </Card>
      </g>
      {/* упражнение в полёте: из строки библиотеки в строку шаблона */}
      {TEMPLATE.map((row, i) => {
        if (frame < flyAt[i] || frame >= flyAt[i] + 20) return null
        const name = LIBRARY[row.lib]
        const w = chipW(row.name)
        const p = trackAt(frame, [
          [flyAt[i], L.x + 20 + chipW(name) / 2, libY(row.lib)],
          [flyAt[i] + 18, T.x + 20 + w / 2, tplY(i)],
        ])
        return <Pill key={row.name} x={p.x} y={p.y} w={w} text={row.name} color={theme.accent} fill={theme.white} size={18} compact />
      })}

      {/* 3 · цикл по неделям */}
      {CYCLE.map((wk, i) => {
        const a = appear(frame, weekAt[i])
        const x = W.x + i * (W.w + W.gap)
        return (
          <g key={wk.week} opacity={a} transform={`translate(0 ${(1 - a) * 12})`}>
            <rect x={x} y={W.y} width={W.w} height={W.h} rx={10} fill={theme.white} stroke={theme.accent} strokeWidth={3} />
            <Label x={x + W.w / 2} y={W.y + 34} size={20} weight={700} color={theme.accent}>
              {wk.week}
            </Label>
            <Label x={x + W.w / 2} y={W.y + 70} size={22} weight={700}>
              {`${wk.sets}×${wk.reps}`}
            </Label>
          </g>
        )
      })}
      <g opacity={trend}>
        <Pill x={W.x + (4 * W.w + 3 * W.gap) / 2} y={W.y + W.h + 38} w={360} text="повторов меньше, вес больше" color={theme.accent} fill={theme.accentTint} size={20} compact />
      </g>

      {/* назначение: календарь Анны на четыре недели */}
      <Calendar cx={S1.anna.x} at={b(4) - 10} fillAt={fillAt} />
      {frame >= sendAt && frame < sendAt + 26 && <TemplateChip {...trackAt(frame, [[sendAt, T.x + T.w - 30, T.y + 40], [sendAt + 24, S1.anna.x, S1.cal.y + S1_CAL_H / 2]])} />}
      <Client x={S1.anna.x} y={S1.anna.y} scale={0.7} color={theme.accent} label="Анна" enterAt={b(1) + 30} pose={anna[0]} mood={anna[1]} />
      <Coach x={S1.marina.x} y={S1.marina.y} scale={0.8} label="Марина" enterAt={0} pose={marina[0]} mood={marina[1]} />

      {/* доска 2: модель данных — четыре таблицы и связи */}
      <Table x={TB.exercises.x} y={TB.exercises.y} title="Упражнения" fields={['название', 'группа мышц']} at={tableAt[0]} />
      <Table x={TB.templates.x} y={TB.templates.y} title="Шаблоны" fields={['название', 'упражнения по неделям']} at={tableAt[1]} />
      <Table x={TB.workouts.x} y={TB.workouts.y} title="Тренировки" fields={['подопечный, дата', 'план — ?']} at={tableAt[2]} mark={1} markAt={b(6) + 20} />
      <Table x={TB.sets.x} y={TB.sets.y} title="Подходы" fields={['тренировка', 'повторы, вес']} at={tableAt[3]} />
      <Arrow x1={TB.templates.x - 4} y1={TB.templates.y + S1_TABLE_H / 2} x2={TB.exercises.x + TW + 4} y2={TB.exercises.y + S1_TABLE_H / 2} color={theme.accent} draw={linkDraw} />
      <Arrow x1={TB.sets.x - 4} y1={TB.sets.y + S1_TABLE_H / 2} x2={TB.workouts.x + TW + 4} y2={TB.workouts.y + S1_TABLE_H / 2} color={theme.accent} draw={linkDraw} />
      <Arrow x1={TB.workouts.x + TW / 2} y1={TB.workouts.y - 4} x2={TB.templates.x + TW / 2} y2={TB.templates.y + S1_TABLE_H + 4} color={theme.alt} dashed draw={askDraw} />
      <g opacity={ask}>
        <Pill x={TB.workouts.x + TW / 2 + 140} y={(TB.templates.y + S1_TABLE_H + TB.workouts.y) / 2} w={230} text="ссылка или копия?" color={theme.alt} fill={theme.white} size={20} compact />
      </g>
      <Agent x={S1.agent.x} y={S1.agent.y} scale={0.7} label="ИИ" enterAt={b(5) + 30} pose={agent} />
      <You x={S1.you.x} y={S1.you.y} scale={0.7} enterAt={b(5) + 40} pose={you[0]} mood={you[1]} />
    </KitScene>
  )
}
