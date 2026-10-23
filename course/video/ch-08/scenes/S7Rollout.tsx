import { interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { Database } from '../../actors/Database'
import { Person } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP, trackAt } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Mark, Pill } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { Checklist } from '../../kit/screens/Checklist'
import { checklistHeight } from '../../kit/screens/layout'
import { theme } from '../../theme'
import { S7 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Bell, Bug, Padlock, Pie, Toggle, Vault } from './parts'

const ID = 's7-rollout'
const GT = S7.gates
const MO = S7.monitor
const TG = S7.toggle
const FL = S7.fails
const SB = S7.sandbox

// ворота конвейера от коммита до продакшена (рис. 8.11)
const GATES = ['Коммит', 'Линтер, типы', 'Тесты', 'Безопасность', 'Ревью', 'Staging', 'Канарейка', 'Продакшен']
const REVIEW = 4
// шесть историй 2025–2026 годов (s82)
const FAILS = [
  ['Replit · июль 2025', 'агент удалил рабочую базу'],
  ['Tea · июль 2025', 'фото в открытом хранилище'],
  ['Lovable, Moltbook', 'в Supabase выключен RLS'],
  ['s1ngularity · 2025', 'заражённый Nx искал секреты'],
  ['Cline · 2026', 'команда в тексте заявки'],
  ['PocketOS · 2026', 'агент стёр диск и копии'],
]
const RECAP = ['о защите просим прямо', 'проверки в CI: тесты, сканеры, ревью', 'выпуск по шагам: флаг и канарейка', 'откат за минуты, агенту — минимум прав']
// мониторинг: 60 последних замеров, новый — каждые 4 кадра
const SAMPLES = 60
const PCT = ['5%', '25%', '100%']

// Сцена 7: ошибку пропустит и ревью — выпуск строят так, чтобы она задела немногих: ворота, фича-флаг,
// канарейка 5% → 25% → 100% под мониторингом, откат за минуты. Провалы 2025–2026: агенту — минимум прав,
// копии — вне его досягаемости. Итог главы.
export function S7Rollout() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: ворота и изменение с незаметной ошибкой
  const gateX = (i: number) => GT.x + i * (GT.w + GT.gap)
  const gateAt = GATES.map((_, i) => b(0) + i * 5)
  const passAt = GATES.map((_, i) => b(0) + 50 + i * 15)
  const pos = trackAt(
    frame,
    GATES.map((_, i): [number, number, number] => [passAt[i], gateX(i) + GT.w / 2, GT.rail]),
  )
  const moving = appear(frame, b(0) + 44)
  const slipped = appear(frame, passAt[REVIEW] + 8)
  const few = appear(frame, passAt[GATES.length - 1] + 8)

  // доска 1: фича-флаг
  const flagIn = appear(frame, b(1) + 6)
  // до реплики о флаге его место отмечено пунктиром, чтобы под воротами не было пусто
  const flagSpot = appear(frame, b(0) + 40) * (1 - flagIn)
  const flagOn = interpolate(frame, [b(1) + 60, b(1) + 68, b(1) + 116, b(1) + 124], [0, 1, 1, 0], CLAMP)
  const noRelease = appear(frame, b(1) + 80)

  // доска 2: канарейка, мониторинг, откат
  const crowd = appear(frame, b(2) + 6)
  const spike = interpolate(frame, [b(3), b(3) + 40, b(3) + 90, b(3) + 120], [0, 1, 1, 0], CLAMP)
  const ring = frame >= b(3) + 40 && frame < b(3) + 110 ? (frame - b(3) - 40) / 70 : 0
  const back = appear(frame, b(3) + 96)
  const hurt = appear(frame, b(3) + 126)
  const pie = appear(frame, b(4) + 110)
  // сколько тренеров видят новый график
  const lit = frame >= b(4) + 80 ? 20 : frame >= b(4) + 20 ? 5 : frame >= b(2) + 56 && frame < b(3) + 92 ? 1 : 0
  const step = frame >= b(4) + 80 ? 2 : frame >= b(4) + 20 ? 1 : 0
  const canaryOn = frame >= b(2) + 56 && frame < b(3) + 92 ? 1 : frame >= b(4) + 10 ? 1 : 0
  const monitor = appear(frame, b(2) + 90)

  // доска 3: провалы и права агента
  // все шесть историй на доске раньше, чем откроется горячая точка (b(5) + 80)
  const failAt = FAILS.map((_, i) => b(5) + 26 + i * 8)
  const sandbox = appear(frame, b(5) + 100)
  const blocked = appear(frame, b(5) + 124)
  const vault = appear(frame, b(5) + 146)
  const recap = appear(frame, b(6) + 24)

  // замер ошибок: спокойный фон, всплеск после выпуска на 5%, спад после отката
  const value = (f: number) => {
    const calm = 0.18 + 0.06 * Math.sin(f / 7) + 0.03 * Math.sin(f / 3.1)
    const s = interpolate(f, [b(3), b(3) + 40, b(3) + 90, b(3) + 120], [0, 1, 1, 0], CLAMP)
    return calm + s * 0.62
  }
  const last = Math.floor(frame / 4)
  const plot = { x: MO.x + 24, y: MO.y + 70, w: MO.w - 48, h: MO.h - 96 }
  const points = Array.from({ length: SAMPLES }, (_, i) => {
    const f = (last - SAMPLES + 1 + i) * 4
    const v = value(f)
    return `${i === 0 ? 'M' : 'L'}${plot.x + (plot.w * i) / (SAMPLES - 1)} ${plot.y + plot.h * (1 - v)}`
  }).join(' ')
  const limitY = plot.y + plot.h * 0.45

  const agent = stepAt<AgentPose>(frame, [
    [0, 'idle'],
    [b(5) + 110, 'working'],
  ])

  return (
    <KitScene
      chip="7 / 7 · Выпуск по шагам и откат"
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
            <Checklist x={S7.recap.x} y={S7.recap.y} w={S7.recap.w} at={b(6) + 24} items={RECAP} done={RECAP.length} />
          </g>
        ) : undefined
      }
    >
      {/* доска 1: ворота */}
      {GATES.map((g, i) => {
        const passed = frame >= passAt[i] + 4
        const x = gateX(i)
        return (
          <g key={g} opacity={appear(frame, gateAt[i], 10)}>
            <rect x={x} y={GT.y} width={GT.w} height={GT.h} rx={10} fill={passed ? theme.okTint : theme.paper} stroke={passed ? theme.ok : theme.line} strokeWidth={3} />
            <Label x={x + GT.w / 2} y={GT.y + GT.h / 2 + 7} size={18} weight={600} color={i >= 5 ? theme.accent : theme.ink}>
              {g}
            </Label>
          </g>
        )
      })}
      <g opacity={appear(frame, b(0) + 30)}>
        <line x1={GT.x} y1={GT.rail} x2={gateX(7) + GT.w} y2={GT.rail} stroke={theme.grid} strokeWidth={4} strokeDasharray="10 8" />
      </g>
      <g opacity={moving}>
        <rect x={pos.x - 96} y={GT.rail - 22} width={192} height={44} rx={10} fill={theme.paper} stroke={theme.accent} strokeWidth={3} />
        <Label x={pos.x - 20} y={GT.rail + 7} size={20} weight={700} color={theme.accent}>
          новый график
        </Label>
        <Bug x={pos.x + 72} y={GT.rail} s={0.4} />
      </g>
      <g opacity={slipped}>
        <Pill x={gateX(REVIEW) + GT.w / 2} y={GT.rail + 64} text="ошибка проскочила" color={theme.risk} fill={theme.paper} compact />
      </g>
      <g opacity={few}>
        <Pill x={gateX(6) + GT.w} y={GT.rail + 64} text="пусть заденет немногих" color={theme.accent} fill={theme.accentTint} compact />
      </g>

      {/* доска 1: фича-флаг — сначала пунктирное место, потом сам флаг */}
      <g opacity={flagSpot}>
        <rect x={S7.flag.x} y={S7.flag.y} width={S7.flag.w} height={S7.flag.h} rx={12} fill="none" stroke={theme.line} strokeWidth={3} strokeDasharray="10 8" />
        <rect x={S7.flag.x + 24} y={S7.flag.y + 58} width={96} height={48} rx={24} fill={theme.grid} opacity={0.6} />
      </g>
      <g opacity={flagIn}>
        <Card x={S7.flag.x} y={S7.flag.y} w={S7.flag.w} h={S7.flag.h} stroke={theme.accent} />
        <Label x={S7.flag.x + 24} y={S7.flag.y + 40} anchor="start" size={22} weight={700}>
          Фича-флаг · новый график прогресса
        </Label>
        <Toggle x={S7.flag.x + 24} y={S7.flag.y + 58} on={flagOn} />
        <Label x={S7.flag.x + 136} y={S7.flag.y + 90} anchor="start" size={22} weight={600} color={flagOn > 0.5 ? theme.ok : theme.soft}>
          {flagOn > 0.5 ? 'включён — график виден' : 'выключен — график спрятан'}
        </Label>
      </g>
      <g opacity={noRelease}>
        <Pill x={S7.flag.x + S7.flag.w + 130} y={S7.flag.y + 74} text="без новой версии" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>

      {/* доска 2: двадцать тренеров */}
      <g opacity={crowd}>
        <Label x={S7.coaches.x - 30} y={S7.coaches.y - 60} anchor="start" size={22} weight={700}>
          20 тренеров
        </Label>
        {Array.from({ length: 20 }, (_, i) => {
          const x = S7.coaches.x + (i % 10) * S7.coaches.dx
          const y = S7.coaches.y + Math.floor(i / 10) * S7.coaches.dy
          const on = i < lit
          return (
            <g key={i} transform={`translate(${x} ${y}) scale(0.4)`}>
              {on && <circle cx={0} cy={-10} r={92} fill={theme.accentTint} />}
              <Person color={on ? theme.accent : theme.line} mood={on && spike > 0.5 ? 'worried' : 'neutral'} />
            </g>
          )
        })}
      </g>
      {PCT.map((p, i) => (
        <g key={p} opacity={crowd}>
          <Pill x={S7.steps.xs[i]} y={S7.steps.y} w={110} text={p} color={i <= step && canaryOn ? theme.white : theme.accent} fill={i <= step && canaryOn ? theme.accent : theme.paper} size={22} />
          {i < 2 && <Arrow x1={S7.steps.xs[i] + 60} y1={S7.steps.y} x2={S7.steps.xs[i + 1] - 62} y2={S7.steps.y} color={theme.accent} />}
        </g>
      ))}
      <g opacity={crowd}>
        <Card x={TG.x} y={TG.y} w={TG.w} h={TG.h} stroke={theme.accent} />
        <Toggle x={TG.x + 22} y={TG.y + 21} on={canaryOn} />
        <Label x={TG.x + 136} y={TG.y + 54} anchor="start" size={22} weight={600} color={canaryOn ? theme.ok : theme.soft}>
          {canaryOn ? 'флаг включён' : 'флаг выключен'}
        </Label>
      </g>

      {/* доска 2: мониторинг ошибок */}
      <g opacity={monitor}>
        <Card x={MO.x} y={MO.y} w={MO.w} h={MO.h} stroke={spike > 0.5 ? theme.risk : theme.line} />
        <Label x={MO.x + 24} y={MO.y + 40} anchor="start" size={22} weight={700}>
          Мониторинг · ошибки
        </Label>
        <line x1={plot.x} y1={limitY} x2={plot.x + plot.w} y2={limitY} stroke={theme.risk} strokeWidth={2} strokeDasharray="8 6" />
        <line x1={MO.x + 290} y1={MO.y + 33} x2={MO.x + 322} y2={MO.y + 33} stroke={theme.risk} strokeWidth={2} strokeDasharray="8 6" />
        <Label x={MO.x + 330} y={MO.y + 40} anchor="start" size={18} weight={600} color={theme.risk}>
          порог
        </Label>
        <path d={points} fill="none" stroke={spike > 0.3 ? theme.risk : theme.accent} strokeWidth={4} strokeLinejoin="round" />
        <Bell x={MO.x + MO.w - 46} y={MO.y + 36} ring={ring} scale={0.7} />
      </g>
      <g opacity={back}>
        <Pill x={S7.back.x} y={S7.back.y} text="флаг выключен — откат за минуты" color={theme.accent} fill={theme.accentTint} size={20} compact />
      </g>
      <g opacity={hurt * (1 - pie)}>
        <Pill x={S7.hurt.x} y={S7.hurt.y} text="задет 1 тренер из 20, а не все" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      <g opacity={pie}>
        <Pie x={S7.pie.x - 150} y={S7.hurt.y + 18} s={0.8} />
        <Pill x={S7.pie.x + 20} y={S7.hurt.y} text="та же пробная партия" color={theme.alt} fill={theme.paper} size={20} compact />
      </g>

      {/* доска 3: шесть провалов */}
      {FAILS.map(([title, text], i) => {
        const x = FL.x + (i % 3) * (FL.w + FL.gap)
        const y = FL.y + Math.floor(i / 3) * (FL.h + FL.gap)
        return (
          <g key={title} opacity={appear(frame, failAt[i], 10)}>
            <Card x={x} y={y} w={FL.w} h={FL.h} stroke={theme.risk} />
            <Label x={x + 22} y={y + 40} anchor="start" size={21} weight={700} color={theme.risk}>
              {title}
            </Label>
            <Label x={x + 22} y={y + 80} anchor="start" size={21} weight={500}>
              {text}
            </Label>
          </g>
        )
      })}

      {/* доска 3: права агента */}
      <g opacity={sandbox}>
        <rect x={SB.x} y={SB.y} width={SB.w} height={SB.h} rx={14} fill={theme.accentTint} stroke={theme.accent} strokeWidth={3} strokeDasharray="10 8" />
        <Pill x={SB.x + SB.w / 2} y={SB.y} text="минимум прав" color={theme.accent} fill={theme.paper} size={20} compact />
      </g>
      {frame >= b(5) + 100 && <Agent x={SB.x + SB.w / 2} y={SB.y + 96} scale={0.55} enterAt={b(5) + 100} pose={agent} />}
      <g opacity={blocked}>
        <Arrow x1={SB.x + SB.w + 10} y1={S7.prod.y - 20} x2={S7.prod.x - 120} y2={S7.prod.y - 20} color={theme.risk} dashed />
        <Mark x={(SB.x + SB.w + S7.prod.x - 110) / 2} y={S7.prod.y - 20} ok={false} r={18} />
        <Database x={S7.prod.x} y={S7.prod.y} scale={0.55} label="Боевая база" />
        <Padlock x={S7.prod.x + 90} y={S7.prod.y - 50} scale={0.7} />
      </g>
      <g opacity={vault}>
        <Vault x={S7.vault.x} y={S7.vault.y + 40} />
        <Pill x={S7.vault.x} y={S7.vault.y + 66} text="резервные копии — вне досягаемости" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
    </KitScene>
  )
}
