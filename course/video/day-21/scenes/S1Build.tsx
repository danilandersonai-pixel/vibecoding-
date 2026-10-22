import { useCurrentFrame } from 'remotion'
import { Actor } from '../../actors/Actor'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear, trackAt } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Browser, Callout, Mark, Pill, Slot } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { Mono } from '../../kit/screens/Window'
import { theme } from '../../theme'
import { BETA, BETA_COL, BR1, BR2, CARD_Y, DNS, DNS_LANE, DNS_PILL, DOMAIN, OLD_URL, PAGE, PAGE_ROWS, pageRowY, POL1, REG, VER, WAIT_PILL, YOU1 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Clock, Padlock, Tap } from './parts'

const ID = 's1-build'
const Y = CARD_Y
const ROW_W = BR2.w - 32

// Сцена 1 (что строим сегодня): бета позади — запуск. Свой домен: купить у регистратора, добавить в проект
// на Vercel, записи DNS — у регистратора, сертификат https — сам (s81). Страница о продукте: для кого,
// что умеет, как начать — кнопка ведёт в первое знакомство (день 15). Политика конфиденциальности — дальше.
export function S1Build() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // бета-тест позади: четыре тренера с галочкой (слева от окна, пока камера крупно)
  const betaHead = appear(frame, b(0) + 8, 10) * (1 - appear(frame, b(2) - 14, 8))
  const betaAt = BETA.map((_, i) => b(0) + 16 + i * 8)
  const betaOk = BETA.map((_, i) => b(0) + 40 + i * 8)

  // окно со старым адресом (крупно): страница, «бета» → «запуск», служебный адрес
  const pageIn = (i: number) => appear(frame, b(0) + 6 + i * 10, 10)
  const chart = appear(frame, b(0) + 30, 30)
  const beta = 1 - appear(frame, b(0) + 66, 8)
  const launch = appear(frame, b(0) + 70, 10)
  const oldTag = appear(frame, b(1) + 30, 10) * (1 - appear(frame, b(1) + 110, 8))
  const ownTag = appear(frame, b(1) + 116, 10) * (1 - appear(frame, b(3) + 120, 10))
  const switchAt = b(3) + 120
  const url = frame < switchAt ? OLD_URL : DOMAIN
  const focus = (frame >= b(1) + 20 && frame < b(1) + 100) || (frame >= switchAt && frame < switchAt + 40) ? 1 : 0

  // регистратор и проект — когда камера отъехала (b(2) + 24)
  const reg = appear(frame, b(2) + 28, 12)
  const ver = appear(frame, b(2) + 40, 12)
  const bought = appear(frame, b(2) + 64, 10)
  const flyAt = b(2) + 92
  const fly = trackAt(frame, [
    [flyAt, REG.x + 112, REG.y + Y.row1],
    [flyAt + 28, VER.x + 236, VER.y + Y.row1],
  ])
  const added = appear(frame, flyAt + 28, 8)
  const addedMark = appear(frame, flyAt + 40, 8)

  // DNS-записи у регистратора, сертификат и срок — всё на месте к b(3) + 90 (окно горячей точки)
  const lane = appear(frame, b(3) + 8, 26)
  const lanePill = appear(frame, b(3) + 26, 10)
  const recAt = [b(3) + 40, b(3) + 54]
  const cert = appear(frame, b(3) + 62, 10)
  const certOk = appear(frame, b(3) + 74, 8)
  const wait = appear(frame, b(3) + 70, 10)
  // тариф: бесплатный Hobby — для личных некоммерческих проектов (s81)
  const hobby = appear(frame, b(3) + 78, 10)
  const lock = appear(frame, switchAt, 10)

  // доска 2: страница о продукте — строки по реплике, кнопка, политика
  const rowAt = [b(4) + 60, b(4) + 84, b(4) + 108]
  const tapAt = b(5) + 40
  const board2 = appear(frame, b(4), 10)
  const next = appear(frame, b(5) + 70, 10)
  const nextOn = appear(frame, b(5) + 120, 10)
  const link = appear(frame, b(6) + 10, 10)
  const toPolicy = appear(frame, b(6) + 24, 16)
  const doc = appear(frame, b(6) + 40, 12)
  const headAt = [b(6) + 60, b(6) + 86]
  const askAt = [b(6) + 100, b(6) + 116]

  const you = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(2) + 44, ['think', 'neutral']],
    [b(3) + 40, ['stand', 'happy']],
    [switchAt + 4, ['cheer', 'happy']],
  ])

  // путь DNS-записей: от проекта вниз, влево и вверх к регистратору
  const laneD = `M${VER.x + VER.w / 2} ${VER.y + VER.h + 6} V${DNS_LANE} H${REG.x + REG.w / 2} V${REG.y + REG.h + 8}`

  return (
    <KitScene chip="1 / 4 · Что строим сегодня" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* ---- доска 1: свой домен ---- */}
      <g opacity={betaHead}>
        <Label x={BETA_COL.x} y={BETA_COL.head} size={18} weight={700} color={theme.soft}>
          бета-тест
        </Label>
        {BETA.map((n, i) => (
          <g key={n} opacity={appear(frame, betaAt[i], 8)}>
            <Pill x={BETA_COL.x} y={BETA_COL.y + i * BETA_COL.step} w={104} text={n} color={theme.alt} fill={theme.white} size={20} compact />
            <g opacity={appear(frame, betaOk[i], 8)}>
              <Mark x={BETA_COL.x + 76} y={BETA_COL.y + i * BETA_COL.step} ok r={12} />
            </g>
          </g>
        ))}
      </g>
      <Browser x={BR1.x} y={BR1.y} w={BR1.w} h={BR1.h} at={2} url={url} focus={focus}>
        <g opacity={lock}>
          <Padlock x={242} y={20} />
        </g>
        <g opacity={pageIn(0)}>
          <Label x={24} y={86} anchor="start" size={26} weight={800}>
            Тренер
          </Label>
        </g>
        <g opacity={beta * pageIn(0)}>
          <Pill x={300} y={78} text="бета" color={theme.alt} fill={theme.altTint} size={18} compact />
        </g>
        <g opacity={launch}>
          <Pill x={296} y={78} text="запуск" color={theme.ok} fill={theme.okTint} size={18} compact />
        </g>
        <g opacity={pageIn(1)}>
          <Label x={24} y={120} anchor="start" size={20} color={theme.soft}>
            тренировки и прогресс
          </Label>
        </g>
        <g opacity={pageIn(2)}>
          <rect x={24} y={148} width={140} height={44} rx={10} fill={theme.accent} />
          <Label x={94} y={177} size={20} weight={700} color={theme.white}>
            Войти
          </Label>
        </g>
        <line x1={190} y1={226} x2={336} y2={226} stroke={theme.grid} strokeWidth={2} opacity={pageIn(2)} />
        <polyline points="196,216 226,206 256,198 286,182 316,172 336,160" fill="none" stroke={theme.accent} strokeWidth={3} strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - chart} />
      </Browser>
      <g opacity={oldTag}>
        <Callout x={1062} y={80} tx={1000} ty={124} text="служебный адрес · день 7" color={theme.soft} />
      </g>
      <g opacity={ownTag}>
        <Callout x={1062} y={80} tx={1000} ty={124} text={`свой домен: ${DOMAIN}`} color={theme.ok} fill={theme.okTint} />
      </g>

      {/* регистратор доменов: домен куплен, потом — две DNS-записи */}
      <g opacity={reg}>
        <Card x={REG.x} y={REG.y} w={REG.w} h={REG.h} stroke={theme.alt} fill={theme.white}>
          <Label x={REG.x + 24} y={REG.y + Y.title} anchor="start" size={22} weight={800}>
            Регистратор доменов
          </Label>
          <line x1={REG.x + 16} y1={REG.y + Y.rule} x2={REG.x + REG.w - 16} y2={REG.y + Y.rule} stroke={theme.grid} strokeWidth={2} />
          <Pill x={REG.x + 112} y={REG.y + Y.row1} text={DOMAIN} color={theme.ink} fill={theme.paper} size={22} mono />
          <line x1={REG.x + 16} y1={REG.y + Y.rule2} x2={REG.x + REG.w - 16} y2={REG.y + Y.rule2} stroke={theme.grid} strokeWidth={2} />
        </Card>
        {DNS.map((r, i) => {
          const cy = REG.y + (i === 0 ? Y.row2 : Y.row3)
          return (
            <g key={r.type} opacity={1 - appear(frame, recAt[i], 6)}>
              <Slot x={REG.x + 22} y={cy - 18} w={REG.w - 44} h={36} r={8} color={theme.grid} />
            </g>
          )
        })}
      </g>
      <g opacity={bought}>
        <Mark x={REG.x + 262} y={REG.y + Y.row1} ok r={13} />
        <Label x={REG.x + 284} y={REG.y + Y.row1 + 7} anchor="start" size={20} weight={700} color={theme.ok}>
          куплен
        </Label>
      </g>
      {DNS.map((r, i) => {
        const cy = REG.y + (i === 0 ? Y.row2 : Y.row3)
        return (
          <g key={r.type} opacity={appear(frame, recAt[i], 10)}>
            <Pill x={REG.x + 72} y={cy} w={96} text={r.type} color={theme.accent} fill={theme.accentTint} size={20} mono compact />
            <Mono x={REG.x + 132} y={cy + 7} fill={theme.ink}>
              {r.name}
            </Mono>
            <Arrow x1={REG.x + 270} y1={cy} x2={REG.x + 300} y2={cy} color={theme.line} />
            <Label x={REG.x + 308} y={cy + 7} anchor="start" size={20} weight={700}>
              Vercel
            </Label>
          </g>
        )
      })}

      {/* проект на Vercel: домен добавлен, сертификат https выпущен сам */}
      <Arrow x1={REG.x + REG.w + 6} y1={REG.y + Y.row1} x2={VER.x - 6} y2={VER.y + Y.row1} color={theme.alt} draw={appear(frame, flyAt - 6, 12) * ver} />
      <g opacity={ver}>
        <Card x={VER.x} y={VER.y} w={VER.w} h={VER.h} stroke={theme.accent} fill={theme.white}>
          <Label x={VER.x + 24} y={VER.y + Y.title} anchor="start" size={22} weight={800}>
            Vercel · проект
          </Label>
          <line x1={VER.x + 16} y1={VER.y + Y.rule} x2={VER.x + VER.w - 16} y2={VER.y + Y.rule} stroke={theme.grid} strokeWidth={2} />
          <Label x={VER.x + 24} y={VER.y + Y.row1 + 7} anchor="start" size={20} color={theme.soft}>
            Домены
          </Label>
          <line x1={VER.x + 16} y1={VER.y + Y.rule2} x2={VER.x + VER.w - 16} y2={VER.y + Y.rule2} stroke={theme.grid} strokeWidth={2} />
        </Card>
        <g opacity={1 - added}>
          <Slot x={VER.x + 150} y={VER.y + Y.row1 - 20} w={172} h={40} r={20} color={theme.grid} />
        </g>
        <g opacity={1 - cert}>
          <Slot x={VER.x + 22} y={VER.y + Y.row2 - 18} w={VER.w - 44} h={36} r={8} color={theme.grid} />
        </g>
        <g opacity={1 - hobby}>
          <Slot x={VER.x + 22} y={VER.y + Y.row3 - 18} w={VER.w - 44} h={36} r={8} color={theme.grid} />
        </g>
      </g>
      {frame >= flyAt && frame < flyAt + 28 && <Pill x={fly.x} y={fly.y} text={DOMAIN} color={theme.ink} fill={theme.white} size={22} mono />}
      <g opacity={added}>
        <Pill x={VER.x + 236} y={VER.y + Y.row1} text={DOMAIN} color={theme.accent} fill={theme.accentTint} size={22} mono />
      </g>
      <g opacity={addedMark}>
        <Mark x={VER.x + 344} y={VER.y + Y.row1} ok r={13} />
      </g>
      <g opacity={cert}>
        <Padlock x={VER.x + 36} y={VER.y + Y.row2 - 2} s={1.2} />
        <Label x={VER.x + 60} y={VER.y + Y.row2 + 7} anchor="start" size={20} weight={700}>
          сертификат https — сам
        </Label>
      </g>
      <g opacity={hobby}>
        <Label x={VER.x + 24} y={VER.y + Y.row3 + 7} anchor="start" size={20} color={theme.alt} weight={600}>
          Hobby — для некоммерческих
        </Label>
      </g>
      <g opacity={certOk}>
        <Mark x={VER.x + 344} y={VER.y + Y.row2} ok r={13} />
      </g>

      {/* записи — у регистратора, начинают работать не сразу */}
      <path d={laneD} fill="none" stroke={theme.accent} strokeWidth={3} strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - lane} />
      {lane >= 1 && <path d="M0 0 L-14 -7 L-14 7 Z" fill={theme.accent} transform={`translate(${REG.x + REG.w / 2} ${REG.y + REG.h + 8}) rotate(-90)`} />}
      <g opacity={lanePill}>
        <Pill x={DNS_PILL.x} y={DNS_PILL.y} text="DNS-записи" color={theme.accent} fill={theme.white} size={20} compact />
      </g>
      <g opacity={wait}>
        <Clock x={WAIT_PILL.x - 140} y={WAIT_PILL.y} />
        <Pill x={WAIT_PILL.x} y={WAIT_PILL.y} text="от минут до 48 часов" color={theme.soft} fill={theme.white} size={20} compact />
      </g>

      <Actor x={YOU1.x} y={YOU1.y} scale={0.7} label="Вы" enterAt={b(2) + 36}>
        <Person color={theme.soft} pose={you[0]} mood={you[1]} />
      </Actor>

      {/* ---- доска 2: страница о продукте ---- */}
      <Browser x={BR2.x} y={BR2.y} w={BR2.w} h={BR2.h} at={b(4)} url={DOMAIN}>
        <Padlock x={242} y={20} />
        <Label x={32} y={PAGE.title} anchor="start" size={28} weight={800}>
          Приложение для тренера
        </Label>
        {PAGE_ROWS.map((r, i) => {
          const top = pageRowY(i)
          const on = appear(frame, rowAt[i], 10)
          return (
            <g key={r.q}>
              <g opacity={1 - on}>
                <Slot x={16} y={top} w={ROW_W} h={PAGE.rowH} text={r.q.toLowerCase()} />
              </g>
              <g opacity={on}>
                <rect x={16} y={top} width={ROW_W} height={PAGE.rowH} rx={10} fill={theme.white} stroke={theme.grid} strokeWidth={2.5} />
                <Pill x={110} y={top + PAGE.rowH / 2} w={164} text={r.q} color={theme.accent} fill={theme.accentTint} size={20} compact />
                {r.a && (
                  <Label x={PAGE.valueX} y={top + 40} anchor="start" size={21}>
                    {typed(r.a, frame, rowAt[i] + 6, 40)}
                  </Label>
                )}
              </g>
            </g>
          )
        })}
        <g opacity={appear(frame, rowAt[2] + 6, 10)}>
          <rect x={PAGE.valueX} y={pageRowY(2) + 10} width={140} height={44} rx={10} fill={theme.accent} />
          <Label x={PAGE.valueX + 70} y={pageRowY(2) + 39} size={20} weight={700} color={theme.white}>
            Начать
          </Label>
        </g>
        <Tap cx={PAGE.valueX + 70} cy={pageRowY(2) + 32} at={tapAt} />
        <g opacity={next}>
          <Label x={PAGE.valueX + 160} y={pageRowY(2) + 40} anchor="start" size={20} weight={700} color={theme.accent}>
            → первое знакомство, день 15
          </Label>
        </g>
        <rect x={16} y={pageRowY(2)} width={ROW_W} height={PAGE.rowH} rx={10} fill="none" stroke={theme.accent} strokeWidth={3} opacity={nextOn} />
        <line x1={16} y1={PAGE.footerRule} x2={16 + ROW_W} y2={PAGE.footerRule} stroke={theme.grid} strokeWidth={2} />
        <g opacity={link}>
          <Label x={32} y={PAGE.footer} anchor="start" size={20} weight={600} color={theme.accent}>
            Политика конфиденциальности
          </Label>
          <rect x={32} y={PAGE.footer + 6} width={320} height={2} fill={theme.accent} />
        </g>
      </Browser>
      <Arrow x1={BR2.x + 368} y1={BR2.y + PAGE.footer - 7} x2={POL1.x - 8} y2={BR2.y + PAGE.footer - 7} color={theme.accent} draw={toPolicy} />

      {/* политика конфиденциальности: место — сразу, вопросы — по реплике */}
      <g opacity={board2 * (1 - doc)}>
        <Slot x={POL1.x} y={POL1.y} w={POL1.w} h={POL1.h} r={12} text="политика конфиденциальности" />
      </g>
      <g opacity={doc}>
        <Card x={POL1.x} y={POL1.y} w={POL1.w} h={POL1.h} stroke={theme.ink} fill={theme.white}>
          <Label x={POL1.x + 28} y={POL1.y + 48} anchor="start" size={24} weight={800}>
            Политика
          </Label>
          <Label x={POL1.x + 28} y={POL1.y + 80} anchor="start" size={24} weight={800}>
            конфиденциальности
          </Label>
          <line x1={POL1.x + 20} y1={POL1.y + 100} x2={POL1.x + POL1.w - 20} y2={POL1.y + 100} stroke={theme.grid} strokeWidth={2} />
        </Card>
      </g>
      {['Что храним о людях?', 'Зачем?'].map((h, i) => {
        const top = POL1.y + 142 + i * 132
        return (
          <g key={h} opacity={appear(frame, headAt[i], 10)}>
            <Label x={POL1.x + 28} y={top} anchor="start" size={22} weight={800}>
              {h}
            </Label>
            {[0, 1].map((k) => (
              <Slot key={k} x={POL1.x + 28} y={top + 20 + k * 30} w={POL1.w - 56 - k * 90} h={18} r={6} color={theme.grid} />
            ))}
            <g opacity={appear(frame, askAt[i], 10)}>
              <Label x={POL1.x + POL1.w - 40} y={top + 2} size={34} weight={800} color={theme.risk}>
                ?
              </Label>
            </g>
          </g>
        )
      })}
    </KitScene>
  )
}
