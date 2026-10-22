import { interpolate, useCurrentFrame } from 'remotion'
import { Actor } from '../../actors/Actor'
import { Coach } from '../../actors/Coach'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP, trackAt } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Browser, Mark, Pill } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { BAR } from '../../kit/screens/layout'
import { Window } from '../../kit/screens/Window'
import { theme } from '../../theme'
import { BOARD3, CLIENTS, daysWord, S2 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Bin, Clock, Sparkle, Speech } from './parts'

const ID = 's2-question'
const T = S2.toy
const Q = S2.question
const C = S2.clock
const SC = S2.screens
const L = S2.layers
const D = S2.data

const QUESTION = ['Поймёт ли Марина без подсказок,', 'кто из подопечных пропал?']
const LAYERS = ['Экран', 'Логика', 'Данные']
// где на «игрушке» вспыхивают искорки полировки
const SPARKS = [
  [300, 190],
  [120, 300],
  [380, 320],
  [200, 170],
  [330, 260],
]

// Сцена 2: сначала вопрос (иначе полировка без конца), вопрос про Марину; правила быстрого прототипа:
// таймбокс, тонкий срез, выдуманные данные, готовность выбросить код.
export function S2Question() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: бесконечная полировка → вопрос → таймбокс
  const toyAt = b(0) + 6
  const stop = b(1) + 10
  const edits = frame < b(0) + 30 ? 0 : 1 + Math.floor((Math.min(frame, stop) - (b(0) + 30)) / 3)
  const spin = (Math.min(frame, stop) - b(0)) * 9
  const dim = interpolate(frame, [stop, stop + 12], [1, 0.35], CLAMP)
  const loop = appear(frame, b(0) + 26)
  const card = appear(frame, b(1) + 6)
  const clockIn = appear(frame, b(2) + 6)
  const progress = interpolate(frame, [b(2) + 30, b(2) + 120], [0, 1], CLAMP)
  const box = appear(frame, b(2) + 16)
  const stopPill = appear(frame, b(2) + 124)
  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['think', 'neutral']],
    [b(1) + 70, ['point', 'neutral']],
    [b(2) + 10, ['stand', 'neutral']],
    [b(2) + 124, ['stand', 'happy']],
  ])

  // доска 2: десять недоделанных экранов против одного среза; выдуманные данные
  const screensAt = (i: number) => b(3) + 16 + i * 5
  const half = appear(frame, b(3) + 70)
  const sliceTitle = appear(frame, b(3) + 30)
  const column = interpolate(frame, [b(3) + 44, b(3) + 92], [0, 1], CLAMP)
  const path = appear(frame, b(3) + 96)
  const data = appear(frame, b(4) + 10)
  const rowAt = CLIENTS.map((_, i) => b(4) + 30 + i * 14)
  const noDb = appear(frame, b(4) + 112)

  // доска 3: жалко? → код в корзину, ответ остаётся
  const rule4 = appear(frame, b(5) + 30)
  const pity = appear(frame, b(5) + 40) * interpolate(frame, [b(5) + 110, b(5) + 120], [1, 0], CLAMP)
  const lid = interpolate(frame, [b(5) + 76, b(5) + 86, b(5) + 118, b(5) + 126], [0, 1, 1, 0], CLAMP)
  const fly = trackAt(frame, [
    [b(5) + 86, S2.you.x + 170, 315],
    [b(5) + 114, S2.bin.x, S2.bin.y - 90],
  ])
  const shrink = interpolate(frame, [b(5) + 86, b(5) + 114], [1, 0.3], CLAMP)
  const gone = frame >= b(5) + 116
  const answer = appear(frame, b(5) + 120)
  const you = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(5) + 40, ['think', 'worried']],
    [b(5) + 84, ['point', 'neutral']],
    [b(5) + 124, ['cheer', 'happy']],
  ])

  return (
    <KitScene chip="2 / 7 · Сначала вопрос" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* без вопроса — полировка без конца */}
      <g opacity={dim}>
        {frame >= toyAt && (
          <Browser x={T.x} y={T.y} w={T.w} h={T.h} at={toyAt} url="прототип">
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={20} y={BAR + 26 + i * 44} width={T.w - 40 - (i % 2) * 80} height={26} rx={6} fill={theme.grid} />
            ))}
          </Browser>
        )}
        {SPARKS.map(([x, y], i) => {
          const at = b(0) + 34 + i * 9
          const phase = frame >= at && frame < stop ? ((frame - at) % 45) / 45 : 0
          return <Sparkle key={i} x={x} y={y} s={Math.sin(phase * Math.PI)} />
        })}
        <g opacity={loop}>
          <g transform={`rotate(${spin} ${S2.loop.x} ${S2.loop.y})`}>
            <path d={`M${S2.loop.x + 36} ${S2.loop.y} A36 36 0 1 1 ${S2.loop.x} ${S2.loop.y - 36}`} fill="none" stroke={theme.alt} strokeWidth={6} strokeLinecap="round" />
            <path d={`M${S2.loop.x - 2} ${S2.loop.y - 48} L${S2.loop.x + 14} ${S2.loop.y - 36} L${S2.loop.x - 2} ${S2.loop.y - 24} Z`} fill={theme.alt} />
          </g>
          <Pill x={S2.loop.x + 170} y={S2.loop.y} text={`правка № ${edits}`} color={theme.alt} fill={theme.paper} size={22} compact />
        </g>
      </g>

      {/* вопрос прототипа */}
      <g opacity={card}>
        <Card x={Q.x} y={Q.y} w={Q.w} h={Q.h} stroke={theme.accent}>
          <Label x={Q.x + 28} y={Q.y + 38} anchor="start" size={20} weight={600} color={theme.soft}>
            Вопрос прототипа
          </Label>
          {QUESTION.map((line, i) => (
            <Label key={line} x={Q.x + 28} y={Q.y + 84 + i * 40} anchor="start" size={30} weight={700}>
              {typed(line, frame, b(1) + 16 + i * 30, 40)}
            </Label>
          ))}
        </Card>
      </g>
      <Coach x={S2.marina.x} y={S2.marina.y} scale={0.8} label="Марина" enterAt={b(1) + 4} pose={marina[0]} mood={marina[1]} />

      {/* правило 1: таймбокс */}
      <g opacity={clockIn}>
        <Clock x={C.x} y={C.y} r={C.r} from={18} to={23} progress={progress} />
      </g>
      <g opacity={box}>
        <Pill x={C.x + 270} y={C.y - 40} text="1 · таймбокс: один вечер" color={theme.accent} fill={theme.accentTint} size={22} />
      </g>
      <g opacity={stopPill}>
        <Pill x={C.x + 270} y={C.y + 34} text="стоп → оценка" color={theme.alt} fill={theme.paper} size={22} />
      </g>

      {/* правило 2: десять недоделанных экранов против одного тонкого среза */}
      <g opacity={appear(frame, b(3) + 16)}>
        <Label x={SC.x + (4 * SC.dx + SC.w) / 2} y={124} size={22} weight={600} color={theme.soft}>
          десять экранов наполовину
        </Label>
      </g>
      {Array.from({ length: 10 }, (_, i) => {
        const x = SC.x + (i % 5) * SC.dx
        const y = SC.y + Math.floor(i / 5) * SC.dy
        return (
          <g key={i} opacity={appear(frame, screensAt(i), 8)}>
            <rect x={x} y={y} width={SC.w} height={SC.h} rx={8} fill={theme.paper} stroke={theme.line} strokeWidth={3} />
            <rect x={x + 3} y={y + 3} width={SC.w - 6} height={28} rx={6} fill={theme.accentTint} />
            <rect x={x + 10} y={y + 44} width={SC.w - 20} height={8} rx={4} fill={theme.grid} />
            <rect x={x + 10} y={y + 62} width={SC.w - 34} height={8} rx={4} fill={theme.grid} />
          </g>
        )
      })}
      <g opacity={half}>
        <Mark x={SC.x + 16} y={SC.y + SC.dy + SC.h + 40} ok={false} />
        <Label x={SC.x + 40} y={SC.y + SC.dy + SC.h + 47} anchor="start" size={20} weight={600} color={theme.risk}>
          ни один не работает целиком
        </Label>
      </g>
      <g opacity={sliceTitle}>
        <Label x={L.x + L.w / 2} y={124} size={24} weight={700} color={theme.accent}>
          2 · тонкий срез
        </Label>
        {LAYERS.map((t, i) => (
          <g key={t}>
            <rect x={L.x} y={L.y + i * (L.h + L.gap)} width={L.w} height={L.h} rx={10} fill={theme.paper} stroke={theme.line} strokeWidth={3} />
            <Label x={L.x + 16} y={L.y + i * (L.h + L.gap) + L.h / 2 + 8} anchor="start" size={22} weight={600}>
              {t}
            </Label>
          </g>
        ))}
      </g>
      {column > 0 && <rect x={S2.column.x} y={L.y - 10} width={S2.column.w} height={(3 * L.h + 2 * L.gap + 20) * column} rx={10} fill={theme.accent} opacity={0.85} />}
      <g opacity={path}>
        <Pill x={L.x + L.w / 2} y={S2.path.y} text="список → пропавший → тренировки" color={theme.ok} fill={theme.okTint} size={18} compact />
      </g>

      {/* правило 3: данные выдуманы */}
      <g opacity={data}>
        <Card x={D.x} y={D.y} w={D.w} h={60 + CLIENTS.length * D.row + 16} stroke={theme.alt}>
          <Label x={D.x + 20} y={D.y + 40} anchor="start" size={22} weight={700} color={theme.alt}>
            3 · данные выдуманы
          </Label>
          {CLIENTS.map((c, i) => {
            const y = D.y + 60 + i * D.row
            return (
              <g key={c.name} opacity={appear(frame, rowAt[i], 8)}>
                <line x1={D.x + 16} y1={y} x2={D.x + D.w - 16} y2={y} stroke={theme.grid} strokeWidth={2} />
                <Label x={D.x + 20} y={y + 34} anchor="start" size={22} weight={600}>
                  {typed(c.name, frame, rowAt[i], 30)}
                </Label>
                <Label x={D.x + D.w - 20} y={y + 34} anchor="end" size={20} weight={500} color={theme.soft}>
                  {daysWord(c.days)}
                </Label>
              </g>
            )
          })}
        </Card>
      </g>
      <g opacity={noDb}>
        <Pill x={D.x + D.w / 2} y={480} text="настоящая база не нужна" color={theme.soft} fill={theme.paper} size={18} compact />
      </g>

      {/* правило 4: готовность выбросить */}
      <g opacity={rule4}>
        <Pill x={BOARD3 + 640} y={100} text="4 · готовность выбросить" color={theme.alt} fill={theme.altTint} size={22} />
      </g>
      <Bin x={S2.bin.x} y={S2.bin.y} lid={lid} />
      {!gone && frame >= b(5) && (
        <g transform={`translate(${fly.x} ${fly.y}) scale(${shrink})`} opacity={appear(frame, b(5) + 20)}>
          <Window x={-100} y={-65} w={200} h={130} at={b(5) + 20} bar={<Label x={14} y={BAR / 2 + 7} anchor="start" size={18} weight={600}>код прототипа</Label>}>
            {[0, 1, 2].map((i) => (
              <rect key={i} x={16} y={BAR + 16 + i * 24} width={150 - (i % 2) * 50} height={10} rx={5} fill={theme.grid} />
            ))}
          </Window>
        </g>
      )}
      <g opacity={pity}>
        <Speech x={S2.you.x - 10} y={S2.you.y - 140} text="жалко?" tx={S2.you.x} ty={S2.you.y - 98} color={theme.risk} />
      </g>
      <Actor x={S2.you.x} y={S2.you.y} scale={0.8} label="Вы" enterAt={b(5) + 26}>
        <Person color={theme.soft} pose={you[0]} mood={you[1]} />
      </Actor>
      <g opacity={answer}>
        <Card x={S2.answer.x} y={S2.answer.y} w={S2.answer.w} h={S2.answer.h} stroke={theme.ok} fill={theme.okTint}>
          <Label x={S2.answer.x + 30} y={S2.answer.y + 44} anchor="start" size={22} weight={600} color={theme.soft}>
            Ценность прототипа —
          </Label>
          <Label x={S2.answer.x + 30} y={S2.answer.y + 120} anchor="start" size={36} weight={700} color={theme.ok}>
            ответ на вопрос,
          </Label>
          <Label x={S2.answer.x + 30} y={S2.answer.y + 180} anchor="start" size={26} weight={600}>
            а не код.
          </Label>
        </Card>
        <Mark x={S2.answer.x + S2.answer.w - 36} y={S2.answer.y + 36} ok r={18} />
      </g>
    </KitScene>
  )
}
