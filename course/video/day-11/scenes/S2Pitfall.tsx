import { useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Client } from '../../actors/Client'
import { Coach } from '../../actors/Coach'
import { Database } from '../../actors/Database'
import type { Mood, Pose } from '../../actors/Person'
import { Phone } from '../../actors/Phone'
import { KitScene } from '../../kit/KitScene'
import { appear } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { KeyGlyph, Mark, Pill } from '../../kit/props'
import { revealCount, stepAt, typed } from '../../kit/reveal'
import { Editor } from '../../kit/screens/Editor'
import { Mono } from '../../kit/screens/Window'
import { theme } from '../../theme'
import { BIG_FONT, BIG_PHONE, COMMENTS, commentText, canRead, deliverAt, OLEG_NIGHT, POLICY, RULES, S2, S2_FEED_H, S2_RULES_H, SPAM, SQL_CREATE } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Moon, PhoneNote, Slot, Sun, Toggle } from './parts'

const ID = 's2-pitfall'
const F = S2.feed
const R = S2.rules
const color = (workout: string) => (workout === 'anna' ? theme.accent : theme.alt)
// что Олег видит в ленте: до RLS — все строки, после — только те, что ему можно (то же правило, что в политике)
const OWN = COMMENTS.filter((c) => canRead('Олег', c))
const rowTop = (i: number) => F.y + F.head + i * F.row
// строки уведомлений на экране телефона
const noteTop = (i: number) => -66 + i * 24
const NIGHT = '23:40'
// как устроена первая версия уведомлений — на месте будущих правил
const OLD = [
  { title: 'На каждый подход', sub: 'своё уведомление' },
  { title: 'Ночью — тоже', sub: 'тихих часов нет' },
  { title: 'Настроек нет', sub: 'только выключить всё' },
]

// Сцена 2 (подводный камень). Доска 1: таблицу комментариев агент создал через SQL — RLS выключен; лента Олега
// просит все комментарии, и база отдаёт чужие (колено Анны). Фильтр на странице не защита: ключ в коде страницы.
// Политика RLS — и база отдаёт Олегу только его строки. Доска 2: уведомление на каждый подход — 15 у Марины,
// ночные у Димы; Марина выключает всё и пропускает комментарий Анны. Правила решаете вы — после них два уведомления.
export function S2Pitfall() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // ---- доска 1 ----
  const sqlAt = b(0) + 16
  const sqlOut = appear(frame, b(4) + 2, 10)
  const dbAt = b(0) + 50
  const fixed = frame >= b(4) + 90
  const badge = appear(frame, b(0) + 110, 10)
  const agentTag = appear(frame, b(0) + 70, 10)
  // лента Олега: запрос и ответ
  const feedIn = appear(frame, b(1) + 10, 12)
  const ask1 = appear(frame, b(1) + 40, 14)
  const back1 = appear(frame, b(1) + 70, 14)
  const rowAt = COMMENTS.map((_, i) => b(1) + 86 + i * 12)
  const refresh = appear(frame, b(5) + 4, 10)
  const swap = b(5) + 16
  // чужое и данные о здоровье
  const leakAt = [b(2) + 20, b(2) + 34]
  const health = appear(frame, b(2) + 60, 12) * (1 - refresh)
  // фильтр на странице и ключ в коде
  const filter = appear(frame, b(3) + 16, 10) * (1 - refresh)
  const filterNo = appear(frame, b(3) + 40, 8)
  const keyIn = appear(frame, b(3) + 70, 12)
  const keySafe = frame >= b(5) + 40
  const pulse = frame >= b(3) + 90 && frame < b(3) + 110 ? 1.08 : 1
  // политика и повторный запрос
  const policyAt = b(4) + 14
  const ask2 = appear(frame, b(5) + 16, 14)
  const marksIn = appear(frame, b(5) + 30, 10)
  const back2 = appear(frame, b(5) + 40, 14)
  const ownAt = b(5) + 56
  const noneIn = appear(frame, b(5) + 66, 10)

  // ---- доска 2 ----
  const spamFirst = b(6) + 40
  const spamRest = b(7) + 50
  const spam = frame < spamFirst ? 0 : frame < spamRest ? 1 : 1 + revealCount(frame, spamRest, 5, SPAM.length - 1)
  const off = appear(frame, b(9) + 20, 10) * (1 - appear(frame, b(11) + 30, 10))
  const after = frame >= b(11) + 30
  const missed = appear(frame, b(9) + 64, 10)
  const nightOn = appear(frame, b(8) + 10, 10)
  const nightRows = revealCount(frame, b(8) + 24, 16, OLEG_NIGHT.length)
  const buzz = frame >= b(8) + 24 && frame < b(8) + 90 && Math.floor(frame / 4) % 2 === 0
  const morning = frame >= b(11) + 56
  const rulesIn = appear(frame, b(10) + 6, 12)
  const oldIn = appear(frame, b(6) + 80, 12) * (1 - appear(frame, b(10), 10))
  const oldAt = [b(6) + 90, b(8) + 30, b(9) + 30]
  const ruleAt = [b(10) + 24, b(10) + 54, b(10) + 84, b(11) + 10]
  const marinaTag = stepAt<{ text: string; color: string; fill: string } | null>(frame, [
    [0, null],
    [b(7) + 6, { text: 'демо: 1 подход', color: theme.ok, fill: theme.okTint }],
    [b(7) + 120, { text: '15 уведомлений', color: theme.risk, fill: theme.riskTint }],
    [b(9) + 80, { text: 'пропущено', color: theme.risk, fill: theme.riskTint }],
    [b(11) + 50, { text: '2 уведомления', color: theme.ok, fill: theme.okTint }],
  ])

  const oleg = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(1) + 30, ['point', 'neutral']],
    [b(1) + 100, ['stand', 'neutral']],
    [b(2) + 20, ['surprised', 'worried']],
    [b(3), ['think', 'worried']],
    [b(4) + 140, ['stand', 'neutral']],
    [b(5) + 20, ['point', 'neutral']],
    [b(5) + 60, ['stand', 'happy']],
  ])
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(0) + 10, 'working'],
    [b(0) + 64, 'done'],
    [b(1), 'idle'],
    [b(4) + 6, 'working'],
    [b(4) + 64, 'done'],
  ])
  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(6) + 60, ['point', 'neutral']],
    [b(6) + 140, ['stand', 'neutral']],
    [b(7) + 6, ['point', 'happy']],
    [b(7) + 80, ['stand', 'worried']],
    [b(7) + 110, ['surprised', 'worried']],
    [b(9) + 10, ['point', 'worried']],
    [b(9) + 80, ['think', 'worried']],
    [b(11) + 40, ['cheer', 'happy']],
    [b(11) + 110, ['stand', 'happy']],
  ])
  const dima = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(8) + 24, ['surprised', 'worried']],
    [b(8) + 120, ['think', 'worried']],
    [b(11) + 60, ['stand', 'happy']],
  ])
  const agent2 = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(10) + 16, 'working'],
    [b(10) + 60, 'done'],
  ])

  // строки ленты: до исправления — все комментарии, после — только свои
  const feedRows = frame < swap ? COMMENTS : OWN
  const shownAt = (i: number) => (frame < swap ? rowAt[i] : ownAt + i * 12)

  // уведомления на телефоне Марины: свежие сверху, не больше шести
  const marinaRows = after
    ? [
        { text: 'Анна: колено болит', color: theme.accent, fill: theme.accentTint, at: b(11) + 36 },
        { text: `Анна: ${SPAM.length} подходов`, color: theme.ok, fill: theme.paper, at: b(11) + 48 },
      ]
    : SPAM.slice(0, spam)
        .reverse()
        .slice(0, 6)
        .map((text) => ({ text, color: theme.ok, fill: theme.paper, at: 0 }))

  return (
    <KitScene chip="2 / 3 · Подводный камень: чужое и спам" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* ---- доска 1: лента Олега ---- */}
      {frame < b(1) + 14 && frame >= b(1) - 10 && <Slot x={F.x} y={F.y} w={F.w} h={S2_FEED_H} text="лента Олега" />}
      <g opacity={feedIn}>
        <Card x={F.x} y={F.y} w={F.w} h={S2_FEED_H} stroke={theme.alt} fill={theme.white}>
          <Label x={F.x + 20} y={F.y + 38} anchor="start" size={22} weight={800}>
            Лента Олега
          </Label>
          <Mono x={F.x + 20} y={F.y + 68} size={18} fill={theme.soft}>
            select * from comments
          </Mono>
        </Card>
      </g>
      {feedRows.map((c, i) => {
        const y = rowTop(i)
        const leak = frame < swap && !canRead('Олег', c)
        const li = COMMENTS.filter((x) => !canRead('Олег', x)).indexOf(c)
        const bad = leak && li >= 0 ? appear(frame, leakAt[li], 8) : 0
        return (
          <g key={commentText(c)} opacity={appear(frame, shownAt(i), 8) * (frame < swap ? 1 - refresh : 1)}>
            <rect x={F.x + 16} y={y} width={F.w - 32} height={F.rowH} rx={8} fill={bad > 0 ? theme.riskTint : theme.paper} stroke={bad > 0 ? theme.risk : theme.grid} strokeWidth={bad > 0 ? 3 : 2} />
            <rect x={F.x + 16} y={y + 6} width={6} height={F.rowH - 12} rx={3} fill={color(c.workout)} />
            <Label x={F.x + 34} y={y + 26} anchor="start" size={20}>
              {commentText(c)}
            </Label>
            <g opacity={bad}>
              <Mark x={F.x + F.w - 40} y={y + F.rowH / 2} ok={false} r={12} />
            </g>
          </g>
        )
      })}
      <g opacity={noneIn}>
        <Label x={F.x + 34} y={rowTop(1) + 26} anchor="start" size={20} color={theme.soft}>
          чужих строк нет
        </Label>
        <Mark x={F.x + F.w - 40} y={rowTop(0) + F.rowH / 2} ok r={12} />
      </g>
      {/* фильтр на странице — не защита */}
      <g opacity={filter}>
        <Pill x={F.x + 130} y={rowTop(3) + 18} text="фильтр на странице" color={theme.soft} size={18} compact />
        <g opacity={filterNo}>
          <Mark x={F.x + 254} y={rowTop(3) + 18} ok={false} r={12} />
        </g>
      </g>
      <g opacity={health}>
        <Pill x={S2.health.x} y={S2.health.y} text="данные о здоровье" color={theme.risk} fill={theme.riskTint} size={18} compact />
      </g>
      <Client x={S2.oleg.x} y={S2.oleg.y} scale={0.75} color={theme.alt} label="Олег" enterAt={b(1) - 4} pose={oleg[0]} mood={oleg[1]} />

      {/* запрос ленты и ответ базы */}
      <Arrow x1={F.x + F.w + 6} y1={232} x2={466} y2={232} color={theme.accent} draw={frame < swap ? ask1 * (1 - refresh) : ask2} />
      <Arrow x1={466} y1={296} x2={F.x + F.w + 6} y2={296} color={fixed ? theme.ok : theme.risk} draw={frame < swap ? back1 * (1 - refresh) : back2} />

      {/* таблица comments */}
      <g transform={`translate(${S2.db.x} ${S2.db.y}) scale(${pulse}) translate(${-S2.db.x} ${-S2.db.y})`}>
        <Database x={S2.db.x} y={S2.db.y} label="таблица comments" enterAt={dbAt} rows={COMMENTS.map((c) => ({ text: commentText(c), color: color(c.workout) }))} />
      </g>
      <g opacity={marksIn}>
        {COMMENTS.map((c, i) => (
          <Mark key={i} x={485} y={S2.db.y - 22 + i * 40} ok={canRead('Олег', c)} r={9} />
        ))}
      </g>
      <g opacity={badge}>
        <Pill x={S2.badge.x} y={S2.badge.y} text={fixed ? 'RLS включён' : 'RLS выключен'} color={fixed ? theme.ok : theme.risk} fill={fixed ? theme.okTint : theme.riskTint} size={20} compact />
      </g>
      {/* публичный ключ — в коде страницы */}
      <g opacity={keyIn}>
        <KeyGlyph x={keySafe ? 490 : 466} y={S2.key.y} color={keySafe ? theme.ok : theme.risk} />
        <Pill x={keySafe ? 656 : 660} y={S2.key.y} text={keySafe ? 'по ключу — только своё' : 'ключ из кода → вся таблица'} color={keySafe ? theme.ok : theme.risk} fill={keySafe ? theme.okTint : theme.riskTint} size={20} compact />
      </g>

      {/* агент: сначала таблица через SQL, потом политика */}
      {frame >= sqlAt && sqlOut < 1 && (
        <g opacity={1 - sqlOut}>
          <Editor x={S2.editor.x} y={S2.editor.y} w={S2.editor.w} at={sqlAt} file="comments.sql" lines={SQL_CREATE} />
        </g>
      )}
      {frame < sqlAt && <Slot x={S2.editor.x} y={S2.editor.y} w={S2.editor.w} h={256} text="SQL агента" />}
      {frame >= policyAt && <Editor x={S2.editor.x} y={S2.editor.y} w={S2.editor.w} at={policyAt} file="policy.sql" lines={POLICY} highlight={[1, 2, 7, 8]} />}
      <g opacity={agentTag * (1 - sqlOut)}>
        <Pill x={S2.agentTag.x} y={S2.agentTag.y} text="создал через SQL" color={theme.accent} size={18} compact />
      </g>
      <g opacity={appear(frame, b(4) + 70, 10)}>
        <Pill x={S2.agentTag.x} y={S2.agentTag.y} text="RLS и политика" color={theme.ok} fill={theme.okTint} size={18} compact />
      </g>
      <Agent x={S2.agent.x} y={S2.agent.y} scale={0.55} enterAt={4} pose={agent} />

      {/* ---- доска 2: телефон Марины ---- */}
      <Coach x={S2.marina.x} y={S2.marina.y} scale={0.75} label="Марина" pose={marina[0]} mood={marina[1]} />
      {marinaTag && <Pill x={S2.marinaTag.x} y={S2.marinaTag.y} w={160} text={marinaTag.text} color={marinaTag.color} fill={marinaTag.fill} size={18} compact />}
      <Phone x={S2.marinaPhone.x} y={S2.marinaPhone.y} scale={BIG_PHONE}>
        <text x={-46} y={-76} fill={theme.ink} style={{ font: `700 ${BIG_FONT}px ${theme.font}` }}>
          Уведомления
        </text>
        <Toggle x={40} y={-79} on={1 - off} />
        <g opacity={1 - off}>
          {marinaRows.map((r, i) => (
            <g key={r.text} opacity={after ? appear(frame, r.at, 8) : 1}>
              <PhoneNote top={noteTop(i)} text={r.text} color={r.color} fill={r.fill} />
            </g>
          ))}
        </g>
        {/* вопрос Анны пришёл, когда всё выключено: его никто не увидит */}
        {!after && (
          <g opacity={missed * 0.45}>
            <rect x={-50} y={noteTop(1) - 1} width={100} height={23} rx={5} fill="none" stroke={theme.risk} strokeWidth={1.5} strokeDasharray="4 3" />
            <text x={-46} y={noteTop(1) + 14.5} fill={theme.ink} style={{ font: `500 ${BIG_FONT}px ${theme.font}` }}>
              Анна: колено болит
            </text>
          </g>
        )}
        <g opacity={off}>
          <text x={-46} y={noteTop(0) + 14.5} fill={theme.soft} style={{ font: `600 ${BIG_FONT}px ${theme.font}` }}>
            выключены
          </text>
        </g>
        {spam > 1 && !after && (
          <g opacity={1 - off}>
            <circle cx={54} cy={-104} r={13} fill={theme.risk} />
            <text x={54} y={-99} textAnchor="middle" fill={theme.white} style={{ font: `700 ${BIG_FONT + 2}px ${theme.font}` }}>
              {String(spam)}
            </text>
          </g>
        )}
      </Phone>

      {/* ---- доска 2: телефон Димы ночью и утром ---- */}
      <Coach x={S2.dima.x} y={S2.dima.y} scale={0.75} color={theme.alt} label="Дима" pose={dima[0]} mood={dima[1]} />
      <Phone x={S2.dimaPhone.x} y={S2.dimaPhone.y} scale={BIG_PHONE}>
        <text x={-46} y={-56} fill={theme.ink} style={{ font: `700 ${BIG_FONT * 2.4}px ${theme.font}` }}>
          {morning ? deliverAt(NIGHT) : NIGHT}
        </text>
        {morning ? <Sun x={38} y={-64} /> : <Moon x={38} y={-64} />}
        {!morning && OLEG_NIGHT.slice(0, nightRows).map((t, i) => <PhoneNote key={t} top={-36 + i * 24} text={t} color={theme.alt} />)}
        {morning && (
          <g opacity={appear(frame, b(11) + 64, 8)}>
            <PhoneNote top={-36} text="Олег: тренировка" color={theme.alt} />
          </g>
        )}
        {/* экран погашен, пока Олег не начал */}
        <rect x={-54} y={-92} width={108} height={184} rx={6} fill={theme.ink} opacity={1 - nightOn} />
        {buzz && (
          <g stroke={theme.risk} strokeWidth={2.5} strokeLinecap="round">
            <path d="M-68 -18 L-68 18 M-74 -10 L-74 10 M68 -18 L68 18 M74 -10 L74 10" />
          </g>
        )}
      </Phone>

      {/* ---- доска 2: правила уведомлений ---- */}
      {frame < b(6) + 86 && <Slot x={R.x} y={R.y} w={R.w} h={S2_RULES_H} text="как сейчас" />}
      {/* первая версия: что не так — пока не появились правила */}
      <g opacity={oldIn}>
        <Card x={R.x} y={R.y} w={R.w} h={S2_RULES_H} stroke={theme.risk} fill={theme.white}>
          <Label x={R.x + 24} y={R.y + 42} anchor="start" size={24} weight={800} color={theme.risk}>
            Первая версия
          </Label>
          <line x1={R.x + 20} y1={R.y + 58} x2={R.x + R.w - 20} y2={R.y + 58} stroke={theme.grid} strokeWidth={2} />
        </Card>
        {OLD.map((r, i) => {
          const y = R.y + R.head + i * R.row
          return (
            <g key={r.title} opacity={appear(frame, oldAt[i], 10)}>
              <Mark x={R.x + 38} y={y + 22} ok={false} r={13} />
              <Label x={R.x + 64} y={y + 30} anchor="start" size={20} weight={700}>
                {r.title}
              </Label>
              <Label x={R.x + 64} y={y + 56} anchor="start" size={20} color={theme.soft}>
                {r.sub}
              </Label>
            </g>
          )
        })}
      </g>
      <g opacity={rulesIn}>
        <Card x={R.x} y={R.y} w={R.w} h={S2_RULES_H} stroke={theme.accent} fill={theme.white}>
          <Label x={R.x + 24} y={R.y + 42} anchor="start" size={24} weight={800} color={theme.accent}>
            Правила уведомлений
          </Label>
          <line x1={R.x + 20} y1={R.y + 58} x2={R.x + R.w - 20} y2={R.y + 58} stroke={theme.grid} strokeWidth={2} />
        </Card>
      </g>
      {RULES.map((r, i) => {
        const y = R.y + R.head + i * R.row
        const at = ruleAt[i]
        return (
          <g key={r.title} opacity={appear(frame, at, 10)}>
            <Mark x={R.x + 38} y={y + 22} ok r={13} />
            <Label x={R.x + 64} y={y + 30} anchor="start" size={20} weight={700}>
              {r.title}
            </Label>
            <Label x={R.x + 64} y={y + 56} anchor="start" size={20} color={theme.soft}>
              {typed(r.sub, frame, at + 8, 40)}
            </Label>
          </g>
        )
      })}
      {frame >= b(10) + 10 && <Agent x={S2.agent2.x} y={S2.agent2.y} scale={0.55} label="" enterAt={b(10) + 10} pose={agent2} />}
      <g opacity={appear(frame, b(10) + 30, 10)}>
        <Pill x={S2.agent2.x + 140} y={S2.agent2.y} text="выбор за вами" color={theme.accent} size={18} compact />
      </g>
    </KitScene>
  )
}
