import { useCurrentFrame } from 'remotion'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Callout, Mark, Pill, Slot } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { BLANK, DIMA_ROWS, EMPTY_STATES, EMPTY_Y, HAND, LAST30, MARINA_ROWS, PARTS, S3, screenOf } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { EmptyBody, Handset, ListBody, ScreenButton, ScreenHead, TabBar } from './parts'

const ID = 's3-empty'
const L = S3.last

// Сцена 3 (подводный камень): экраны проверяли со списками Марины и Димы, а Ира видит белый лист
// без слов и кнопки и закрывает приложение; пустые списки ИИ часто упускает (последние 30%).
// Исправление примера: у пустого экрана три части — что здесь будет, что сделать и кнопка.
export function S3Empty() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()
  const sm = screenOf(S3.marina)
  const sd = screenOf(S3.dima)
  const si = screenOf(S3.phone)
  const sa = screenOf(S3.phoneA)
  const sb = screenOf(S3.phoneB)

  // белый лист и две пометки к нему
  const blank = appear(frame, 4, 12)
  const tagsOut = 1 - appear(frame, b(2) - 10, 10)
  // экраны со списками Марины и Димы: места в крупном плане, сами экраны — после отъезда камеры
  const lists = 1 - appear(frame, b(4) - 10, 12)
  const slotOut = appear(frame, b(1) + 24, 10)
  const phoneIn = [appear(frame, b(1) + 26, 10), appear(frame, b(1) + 40, 10)]
  const rows = [stepAt(frame, [[0, 0], [b(1) + 44, 1], [b(1) + 56, 2]]), stepAt(frame, [[0, 0], [b(1) + 60, 1], [b(1) + 72, 2]])]
  const okAt = [b(1) + 100, b(1) + 116]
  // Ира открывает «Тренировки»: ни слов, ни кнопки; вопросы; уходит
  const noWords = appear(frame, b(2) + 60, 10)
  const noButton = appear(frame, b(2) + 84, 10)
  const ask1 = appear(frame, b(3) + 8, 8) * (1 - appear(frame, b(3) + 46, 6))
  const ask2 = appear(frame, b(3) + 50, 8)
  const leave = appear(frame, b(3) + 92, 26)
  const dark = appear(frame, b(3) + 106, 12)
  // последние 30%
  const last = appear(frame, b(4) + 6, 12)
  const rowAt = LAST30.map((_, i) => b(4) + 16 + i * 10)
  const listsTag = appear(frame, b(4) + 40, 10)

  // доска 2: исправленные пустые экраны
  const slots = appear(frame, b(5) + 16, 12)
  const partAt = [b(5) + 44, b(5) + 92, b(5) + 140]
  const partsA: [number, number, number] = [appear(frame, partAt[0], 10), appear(frame, partAt[1], 10), appear(frame, partAt[2], 10)]
  const partsB: [number, number, number] = [appear(frame, b(6) + 50, 10), appear(frame, b(6) + 62, 10), appear(frame, b(6) + 74, 10)]
  const glow = appear(frame, b(6) + 30, 12)
  const tap = b(7) + 44
  const next = frame >= tap + 14
  const labelsOut = 1 - appear(frame, tap + 6, 10)
  const nextOk = appear(frame, tap + 50, 10)

  const ira = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(2) + 40, ['think', 'worried']],
    [b(3), ['surprised', 'worried']],
    [b(3) + 50, ['think', 'worried']],
  ])
  const ira2 = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [tap - 14, ['point', 'happy']],
    [tap + 30, ['cheer', 'happy']],
  ])

  // три подписи частей пустого экрана — на высоте своих частей
  const partY = [sa.y + EMPTY_Y.what + 6, sa.y + EMPTY_Y.todo + 6, sa.y + EMPTY_Y.button + EMPTY_Y.buttonH / 2]

  return (
    <KitScene chip="3 / 4 · Подводный камень: пустой экран" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* экраны со списками у Марины и Димы */}
      <g opacity={lists}>
        {[S3.marina, S3.dima].map((p, i) => (
          <g key={i}>
            <g opacity={1 - slotOut}>
              <Slot x={p.x} y={p.y} w={p.w} h={p.h} r={24} text={i === 0 ? 'у Марины' : 'у Димы'} />
            </g>
            <g opacity={phoneIn[i]}>
              <Handset x={p.x} y={p.y} w={p.w} h={p.h}>
                <ListBody s={i === 0 ? sm : sd} title="Тренировки" rows={i === 0 ? MARINA_ROWS : DIMA_ROWS} color={i === 0 ? theme.accent : theme.alt} shown={rows[i]} tab="workouts" />
              </Handset>
              <Pill x={p.x + p.w / 2} y={S3.tagY} text={i === 0 ? 'у Марины' : 'у Димы'} color={i === 0 ? theme.accent : theme.alt} fill={i === 0 ? theme.accentTint : theme.altTint} size={20} compact />
            </g>
            <g opacity={appear(frame, okAt[i], 10)}>
              <Mark x={p.x + p.w - 6} y={p.y + 6} ok r={16} />
            </g>
          </g>
        ))}
      </g>

      {/* последние 30%: пустые списки — среди необычных случаев */}
      <g opacity={last}>
        <Card x={L.x} y={L.y} w={L.w} h={L.h} stroke={theme.risk} fill={theme.white}>
          <Label x={L.x + 26} y={L.y + 44} anchor="start" size={24} weight={800}>
            Последние 30%
          </Label>
          <Label x={L.x + 26} y={L.y + 76} anchor="start" size={20} color={theme.soft} weight={600}>
            что ИИ часто упускает
          </Label>
          <line x1={L.x + 20} y1={L.y + 94} x2={L.x + L.w - 20} y2={L.y + 94} stroke={theme.grid} strokeWidth={2} />
        </Card>
      </g>
      {LAST30.map((t, i) => {
        const y = L.y + 140 + i * 54
        const hit = i === 1
        return (
          <g key={t} opacity={appear(frame, rowAt[i], 8) * last}>
            <circle cx={L.x + 38} cy={y - 7} r={6} fill={hit ? theme.risk : theme.line} />
            <Label x={L.x + 58} y={y} anchor="start" size={22} weight={hit ? 800 : 600} color={hit ? theme.risk : theme.ink}>
              {t}
            </Label>
            {hit && (
              <g opacity={listsTag}>
                <Pill x={L.x + 390} y={y - 7} text="пустые списки" color={theme.risk} fill={theme.riskTint} size={20} compact />
              </g>
            )}
          </g>
        )
      })}

      {/* телефон Иры: белый лист */}
      <g opacity={tagsOut * appear(frame, b(0) + 20, 10)}>
        <Pill x={S3.ira.x} y={250} text="пустой экран" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>
      <g opacity={tagsOut * appear(frame, b(0) + 40, 10)}>
        <Pill x={S3.ira.x} y={300} w={190} text="без подсказки" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>
      <g opacity={blank}>
        <Handset x={S3.phone.x} y={S3.phone.y} dark={dark}>
          <EmptyBody s={si} state={BLANK} missing={[noWords * (1 - dark), noButton * (1 - dark)]} />
        </Handset>
      </g>
      <g opacity={dark}>
        <Label x={si.x + si.w / 2} y={si.y + si.h / 2} size={22} weight={700} color={theme.white}>
          приложение закрыто
        </Label>
      </g>

      {/* Ира: не понимает и уходит */}
      <g opacity={1 - leave} transform={`translate(${-leave * 60} 0)`}>
        <Coach x={S3.ira.x} y={S3.ira.y} scale={0.8} label="Ира" color={theme.ink} enterAt={b(2) + 4} pose={ira[0]} mood={ira[1]} />
        <g opacity={ask1}>
          <Callout x={S3.ira.x} y={200} tx={S3.ira.x + 12} ty={S3.ira.y - 62} text="сломалось?" color={theme.ink} />
        </g>
        <g opacity={ask2}>
          <Callout x={S3.ira.x} y={200} tx={S3.ira.x + 12} ty={S3.ira.y - 62} text="так и задумано?" color={theme.ink} />
        </g>
      </g>

      {/* доска 2: пустой экран с подсказкой — три части */}
      <Handset x={S3.phoneA.x} y={S3.phoneA.y}>
        {next ? (
          <g>
            <ScreenHead s={sa} title="Новая тренировка" />
            {['Кому', 'Упражнения'].map((t, i) => (
              <g key={t}>
                <Label x={sa.x + 18} y={sa.y + 84 + i * 76} anchor="start" size={18} color={theme.soft} weight={600}>
                  {t}
                </Label>
                <rect x={sa.x + 16} y={sa.y + 92 + i * 76} width={sa.w - 32} height={40} rx={8} fill={theme.paper} stroke={theme.line} strokeWidth={2} />
              </g>
            ))}
            <ScreenButton cx={sa.x + sa.w / 2} y={sa.y + EMPTY_Y.button} w={sa.w - 48} text="Сохранить" />
            <TabBar s={sa} active="workouts" />
          </g>
        ) : (
          <g opacity={slots}>
            <EmptyBody s={sa} state={EMPTY_STATES[0]} show={partsA} slots glow={glow} tapAt={tap} />
          </g>
        )}
      </Handset>
      <g opacity={nextOk}>
        <Mark x={S3.phoneA.x + HAND.w - 6} y={S3.phoneA.y + 6} ok r={18} />
        <Pill x={(S3.phoneA.x + HAND.w + S3.phoneB.x) / 2} y={S3.phoneA.y + HAND.h / 2} w={196} text="следующий шаг" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      <g opacity={labelsOut}>
        {PARTS.map((t, i) => (
          <g key={t} opacity={appear(frame, partAt[i] - 4, 10)}>
            <Arrow x1={S3.parts.x - 4} y1={partY[i]} x2={sa.x + sa.w + 6} y2={partY[i]} color={theme.accent} />
            <circle cx={S3.parts.x + 18} cy={partY[i]} r={16} fill={theme.accent} />
            <Label x={S3.parts.x + 18} y={partY[i] + 7} size={20} weight={800} color={theme.white}>
              {String(i + 1)}
            </Label>
            <Label x={S3.parts.x + 44} y={partY[i] + 7} anchor="start" size={20} weight={700}>
              {t}
            </Label>
          </g>
        ))}
      </g>
      <Handset x={S3.phoneB.x} y={S3.phoneB.y}>
        <g opacity={slots}>
          <EmptyBody s={sb} state={EMPTY_STATES[1]} show={partsB} slots />
        </g>
      </Handset>
      <Coach x={S3.ira2.x} y={S3.ira2.y} scale={0.8} label="Ира" color={theme.ink} enterAt={b(6) + 140} pose={ira2[0]} mood={ira2[1]} />
    </KitScene>
  )
}
