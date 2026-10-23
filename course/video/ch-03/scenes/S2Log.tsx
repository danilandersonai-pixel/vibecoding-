import { useCurrentFrame } from 'remotion'
import { Client } from '../../actors/Client'
import type { Mood, Pose } from '../../actors/Person'
import { Phone } from '../../actors/Phone'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Callout, Mark, Pill } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { PHONE_SCALE, S2 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { LogScreen, type LogRow } from './parts'

const ID = 's2-log'
const F1 = S2.first
const L = S2.last

// CRUD: четыре стандартных действия с данными
const CRUD = [
  { letter: 'C', word: 'создать' },
  { letter: 'R', word: 'прочитать' },
  { letter: 'U', word: 'изменить' },
  { letter: 'D', word: 'удалить' },
]
// последние 30% журнала: что случилось и к какой области это относится
const CARDS = [
  { title: 'Пустой подход сохранён', area: 'необычный случай' },
  { title: 'Нет связи — подход исчез', area: 'обработка ошибок' },
  { title: 'Олег видит журнал Анны', area: 'безопасность: права доступа' },
  { title: 'Подход записан дважды', area: 'объём за неделю неверен' },
]
// остальные области последних 30%
const MORE = ['скорость', 'чужие сервисы', 'эксплуатация', 'поддерживаемость']
const CHIP = 20
const chipW = (t: string) => Math.round(t.length * CHIP * 0.56 + 28)

// Сцена 2: журнал тренировок Анны. Первые 70% — то, чего в интернете много (типовые экраны, вход,
// CRUD, вёрстка). Последние 30% — у каждого свои: пустой ввод, нет связи, чужой журнал, двойное нажатие;
// плюс скорость, чужие сервисы, эксплуатация и поддерживаемость.
export function S2Log() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // журнал Анны: подходы, ввод, объём; третья строка — пустой подход, потерянный, затем двойной
  const typing = frame >= b(0) + 50 && frame < b(0) + 92
  const input = typing ? '40×10' : frame >= b(4) + 8 && frame < b(4) + 32 ? '90×5' : frame >= b(5) - 10 && frame < b(5) + 12 ? '80×5' : ''
  const offline = appear(frame, b(4) + 6, 8) * (1 - appear(frame, b(4) + 90, 10))
  const dupAt = [b(5) + 20, b(5) + 30]
  const third: LogRow = frame < b(4) ? { text: '— × —', at: b(3) + 112, color: theme.risk, out: b(4) - 12 } : frame < b(5) ? { text: 'жим 90×5', at: b(4) + 36, color: theme.alt, out: b(4) + 58 } : { text: 'тяга 80×5', at: dupAt[0] }
  const rows: LogRow[] = [{ text: 'присед 60×8', at: b(0) + 16 }, { text: 'жим 40×10', at: b(0) + 98 }, third, { text: 'тяга 80×5', at: dupAt[1], color: theme.risk }]
  const totalIn = useAppear(b(0) + 40)
  const wrong = frame >= b(5) + 40
  const total = wrong ? 1680 : frame >= b(0) + 100 ? 880 : 480

  // первые 70%
  const first = useAppear(b(1) + 10)
  const chipAt = [b(1) + 60, b(1) + 105, b(2) + 128]
  const plenty = useAppear(b(1) + 134)
  const crud = useAppear(b(2) + 4)
  const crudAt = [b(2) + 19, b(2) + 39, b(2) + 62, b(2) + 84]

  // последние 30%
  const head = useAppear(b(3) + 30)
  const cardAt = [b(3) + 124, b(4) + 70, b(4) + 126, b(5) + 70]
  const moreAt = [b(6) + 17, b(6) + 64, b(6) + 118, b(6) + 150]
  const sayOleg = appear(frame, b(4) + 100) * (1 - appear(frame, b(5) + 20, 10))
  const oleg = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(4) + 96, ['point', 'happy']],
    [b(5) + 40, ['stand', 'neutral']],
  ])
  const anna = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 50, ['point', 'neutral']],
    [b(0) + 104, ['cheer', 'happy']],
    [b(1) + 30, ['stand', 'happy']],
    [b(3) + 96, ['point', 'neutral']],
    [b(3) + 120, ['surprised', 'worried']],
    [b(4) + 20, ['point', 'neutral']],
    [b(4) + 62, ['surprised', 'worried']],
    [b(4) + 110, ['think', 'worried']],
    [b(5) + 10, ['point', 'neutral']],
    [b(5) + 44, ['surprised', 'worried']],
    [b(6) + 20, ['think', 'worried']],
  ])

  // плашки остальных областей: два ряда слева направо
  const more = MORE.map((t, i) => {
    const row = i < 2 ? 0 : 1
    const before = MORE.slice(row * 2, i).reduce((s, x) => s + chipW(x) + 12, 0)
    return { t, x: L.x + before + chipW(t) / 2, y: S2.chipY[row], at: moreAt[i] }
  })

  return (
    <KitScene chip="2 / 6 · Журнал тренировок: 70% и 30%" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* журнал Анны */}
      <Phone x={S2.phone.x} y={S2.phone.y} scale={PHONE_SCALE} enterAt={b(0) + 4}>
        <LogScreen input={input} taps={[b(0) + 92, b(3) + 106, b(4) + 30, dupAt[0] - 6, dupAt[1] - 6]} offline={offline} rows={rows} />
      </Phone>
      <g opacity={offline}>
        <Pill x={S2.phone.x} y={100} text="нет сети" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>
      <g opacity={totalIn}>
        <Pill x={S2.phone.x} y={484} text={`объём за неделю: ${total} кг`} color={wrong ? theme.risk : theme.ok} fill={wrong ? theme.riskTint : theme.okTint} size={20} compact />
      </g>
      <g opacity={appear(frame, b(5) + 56)}>
        <Label x={S2.phone.x} y={532} size={20} color={theme.soft} weight={600}>
          на деле: 1280 кг
        </Label>
      </g>
      <Client x={S2.anna.x} y={S2.anna.y} scale={0.6} color={theme.accent} label="Анна" enterAt={b(0) + 8} pose={anna[0]} mood={anna[1]} />

      {/* первые 70% */}
      <g opacity={first}>
        <Card x={F1.x} y={F1.y} w={F1.w} h={F1.h} stroke={theme.accent}>
          <Label x={F1.x + 24} y={F1.y + 38} anchor="start" size={24} color={theme.accent} weight={700}>
            Первые 70%
          </Label>
          <g opacity={plenty}>
            <Label x={F1.x + F1.w - 20} y={F1.y + 37} anchor="end" size={18} color={theme.soft} weight={600}>
              этого в интернете полно
            </Label>
          </g>
          {['типовые экраны', 'вход по паролю'].map((t, i) => (
            <g key={t} opacity={appear(frame, chipAt[i])}>
              <Pill x={F1.x + 24 + chipW(t) / 2 + i * (chipW('типовые экраны') + 12)} y={F1.y + 76} text={t} color={theme.accent} size={CHIP} compact />
            </g>
          ))}
          <g opacity={appear(frame, chipAt[2])}>
            <Pill x={F1.x + 24 + chipW('вёрстка по описанию') / 2} y={F1.y + 118} text="вёрстка по описанию" color={theme.accent} size={CHIP} compact />
          </g>
          <g opacity={crud}>
            <Label x={F1.x + 24} y={F1.y + 160} anchor="start" size={20} weight={700}>
              CRUD — четыре действия с данными:
            </Label>
          </g>
          {CRUD.map((c, i) => {
            const x = F1.x + 24 + i * 110
            const y = F1.y + 172
            return (
              <g key={c.letter} opacity={appear(frame, crudAt[i], 8)}>
                <rect x={x} y={y} width={102} height={54} rx={10} fill={theme.accentTint} stroke={theme.accent} strokeWidth={2} />
                <text x={x + 51} y={y + 22} textAnchor="middle" fill={theme.accent} style={{ font: `800 20px ${theme.mono}` }}>
                  {c.letter}
                </text>
                <Label x={x + 51} y={y + 45} size={18} weight={600}>
                  {c.word}
                </Label>
              </g>
            )
          })}
        </Card>
      </g>

      {/* последние 30% */}
      <g opacity={head}>
        <Label x={L.x} y={120} anchor="start" size={22} color={theme.risk} weight={700}>
          Последние 30% — у каждого свои
        </Label>
      </g>
      {CARDS.map((c, i) => {
        const y = S2.card.y + i * (S2.card.h + S2.card.gap)
        const a = appear(frame, cardAt[i])
        return (
          <g key={c.title} opacity={a} transform={`translate(${(1 - a) * 30} 0)`}>
            <Card x={L.x} y={y} w={L.w} h={S2.card.h} stroke={theme.risk}>
              <Mark x={L.x + 30} y={y + S2.card.h / 2} ok={false} />
              <Label x={L.x + 58} y={y + 31} anchor="start" size={22} weight={700}>
                {c.title}
              </Label>
              <Label x={L.x + 58} y={y + 57} anchor="start" size={20} color={theme.soft} weight={500}>
                {c.area}
              </Label>
            </Card>
          </g>
        )
      })}
      {more.map((m) => (
        <g key={m.t} opacity={appear(frame, m.at)}>
          <Pill x={m.x} y={m.y} text={m.t} color={theme.risk} size={CHIP} compact />
        </g>
      ))}

      {/* Олег открыл чужой журнал */}
      {frame >= b(4) + 70 && <Client x={S2.oleg.x} y={S2.oleg.y} scale={0.6} color={theme.alt} label="Олег" enterAt={b(4) + 70} pose={oleg[0]} mood={oleg[1]} />}
      <g opacity={sayOleg}>
        <Callout x={570} y={368} tx={S2.oleg.x - 14} ty={S2.oleg.y - 50} text="Это журнал Анны?" color={theme.risk} />
      </g>
    </KitScene>
  )
}
