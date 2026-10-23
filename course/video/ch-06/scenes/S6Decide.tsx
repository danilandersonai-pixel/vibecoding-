import { interpolate, useCurrentFrame } from 'remotion'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Pill } from '../../kit/props'
import { theme } from '../../theme'
import { S6 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Diamond } from './parts'

const ID = 's6-decide'
const DW = S6.diamond.w
const DH = S6.diamond.h
const OY = S6.outY
const OW = S6.outW
const TB = S6.table

type Outcome = { title: string; color: string; tint: string; cond: string[]; result: string }

// три исхода (рис. 6.6 и критерии s39) — слева направо, как в дереве решений
const OUTCOMES: Outcome[] = [
  { title: 'Выбросить', color: theme.risk, tint: theme.riskTint, cond: ['идея не подтвердилась', 'или проверяли только экран'], result: '→ выводы храним, код — нет' },
  { title: 'Переписать', color: theme.alt, tint: theme.altTint, cond: ['идея верна, а код — каша', 'или живёт в конструкторе'], result: '→ заново по спецификации' },
  { title: 'Развивать', color: theme.ok, tint: theme.okTint, cond: ['нужный стек, код понятен,', 'выдержит рост'], result: '→ тесты, безопасность' },
]

// прототип и продакшен (таблица s39)
const ROWS = [
  ['Данные', 'в памяти или тестовые', 'настоящая база, миграции, резервные копии'],
  ['Доступ', 'без входа или общий вход', 'роли, права, защита от подбора паролей'],
  ['Ошибки', 'упало — перезапустили', 'обработка, повторы, понятные сообщения'],
  ['Тесты', 'нет или минимум', 'модульные, интеграционные, сквозные'],
  ['Наблюдение', 'сообщения в консоли', 'журналы, показатели, оповещения'],
  ['Выкладка', 'вручную или одной кнопкой', 'CI/CD, несколько окружений, откат'],
]
const ENVS = ['разработка', 'тестовое', 'продакшен']

// Сцена 6: ответ получен — решаем вслух: выбросить, развивать или переписать (два вопроса и критерии);
// чем продакшен отличается от прототипа: данные, доступ, ошибки, тесты, наблюдение, выкладка и окружения.
export function S6Decide() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // два вопроса, затем три исхода по словам реплики
  const start = appear(frame, b(0) + 6)
  const idea = appear(frame, b(0) + 18)
  const code = appear(frame, b(0) + 32)
  const outAt = [b(0) + 70, b(0) + 126, b(0) + 96]
  // кадр, с которого исход подсвечен (по реплике о нём)
  const litAt = [b(1) + 6, b(3) + 6, b(2) + 6]
  const lit = (i: number) => appear(frame, litAt[i], 10)
  const ours = appear(frame, b(1) + 40)
  // что уносим, когда выбрасываем: выводы и журнал — да, код — нет
  const keep = [b(1) + 96, b(1) + 116, b(1) + 136].map((at) => appear(frame, at))
  const strike = interpolate(frame, [b(1) + 146, b(1) + 160], [0, 1], CLAMP)

  // доска 2: таблица и окружения
  const rowAt = [b(4) + 30, b(4) + 50, b(4) + 70, b(4) + 90, b(5) + 10, b(5) + 40]
  const envAt = ENVS.map((_, i) => b(5) + 90 + i * 14)
  const envs = appear(frame, b(5) + 84)
  const back = appear(frame, b(5) + 140)

  const ox = (i: number) => S6.outcomes[i]
  const top = (i: number) => ({ x: ox(i) + OW / 2, y: OY - 4 })
  const arrowTo = (i: number) => interpolate(frame, [outAt[i] - 10, outAt[i]], [0, 1], CLAMP)
  const colX = [TB.x + 20, TB.x + S6.cols[0] + 10, TB.x + S6.cols[0] + S6.cols[1] + 10]

  return (
    <KitScene chip="6 / 7 · Что дальше" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* ответ получен → два вопроса */}
      <g opacity={start}>
        <Card x={S6.start.x} y={S6.start.y} w={S6.start.w} h={S6.start.h} stroke={theme.accent} fill={theme.accentTint}>
          <Label x={S6.start.x + S6.start.w / 2} y={S6.start.y + 40} size={22} weight={700} color={theme.accent}>
            Ответ получен
          </Label>
        </Card>
        <Arrow x1={S6.start.x + S6.start.w + 4} y1={S6.idea.y} x2={S6.idea.x - DW / 2 - 4} y2={S6.idea.y} />
      </g>
      <g opacity={idea}>
        <Diamond x={S6.idea.x} y={S6.idea.y} w={DW} h={DH}>
          <Label x={S6.idea.x} y={S6.idea.y - 4} size={20} weight={700}>
            Идея
          </Label>
          <Label x={S6.idea.x} y={S6.idea.y + 20} size={20} weight={700}>
            подтвердилась?
          </Label>
        </Diamond>
        <line x1={S6.idea.x + DW / 2} y1={S6.idea.y} x2={S6.code.x} y2={S6.idea.y} stroke={theme.line} strokeWidth={3} />
        <Label x={(S6.idea.x + DW / 2 + S6.code.x) / 2} y={S6.idea.y - 12} size={20} weight={700} color={theme.ok}>
          да
        </Label>
      </g>
      <g opacity={code}>
        <Arrow x1={S6.code.x} y1={S6.idea.y} x2={S6.code.x} y2={S6.code.y - DH / 2 - 4} />
        <Diamond x={S6.code.x} y={S6.code.y} w={DW} h={DH}>
          <Label x={S6.code.x} y={S6.code.y - 4} size={20} weight={700}>
            Код годится
          </Label>
          <Label x={S6.code.x} y={S6.code.y + 20} size={20} weight={700}>
            для продукта?
          </Label>
        </Diamond>
      </g>

      {/* ветки к исходам */}
      <Arrow x1={S6.idea.x - 30} y1={S6.idea.y + DH / 2 - 14} x2={top(0).x + 30} y2={top(0).y} color={lit(0) > 0.5 ? OUTCOMES[0].color : theme.line} draw={arrowTo(0)} />
      <g opacity={arrowTo(0)}>
        <Label x={(S6.idea.x + top(0).x) / 2 - 30} y={(S6.idea.y + DH / 2 + top(0).y) / 2} size={20} weight={700} color={theme.risk}>
          нет
        </Label>
      </g>
      <Arrow x1={S6.code.x - 70} y1={S6.code.y + 32} x2={top(1).x + 40} y2={top(1).y} color={lit(1) > 0.5 ? OUTCOMES[1].color : theme.line} draw={arrowTo(1)} />
      <g opacity={arrowTo(1)}>
        <Label x={(S6.code.x - 70 + top(1).x + 40) / 2 - 30} y={(S6.code.y + 32 + top(1).y) / 2} size={20} weight={700} color={theme.risk}>
          нет
        </Label>
      </g>
      <Arrow x1={S6.code.x + 70} y1={S6.code.y + 32} x2={top(2).x - 20} y2={top(2).y} color={lit(2) > 0.5 ? OUTCOMES[2].color : theme.line} draw={arrowTo(2)} />
      <g opacity={arrowTo(2)}>
        <Label x={(S6.code.x + 70 + top(2).x - 20) / 2 + 30} y={(S6.code.y + 32 + top(2).y) / 2} size={20} weight={700} color={theme.ok}>
          да
        </Label>
      </g>

      {/* три исхода */}
      {OUTCOMES.map((o, i) => {
        const on = lit(i)
        const x = ox(i)
        return (
          <g key={o.title} opacity={appear(frame, outAt[i], 10)}>
            <Card x={x} y={OY} w={OW} h={S6.outH} stroke={on > 0.5 ? o.color : theme.line} fill={on > 0.5 ? o.tint : theme.paper} />
            <Label x={x + 20} y={OY + 40} anchor="start" size={28} weight={700} color={o.color}>
              {o.title}
            </Label>
            {o.cond.map((c, j) => (
              <g key={c} opacity={appear(frame, litAt[i] + j * 26, 10)}>
                <Label x={x + 20} y={OY + 78 + j * 28} anchor="start" size={20} weight={500}>
                  {c}
                </Label>
              </g>
            ))}
            <g opacity={appear(frame, litAt[i] + 60, 10)}>
              <Label x={x + 20} y={OY + 142} anchor="start" size={20} weight={700} color={o.color}>
                {o.result}
              </Label>
            </g>
          </g>
        )
      })}
      {[
        { text: 'выводы — берём', color: theme.ok },
        { text: 'журнал — берём', color: theme.ok },
        { text: 'код прототипа', color: theme.risk },
      ].map((k, i) => (
        <g key={k.text} opacity={keep[i]}>
          <Pill x={S6.keep.x} y={S6.keep.y + i * 46} text={k.text} color={k.color} fill={theme.paper} size={20} compact />
        </g>
      ))}
      {strike > 0 && <line x1={S6.keep.x - 80} y1={S6.keep.y + 92} x2={S6.keep.x - 80 + 160 * strike} y2={S6.keep.y + 92} stroke={theme.risk} strokeWidth={4} strokeLinecap="round" />}
      <g opacity={ours}>
        <Pill x={ox(0) + 70} y={OY - 30} text="наш случай" color={theme.accent} fill={theme.paper} size={20} compact />
      </g>

      {/* доска 2: прототип и продакшен */}
      <g opacity={appear(frame, b(4) + 14)}>
        <Card x={TB.x} y={TB.y} w={TB.w} h={TB.head + ROWS.length * TB.row} />
        <rect x={TB.x + 2} y={TB.y + 2} width={TB.w - 4} height={TB.head - 2} rx={10} fill={theme.codeBg} />
        {['Что', 'Прототип', 'Продакшен'].map((t, i) => (
          <Label key={t} x={colX[i]} y={TB.y + 32} anchor="start" size={20} weight={700} color={i === 2 ? theme.ok : theme.soft}>
            {t}
          </Label>
        ))}
      </g>
      {ROWS.map((r, i) => {
        const cy = TB.y + TB.head + i * TB.row + TB.row / 2
        const env = i === 5 ? envs : 0
        return (
          <g key={r[0]} opacity={appear(frame, rowAt[i], 10)}>
            {i > 0 && <line x1={TB.x + 12} y1={cy - TB.row / 2} x2={TB.x + TB.w - 12} y2={cy - TB.row / 2} stroke={theme.grid} strokeWidth={2} />}
            <Label x={colX[0]} y={cy + 7} anchor="start" size={20} weight={700}>
              {r[0]}
            </Label>
            <Label x={colX[1]} y={cy + 7} anchor="start" size={20} weight={500} color={theme.soft}>
              {r[1]}
            </Label>
            <Label x={colX[2]} y={cy + 7} anchor="start" size={20} weight={600} color={env > 0.5 ? theme.accent : theme.ink}>
              {r[2]}
            </Label>
          </g>
        )
      })}
      <g opacity={envs}>
        <Label x={TB.x + 10} y={S6.envY + 7} anchor="start" size={20} weight={600} color={theme.soft}>
          окружения:
        </Label>
      </g>
      {ENVS.map((e, i) => {
        const x = TB.x + 280 + i * 220
        return (
          <g key={e} opacity={appear(frame, envAt[i], 8)}>
            <Pill x={x} y={S6.envY} text={e} color={i === 2 ? theme.ok : theme.accent} fill={theme.paper} size={20} compact />
            {i > 0 && <Arrow x1={x - 220 + 76} y1={S6.envY} x2={x - 76} y2={S6.envY} color={theme.accent} />}
          </g>
        )
      })}
      <g opacity={back}>
        <Arrow x1={TB.x + 280 + 2 * 220 + 80} y1={S6.envY} x2={TB.x + 280 + 2 * 220 + 150} y2={S6.envY} color={theme.alt} dashed />
        <Pill x={TB.x + 280 + 2 * 220 + 250} y={S6.envY} text="можно откатить" color={theme.alt} fill={theme.altTint} size={20} compact />
      </g>
    </KitScene>
  )
}
