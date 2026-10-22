import { useCurrentFrame } from 'remotion'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Mark, Pill } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { Diff, type DiffLine } from '../../kit/screens/Diff'
import { BAR, DIFF_PAD, LH } from '../../kit/screens/layout'
import { theme } from '../../theme'
import { BOARD2, S5 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'

const ID = 's5-step'
const RU = S5.rules
const CH = S5.chain
const DF = S5.diff
const LG = S5.legend
const FK = S5.fork

// десять золотых правил (s22) — коротко, в две строки
const RULES = [
  ['Понимай всё,', 'что принимаешь'],
  ['Маленькие', 'шаги'],
  ['Сохраняйся перед', 'экспериментом'],
  ['Сначала способ', 'проверки'],
  ['Причина,', 'а не заплатка'],
  ['Две неудачи —', 'меняй подход'],
  ['Устройство', 'решает человек'],
  ['Секреты — не в', 'запрос и код'],
  ['Смотри', 'на изменения'],
  ['Прототип —', 'не продукт'],
]
// один безопасный шаг (рис. 3.5): номер правила — индекс в RULES + 1
const CHAIN = [
  { title: 'Сохраниться', sub: 'коммит перед шагом', rule: 3 },
  { title: 'Маленький шаг', sub: 'одна задача', rule: 2 },
  { title: 'Проверить', sub: 'способ — заранее', rule: 4 },
  { title: 'Смотреть дифф', sub: 'что изменилось', rule: 9 },
]
const CORE = CHAIN.map((c) => c.rule - 1)
// агент добавил проверку пустого подхода, а заодно удалил проверку владельца
const DIFF: DiffLine[] = [
  { text: 'function saveSet(user, set) {', kind: 'same' },
  { text: '  if (!isOwner(user, set)) return', kind: 'del' },
  { text: '  if (!set.weight) return error()', kind: 'add' },
  { text: '  await db.sets.insert(set)', kind: 'add' },
  { text: '}', kind: 'same' },
]
const LEGEND = [
  { mark: '−', text: 'удалено', fill: theme.riskTint, color: theme.risk },
  { mark: '+', text: 'добавлено', fill: theme.okTint, color: theme.ok },
  { mark: '', text: 'не менялось', fill: theme.paper, color: theme.soft },
]

// Сцена 5: десять золотых правил; их ядро — один безопасный шаг: сохраниться (коммит), маленький шаг,
// проверить способом, записанным заранее (лучше тестом), прочитать дифф. В диффе агент заодно удалил
// проверку владельца. Сошлось — коммит и дальше; нет — откат к сохранению и уточнить просьбу.
export function S5Step() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: правила и цепочка
  const ruleAt = RULES.map((_, i) => b(0) + 16 + i * 9)
  const headline = appear(frame, b(0) + 104, 12) * (1 - appear(frame, b(1) + 30, 10))
  const core = useAppear(b(1) + 10)
  const chainAt = [b(1) + 60, b(2) + 16, b(3) + 10, b(3) + 150]
  const active = stepAt(frame, [
    [0, -1],
    [chainAt[0], 0],
    [chainAt[1], 1],
    [chainAt[2], 2],
    [chainAt[3], 3],
  ])
  const ex = [
    [b(1) + 100, b(1) + 130],
    [b(2) + 50, b(2) + 110],
    [b(3) + 40, b(3) + 120],
    [b(3) + 160, b(3) + 166],
  ]
  const strikeWhole = appear(frame, b(2) + 80, 10)

  // доска 2: дифф, подписи, промах агента, развилка
  const diffAt = b(4) + 26
  const legendAt = [b(4) + 64, b(4) + 118, b(4) + 150]
  const delY = DF.y + BAR + DIFF_PAD + LH
  const flag = useAppear(b(5) + 10)
  const owner = useAppear(b(5) + 20)
  const oleg = useAppear(b(5) + 90)
  const okFork = useAppear(b(6) + 10)
  const badFork = useAppear(b(6) + 76)

  return (
    <KitScene chip="5 / 6 · Золотые правила: один безопасный шаг" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* десять правил; ядро — четыре из них */}
      {RULES.map((r, i) => {
        const x = RU.x + (i % 5) * (RU.w + RU.gap)
        const y = RU.y + Math.floor(i / 5) * (RU.h + RU.rowGap)
        const isCore = CORE.includes(i)
        const on = isCore && core > 0
        return (
          <g key={r[0]} opacity={appear(frame, ruleAt[i], 8) * (isCore ? 1 : 1 - core * 0.45)}>
            <rect x={x} y={y} width={RU.w} height={RU.h} rx={10} fill={on ? theme.accentTint : theme.paper} stroke={on ? theme.accent : theme.line} strokeWidth={on ? 3 : 2} />
            <circle cx={x + 22} cy={y + RU.h / 2} r={15} fill={on ? theme.accent : theme.soft} />
            <Label x={x + 22} y={y + RU.h / 2 + 6} size={18} color={theme.white} weight={700}>
              {String(i + 1)}
            </Label>
            <Label x={x + 46} y={y + 30} anchor="start" size={18} weight={600}>
              {r[0]}
            </Label>
            <Label x={x + 46} y={y + 54} anchor="start" size={18} weight={600}>
              {r[1]}
            </Label>
          </g>
        )
      })}

      {/* заголовок, пока шагов ещё нет */}
      <g opacity={headline}>
        <Label x={640} y={350} size={30} color={theme.accent} weight={800}>
          Десять золотых правил вайб-кодинга
        </Label>
      </g>

      {/* один безопасный шаг */}
      {CHAIN.map((c, i) => {
        const x = CH.x + i * (CH.w + CH.gap)
        const a = appear(frame, chainAt[i])
        const on = active === i
        return (
          <g key={c.title} opacity={a} transform={`translate(0 ${(1 - a) * 16})`}>
            <Card x={x} y={CH.y} w={CH.w} h={CH.h} stroke={on ? theme.accent : theme.line} fill={on ? theme.accentTint : theme.paper} />
            <Label x={x + 20} y={CH.y + 38} anchor="start" size={22} weight={700}>
              {c.title}
            </Label>
            <Label x={x + 20} y={CH.y + 66} anchor="start" size={18} color={theme.soft} weight={500}>
              {c.sub}
            </Label>
            <Label x={x + 20} y={CH.y + 92} anchor="start" size={18} color={theme.accent} weight={700}>
              {`правило ${c.rule}`}
            </Label>
            {i < CHAIN.length - 1 && <path d={`M${x + CH.w + 8} ${CH.y + CH.h / 2} H${x + CH.w + CH.gap - 8} m-10 -8 l10 8 l-10 8`} fill="none" stroke={theme.accent} strokeWidth={3} />}
          </g>
        )
      })}

      {/* примеры под шагами */}
      {(() => {
        const cx = (i: number) => CH.x + i * (CH.w + CH.gap) + CH.w / 2
        const y1 = S5.exampleY
        const y2 = S5.exampleY + 46
        return (
          <g>
            <g opacity={appear(frame, ex[0][0])}>
              <Pill x={cx(0)} y={y1} text="git commit" color={theme.ink} fill={theme.codeBg} size={20} mono compact />
            </g>
            <g opacity={appear(frame, ex[0][1])}>
              <Pill x={cx(0)} y={y2} text="рабочая версия ✓" color={theme.ok} fill={theme.okTint} size={18} compact />
            </g>
            <g opacity={appear(frame, ex[1][0])}>
              <Pill x={cx(1)} y={y1} text="«сделай весь журнал»" color={theme.risk} fill={theme.riskTint} size={18} compact />
              <line x1={cx(1) - 104} y1={y1} x2={cx(1) - 104 + 208 * strikeWhole} y2={y1} stroke={theme.risk} strokeWidth={3} opacity={strikeWhole > 0 ? 1 : 0} />
            </g>
            <g opacity={appear(frame, ex[1][1])}>
              <Pill x={cx(1)} y={y2} text="кнопка «Сохранить подход»" color={theme.ok} fill={theme.okTint} size={18} compact />
            </g>
            <g opacity={appear(frame, ex[2][0])}>
              <Pill x={cx(2)} y={y1} text="«подход Анны в журнале»" color={theme.accent} size={18} compact />
            </g>
            <g opacity={appear(frame, ex[2][1])}>
              <Pill x={cx(2)} y={y2} text="тест: зелёный ✓" color={theme.ok} fill={theme.okTint} size={18} compact />
            </g>
            <g opacity={appear(frame, ex[3][0])}>
              <rect x={cx(3) - 90} y={y1 - 16} width={180} height={28} rx={6} fill={theme.riskTint} />
              <text x={cx(3) - 78} y={y1 + 5} fill={theme.risk} style={{ font: `600 18px ${theme.mono}` }}>
                − строка ушла
              </text>
            </g>
            <g opacity={appear(frame, ex[3][1])}>
              <rect x={cx(3) - 90} y={y2 - 16} width={180} height={28} rx={6} fill={theme.okTint} />
              <text x={cx(3) - 78} y={y2 + 5} fill={theme.ok} style={{ font: `600 18px ${theme.mono}` }}>
                + строка новая
              </text>
            </g>
          </g>
        )
      })()}

      {/* доска 2: дифф */}
      {frame >= diffAt && <Diff x={DF.x} y={DF.y} w={DF.w} at={diffAt} lines={DIFF} />}
      {LEGEND.map((l, i) => {
        const y = LG.y + 20 + i * 46
        return (
          <g key={l.text} opacity={appear(frame, legendAt[i])}>
            <rect x={LG.x} y={y - 16} width={44} height={32} rx={6} fill={l.fill} stroke={l.color} strokeWidth={2} />
            <text x={LG.x + 22} y={y + 8} textAnchor="middle" fill={l.color} style={{ font: `700 22px ${theme.mono}` }}>
              {l.mark}
            </text>
            <Label x={LG.x + 60} y={y + 8} anchor="start" size={22} weight={600}>
              {l.text}
            </Label>
          </g>
        )
      })}
      {/* агент заодно удалил проверку владельца */}
      <g opacity={flag}>
        <rect x={DF.x + 2} y={delY - 2} width={DF.w - 4} height={LH + 4} rx={4} fill="none" stroke={theme.risk} strokeWidth={4} />
      </g>
      <g opacity={owner}>
        <path d={`M${LG.x + 64} 292 L${DF.x + DF.w + 6} ${delY + LH / 2}`} fill="none" stroke={theme.risk} strokeWidth={3} />
        <circle cx={DF.x + DF.w + 6} cy={delY + LH / 2} r={5} fill={theme.risk} />
        <Pill x={LG.x + 64 + 160} y={292} text="удалена проверка владельца" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>
      <g opacity={oleg}>
        <Pill x={LG.x + 64 + 160} y={338} text="Олег увидит журнал Анны" color={theme.risk} size={20} compact />
      </g>

      {/* развилка: сошлось — коммит; нет — откат */}
      <g opacity={okFork}>
        <Card x={DF.x} y={FK.y} w={FK.w} h={FK.h} stroke={theme.ok} fill={theme.okTint}>
          <Mark x={DF.x + 36} y={FK.y + FK.h / 2} ok r={18} />
          <Label x={DF.x + 70} y={FK.y + 46} anchor="start" size={24} color={theme.ok} weight={700}>
            Сошлось
          </Label>
          <Label x={DF.x + 70} y={FK.y + 80} anchor="start" size={20} weight={600}>
            коммит и следующий шаг
          </Label>
        </Card>
      </g>
      <g opacity={badFork}>
        <Card x={BOARD2 + 680} y={FK.y} w={FK.w} h={FK.h} stroke={theme.risk} fill={theme.riskTint}>
          <Mark x={BOARD2 + 716} y={FK.y + FK.h / 2} ok={false} r={18} />
          <Label x={BOARD2 + 750} y={FK.y + 46} anchor="start" size={24} color={theme.risk} weight={700}>
            Не сошлось
          </Label>
          <Label x={BOARD2 + 750} y={FK.y + 80} anchor="start" size={20} weight={600}>
            откат к сохранению, уточнить просьбу
          </Label>
        </Card>
      </g>
    </KitScene>
  )
}
