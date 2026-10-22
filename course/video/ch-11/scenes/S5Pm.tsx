import { interpolate, useCurrentFrame } from 'remotion'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP, trackAt } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Mark, Pill } from '../../kit/props'
import { typed } from '../../kit/reveal'
import { BAR } from '../../kit/screens/layout'
import { Window } from '../../kit/screens/Window'
import { theme } from '../../theme'
import { S5 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { MiniBot } from './parts'

const ID = 's5-pm'
const CH = S5.chat
const D = S5.drafts
const SP = S5.spec
const CK = S5.check
const CT = S5.chart
const TK = S5.task

const SPEC_ROWS = ['Требования', 'Критерии готовности', 'Ограничения']
const CHAT = [
  { who: 'Марина', text: ['Нужен экран', 'рекордов'], color: theme.accent, fill: theme.accentTint },
  { who: 'Дима', text: ['И уведомление', 'о рекорде!'], color: theme.alt, fill: theme.altTint },
]
// черновики задач от ИИ; Марина и Дима ставят уведомление первым
const DRAFTS = ['Экран рекордов', 'Уведомление', 'Фильтр по дате']
const ORDER_AFTER = [1, 0, 2]
// новая математика оценок (рис. 11.4): раньше и с агентами; короче — только написание кода
const COSTS = [
  { label: 'Написание кода', before: 380, after: 110 },
  { label: 'Проверка', before: 170, after: 170 },
  { label: 'Соединение частей', before: 140, after: 140 },
  { label: 'Согласование', before: 120, after: 120 },
]
const DONE_WHEN = ['Анна видит свои рекорды', 'Олег не видит чужие', 'Открывается за секунду']

// Сцена 5: код дешевеет — дорожает ясность; спецификация в центре проекта. ИИ делает из переписки черновики
// задач, люди правят и ставят порядок; агенты пишут код; неясность — назад к спецификации. Новая математика
// оценок; свой проект — вы уже менеджер: короткая задача с признаком «готово».
export function S5Pm() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // ценники и спецификация
  const tags = appear(frame, b(0) + 16) * (1 - appear(frame, b(1) + 30))
  const tags2 = appear(frame, b(0) + 46) * (1 - appear(frame, b(1) + 30))
  const spec = appear(frame, b(0) + 90)
  const rowAt = SPEC_ROWS.map((_, i) => b(0) + 104 + i * 12)
  const main = appear(frame, b(0) + 150)

  // переписка → черновики → порядок → спецификация
  const msgAt = [b(1) + 24, b(1) + 46]
  const draftAt = DRAFTS.map((_, i) => b(1) + 72 + i * 12)
  const edit = interpolate(frame, [b(1) + 130, b(1) + 146], [0, 1], CLAMP)
  const toDrafts = appear(frame, b(1) + 64, 10)
  const toSpec = appear(frame, b(1) + 176, 12)

  // агенты пишут код; проверка; неясность — назад к спецификации
  const fan = appear(frame, b(2) + 10, 12)
  const botAt = S5.agents.ys.map((_, i) => b(2) + 14 + i * 8)
  const check = appear(frame, b(2) + 46)
  const toCheck = appear(frame, b(2) + 50, 10)
  const unclear = appear(frame, b(2) + 70)
  const back = interpolate(frame, [b(2) + 76, b(2) + 96], [0, 1], CLAMP)
  const fixRow = appear(frame, b(2) + 94)
  const patch = appear(frame, b(2) + 88)
  const strike = interpolate(frame, [b(2) + 98, b(2) + 108], [0, 1], CLAMP)

  // доска 2: столбики «раньше / с агентами», задача с признаком «готово»
  const legend = appear(frame, b(3) + 20)
  const shorter = appear(frame, b(3) + 110)
  const same = appear(frame, b(3) + 140)
  const task = appear(frame, b(4) + 8)
  const tickAt = DONE_WHEN.map((_, i) => b(4) + 70 + i * 22)
  const manager = appear(frame, b(4) + 30)

  // где стоит черновик: после правки порядок другой
  const draftY = (i: number) => {
    const to = ORDER_AFTER.indexOf(i)
    return trackAt(frame, [
      [b(1) + 150, 0, D.y + i * (D.h + D.gap)],
      [b(1) + 168, 0, D.y + to * (D.h + D.gap)],
    ]).y
  }

  return (
    <KitScene chip="5 / 7 · Спецификация в центре" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* код дешевеет — ясность дорожает */}
      <g opacity={tags}>
        <Pill x={S5.cheap.x} y={S5.cheap.y} w={240} text="код ↓ дешевеет" color={theme.soft} size={22} />
      </g>
      <g opacity={tags2}>
        <Pill x={S5.dear.x} y={S5.dear.y} w={270} text="ясность ↑ дорожает" color={theme.accent} fill={theme.accentTint} size={22} />
      </g>

      {/* спецификация — центр процесса; сначала пунктиром её место */}
      <rect x={SP.x} y={SP.y} width={SP.w} height={SP.h} rx={12} fill="none" stroke={theme.grid} strokeWidth={3} strokeDasharray="10 8" opacity={appear(frame, b(0) + 8) * (1 - spec)} />
      <g opacity={spec} transform={`translate(0 ${(1 - spec) * 16})`}>
        <Card x={SP.x} y={SP.y} w={SP.w} h={SP.h} stroke={theme.accent} fill={theme.paper}>
          <rect x={SP.x + 3} y={SP.y + 3} width={SP.w - 6} height={52} rx={10} fill={theme.accentTint} />
          <Label x={SP.x + SP.w / 2} y={SP.y + 38} size={24} weight={700} color={theme.accent}>
            Спецификация
          </Label>
          {SPEC_ROWS.map((r, i) => {
            const y = SP.y + 92 + i * 84
            return (
              <g key={r} opacity={appear(frame, rowAt[i], 8)}>
                {i === 1 && <rect x={SP.x + 10} y={y - 26} width={SP.w - 20} height={70} rx={8} fill={theme.altTint} opacity={fixRow} />}
                <Label x={SP.x + 20} y={y} anchor="start" size={20} weight={700}>
                  {r}
                </Label>
                <rect x={SP.x + 20} y={y + 14} width={SP.w - 60} height={10} rx={5} fill={theme.grid} />
                <rect x={SP.x + 20} y={y + 30} width={SP.w - 100 + (i === 1 ? 40 * fixRow : 0)} height={10} rx={5} fill={i === 1 && fixRow > 0 ? theme.alt : theme.grid} />
              </g>
            )
          })}
        </Card>
      </g>
      <g opacity={main * (1 - appear(frame, b(1) + 30))}>
        <Pill x={SP.x + SP.w / 2} y={SP.y - 26} w={250} text="главный документ" color={theme.accent} size={20} compact />
      </g>

      {/* переписка Марины и Димы */}
      <Window x={CH.x} y={CH.y} w={CH.w} h={CH.h} at={b(1) + 10} bar={<Label x={18} y={BAR / 2 + 7} anchor="start" size={20} weight={600}>Переписка</Label>}>
        {CHAT.map((m, i) => (
          <g key={m.who} opacity={appear(frame, msgAt[i], 8)}>
            <Label x={16} y={BAR + 30 + i * 104} anchor="start" size={18} weight={700} color={m.color}>
              {m.who}
            </Label>
            <rect x={14} y={BAR + 38 + i * 104} width={CH.w - 28} height={60} rx={12} fill={m.fill} />
            {m.text.map((t, j) => (
              <Label key={t} x={28} y={BAR + 62 + i * 104 + j * 26} anchor="start" size={20} weight={500}>
                {t}
              </Label>
            ))}
          </g>
        ))}
      </Window>
      <Arrow x1={CH.x + CH.w + 6} y1={D.y + 90} x2={D.x - 8} y2={D.y + 90} color={theme.accent} draw={toDrafts} />

      {/* черновики задач: ИИ предлагает, люди правят и ставят порядок */}
      <g opacity={appear(frame, draftAt[0])}>
        <Label x={D.x + D.w / 2} y={D.y - 16} size={20} weight={600} color={theme.soft}>
          черновики задач
        </Label>
      </g>
      {DRAFTS.map((t, i) => {
        const y = draftY(i)
        const a = appear(frame, draftAt[i], 8)
        const n = frame >= b(1) + 160 ? ORDER_AFTER.indexOf(i) + 1 : i + 1
        return (
          <g key={t} opacity={a}>
            <rect x={D.x} y={y} width={D.w} height={D.h} rx={10} fill={theme.paper} stroke={i === 1 && edit > 0 ? theme.alt : theme.line} strokeWidth={3} strokeDasharray={edit > 0.5 && i === 1 ? undefined : '8 6'} />
            <circle cx={D.x + 26} cy={y + D.h / 2} r={15} fill={theme.accent} />
            <Label x={D.x + 26} y={y + D.h / 2 + 7} size={18} weight={700} color={theme.white}>
              {String(n)}
            </Label>
            <Label x={D.x + 50} y={y + D.h / 2 + 7} anchor="start" size={20} weight={600}>
              {t}
            </Label>
          </g>
        )
      })}
      {/* карандаш: черновик правят люди */}
      <g opacity={edit * (1 - appear(frame, b(2)))}>
        <path d={`M${D.x + D.w - 22} ${draftY(1) + 46} l22 -22 l9 9 l-22 22 Z M${D.x + D.w - 22} ${draftY(1) + 46} l-4 13 l13 -4`} fill={theme.alt} />
      </g>
      <Arrow x1={D.x + D.w + 8} y1={D.y + 150} x2={SP.x - 8} y2={D.y + 150} color={theme.accent} draw={toSpec} />

      {/* агенты пишут код по спецификации */}
      {S5.agents.ys.map((y, i) => {
        const a = appear(frame, botAt[i])
        return (
          <g key={y}>
            <Arrow x1={SP.x + SP.w + 8} y1={SP.y + SP.h / 2} x2={S5.agents.x - 34} y2={y - 4} color={theme.accent} draw={fan} />
            <g opacity={a}>
              <MiniBot x={S5.agents.x} y={y} s={1.1} light={frame >= botAt[i] + 40 ? theme.ok : theme.alt} />
              {[0, 1].map((j) => (
                <rect key={j} x={S5.agents.x + 36} y={y - 14 + j * 16} width={Math.max(0, 70 - j * 24) * appear(frame, botAt[i] + 8 + j * 6, 20)} height={9} rx={4.5} fill={theme.grid} />
              ))}
            </g>
            <Arrow x1={S5.agents.x + 116} y1={y - 4} x2={CK.x - 8} y2={CK.y + CK.h / 2} color={theme.ok} draw={toCheck} />
          </g>
        )
      })}
      <g opacity={appear(frame, botAt[0])}>
        <Label x={S5.agents.x + 30} y={S5.agents.ys[0] - 62} size={20} weight={600} color={theme.soft}>
          агенты
        </Label>
      </g>
      <g opacity={check}>
        <Card x={CK.x} y={CK.y} w={CK.w} h={CK.h} stroke={theme.ok} fill={theme.okTint}>
          <Label x={CK.x + CK.w / 2} y={CK.y + 40} size={22} weight={700} color={theme.ok}>
            Проверка
          </Label>
          <Label x={CK.x + CK.w / 2} y={CK.y + 80} size={20} weight={600}>
            тесты
          </Label>
          <Label x={CK.x + CK.w / 2} y={CK.y + 108} size={20} weight={600}>
            и человек
          </Label>
        </Card>
      </g>
      <g opacity={unclear}>
        <circle cx={CK.x + CK.w - 6} cy={CK.y + 4} r={18} fill={theme.alt} />
        <Label x={CK.x + CK.w - 6} y={CK.y + 12} size={22} weight={800} color={theme.white}>
          ?
        </Label>
      </g>
      {/* неясность — шаг назад, к спецификации */}
      <g opacity={back > 0 ? 1 : 0}>
        <path
          d={`M${CK.x + CK.w / 2} ${CK.y + CK.h + 6} V${S5.back.y} H${SP.x + SP.w / 2} V${SP.y + SP.h + 8}`}
          fill="none"
          strokeDasharray="8 7"
          stroke={theme.alt}
          strokeWidth={3}
          opacity={back}
        />
        <path d={`M${SP.x + SP.w / 2} ${SP.y + SP.h + 6} l-8 14 h16 Z`} fill={theme.alt} opacity={back >= 1 ? 1 : 0} />
        <Label x={(CK.x + SP.x + SP.w) / 2 + 30} y={S5.back.y + 30} size={20} weight={600} color={theme.alt} opacity={back}>
          неясно — правим спецификацию
        </Label>
      </g>
      <g opacity={patch}>
        <Pill x={S5.patch.x} y={S5.patch.y} w={250} text="латать код вслепую" color={theme.risk} fill={theme.riskTint} size={20} compact />
        <line x1={S5.patch.x - 116} y1={S5.patch.y} x2={S5.patch.x - 116 + 232 * strike} y2={S5.patch.y} stroke={theme.risk} strokeWidth={4} strokeLinecap="round" opacity={strike > 0 ? 1 : 0} />
      </g>

      {/* доска 2: новая математика оценок */}
      <Card x={CT.x} y={CT.y} w={CT.w} h={CT.h} stroke={theme.line}>
        <Label x={CT.x + 24} y={CT.y + 42} anchor="start" size={24} weight={700}>
          Новая математика оценок
        </Label>
        <g opacity={legend}>
          <rect x={CT.x + 24} y={CT.y + 64} width={20} height={20} rx={4} fill={theme.line} />
          <Label x={CT.x + 52} y={CT.y + 81} anchor="start" size={20} weight={600} color={theme.soft}>
            раньше
          </Label>
          <rect x={CT.x + 160} y={CT.y + 64} width={20} height={20} rx={4} fill={theme.accent} />
          <Label x={CT.x + 188} y={CT.y + 81} anchor="start" size={20} weight={600} color={theme.accent}>
            с агентами
          </Label>
        </g>
        {COSTS.map((c, i) => {
          const y = CT.y + 130 + i * 80
          const g1 = appear(frame, b(3) + 30 + i * 8, 20)
          const g2 = appear(frame, b(3) + 66 + i * 8, 20)
          return (
            <g key={c.label}>
              <Label x={CT.x + 24} y={y + 24} anchor="start" size={20} weight={600}>
                {c.label}
              </Label>
              <rect x={CT.x + 230} y={y} width={c.before * g1} height={20} rx={4} fill={theme.line} />
              <rect x={CT.x + 230} y={y + 26} width={c.after * g2} height={20} rx={4} fill={theme.accent} />
              {i === 0 ? (
                <g opacity={shorter}>
                  <Pill x={CT.x + 230 + c.after + 70} y={y + 44} w={116} text="короче" color={theme.ok} fill={theme.okTint} size={18} compact />
                </g>
              ) : (
                <g opacity={same}>
                  <Label x={CT.x + 230 + c.after + 16} y={y + 42} anchor="start" size={18} weight={600} color={theme.soft}>
                    как раньше
                  </Label>
                </g>
              )}
            </g>
          )
        })}
      </Card>

      {/* задача с признаком «готово» */}
      <rect x={TK.x} y={TK.y} width={TK.w} height={TK.h} rx={12} fill="none" stroke={theme.grid} strokeWidth={3} strokeDasharray="10 8" opacity={1 - task} />
      <g opacity={task}>
        <Card x={TK.x} y={TK.y} w={TK.w} h={TK.h} stroke={theme.accent}>
          <Label x={TK.x + 24} y={TK.y + 44} anchor="start" size={24} weight={700} color={theme.accent}>
            {typed('Задача: экран рекордов', frame, b(4) + 10, 40)}
          </Label>
          <Label x={TK.x + 24} y={TK.y + 96} anchor="start" size={22} weight={700}>
            Готово, когда:
          </Label>
          {DONE_WHEN.map((t, i) => (
            <g key={t} opacity={appear(frame, tickAt[i] - 16, 8)}>
              {frame >= tickAt[i] ? <Mark x={TK.x + 44} y={TK.y + 146 + i * 56} ok r={16} /> : <circle cx={TK.x + 44} cy={TK.y + 146 + i * 56} r={16} fill="none" stroke={theme.line} strokeWidth={3} />}
              <Label x={TK.x + 74} y={TK.y + 153 + i * 56} anchor="start" size={22} weight={600}>
                {t}
              </Label>
            </g>
          ))}
        </Card>
      </g>
      <g opacity={manager}>
        <Pill x={S5.manager.x} y={S5.manager.y} w={300} text="вы уже менеджер" color={theme.ok} fill={theme.okTint} size={22} />
      </g>
    </KitScene>
  )
}
