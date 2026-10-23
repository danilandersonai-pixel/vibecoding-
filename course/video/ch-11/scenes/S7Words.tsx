import { interpolate, useCurrentFrame } from 'remotion'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Callout, Mark, Pill } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { theme } from '../../theme'
import { ON_STEP, S7, STEPS } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { AppIcon, Blueprint, MiniScreen, Stairs, type AppGlyph, type ScreenKind } from './parts'

const ID = 's7-words'
const G = S7.guesses
const PR = S7.precise
const ST = S7.stack
const BP = S7.print
const AP = S7.apps
const FN = S7.final

// три прочтения «Сделай кнопку побольше»
const GUESSES: { kind: ScreenKind; text: string }[] = [
  { kind: 'wide', text: 'шире?' },
  { kind: 'tall', text: 'выше?' },
  { kind: 'grid', text: 'все сразу?' },
]
// точные средства между речью и кодом: снизу вверх
const TOOLS = ['типы', 'тесты и контракты', 'спецификации']
// та же просьба — точно: случаи, пример, как проверить
const PRECISE = ['Кнопка «Сохранить» — во всю ширину', 'Случаи: телефон и планшет', 'Пример: как на макете 2', 'Проверка: видна без прокрутки']
const GLYPHS: AppGlyph[] = ['list', 'chart', 'check', 'clock', 'dumbbell']
const COLORS = [theme.accent, theme.alt, theme.ok, theme.soft]
// значки программ, в которых код никто не проверял
const UNCHECKED = [2, 6, 9, 13]
const FINAL = ['понимание', 'проверка', 'ответственность за итог']

// Сцена 7: снова лестница. Речь неоднозначна — «Сделай кнопку побольше»; поэтому точные средства остаются
// между речью и кодом; программировать словами — значит говорить точно. Код — как чертёж. Программ больше,
// и непроверенного кода тоже; сила — в понимании, проверке и ответственности.
export function S7Words() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: просьба, три прочтения, точные средства, точная просьба
  const ask = appear(frame, b(0) + 40) * (1 - appear(frame, b(2) + 6))
  const guessAt = GUESSES.map((_, i) => b(0) + 100 + i * 16)
  const guessesOut = 1 - appear(frame, b(2) + 6)
  // пунктир места гаснет до окна горячей точки «Точные средства»
  const place = appear(frame, b(1) + 30) * (1 - appear(frame, b(1) + 160))
  const tools = appear(frame, b(1) + 40)
  const slabAt = [b(1) + 120, b(1) + 140, b(1) + 160]
  const precise = appear(frame, b(2) + 16)
  const rowAt = PRECISE.map((_, i) => b(2) + 26 + i * 34)
  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['cheer', 'happy']],
    [b(0) + 36, ['point', 'neutral']],
    [b(0) + 100, ['surprised', 'worried']],
    [b(1) + 20, ['think', 'neutral']],
    [b(1) + 150, ['stand', 'happy']],
    [b(2) + 10, ['point', 'happy']],
    [b(2) + 170, ['cheer', 'happy']],
  ])

  // доска 2: чертёж — читают, когда сломалось; программ больше — и непроверенного кода
  const print = appear(frame, b(3) + 10)
  const draw = interpolate(frame, [b(3) + 20, b(3) + 80], [0, 1], CLAMP)
  const like = appear(frame, b(3) + 60)
  const crack = appear(frame, b(3) + 110)
  const read = appear(frame, b(3) + 126)
  const iconAt = (i: number) => b(4) + 8 + i * 5
  const more = appear(frame, b(4) + 60)
  const flagAt = UNCHECKED.map((_, i) => b(4) + 120 + i * 8)
  const unchecked = appear(frame, b(4) + 130)

  // поверх: в чём сила
  const fin = appear(frame, b(5) + 10)
  const finAt = [b(5) + 70, b(5) + 92, b(5) + 118]

  return (
    <KitScene
      chip="7 / 7 · Речь — новый слой"
      duration={sceneDuration(ID)}
      {...STAGING[ID]}
      overlay={
        <g opacity={fin}>
          <rect x={0} y={0} width={1280} height={720} fill={theme.ink} opacity={0.25} />
          <Card x={FN.x} y={FN.y} w={FN.w} h={FN.h} stroke={theme.accent} fill={theme.paper}>
            <Label x={FN.x + 240} y={FN.y + 74} anchor="start" size={28} weight={700} color={theme.accent}>
              Сила не в скорости генерации, а в:
            </Label>
            {FINAL.map((t, i) => {
              const a = appear(frame, finAt[i])
              return (
                <g key={t} opacity={a} transform={`translate(${(1 - a) * 20} 0)`}>
                  <Mark x={FN.x + 270} y={FN.y + 150 + i * 72} ok r={20} />
                  <Label x={FN.x + 310} y={FN.y + 159 + i * 72} anchor="start" size={28} weight={700}>
                    {t}
                  </Label>
                </g>
              )
            })}
          </Card>
          <Coach x={S7.cheer.marina.x} y={S7.cheer.marina.y} scale={0.8} label="Марина" enterAt={b(5) + 20} pose="cheer" mood="happy" />
          <Coach x={S7.cheer.dima.x} y={S7.cheer.dima.y} scale={0.8} color={theme.alt} label="Дима" enterAt={b(5) + 30} pose="cheer" mood="happy" />
        </g>
      }
    >
      <Stairs shown={[1, 1, 1]} subs={[1, 1, 1]} />

      {/* «Сделай кнопку побольше» — и три прочтения */}
      <Coach x={ON_STEP[2].x} y={ON_STEP[2].y} scale={0.75} enterAt={4} pose={marina[0]} mood={marina[1]} />
      <g opacity={ask}>
        <Callout x={S7.ask.x} y={S7.ask.y} tx={ON_STEP[2].x + 6} ty={ON_STEP[2].y - 62} text="«Сделай кнопку побольше»" color={theme.accent} />
      </g>
      {GUESSES.map((g, i) => {
        const a = appear(frame, guessAt[i]) * guessesOut
        const x = G.x + i * (G.w + G.gap)
        return (
          <g key={g.text} opacity={a} transform={`translate(0 ${(1 - appear(frame, guessAt[i])) * 14})`}>
            <MiniScreen x={x} y={G.y} w={G.w} h={G.h} kind={g.kind} />
            <Label x={x + G.w / 2} y={G.y + G.h + 32} size={22} weight={700} color={theme.alt}>
              {g.text}
            </Label>
          </g>
        )
      })}

      {/* точные средства — слои между речью и кодом */}
      <rect x={ST.x} y={STEPS[2].top} width={ST.w} height={STEPS[1].top - STEPS[2].top} fill="none" stroke={theme.alt} strokeWidth={3} strokeDasharray="9 7" opacity={place} />
      <g opacity={tools}>
        <Label x={S7.tools.x - 6} y={S7.tools.y} anchor="end" size={22} weight={700} color={theme.alt}>
          точные средства →
        </Label>
      </g>
      {TOOLS.map((t, i) => {
        const a = appear(frame, slabAt[i])
        const y = STEPS[1].top - (i + 1) * ST.h
        return (
          <g key={t} opacity={a} transform={`translate(${(1 - a) * -30} 0)`}>
            <rect x={ST.x} y={y} width={ST.w} height={ST.h} fill={theme.altTint} stroke={theme.alt} strokeWidth={3} />
            <Label x={ST.x + ST.w / 2} y={y + ST.h / 2 + 7} size={20} weight={700}>
              {t}
            </Label>
          </g>
        )
      })}

      {/* программировать словами — точно */}
      <g opacity={precise}>
        <Card x={PR.x} y={PR.y} w={PR.w} h={PR.h} stroke={theme.ok}>
          <Label x={PR.x + 22} y={PR.y + 36} anchor="start" size={22} weight={700} color={theme.ok}>
            Точнее:
          </Label>
          {PRECISE.map((t, i) => (
            <Label key={t} x={PR.x + 22} y={PR.y + 74 + i * 34} anchor="start" size={20} weight={600}>
              {typed(t, frame, rowAt[i], 45)}
            </Label>
          ))}
        </Card>
      </g>

      {/* доска 2: код — как чертёж */}
      <g opacity={print}>
        <Blueprint x={BP.x} y={BP.y} w={BP.w} h={BP.h} draw={draw} />
      </g>
      <g opacity={crack}>
        <path d={`M${BP.x + BP.w / 2 + 40} ${BP.y + 120} l14 22 l-16 14 l18 24 l-12 20`} fill="none" stroke={theme.risk} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g opacity={read}>
        <circle cx={BP.x + BP.w / 2 + 60} cy={BP.y + 170} r={42} fill={theme.white} fillOpacity={0.35} stroke={theme.ink} strokeWidth={6} />
        <line x1={BP.x + BP.w / 2 + 90} y1={BP.y + 200} x2={BP.x + BP.w / 2 + 130} y2={BP.y + 240} stroke={theme.ink} strokeWidth={10} strokeLinecap="round" />
      </g>
      <g opacity={like}>
        <Pill x={S7.printNote.x} y={S7.printNote.y} w={300} text="код — как чертёж" color={theme.accent} fill={theme.accentTint} size={22} />
      </g>
      <g opacity={read}>
        <Label x={S7.printNote.x} y={S7.printNote.y + 54} size={20} weight={600} color={theme.soft}>
          читают реже — но когда сломалось
        </Label>
      </g>

      {/* программ всё больше — и непроверенного кода */}
      {Array.from({ length: AP.cols * AP.rows }, (_, i) => {
        const a = appear(frame, iconAt(i), 8)
        const x = AP.x + (i % AP.cols) * (AP.size + AP.gap)
        const y = AP.y + Math.floor(i / AP.cols) * AP.dy
        const flagged = UNCHECKED.indexOf(i)
        return (
          <g key={i}>
            {/* место будущего значка — пунктиром */}
            <rect x={x} y={y} width={AP.size} height={AP.size} rx={18} fill="none" stroke={theme.grid} strokeWidth={3} strokeDasharray="8 7" opacity={appear(frame, b(3) + 30) * (1 - a)} />
            <g opacity={a} transform={`translate(${x + AP.size / 2} ${y + AP.size / 2}) scale(${0.6 + 0.4 * a}) translate(${-x - AP.size / 2} ${-y - AP.size / 2})`}>
              <AppIcon x={x} y={y} size={AP.size} color={COLORS[i % COLORS.length]} glyph={GLYPHS[i % GLYPHS.length]} />
              {flagged >= 0 && (
                <g opacity={appear(frame, flagAt[flagged], 8)}>
                  <circle cx={x + AP.size - 4} cy={y + 4} r={16} fill={theme.risk} stroke={theme.paper} strokeWidth={3} />
                  <Label x={x + AP.size - 4} y={y + 12} size={20} weight={800} color={theme.white}>
                    !
                  </Label>
                </g>
              )}
            </g>
          </g>
        )
      })}
      <g opacity={more}>
        <Pill x={S7.appsNote.x} y={S7.appsNote.ok} w={300} text="программ всё больше" color={theme.ok} fill={theme.okTint} size={22} />
      </g>
      <g opacity={unchecked}>
        <Pill x={S7.appsNote.x} y={S7.appsNote.risk} w={360} text="и непроверенного кода тоже" color={theme.risk} fill={theme.riskTint} size={22} />
      </g>
    </KitScene>
  )
}
