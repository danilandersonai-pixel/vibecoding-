import { interpolate, useCurrentFrame } from 'remotion'
import { Coach } from '../../actors/Coach'
import { Database } from '../../actors/Database'
import { Hacker } from '../../actors/Hacker'
import type { Mood, Pose } from '../../actors/Person'
import { Server } from '../../actors/Server'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP, trackAt } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Browser, Cloud, KeyGlyph, Mark, Pill } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { Checklist } from '../../kit/screens/Checklist'
import { Editor } from '../../kit/screens/Editor'
import { checklistHeight } from '../../kit/screens/layout'
import { theme } from '../../theme'
import { S7 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { ClientList, Lock, Shield, Speech } from './parts'

const ID = 's7-traps'
const BAR7 = S7.bar
const HD = S7.hidden
const BD = S7.bad
const PG = S7.page
const EV = S7.env
const RL = S7.real
const MS = S7.mess

const KEY = 'sk-live-4f9a2c'
// что не видно в демо — основной объём работы (s39, s40)
const HIDDEN = ['вход и права', 'обработка ошибок', 'резервные копии', 'тесты', 'журналы и оповещения']
const REAL = [
  { fake: 'Анна', real: 'Анна, №17' },
  { fake: 'Олег', real: 'Олег, №18' },
  { fake: 'Ира', real: 'ещё 40 человек' },
]
const SPEC = ['Умеет: список подопечных', 'Пропавших — красным']
const RECAP = ['вопрос до прототипа', 'таймбокс', 'тонкий срез', 'показ живым людям', 'решение: выбросить, развивать, переписать']

// путаница правок: ломаная, которая петляет внутри прямоугольника
const MESS_PATH = [
  [30, 150],
  [120, 40],
  [200, 160],
  [90, 110],
  [300, 60],
  [250, 170],
  [160, 70],
  [340, 140],
  [60, 60],
  [280, 120],
  [200, 30],
  [350, 40],
]

// Сцена 7: ловушки прототипа — демо принимают за продукт (видно 70%, скрыто 30%); ключ API в странице
// и ключ на сервере в .env; открытые базы 2025 года; настоящие данные; спагетти от правок; итог главы.
export function S7Traps() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: демо, «запускаем завтра?», 70 и 30
  const demoAt = b(0) + 4
  const ask = appear(frame, b(0) + 30)
  const seen = interpolate(frame, [b(0) + 60, b(0) + 90], [0, 1], CLAMP)
  const rest = appear(frame, b(0) + 96)
  const hidden = appear(frame, b(0) + 120)
  const dima = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 24, ['cheer', 'happy']],
    [b(0) + 130, ['surprised', 'worried']],
  ])

  // доска 2: ключ в странице виден в инструментах разработчика; ключ на сервере
  const bad = appear(frame, b(1) + 30)
  const badAt = b(1) + 34
  const devtools = interpolate(frame, [b(1) + 80, b(1) + 96], [0, 1], CLAMP)
  const leak = appear(frame, b(1) + 110)
  const no = appear(frame, b(1) + 150)
  const good = appear(frame, b(2) + 6)
  const pageAt = b(2) + 10
  const key = trackAt(frame, [
    [b(2) + 10, BD.x + 300, BD.y + 250],
    [b(2) + 50, S7.server.x + 46, S7.server.y - 84],
  ])
  const serverIn = appear(frame, b(2) + 30)
  const toServer = interpolate(frame, [b(2) + 40, b(2) + 52], [0, 1], CLAMP)
  const toService = interpolate(frame, [b(2) + 56, b(2) + 68], [0, 1], CLAMP)
  const service = appear(frame, b(2) + 60)
  const env = appear(frame, b(2) + 80)
  const ignore = appear(frame, b(2) + 130)
  const hacker = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(1) + 70, ['point', 'happy']],
    [b(2) + 10, ['think', 'worried']],
  ])

  // доска 3: открытая база, настоящие данные, спагетти
  const dbIn = appear(frame, b(3) + 20)
  const open = frame >= b(3) + 50
  const flyAt = [b(3) + 70, b(3) + 84, b(3) + 98]
  const noRls = appear(frame, b(3) + 110)
  const realIn = appear(frame, b(4) + 6)
  const real = frame >= b(4) + 50
  const stamp = appear(frame, b(4) + 60)
  const shield = appear(frame, b(4) + 110)
  const messIn = appear(frame, b(5) + 6)
  const mess = interpolate(frame, [b(5) + 10, b(5) + 70], [0, 1], CLAMP)
  const toSpec = interpolate(frame, [b(5) + 84, b(5) + 98], [0, 1], CLAMP)
  const fresh = appear(frame, b(5) + 150)

  // итог поверх всего
  const recap = appear(frame, b(6) + 4)
  const messD = MESS_PATH.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${MS.x + 15 + x} ${MS.y + 10 + y}`).join(' ')

  return (
    <KitScene
      chip="7 / 7 · Ловушки прототипа"
      duration={sceneDuration(ID)}
      {...STAGING[ID]}
      overlay={
        recap > 0 ? (
          <g opacity={recap}>
            <rect x={0} y={0} width={1280} height={720} fill={theme.ink} opacity={0.62} />
            <Card x={S7.recap.x - 30} y={S7.recap.y - 76} w={S7.recap.w + 60} h={checklistHeight(RECAP.length) + 106} fill={theme.paper} stroke={theme.accent} />
            <text x={640} y={S7.recap.y - 26} textAnchor="middle" fill={theme.accent} style={{ font: `700 30px ${theme.font}` }}>
              Итог главы
            </text>
            <Checklist x={S7.recap.x} y={S7.recap.y} w={S7.recap.w} at={b(6) + 4} items={RECAP} done={RECAP.length} />
          </g>
        ) : undefined
      }
    >
      {/* демо и вопрос Димы */}
      {frame >= demoAt && (
        <Browser x={S7.demo.x} y={S7.demo.y} w={S7.demo.w} h={S7.demo.h} at={demoAt} url="прототип">
          <ClientList w={S7.demo.w} mark={1} />
        </Browser>
      )}
      <g opacity={ask}>
        <Speech x={S7.dima.x - 10} y={S7.dima.y - 140} text="Запускаем завтра?" tx={S7.dima.x} ty={S7.dima.y - 96} color={theme.alt} />
      </g>
      <Coach x={S7.dima.x} y={S7.dima.y} scale={0.8} color={theme.alt} label="Дима" enterAt={b(0) + 10} pose={dima[0]} mood={dima[1]} />

      {/* видно 70%, скрыто 30% */}
      <rect x={BAR7.x} y={BAR7.y} width={BAR7.w * 0.7 * seen} height={BAR7.h} rx={10} fill={theme.ok} />
      <g opacity={seen}>
        <Label x={BAR7.x + 18} y={BAR7.y + BAR7.h / 2 + 7} anchor="start" size={20} weight={700} color={theme.white}>
          видно в демо — 70%
        </Label>
      </g>
      <g opacity={rest}>
        <rect x={BAR7.x + BAR7.w * 0.7 + 4} y={BAR7.y} width={BAR7.w * 0.3 - 4} height={BAR7.h} rx={10} fill={theme.riskTint} stroke={theme.risk} strokeWidth={3} strokeDasharray="8 6" />
        <Label x={BAR7.x + BAR7.w * 0.85 + 2} y={BAR7.y + BAR7.h / 2 + 8} size={22} weight={700} color={theme.risk}>
          30%
        </Label>
      </g>
      <g opacity={hidden}>
        <path d={`M${BAR7.x + BAR7.w * 0.7 + 4} ${BAR7.y + BAR7.h} L${HD.x} ${HD.y} M${BAR7.x + BAR7.w} ${BAR7.y + BAR7.h} L${HD.x + HD.w} ${HD.y}`} stroke={theme.risk} strokeWidth={2} strokeDasharray="6 6" />
        <Card x={HD.x} y={HD.y} w={HD.w} h={HD.h} stroke={theme.risk}>
          <Label x={HD.x + 24} y={HD.y + 38} anchor="start" size={22} weight={700} color={theme.risk}>
            Не видно — основная работа
          </Label>
        </Card>
      </g>
      {HIDDEN.map((t, i) => (
        <g key={t} opacity={appear(frame, b(0) + 124 + i * 8, 8)}>
          <rect x={HD.x + 24} y={HD.y + 62 + i * HD.row} width={22} height={22} rx={5} fill={theme.paper} stroke={theme.risk} strokeWidth={3} />
          <Label x={HD.x + 58} y={HD.y + 80 + i * HD.row} anchor="start" size={20} weight={600}>
            {t}
          </Label>
        </g>
      ))}

      {/* доска 2: опасно — ключ в странице */}
      <g opacity={bad}>
        <Pill x={BD.x + BD.w / 2} y={92} text="опасно: ключ в странице" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>
      {frame >= badAt && (
        <Browser x={BD.x} y={BD.y} w={BD.w} h={BD.h} at={badAt} url="прототип">
          <text x={24} y={82} fill={theme.ink} style={{ font: `700 24px ${theme.font}` }}>
            Подопечные
          </text>
          {[0, 1].map((i) => (
            <rect key={i} x={24} y={104 + i * 40} width={BD.w - 48 - i * 90} height={26} rx={6} fill={theme.grid} />
          ))}
          {devtools > 0 && (
            <g transform={`translate(0 ${(1 - devtools) * 120})`} opacity={devtools}>
              <rect x={8} y={BD.h - 128} width={BD.w - 16} height={120} rx={8} fill={theme.termBg} />
              <text x={24} y={BD.h - 96} fill={theme.termDim} style={{ font: `500 18px ${theme.font}` }}>
                Инструменты разработчика
              </text>
              <text x={24} y={BD.h - 52} fill={leak > 0.5 ? theme.termErr : theme.termText} style={{ font: `600 22px ${theme.mono}` }}>
                {`key: '${KEY}'`}
              </text>
              {leak > 0 && <rect x={18} y={BD.h - 78} width={300} height={36} rx={6} fill="none" stroke={theme.termErr} strokeWidth={3} opacity={leak} />}
            </g>
          )}
        </Browser>
      )}
      <g opacity={no}>
        <Mark x={BD.x + BD.w - 6} y={BD.y + 6} ok={false} r={20} />
      </g>
      {frame >= b(1) + 50 && <Hacker x={S7.hacker.x} y={S7.hacker.y} scale={0.6} enterAt={b(1) + 50} pose={hacker[0]} mood={hacker[1]} />}

      {/* правильно — ключ на сервере, в .env */}
      <g opacity={good}>
        <Pill x={S7.safeSpot.x + S7.safeSpot.w / 2} y={92} text="правильно: ключ на сервере" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      {frame >= pageAt && (
        <Browser x={PG.x} y={PG.y} w={PG.w} h={PG.h} at={pageAt} url="сайт">
          <text x={PG.w / 2} y={98} textAnchor="middle" fill={theme.ok} style={{ font: `700 20px ${theme.font}` }}>
            ключа нет
          </text>
        </Browser>
      )}
      <Arrow x1={PG.x + PG.w + 6} y1={PG.y + PG.h / 2} x2={S7.server.x - 50} y2={PG.y + PG.h / 2} color={theme.accent} draw={toServer} />
      <g opacity={serverIn}>
        <Server x={S7.server.x} y={S7.server.y} scale={0.6} label="Ваш сервер" />
      </g>
      {frame >= b(2) + 10 && <KeyGlyph x={key.x} y={key.y} color={theme.alt} scale={1.3} />}
      <Arrow x1={S7.server.x + 50} y1={S7.server.y - 40} x2={S7.service.x - 2} y2={S7.service.y + 62} color={theme.accent} draw={toService} />
      <g opacity={service}>
        <Cloud x={S7.service.x} y={S7.service.y} w={S7.service.w} h={S7.service.h}>
          <Label x={S7.service.x + S7.service.w / 2 + 4} y={S7.service.y + 72} size={20} weight={700}>
            сервис
          </Label>
        </Cloud>
      </g>
      <g opacity={env}>
        <Card x={EV.x} y={EV.y} w={EV.w} h={EV.h} stroke={theme.ok}>
          <Label x={EV.x + 20} y={EV.y + 34} anchor="start" size={20} weight={700}>
            .env — вне кода и репозитория
          </Label>
          <text x={EV.x + 20} y={EV.y + 72} fill={theme.alt} style={{ font: `600 20px ${theme.mono}` }}>
            {typed(`API_KEY=${KEY}`, frame, b(2) + 90, 40)}
          </text>
          <text x={EV.x + 20} y={EV.y + 106} fill={theme.soft} style={{ font: `500 18px ${theme.mono}` }}>
            {typed('в коде: process.env.API_KEY', frame, b(2) + 104, 40)}
          </text>
        </Card>
      </g>
      <g opacity={ignore}>
        <Pill x={EV.x + EV.w / 2} y={EV.y + EV.h - 30} text="в .gitignore — в репозиторий не попадёт" color={theme.ok} fill={theme.okTint} size={18} compact />
      </g>

      {/* доска 3: открытая база */}
      <g opacity={dbIn}>
        <Pill x={S7.db.x} y={96} text="2025: база открыта всем" color={theme.risk} fill={theme.riskTint} size={20} compact />
        <Database x={S7.db.x} y={S7.db.y} scale={0.9} rows={REAL.map((r) => ({ text: r.fake, color: theme.ok }))} />
        <Lock x={S7.db.x + 150} y={S7.db.y - 96} open={open} />
      </g>
      {/* строки утекают из открытой базы вправо, в пустую часть доски, и гаснут */}
      {flyAt.map((at, i) => {
        const p = interpolate(frame, [at, at + 30], [0, 1], CLAMP)
        if (p <= 0 || p >= 1) return null
        return (
          <g key={at} opacity={1 - p} transform={`translate(${S7.db.x + 160 + 110 * p} ${S7.db.y - 30 + i * 56 + 16 * p})`}>
            <rect x={-40} y={-16} width={80} height={32} rx={6} fill={theme.paper} stroke={theme.risk} strokeWidth={3} />
            <text y={7} textAnchor="middle" fill={theme.risk} style={{ font: `600 18px ${theme.font}` }}>
              {REAL[i].fake}
            </text>
          </g>
        )
      })}
      <g opacity={noRls}>
        <Pill x={S7.db.x} y={470} text="доступ к строкам не настроен" color={theme.risk} fill={theme.paper} size={18} compact />
      </g>

      {/* настоящие данные — уже не прототип */}
      <g opacity={realIn}>
        <Card x={RL.x} y={RL.y} w={RL.w} h={60 + REAL.length * 52 + 16} stroke={real ? theme.risk : theme.alt}>
          <Label x={RL.x + 20} y={RL.y + 40} anchor="start" size={22} weight={700}>
            Подопечные
          </Label>
          <Pill x={RL.x + RL.w - 80} y={RL.y + 32} text={real ? 'настоящие' : 'выдуманы'} color={real ? theme.risk : theme.alt} fill={theme.paper} size={18} compact />
          {REAL.map((r, i) => (
            <g key={r.fake}>
              <line x1={RL.x + 16} y1={RL.y + 60 + i * 52} x2={RL.x + RL.w - 16} y2={RL.y + 60 + i * 52} stroke={theme.grid} strokeWidth={2} />
              <Label x={RL.x + 20} y={RL.y + 94 + i * 52} anchor="start" size={22} weight={600} color={real ? theme.ink : theme.soft}>
                {real ? r.real : r.fake}
              </Label>
            </g>
          ))}
        </Card>
      </g>
      <g opacity={stamp} transform={`rotate(-6 ${RL.x + RL.w / 2} ${RL.y + 260})`}>
        <Pill x={RL.x + RL.w / 2} y={RL.y + 260} text="уже не прототип" color={theme.risk} fill={theme.riskTint} size={22} />
      </g>
      <g opacity={shield}>
        <Shield x={RL.x + RL.w / 2 - 90} y={RL.y + 352} size={90} />
        <Label x={RL.x + RL.w / 2 - 30} y={RL.y + 360} anchor="start" size={22} weight={700} color={theme.ok}>
          вся защита
        </Label>
      </g>

      {/* спагетти от правок → спецификация → заново */}
      <g opacity={messIn}>
        <Card x={MS.x} y={MS.y} w={MS.w} h={MS.h} stroke={theme.risk} />
        <path d={messD} fill="none" stroke={theme.alt} strokeWidth={4} strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - mess} />
        <Pill x={MS.x + MS.w / 2} y={MS.y} text="правка на правке, без уборки" color={theme.risk} fill={theme.paper} size={18} compact />
      </g>
      <Arrow x1={MS.x + MS.w / 2} y1={MS.y + MS.h + 6} x2={MS.x + MS.w / 2} y2={S7.spec.y - 6} color={theme.accent} draw={toSpec} />
      {frame >= b(5) + 96 && <Editor x={S7.spec.x} y={S7.spec.y} w={S7.spec.w} at={b(5) + 96} file="spec.md" lines={SPEC} />}
      <g opacity={fresh}>
        <Pill x={S7.spec.x + S7.spec.w / 2} y={S7.spec.y + 160} text="новая версия с чистого листа" color={theme.ok} fill={theme.okTint} size={18} compact />
      </g>
    </KitScene>
  )
}
