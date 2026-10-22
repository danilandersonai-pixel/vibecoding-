import { useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Client } from '../../actors/Client'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { Phone } from '../../actors/Phone'
import { KitScene } from '../../kit/KitScene'
import { appear } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Mark, PhoneScreen, Pill } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { PHONE_FONT } from '../../kit/screens/layout'
import { theme } from '../../theme'
import { PHONE_SCALE, S4 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Keycap, MiniScreen, Sketch, type ScreenKind } from './parts'

const ID = 's4-design'
const SK = S4.sketch
const DS = S4.system
const SC = S4.screens
const V = S4.variants

const SCREENS: { kind: ScreenKind; title: string }[] = [
  { kind: 'log', title: 'Журнал' },
  { kind: 'records', title: 'Рекорды' },
  { kind: 'profile', title: 'Профиль' },
]
const SWATCHES = [theme.accent, theme.alt, theme.ok, theme.ink]
const VARIANTS: ScreenKind[] = ['list', 'grid', 'records', 'log']
const PICK = 2
// плотный экран Марины: шапка и шесть строк мелким шагом
const DENSE = ['Анна — присед', 'Олег — тяга', 'Ира — жим', 'Макс — бег', 'Лена — планка', 'Вера — выпады']

// Сцена 4: дизайн и разработка сближаются. Набросок Марины за минуты становится экраном; дизайн-система —
// контекст для ИИ, экраны в одном стиле. Экран подстраивается под опыт: Анне — подсказки, Марине — плотно
// и горячие клавиши; риски. ИИ даёт много вариантов, выбирает человек.
export function S4Design() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: набросок → агент → экраны; дизайн-система как контекст
  const sketch = appear(frame, b(0) + 6)
  const draw = Math.min(1, Math.max(0, (frame - b(0) - 12) / 50))
  const toAgent = appear(frame, b(0) + 70, 12)
  const fast = appear(frame, b(0) + 92)
  const toScreens = appear(frame, b(0) + 120, 12)
  const screenAt = [b(0) + 130, b(1) + 140, b(1) + 160]
  const system = appear(frame, b(1) + 16)
  const swatchAt = SWATCHES.map((_, i) => b(1) + 28 + i * 8)
  const font = appear(frame, b(1) + 58)
  const blocks = appear(frame, b(1) + 80)
  const context = appear(frame, b(1) + 100, 12)
  const same = appear(frame, b(1) + 172)
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(0) + 80, 'working'],
    [b(0) + 136, 'done'],
    [b(1) + 104, 'working'],
    [b(1) + 166, 'done'],
  ])
  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['point', 'neutral']],
    [b(0) + 70, ['stand', 'neutral']],
    [b(0) + 140, ['cheer', 'happy']],
    [b(1) + 10, ['stand', 'happy']],
  ])

  // доска 2: подсказки Анне, плотный экран и клавиши Марине, плашка рисков
  const hint = appear(frame, b(2) + 40)
  const dense = DENSE.map((_, i) => appear(frame, b(2) + 70 + i * 5, 8))
  const keys = appear(frame, b(2) + 120)
  const personaA = appear(frame, b(2) + 46)
  const personaM = appear(frame, b(2) + 90)
  const which = appear(frame, b(3) + 20)
  const risk = appear(frame, b(3) + 40)

  // доска 3: варианты, выбирает Марина
  const varAt = VARIANTS.map((_, i) => b(4) + 26 + i * 10)
  const picked = frame >= b(4) + 96
  const choose = appear(frame, b(4) + 100)
  const taste = appear(frame, b(4) + 140)
  const marina3 = stepAt<[Pose, Mood]>(frame, [
    [0, ['think', 'neutral']],
    [b(4) + 84, ['point', 'happy']],
    [b(4) + 150, ['cheer', 'happy']],
  ])

  return (
    <KitScene chip="4 / 7 · Дизайн под человека" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* набросок Марины */}
      <g opacity={sketch}>
        <Sketch x={SK.x} y={SK.y} w={SK.w} h={SK.h} draw={draw} />
      </g>
      <Coach x={S4.marina.x} y={S4.marina.y} scale={0.75} label="Марина" enterAt={2} pose={marina[0]} mood={marina[1]} />
      <Arrow x1={SK.x + SK.w + 8} y1={SK.y + 200} x2={S4.agent.x - 60} y2={S4.agent.y - 30} color={theme.accent} draw={toAgent} />
      <g opacity={fast}>
        <Pill x={S4.fastAt.x} y={S4.fastAt.y} w={150} text="за минуты" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      {frame >= b(0) + 50 && <Agent x={S4.agent.x} y={S4.agent.y} scale={0.8} enterAt={b(0) + 50} pose={agent} />}

      {/* дизайн-система: цвета, шрифты, блоки — контекст для агента */}
      <g opacity={system}>
        <Card x={DS.x} y={DS.y} w={DS.w} h={DS.h} stroke={theme.accent}>
          <Label x={DS.x + 20} y={DS.y + 36} anchor="start" size={22} weight={700} color={theme.accent}>
            Дизайн-система
          </Label>
          {SWATCHES.map((c, i) => (
            <circle key={c} cx={DS.x + 38 + i * 44} cy={DS.y + 76} r={16} fill={c} opacity={appear(frame, swatchAt[i], 8)} />
          ))}
          <g opacity={font}>
            <Label x={DS.x + 232} y={DS.y + 88} size={34} weight={700}>
              Аа
            </Label>
          </g>
          <g opacity={blocks}>
            <rect x={DS.x + 22} y={DS.y + 112} width={110} height={40} rx={10} fill={theme.alt} />
            <rect x={DS.x + 148} y={DS.y + 112} width={130} height={40} rx={8} fill={theme.paper} stroke={theme.grid} strokeWidth={3} />
            <rect x={DS.x + 160} y={DS.y + 126} width={80} height={12} rx={6} fill={theme.grid} />
          </g>
        </Card>
      </g>
      <Arrow x1={S4.agent.x} y1={DS.y + DS.h + 8} x2={S4.agent.x} y2={S4.agent.y - 82} color={theme.accent} draw={context} />
      <g opacity={context}>
        <Label x={S4.agent.x + 16} y={DS.y + DS.h + 36} anchor="start" size={20} weight={600} color={theme.accent}>
          контекст
        </Label>
      </g>

      {/* экраны в одном стиле */}
      <Arrow x1={S4.agent.x + 60} y1={S4.agent.y - 30} x2={SC.x - 12} y2={SC.y + 150} color={theme.accent} draw={toScreens} />
      {SCREENS.map((s, i) => {
        const a = appear(frame, screenAt[i])
        const x = SC.x + i * (SC.w + SC.gap)
        return (
          <g key={s.title}>
            {/* место будущего экрана — пунктиром */}
            <rect x={x} y={SC.y} width={SC.w} height={SC.h} rx={14} fill="none" stroke={theme.grid} strokeWidth={3} strokeDasharray="10 8" opacity={appear(frame, b(0) + 20) * (1 - a)} />
            <g opacity={a} transform={`translate(0 ${(1 - a) * 18})`}>
              <MiniScreen x={x} y={SC.y} w={SC.w} h={SC.h} kind={s.kind} title={s.title} />
            </g>
          </g>
        )
      })}
      <g opacity={same}>
        <Pill x={SC.x + (3 * SC.w + 2 * SC.gap) / 2} y={S4.sameY} w={230} text="в одном стиле" color={theme.accent} fill={theme.accentTint} size={22} />
      </g>

      {/* доска 2: Анна — новичок, подсказки */}
      <Client x={S4.anna.x} y={S4.anna.y} scale={0.8} enterAt={b(2) - 6} mood="happy" />
      <Phone x={S4.phoneA.x} y={S4.phoneA.y} scale={PHONE_SCALE} enterAt={b(2) - 4}>
        <PhoneScreen tapAt={-100} listAt={b(2) + 10} list={['присед', 'тяга']} label="Добавить">
          <g opacity={hint} transform={`translate(0 ${(1 - hint) * 8})`}>
            <path d="M-6 16 L0 6 L6 16 Z" fill={theme.alt} />
            <rect x={-50} y={16} width={100} height={66} rx={8} fill={theme.alt} />
            {['Подсказка:', 'нажмите', '«Добавить»'].map((t, i) => (
              <text key={t} x={0} y={34 + i * 18} textAnchor="middle" fill={theme.white} style={{ font: `${i === 0 ? 700 : 500} ${PHONE_FONT}px ${theme.font}` }}>
                {t}
              </text>
            ))}
          </g>
        </PhoneScreen>
      </Phone>
      <g opacity={personaA}>
        <Pill x={S4.phoneA.x} y={S4.personaY} w={340} text="Анна, новичок: подсказки" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>

      {/* Марина — опытная: плотный экран и горячие клавиши */}
      <Phone x={S4.phoneM.x} y={S4.phoneM.y} scale={PHONE_SCALE} enterAt={b(2) + 60}>
        <rect x={-50} y={-86} width={100} height={22} rx={6} fill={theme.accent} />
        <text x={0} y={-70.5} textAnchor="middle" fill={theme.white} style={{ font: `600 ${PHONE_FONT}px ${theme.font}` }}>
          Клиенты · 12
        </text>
        {DENSE.map((t, i) => (
          <g key={t} opacity={dense[i]}>
            <rect x={-50} y={-58 + i * 24} width={100} height={21} rx={4} fill={theme.paper} stroke={theme.grid} strokeWidth={1.5} />
            <text x={-45} y={-43 + i * 24} fill={theme.ink} style={{ font: `500 ${PHONE_FONT}px ${theme.font}` }}>
              {t}
            </text>
          </g>
        ))}
      </Phone>
      <g opacity={keys}>
        <Keycap x={S4.keys.x - 50} y={S4.keys.y} text="Alt" w={72} />
        <Label x={S4.keys.x + 2} y={S4.keys.y + 8} size={24} weight={700}>
          +
        </Label>
        <Keycap x={S4.keys.x + 50} y={S4.keys.y} text="N" />
        <Label x={S4.keys.x} y={S4.keys.y + 62} size={20} weight={600} color={theme.soft}>
          горячие клавиши
        </Label>
      </g>
      {frame >= b(2) + 60 && <Coach x={S4.marina2.x} y={S4.marina2.y} scale={0.8} enterAt={b(2) + 60} pose={frame >= b(2) + 120 ? 'point' : 'stand'} mood="happy" />}
      <g opacity={personaM}>
        <Pill x={S4.phoneM.x} y={S4.personaY} w={380} text="Марина, опытная: плотный вид" color={theme.accent} fill={theme.accentTint} size={20} compact />
      </g>

      {/* риски: что тестировать и чьи данные */}
      <g opacity={which}>
        <circle cx={(S4.phoneA.x + S4.phoneM.x) / 2} cy={S4.phoneA.y - 30} r={26} fill={theme.alt} />
        <Label x={(S4.phoneA.x + S4.phoneM.x) / 2} y={S4.phoneA.y - 20} size={30} weight={800} color={theme.white}>
          ?
        </Label>
        <Label x={(S4.phoneA.x + S4.phoneM.x) / 2} y={S4.phoneA.y + 30} size={20} weight={600} color={theme.alt}>
          какой экран
        </Label>
        <Label x={(S4.phoneA.x + S4.phoneM.x) / 2} y={S4.phoneA.y + 56} size={20} weight={600} color={theme.alt}>
          проверять?
        </Label>
      </g>
      <g opacity={risk}>
        <Card x={S4.risk.x} y={S4.risk.y} w={S4.risk.w} h={S4.risk.h} stroke={theme.risk} fill={theme.riskTint}>
          <text x={S4.risk.x + S4.risk.w / 2} y={S4.risk.y + 33} textAnchor="middle" style={{ font: `600 21px ${theme.font}` }}>
            <tspan fill={theme.risk} fontWeight={800}>
              Риски:{' '}
            </tspan>
            <tspan fill={theme.ink}>труднее тестировать · данные о человеке нужно беречь</tspan>
          </text>
        </Card>
      </g>

      {/* доска 3: много вариантов — выбирает человек */}
      {frame >= b(4) - 20 && <Agent x={S4.agent3.x} y={S4.agent3.y} scale={0.75} enterAt={b(4) - 20} pose={frame >= b(4) + 70 ? 'done' : 'working'} />}
      {VARIANTS.map((k, i) => {
        const a = appear(frame, varAt[i]) * (picked && i !== PICK ? 0.35 : 1)
        const x = V.x + i * (V.w + V.gap)
        return (
          <g key={k} opacity={a}>
            {picked && i === PICK && <rect x={x - 8} y={V.y - 8} width={V.w + 16} height={V.h + 16} rx={18} fill="none" stroke={theme.ok} strokeWidth={5} />}
            <MiniScreen x={x} y={V.y} w={V.w} h={V.h} kind={k} title={`вариант ${i + 1}`} />
            {picked && i === PICK && <Mark x={x + V.w} y={V.y} ok r={20} />}
          </g>
        )
      })}
      {frame >= b(4) + 10 && <Coach x={S4.marina3.x} y={S4.marina3.y} scale={0.8} label="Марина" enterAt={b(4) + 10} pose={marina3[0]} mood={marina3[1]} />}
      <g opacity={choose}>
        <Pill x={S4.choose.x} y={S4.choose.y} w={240} text="выбираете вы" color={theme.ok} fill={theme.okTint} size={22} />
      </g>
      <g opacity={taste}>
        <Pill x={S4.taste.x} y={S4.taste.y} w={520} text="вкус и чувство удобства — за человеком" color={theme.accent} size={20} compact />
      </g>
    </KitScene>
  )
}
