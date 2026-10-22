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
import { COACH_FEED, FEED_HEAD, FEED_ROW, miniTop, PILES, pileSlot, REVIEWS, reviewTop, S2 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { MiniCard, ReviewRow, SetScreen } from './parts'

const ID = 's2-pain'
const P = S2.panel
const FD = S2.feed

// Сцена 2 (что строим сегодня): отзывы на эталоны с низкой оценкой — слово в слово; похожие жалобы —
// в одну стопку; самая высокая — «тренер не видит»; Марина и Дима подтверждают боль; маленький срез:
// Анна сохранила подход — Марина сразу видит его у себя.
export function S2Pain() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // отзывы: места строк и оценки → слова людей
  const panel = useAppear(b(0) + 4)
  const rowAt = REVIEWS.map((_, i) => b(0) + 24 + i * 10)
  const low = useAppear(b(0) + 96)
  const need = appear(frame, b(1) + 10, 10)
  const textAt = REVIEWS.map((_, i) => b(1) + 16 + i * 22)
  // место стопок — пунктиром, пока жалобы не разложены
  const pilesSlot = appear(frame, b(0) + 30, 12) * (1 - appear(frame, b(2), 10))

  // стопки: заголовки, перелёт карточек, счёт, самая высокая
  const headAt = PILES.map((_, i) => b(2) + 6 + i * 8)
  const flyAt = REVIEWS.map((_, i) => b(2) + 30 + i * 18)
  const countAt = [b(3) + 20, b(3) + 120, b(3) + 130]
  const top = appear(frame, b(3) + 40, 12)
  const rest = 1 - 0.45 * appear(frame, b(3) + 140, 12)
  const panelOut = 1 - appear(frame, b(4), 12)

  // ваши тренеры подтверждают боль
  const yours = useAppear(b(4) + 8)
  const sayM = useAppear(b(4) + 54)
  const sayD = useAppear(b(5) + 44)
  const shared = useAppear(b(5) + 120)

  // доска 2: срез — Анна сохранила подход, он сразу на экране Марины
  const tapAt = b(6) + 40
  const flyOn = frame >= tapAt + 12 && frame < tapAt + 44
  const fly = useTrack([
    [tapAt + 12, S2.phone.x + 96, S2.phone.y - 40],
    [tapAt + 42, FD.x - 50, FD.y + FEED_HEAD + 2 * FEED_ROW + 22],
  ])
  const flow = appear(frame, tapAt + 8, 20)
  const fresh = appear(frame, tapAt + 44, 10)
  const now = useAppear(tapAt + 60)

  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'worried']],
    [b(4) + 40, ['think', 'worried']],
    [b(5) + 110, ['point', 'neutral']],
  ])
  const dima = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(5) + 30, ['think', 'worried']],
    [b(5) + 110, ['point', 'neutral']],
  ])
  const marina2 = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [tapAt + 46, ['surprised', 'happy']],
    [tapAt + 80, ['cheer', 'happy']],
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
          const done = 1 - 0.55 * appear(frame, flyAt[i] + 4, 10)
          return (
            <g key={r.text} opacity={done}>
              {frame < textAt[i] + 4 && (
                <g opacity={appear(frame, b(0) + 14 + i * 8, 10)}>
                  <Slot x={P.x + 98} y={reviewTop(i) + 6} w={P.w - 122} h={S2.rowH - 12} color={theme.grid} />
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

      {/* стопки: заголовок, место, счёт */}
      {PILES.map((p, i) => {
        const hot = i === 0 ? top : 0
        const dim = i === 0 ? 1 : rest
        return (
          <g key={p.head} opacity={dim}>
            <g opacity={appear(frame, headAt[i], 10)}>
              <Slot x={p.x} y={S2.pileTop} w={p.w} h={S2.pileH} color={hot > 0 ? theme.risk : theme.grid} />
              <Pill x={p.x + p.w / 2} y={S2.headY} w={p.w} text={p.head} color={hot > 0 ? theme.risk : theme.soft} fill={hot > 0 ? theme.riskTint : theme.paper} compact />
            </g>
            <g opacity={appear(frame, countAt[i], 10)}>
              <Pill x={p.x + p.w / 2} y={S2.countY} w={48} text={p.count} color={hot > 0 ? theme.risk : theme.soft} fill={hot > 0 ? theme.riskTint : theme.paper} size={20} compact />
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
        const dim = r.pile === 0 ? 1 : rest
        return (
          <g key={r.short} opacity={dim}>
            <MiniCard x={pos.x} y={pos.y} w={w} h={S2.mini} text={r.short} color={r.pile === 0 && top > 0 ? theme.risk : theme.line} />
          </g>
        )
      })}
      <g opacity={shared}>
        <Pill x={PILES[0].x + PILES[0].w / 2} y={S2.pileTop + 44} text="общая боль" color={theme.risk} fill={theme.white} size={20} compact />
      </g>

      {/* ваши тренеры: та же боль? */}
      <g opacity={yours}>
        <Label x={P.x + P.w / 2} y={P.y + 48} size={24} weight={800}>
          А у ваших тренеров?
        </Label>
      </g>
      {frame >= b(4) + 14 && <Coach x={S2.marina.x} y={S2.marina.y} scale={0.65} label="Марина" color={theme.accent} enterAt={b(4) + 14} pose={marina[0]} mood={marina[1]} />}
      <g opacity={sayM}>
        <Callout x={230} y={300} tx={S2.marina.x + 4} ty={S2.marina.y - 60} text="пишу Анне: как прошло?" color={theme.accent} />
      </g>
      {frame >= b(5) + 4 && <Coach x={S2.dima.x} y={S2.dima.y} scale={0.65} label="Дима" color={theme.alt} enterAt={b(5) + 4} pose={dima[0]} mood={dima[1]} />}
      <g opacity={sayD}>
        <Callout x={470} y={220} tx={S2.dima.x + 4} ty={S2.dima.y - 60} text="узнаю только при встрече" color={theme.alt} />
      </g>

      {/* доска 2: срез — подход Анны сразу виден Марине */}
      <Phone x={S2.phone.x} y={S2.phone.y} scale={PHONE_SCALE} label="Анна" enterAt={b(6) - 16}>
        <SetScreen tapAt={tapAt} />
      </Phone>
      <Arrow x1={S2.phone.x + 104} y1={S2.phone.y} x2={FD.x - 14} y2={S2.phone.y} color={theme.accent} dashed draw={flow} />
      {flyOn && <Packet x={fly.x} y={fly.y} text="подход 3" />}
      <g opacity={appear(frame, b(6) - 16, 12)}>
        <Card x={FD.x} y={FD.y} w={FD.w} h={FD.h} stroke={theme.accent} fill={theme.white}>
          <Label x={FD.x + 24} y={FD.y + 40} anchor="start" size={22} weight={800}>
            Экран Марины · сегодня
          </Label>
          <line x1={FD.x + 20} y1={FD.y + 56} x2={FD.x + FD.w - 20} y2={FD.y + 56} stroke={theme.grid} strokeWidth={2} />
          <Label x={FD.x + 24} y={FD.y + 88} anchor="start" size={20} weight={700} color={theme.ok}>
            Анна · присед
          </Label>
        </Card>
        {COACH_FEED.map((row, i) => {
          const y = FD.y + FEED_HEAD + i * FEED_ROW
          const last = i === COACH_FEED.length - 1
          return (
            <g key={row.text} opacity={last ? fresh : 1}>
              {last && <rect x={FD.x + 12} y={y} width={FD.w - 24} height={FEED_ROW - 8} rx={8} fill={theme.accentTint} />}
              <Mark x={FD.x + 38} y={y + 22} ok r={12} />
              <Label x={FD.x + 62} y={y + 29} anchor="start" size={20} weight={600}>
                {row.text}
              </Label>
            </g>
          )
        })}
        {frame < tapAt + 48 && <Slot x={FD.x + 12} y={FD.y + FEED_HEAD + 2 * FEED_ROW} w={FD.w - 24} h={FEED_ROW - 8} text="новый подход" />}
      </g>
      <g opacity={now}>
        <Pill x={FD.x + FD.w - 80} y={FD.y + FD.h + 28} text="сразу после записи" color={theme.accent} fill={theme.accentTint} size={20} compact />
      </g>
      {frame >= b(6) - 16 && <Coach x={S2.marina2.x} y={S2.marina2.y} scale={0.7} label="Марина" color={theme.accent} enterAt={b(6) - 16} pose={marina2[0]} mood={marina2[1]} />}
    </KitScene>
  )
}
