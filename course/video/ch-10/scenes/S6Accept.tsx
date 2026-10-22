import { interpolate, useCurrentFrame } from 'remotion'
import { Coach } from '../../actors/Coach'
import { type Mood, type Pose } from '../../actors/Person'
import { Phone } from '../../actors/Phone'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Mark, PhoneScreen, Pill } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { AgentChat } from '../../kit/screens/AgentChat'
import { BAR, chatHeight, type ChatMessage } from '../../kit/screens/layout'
import { Mono, Window } from '../../kit/screens/Window'
import { theme } from '../../theme'
import { PHONE_FONT, PHONE_SCALE, S6, S6_CHECK_H } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'

const ID = 's6-accept'
const PR = S6.pr
const CK = S6.check

const FILES = ['src/export.ts', 'src/export.test.ts', 'tests/auth.test.ts']
const CHECKS = ['lint', 'типы', 'тесты']
const STEPS = ['1 · описание', '2 · список файлов', '3 · проверки', '4 · руками']
// полосы разделов пул-реквеста (координаты окна): что сделано, файлы, проверки
const BANDS = [
  { y: 52, h: 86 },
  { y: 146, h: 144 },
  { y: 298, h: 122 },
]
const ASK: ChatMessage[] = [
  { from: 'me', text: 'Зачем ты менял тест входа?' },
  { from: 'agent', text: 'Он падал, и я ослабил проверку.' },
  { from: 'me', text: 'Верни тест как был. Пока не принимаю.' },
]
const CHAT_H = chatHeight(ASK, S6.chat.w)

// Сцена 6: приёмка пул-реквеста без чтения кода — описание, список файлов (тронут тест входа), проверки
// (зелёные, но тест ослаблен), руками на телефонах. Непонятно — спросить агента; не убедил — не принимать.
export function S6Accept() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: окно пул-реквеста и чек-лист
  const prAt = b(0) + 10
  const secAt = [b(0) + 30, b(0) + 50, b(0) + 70]
  const check = appear(frame, b(0) + 90)
  const markAt = [b(1) + 40, b(1) + 126, b(2) + 40, b(3) + 150]
  const band = frame < b(1) + 6 ? -1 : frame < b(1) + 90 ? 0 : frame < b(2) ? 1 : 2
  const alien = appear(frame, b(1) + 108)
  const green = appear(frame, b(2) + 10)
  const weak = appear(frame, b(2) + 30)

  // доска 2: руками на двух телефонах и вопрос агенту
  const tap1 = b(3) + 36
  const tap2 = b(3) + 96
  const own = appear(frame, b(3) + 70)
  const empty = appear(frame, tap2 + 16)
  const emptyOk = appear(frame, b(3) + 126)
  const slot = interpolate(frame, [b(4), b(4) + 10], [1, 0], CLAMP)
  const reject = appear(frame, b(4) + 100)
  const rule = appear(frame, b(4) + 140)

  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 60, ['think', 'neutral']],
    [b(1) + 40, ['stand', 'happy']],
    [b(1) + 110, ['surprised', 'worried']],
    [b(2) + 10, ['think', 'neutral']],
    [b(2) + 30, ['think', 'worried']],
    [b(2) + 150, ['stand', 'neutral']],
  ])

  return (
    <KitScene chip="6 / 7 · Приёмка пул-реквеста" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* доска 1: пул-реквест от агента */}
      {frame >= prAt && (
        <Window
          x={PR.x}
          y={PR.y}
          w={PR.w}
          h={PR.h}
          at={prAt}
          bar={
            <text x={20} y={BAR / 2 + 7} fill={theme.ink} style={{ font: `700 20px ${theme.font}` }}>
              Пул-реквест № 14 · Экспорт тренировок в CSV
            </text>
          }
        >
          {BANDS.map((s, i) => (
            <rect key={i} x={10} y={s.y} width={PR.w - 20} height={s.h} rx={10} fill={band === i ? theme.accentTint : 'none'} stroke={band === i ? theme.accent : 'none'} strokeWidth={2.5} />
          ))}
          {/* 1 · что сделано */}
          <g opacity={appear(frame, secAt[0])}>
            <Badge x={34} y={BANDS[0].y + 28} n={1} />
            <text x={60} y={BANDS[0].y + 34} fill={theme.soft} style={{ font: `600 18px ${theme.font}` }}>
              Что сделано
            </text>
            <text x={60} y={BANDS[0].y + 68} fill={theme.ink} style={{ font: `500 20px ${theme.font}` }}>
              Выгрузка тренировок в CSV, только свои данные.
            </text>
          </g>
          {/* 2 · изменённые файлы */}
          <g opacity={appear(frame, secAt[1])}>
            <Badge x={34} y={BANDS[1].y + 28} n={2} />
            <text x={60} y={BANDS[1].y + 34} fill={theme.soft} style={{ font: `600 18px ${theme.font}` }}>
              Изменённые файлы
            </text>
            {FILES.map((f, i) => {
              const bad = i === 2 && alien > 0
              return (
                <g key={f}>
                  {bad && <rect x={52} y={BANDS[1].y + 50 + i * 30} width={250} height={28} rx={6} fill={theme.riskTint} />}
                  <Mono x={60} y={BANDS[1].y + 71 + i * 30} fill={bad ? theme.risk : theme.ink}>
                    {f}
                  </Mono>
                </g>
              )
            })}
            <g opacity={alien}>
              <Pill x={430} y={BANDS[1].y + 124} w={170} text="не просили!" color={theme.risk} fill={theme.riskTint} size={20} compact />
            </g>
          </g>
          {/* 3 · проверки */}
          <g opacity={appear(frame, secAt[2])}>
            <Badge x={34} y={BANDS[2].y + 28} n={3} />
            <text x={60} y={BANDS[2].y + 34} fill={theme.soft} style={{ font: `600 18px ${theme.font}` }}>
              Проверки
            </text>
            {CHECKS.map((c, i) => (
              <Pill key={c} x={110 + i * 124} y={BANDS[2].y + 78} w={110} text={green > 0 ? `${c} ✓` : `${c} …`} color={green > 0 ? theme.ok : theme.soft} fill={green > 0 ? theme.okTint : theme.paper} size={19} compact />
            ))}
            <g opacity={weak}>
              <Pill x={560} y={BANDS[2].y + 78} w={250} text="тест входа ослаблен" color={theme.risk} fill={theme.riskTint} size={19} compact />
            </g>
          </g>
        </Window>
      )}

      {/* чек-лист приёмки */}
      <g opacity={check}>
        <Card x={CK.x} y={CK.y} w={CK.w} h={S6_CHECK_H} stroke={theme.accent} fill={theme.white}>
          <Label x={CK.x + 24} y={CK.y + 42} anchor="start" size={24} weight={700} color={theme.accent}>
            Приёмка
          </Label>
          {STEPS.map((t, i) => {
            const cy = CK.y + 64 + i * CK.row + CK.row / 2
            return (
              <g key={t} opacity={appear(frame, b(0) + 100 + i * 8, 8)}>
                <line x1={CK.x + 18} y1={cy - CK.row / 2} x2={CK.x + CK.w - 18} y2={cy - CK.row / 2} stroke={theme.grid} strokeWidth={2} />
                <Label x={CK.x + 24} y={cy + 7} anchor="start" size={22} weight={600}>
                  {t}
                </Label>
                <circle cx={CK.x + CK.w - 38} cy={cy} r={15} fill="none" stroke={theme.grid} strokeWidth={2} strokeDasharray="4 4" />
                <g opacity={appear(frame, markAt[i], 8)}>
                  <Mark x={CK.x + CK.w - 38} y={cy} ok={i === 0 || i === 3} r={15} />
                </g>
              </g>
            )
          })}
        </Card>
      </g>
      <Coach x={S6.marina.x} y={S6.marina.y} scale={0.8} label="Марина" enterAt={6} pose={marina[0]} mood={marina[1]} />

      {/* доска 2: руками — у Анны и на пустом списке */}
      <g opacity={appear(frame, b(3) - 20)}>
        <Pill x={S6.phone1.x + 150} y={100} w={190} text="4 · руками" color={theme.accent} fill={theme.accentTint} size={22} />
      </g>
      <Phone x={S6.phone1.x} y={S6.phone1.y} scale={PHONE_SCALE} enterAt={b(3) - 16}>
        <PhoneScreen tapAt={tap1} listAt={tap1 + 12} list={['Присед 3×10', 'Жим 3×8', 'Тяга 3×5']} label="Скачать CSV" />
      </Phone>
      <g opacity={own}>
        <Pill x={S6.phone1.x} y={505} w={210} text="Анна: только своё" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      <Phone x={S6.phone2.x} y={S6.phone2.y} scale={PHONE_SCALE} enterAt={b(3) - 8}>
        <PhoneScreen tapAt={tap2} listAt={tap2 + 12} list={[]} label="Скачать CSV">
          <g opacity={empty}>
            <rect x={-50} y={-48} width={100} height={70} rx={8} fill={theme.codeBg} />
            <text y={-20} textAnchor="middle" fill={theme.soft} style={{ font: `600 ${PHONE_FONT}px ${theme.font}` }}>
              Тренировок
            </text>
            <text y={-2} textAnchor="middle" fill={theme.soft} style={{ font: `600 ${PHONE_FONT}px ${theme.font}` }}>
              пока нет
            </text>
          </g>
        </PhoneScreen>
      </Phone>
      <g opacity={emptyOk}>
        <Pill x={S6.phone2.x + 10} y={505} w={240} text="пусто — файл цел" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>

      {/* вопрос агенту: место заранее, потом чат */}
      <g opacity={appear(frame, b(3) + 10) * slot}>
        <rect x={S6.chat.x} y={S6.chat.y} width={S6.chat.w} height={CHAT_H} rx={12} fill="none" stroke={theme.grid} strokeWidth={3} strokeDasharray="10 8" />
        <Label x={S6.chat.x + S6.chat.w / 2} y={S6.chat.y + CHAT_H / 2 + 8} size={24} weight={700} color={theme.line}>
          непонятно — спросить агента
        </Label>
      </g>
      {frame >= b(4) && <AgentChat x={S6.chat.x} y={S6.chat.y} w={S6.chat.w} at={b(4)} messages={ASK} />}
      <g opacity={reject}>
        <Pill x={S6.chat.x + S6.chat.w / 2} y={S6.chat.y + CHAT_H + 40} w={260} text="не принято" color={theme.risk} fill={theme.riskTint} size={22} />
      </g>
      <g opacity={rule}>
        <Pill x={S6.chat.x + S6.chat.w / 2} y={S6.chat.y + CHAT_H + 100} w={460} text="в правила проекта: тесты не трогать" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
    </KitScene>
  )
}

/** Номер шага приёмки в кружке (координаты окна). */
function Badge({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={15} fill={theme.paper} stroke={theme.accent} strokeWidth={3} />
      <text x={x} y={y + 7} textAnchor="middle" fill={theme.accent} style={{ font: `700 19px ${theme.font}` }}>
        {n}
      </text>
    </g>
  )
}
