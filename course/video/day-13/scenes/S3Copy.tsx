import { interpolate, useCurrentFrame } from 'remotion'
import { Actor } from '../../actors/Actor'
import { Coach } from '../../actors/Coach'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { useAppear, usePop } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Callout, Mark, Pill, Slot } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { COPY_LIST, LIST_H, listRowY, S3 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'

const ID = 's3-copy'
const L = S3.list
const R = S3.race
const CH = S3.chat
const PN = S3.pain

// Сцена 3 (подводный камень): копировать функции конкурентов — список «как у них» растёт, а зрелый эталон
// годами копил сотни функций: гонка без финиша; вместе с функциями переезжают неудачные решения.
// Марине нужен не ещё один чат, а видеть подходы сразу; остальное — в таблицу паритета: позже или не делаем.
export function S3Copy() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // список «как у них»: место строк — сразу, строки — по репликам
  const list = useAppear(b(0) + 4)
  const rowAt = COPY_LIST.map((_, i) => (i === 0 ? b(0) + 110 : i < 7 ? b(1) + 30 + (i - 1) * 16 : b(3) + 40))
  const badAt = b(3) + 60
  const askAt = COPY_LIST.map((_, i) => b(4) + 20 + i * 8)
  const flaw = appear(frame, badAt + 10, 10)
  const decideAt = COPY_LIST.map((_, i) => b(6) + 30 + i * 8)

  // «Вы»: «у них есть чат — сделаем и мы» → «зачем это здесь?»
  const sayCopy = appear(frame, b(0) + 96, 10) * (1 - appear(frame, b(2), 10))
  const sayWhy = appear(frame, b(4) + 10, 10) * (1 - appear(frame, b(5), 10))

  // гонка за эталоном: место — пунктиром, потом полосы
  const raceSlot = appear(frame, b(0) + 20, 12) * (1 - appear(frame, b(2) + 4, 10))
  const race = useAppear(b(2) + 4)
  const refW = interpolate(frame, [b(2) + 14, b(2) + 54], [0, S3.barW], CLAMP)
  const many = useAppear(b(2) + 44)
  const more = appear(frame, b(2) + 54, 14)
  const youW = interpolate(frame, [b(2) + 60, b(2) + 96], [0, S3.youW], CLAMP)
  const endless = useAppear(b(2) + 120)

  // доска 2: Марине не нужен ещё один чат — нужно видеть подходы сразу
  const where = useAppear(b(5) + 40)
  const chat = useAppear(b(5) + 50)
  const noChat = useAppear(b(5) + 70)
  const pain = usePop(b(5) + 100)

  const you = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 90, ['point', 'happy']],
    [b(2) + 20, ['stand', 'neutral']],
    [b(3) + 50, ['surprised', 'worried']],
    [b(4), ['think', 'neutral']],
    [b(6) + 30, ['stand', 'happy']],
  ])
  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['think', 'worried']],
    [b(5) + 110, ['point', 'happy']],
  ])

  return (
    <KitScene chip="3 / 4 · Подводный камень: «как у них»" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* список функций «как у них» */}
      <g opacity={list}>
        <Card x={L.x} y={L.y} w={L.w} h={LIST_H} stroke={theme.line} fill={theme.white}>
          <Label x={L.x + 24} y={L.y + 40} anchor="start" size={24} weight={800}>
            Как у них
          </Label>
          <line x1={L.x + 20} y1={L.y + 56} x2={L.x + L.w - 20} y2={L.y + 56} stroke={theme.grid} strokeWidth={2} />
        </Card>
      </g>
      {COPY_LIST.map((r, i) => {
        const y = listRowY(i)
        const on = appear(frame, rowAt[i], 10)
        const ask = appear(frame, askAt[i], 8) * (r.bad ? 0 : 1)
        const decided = appear(frame, decideAt[i], 10)
        const pillW = Math.round(r.decision.length * 18 * 0.56 + 28)
        return (
          <g key={r.text}>
            {frame < rowAt[i] + 6 && (
              <g opacity={list}>
                <Slot x={L.x + 18} y={y - 25} w={L.w - 36} h={34} r={8} color={theme.grid} />
              </g>
            )}
            <g opacity={on}>
              {r.bad ? (
                <>
                  <circle cx={L.x + 30} cy={y - 7} r={6} fill={theme.risk} opacity={1 - appear(frame, badAt, 8)} />
                  <g opacity={appear(frame, badAt, 8)}>
                    <Mark x={L.x + 30} y={y - 7} ok={false} r={13} />
                  </g>
                </>
              ) : (
                <>
                  <circle cx={L.x + 30} cy={y - 7} r={6} fill={theme.line} opacity={1 - ask} />
                  <g opacity={ask}>
                    <circle cx={L.x + 30} cy={y - 7} r={12} fill={theme.altTint} stroke={theme.alt} strokeWidth={2.5} />
                    <Label x={L.x + 30} y={y} size={18} weight={800} color={theme.alt}>
                      ?
                    </Label>
                  </g>
                </>
              )}
              <Label x={L.x + 54} y={y} anchor="start" size={20} weight={r.bad ? 700 : 600} color={r.bad ? theme.risk : theme.ink}>
                {r.text}
              </Label>
              <g opacity={1 - decided}>
                <Label x={L.x + L.w - 22} y={y} anchor="end" size={18} weight={600} color={theme.soft}>
                  {r.from}
                </Label>
              </g>
              <g opacity={decided}>
                <Pill x={L.x + L.w - 20 - pillW / 2} y={y - 7} text={r.decision} color={r.decision === 'позже' ? theme.alt : theme.soft} fill={r.decision === 'позже' ? theme.altTint : theme.paper} compact />
              </g>
            </g>
          </g>
        )
      })}

      <g opacity={flaw}>
        <Pill x={L.x + L.w + 120} y={listRowY(COPY_LIST.length - 1) - 7} text="неудача эталона" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>

      {/* гонка за эталоном */}
      <g opacity={raceSlot}>
        <Slot x={R.x} y={R.y} w={R.w} h={R.h} text="гонка за эталоном" />
      </g>
      <g opacity={race}>
        <Card x={R.x} y={R.y} w={R.w} h={R.h} stroke={theme.line} fill={theme.white}>
          <Label x={R.x + 24} y={R.y + 40} anchor="start" size={22} weight={800}>
            Гонка за эталоном
          </Label>
          <Label x={R.x + 24} y={R.y + 96} anchor="start" size={20} weight={700}>
            Эталон А
          </Label>
          <Label x={R.x + 24} y={R.y + 156} anchor="start" size={20} weight={700} color={theme.accent}>
            Вы
          </Label>
        </Card>
        <rect x={S3.barX} y={R.y + 78} width={refW} height={26} rx={8} fill={theme.line} />
        <rect x={S3.barX} y={R.y + 138} width={youW} height={26} rx={8} fill={theme.accent} />
      </g>
      <g opacity={many}>
        <Label x={R.x + R.w - 40} y={R.y + 66} anchor="end" size={18} weight={600} color={theme.soft}>
          сотни функций за годы
        </Label>
      </g>
      <g opacity={more}>
        <Arrow x1={R.x + R.w - 36} y1={R.y + 91} x2={R.x + R.w - 10} y2={R.y + 91} color={theme.line} dashed />
      </g>
      <g opacity={endless}>
        <Pill x={R.x + 440} y={R.y + 151} text="гонка без финиша" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>

      {/* «Вы»: скопировать — или спросить, зачем */}
      <Actor x={S3.you.x} y={S3.you.y} scale={0.65} label="Вы" enterAt={b(0) + 20}>
        <Person color={theme.soft} pose={you[0]} mood={you[1]} />
      </Actor>
      <g opacity={sayCopy}>
        <Callout x={S3.you.x} y={352} tx={S3.you.x + 6} ty={S3.you.y - 54} text="у них есть чат — сделаем и мы" color={theme.soft} />
      </g>
      <g opacity={sayWhy}>
        <Callout x={S3.you.x} y={352} tx={S3.you.x + 6} ty={S3.you.y - 54} text="зачем это здесь?" color={theme.alt} />
      </g>

      {/* доска 2: боль Марины */}
      {frame >= b(5) - 16 && <Coach x={S3.marina.x} y={S3.marina.y} scale={0.8} label="Марина" color={theme.accent} enterAt={b(5) - 16} pose={marina[0]} mood={marina[1]} />}
      <g opacity={where}>
        <Callout x={S3.marina.x} y={226} tx={S3.marina.x + 4} ty={S3.marina.y - 70} text="где подходы Анны?" color={theme.accent} />
      </g>
      <g opacity={chat}>
        <Card x={CH.x} y={CH.y} w={CH.w} h={CH.h} stroke={theme.line} fill={theme.white}>
          <path d={`M${CH.x + 22} ${CH.y + 22} h40 a8 8 0 0 1 8 8 v16 a8 8 0 0 1 -8 8 h-24 l-10 10 v-10 h-6 a8 8 0 0 1 -8 -8 v-16 a8 8 0 0 1 8 -8 Z`} fill={theme.paper} stroke={theme.soft} strokeWidth={2.5} strokeLinejoin="round" />
          <Label x={CH.x + 90} y={CH.y + 46} anchor="start" size={22} weight={700} color={theme.soft}>
            ещё один чат
          </Label>
        </Card>
      </g>
      <g opacity={noChat}>
        <Mark x={CH.x + CH.w - 36} y={CH.y + CH.h / 2} ok={false} r={16} />
      </g>
      {frame >= b(5) + 100 && (
        <g transform={`translate(${PN.x + PN.w / 2} ${PN.y + PN.h / 2}) scale(${pain}) translate(${-(PN.x + PN.w / 2)} ${-(PN.y + PN.h / 2)})`}>
          <Card x={PN.x} y={PN.y} w={PN.w} h={PN.h} stroke={theme.accent} fill={theme.white}>
            <rect x={PN.x + 3} y={PN.y + 3} width={PN.w - 6} height={PN.h - 6} rx={10} fill={theme.accentTint} />
            <Mark x={PN.x + 42} y={PN.y + PN.h / 2} ok r={18} />
            <Label x={PN.x + 78} y={PN.y + 44} anchor="start" size={26} weight={800} color={theme.accent}>
              тренер видит подходы сразу
            </Label>
            <Label x={PN.x + 78} y={PN.y + 78} anchor="start" size={20} weight={600} color={theme.soft}>
              снимает общую боль Марины и Димы
            </Label>
          </Card>
        </g>
      )}
    </KitScene>
  )
}
