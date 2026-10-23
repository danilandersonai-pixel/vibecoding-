import { interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import type { Mood, Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Browser, Mark, Pill, Slot } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { theme } from '../../theme'
import { ANNA, CHECKS, LIST_H, mayRead, opens, PHOTOS, photoPath, S4, SIGNED_MIN } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { PhotoThumb, Someone, TickRow, Timer, Toggle, Trash } from './parts'

const ID = 's4-check'
const L = S4.list
const W = S4.win
const CH = 12 // ширина знака моноширинного шрифта 20 px
const FILE = photoPath(PHOTOS[2])
const PANEL_URL = 'supabase.com/dashboard'

const mono = { font: `500 20px ${theme.mono}`, whiteSpace: 'pre' as const, fontVariantLigatures: 'none' as const }

// Сцена 4 (проверьте у себя): в панели хранилище приватное; адрес фото в окне инкогнито открывается,
// пока ссылка свежая, а через 5 минут — ошибка; второй пользователь (как в день 4) получает отказ;
// удалённого файла нет, старая ссылка не открывается; аудит дня 6 с хранилищами; открылось чужое —
// чинить до запуска, что бы ни говорил агент.
export function S4Check() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()
  const a = (at: number, len = 10) => appear(frame, at, len)

  // что показывает окно: панель, окно инкогнито, вход вторым пользователем, снова панель
  const view = stepAt<'panel' | 'incognito' | 'second' | 'deleted'>(frame, [
    [0, 'panel'],
    [b(1) + 20, 'incognito'],
    [b(3) + 16, 'second'],
    [b(4) + 10, 'deleted'],
  ])
  const swap = (at: number) => a(at, 8)

  // панель: переключатель «публичное» выключен
  const ring = a(b(0) + 30) * (1 - a(b(0) + 110))
  const offOk = a(b(0) + 70)
  const privatePill = a(b(0) + 100)

  // окно инкогнито: адрес набирается, фото видно; через 5 минут — ошибка
  const url = `…/${FILE}?token=…`
  const photo = a(b(1) + 60) * (1 - a(b(2) + 90))
  const seen = a(b(1) + 90) * (1 - a(b(2) + 90))
  const timer = a(b(1) + 60)
  const left = 1 - interpolate(frame, [b(2) + 10, b(2) + 70], [0, 1], CLAMP)
  const reload = frame >= b(2) + 80 && frame < b(2) + 98 ? (frame - b(2) - 80) / 18 : 0
  const expired = a(b(2) + 90)
  const fresh = opens('private', { kind: 'signed', ageMin: 0 })
  const late = opens('private', { kind: 'signed', ageMin: SIGNED_MIN })

  // второй пользователь: отказ
  const login = a(b(3) + 30)
  const refused = a(b(3) + 60)

  // удаление: строка файла зачёркнута и исчезает, старая ссылка не открывается
  const trash = a(b(4) + 20) * (1 - a(b(4) + 70))
  const strike = interpolate(frame, [b(4) + 40, b(4) + 52], [0, 1], CLAMP)
  const fileGone = a(b(4) + 60, 12)
  const oldLink = a(b(4) + 96)

  // чек-лист: место после отъезда камеры, отметки — по репликам
  const list = a(b(1) + 4)
  const tickAt = [b(1) + 20, b(1) + 150, b(2) + 110, b(3) + 120, b(4) + 110]

  // аудит из дня 6 и вывод
  const audit = a(b(5) + 40)
  const auditRows = [a(b(5) + 70), a(b(5) + 100)]
  const opened = a(b(6) + 10)
  const broken = a(b(6) + 60)
  const fix = a(b(6) + 120)

  const you = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(1) + 30, ['point', 'neutral']],
    [b(3), ['stand', 'neutral']],
    [b(4) + 10, ['point', 'neutral']],
    [b(5), ['think', 'neutral']],
    [b(6) + 60, ['surprised', 'worried']],
    [b(6) + 120, ['point', 'neutral']],
  ])
  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(5) + 20, 'working'],
    [b(5) + 70, 'done'],
  ])

  const panelFiles = view === 'panel' || view === 'deleted'
  const shownUrl = view === 'incognito' ? typed(url, frame, b(1) + 24, 40) : view === 'second' ? `…/${FILE}` : PANEL_URL

  return (
    <KitScene chip="4 / 4 · Проверьте у себя" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* окно проверки */}
      <Browser x={W.x} y={W.y} w={W.w} h={W.h} at={4} url={shownUrl} focus={view === 'incognito' ? 1 : 0}>
        {panelFiles && (
          <g opacity={view === 'deleted' ? swap(b(4) + 10) : 1}>
            <Label x={24} y={80} anchor="start" size={22} weight={800}>
              Хранилище · photos
            </Label>
            <rect x={20} y={98} width={W.w - 40} height={56} rx={10} fill={theme.white} stroke={theme.line} strokeWidth={2} />
            <Label x={40} y={133} anchor="start" size={20} weight={600}>
              публичное
            </Label>
            <rect x={W.w - 132} y={110} width={60} height={32} rx={16} fill="none" stroke={theme.accent} strokeWidth={3} opacity={ring} />
            <Toggle x={W.w - 126} y={126} on={false} />
            <g opacity={offOk}>
              <Mark x={W.w - 44} y={126} ok r={14} />
            </g>
            <path d={`M24 ${180} h14 l5 6 h19 v20 h-38 Z`} fill={theme.altTint} stroke={theme.alt} strokeWidth={2.5} strokeLinejoin="round" />
            <text x={72} y={202} fill={theme.ink} style={mono}>
              {`${ANNA}/`}
            </text>
            {PHOTOS.map((d, i) => {
              const last = i === PHOTOS.length - 1
              const y = 236 + i * 30
              const deleting = view === 'deleted' && last
              return (
                <g key={d} opacity={deleting ? 1 - fileGone : 1}>
                  <text x={44} y={y} fill={theme.ink} style={mono}>
                    {`${d}.jpg`}
                  </text>
                  {deleting && <line x1={40} y1={y - 7} x2={40 + (14 * CH + 8) * strike} y2={y - 7} stroke={theme.risk} strokeWidth={3} opacity={strike > 0 ? 1 : 0} />}
                </g>
              )
            })}
            <g opacity={privatePill}>
              <Pill x={W.w - 96} y={214} text="приватное" color={theme.ok} fill={theme.okTint} size={20} compact />
            </g>
            {view === 'deleted' && (
              <>
                <g opacity={trash}>
                  <Trash x={240} y={295} />
                </g>
                <g opacity={oldLink}>
                  <Mark x={W.w - 210} y={262} ok={opens('private', { kind: 'signed', ageMin: 0 }, false)} r={14} />
                  <Label x={W.w - 188} y={269} anchor="start" size={20} weight={700} color={theme.risk}>
                    старая ссылка
                  </Label>
                  <Label x={W.w - 188} y={297} anchor="start" size={20} weight={600} color={theme.risk}>
                    не открывается
                  </Label>
                </g>
              </>
            )}
          </g>
        )}

        {view === 'incognito' && (
          <g opacity={swap(b(1) + 20)}>
            <Pill x={86} y={72} text="инкогнито" color={theme.soft} fill={theme.white} size={18} compact />
            <g opacity={photo}>
              <PhotoThumb x={170} y={92} w={150} h={176} />
            </g>
            <g opacity={seen * (fresh ? 1 : 0)}>
              <Mark x={190} y={292} ok r={14} />
              <Label x={212} y={299} anchor="start" size={20} weight={700} color={theme.ok}>
                фото видно
              </Label>
            </g>
            <g opacity={timer}>
              <Timer x={W.w - 90} y={170} r={40} left={left} label={`${Math.ceil(left * SIGNED_MIN)} мин`} />
            </g>
            {reload > 0 && <circle cx={W.w - 90} cy={170} r={44 + reload * 30} fill="none" stroke={theme.accent} strokeWidth={3} opacity={1 - reload} />}
            <g opacity={expired * (late ? 0 : 1)}>
              <Mark x={190} y={180} ok={false} r={26} />
              <Label x={110} y={248} anchor="start" size={20} weight={700} color={theme.risk}>
                Ошибка: срок ссылки истёк
              </Label>
            </g>
          </g>
        )}

        {view === 'second' && (
          <g opacity={swap(b(3) + 16)}>
            <g opacity={login}>
              <Pill x={100} y={72} text="вход: тест 2" color={theme.soft} fill={theme.white} size={18} compact />
            </g>
            <g opacity={refused * (mayRead('тест 2', ANNA) ? 0 : 1)}>
              <Mark x={W.w / 2} y={170} ok={false} r={30} />
              <Label x={W.w / 2} y={244} size={22} weight={700} color={theme.risk}>
                Отказ: нет доступа
              </Label>
            </g>
          </g>
        )}
      </Browser>

      {/* чек-лист: пять проверок */}
      <g opacity={list}>
        <Card x={L.x} y={L.y} w={L.w} h={LIST_H} fill={theme.white}>
          <Label x={L.x + 24} y={L.y + 42} anchor="start" size={24} weight={800}>
            Проверьте у себя
          </Label>
        </Card>
        {CHECKS.map((c, i) => (
          <TickRow key={c} x={L.x + 24} y={L.y + L.head + i * L.row + 8} text={c} at={tickAt[i]} />
        ))}
      </g>

      {/* вы, второй тестовый пользователь, агент с аудитом */}
      <Someone x={S4.you.x} y={S4.you.y} scale={0.5} label="Вы" enterAt={b(1) + 10} pose={you[0]} mood={you[1]} />
      <Someone x={S4.test2.x} y={S4.test2.y} scale={0.5} label="тест 2" enterAt={b(3) + 10} color={theme.line} pose={frame >= b(3) + 30 ? 'point' : 'stand'} />
      <g opacity={opened}>
        <Pill x={535} y={471} w={250} text="открылось чужое?" color={theme.soft} fill={theme.white} size={18} compact />
      </g>
      <g opacity={broken}>
        <Pill x={535} y={507} w={250} text="правило не работает" color={theme.risk} fill={theme.white} size={18} compact />
      </g>
      <g opacity={fix}>
        <Pill x={535} y={543} w={250} text="чините до запуска" color={theme.risk} fill={theme.riskTint} size={18} compact />
      </g>
      <g opacity={list * (1 - audit)}>
        <Slot x={830} y={440} w={390} h={104} text="аудит из дня 6" />
      </g>
      <Agent x={S4.agent.x} y={S4.agent.y} scale={0.5} enterAt={b(5) + 10} pose={agent} />
      <g opacity={audit}>
        <Card x={830} y={440} w={390} h={104} fill={theme.white}>
          <Label x={850} y={468} anchor="start" size={20} weight={800}>
            Аудит из дня 6 · хранилища
          </Label>
        </Card>
        <g opacity={auditRows[0]}>
          <Label x={850} y={498} anchor="start" size={20} weight={600}>
            photos — приватное
          </Label>
          <Mark x={1196} y={491} ok r={12} />
        </g>
        <g opacity={auditRows[1]}>
          <Label x={850} y={530} anchor="start" size={20} weight={600}>
            {`папка ${ANNA}: Анна и тренер`}
          </Label>
          <Mark x={1196} y={523} ok r={12} />
        </g>
      </g>
    </KitScene>
  )
}
