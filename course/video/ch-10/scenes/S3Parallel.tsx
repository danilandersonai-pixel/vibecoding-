import { interpolate, useCurrentFrame } from 'remotion'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Mark, Pill } from '../../kit/props'
import { BAR } from '../../kit/screens/layout'
import { Mono, Window } from '../../kit/screens/Window'
import { theme } from '../../theme'
import { S3 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Folder, Laptop } from './parts'

const ID = 's3-parallel'
const CD = S3.cards
const A = S3.app

// агенты из таблицы книги (снимок на октябрь 2026): два ряда
const NAMES = [
  ['Claude Code', 'Codex', 'Copilot cloud agent', 'Cloud Agents в Cursor'],
  ['Devin', 'Jules', 'OpenHands'],
]
const NAME_SIZE = 20
const nameW = (t: string) => Math.round(t.length * NAME_SIZE * 0.56 + 28)

// три места работы Claude (рис. 10.4): где, файлы, для чего, особенность
const PLACES = [
  { title: 'Local', rows: ['на вашем компьютере', 'ваши папки', 'вы рядом с экраном', 'компьютер включён'] },
  { title: 'Cloud', rows: ['в облаке Anthropic', 'репозиторий GitHub', 'долгие задачи', 'закрыли приложение — идёт'] },
  { title: 'SSH', rows: ['на удалённом сервере', 'папки на сервере', 'проект на другой машине', 'адрес, порт и ключ'] },
]

// две сессии: название, ветка, состояние, что пишет агент, итог правок
const SESSIONS = [
  { title: 'Экспорт в CSV', branch: 'feat/export · Worktree', say: ['Пишу выгрузку', 'и тесты к ней.'], done: ['Выгрузка готова,', 'проверки зелёные.'], diff: 'feat/export' },
  { title: 'Тесты объёма', branch: 'test/volume · Worktree', say: ['Пишу тесты', 'для объёма.'], done: ['Добавил 4 теста,', 'проверки зелёные.'], diff: 'test/volume  +52 −0' },
]

// Сцена 3: агентов на рынке много — новичку хватит одного; где работает Claude: Local, Cloud, SSH (для фона — Cloud).
// Доска 2: две сессии в приложении идут одновременно, у каждой своя ветка и копия проекта; итог — проверить по отдельности.
export function S3Parallel() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: агенты и выбор одного
  const nameAt = (r: number, i: number) => b(0) + 14 + (r * 4 + i) * 10
  const dim = interpolate(frame, [b(0) + 100, b(0) + 114], [1, 0.35], CLAMP)
  const pick = appear(frame, b(0) + 150)

  // три карточки и Cloud
  const cardAt = PLACES.map((_, i) => b(1) + 24 + i * 26)
  const cloud = appear(frame, b(2) + 6)
  const lid = interpolate(frame, [b(2) + 24, b(2) + 44], [1, 0], CLAMP)
  const run = interpolate(frame, [b(2) + 10, b(3) + 10], [0.1, 0.9], CLAMP)
  const laptop = appear(frame, b(2) + 6)

  // доска 2: окно приложения, сессии и панели
  const app = b(3) - 24
  const itemAt = [app + 10, b(3) + 50]
  const panelAt = [b(3) + 24, b(4) + 14]
  // Worktree: сначала в боковой панели, потом папки-копии в панелях
  const tree = appear(frame, b(4) + 84)
  const folders = appear(frame, b(4) + 130)
  const okAt = [b(5) + 16, b(5) + 44]
  // первая сессия заканчивает работу перед проверкой, вторая уже готова
  const doneAt = [b(5) + 4, b(3) + 120]
  // первая сессия пишет код: счётчик добавленных строк растёт
  const added = Math.round(interpolate(frame, [b(3) + 30, b(5)], [3, 38], CLAMP))
  // перед выбором взгляд проходит по карточкам: Local → Cloud → SSH
  const hover = frame >= b(1) + 100 && frame < b(1) + 190 ? Math.floor((frame - b(1) - 100) / 30) : -1
  const merge = appear(frame, b(5) + 56)
  const panelW = (A.w - S3.side - 20 - 2 * 20) / 2
  const mergeX = A.x + S3.side + 30 + panelW

  return (
    <KitScene chip="3 / 7 · Несколько агентов сразу" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* доска 1: агенты из таблицы книги */}
      {NAMES.map((row, r) => {
        const total = row.reduce((s, t) => s + nameW(t), 0) + (row.length - 1) * S3.names.gap
        let left = 640 - total / 2
        return row.map((t, i) => {
          const w = nameW(t)
          const cx = left + w / 2
          left += w + S3.names.gap
          const g = appear(frame, nameAt(r, i), 10)
          const main = r === 0 && i === 0
          return (
            <g key={t} opacity={g * (main ? 1 : dim)}>
              <Pill x={cx} y={r === 0 ? S3.names.y1 : S3.names.y2} w={w} text={t} color={main && pick > 0 ? theme.ok : theme.accent} fill={main && pick > 0 ? theme.okTint : theme.paper} size={NAME_SIZE} compact />
            </g>
          )
        })
      })}
      <g opacity={appear(frame, b(0) + 80) * dim}>
        <Label x={828} y={S3.names.y2 + 7} anchor="start" size={18} weight={600} color={theme.soft}>
          снимок на октябрь 2026
        </Label>
      </g>
      <g opacity={pick}>
        <Pill x={640} y={S3.pick.y} w={430} text="новичку — один агент и одна модель" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>

      {/* места будущих карточек — пунктиром */}
      {PLACES.map((p, i) => (
        <g key={p.title} opacity={appear(frame, b(0) + 30 + i * 8) * (1 - appear(frame, cardAt[i], 10))}>
          <rect x={CD.x + i * (CD.w + CD.gap)} y={CD.y} width={CD.w} height={CD.h} rx={12} fill="none" stroke={theme.grid} strokeWidth={3} strokeDasharray="10 8" />
          <Label x={CD.x + i * (CD.w + CD.gap) + 24} y={CD.y + 42} anchor="start" size={28} weight={800} color={theme.grid}>
            {p.title}
          </Label>
        </g>
      ))}

      {/* три места работы */}
      {PLACES.map((p, i) => {
        const g = appear(frame, cardAt[i], 10)
        const x = CD.x + i * (CD.w + CD.gap)
        const lit = i === 1 && cloud > 0
        return (
          <g key={p.title} opacity={g} transform={`translate(0 ${(1 - g) * 14})`}>
            <Card x={x} y={CD.y} w={CD.w} h={CD.h} stroke={lit ? theme.ok : theme.line} fill={lit ? theme.okTint : theme.white}>
              <Label x={x + 24} y={CD.y + 42} anchor="start" size={28} weight={800} color={lit ? theme.ok : theme.accent}>
                {p.title}
              </Label>
              {p.rows.map((t, j) => (
                <g key={t}>
                  <circle cx={x + 30} cy={CD.y + 72 + j * 36} r={4} fill={j === 3 && lit ? theme.ok : theme.line} />
                  <Label x={x + 44} y={CD.y + 79 + j * 36} anchor="start" size={20} weight={j === 3 ? 700 : 500} color={j === 3 && lit ? theme.ok : theme.ink}>
                    {t}
                  </Label>
                </g>
              ))}
            </Card>
          </g>
        )
      })}

      {hover >= 0 && <rect x={CD.x + hover * (CD.w + CD.gap) - 7} y={CD.y - 7} width={CD.w + 14} height={CD.h + 14} rx={16} fill="none" stroke={theme.accent} strokeWidth={4} strokeDasharray="12 6" />}

      {/* Cloud: приложение закрыли, а сессия идёт */}
      <g opacity={laptop}>
        <Laptop x={S3.laptop.x} y={S3.laptop.y + 20} open={lid} />
        <Label x={S3.laptop.x - 74} y={S3.laptop.y + 20} anchor="end" size={18} weight={600} color={theme.soft} opacity={1 - lid}>
          закрыто
        </Label>
        <Label x={S3.laptop.x + 80} y={S3.laptop.y - 8} anchor="start" size={18} weight={600} color={theme.ok}>
          сессия идёт
        </Label>
        <rect x={S3.laptop.x + 80} y={S3.laptop.y + 4} width={180} height={16} rx={8} fill={theme.paper} stroke={theme.ok} strokeWidth={2} />
        <rect x={S3.laptop.x + 82} y={S3.laptop.y + 6} width={176 * run} height={12} rx={6} fill={theme.ok} />
      </g>

      {/* доска 2: окно приложения с двумя сессиями */}
      {frame >= app && (
        <Window
          x={A.x}
          y={A.y}
          w={A.w}
          h={A.h}
          at={app}
          bar={
            <>
              <circle cx={24} cy={BAR / 2} r={7} fill={theme.accent} />
              <text x={42} y={BAR / 2 + 6} fill={theme.ink} style={{ font: `600 18px ${theme.font}` }}>
                Claude · десктопное приложение
              </text>
            </>
          }
        >
          {/* боковая панель */}
          <rect x={3} y={BAR} width={S3.side} height={A.h - BAR - 3} fill={theme.codeBg} />
          <text x={20} y={BAR + 30} fill={theme.soft} style={{ font: `600 20px ${theme.font}` }}>
            Сессии
          </text>
          {SESSIONS.map((s, i) => {
            const g = appear(frame, itemAt[i], 10)
            const top = S3.item.y + i * (S3.item.h + S3.item.gap)
            const done = frame >= doneAt[i]
            return (
              <g key={s.title} opacity={g} transform={`translate(${(1 - g) * -16} 0)`}>
                <rect x={12} y={top} width={S3.side - 24} height={S3.item.h} rx={10} fill={theme.white} stroke={i === 0 ? theme.accent : theme.line} strokeWidth={2} />
                <text x={28} y={top + 30} fill={theme.ink} style={{ font: `700 20px ${theme.font}` }}>
                  {s.title}
                </text>
                <Mono x={28} y={top + 58} size={18} fill={theme.soft}>
                  {s.branch}
                </Mono>
                <circle cx={34} cy={top + 80} r={6} fill={done ? theme.ok : theme.alt} />
                <text x={48} y={top + 87} fill={done ? theme.ok : theme.alt} style={{ font: `600 18px ${theme.font}` }}>
                  {done ? 'готово' : 'работает…'}
                </text>
                {/* Worktree: своя копия проекта */}
                <rect x={26} y={top + 40} width={256} height={26} rx={6} fill="none" stroke={theme.ok} strokeWidth={2.5} opacity={tree} />
              </g>
            )
          })}

          {/* место второй панели — пунктиром, пока её не открыли */}
          <g opacity={1 - appear(frame, panelAt[1], 10)}>
            <rect x={S3.side + 40 + panelW} y={S3.panel.y} width={panelW} height={S3.panel.h} rx={12} fill="none" stroke={theme.grid} strokeWidth={3} strokeDasharray="10 8" />
            <text x={S3.side + 40 + panelW * 1.5} y={S3.panel.y + S3.panel.h / 2 + 8} textAnchor="middle" fill={theme.line} style={{ font: `700 22px ${theme.font}` }}>
              вторая сессия
            </text>
          </g>

          {/* две панели рядом */}
          {SESSIONS.map((s, i) => {
            const g = appear(frame, panelAt[i], 10)
            const px = S3.side + 20 + i * (panelW + 20)
            const py = S3.panel.y
            const done = frame >= doneAt[i]
            return (
              <g key={s.title} opacity={g} transform={`translate(0 ${(1 - g) * 14})`}>
                <rect x={px} y={py} width={panelW} height={S3.panel.h} rx={12} fill={theme.paper} stroke={theme.line} strokeWidth={2.5} />
                <text x={px + 20} y={py + 36} fill={theme.ink} style={{ font: `700 21px ${theme.font}` }}>
                  {s.title}
                </text>
                <Pill x={px + panelW - 74} y={py + 29} w={118} text={done ? 'готово' : 'работает…'} color={done ? theme.ok : theme.alt} fill={done ? theme.okTint : theme.altTint} size={18} compact />
                <rect x={px + 18} y={py + 60} width={panelW - 36} height={78} rx={12} fill={theme.codeBg} stroke={theme.line} strokeWidth={2} />
                {(done ? s.done : s.say).map((t, j) => (
                  <text key={t} x={px + 34} y={py + 92 + j * 28} fill={theme.ink} style={{ font: `500 20px ${theme.font}` }}>
                    {t}
                  </text>
                ))}
                <Mono x={px + 20} y={py + 176} size={18} fill={theme.soft}>
                  {i === 0 ? `${s.diff}  +${added} −2` : s.diff}
                </Mono>
                {/* своя копия проекта */}
                <g opacity={folders}>
                  <Folder x={px + 20} y={py + 206} color={theme.ok} />
                  <text x={px + 78} y={py + 232} fill={theme.ok} style={{ font: `600 20px ${theme.font}` }}>
                    своя копия проекта
                  </text>
                </g>
                {/* итог проверен отдельно */}
                <g opacity={appear(frame, okAt[i], 8)}>
                  <rect x={px + 18} y={py + S3.panel.h - 46} width={panelW - 36} height={34} rx={10} fill={theme.okTint} stroke={theme.ok} strokeWidth={2} />
                  <text x={px + panelW / 2} y={py + S3.panel.h - 22} textAnchor="middle" fill={theme.ok} style={{ font: `700 18px ${theme.font}` }}>
                    итог проверен отдельно
                  </text>
                </g>
              </g>
            )
          })}
        </Window>
      )}

      {/* потом — объединение */}
      <g opacity={merge}>
        {[0, 1].map((i) => {
          const cx = A.x + S3.side + 20 + i * (panelW + 20) + panelW / 2
          return <Arrow key={i} x1={cx} y1={A.y + A.h + 6} x2={mergeX + (i === 0 ? -130 : 130)} y2={S3.mergeY - 16} color={theme.ok} />
        })}
        <Pill x={mergeX} y={S3.mergeY} w={340} text="объединить — после проверки" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      {/* галочка «можно объединять» — вне рамки точки, кадр не стоит */}
      <g opacity={appear(frame, b(5) + 118)}>
        <Mark x={mergeX + 196} y={S3.mergeY} ok r={14} />
      </g>
    </KitScene>
  )
}
