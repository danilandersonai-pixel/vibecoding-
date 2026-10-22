import { interpolate, useCurrentFrame } from 'remotion'
import type { Mood, Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP, trackAt } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Mark, Pill } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { theme } from '../../theme'
import { S1 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Chef, MiniPhone, Plate, Pot } from './parts'

const ID = 's1-taste'
const R = S1.rest
const H = S1.home
const N = S1.note
const RC = S1.recipe

const RECIPE = ['томат и персик', 'жареный миндаль', 'листья базилика']
// строки записи вкуса: базовая линия от верха карточки
const NOTE_Y = [76, 112, 148]
// плашка вкуса садится на свою строку записи
const pillW = (text: string) => text.length * 20 * 0.56 + 28
const FWD = [
  { title: 'Идея', sub: 'что хочу сделать' },
  { title: 'Описание', sub: 'спецификация' },
  { title: 'Код', sub: 'пишет агент' },
  { title: 'Продукт', sub: 'работает у людей' },
]
// обратный путь идёт справа налево: эталон → разбор → своё описание
const REV = [
  { col: 3, title: 'Эталон', sub: 'чужой продукт' },
  { col: 2, title: 'Разбор', sub: 'экраны, данные' },
  { col: 1, title: 'Своё описание', sub: 'своими словами' },
]

function Box({ x, y, title, sub, color, fill, on, dashed, subColor }: { x: number; y: number; title: string; sub: string; color: string; fill: string; on: number; dashed?: boolean; subColor?: string }) {
  return (
    <g opacity={on} transform={`translate(0 ${(1 - on) * 12})`}>
      <rect x={x} y={y} width={S1.boxW} height={S1.boxH} rx={14} fill={fill} stroke={color} strokeWidth={3} strokeDasharray={dashed ? '9 7' : undefined} />
      <Label x={x + S1.boxW / 2} y={y + 36} size={24} weight={700} color={dashed ? theme.soft : theme.ink}>
        {title}
      </Label>
      <Label x={x + S1.boxW / 2} y={y + 66} size={18} weight={500} color={subColor ?? theme.soft}>
        {sub}
      </Label>
    </g>
  )
}

// Сцена 1 (метафора): повар пробует блюдо в чужом ресторане, записывает вкус своими словами
// и дома готовит своё. Обратная инженерия — тот же путь: от готового продукта к своему описанию.
export function S1Taste() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // повар: пробует → думает → записывает → идёт домой → готовит → радуется
  const chefPos = trackAt(frame, [
    [b(2) + 4, S1.chef.x, S1.chef.y],
    [b(2) + 44, S1.chefHome.x, S1.chefHome.y],
  ])
  const walking = frame > b(2) + 4 && frame < b(2) + 44
  const bob = walking ? -Math.abs(Math.sin(frame / 3)) * 6 : 0
  const chef = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(0) + 25, ['point', 'neutral']],
    [b(0) + 55, ['think', 'happy']],
    [b(0) + 95, ['point', 'neutral']],
    [b(0) + 125, ['think', 'happy']],
    [b(1), ['stand', 'neutral']],
    [b(1) + 60, ['think', 'neutral']],
    [b(2), ['stand', 'neutral']],
    [b(2) + 50, ['point', 'neutral']],
    [b(2) + 125, ['cheer', 'happy']],
  ])
  const tasting = chef[0] === 'point' && frame < b(1)
  const cooking = frame >= b(2) + 50 && frame < b(2) + 95

  // вкусы: появляются над поваром, потом улетают в запись на своей кухне
  const tasteIn = [b(0) + 55, b(0) + 95, b(0) + 135]
  const flyAt = (i: number) => b(1) + 70 + i * 12
  // на чужую кухню — нет
  const toDoor = interpolate(frame, [b(1) + 5, b(1) + 30], [0, 1], CLAMP)
  const noDoor = appear(frame, b(1) + 32)
  const note = appear(frame, b(1) + 55)
  // своя кухня: рецепт, кастрюля, блюдо со своим именем
  const toRecipe = interpolate(frame, [b(2) + 20, b(2) + 38], [0, 1], CLAMP)
  const recipe = appear(frame, b(2) + 30)
  const pot = appear(frame, b(2) + 50)
  const dish = trackAt(frame, [
    [b(2) + 95, S1.pot.x, S1.pot.y - 20],
    [b(2) + 120, S1.dish.x, S1.dish.y],
  ])
  const dishIn = appear(frame, b(2) + 92, 8)
  const name = appear(frame, b(2) + 125)

  // доска 2: прямой и обратный путь
  const [c0, c1, c2, c3] = S1.cols
  const head = appear(frame, b(3) + 28)
  const headSub = appear(frame, b(3) + 55)
  const fwdLabel = appear(frame, b(4) + 4)
  const fwdIn = [10, 30, 50, 70].map((d) => appear(frame, b(4) + d))
  const fwdArrow = [0, 1, 2].map((i) => interpolate(frame, [b(4) + 22 + i * 20, b(4) + 36 + i * 20], [0, 1], CLAMP))
  const revLabel = appear(frame, b(4) + 95)
  const revIn = [appear(frame, b(3) + 75), appear(frame, b(4) + 122), appear(frame, b(4) + 144)]
  // лупа ходит по эталону: разбираем готовое
  const lens = appear(frame, b(3) + 92) * interpolate(frame, [b(4) + 100, b(4) + 112], [1, 0], CLAMP)
  const lensX = c3 + 40 + 160 * (0.5 - 0.5 * Math.cos(Math.max(0, frame - b(3) - 92) / 14))
  const revArrow = [0, 1].map((i) => interpolate(frame, [b(4) + 112 + i * 22, b(4) + 126 + i * 22], [0, 1], CLAMP))
  const join = interpolate(frame, [b(5) + 8, b(5) + 32], [0, 1], CLAMP)
  const lit = [b(5) + 34, b(5) + 54, b(5) + 74].map((at) => frame >= at)
  const theirCode = appear(frame, b(5) + 95)
  const noCode = appear(frame, b(5) + 112)
  const phones = [15, 25, 35].map((d) => appear(frame, b(6) + d, 8))
  const many = appear(frame, b(6) + 45)
  const trainer = frame >= b(6) + 75
  // весь маршрут по очереди обводится: эталон → разбор → своё описание → описание → код → продукт
  const route = [
    [c3, S1.revY],
    [c2, S1.revY],
    [c1, S1.revY],
    [c1, S1.fwdY],
    [c2, S1.fwdY],
    [c3, S1.fwdY],
  ].map(([x, y], k) => ({ x, y, on: appear(frame, b(6) + 95 + k * 12, 8) }))

    const midF = S1.fwdY + S1.boxH / 2
  const midR = S1.revY + S1.boxH / 2
  const W = S1.boxW

  return (
    <KitScene chip="1 / 7 · Повар пробует блюдо" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* чужой ресторан */}
      <rect x={R.x} y={R.y} width={R.w} height={R.h} rx={22} fill={theme.zone} />
      <Label x={R.x + R.w / 2 - 40} y={122} size={26} weight={700}>
        Чужой ресторан
      </Label>
      {/* дверь на чужую кухню с рецептом шефа */}
      <g>
        <rect x={S1.door.x} y={S1.door.y} width={S1.door.w} height={S1.door.h} rx={8} fill={theme.paper} stroke={theme.line} strokeWidth={3} />
        <circle cx={S1.door.x + 18} cy={S1.door.y + 105} r={5} fill={theme.line} />
        <Label x={S1.door.x + S1.door.w / 2} y={S1.door.y - 12} size={20} color={theme.soft} weight={600}>
          кухня
        </Label>
        <rect x={S1.door.x + 22} y={S1.door.y + 26} width={66} height={60} rx={4} fill={theme.altTint} stroke={theme.alt} strokeWidth={2} />
        {[0, 1, 2].map((i) => (
          <line key={i} x1={S1.door.x + 30} y1={S1.door.y + 40 + i * 14} x2={S1.door.x + 80 - i * 8} y2={S1.door.y + 40 + i * 14} stroke={theme.alt} strokeWidth={3} strokeLinecap="round" />
        ))}
        <Label x={S1.door.x + S1.door.w / 2} y={S1.door.y + 150} size={18} color={theme.alt} weight={600}>
          рецепт
        </Label>
      </g>
      <Arrow x1={S1.chef.x + 60} y1={330} x2={S1.door.x - 8} y2={330} color={theme.risk} dashed draw={toDoor} />
      <g opacity={noDoor}>
        <Mark x={(S1.chef.x + 60 + S1.door.x) / 2} y={330} ok={false} />
      </g>
      {/* стол и блюдо */}
      <Plate x={S1.plate.x} y={S1.plate.y} steam={1} frame={frame} />
      <rect x={S1.table.x} y={S1.table.y} width={S1.table.w} height={14} rx={4} fill={theme.line} />
      <rect x={S1.table.x + 20} y={S1.table.y + 14} width={10} height={86} fill={theme.line} />
      <rect x={S1.table.x + S1.table.w - 30} y={S1.table.y + 14} width={10} height={86} fill={theme.line} />

      {/* своя кухня */}
      <rect x={H.x} y={H.y} width={H.w} height={H.h} rx={22} fill={theme.okTint} opacity={0.5} />
      <Label x={H.x + H.w / 2} y={122} size={26} weight={700} color={theme.ok}>
        Своя кухня
      </Label>
      <g opacity={note}>
        <Card x={N.x} y={N.y} w={N.w} h={N.h}>
          <Label x={N.x + 20} y={N.y + 38} anchor="start" size={22} weight={700}>
            Запись вкуса
          </Label>
          {S1.tastes.map((t, i) =>
            frame >= flyAt(i) + 24 ? (
              <Label key={t.text} x={N.x + 20} y={N.y + NOTE_Y[i]} anchor="start" size={20} weight={500}>
                {`· ${t.text}`}
              </Label>
            ) : null,
          )}
        </Card>
      </g>
      <Arrow x1={N.x + N.w + 6} y1={N.y + N.h / 2} x2={RC.x - 6} y2={RC.y + RC.h / 2} color={theme.ok} draw={toRecipe} />
      <g opacity={recipe}>
        <Card x={RC.x} y={RC.y} w={RC.w} h={RC.h} stroke={theme.ok}>
          <Label x={RC.x + 20} y={RC.y + 38} anchor="start" size={22} weight={700} color={theme.ok}>
            Мой рецепт
          </Label>
          {RECIPE.map((r, i) => (
            <Label key={r} x={RC.x + 20} y={RC.y + 76 + i * 36} anchor="start" size={20} weight={500}>
              {typed(r, frame, b(2) + 40 + i * 18, 40)}
            </Label>
          ))}
        </Card>
      </g>
      <g opacity={pot}>
        <Pot x={S1.pot.x} y={S1.pot.y} steam={cooking ? 1 : 0.5} frame={frame} />
      </g>
      {frame >= b(2) + 92 && (
        <g opacity={dishIn}>
          <Plate x={dish.x} y={dish.y} scale={0.8} steam={0.6} frame={frame} />
        </g>
      )}
      <g opacity={name}>
        <Pill x={S1.dish.x} y={S1.dish.y + 50} text="Салат «Июль»" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>

      {/* повар */}
      <Chef x={chefPos.x} y={chefPos.y + bob} scale={0.9} label="Повар" enterAt={b(0) - 6} pose={chef[0]} mood={chef[1]} />
      {tasting && (
        <g>
          <line x1={chefPos.x + 86} y1={chefPos.y - 16} x2={chefPos.x + 150} y2={chefPos.y + 2} stroke={theme.ink} strokeWidth={4} strokeLinecap="round" />
          <ellipse cx={chefPos.x + 158} cy={chefPos.y + 4} rx={11} ry={6} fill={theme.paper} stroke={theme.ink} strokeWidth={3} />
        </g>
      )}
      {/* вкусы: над поваром, затем летят в запись */}
      {S1.tastes.map((t, i) => {
        if (frame >= flyAt(i) + 24) return null
        const p = trackAt(frame, [
          [flyAt(i), t.x, t.y],
          [flyAt(i) + 24, N.x + 20 + pillW(t.text) / 2, N.y + NOTE_Y[i] - 7],
        ])
        const shown = appear(frame, tasteIn[i])
        return (
          <g key={t.text} opacity={shown}>
            <Pill x={p.x} y={p.y} text={t.text} color={theme.alt} fill={theme.paper} size={20} compact />
          </g>
        )
      })}

      {/* доска 2: прямой и обратный путь */}
      <g opacity={head}>
        <Label x={c0 + 570} y={122} size={30} weight={700}>
          Обратная инженерия
        </Label>
      </g>
      <g opacity={headSub}>
        <Label x={c0 + 570} y={160} size={22} weight={500} color={theme.soft}>
          разобрать готовое, чтобы понять, как оно устроено
        </Label>
      </g>
      <g opacity={fwdLabel}>
        <Label x={c0} y={S1.fwdY - 14} anchor="start" size={20} weight={700} color={theme.accent}>
          прямой путь →
        </Label>
      </g>
      {FWD.map((f, i) => {
        const on = (i === 1 && lit[0]) || (i === 2 && lit[1]) || (i === 3 && lit[2])
        const sub = i === 3 && trainer ? 'приложение тренера' : f.sub
        return <Box key={f.title} x={S1.cols[i]} y={S1.fwdY} title={f.title} sub={sub} color={theme.accent} fill={on ? theme.accentTint : theme.paper} on={fwdIn[i]} subColor={i === 3 && trainer ? theme.accent : undefined} />
      })}
      {fwdArrow.map((p, i) => (
        <Arrow key={i} x1={S1.cols[i] + W + 8} y1={midF} x2={S1.cols[i + 1] - 8} y2={midF} color={theme.accent} draw={p} />
      ))}
      <g opacity={revLabel}>
        <Label x={c0} y={S1.revY - 14} anchor="start" size={20} weight={700} color={theme.alt}>
          ← обратный путь
        </Label>
      </g>
      {REV.map((r, i) => (
        <Box key={r.title} x={S1.cols[r.col]} y={S1.revY} title={r.title} sub={r.sub} color={theme.alt} fill={i === 2 && lit[0] ? theme.altTint : theme.paper} on={revIn[i]} />
      ))}
      {revArrow.map((p, i) => (
        <Arrow key={i} x1={S1.cols[3 - i] - 8} y1={midR} x2={S1.cols[2 - i] + W + 8} y2={midR} color={theme.alt} draw={p} />
      ))}
      {/* вход в прямой путь: своё описание становится описанием */}
      <Arrow x1={c1 + W / 2} y1={S1.revY - 6} x2={c1 + W / 2} y2={S1.fwdY + S1.boxH + 8} color={theme.accent} draw={join} />
      {lens > 0 && (
        <g opacity={lens}>
          <circle cx={lensX} cy={S1.revY + S1.boxH + 4} r={20} fill={theme.accentTint} stroke={theme.ink} strokeWidth={4} />
          <line x1={lensX + 14} y1={S1.revY + S1.boxH + 18} x2={lensX + 28} y2={S1.revY + S1.boxH + 32} stroke={theme.ink} strokeWidth={7} strokeLinecap="round" />
        </g>
      )}
      {/* код эталона не нужен */}
      <g opacity={theirCode}>
        <Box x={c0} y={S1.revY} title="Код эталона" sub="не нужен" color={theme.line} fill={theme.paper} on={1} dashed />
      </g>
      <g opacity={noCode}>
        <Mark x={c0 + W - 6} y={S1.revY + 6} ok={false} />
      </g>
      {route.map((r) => (
        <rect key={`${r.x}-${r.y}`} x={r.x - 7} y={r.y - 7} width={S1.boxW + 14} height={S1.boxH + 14} rx={18} fill="none" stroke={theme.accent} strokeWidth={4} opacity={r.on} />
      ))}
      {/* два-три фитнес-приложения — эталоны */}
      {phones.map((p, i) => (
        <g key={i} opacity={p} transform={`translate(0 ${(1 - p) * 10})`}>
          <MiniPhone x={c3 + 70 + i * 50} y={S1.revY - 46} w={36} h={60} color={theme.alt} />
        </g>
      ))}
      <g opacity={many}>
        <Label x={c3 + 40} y={S1.revY - 38} anchor="end" size={20} weight={700} color={theme.alt}>
          2–3 эталона
        </Label>
      </g>
    </KitScene>
  )
}
