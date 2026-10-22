import { interpolate, useCurrentFrame } from 'remotion'
import { Actor } from '../../actors/Actor'
import { Coach } from '../../actors/Coach'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { Phone } from '../../actors/Phone'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Callout, Pill, Slot } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { theme } from '../../theme'
import { ANSWER, colX, COLS, JOURNAL, JOURNAL_H, LIST, QA_Y, QUESTION, REMARKS, rowY, S3, screenOf } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { AssignScreen, Clock, EmptyRow, Handset, ListFrame, ProgramsScreen, QuoteRow, RemarkRow } from './parts'

const ID = 's3-like'
const J = S3.journal
const T = S3.task

/** Время на секундомере: «м:сс». */
function clock(sec: number): string {
  const s = Math.floor(sec)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// Сцена 3 (подводный камень): на «Нравится?» Полина вежливо отвечает «Да, удобно!» — чинить нечего.
// Иначе: задача «Назначьте подопечному тренировку на четверг», молчим и не подсказываем (s38), пишем пометки
// с временем (s41), потом один вопрос «Что вы ожидали увидеть?» — и строка замечания, которую можно чинить.
export function S3Like() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()
  const sp = screenOf(S3.hand)

  // доска 1: «Нравится?» — «Да, удобно!»
  const ask = appear(frame, b(0) + 48, 10)
  const swipe = frame >= b(1) && frame < b(1) + 96 ? Math.floor((frame - b(1)) / 24) % 3 : 0
  const polite = appear(frame, b(1) + 100, 10)
  const talkOut = 1 - appear(frame, b(2) + 10, 10)
  const quote = appear(frame, b(1) + 120, 10)
  const what = appear(frame, b(1) + 150, 10)
  const realAt = b(6) + 60
  const quoteOut = 1 - appear(frame, realAt - 4, 8)
  const partAt = [b(6) + 88, b(6) + 114, b(6) + 146]

  // доска 2: задача, телефон Полины, пометки — уже на месте, когда камера едет к ним (b(2) - 6 … b(2) + 24)
  const task = appear(frame, b(2) - 14, 10)
  const hand = appear(frame, b(2) - 14, 10)
  const journal = appear(frame, b(2) - 14, 10)
  const silent = appear(frame, b(2) + 150, 10)
  const hint = appear(frame, b(3) + 130, 10)
  const noteAt = [b(3) + 20, b(3) + 64, b(3) + 120, b(4) + 116]
  const tapTab = b(3) + 48
  const tapBack = b(3) + 104
  const tapMore = b(4) + 18
  const tapDate = b(4) + 52
  const qAt = b(5) + 12
  const aAt = b(5) + 90
  const sec = interpolate(frame, [b(2) + 160, noteAt[0], noteAt[1], noteAt[2], b(4) + 72], [0, 5, 20, 35, 55], CLAMP)

  const onPrograms = frame >= tapTab + 8 && frame < tapBack + 8
  const menu = frame >= tapMore + 8 && frame < tapDate + 8
  const week = appear(frame, tapDate + 8, 8)
  const pick = appear(frame, b(4) + 72, 8)

  const you = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 48, ['point', 'happy']],
    [b(1) + 150, ['think', 'worried']],
    [b(6) + 60, ['stand', 'neutral']],
    [b(6) + 146, ['cheer', 'happy']],
  ])
  const polina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(1), ['think', 'neutral']],
    [b(1) + 100, ['stand', 'happy']],
    [b(6) + 60, ['stand', 'neutral']],
  ])
  const polina2 = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(3) + 5, ['think', 'worried']],
    [tapTab - 6, ['point', 'worried']],
    [tapTab + 30, ['think', 'worried']],
    [tapMore - 6, ['point', 'neutral']],
    [b(4) + 80, ['stand', 'happy']],
    [aAt, ['point', 'happy']],
  ])

  return (
    <KitScene chip="3 / 4 · Подводный камень" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* доска 1: вопрос «Нравится?» и вежливый ответ */}
      <Actor x={S3.you.x} y={S3.you.y} scale={0.8} label="Вы" enterAt={b(0) + 4}>
        <Person color={theme.soft} pose={you[0]} mood={you[1]} />
      </Actor>
      <Coach x={S3.polina.x} y={S3.polina.y} scale={0.8} label="Полина" color={theme.ink} enterAt={b(0) + 12} pose={polina[0]} mood={polina[1]} />
      <Phone x={S3.phone.x} y={S3.phone.y} scale={0.6} enterAt={b(0) + 20}>
        {[0, 1, 2].map((k) => (
          <rect key={k} x={-46} y={-80 + k * 56} width={92} height={44} rx={6} fill={[theme.accentTint, theme.altTint, theme.okTint][(k + swipe) % 3]} stroke={theme.grid} strokeWidth={2} />
        ))}
      </Phone>
      <g opacity={ask * talkOut}>
        <Callout x={250} y={160} tx={S3.you.x + 12} ty={S3.you.y - 66} text="«Нравится?»" color={theme.soft} />
      </g>
      <g opacity={polite * talkOut}>
        <Callout x={470} y={160} tx={S3.polina.x + 8} ty={S3.polina.y - 66} text="«Да, удобно!»" color={theme.ink} />
      </g>

      {/* список замечаний: «удобно» — чинить нечего; потом настоящая строка */}
      <ListFrame cols={[1, 1, 1, 1]} />
      {[1, 2, 3].map((i) => (
        <EmptyRow key={i} i={i} />
      ))}
      {frame < realAt && (
        <g opacity={1 - quote}>
          <EmptyRow i={0} />
        </g>
      )}
      <g opacity={quote * quoteOut}>
        <QuoteRow i={0} who="Полина" text="«Да, удобно!»" />
      </g>
      <g opacity={what * quoteOut}>
        <Pill x={LIST.x + LIST.w - 90} y={rowY(0) + LIST.row / 2} text="что чинить?" color={theme.risk} fill={theme.riskTint} size={18} compact />
      </g>
      <g opacity={appear(frame, realAt, 10)}>
        <RemarkRow i={0} r={REMARKS[0]} stroke={theme.ok} />
      </g>
      {['что делала', 'где застряла', 'чего ждала'].map((t, k) => {
        const col = k + 1
        const cx = colX(col) + COLS[col].w / 2
        const on = appear(frame, partAt[k], 10)
        return (
          <g key={t} opacity={on}>
            <rect x={colX(col) + 12} y={rowY(0) + LIST.row - 12} width={COLS[col].w - 30} height={4} rx={2} fill={theme.ok} />
            <Pill x={cx} y={S3.fixY} text={t} color={theme.ok} fill={theme.okTint} size={18} compact />
          </g>
        )
      })}

      {/* доска 2: задача вместо вопроса */}
      <g opacity={task}>
        <Card x={T.x} y={T.y} w={T.w} h={T.h} stroke={theme.accent} fill={theme.white}>
          <Label x={T.x + 20} y={T.y + 38} anchor="start" size={20} weight={700} color={theme.soft}>
            Задача:
          </Label>
          <Label x={T.x + 108} y={T.y + 38} anchor="start" size={20} weight={800}>
            {typed('«Назначьте подопечному тренировку на четверг»', frame, b(2) + 34, 45)}
          </Label>
        </Card>
      </g>
      <g opacity={silent}>
        <Pill x={S3.silent.x} y={S3.silent.y} text="молчим" color={theme.soft} fill={theme.white} size={18} compact />
      </g>
      <g opacity={hint}>
        <Pill x={S3.hint.x} y={S3.hint.y} text="не подсказываем — глава 6" color={theme.risk} fill={theme.white} size={18} compact />
      </g>
      <Coach x={S3.polina2.x} y={S3.polina2.y} scale={0.8} label="Полина" color={theme.ink} enterAt={b(2) + 12} pose={polina2[0]} mood={polina2[1]} />
      <g opacity={hand}>
        <Handset r={S3.hand}>
          {onPrograms ? <ProgramsScreen s={sp} tapBack={tapBack} /> : <AssignScreen s={sp} menu={menu} week={week} pick={pick} tapMore={tapMore} tapDate={tapDate} tapTab={tapTab} />}
        </Handset>
      </g>

      {/* пометки наблюдателя: время и что видно со стороны, потом вопрос и ответ */}
      <g opacity={journal}>
        <Card x={J.x} y={J.y} w={J.w} h={JOURNAL_H} stroke={theme.alt} fill={theme.white}>
          <Label x={J.x + 20} y={J.y + 36} anchor="start" size={22} weight={800} color={theme.alt}>
            Пометки: где застряла
          </Label>
          <Clock x={J.x + J.w - 104} y={J.y + 29} t={clock(sec)} />
          <line x1={J.x + 12} y1={J.y + J.head} x2={J.x + J.w - 12} y2={J.y + J.head} stroke={theme.grid} strokeWidth={2} />
          <line x1={J.x + 12} y1={J.y + QA_Y.rule} x2={J.x + J.w - 12} y2={J.y + QA_Y.rule} stroke={theme.grid} strokeWidth={2} />
        </Card>
        {JOURNAL.map((n, i) => {
          const y = J.y + J.head + 30 + i * J.row
          const on = appear(frame, noteAt[i], 8)
          return (
            <g key={n.at}>
              <g opacity={1 - on}>
                <Slot x={J.x + 16} y={y - 26} w={J.w - 32} h={36} r={8} />
              </g>
              <g opacity={on}>
                <text x={J.x + 24} y={y} fill={theme.alt} style={{ font: `700 20px ${theme.mono}`, fontVariantLigatures: 'none' }}>
                  {n.at}
                </text>
                <Label x={J.x + 96} y={y} anchor="start" size={20} weight={600}>
                  {typed(n.text, frame, noteAt[i], 40)}
                </Label>
              </g>
            </g>
          )
        })}
        {[
          { at: qAt, tag: 'вопрос', text: QUESTION, y: QA_Y.q, weight: 800 },
          { at: aAt, tag: 'ответ', text: ANSWER, y: QA_Y.a, weight: 600 },
        ].map((r) => {
          const on = appear(frame, r.at, 8)
          return (
            <g key={r.tag}>
              <g opacity={1 - on}>
                <Slot x={J.x + 16} y={J.y + r.y - 26} w={J.w - 32} h={36} r={8} />
              </g>
              <g opacity={on}>
                <Label x={J.x + 24} y={J.y + r.y} anchor="start" size={18} weight={700} color={theme.soft}>
                  {r.tag}
                </Label>
                <Label x={J.x + 104} y={J.y + r.y} anchor="start" size={20} weight={r.weight}>
                  {typed(r.text, frame, r.at, 45)}
                </Label>
              </g>
            </g>
          )
        })}
      </g>
    </KitScene>
  )
}
