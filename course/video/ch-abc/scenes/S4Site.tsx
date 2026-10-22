import { interpolate, useCurrentFrame } from 'remotion'
import { Client } from '../../actors/Client'
import { Coach } from '../../actors/Coach'
import { Packet } from '../../actors/Packet'
import type { Mood, Pose } from '../../actors/Person'
import { Phone } from '../../actors/Phone'
import { Server } from '../../actors/Server'
import { useAppear, useTrack } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { CLAMP } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Browser, Cloud, Pill, Slot } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { Terminal } from '../../kit/screens/Terminal'
import { theme } from '../../theme'
import { S4 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'

const ID = 's4-site'
const ENVS = [
  { title: 'Разработка', sub: 'ваш компьютер', note: 'ломайте смело', color: theme.ok, slot: 'разработка' },
  { title: 'Тестовое (staging)', sub: 'копия боевой версии', note: 'всё проверяют', color: theme.alt, slot: 'тестовое' },
  { title: 'Продакшен', sub: 'настоящее приложение', note: 'ошибка — дорого', color: theme.risk, slot: 'продакшен' },
]

// Ноутбук: экран с кодом; (x, y) — левый верхний угол экрана.
function Laptop({ x, y, w = 200, h = 120 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={theme.paper} stroke={theme.ink} strokeWidth={4} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={x + 18 + (i % 2) * 18} y={y + 20 + i * 22} width={w - 60 - (i % 3) * 30} height={8} rx={4} fill={i === 1 ? theme.accent : theme.grid} />
      ))}
      <path d={`M${x - 22} ${y + h + 18} L${x} ${y + h} H${x + w} L${x + w + 22} ${y + h + 18} Z`} fill={theme.ink} />
    </g>
  )
}

// Страница сайта в браузере: подходы Анны и кнопка.
function SitePage({ shown }: { shown: number }) {
  return (
    <g opacity={shown}>
      <text x={32} y={92} fill={theme.ink} style={{ font: `700 26px ${theme.font}` }}>
        Подходы Анны
      </text>
      {['жим · 60 кг × 8', 'присед · 70 кг × 6'].map((t, i) => (
        <g key={t}>
          <rect x={32} y={116 + i * 52} width={300} height={40} rx={8} fill={theme.paper} stroke={theme.grid} strokeWidth={2} />
          <text x={48} y={143 + i * 52} fill={theme.ink} style={{ font: `500 20px ${theme.font}` }}>
            {t}
          </text>
        </g>
      ))}
      <rect x={32} y={232} width={240} height={46} rx={10} fill={theme.accent} />
      <text x={152} y={262} textAnchor="middle" fill={theme.paper} style={{ font: `600 20px ${theme.font}` }}>
        Сохранить подход
      </text>
    </g>
  )
}

// Экран телефона с сайтом myapp.ru; updated — плашка «обновлено».
// Телефон в масштабе PHONE_UP: текст 16 px на экране телефона — не мельче 18 px в кадре.
const PHONE_UP = 1.15
const PF = 16
function SitePhone({ updated }: { updated: number }) {
  return (
    <g>
      <text y={-66} textAnchor="middle" fill={theme.soft} style={{ font: `500 ${PF}px ${theme.mono}` }}>
        myapp.ru
      </text>
      <text x={-44} y={-30} fill={theme.ink} style={{ font: `700 ${PF}px ${theme.font}` }}>
        Подходы
      </text>
      <rect x={-44} y={-16} width={88} height={18} rx={4} fill={theme.grid} />
      <rect x={-44} y={8} width={88} height={18} rx={4} fill={theme.grid} />
      <g opacity={updated}>
        <rect x={-48} y={40} width={96} height={30} rx={8} fill={theme.okTint} stroke={theme.ok} strokeWidth={2} />
        <text y={60} textAnchor="middle" fill={theme.ok} style={{ font: `600 ${PF}px ${theme.font}` }}>
          обновлено
        </text>
      </g>
    </g>
  )
}

// Сцена 4: от компьютера к сайту — запуск на localhost, три окружения и цена ошибки, деплой на хостинг.
// Места всех трёх окружений подписаны сразу, как прозвучало «окружений три»; перед переездом к деплою
// окружения гаснут — по дороге камеры они прошли бы под субтитрами.
export function S4Site() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()
  const B = S4.browser

  const laptop = useAppear(b(0) + 5)
  const ready = b(0) + 96
  const page = useAppear(ready + 4)
  const toBrowser = interpolate(frame, [b(1) + 10, b(1) + 30], [0, 1], CLAMP)
  const local = useAppear(b(1) + 20)
  const onlyYou = useAppear(b(1) + 80)

  const envOn = [useAppear(b(2) + 20), useAppear(b(3)), useAppear(b(4))]
  const noteOn = [useAppear(b(2) + 95), useAppear(b(3) + 90), useAppear(b(5) + 10)]
  const devLaptop = useAppear(b(2) + 50)
  const checked = interpolate(frame, [b(3) + 40, b(3) + 60], [0, 1], CLAMP)
  const released = interpolate(frame, [b(4) + 30, b(4) + 50], [0, 1], CLAMP)
  const cost = interpolate(frame, [b(5) + 10, b(5) + 70], [0, 1], CLAMP)
  const early = useAppear(b(5) + 90)
  const envOut = interpolate(frame, [b(6) - 8, b(6) + 2], [1, 0], CLAMP)

  const title = useAppear(b(6) + 20)
  const cloud = useAppear(b(6) + 20)
  const build = useAppear(b(6) + 40)
  const host = useAppear(b(6) + 60)
  const domain = useAppear(b(6) + 95)
  const linked = useAppear(b(7) + 10)
  const newCommit = useAppear(b(7) + 30)
  const updated = useAppear(b(7) + 118)
  const P = S4.phones
  const flow = useTrack([
    [b(7) + 40, S4.cloud.x + S4.cloud.w / 2, 270],
    [b(7) + 65, S4.build.x + S4.build.w / 2, 270],
    [b(7) + 90, S4.host.x, 270],
    [b(7) + 115, (P[0] + P[1]) / 2, 270],
  ])

  // Марина и Анна в продакшене: появляются → радуются обновлению
  const people = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(4) + 60, ['cheer', 'happy']],
    [b(4) + 110, ['stand', 'happy']],
    [b(5), ['think', 'worried']],
    [b(5) + 90, ['stand', 'neutral']],
  ])

  return (
    <KitScene chip="4 / 6 · От компьютера к сайту" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* вверху: запуск на своём компьютере */}
      <Terminal
        x={S4.term.x}
        y={S4.term.y}
        w={S4.term.w}
        at={b(0) + 60}
        lines={[
          { text: 'npm run dev', kind: 'cmd' },
          { text: 'Ready: http://localhost:3000', kind: 'ok' },
        ]}
      />
      <g opacity={laptop}>
        <Laptop x={S4.laptop.x} y={S4.laptop.y} />
        <Label x={S4.laptop.x + 100} y={S4.laptop.y + 176} size={20} color={theme.soft} weight={600}>
          ваш компьютер
        </Label>
      </g>
      <g opacity={local}>
        <text x={340} y={300} style={{ font: `700 26px ${theme.mono}` }} fill={theme.accent}>
          localhost
        </text>
        <Label x={340} y={336} anchor="start" size={22} weight={500}>
          = «этот компьютер»
        </Label>
      </g>
      <g opacity={onlyYou}>
        <ellipse cx={356} cy={382} rx={18} ry={11} fill="none" stroke={theme.ink} strokeWidth={3} />
        <circle cx={356} cy={382} r={5} fill={theme.ink} />
        <Label x={384} y={390} anchor="start" size={22} color={theme.accent} weight={700}>
          видите только вы
        </Label>
      </g>
      <Browser x={B.x} y={B.y} w={B.w} h={B.h} at={b(0) + 10} url={frame >= ready ? 'localhost:3000' : ''} focus={toBrowser}>
        <g opacity={1 - page}>
          <text x={B.w / 2} y={B.h / 2 + 20} textAnchor="middle" fill={theme.soft} style={{ font: `500 22px ${theme.font}` }}>
            сайт ещё не запущен
          </text>
        </g>
        <SitePage shown={page} />
      </Browser>
      <Arrow x1={S4.term.x + S4.term.w + 6} y1={186} x2={B.x + 60} y2={B.y + 34} color={theme.accent} draw={toBrowser} />

      {/* под кадром: три окружения и цена ошибки */}
      <g opacity={envOut}>
        {/* места тестового и продакшена — сразу с первой карточкой */}
        {[1, 2].map((i) => (
          <g key={i} opacity={envOn[0] * (1 - envOn[i])}>
            <Slot x={S4.envX[i]} y={S4.envY} w={S4.envW} h={S4.envH} r={12} text={ENVS[i].slot} />
          </g>
        ))}
        <g opacity={envOn[0]}>
          <Label x={640} y={S4.envY - 40} size={28} weight={700}>
            Окружения
          </Label>
        </g>
        {ENVS.map((e, i) => {
          const x = S4.envX[i]
          const y = S4.envY
          const w = S4.envW
          return (
            <g key={e.title} opacity={envOn[i]} transform={`translate(0 ${(1 - envOn[i]) * 16})`}>
              <Card x={x} y={y} w={w} h={S4.envH} stroke={e.color}>
                <Label x={x + w / 2} y={y + 42} size={26} weight={700}>
                  {e.title}
                </Label>
                <Label x={x + w / 2} y={y + 74} size={20} color={theme.soft} weight={500}>
                  {e.sub}
                </Label>
                <g opacity={noteOn[i]}>
                  <Label x={x + w / 2} y={y + 238} size={22} color={e.color} weight={700}>
                    {e.note}
                  </Label>
                </g>
              </Card>
            </g>
          )
        })}
        <g opacity={devLaptop}>
          <Laptop x={S4.envX[0] + 100} y={S4.envY + 100} w={120} h={74} />
        </g>
        <g opacity={envOn[1]}>
          <Server x={S4.envX[1] + S4.envW / 2} y={S4.envY + 150} scale={0.5} label="" />
          <Label x={S4.envX[1] + S4.envW / 2 + 70} y={S4.envY + 130} anchor="start" size={20} color={theme.alt} weight={700}>
            копия
          </Label>
        </g>
        {frame >= b(4) && (
          <g>
            <Coach x={S4.envX[2] + 105} y={S4.envY + 136} scale={0.55} color={theme.accent} label="Марина" enterAt={b(4) + 30} pose={people[0]} mood={people[1]} />
            <Client x={S4.envX[2] + 215} y={S4.envY + 136} scale={0.55} color={theme.accent} label="Анна" enterAt={b(4) + 40} pose={people[0]} mood={people[1]} />
          </g>
        )}
        <Arrow x1={S4.envX[0] + S4.envW + 10} y1={S4.envY + 130} x2={S4.envX[1] - 10} y2={S4.envY + 130} color={theme.alt} draw={checked} />
        <Arrow x1={S4.envX[1] + S4.envW + 10} y1={S4.envY + 130} x2={S4.envX[2] - 10} y2={S4.envY + 130} color={theme.risk} draw={released} />
        <g opacity={checked}>
          <Label x={(S4.envX[0] + S4.envW + S4.envX[1]) / 2} y={S4.envY + 110} size={18} color={theme.soft} weight={600}>
            проверили
          </Label>
        </g>
        <g opacity={released}>
          <Label x={(S4.envX[1] + S4.envW + S4.envX[2]) / 2} y={S4.envY + 110} size={18} color={theme.soft} weight={600}>
            выпустили
          </Label>
        </g>
        <g opacity={cost > 0 ? 1 : 0}>
          <Label x={50} y={S4.costY - 14} anchor="start" size={20} color={theme.soft} weight={600}>
            цена ошибки
          </Label>
          {[theme.ok, theme.alt, theme.risk].map((c, i) => {
            const w = 1180 / 3
            const part = Math.min(1, Math.max(0, cost * 3 - i))
            return <rect key={c} x={50 + i * w} y={S4.costY} width={w * part} height={22} fill={c} rx={i === 0 || i === 2 ? 11 : 0} />
          })}
          <Label x={50} y={S4.costY + 52} anchor="start" size={20} color={theme.ok} weight={700}>
            низкая
          </Label>
          <g opacity={cost >= 1 ? 1 : 0}>
            <Label x={1230} y={S4.costY + 52} anchor="end" size={20} color={theme.risk} weight={700}>
              высокая
            </Label>
          </g>
        </g>
        <g opacity={early}>
          <Pill x={480} y={S4.costY + 44} w={320} text="← проверяйте раньше" color={theme.accent} fill={theme.accentTint} />
        </g>
      </g>

      {/* справа: деплой */}
      <g opacity={title}>
        <Label x={1920} y={100} size={28} weight={700}>
          Деплой — выложить в интернет
        </Label>
      </g>
      <g opacity={cloud}>
        <Cloud x={S4.cloud.x} y={S4.cloud.y} w={S4.cloud.w} h={S4.cloud.h} stroke={theme.accent} />
        <Label x={S4.cloud.x + S4.cloud.w / 2} y={S4.cloud.y + 104} size={24} weight={700}>
          GitHub
        </Label>
        <Label x={S4.cloud.x + S4.cloud.w / 2} y={S4.cloud.y + 136} size={18} color={theme.accent} weight={600}>
          репозиторий
        </Label>
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={S4.cloud.x + 80 + i * 34} cy={S4.cloud.y + 60} r={7} fill={theme.accent} opacity={i < 3 ? 1 : newCommit} />
        ))}
      </g>
      <Arrow x1={S4.cloud.x + S4.cloud.w + 6} y1={270} x2={S4.build.x - 8} y2={270} draw={build} />
      <g opacity={build}>
        <Card x={S4.build.x} y={S4.build.y} w={S4.build.w} h={S4.build.h}>
          <Label x={S4.build.x + S4.build.w / 2} y={S4.build.y + 36} size={22} weight={700}>
            сборка
          </Label>
          <Label x={S4.build.x + S4.build.w / 2} y={S4.build.y + 64} size={18} color={theme.soft} weight={500}>
            код компактнее
          </Label>
        </Card>
      </g>
      <Arrow x1={S4.build.x + S4.build.w + 8} y1={270} x2={S4.host.x - 82} y2={270} draw={host} />
      <Server x={S4.host.x} y={S4.host.y} label="Хостинг" enterAt={b(6) + 60} />
      <g opacity={domain}>
        <Label x={S4.host.x - 96} y={S4.domainY + 7} anchor="end" size={20} color={theme.soft} weight={600}>
          домен
        </Label>
        <Pill x={S4.host.x} y={S4.domainY} w={170} text="myapp.ru" mono />
      </g>
      <Arrow x1={S4.host.x + 82} y1={270} x2={P[0] - 80} y2={270} draw={useAppear(b(6) + 110)} />
      {P.map((x, i) => (
        <Phone key={x} x={x} y={S4.phoneY} scale={PHONE_UP} label={i === 0 ? 'Марина' : 'Анна'} enterAt={b(6) + 110 + i * 10}>
          <SitePhone updated={updated} />
        </Phone>
      ))}
      <g opacity={linked}>
        <Label x={1920} y={510} size={22} color={theme.ok} weight={700}>
          репозиторий подключён: изменение → сайт обновился
        </Label>
      </g>
      {frame >= b(7) + 40 && frame < b(7) + 118 && <Packet x={flow.x} y={flow.y} scale={0.8} text="изменение" color={theme.accent} />}
    </KitScene>
  )
}
