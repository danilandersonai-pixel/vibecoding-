import { useCurrentFrame } from 'remotion'
import { KitScene } from '../../kit/KitScene'
import { appear } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Browser, Mark, Pill, Slot } from '../../kit/props'
import { typed } from '../../kit/reveal'
import { BAR, terminalHeight } from '../../kit/screens/layout'
import { Terminal } from '../../kit/screens/Terminal'
import { theme } from '../../theme'
import { CHECKS, S3, S3_LIST_H, TERM } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Bell, TickRow } from './parts'

const ID = 's3-check'
const LI = S3.list
const BR = S3.browser
const T = S3.term
const URL = 'client/17/workouts/41/comments'

// Сцена 3 (проверьте у себя): чек-лист по репликам; под чужим входом лента и адрес тренировки Анны пусты;
// если видно чужое — защиты нет; тесты на доступ и на уведомления в терминале.
export function S3Check() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  const listIn = appear(frame, 4, 12)
  // отметки пунктов — к концу своей реплики
  const tickAt = [b(0) + 150, b(1) + 110, b(3) + 120, b(4) + 110, b(5) + 70, b(6) + 40]
  // браузер под чужим входом
  const slots = appear(frame, b(1) + 22, 10)
  const brAt = b(1) + 24
  const empty = appear(frame, b(1) + 70, 10)
  // пункты появляются по одному, пока звучит первая реплика
  const rowAt = CHECKS.map((_, i) => b(0) + 20 + i * 14)
  // если видно чужое
  const warnAt = [b(2) + 16, b(2) + 80, b(2) + 140]
  const WARN = [
    { text: 'видно чужое → защиты нет', color: theme.risk, fill: theme.riskTint },
    { text: 'ИИ включает RLS', color: theme.accent, fill: theme.accentTint },
    { text: 'вы проверяете снова', color: theme.ok, fill: theme.okTint },
  ]
  const warnOut = appear(frame, b(3), 10)
  // тесты: строки вывода — по репликам
  const termAt = b(3) + 10
  const outAt = [0, b(3) + 66, b(3) + 90, b(4) + 70, b(5) + 46, b(6) + 24]
  const lines = TERM.map((l, i) => (i === 0 || frame >= outAt[i] ? l : { text: '', kind: 'out' as const }))
  const bell = appear(frame, b(6) + 10, 10)

  return (
    <KitScene chip="3 / 3 · Проверьте у себя" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* чек-лист */}
      <g opacity={listIn}>
        <Card x={LI.x} y={LI.y} w={LI.w} h={S3_LIST_H} stroke={theme.accent} fill={theme.white}>
          <Label x={LI.x + 24} y={LI.y + 42} anchor="start" size={24} weight={800} color={theme.accent}>
            Проверьте у себя
          </Label>
          <line x1={LI.x + 20} y1={LI.y + 58} x2={LI.x + LI.w - 20} y2={LI.y + 58} stroke={theme.grid} strokeWidth={2} />
        </Card>
        {CHECKS.map((c, i) => (
          <g key={c} opacity={appear(frame, rowAt[i], 10)}>
            <TickRow x={LI.x + 24} y={LI.y + LI.head + i * LI.row + 12} text={c} at={tickAt[i]} />
          </g>
        ))}
      </g>

      {/* браузер под чужим входом: адрес тренировки Анны */}
      <g opacity={slots}>
        {frame < brAt + 4 && <Slot x={BR.x} y={BR.y} w={BR.w} h={BR.h} text="вход под чужим" />}
        {frame < termAt + 4 && <Slot x={T.x} y={T.y} w={T.w} h={terminalHeight(TERM.length)} text={frame < warnAt[0] ? 'тесты' : undefined} />}
      </g>
      {frame >= brAt && (
        <Browser x={BR.x} y={BR.y} w={BR.w} h={BR.h} at={brAt} url={typed(URL, frame, brAt + 8, 30)} focus={frame < brAt + 40 ? 1 : 0}>
          <Label x={20} y={BAR + 36} anchor="start" size={20} color={theme.soft} weight={600}>
            Вход: Олег (тест)
          </Label>
          <Label x={20} y={BAR + 72} anchor="start" size={22} weight={800}>
            Комментарии к тренировке Анны
          </Label>
          <g opacity={empty}>
            <Label x={20} y={BAR + 110} anchor="start" size={22} color={theme.ok} weight={700}>
              пусто: чужих комментариев нет
            </Label>
            <Mark x={BR.w - 40} y={BAR + 102} ok r={16} />
          </g>
        </Browser>
      )}

      {/* видно чужое — защиты нет; RLS включить и проверить снова */}
      {WARN.map((w, i) => (
        <g key={w.text} opacity={appear(frame, warnAt[i], 10) * (1 - warnOut)}>
          <Pill x={T.x + T.w / 2} y={T.y + 60 + i * 70} w={400} text={w.text} color={w.color} fill={w.fill} size={20} />
        </g>
      ))}

      {/* тесты: доступ к комментариям и правила уведомлений */}
      {frame >= termAt && <Terminal x={T.x} y={T.y} w={T.w} at={termAt} lines={lines} />}
      <g opacity={bell}>
        <Bell x={T.x + T.w - 34} y={T.y + BAR + 16 + 5 * 32 + 16} color={theme.termOk} s={1.1} />
      </g>
    </KitScene>
  )
}
