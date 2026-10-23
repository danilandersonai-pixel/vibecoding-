import { interpolate, useCurrentFrame } from 'remotion'
import { Database, type DbRow } from '../../actors/Database'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP, trackAt } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Mark, Pill, Slot } from '../../kit/props'
import { theme } from '../../theme'
import { ANNA_LAST, COPIES, COPIES_H, FRESH_COPY, RESTORE_MIN, S3, STEPS } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Bell, CopyDoc, Night, SafeBox, Tire, Watch } from './parts'

const ID = 's3-restore'
const V = S3.vault
const CP = S3.copies
const ST = S3.steps

// строки баз: в старой копии — данные девятидневной давности, в рабочей и новой копии — вчерашние
const STALE: DbRow[] = [
  { text: 'Анна · 14.10', color: theme.accent },
  { text: 'Олег · 13.10', color: theme.alt },
]
const LIVE: DbRow[] = [
  { text: `Анна · ${ANNA_LAST}`, color: theme.accent },
  { text: `Олег · ${ANNA_LAST}`, color: theme.alt },
]

// Сцена 3 (подводный камень): копии делаются, но из них ни разу не восстанавливали — как непроверенная
// запаска. Пробное восстановление: свежая копия → отдельная тестовая база, рабочую не трогаем; вчерашней
// тренировки Анны нет — копии девять дней. Починили, поставили оповещение, повторили: всё на месте, 25 минут.
export function S3Restore() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // ---- доска 1: копии есть, восстановления не было ----
  const nightly = appear(frame, b(0) + 10, 10)
  const vault = appear(frame, b(0) + 18, 10)
  const docAt = [b(0) + 30, b(0) + 40, b(0) + 50]
  const toSlot = appear(frame, b(0) + 70, 14)
  const slot = appear(frame, b(0) + 60, 10)
  const never = appear(frame, b(0) + 124, 10)

  // запаска: колесо пробито — достали запаску, а она спущена
  const wheels = appear(frame, b(1) + 22, 12)
  const nail = frame >= b(1) + 50
  const wheelFlat = interpolate(frame, [b(1) + 54, b(1) + 72], [0, 1], CLAMP)
  const pierced = appear(frame, b(1) + 66, 10)
  const unsure = appear(frame, b(1) + 30, 10) * (1 - appear(frame, b(1) + 96, 6))
  const spareFlat = interpolate(frame, [b(1) + 98, b(1) + 118], [0, 1], CLAMP)
  const flatPill = appear(frame, b(1) + 112, 10)

  // ---- доска 2: пробное восстановление ----
  const title = appear(frame, b(2) + 30, 10)
  const testIn = b(2) + 36
  const pipe1 = appear(frame, b(2) + 60, 16)
  const fly1 = frame >= b(2) + 64 && frame < b(2) + 96
  const fly2 = frame >= b(7) + 24 && frame < b(7) + 56
  const fly = trackAt(frame, [
    [fly2 ? b(7) + 24 : b(2) + 64, CP.x + CP.w + 10, S3.testDb.y],
    [fly2 ? b(7) + 54 : b(2) + 94, S3.testDb.x - 110, S3.testDb.y],
  ])
  const restored = frame >= b(2) + 98
  const refreshed = frame >= b(7) + 60
  const workIn = b(3) + 2
  const over = appear(frame, b(3) + 12, 18)
  const overNo = appear(frame, b(3) + 40, 8)
  const keep = appear(frame, b(3) + 74, 10)

  // проверка: вчерашней тренировки Анны нет → копии девять дней → починили и оповещение → снова
  const check = appear(frame, b(4) + 36, 10)
  const missing = frame >= b(4) + 118 && !refreshed
  const stale = appear(frame, b(5) + 26, 10)
  const stopped = appear(frame, b(5) + 60, 10)
  const mended = frame >= b(6) + 14
  const alert = appear(frame, b(6) + 34, 10)
  const ring = frame >= b(6) + 40 && frame < b(6) + 110 ? 1 : 0
  const shift = interpolate(frame, [b(7), b(7) + 18], [0, 1], CLAMP)
  const freshIn = appear(frame, b(7) + 12, 10)
  const ok = frame >= b(7) + 70
  const watch = appear(frame, b(7) + 96, 10)
  const watchT = interpolate(frame, [b(7) + 96, b(7) + 150], [0, 0.42], CLAMP)
  const steps = appear(frame, b(8) + 10, 10)
  const workSlot = appear(frame, b(2) + 32, 10) * (1 - appear(frame, b(3) + 2, 8))
  const stepsSlot = appear(frame, b(2) + 44, 10) * (1 - steps)
  const stepAt = [b(8) + 24, b(8) + 36, b(8) + 48]

  // ряды копий: свежая сверху; новая копия встаёт сверху, старые съезжают вниз
  const rowY = (i: number) => CP.y + CP.head + i * CP.row

  return (
    <KitScene chip="3 / 4 · Подводный камень: восстановление" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* ===== доска 1: копии каждую ночь, а восстановить никто не пробовал ===== */}
      <g opacity={nightly}>
        <Pill x={S3.night.x} y={S3.night.y} text="копия каждую ночь ✓" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      <g opacity={vault}>
        <Card x={V.x} y={V.y} w={V.w} h={V.h} stroke={theme.ok} fill={theme.white}>
          <Label x={V.x + 20} y={V.y + 38} anchor="start" size={22} weight={800}>
            Копии
          </Label>
          <SafeBox x={V.x + V.w - 34} y={V.y + 30} s={0.8} />
          <line x1={V.x + 14} y1={V.y + 56} x2={V.x + V.w - 14} y2={V.y + 56} stroke={theme.grid} strokeWidth={2} />
          <Night x={V.x + 40} y={V.y + V.h - 34} r={13} />
          <Label x={V.x + 64} y={V.y + V.h - 27} anchor="start" size={18} color={theme.soft} weight={600}>
            по расписанию
          </Label>
        </Card>
      </g>
      {docAt.map((at, i) => (
        <g key={at} opacity={appear(frame, at, 8)}>
          <CopyDoc x={V.x + 70 + i * 70} y={V.y + 124 - (i % 2) * 10} s={1.1} />
        </g>
      ))}
      <g opacity={slot}>
        <Slot x={S3.slot.x} y={S3.slot.y} w={S3.slot.w} h={S3.slot.h} text="восстановление?" />
      </g>
      <Arrow x1={V.x + V.w + 8} y1={S3.slot.y + S3.slot.h / 2} x2={S3.slot.x - 8} y2={S3.slot.y + S3.slot.h / 2} color={theme.line} dashed draw={toSlot} />
      <g opacity={never}>
        <Pill x={S3.never.x} y={S3.never.y} text="никто ни разу не пробовал" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>

      {/* запаска: что она спущена, узнают, когда колесо уже пробито */}
      <g opacity={wheels}>
        <line x1={S3.wheel.x - 110} y1={S3.wheel.y + S3.wheel.r + 2} x2={S3.spare.x + 110} y2={S3.spare.y + S3.spare.r + 2} stroke={theme.line} strokeWidth={3} />
        <Tire x={S3.wheel.x} y={S3.wheel.y} r={S3.wheel.r} flat={wheelFlat} nail={nail} />
        <Tire x={S3.spare.x} y={S3.spare.y} r={S3.spare.r} flat={spareFlat} />
        <Label x={S3.wheel.x} y={S3.wheel.y + S3.wheel.r + 34} size={20} color={theme.soft} weight={700}>
          колесо
        </Label>
        <Label x={S3.spare.x} y={S3.spare.y + S3.spare.r + 34} size={20} color={theme.soft} weight={700}>
          запаска
        </Label>
      </g>
      <g opacity={unsure}>
        <Pill x={S3.spare.x} y={S3.spare.y - S3.spare.r - 30} text="в порядке?" color={theme.soft} fill={theme.paper} size={20} compact />
      </g>
      <g opacity={pierced}>
        <Pill x={S3.wheel.x} y={S3.wheel.y + S3.wheel.r + 72} text="пробито" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>
      <g opacity={flatPill}>
        <Pill x={S3.spare.x} y={S3.spare.y + S3.spare.r + 72} text="спущена" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>

      {/* ===== доска 2: пробное восстановление ===== */}
      <g opacity={title}>
        <Pill x={S3.title.x} y={S3.title.y} w={300} text="Пробное восстановление" color={theme.accent} fill={theme.accentTint} size={22} />
      </g>
      <Card x={CP.x} y={CP.y} w={CP.w} h={COPIES_H} stroke={theme.ok} fill={theme.white}>
        <Label x={CP.x + 20} y={CP.y + 38} anchor="start" size={22} weight={800}>
          Копии
        </Label>
        <SafeBox x={CP.x + CP.w - 34} y={CP.y + 30} s={0.8} />
        <line x1={CP.x + 14} y1={CP.y + 56} x2={CP.x + CP.w - 14} y2={CP.y + 56} stroke={theme.grid} strokeWidth={2} />
      </Card>
      {COPIES.map((d, i) => {
        const y = rowY(i) + shift * CP.row
        const top = i === 0
        return (
          <g key={d}>
            <rect x={CP.x + 14} y={y + 6} width={CP.w - 28} height={CP.row - 12} rx={8} fill={theme.white} stroke={top && missing ? theme.risk : theme.line} strokeWidth={2.5} />
            <Label x={CP.x + 30} y={y + 33} anchor="start" size={20} weight={600} color={i > 0 ? theme.soft : theme.ink}>
              {`копия ${d}`}
            </Label>
            {top && (
              <g opacity={1 - stale}>
                <Pill x={CP.x + CP.w - 64} y={y + CP.row / 2} w={88} text="свежая" color={theme.ok} fill={theme.okTint} size={18} compact />
              </g>
            )}
            {top && (
              <g opacity={stale}>
                <Pill x={CP.x + CP.w - 64} y={y + CP.row / 2} w={88} text="9 дней" color={theme.risk} fill={theme.riskTint} size={18} compact />
              </g>
            )}
          </g>
        )
      })}
      <g opacity={freshIn}>
        <rect x={CP.x + 14} y={rowY(0) + 6} width={CP.w - 28} height={CP.row - 12} rx={8} fill={theme.okTint} stroke={theme.ok} strokeWidth={2.5} />
        <Label x={CP.x + 30} y={rowY(0) + 33} anchor="start" size={20} weight={700} color={theme.ok}>
          {`копия ${FRESH_COPY}`}
        </Label>
        <Pill x={CP.x + CP.w - 64} y={rowY(0) + CP.row / 2} w={88} text="новая" color={theme.ok} fill={theme.white} size={18} compact />
      </g>
      <g opacity={stopped}>
        <Label x={CP.x + CP.w / 2} y={CP.y + COPIES_H + 28} size={20} weight={700} color={mended ? theme.ok : theme.risk}>
          {mended ? 'копирование починили' : 'копирование остановилось'}
        </Label>
      </g>
      <g opacity={alert}>
        <Bell x={S3.alert.x + 16} y={S3.alert.y + 12} ring={ring} />
        <Label x={S3.alert.x + 50} y={S3.alert.y + 8} anchor="start" size={20} weight={700} color={theme.alt}>
          нет копии за ночь —
        </Label>
        <Label x={S3.alert.x + 50} y={S3.alert.y + 34} anchor="start" size={20} weight={700} color={theme.alt}>
          сразу сообщение
        </Label>
      </g>

      {/* копия → отдельная тестовая база; поверх рабочей — нельзя */}
      <Arrow x1={CP.x + CP.w + 8} y1={S3.testDb.y} x2={S3.testDb.x - 112} y2={S3.testDb.y} color={theme.accent} draw={pipe1} />
      {(fly1 || fly2) && <CopyDoc x={fly.x} y={fly.y} s={0.8} color={fly2 ? theme.ok : theme.alt} />}
      <Database x={S3.testDb.x} y={S3.testDb.y} scale={0.7} label="Тестовая база" enterAt={testIn} rows={refreshed ? LIVE : restored ? STALE : []} />
      <g opacity={workSlot}>
        <Slot x={S3.workDb.x - 100} y={S3.workDb.y - 60} w={200} h={150} text="рабочая база" />
      </g>
      <Database x={S3.workDb.x} y={S3.workDb.y} scale={0.7} label="Рабочая база" enterAt={workIn} rows={LIVE} />
      <g opacity={over}>
        <Arrow x1={CP.x + CP.w + 8} y1={S3.over.y} x2={S3.workDb.x - 104} y2={S3.workDb.y - 58} color={theme.risk} dashed draw={over} />
      </g>
      <g opacity={overNo}>
        <Mark x={S3.workDb.x - 300} y={S3.over.y + 30} ok={false} r={15} />
        <Pill x={S3.workDb.x - 300} y={S3.over.y - 14} text="не поверх рабочей" color={theme.risk} fill={theme.white} size={18} compact />
      </g>
      <g opacity={keep}>
        <Pill x={S3.workDb.x} y={S3.check.y} text="не трогаем" color={theme.accent} fill={theme.accentTint} size={20} compact />
      </g>

      {/* проверка по тому, что точно знаем: вчерашняя тренировка Анны */}
      <g opacity={check}>
        <Pill x={S3.check.x} y={S3.check.y} w={300} text={ok ? `тренировка Анны ${ANNA_LAST} ✓` : missing ? `тренировка Анны ${ANNA_LAST}: нет` : `тренировка Анны ${ANNA_LAST}?`} color={ok ? theme.ok : missing ? theme.risk : theme.ink} fill={ok ? theme.okTint : missing ? theme.riskTint : theme.white} size={20} compact />
      </g>
      <g opacity={watch}>
        <Watch x={S3.watch.x - 120} y={S3.watch.y} r={18} t={watchT} />
        <Pill x={S3.watch.x + 20} y={S3.watch.y} text={`${RESTORE_MIN} минут · пример`} color={theme.ink} fill={theme.white} size={20} compact />
      </g>

      {/* шаги и время записаны */}
      <g opacity={stepsSlot}>
        <Slot x={ST.x} y={ST.y} w={ST.w} h={ST.h} text="шаги и время" />
      </g>
      <g opacity={steps}>
        <Card x={ST.x} y={ST.y} w={ST.w} h={ST.h} stroke={theme.accent} fill={theme.white}>
          <Label x={ST.x + 18} y={ST.y + 32} anchor="start" size={20} weight={800} color={theme.accent}>
            Шаги восстановления
          </Label>
        </Card>
      </g>
      {STEPS.map((s, i) => (
        <g key={s} opacity={appear(frame, stepAt[i], 8)}>
          <Label x={ST.x + 18} y={ST.y + 62 + i * 26} anchor="start" size={18} weight={600}>
            {`${i + 1}. ${s}`}
          </Label>
        </g>
      ))}
    </KitScene>
  )
}
