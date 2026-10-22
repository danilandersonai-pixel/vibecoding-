import { interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Coach } from '../../actors/Coach'
import { type Mood, type Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { KeyGlyph, Mark, Pill } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { theme } from '../../theme'
import { PERMS_H, S5 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Clock, DbIcon } from './parts'

const ID = 's5-task'
const P = S5.perms
const C = S5.cards
const L = S5.low

// права агента (рис. 10.8)
const PERMS = [
  { text: 'Читать и править файлы проекта', ok: true },
  { text: 'Запускать тесты и сборку', ok: true },
  { text: 'Менять тесты без разрешения', ok: false },
  { text: 'Боевая база и настоящие данные', ok: false },
  { text: 'Ключи развёртывания и секреты', ok: false },
]
// записка из четырёх частей: заголовок, подсказка, строки, цвет
const PARTS = [
  { title: 'Задача', hint: 'одно предложение', color: theme.accent },
  { title: 'Контекст', hint: 'где данные и образец', color: theme.accent },
  { title: 'Готово, если', hint: 'как понять, что готово', color: theme.ok },
  { title: 'Нельзя', hint: 'что не трогать', color: theme.risk },
]
const DONE = ['Анне — только её тренировки', 'кириллица в файле цела', 'тесты: своё, чужое, пусто', 'lint, типы и тесты проходят']
const NOT = ['менять старые тесты', 'трогать устройство базы', 'ставить новые библиотеки']
const LOW = ['обновить зависимости', 'тесты для непокрытого кода', 'предупреждения линтера', 'документация']

// левый верхний угол части записки i
const partBox = (i: number) => {
  const col = i % 2
  const row = Math.floor(i / 2)
  return { x: C.x + col * (C.w + C.gap), y: row === 0 ? C.y : C.y + C.h1 + C.gap, h: row === 0 ? C.h1 : C.h2 }
}

// Сцена 5: права агента — только под задачу, боевые данные и ключи у Марины, тесты — договор.
// Доска 2: записка из четырёх частей на примере экспорта тренировок. Доска 3: с чего начинать и размер задачи.
export function S5Task() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: строки прав по очереди
  const permAt = [b(0) + 30, b(0) + 70, b(1) + 56, b(1) + 6, b(1) + 26]
  const keep = [appear(frame, b(1) + 6), appear(frame, b(1) + 26)]
  const keepTag = appear(frame, b(1) + 40)
  const blocked = interpolate(frame, [b(1) + 44, b(1) + 56], [0, 1], CLAMP)
  // «тесты — договор» звучит в конце реплики; плашка под рамкой точки
  const deal = appear(frame, b(1) + 110)

  // доска 2: части записки
  const partAt = [b(2) + 30, b(3) + 10, b(4) + 10, b(5) + 10]
  const doneAt = DONE.map((_, i) => b(4) + 22 + i * 30)
  const notAt = NOT.map((_, i) => b(5) + 16 + i * 18)

  // доска 3: с чего начать и одна задача — один пул-реквест
  const low = appear(frame, b(6) + 10)
  const lowAt = LOW.map((_, i) => b(6) + 40 + i * 16)
  const flowAt = [b(6) + 100, b(6) + 122, b(6) + 140]
  const tick = interpolate(frame, [b(6) + 146, sceneDuration(ID) - 10], [0, 0.6], CLAMP)

  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(0) + 40, 'working'],
    [b(0) + 120, 'done'],
    [b(1) + 44, 'idle'],
    [b(1) + 70, 'working'],
  ])
  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 90, ['think', 'neutral']],
    [b(1) + 10, ['stand', 'neutral']],
    [b(1) + 70, ['stand', 'happy']],
  ])
  const marina3 = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(6) + 100, ['think', 'happy']],
    [b(6) + 170, ['stand', 'happy']],
  ])

  return (
    <KitScene chip="5 / 7 · Права и записка для агента" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* доска 1: права агента */}
      <g opacity={appear(frame, b(0) + 10)}>
        <Card x={P.x} y={P.y} w={P.w} h={PERMS_H} stroke={theme.line} fill={theme.white}>
          <Label x={P.x + 26} y={P.y + 42} anchor="start" size={24} weight={700}>
            Права агента
          </Label>
          <Label x={P.x + P.w - 26} y={P.y + 42} anchor="end" size={18} weight={600} color={theme.soft}>
            ровно под задачу
          </Label>
          {PERMS.map((r, i) => {
            const top = P.y + 64 + i * P.row
            const g = appear(frame, permAt[i], 10)
            return (
              <g key={r.text}>
                <rect x={P.x + 16} y={top + 4} width={P.w - 32} height={P.row - 8} rx={8} fill="none" stroke={theme.grid} strokeWidth={2} strokeDasharray="6 6" />
                <g opacity={g}>
                  <rect x={P.x + 16} y={top + 4} width={P.w - 32} height={P.row - 8} rx={8} fill={r.ok ? theme.okTint : theme.riskTint} />
                  <rect x={P.x + 16} y={top + 4} width={8} height={P.row - 8} rx={4} fill={r.ok ? theme.ok : theme.risk} />
                  <Label x={P.x + 40} y={top + P.row / 2 + 7} anchor="start" size={21} weight={600}>
                    {r.text}
                  </Label>
                  <Pill x={P.x + P.w - 92} y={top + P.row / 2} w={112} text={r.ok ? 'можно' : 'нельзя'} color={r.ok ? theme.ok : theme.risk} fill={theme.white} size={18} compact />
                </g>
              </g>
            )
          })}
        </Card>
      </g>
      <g opacity={deal}>
        <Pill x={P.x + P.w / 2} y={P.y + PERMS_H + 40} w={330} text="тесты — это договор" color={theme.accent} fill={theme.accentTint} size={22} />
      </g>

      {/* песочница с агентом */}
      <g opacity={appear(frame, b(0) + 10)}>
        <rect x={S5.box.x} y={S5.box.y} width={S5.box.w} height={S5.box.h} rx={16} fill={theme.zone} stroke={theme.accent} strokeWidth={3} strokeDasharray="10 7" />
        <Label x={S5.box.x + S5.box.w / 2} y={S5.box.y + 34} size={20} weight={700} color={theme.accent}>
          песочница
        </Label>
      </g>
      <Agent x={S5.agent.x} y={S5.agent.y} scale={0.8} enterAt={b(0) + 16} pose={agent} />
      <g opacity={blocked}>
        <Arrow x1={S5.agent.x + 36} y1={S5.agent.y - 70} x2={S5.box.x + S5.box.w - 6} y2={S5.agent.y - 98} color={theme.risk} dashed />
        <Mark x={S5.box.x + S5.box.w + 14} y={S5.agent.y - 104} ok={false} r={15} />
      </g>

      {/* что остаётся у Марины */}
      <g opacity={keep[0]}>
        <DbIcon x={S5.keep.x - 50} y={S5.keep.y} />
        <Label x={S5.keep.x - 50} y={S5.keep.y + 58} size={18} weight={600} color={theme.soft}>
          база
        </Label>
      </g>
      <g opacity={keep[1]}>
        <KeyGlyph x={S5.keep.x + 36} y={S5.keep.y} color={theme.alt} scale={1.6} />
        <Label x={S5.keep.x + 58} y={S5.keep.y + 58} size={18} weight={600} color={theme.soft}>
          ключи
        </Label>
      </g>
      <g opacity={keepTag}>
        <Pill x={S5.keep.x} y={S5.keep.y + 108} w={190} text="у Марины" color={theme.alt} fill={theme.altTint} size={20} compact />
      </g>
      <Coach x={S5.marina.x} y={S5.marina.y} scale={0.85} label="Марина" enterAt={4} pose={marina[0]} mood={marina[1]} />

      {/* доска 2: записка из четырёх частей */}
      {PARTS.map((p, i) => {
        const r = partBox(i)
        const g = appear(frame, partAt[i], 10)
        return (
          <g key={p.title}>
            <rect x={r.x} y={r.y} width={C.w} height={r.h} rx={12} fill="none" stroke={theme.grid} strokeWidth={3} strokeDasharray="10 8" opacity={appear(frame, b(2) - 24)} />
            <g opacity={g} transform={`translate(0 ${(1 - g) * 12})`}>
              <Card x={r.x} y={r.y} w={C.w} h={r.h} stroke={p.color} fill={theme.white}>
                <circle cx={r.x + 30} cy={r.y + 33} r={15} fill={theme.paper} stroke={p.color} strokeWidth={3} />
                <Label x={r.x + 30} y={r.y + 40} size={19} weight={700} color={p.color}>
                  {i + 1}
                </Label>
                <Label x={r.x + 56} y={r.y + 41} anchor="start" size={23} weight={700} color={p.color}>
                  {p.title}
                </Label>
                <Label x={r.x + C.w - 20} y={r.y + 40} anchor="end" size={18} weight={500} color={theme.soft}>
                  {p.hint}
                </Label>
              </Card>
            </g>
          </g>
        )
      })}
      <g opacity={appear(frame, partAt[0] + 6)}>
        <Label x={partBox(0).x + 26} y={partBox(0).y + 94} anchor="start" size={23} weight={700}>
          {typed('Экспорт тренировок в CSV.', frame, partAt[0] + 10, 30)}
        </Label>
      </g>
      <g opacity={appear(frame, b(2) + 84)}>
        <Label x={partBox(0).x + 26} y={partBox(0).y + 130} anchor="start" size={19} weight={500} color={theme.soft}>
          файл-таблица, который откроет Excel
        </Label>
      </g>
      {/* контекст: где лежат тренировки и что взять за образец */}
      <g opacity={appear(frame, partAt[1] + 6)}>
        <Label x={partBox(1).x + 26} y={partBox(1).y + 95} anchor="start" size={21} weight={600}>
          Тренировки:
        </Label>
        <Label x={partBox(1).x + 26} y={partBox(1).y + 133} anchor="start" size={21} weight={600}>
          Образец:
        </Label>
      </g>
      {[
        { text: 'workouts', x: 240, y: 88, at: partAt[1] + 24, w: 128, mono: true },
        { text: 'sets', x: 350, y: 88, at: partAt[1] + 44, w: 72, mono: true },
        { text: 'выгрузка отчётов', x: 250, y: 126, at: b(3) + 104, w: 216, mono: false },
      ].map((t) => {
        const g = appear(frame, t.at, 8)
        return (
          <g key={t.text} opacity={g} transform={`translate(0 ${(1 - g) * 8})`}>
            <Pill x={partBox(1).x + t.x} y={partBox(1).y + t.y} w={t.w} text={t.text} color={theme.accent} fill={theme.accentTint} size={19} mono={t.mono} compact />
          </g>
        )
      })}
      {DONE.map((t, i) => {
        const r = partBox(2)
        const g = appear(frame, doneAt[i], 8)
        return (
          <g key={t} opacity={g}>
            <Mark x={r.x + 38} y={r.y + 78 + i * 38} ok r={12} />
            <Label x={r.x + 62} y={r.y + 85 + i * 38} anchor="start" size={21} weight={600}>
              {t}
            </Label>
          </g>
        )
      })}
      {NOT.map((t, i) => {
        const r = partBox(3)
        const g = appear(frame, notAt[i], 8)
        return (
          <g key={t} opacity={g}>
            <Mark x={r.x + 38} y={r.y + 78 + i * 38} ok={false} r={12} />
            <Label x={r.x + 62} y={r.y + 85 + i * 38} anchor="start" size={21} weight={600}>
              {t}
            </Label>
          </g>
        )
      })}

      {/* под запиской (вне рамки точки): чем закончить запрос, как в книге */}
      <g opacity={appear(frame, b(5) + 120)}>
        <Pill x={C.x + C.w + C.gap / 2} y={C.y + C.h1 + C.gap + C.h2 + 32} w={548} text="в конце — отчёт: что сделано и как проверить руками" color={theme.accent} fill={theme.accentTint} size={18} compact />
      </g>

      {/* доска 3: с чего начать */}
      <g opacity={low}>
        <Card x={L.x} y={L.y} w={L.w} h={110 + LOW.length * L.row} stroke={theme.ok} fill={theme.white}>
          <Label x={L.x + 26} y={L.y + 44} anchor="start" size={24} weight={700} color={theme.ok}>
            С чего начать
          </Label>
          <Label x={L.x + 26} y={L.y + 76} anchor="start" size={18} weight={500} color={theme.soft}>
            ошибка дешёвая, проверить легко
          </Label>
          {LOW.map((t, i) => (
            <g key={t} opacity={appear(frame, lowAt[i], 8)}>
              <Mark x={L.x + 40} y={L.y + 120 + i * L.row} ok r={13} />
              <Label x={L.x + 66} y={L.y + 127 + i * L.row} anchor="start" size={22} weight={600}>
                {t}
              </Label>
            </g>
          ))}
        </Card>
      </g>
      <g opacity={appear(frame, flowAt[0])}>
        <Pill x={S5.flow.x + 80} y={S5.flow.y} w={170} text="1 задача" color={theme.accent} fill={theme.accentTint} size={22} />
      </g>
      <g opacity={appear(frame, flowAt[1])}>
        <Arrow x1={S5.flow.x + 172} y1={S5.flow.y} x2={S5.flow.x + 222} y2={S5.flow.y} color={theme.ink} />
        <Pill x={S5.flow.x + 340} y={S5.flow.y} w={220} text="1 пул-реквест" color={theme.ok} fill={theme.okTint} size={22} />
      </g>
      <g opacity={appear(frame, flowAt[2])}>
        <Arrow x1={S5.flow.x + 340} y1={S5.flow.y + 26} x2={S5.flow.x + 340} y2={S5.flow.y + 66} color={theme.ink} />
        <Clock x={S5.flow.x + 340} y={S5.flow.y + 116} r={42} t={tick} />
        <Label x={S5.flow.x + 340} y={S5.flow.y + 196} size={22} weight={700}>
          проверка — 20–30 минут
        </Label>
      </g>
      <Coach x={S5.marina3.x} y={S5.marina3.y} scale={0.85} label="Марина" enterAt={b(6) + 16} pose={marina3[0]} mood={marina3[1]} />
    </KitScene>
  )
}
