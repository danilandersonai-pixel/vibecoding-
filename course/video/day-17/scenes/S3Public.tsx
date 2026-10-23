import { interpolate, useCurrentFrame } from 'remotion'
import { Client } from '../../actors/Client'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Mark, Pill, Slot } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { theme } from '../../theme'
import { ANNA, LINK_PUBLIC, LINK_SIGNED, mayRead, opens, PHOTOS, photoPath, RULE, S3, shortDate, SIGNED_MIN, storageThumbX, THUMB, TOKEN } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Padlock, PhotoThumb, Someone, Timer, Trash } from './parts'

const ID = 's3-public'
const CH20 = 12 // ширина знака моноширинного шрифта 20 px
const CH22 = 13.2 // и 22 px
const LINK_W = 480
const SHORT = `…/public/photos/${ANNA}/…`
const CHAT = S3.chat
const TEA = S3.tea
const ST = S3.storage
const TB = S3.table
const RU = S3.rule
const SG = S3.signed
const C2 = S3.chat2
// подписанная ссылка — в три строки: путь, файл, токен
const SIGNED_LINES = [LINK_SIGNED.slice(0, LINK_SIGNED.indexOf(`${ANNA}/`)), photoPath(PHOTOS[2]), TOKEN]

const mono = (size: number) => ({ font: `500 ${size}px ${theme.mono}`, whiteSpace: 'pre' as const, fontVariantLigatures: 'none' as const })

// Сцена 3 (подводный камень): хранилище публичное, у фото постоянная ссылка — без входа и пароля;
// Анна отправила её подруге, та — в общий чат; фото открывает любой и через год; Tea (2025).
// Исправление примера: приватное хранилище, правило доступа к папке 17, подписанная ссылка
// на 5 минут, удаление стирает файл и строку.
export function S3Public() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()
  const a = (at: number, len = 10) => appear(frame, at, len)

  // доска 1: публичная постоянная ссылка
  const wide = a(4, 12)
  const pubTag = a(b(0) + 30)
  const underline = a(b(0) + 60, 14)
  const forever = a(b(0) + 100)
  const strangerIn = b(1) + 10
  const toLink = a(b(1) + 20, 14)
  const anyone = a(b(1) + 24)
  const noLogin = a(b(1) + 50)
  const noPass = a(b(1) + 80)
  const sees = a(b(1) + 110)

  // Анна → подруга → общий чат → любой из чата
  const toFriend = a(b(2) + 30, 14)
  const toChat = a(b(2) + 90, 14)
  const chat = a(b(2) + 96)
  const read = a(b(3) + 4)
  const crowdAt = [b(3) + 10, b(3) + 22, b(3) + 34]
  const toCrowd = a(b(3) + 6, 12)
  const crowdSees = a(b(3) + 50)
  const crowdTag = a(b(3) + 60)
  const year = a(b(3) + 100)
  const tea = a(b(4) + 10)
  const leaked = Math.round(interpolate(frame, [b(4) + 20, b(4) + 70], [0, 72], CLAMP))
  const open = a(b(4) + 90)

  // доска 2: приватное хранилище, правило, подписанная ссылка, удаление
  const storage = a(b(5) + 34)
  const table = a(b(5) + 64)
  const locked = a(b(5) + 94)
  const noPublic = a(b(5) + 140)
  const rule = a(b(6) + 6)
  const ruleAt = [b(6) + 40, b(6) + 60, b(6) + 110, b(6) + 130]
  const readersMark = a(b(6) + 50) * (1 - a(b(8), 8))
  const toSigned = a(b(7) + 4, 12)
  const signed = a(b(7) + 10)
  const lineAt = [b(7) + 24, b(7) + 40, b(7) + 56]
  const onlyThem = a(b(7) + 80)
  const timer = a(b(7) + 90)
  const left = 1 - interpolate(frame, [b(7) + 100, b(7) + 150], [0, 1], CLAMP)
  const chat2 = a(b(7) + 120)
  const chat2Fail = a(b(7) + 170)
  const trash = a(b(8) + 6)
  const gone = a(b(8) + 20, 12)
  const goneTag = a(b(8) + 30)
  const strike = interpolate(frame, [b(8) + 36, b(8) + 46], [0, 1], CLAMP)

  const anna = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'happy']],
    [b(2) + 30, ['point', 'happy']],
    [b(3) + 60, ['surprised', 'worried']],
  ])
  const anna2 = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(6) + 40, ['cheer', 'happy']],
    [b(7), ['stand', 'happy']],
    [b(8) + 4, ['point', 'neutral']],
  ])

  // что видно в чате до и после исправления — по модели примера
  const publicOpens = opens('public', { kind: 'public' })
  const chatLater = opens('private', { kind: 'signed', ageMin: 60 })

  return (
    <KitScene chip="3 / 4 · Подводный камень: публичная ссылка" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* ===== доска 1: публичная постоянная ссылка ===== */}
      <PhotoThumb x={S3.thumb.x} y={S3.thumb.y} w={100} h={124} date={shortDate(PHOTOS[2])} />
      <Arrow x1={S3.link.x - LINK_W / 2 - 6} y1={S3.link.y} x2={S3.thumb.x + 108} y2={S3.link.y} color={theme.risk} />
      <Pill x={S3.link.x} y={S3.link.y} w={LINK_W} text={LINK_PUBLIC} color={theme.risk} fill={theme.riskTint} size={22} mono />
      <line
        x1={S3.link.x - (LINK_PUBLIC.length * CH22) / 2 + 2 * CH22}
        y1={S3.link.y + 15}
        x2={S3.link.x - (LINK_PUBLIC.length * CH22) / 2 + (2 + 6 * underline) * CH22}
        y2={S3.link.y + 15}
        stroke={theme.risk}
        strokeWidth={3}
        opacity={underline > 0 ? 1 : 0}
      />
      <g opacity={pubTag}>
        <Pill x={411} y={S3.tagY} text="публичное хранилище" color={theme.risk} fill={theme.white} size={20} compact />
      </g>
      <g opacity={forever}>
        <Pill x={617} y={S3.tagY} text="постоянная" color={theme.risk} fill={theme.white} size={20} compact />
      </g>
      <g opacity={noLogin}>
        <Pill x={767} y={S3.tagY} text="без входа" color={theme.risk} fill={theme.white} size={20} compact />
      </g>
      <g opacity={noPass}>
        <Pill x={917} y={S3.tagY} text="без пароля" color={theme.risk} fill={theme.white} size={20} compact />
      </g>

      {/* любой, у кого ссылка */}
      <g opacity={wide * (1 - a(strangerIn))}>
        <Slot x={S3.stranger.x - 44} y={S3.stranger.y - 48} w={88} h={96} text="?" />
      </g>
      <Arrow x1={S3.stranger.x - 48} y1={S3.stranger.y - 14} x2={S3.link.x + LINK_W / 2 + 8} y2={S3.link.y + 2} color={theme.risk} draw={toLink} />
      <Someone x={S3.stranger.x} y={S3.stranger.y} scale={0.55} enterAt={strangerIn} pose={sees > 0 ? 'surprised' : 'stand'} />
      <g opacity={anyone}>
        <Pill x={S3.stranger.x + 20} y={236} text="любой со ссылкой" color={theme.risk} fill={theme.white} size={20} compact />
      </g>
      <g opacity={sees * (publicOpens ? 1 : 0)}>
        <PhotoThumb x={S3.stranger.x + 62} y={S3.stranger.y - 64} w={48} h={58} stroke={theme.risk} />
      </g>

      {/* Анна → подруга → общий чат */}
      <Client x={S3.anna.x} y={S3.anna.y} scale={0.6} label="Анна" enterAt={b(2) + 4} pose={anna[0]} mood={anna[1]} />
      <Someone x={S3.friend.x} y={S3.friend.y} scale={0.6} label="Подруга" enterAt={b(2) + 20} pose={frame >= b(2) + 60 ? 'cheer' : 'stand'} mood="happy" />
      <Arrow x1={S3.anna.x + 78} y1={S3.anna.y - 16} x2={S3.friend.x - 50} y2={S3.anna.y - 16} color={theme.risk} draw={toFriend} />
      <g opacity={toFriend}>
        <Pill x={(S3.anna.x + S3.friend.x) / 2} y={S3.anna.y - 66} text="ссылка" color={theme.risk} fill={theme.white} size={18} compact />
      </g>
      <Arrow x1={S3.friend.x + 50} y1={S3.friend.y - 16} x2={CHAT.x - 8} y2={S3.friend.y - 16} color={theme.risk} draw={toChat} />
      <g opacity={wide * (1 - chat)}>
        <Slot x={CHAT.x} y={CHAT.y} w={CHAT.w} h={CHAT.h} text="общий чат" />
      </g>
      <g opacity={chat}>
        <Card x={CHAT.x} y={CHAT.y} w={CHAT.w} h={CHAT.h} fill={theme.paper}>
          <Label x={CHAT.x + 18} y={CHAT.y + 32} anchor="start" size={20} color={theme.soft} weight={600}>
            Общий чат · 40 человек
          </Label>
          <rect x={CHAT.x + 14} y={CHAT.y + 46} width={CHAT.w - 28} height={88} rx={14} fill={theme.white} stroke={theme.line} strokeWidth={2} />
          <Label x={CHAT.x + 30} y={CHAT.y + 78} anchor="start" size={20} weight={700} color={theme.soft}>
            Подруга:
          </Label>
          <Label x={CHAT.x + 134} y={CHAT.y + 78} anchor="start" size={20} weight={500}>
            {typed('смотрите на Анну!', frame, b(2) + 110, 30)}
          </Label>
          <text x={CHAT.x + 30} y={CHAT.y + 116} fill={theme.risk} style={mono(20)}>
            {typed(SHORT, frame, b(2) + 130, 40)}
          </text>
          <g opacity={year}>
            <Pill x={CHAT.x + 112} y={CHAT.y + 158} text="через год — тоже" color={theme.risk} fill={theme.riskTint} size={18} compact />
          </g>
          <g opacity={read}>
            <Label x={CHAT.x + CHAT.w - 20} y={CHAT.y + 164} anchor="end" size={18} color={theme.soft} weight={600}>
              прочитали все
            </Label>
          </g>
        </Card>
      </g>

      {/* любой из чата открывает фото */}
      <g opacity={wide * (1 - a(crowdAt[0]))}>
        <Slot x={S3.crowd[0] - 40} y={S3.crowdY - 44} w={S3.crowd[2] - S3.crowd[0] + 80} h={88} text="из чата" />
      </g>
      <Arrow x1={CHAT.x + CHAT.w + 6} y1={S3.crowdY + 10} x2={S3.crowd[0] - 40} y2={S3.crowdY + 10} color={theme.risk} draw={toCrowd} />
      {S3.crowd.map((x, i) => (
        <g key={x}>
          <Someone x={x} y={S3.crowdY} scale={0.45} enterAt={crowdAt[i]} pose={crowdSees > 0 ? 'surprised' : 'stand'} />
          <g opacity={crowdSees * (publicOpens ? 1 : 0)}>
            <PhotoThumb x={x - 19} y={S3.crowdY - 92} w={38} h={46} stroke={theme.risk} />
          </g>
        </g>
      ))}
      <g opacity={crowdTag}>
        <Pill x={S3.crowd[1]} y={S3.crowdY + 54} text="открыл любой из чата" color={theme.risk} fill={theme.white} size={18} compact />
      </g>

      {/* Tea, 2025: фото из открытого хранилища (s82) */}
      <g opacity={wide * (1 - tea)}>
        <Slot x={TEA.x} y={TEA.y} w={TEA.w} h={TEA.h} text="так бывает" />
      </g>
      <g opacity={tea}>
        <Card x={TEA.x} y={TEA.y} w={TEA.w} h={TEA.h} stroke={theme.risk} fill={theme.white}>
          <Label x={TEA.x + 20} y={TEA.y + 30} anchor="start" size={22} weight={800}>
            Tea · 2025
          </Label>
          <Label x={TEA.x + 20} y={TEA.y + 58} anchor="start" size={20} weight={700} color={theme.risk}>
            {`утекли ≈ ${leaked === 0 ? '0' : `${leaked} 000`} фото`}
          </Label>
          <g opacity={open}>
            <Label x={TEA.x + 20} y={TEA.y + 83} anchor="start" size={20} weight={600} color={theme.soft}>
              хранилище было открыто
            </Label>
          </g>
        </Card>
      </g>

      {/* ===== доска 2: приватное хранилище ===== */}
      <g opacity={1 - storage}>
        <Slot x={ST.x} y={ST.y} w={ST.w} h={ST.h} text="хранилище" />
      </g>
      <g opacity={1 - table}>
        <Slot x={TB.x} y={TB.y} w={TB.w} h={TB.h} text="таблица" />
      </g>
      <g opacity={storage}>
        <Card x={ST.x} y={ST.y} w={ST.w} h={ST.h} stroke={theme.ok} fill={theme.white}>
          <Label x={ST.x + 22} y={ST.y + 38} anchor="start" size={22} weight={800}>
            Хранилище файлов
          </Label>
          <path d={`M${ST.x + 24} ${ST.y + 54} h14 l5 6 h19 v20 h-38 Z`} fill={theme.altTint} stroke={theme.alt} strokeWidth={2.5} strokeLinejoin="round" />
          <text x={ST.x + 72} y={ST.y + 76} fill={theme.ink} style={mono(20)}>
            {`${ANNA}/`}
          </text>
        </Card>
        {PHOTOS.map((d, i) => {
          const x = storageThumbX(ST.x, i)
          const y = ST.y + 88
          const last = i === PHOTOS.length - 1
          return (
            <g key={d}>
              {last && (
                <g opacity={gone}>
                  <Slot x={x} y={y} w={THUMB.w} h={THUMB.h} r={8} color={theme.risk} />
                </g>
              )}
              <g opacity={last ? 1 - gone : 1}>
                <PhotoThumb x={x} y={y} w={THUMB.w} h={THUMB.h} date={shortDate(d)} />
              </g>
              {last && (
                <g opacity={goneTag}>
                  <Label x={x + THUMB.w / 2} y={y + THUMB.h / 2 + 7} size={18} weight={700} color={theme.risk}>
                    удалено
                  </Label>
                </g>
              )}
            </g>
          )
        })}
        {/* постоянной ссылки больше нет */}
        <g opacity={noPublic}>
          <text x={ST.x + 22} y={ST.y + ST.h - 18} fill={theme.soft} style={mono(20)}>
            {SHORT}
          </text>
          <line x1={ST.x + 18} y1={ST.y + ST.h - 25} x2={ST.x + 26 + SHORT.length * CH20} y2={ST.y + ST.h - 25} stroke={theme.risk} strokeWidth={3} />
          <Mark x={ST.x + 54 + SHORT.length * CH20} y={ST.y + ST.h - 25} ok={opens('private', { kind: 'public' })} r={14} />
          <Label x={ST.x + 78 + SHORT.length * CH20} y={ST.y + ST.h - 18} anchor="start" size={20} weight={700} color={theme.risk}>
            отказ
          </Label>
        </g>
      </g>
      <g opacity={locked}>
        <Padlock x={ST.x + ST.w - 144} y={ST.y + 36} scale={0.62} />
        <Pill x={ST.x + ST.w - 70} y={ST.y + 32} w={112} text="приватное" color={theme.ok} fill={theme.okTint} size={18} compact />
      </g>
      <g opacity={table}>
        <Card x={TB.x} y={TB.y} w={TB.w} h={TB.h} fill={theme.white}>
          <Label x={TB.x + 20} y={TB.y + 28} anchor="start" size={20} weight={700}>
            таблица «фото»
          </Label>
        </Card>
        {PHOTOS.map((d, i) => {
          const last = i === PHOTOS.length - 1
          const y = TB.y + 56 + i * 26
          return (
            <g key={d} opacity={last ? 1 - 0.6 * strike : 1}>
              <text x={TB.x + 20} y={y} fill={theme.ink} style={mono(20)}>
                {photoPath(d)}
              </text>
              {last && <line x1={TB.x + 16} y1={y - 7} x2={TB.x + 16 + (photoPath(d).length * CH20 + 8) * strike} y2={y - 7} stroke={theme.risk} strokeWidth={3} opacity={strike > 0 ? 1 : 0} />}
            </g>
          )
        })}
      </g>

      {/* правило доступа к папке 17 */}
      <g opacity={1 - rule}>
        <Slot x={RU.x} y={RU.y} w={RU.w} h={RU.h} text="правило" />
      </g>
      <g opacity={rule}>
        <Card x={RU.x} y={RU.y} w={RU.w} h={RU.h} stroke={theme.accent} fill={theme.white}>
          <Label x={RU.x + 20} y={RU.y + 38} anchor="start" size={22} weight={800}>
            Правило доступа
          </Label>
          <Label x={RU.x + 20} y={RU.y + 72} anchor="start" size={20} weight={600} color={theme.soft}>
            {`файлы папки ${ANNA} читают:`}
          </Label>
        </Card>
        {RULE.map((r, i) => (
          <g key={r.who} opacity={a(ruleAt[i])}>
            <Label x={RU.x + 24} y={RU.y + 112 + i * 38} anchor="start" size={22} weight={700} color={r.ok ? theme.ink : theme.soft}>
              {r.who}
            </Label>
            <Mark x={RU.x + RU.w - 36} y={RU.y + 104 + i * 38} ok={r.ok} r={14} />
          </g>
        ))}
      </g>
      <Client x={S3.anna2.x} y={S3.anna2.y} scale={0.55} label="Анна" enterAt={ruleAt[0]} pose={anna2[0]} mood={anna2[1]} />
      <Coach x={S3.marina2.x} y={S3.marina2.y} scale={0.55} label="Марина" enterAt={ruleAt[1]} pose={frame >= b(6) + 60 && frame < b(7) ? 'cheer' : 'stand'} mood="happy" />
      <g opacity={readersMark}>
        <Mark x={S3.anna2.x} y={S3.anna2.y - 64} ok={mayRead('Анна', ANNA)} r={13} />
        <Mark x={S3.marina2.x} y={S3.marina2.y - 64} ok={mayRead('Марина', ANNA)} r={13} />
      </g>
      <g opacity={trash}>
        <rect x={S3.anna2.x - 88} y={S3.anna2.y - 88} width={176} height={38} rx={19} fill={theme.white} stroke={theme.risk} strokeWidth={2.5} />
        <g transform={`translate(${S3.anna2.x - 62} ${S3.anna2.y - 69}) scale(0.8)`}>
          <Trash x={0} y={0} />
        </g>
        <Label x={S3.anna2.x - 42} y={S3.anna2.y - 62} anchor="start" size={18} weight={700} color={theme.risk}>
          удалить фото
        </Label>
      </g>

      {/* подписанная ссылка на 5 минут */}
      <Arrow x1={RU.x + RU.w + 4} y1={RU.y + RU.h / 2} x2={SG.x - 6} y2={SG.y + SG.h / 2} color={theme.accent} draw={toSigned} />
      <g opacity={1 - signed}>
        <Slot x={SG.x} y={SG.y} w={SG.w} h={SG.h} text="ссылка для показа" />
      </g>
      <g opacity={signed}>
        <Card x={SG.x} y={SG.y} w={SG.w} h={SG.h} stroke={theme.accent} fill={theme.white}>
          <Label x={SG.x + 20} y={SG.y + 38} anchor="start" size={22} weight={800}>
            Подписанная ссылка
          </Label>
        </Card>
        {SIGNED_LINES.map((l, i) => (
          <text key={l} x={SG.x + 20} y={SG.y + 80 + i * 30} fill={i === 2 ? theme.accent : theme.ink} style={mono(20)}>
            {typed(l, frame, lineAt[i], 40)}
          </text>
        ))}
        <g opacity={onlyThem}>
          <Label x={SG.x + 20} y={SG.y + 210} anchor="start" size={20} weight={600} color={theme.soft}>
            только тем, кому можно
          </Label>
          <Label x={SG.x + 20} y={SG.y + 244} anchor="start" size={20} weight={800} color={theme.ok}>
            {`живёт ${SIGNED_MIN} минут`}
          </Label>
        </g>
        <g opacity={timer}>
          <Timer x={SG.x + SG.w - 52} y={SG.y + 128} r={38} left={left} label={`${Math.ceil(left * SIGNED_MIN)} мин`} />
        </g>
      </g>

      {/* та же ссылка в чате через час */}
      <g opacity={1 - chat2}>
        <Slot x={C2.x} y={C2.y} w={C2.w} h={C2.h} text="чат" />
      </g>
      <g opacity={chat2}>
        <Card x={C2.x} y={C2.y} w={C2.w} h={C2.h} fill={theme.paper}>
          <Label x={C2.x + 18} y={C2.y + 32} anchor="start" size={20} weight={600} color={theme.soft}>
            Общий чат · через час
          </Label>
          <text x={C2.x + 18} y={C2.y + 66} fill={theme.soft} style={mono(20)}>
            {TOKEN}
          </text>
          <g opacity={chat2Fail}>
            <Mark x={C2.x + 32} y={C2.y + 92} ok={chatLater} r={13} />
            <Label x={C2.x + 54} y={C2.y + 99} anchor="start" size={20} weight={700} color={theme.risk}>
              ссылка не открылась
            </Label>
          </g>
        </Card>
      </g>
    </KitScene>
  )
}
