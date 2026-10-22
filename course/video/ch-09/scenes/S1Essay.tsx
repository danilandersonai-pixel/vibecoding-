import { interpolate, useCurrentFrame } from 'remotion'
import { Actor } from '../../actors/Actor'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP, trackAt } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Cloud, Mark, Pill } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { BAR } from '../../kit/screens/layout'
import { Window } from '../../kit/screens/Window'
import { theme } from '../../theme'
import { BOARD2, S1 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { CodeRows, CodeTagIcon, OpenBook, PeopleIcon, SayIcon, Sheet } from './parts'

const ID = 's1-essay'
const E = S1.essay
const A = S1.app
const C = S1.cloud
const T = S1.topics

// строки эссе: свои (0–1, 5), цитата (2–4), переписанный абзац (6–8)
const rowY = (i: number) => S1.rowY + i * S1.rowH
const OWN = [0, 1, 5]
const COPIED = [6, 7, 8]
// строки кода нашего приложения; чужой кусок ложится в строки 3–5
const CODE = [300, 360, 280, 330, 250, 380, 200, 260]
const CODE_STEP = 30
const codeTop = A.y + 80
// о чём ролик: три решения
const TOPICS = [
  { title: 'Чей это код?', sub: 'права и лицензии', color: theme.accent },
  { title: 'Что честно сказать?', sub: 'роль ИИ в работе', color: theme.ok },
  { title: 'Кого не отсечь?', sub: 'предвзятость', color: theme.risk },
]

// Сцена 1 (метафора): чужие слова в эссе — в кавычках и со ссылкой; абзац без кавычек — присвоение.
// С кодом так же, условия — в лицензии, а ИИ порой вставляет чужое молча. О чём ролик и цена промаха.
export function S1Essay() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: цитата со ссылкой и переписанный абзац
  const quote = useAppear(b(0) + 30)
  const quoteText = typed('«Чужая мысль — в кавычках»', frame, b(0) + 34, 40)
  const source = useAppear(b(0) + 86)
  const okMark = useAppear(b(0) + 112)
  const book = useAppear(b(1) + 12)
  const glow = appear(frame, b(1) + 30, 10)
  const fly = trackAt(frame, [
    [b(1) + 44, S1.book.x + 66, S1.book.y + 18],
    [b(1) + 84, E.x + 200, rowY(7)],
  ])
  const flying = frame >= b(1) + 44 && frame < b(1) + 86
  const copied = frame >= b(1) + 84
  const copyTint = appear(frame, b(1) + 92, 10)
  const badMark = useAppear(b(1) + 110)

  // доска 2: наше приложение, чужой проект с лицензией, агент молча вставляет кусок
  const appAt = b(2) + 10
  const codeShown = Math.min(CODE.length, Math.max(0, Math.floor((frame - appAt - 12) / 5) + 1))
  const cloud = useAppear(b(2) + 30)
  const license = useAppear(b(2) + 84)
  const piece = trackAt(frame, [
    [b(3) + 6, C.x + 230, 250],
    [b(3) + 36, S1.agent.x - 60, 420],
    [b(3) + 80, A.x + 230, codeTop + 4 * CODE_STEP],
  ])
  const pieceOn = frame >= b(3) + 6 && frame < b(3) + 82
  const inserted = appear(frame, b(3) + 80, 10)
  const silent = useAppear(b(3) + 104)
  const boardOut = interpolate(frame, [b(4), b(4) + 14], [1, 0], CLAMP)

  // о чём ролик и цена промаха
  const topics = useAppear(b(4) + 12)
  const topicAt = TOPICS.map((_, i) => b(4) + 34 + i * 40)
  const costAt = [b(5) + 10, b(5) + 30, b(5) + 84, b(5) + 120]

  const you = stepAt<[Pose, Mood]>(frame, [
    [0, ['think', 'neutral']],
    [b(0) + 112, ['cheer', 'happy']],
    [b(1) + 20, ['stand', 'neutral']],
    [b(1) + 100, ['surprised', 'worried']],
  ])
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(3), 'working'],
    [b(3) + 84, 'done'],
    [b(3) + 120, 'idle'],
  ])

  return (
    <KitScene chip="1 / 6 · Цитата со ссылкой" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* чужая книга — видна, когда камера отъезжает */}
      <g opacity={book}>
        <OpenBook x={S1.book.x} y={S1.book.y} glow={glow} />
        <Label x={S1.book.x} y={S1.book.y + 120} size={22} color={theme.soft} weight={700}>
          чужая книга
        </Label>
      </g>

      {/* лист эссе */}
      <Sheet x={E.x} y={E.y} w={E.w} h={E.h} title="Эссе">
        <CodeRows x={E.x + 62} y={rowY(0)} widths={[300, 250]} step={S1.rowH} />
        <rect x={E.x + 62} y={rowY(OWN[2]) - 6} width={280} height={12} rx={6} fill={theme.grid} />
        {/* цитата: в кавычках и со ссылкой */}
        <g opacity={quote}>
          <rect x={E.x + 58} y={rowY(2) - 22} width={E.w - 80} height={3 * S1.rowH + 8} rx={8} fill={theme.accentTint} />
          <rect x={E.x + 58} y={rowY(2) - 22} width={6} height={3 * S1.rowH + 8} rx={3} fill={theme.accent} />
          <text x={E.x + 78} y={rowY(2) + 14} fill={theme.ink} style={{ font: `italic 600 20px ${theme.font}` }}>
            {quoteText}
          </text>
          <g opacity={source}>
            <Label x={E.x + E.w - 30} y={rowY(4) + 6} anchor="end" size={20} color={theme.accent} weight={700}>
              — автор, «Книга», с. 12
            </Label>
          </g>
        </g>
        {/* переписанный абзац: без кавычек и без ссылки */}
        <rect x={E.x + 58} y={rowY(6) - 18} width={E.w - 80} height={3 * S1.rowH + 4} rx={8} fill={theme.riskTint} opacity={copyTint} />
        {copied && <CodeRows x={E.x + 62} y={rowY(COPIED[0])} widths={[290, 270, 230]} step={S1.rowH} color={theme.alt} />}
      </Sheet>
      {flying && (
        <g transform={`translate(${fly.x} ${fly.y})`}>
          <rect x={-58} y={-34} width={116} height={70} rx={8} fill={theme.white} stroke={theme.alt} strokeWidth={3} />
          <CodeRows x={-46} y={-14} widths={[92, 80, 70]} step={18} color={theme.alt} />
        </g>
      )}

      {/* вердикты */}
      <g opacity={okMark}>
        <Mark x={S1.verdict.x} y={S1.verdict.quote - 44} ok r={16} />
        <Pill x={S1.verdict.x} y={S1.verdict.quote} text="цитата со ссылкой" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      <g opacity={badMark}>
        <Mark x={S1.verdict.x} y={S1.verdict.copy - 44} ok={false} r={16} />
        <Pill x={S1.verdict.x} y={S1.verdict.copy} text="чужое за своё" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>
      <Actor x={S1.you.x} y={S1.you.y} scale={0.85} label="Вы" enterAt={4}>
        <Person color={theme.soft} pose={you[0]} mood={you[1]} />
      </Actor>

      {/* доска 2: наше приложение и чужой проект */}
      <g opacity={boardOut}>
        {frame >= appAt && (
          <Window x={A.x} y={A.y} w={A.w} h={A.h} at={appAt} bar={<Label x={18} y={BAR / 2 + 7} anchor="start" size={20} weight={700}>наше приложение</Label>}>
            <rect x={20} y={codeTop - A.y + 3 * CODE_STEP - 18} width={A.w - 40} height={3 * CODE_STEP + 6} rx={8} fill={theme.altTint} opacity={inserted} />
            <CodeRows x={30} y={codeTop - A.y} widths={CODE} step={CODE_STEP} shown={codeShown} hi={[3, 4, 5]} hiOpacity={inserted} />
          </Window>
        )}
        <g opacity={cloud}>
          <Cloud x={C.x} y={C.y} w={C.w} h={C.h} stroke={theme.alt}>
            <Label x={C.x + C.w / 2} y={C.y + 132} size={24} weight={700}>
              чужой проект
            </Label>
            <CodeRows x={C.x + C.w / 2 - 80} y={C.y + 160} widths={[150, 110]} step={18} color={theme.alt} />
          </Cloud>
        </g>
        <g opacity={license}>
          <Pill x={BOARD2 + 712} y={330} text="лицензия = условия" color={theme.alt} fill={theme.white} size={20} />
        </g>
        {pieceOn && (
          <g transform={`translate(${piece.x} ${piece.y})`}>
            <rect x={-56} y={-30} width={112} height={60} rx={8} fill={theme.white} stroke={theme.alt} strokeWidth={3} />
            <CodeRows x={-44} y={-12} widths={[88, 70, 80]} step={14} color={theme.alt} />
          </g>
        )}
        <g opacity={silent}>
          <Pill x={A.x + A.w / 2} y={470} text="без кавычек и без ссылки" color={theme.risk} fill={theme.riskTint} size={22} />
        </g>
        <Agent x={S1.agent.x} y={S1.agent.y} scale={0.8} enterAt={b(2) + 40} pose={agent} />
      </g>

      {/* о чём ролик: три решения */}
      <g opacity={topics}>
        <Card x={T.x} y={T.y} w={T.w} h={T.h} stroke={theme.accent} fill={theme.white}>
          <Label x={T.x + 36} y={T.y + 50} anchor="start" size={26} weight={800}>
            Этика вайб-кодинга — три решения
          </Label>
        </Card>
      </g>
      {TOPICS.map((t, i) => {
        const cx = T.x + (T.w / 3) * (i + 0.5)
        const icon = T.y + 128
        return (
          <g key={t.title} opacity={appear(frame, topicAt[i])}>
            {i === 0 && <CodeTagIcon x={cx} y={icon} />}
            {i === 1 && <SayIcon x={cx} y={icon} />}
            {i === 2 && <PeopleIcon x={cx} y={icon} />}
            <Label x={cx} y={T.y + 220} size={26} color={t.color} weight={800}>
              {t.title}
            </Label>
            <Label x={cx} y={T.y + 258} size={20} color={theme.soft} weight={600}>
              {t.sub}
            </Label>
          </g>
        )
      })}

      {/* цена промаха и оговорка */}
      <g opacity={appear(frame, costAt[0])}>
        <Label x={BOARD2 + 100} y={S1.costY + 8} anchor="start" size={22} color={theme.soft} weight={700}>
          промах стоит:
        </Label>
        <Pill x={BOARD2 + 330} y={S1.costY} text="денег" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>
      <g opacity={appear(frame, costAt[1])}>
        <Pill x={BOARD2 + 450} y={S1.costY} text="доверия" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>
      <g opacity={appear(frame, costAt[2])}>
        <Pill x={BOARD2 + 880} y={S1.costY} text="ориентиры, а не совет юриста" color={theme.accent} fill={theme.accentTint} size={20} />
      </g>
      <g opacity={appear(frame, costAt[3])}>
        <Label x={BOARD2 + 880} y={S1.costY + 50} size={20} color={theme.soft} weight={600}>
          законы в странах разные и меняются
        </Label>
      </g>
    </KitScene>
  )
}
