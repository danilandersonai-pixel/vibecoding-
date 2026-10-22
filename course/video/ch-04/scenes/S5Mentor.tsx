import { interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Arrow, Label } from '../../kit/parts'
import { Callout, Mark, Pill } from '../../kit/props'
import { grow, stepAt } from '../../kit/reveal'
import { AgentChat } from '../../kit/screens/AgentChat'
import { Editor } from '../../kit/screens/Editor'
import { BAR, chatLayout, EDITOR_PAD, LH } from '../../kit/screens/layout'
import { Window } from '../../kit/screens/Window'
import { theme } from '../../theme'
import { BOARD2, MENTOR_CHAT, S5 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'

const ID = 's5-mentor'
const E = S5.editor
const CH = S5.chat
const M = S5.main
const SD = S5.side

// подсчёт объёма за неделю: в счёт идут только завершённые тренировки
const CODE = ['объём = 0', 'для тренировки из недели:', '  если она завершена:', '    объём += её объём']
// строки основной сессии; кадры их появления — в сцене, по репликам
const MAIN_ROWS = ['читаю файлы…', 'пишу тесты…', 'работаю…']

// Сцена 5: режим наставника. У Кости (подопечного Марины) объём — ноль; Марина просит не чинить, а учить. ИИ задаёт наводящие
// вопросы, причину Марина находит сама. Застряли трижды — подсказка, но не код; через полгода — понимание.
// Мелкий вопрос — в побочный чат: основная работа идёт, разговор не засоряется.
export function S5Mentor() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: код, ноль у Кости, просьба учить
  const result = useAppear(b(0) + 64)
  const ask = appear(frame, b(0) + 118) * (1 - appear(frame, b(3) + 70, 10))
  const found = useAppear(b(3) + 84)
  const mark = useAppear(b(3) + 130)
  const highlight = grow(frame, b(3) + 40, 12)

  // чат растёт по репликам; at подобран так, чтобы новое сообщение приходило на своём кадре
  const all = chatLayout(MENTOR_CHAT, CH.w, 0)
  const stages: [number, number, number][] = [
    // [кадр, сколько сообщений показать, какое из них приходит на этом кадре]
    [b(1) + 20, 1, 0],
    [b(2) + 10, 2, 1],
    [b(2) + 110, 3, 2],
    [b(3) + 10, 4, 3],
  ]
  const [stageAt, count, arriving] = stepAt(frame, [[0, stages[0]], ...stages.map((st) => [st[0], st] as [number, [number, number, number]])])
  const chatAt = stageAt - all.items[arriving].start
  const asking = (frame >= b(2) && frame < b(2) + 80) || (frame >= b(3) && frame < b(3) + 60)

  // доска 2: по кругу, без готового кода
  const title = useAppear(b(4) + 8)
  const nodeAt = [b(4) + 20, b(4) + 36]
  const loop = grow(frame, b(4) + 50, 16)
  const dot = frame >= b(4) + 66 ? ((frame - b(4) - 66) % 60) / 60 : -1
  const strikeAt = [b(4) + 74, b(4) + 88, b(4) + 102]
  const hintArrow = grow(frame, b(4) + 116, 12)
  const hint = useAppear(b(4) + 126)
  const later = useAppear(b(5) + 8)
  const good = useAppear(b(5) + 56)
  const luck = useAppear(b(5) + 104)
  const cross = interpolate(frame, [b(5) + 134, b(5) + 146], [0, 1], CLAMP)
  const mainAt = b(4) + 40
  const rowAt = [b(4) + 60, b(5) + 30, b(6) + 4]
  const sideAt = b(6) + 20
  const keysAt = [b(6) + 30, b(6) + 44]
  const q = useAppear(b(6) + 66)
  const a = useAppear(b(6) + 104)
  const apart = useAppear(b(6) + 136)

  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 64, ['surprised', 'worried']],
    [b(0) + 116, ['point', 'neutral']],
    [b(1) + 40, ['stand', 'neutral']],
    [b(2) + 60, ['think', 'neutral']],
    [b(2) + 104, ['point', 'neutral']],
    [b(3) + 30, ['think', 'neutral']],
    [b(3) + 84, ['cheer', 'happy']],
  ])
  const mentor = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(1) + 70, 'working'],
    [b(2), 'idle'],
    [b(2) + 120, 'working'],
    [b(3), 'idle'],
    [b(3) + 100, 'done'],
  ])

  // путь по кругу: верхняя стрелка вправо, нижняя дуга назад
  const askX = BOARD2 + 170
  const ansX = BOARD2 + 470
  const loopY = 190
  const dotPos = (() => {
    if (dot < 0) return null
    if (dot < 0.4) {
      const t = dot / 0.4
      return { x: askX + 104 + (ansX - 110 - askX - 104) * t, y: loopY }
    }
    const t = (dot - 0.4) / 0.6
    // нижняя дуга от «вы отвечаете» к «ИИ спрашивает»
    const x = ansX + (askX - ansX) * t
    return { x, y: loopY + 24 + Math.sin(Math.PI * t) * 48 }
  })()

  const hl = { x: E.x + 3, y: E.y + BAR + EDITOR_PAD + 2 * LH }
  return (
    <KitScene chip="5 / 6 · Режим наставника" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* код подсчёта и ноль у Кости */}
      <Editor x={E.x} y={E.y} w={E.w} at={b(0) + 6} file="подсчёт объёма" lines={CODE} />
      <g opacity={highlight}>
        <rect x={hl.x} y={hl.y} width={E.w - 6} height={LH} fill={theme.altTint} />
        <rect x={hl.x} y={hl.y} width={5} height={LH} fill={theme.alt} />
      </g>
      <g opacity={mark}>
        <Mark x={E.x + E.w - 26} y={hl.y + LH / 2} ok r={13} />
      </g>
      <g opacity={result}>
        <Pill x={S5.result.x} y={S5.result.y} text="Костя за неделю: 0 кг" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>
      <g opacity={ask}>
        <Callout x={360} y={386} tx={S5.marina.x + 22} ty={S5.marina.y - 50} text="Не чини — научи" color={theme.accent} fill={theme.accentTint} />
      </g>
      <g opacity={found}>
        <Callout x={374} y={386} tx={S5.marina.x + 22} ty={S5.marina.y - 50} text="Только завершённые!" color={theme.ok} fill={theme.okTint} size={18} />
      </g>
      <Coach x={S5.marina.x} y={S5.marina.y} scale={0.8} label="Марина" enterAt={8} pose={marina[0]} mood={marina[1]} />

      {/* чат с наставником */}
      {frame >= stages[0][0] - 12 && <AgentChat x={CH.x} y={CH.y} w={CH.w} at={chatAt} messages={MENTOR_CHAT.slice(0, count)} />}
      <g opacity={asking ? 1 : 0}>
        {[-30, 0, 30].map((dx, i) => (
          <Label key={dx} x={S5.mentor.x + dx} y={S5.mentor.y - 104 - (i % 2) * 14} size={24} color={theme.accent} weight={800}>
            ?
          </Label>
        ))}
      </g>
      <Agent x={S5.mentor.x} y={S5.mentor.y} scale={0.9} label="ИИ-наставник" enterAt={b(1) + 26} pose={mentor} />

      {/* доска 2: по кругу, без готового кода */}
      <g opacity={title}>
        <Pill x={BOARD2 + 320} y={116} text="Вопрос — ответ, без готового кода" color={theme.accent} fill={theme.accentTint} size={20} />
      </g>
      {[
        { x: askX, text: 'ИИ задаёт вопрос', color: theme.accent },
        { x: ansX, text: 'вы отвечаете сами', color: theme.ok },
      ].map((n, i) => (
        <g key={n.text} opacity={appear(frame, nodeAt[i])}>
          <Pill x={n.x} y={loopY} text={n.text} color={n.color} fill={theme.white} size={20} />
        </g>
      ))}
      <Arrow x1={askX + 106} y1={loopY} x2={ansX - 112} y2={loopY} color={theme.ink} draw={loop} />
      <path d={`M${ansX} ${loopY + 22} Q${(askX + ansX) / 2} ${loopY + 120} ${askX} ${loopY + 22}`} fill="none" stroke={theme.line} strokeWidth={3} strokeDasharray="8 7" opacity={loop} />
      {dotPos && <circle cx={dotPos.x} cy={dotPos.y} r={8} fill={theme.alt} />}
      {strikeAt.map((at, i) => (
        <g key={at} opacity={appear(frame, at, 8)}>
          <Mark x={BOARD2 + 80 + i * 44} y={320} ok={false} r={16} />
        </g>
      ))}
      <g opacity={appear(frame, strikeAt[2] + 6)}>
        <Label x={BOARD2 + 124} y={364} size={18} color={theme.soft} weight={600}>
          застряли трижды
        </Label>
      </g>
      <Arrow x1={BOARD2 + 210} y1={320} x2={BOARD2 + 286} y2={320} color={theme.alt} draw={hintArrow} />
      <g opacity={hint}>
        <Pill x={BOARD2 + 420} y={320} text="подсказка, но не код" color={theme.alt} fill={theme.altTint} size={20} />
      </g>
      <g opacity={later}>
        <Label x={BOARD2 + 60} y={438} anchor="start" size={22} weight={700}>
          Сегодня — медленнее, а через полгода:
        </Label>
      </g>
      <g opacity={good}>
        <Pill x={BOARD2 + 190} y={492} text="понимаете свой проект ✓" color={theme.ok} fill={theme.okTint} size={20} />
      </g>
      <g opacity={luck}>
        <Pill x={BOARD2 + 470} y={492} text="надежда на удачу" color={theme.risk} fill={theme.riskTint} size={20} />
        <line x1={BOARD2 + 380} y1={492} x2={BOARD2 + 380 + 180 * cross} y2={492} stroke={theme.risk} strokeWidth={4} strokeLinecap="round" opacity={cross > 0 ? 1 : 0} />
      </g>

      {/* основная сессия идёт своим ходом */}
      {frame >= mainAt && (
        <Window x={M.x} y={M.y} w={M.w} h={M.h} at={mainAt} bar={<Label x={18} y={BAR / 2 + 7} anchor="start" size={18} weight={700}>Основная задача</Label>}>
          <Label x={20} y={BAR + 40} anchor="start" size={20} weight={700}>
            Подсчёт объёма
          </Label>
          {MAIN_ROWS.map((t, i) => {
            const shown = appear(frame, rowAt[i], 10)
            const done = i < 2 && frame >= rowAt[i] + 90
            const spin = Math.floor(frame / 8) % 3
            return (
              <g key={t} opacity={shown}>
                <circle cx={32} cy={BAR + 84 + i * 50} r={10} fill={done ? theme.ok : theme.alt} opacity={done ? 1 : 0.5 + 0.5 * (spin / 2)} />
                <Label x={54} y={BAR + 91 + i * 50} anchor="start" size={20} color={theme.ink}>
                  {t}
                </Label>
              </g>
            )
          })}
        </Window>
      )}
      {/* побочный чат */}
      {frame >= sideAt && (
        <Window x={SD.x} y={SD.y} w={SD.w} h={SD.h} at={sideAt} stroke={theme.accent} bar={<Label x={18} y={BAR / 2 + 7} anchor="start" size={18} weight={700} color={theme.accent}>Побочный чат</Label>}>
          <g opacity={q}>
            <rect x={SD.w - 16 - 150} y={BAR + 16} width={150} height={66} rx={14} fill={theme.accentTint} stroke={theme.accent} strokeWidth={2} />
            <Label x={SD.w - 16 - 136} y={BAR + 43} anchor="start" size={18}>
              Что значит
            </Label>
            <Label x={SD.w - 16 - 136} y={BAR + 69} anchor="start" size={18}>
              «завершена»?
            </Label>
          </g>
          <g opacity={a}>
            <rect x={16} y={BAR + 98} width={196} height={92} rx={14} fill={theme.codeBg} stroke={theme.line} strokeWidth={2} />
            {['Подопечный', 'нажал «Готово»', 'после тренировки'].map((t, i) => (
              <Label key={t} x={30} y={BAR + 125 + i * 26} anchor="start" size={18}>
                {t}
              </Label>
            ))}
          </g>
        </Window>
      )}
      {['Ctrl + ;', '/btw'].map((t, i) => (
        <g key={t} opacity={appear(frame, keysAt[i])}>
          <Pill x={[BOARD2 + 840, BOARD2 + 1030][i]} y={S5.keys.y} text={t} color={theme.ink} fill={theme.white} size={20} mono />
        </g>
      ))}
      <g opacity={appear(frame, keysAt[1])}>
        <Label x={BOARD2 + 942} y={S5.keys.y + 7} size={20} color={theme.soft}>
          или
        </Label>
      </g>
      <g opacity={apart}>
        <Label x={BOARD2 + 950} y={520} size={20} color={theme.soft} weight={600}>
          в основной разговор не попадает
        </Label>
      </g>
    </KitScene>
  )
}
