import { useCurrentFrame } from 'remotion'
import { Actor } from '../../actors/Actor'
import { Client } from '../../actors/Client'
import { Coach } from '../../actors/Coach'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { usePop } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear, trackAt } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Mark, Pill } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { theme } from '../../theme'
import { ANNA_SAYS, CARD, layerY, MARINA_SAYS, S1, S1_ASK_H, S1_CARD_H, SETS } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Bell, CommentCard, Notice, Slot } from './parts'

const ID = 's1-build'
const C = S1.card
const L = S1.layers
const A = S1.ask

// три слоя функции сверху вниз; собираются снизу вверх (номер — порядок сборки)
const LAYERS = [
  { title: 'Экран', sub: 'поле и кнопка «Отправить»', color: theme.accent, n: 3 },
  { title: 'Правила доступа', sub: 'кто читает, кто пишет', color: theme.alt, n: 2 },
  { title: 'Таблица comments', sub: 'тренировка · автор · текст · время', color: theme.ok, n: 1 },
]
// что решить словами до кода
const ASK = ['Кто видит комментарий?', 'Кому и когда сообщать?', 'О чём сообщать, а о чём нет?']
const SET_W = 170
const NOTE_H = 72

// Сцена 1 (что строим сегодня): Анна пишет комментарий под тренировкой, Марина отвечает там же,
// обеим приходят уведомления. Доска 2: функция целиком — таблица, правила доступа, экран; что решить до кода.
export function S1Build() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // карточка тренировки: подходы отмечены, место для комментариев
  const cardIn = appear(frame, 4, 14)
  const setAt = SETS.map((_, i) => b(0) + 40 + i * 16)
  const comments = appear(frame, b(0) + 92, 12)
  const annaSlot = appear(frame, b(0) + 124, 12)
  // комментарий Анны и отправка
  const c1At = b(1) + 14
  const sent = frame >= b(1) + 66 && frame < b(1) + 82
  const count1 = appear(frame, b(1) + 80, 10)
  // ответ Марины
  const marinaSlot = appear(frame, b(2) + 16, 12)
  const c2At = b(2) + 26
  const count2 = frame >= b(2) + 70
  // уведомления: письмо летит к Анне, потом «тренировка завершена» — к Марине
  const fly1 = trackAt(frame, [
    [b(3) + 8, C.x + 90, C.y + CARD.c2 + 40],
    [b(3) + 36, S1.annaNote.x + 60, S1.annaNote.y + 10],
  ])
  const note1 = usePop(b(3) + 36)
  const done = appear(frame, b(4) + 4, 10)
  const fly2 = trackAt(frame, [
    [b(4) + 16, C.x + C.w - 40, C.y + 40],
    [b(4) + 44, S1.marinaNote.x - 60, S1.marinaNote.y + 10],
  ])
  const note2 = usePop(b(4) + 44)

  // доска 2: слои снизу вверх, затем вопросы
  const layerAt = [b(5) + 116, b(5) + 76, b(5) + 36]
  const askIn = appear(frame, b(6) - 4, 12)
  const askAt = [b(6) + 16, b(6) + 56, b(6) + 96]

  const anna = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 130, ['think', 'neutral']],
    [b(1) + 10, ['point', 'worried']],
    [b(1) + 100, ['stand', 'worried']],
    [b(3) + 40, ['cheer', 'happy']],
    [b(3) + 110, ['stand', 'happy']],
  ])
  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(2) + 24, ['point', 'neutral']],
    [b(2) + 100, ['stand', 'happy']],
    [b(4) + 50, ['cheer', 'happy']],
    [b(4) + 120, ['stand', 'happy']],
  ])
  const you = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(6) + 10, ['think', 'neutral']],
    [b(6) + 130, ['point', 'neutral']],
  ])

  const card = (
    <g opacity={cardIn}>
      <Card x={C.x} y={C.y} w={C.w} h={S1_CARD_H} stroke={theme.accent} fill={theme.white}>
        <Label x={C.x + 24} y={C.y + 42} anchor="start" size={24} weight={800}>
          Анна · понедельник · присед
        </Label>
        {SETS.map((s, i) => {
          const x = C.x + 24 + i * (SET_W + 14)
          return (
            <g key={i}>
              <rect x={x} y={C.y + CARD.sets} width={SET_W} height={CARD.setsH} rx={10} fill={theme.paper} stroke={theme.grid} strokeWidth={2} />
              <Label x={x + 14} y={C.y + CARD.sets + 27} anchor="start" size={20}>
                {s}
              </Label>
              <g opacity={appear(frame, setAt[i], 8)}>
                <Mark x={x + SET_W - 22} y={C.y + CARD.sets + CARD.setsH / 2} ok r={11} />
              </g>
            </g>
          )
        })}
        <line x1={C.x + 20} y1={C.y + CARD.line} x2={C.x + C.w - 20} y2={C.y + CARD.line} stroke={theme.grid} strokeWidth={2} />
      </Card>
    </g>
  )

  return (
    <KitScene chip="1 / 3 · Что строим сегодня" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* доска 1: тренировка Анны */}
      {card}
      <g opacity={done}>
        <Pill x={C.x + C.w - 86} y={C.y + 36} text="завершена" color={theme.ok} fill={theme.okTint} size={18} compact />
      </g>
      <g opacity={comments}>
        <Label x={C.x + 24} y={C.y + CARD.label} anchor="start" size={20} color={theme.soft} weight={700}>
          Комментарии
        </Label>
        <g opacity={count1}>
          <Label x={C.x + 170} y={C.y + CARD.label} anchor="start" size={20} color={theme.soft}>
            {count2 ? '· 2' : '· 1'}
          </Label>
        </g>
        {frame < c1At + 4 && <Slot x={C.x + 24} y={C.y + CARD.c1} w={520} h={CARD.cH} text="комментарий Анны" />}
        {frame < c2At + 4 && <Slot x={C.x + 76} y={C.y + CARD.c2} w={520} h={CARD.cH} text="ответ тренера" />}
        {/* поле и кнопка */}
        <rect x={C.x + 24} y={C.y + CARD.input} width={430} height={CARD.inputH} rx={10} fill={theme.paper} stroke={theme.grid} strokeWidth={2} />
        <Label x={C.x + 40} y={C.y + CARD.input + 31} anchor="start" size={20} color={theme.soft}>
          Написать комментарий…
        </Label>
        <rect x={C.x + 466} y={C.y + CARD.input} width={130} height={CARD.inputH} rx={10} fill={theme.accent} stroke={sent ? theme.ok : theme.accent} strokeWidth={sent ? 5 : 2} />
        <Label x={C.x + 531} y={C.y + CARD.input + 31} size={20} weight={700} color={theme.white}>
          Отправить
        </Label>
      </g>
      {frame >= c1At && (
        <g opacity={appear(frame, c1At, 10)}>
          <CommentCard x={C.x + 24} y={C.y + CARD.c1} w={520} h={CARD.cH} author="Анна" text={typed(ANNA_SAYS, frame, c1At + 10, 30)} fill={theme.accentTint} />
        </g>
      )}
      {frame >= c2At && (
        <g opacity={appear(frame, c2At, 10)}>
          <CommentCard x={C.x + 76} y={C.y + CARD.c2} w={520} h={CARD.cH} author="Марина · тренер" text={typed(MARINA_SAYS, frame, c2At + 8, 30)} />
        </g>
      )}

      {/* уведомления: места заранее пунктиром, потом баннеры */}
      <g opacity={annaSlot * (frame < b(3) + 36 ? 1 : 0)}>
        <Slot x={S1.annaNote.x - S1.annaNote.w / 2} y={S1.annaNote.y - NOTE_H / 2} w={S1.annaNote.w} h={NOTE_H} r={14} text="уведомление" />
      </g>
      <g opacity={marinaSlot * (frame < b(4) + 44 ? 1 : 0)}>
        <Slot x={S1.marinaNote.x - S1.marinaNote.w / 2} y={S1.marinaNote.y - NOTE_H / 2} w={S1.marinaNote.w} h={NOTE_H} r={14} text="уведомление" />
      </g>
      {frame >= b(3) + 8 && frame < b(3) + 38 && <Bell x={fly1.x} y={fly1.y} color={theme.accent} s={1.2} />}
      {frame >= b(3) + 36 && (
        <g transform={`translate(${S1.annaNote.x} ${S1.annaNote.y}) scale(${note1}) translate(${-S1.annaNote.x} ${-S1.annaNote.y})`}>
          <Notice x={S1.annaNote.x} y={S1.annaNote.y} w={S1.annaNote.w} title="Марина ответила" sub="«Тогда в четверг…»" />
        </g>
      )}
      {frame >= b(4) + 16 && frame < b(4) + 46 && <Bell x={fly2.x} y={fly2.y} color={theme.ok} s={1.2} />}
      {frame >= b(4) + 44 && (
        <g transform={`translate(${S1.marinaNote.x} ${S1.marinaNote.y}) scale(${note2}) translate(${-S1.marinaNote.x} ${-S1.marinaNote.y})`}>
          <Notice x={S1.marinaNote.x} y={S1.marinaNote.y} w={S1.marinaNote.w} title="Анна завершила" sub="тренировку · Пн" color={theme.ok} />
        </g>
      )}

      <Client x={S1.anna.x} y={S1.anna.y} scale={0.8} color={theme.accent} label="Анна" enterAt={2} pose={anna[0]} mood={anna[1]} />
      {frame >= b(2) + 4 && <Coach x={S1.marina.x} y={S1.marina.y} scale={0.8} label="Марина" enterAt={b(2) + 4} pose={marina[0]} mood={marina[1]} />}

      {/* доска 2: функция целиком — слои снизу вверх */}
      {LAYERS.map((l, i) => {
        const y = layerY(i)
        const at = layerAt[i]
        const on = appear(frame, at, 12)
        return (
          <g key={l.title}>
            {frame < at + 6 && <Slot x={L.x} y={y} w={L.w} h={L.h} />}
            <g opacity={on}>
              <Card x={L.x} y={y} w={L.w} h={L.h} stroke={l.color} fill={theme.white}>
                <rect x={L.x + 3} y={y + 10} width={7} height={L.h - 20} rx={3} fill={l.color} />
                <circle cx={L.x + 46} cy={y + L.h / 2} r={20} fill={l.color} />
                <Label x={L.x + 46} y={y + L.h / 2 + 8} size={22} weight={800} color={theme.white}>
                  {String(l.n)}
                </Label>
                <Label x={L.x + 84} y={y + 40} anchor="start" size={24} weight={800}>
                  {l.title}
                </Label>
                <Label x={L.x + 84} y={y + 74} anchor="start" size={20} color={theme.soft}>
                  {typed(l.sub, frame, at + 10, 40)}
                </Label>
              </Card>
            </g>
          </g>
        )
      })}

      {/* доска 2: что решить словами до кода */}
      {frame < b(6) + 8 && <Slot x={A.x} y={A.y} w={A.w} h={S1_ASK_H} text="решения до кода" />}
      <g opacity={askIn}>
        <Card x={A.x} y={A.y} w={A.w} h={S1_ASK_H} stroke={theme.alt} fill={theme.white}>
          <Label x={A.x + 24} y={A.y + 44} anchor="start" size={24} weight={800} color={theme.alt}>
            Решите до кода
          </Label>
          <line x1={A.x + 20} y1={A.y + 62} x2={A.x + A.w - 20} y2={A.y + 62} stroke={theme.grid} strokeWidth={2} />
        </Card>
      </g>
      {ASK.map((q, i) => (
        <g key={q} opacity={appear(frame, askAt[i], 10)}>
          <Label x={A.x + 24} y={A.y + A.head + i * A.row + 40} anchor="start" size={22} weight={600}>
            {q}
          </Label>
          <Pill x={A.x + A.w - 44} y={A.y + A.head + i * A.row + 32} text="?" color={theme.alt} fill={theme.altTint} size={20} compact />
        </g>
      ))}
      <Actor x={S1.you.x} y={S1.you.y} scale={0.65} label="Вы" enterAt={b(6) - 4}>
        <Person color={theme.soft} pose={you[0]} mood={you[1]} />
      </Actor>
    </KitScene>
  )
}
