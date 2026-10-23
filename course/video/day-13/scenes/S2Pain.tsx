import { useCurrentFrame } from 'remotion'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { Packet } from '../../actors/Packet'
import { Phone } from '../../actors/Phone'
import { useAppear, useTrack } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear, trackAt } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Callout, Mark, Pill, Slot } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { PHONE_SCALE } from '../../kit/screens/layout'
import { theme } from '../../theme'
import { COACH_FEED, FEED_HEAD, FEED_ROW, miniTop, nextPile, PILES, pileSlot, REVIEWS, reviewTop, S2, SLICE } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { MiniCard, ReviewRow, SetScreen } from './parts'

const ID = 's2-pain'
const P = S2.panel
const FD = S2.feed

// Сцена 2 (что строим сегодня): отзывы на эталоны с низкой оценкой — слово в слово; похожие жалобы —
// в одну стопку; самая высокая — «тренер не видит» — у вас уже закрыта, следующая — «поправка поздно»;
// Марина и Дима подтверждают боль; срез: Марина на тренировке меняет вес следующего подхода — Анна сразу видит.
export function S2Pain() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // отзывы: места строк и оценки → слова людей
  const panel = useAppear(b(0) + 4)
  const rowAt = REVIEWS.map((_, i) => b(0) + 24 + i * 10)
  const low = useAppear(b(0) + 96)
  const need = appear(frame, b(1) + 10, 10)
  const textAt = REVIEWS.map((_, i) => b(1) + 14 + i * 18)
  // место стопок — пунктиром, пока жалобы не разложены
  const pilesSlot = appear(frame, b(0) + 30, 12) * (1 - appear(frame, b(2), 10))

  // стопки: заголовки, перелёт карточек, счёт; самая высокая — уже есть, следующая — наша
  const headAt = PILES.map((_, i) => b(2) + 6 + i * 8)
  const flyAt = REVIEWS.map((_, i) => b(2) + 28 + i * 16)
  const countAt = [b(3) + 20, b(4) + 64, b(4) + 72]
  const done = appear(frame, b(3) + 110, 12)
  const NEXT = nextPile()
  const hot = appear(frame, b(4) + 70, 12)
  const rest = 1 - 0.45 * appear(frame, b(4) + 82, 12)
  const panelOut = 1 - appear(frame, b(5), 12)

  // ваши тренеры подтверждают боль
  const yours = useAppear(b(5) + 8)
  const sayM = useAppear(b(5) + 50)
  const sayD = useAppear(b(6) + 36)
  const shared = useAppear(b(6) + 96)

  // доска 2: срез — Марина меняет вес следующего подхода, Анна сразу видит его на телефоне
  const boardIn = b(7) - 16
  const say2 = useAppear(b(7) + 30)
  const focus = appear(frame, b(7) + 48, 8)
  const editAt = b(7) + 60
  const sendAt = b(7) + 72
  const ripple = frame >= sendAt && frame < sendAt + 18 ? (frame - sendAt) / 18 : 0
  const flyOn = frame >= sendAt + 6 && frame < sendAt + 36
  const nextY = FD.y + FEED_HEAD + COACH_FEED.length * FEED_ROW
  const fly = useTrack([
    [sendAt + 6, FD.x - 50, nextY + 20],
    [sendAt + 34, S2.phone.x + 96, S2.phone.y - 30],
  ])
  const flow = appear(frame, sendAt + 4, 20)
  const changeAt = sendAt + 34
  const now = useAppear(changeAt + 14)

  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'worried']],
    [b(5) + 40, ['think', 'worried']],
    [b(6) + 90, ['point', 'neutral']],
  ])
  const dima = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(6) + 26, ['think', 'worried']],
    [b(6) + 90, ['point', 'neutral']],
  ])
  const marina2 = stepAt<[Pose, Mood]>(frame, [
    [0, ['think', 'neutral']],
    [b(7) + 30, ['point', 'happy']],
    [changeAt + 6, ['cheer', 'happy']],
  ])

  return (
    <KitScene chip="2 / 4 · От жалоб к боли" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* отзывы на эталоны с низкой оценкой */}
      <g opacity={panel * panelOut}>
        <Card x={P.x} y={P.y} w={P.w} h={P.h} stroke={theme.line} fill={theme.white}>
          <Label x={P.x + 24} y={P.y + 42} anchor="start" size={22} weight={800}>
            Отзывы на эталоны
          </Label>
          <line x1={P.x + 20} y1={P.y + 58} x2={P.x + P.w - 20} y2={P.y + 58} stroke={theme.grid} strokeWidth={2} />
        </Card>
        <g opacity={low * (1 - need)}>
          <Pill x={P.x + P.w - 104} y={P.y + 34} text="низкие оценки" color={theme.risk} fill={theme.riskTint} compact />
        </g>
        <g opacity={need}>
          <Pill x={P.x + P.w - 110} y={P.y + 34} text="чего не хватает?" color={theme.alt} fill={theme.altTint} compact />
        </g>
        {REVIEWS.map((r, i) => {
          const gone = 1 - 0.55 * appear(frame, flyAt[i] + 4, 10)
          return (
            <g key={r.text} opacity={gone}>
              {frame < textAt[i] + 4 && (
                <g opacity={appear(frame, b(0) + 14 + i * 8, 10)}>
                  <Slot x={P.x + 98} y={reviewTop(i) + 5} w={P.w - 122} h={S2.rowH - 10} color={theme.grid} />
                </g>
              )}
              <ReviewRow x={P.x + 16} y={reviewTop(i)} h={S2.rowH} rating={r.rating} text={r.text} at={rowAt[i]} textAt={textAt[i]} />
            </g>
          )
        })}
      </g>

      {/* место стопок — пунктиром */}
      <g opacity={pilesSlot}>
        <Slot x={PILES[0].x - 10} y={P.y + 8} w={PILES[2].x + PILES[2].w - PILES[0].x + 20} h={P.h - 16} text="стопки похожих жалоб" />
      </g>

      {/* стопки: заголовок, место, счёт; первая — «у вас уже есть», следующая — красным */}
      {PILES.map((p, i) => {
        const color = i === 0 && done > 0 ? theme.ok : i === NEXT && hot > 0 ? theme.risk : theme.soft
        const fill = i === 0 && done > 0 ? theme.okTint : i === NEXT && hot > 0 ? theme.riskTint : theme.paper
        const dim = i === 0 || i === NEXT ? 1 : rest
        return (
          <g key={p.head} opacity={dim}>
            <g opacity={appear(frame, headAt[i], 10)}>
              <Slot x={p.x} y={S2.pileTop} w={p.w} h={S2.pileH} color={color === theme.soft ? theme.grid : color} />
              <Pill x={p.x + p.w / 2} y={S2.headY} w={p.w} text={p.head} color={color} fill={fill} compact />
            </g>
            <g opacity={appear(frame, countAt[i], 10)}>
              <Pill x={p.x + p.w / 2} y={S2.countY} w={48} text={p.count} color={color} fill={fill} size={20} compact />
            </g>
          </g>
        )
      })}
      {REVIEWS.map((r, i) => {
        if (frame < flyAt[i]) return null
        const p = PILES[r.pile]
        const w = p.w - 14
        const to = { x: p.x + 7, y: miniTop(pileSlot(i)) }
        const pos = trackAt(frame, [
          [flyAt[i], P.x + 110, reviewTop(i)],
          [flyAt[i] + 26, to.x, to.y],
        ])
        const dim = r.pile === 0 || r.pile === NEXT ? 1 : rest
        const color = r.pile === 0 && done > 0 ? theme.ok : r.pile === NEXT && hot > 0 ? theme.risk : theme.line
        return (
          <g key={r.short} opacity={dim}>
            <MiniCard x={pos.x} y={pos.y} w={w} h={S2.mini} text={r.short} color={color} />
          </g>
        )
      })}
      <g opacity={done}>
        <Pill x={PILES[0].x + PILES[0].w / 2} y={S2.pileTop + 44} text="у вас уже есть ✓" color={theme.ok} fill={theme.white} size={20} compact />
      </g>
      <g opacity={shared}>
        <Pill x={PILES[NEXT].x + PILES[NEXT].w / 2} y={S2.pileTop + 44} text="общая боль" color={theme.risk} fill={theme.white} size={20} compact />
      </g>

      {/* ваши тренеры: та же боль? */}
      <g opacity={yours}>
        <Label x={P.x + P.w / 2} y={P.y + 48} size={24} weight={800}>
          А у ваших тренеров?
        </Label>
      </g>
      {frame >= b(5) + 14 && <Coach x={S2.marina.x} y={S2.marina.y} scale={0.65} label="Марина" color={theme.accent} enterAt={b(5) + 14} pose={marina[0]} mood={marina[1]} />}
      <g opacity={sayM}>
        <Callout x={250} y={300} tx={S2.marina.x + 4} ty={S2.marina.y - 60} text="вижу, когда тренировка кончилась" color={theme.accent} />
      </g>
      {frame >= b(6) + 4 && <Coach x={S2.dima.x} y={S2.dima.y} scale={0.65} label="Дима" color={theme.alt} enterAt={b(6) + 4} pose={dima[0]} mood={dima[1]} />}
      <g opacity={sayD}>
        <Callout x={460} y={210} tx={S2.dima.x + 4} ty={S2.dima.y - 60} text="поправить вес не успеваю" color={theme.alt} />
      </g>

      {/* доска 2: срез — правка веса на тренировке */}
      <Phone x={S2.phone.x} y={S2.phone.y} scale={PHONE_SCALE} label="Анна" enterAt={boardIn}>
        <SetScreen changeAt={changeAt} reps={SLICE.reps} from={SLICE.from} to={SLICE.to} />
      </Phone>
      <Arrow x1={FD.x - 14} y1={S2.phone.y} x2={S2.phone.x + 104} y2={S2.phone.y} color={theme.accent} dashed draw={flow} />
      {flyOn && <Packet x={fly.x} y={fly.y} text={`${SLICE.to} кг`} />}
      <g opacity={appear(frame, boardIn, 12)}>
        <Card x={FD.x} y={FD.y} w={FD.w} h={FD.h} stroke={theme.accent} fill={theme.white}>
          <Label x={FD.x + 24} y={FD.y + 40} anchor="start" size={22} weight={800}>
            Экран Марины · сейчас
          </Label>
          <line x1={FD.x + 20} y1={FD.y + 56} x2={FD.x + FD.w - 20} y2={FD.y + 56} stroke={theme.grid} strokeWidth={2} />
          <Label x={FD.x + 24} y={FD.y + 88} anchor="start" size={20} weight={700} color={theme.ok}>
            Анна тренируется · присед
          </Label>
        </Card>
        {COACH_FEED.map((row, i) => {
          const y = FD.y + FEED_HEAD + i * FEED_ROW
          return (
            <g key={row.text}>
              <Mark x={FD.x + 38} y={y + 22} ok r={12} />
              <Label x={FD.x + 62} y={y + 29} anchor="start" size={20} weight={600}>
                {row.text}
              </Label>
            </g>
          )
        })}
        {/* следующий подход: Марина меняет вес и отправляет */}
        <rect x={FD.x + 12} y={nextY} width={FD.w - 24} height={FEED_ROW - 8} rx={8} fill={theme.accentTint} opacity={focus} />
        <circle cx={FD.x + 38} cy={nextY + 22} r={11} fill="none" stroke={theme.accent} strokeWidth={2.5} />
        <Label x={FD.x + 62} y={nextY + 29} anchor="start" size={20} weight={600}>
          {`подход 3 · ${SLICE.reps} ×`}
        </Label>
        <rect x={FD.x + 238} y={nextY + 4} width={60} height={36} rx={8} fill={theme.white} stroke={focus > 0 ? theme.accent : theme.grid} strokeWidth={2.5} />
        <Label x={FD.x + 268} y={nextY + 29} size={20} weight={800} color={frame >= editAt ? theme.accent : theme.ink}>
          {String(frame >= editAt ? SLICE.to : SLICE.from)}
        </Label>
        <Label x={FD.x + 306} y={nextY + 29} anchor="start" size={20} weight={600}>
          кг
        </Label>
        <rect x={FD.x + 340} y={nextY + 4} width={108} height={36} rx={10} fill={theme.accent} />
        <Label x={FD.x + 394} y={nextY + 29} size={18} weight={700} color={theme.white}>
          отправить
        </Label>
        {ripple > 0 && <circle cx={FD.x + 394} cy={nextY + 22} r={10 + ripple * 30} fill="none" stroke={theme.accent} strokeWidth={3} opacity={1 - ripple} />}
      </g>
      <g opacity={say2}>
        <Callout x={S2.marina2.x + 30} y={176} tx={S2.marina2.x + 4} ty={S2.marina2.y - 74} text={`легко идёт — ставлю ${SLICE.to}`} color={theme.accent} />
      </g>
      <g opacity={now}>
        <Pill x={FD.x + FD.w - 110} y={FD.y + FD.h + 28} text="у Анны — сразу" color={theme.accent} fill={theme.accentTint} size={20} compact />
      </g>
      {frame >= boardIn && <Coach x={S2.marina2.x} y={S2.marina2.y} scale={0.7} label="Марина" color={theme.accent} enterAt={boardIn} pose={marina2[0]} mood={marina2[1]} />}
    </KitScene>
  )
}
