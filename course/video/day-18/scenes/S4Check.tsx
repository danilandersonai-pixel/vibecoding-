import { useCurrentFrame } from 'remotion'
import { KitScene } from '../../kit/KitScene'
import { appear } from '../../kit/motion'
import { Label } from '../../kit/parts'
import { Pill, Slot } from '../../kit/props'
import { typed } from '../../kit/reveal'
import { terminalHeight } from '../../kit/screens/layout'
import { Terminal, type TermLine } from '../../kit/screens/Terminal'
import { theme } from '../../theme'
import { EDITED, kgText, LIST_H, NOTES, PLAN, PLAN_NEW, S4, screenOf, setText, SETS, TODAY, VOLUME, VOLUME_EDITED } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Avatar, Handset, Panel, ScreenTitle, SetInput, SetRow, StatusBar, TickRow } from './parts'

const ID = 's4-check'
const C = S4.coach
const L = S4.list
const A = S4.ask
// между первым и вторым прогоном — пояснение
const GAP_Y = (S4.term.y + terminalHeight(2) + S4.term2.y) / 2

// тест на повтор: сначала зелёный, после нарочной поломки — красный
const TEST_OK: TermLine[] = [
  { text: 'npm test', kind: 'cmd' },
  { text: '✓ тот же номер дважды — одна строка', kind: 'ok' },
]
const ASK = 'Тест: подход с тем же номером дважды — одна строка'
const TEST_BROKEN: TermLine[] = [
  { text: 'npm test', kind: 'cmd' },
  { text: '✗ тот же номер дважды — две строки', kind: 'err' },
]

// Сцена 4 (проверьте у себя): режим полёта и три подхода, пометки и перезапуск, ровно три у тренера;
// тест на повтор с тем же номером и нарочная поломка защиты; конфликт — правка без связи и новый план.
// Справа — список проверок (горячая точка).
export function S4Check() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()
  const s = screenOf(S4.phone)

  // режим полёта: включён, выключен, снова включён для конфликта, выключен
  const plane = appear(frame, b(0) + 20, 10) * (1 - appear(frame, b(2) + 20, 10)) + appear(frame, b(5) + 10, 10) * (1 - appear(frame, b(6) + 10, 10))
  const rowAt = [b(0) + 50, b(0) + 80, b(0) + 110]
  const shown = rowAt.filter((t) => frame >= t).length
  const tap = rowAt.find((t) => frame >= t - 8 && frame < t + 10)
  const sentAt = [b(2) + 44, b(2) + 56, b(2) + 68]
  const sent = (i: number) => appear(frame, sentAt[i], 8)
  const queued = shown - sentAt.filter((t) => frame >= t + 4).length
  const dark = appear(frame, b(1) + 56, 8) * (1 - appear(frame, b(1) + 90, 8))
  const here = appear(frame, b(1) + 104, 10) * (1 - appear(frame, b(2), 10))
  // экран тренера: 0 → 3 подхода и 775 кг; потом новый план и правка подхода
  const arrived = frame >= b(2) + 80
  const planNew = frame >= b(5) + 70
  const edit = appear(frame, b(5) + 30, 12)
  const editSent = appear(frame, b(6) + 30, 8)
  const synced = frame >= b(6) + 40
  const flag = appear(frame, b(6) + 44, 10)
  const waitGlow = appear(frame, b(5) + 110, 8) * (1 - appear(frame, b(6) + 4, 8))
  // тест в терминале вместо телефона и экрана тренера
  const devices = 1 - appear(frame, b(3), 10) + appear(frame, b(5) - 10, 10)
  const tests = appear(frame, b(3) + 4, 10) * (1 - appear(frame, b(5) - 16, 10))
  const run2 = appear(frame, b(3) + 70, 10) * (1 - appear(frame, b(4) + 40, 8))
  const off = appear(frame, b(4) + 14, 10) * (1 - appear(frame, b(4) + 110, 10))
  const broken = appear(frame, b(4) + 14, 10) * (1 - appear(frame, b(5) - 16, 10))
  const red = appear(frame, b(4) + 110, 10) * (1 - appear(frame, b(5) - 16, 10))
  const nothingLost = appear(frame, b(6) + 110, 12)
  // список проверок — после отъезда камеры; галочки по репликам
  const listIn = appear(frame, b(1) + 26, 12)
  const tickAt = [b(1) + 34, b(1) + 120, b(2) + 100, b(3) + 120, b(4) + 124, b(6) + 10]

  return (
    <KitScene chip="4 / 4 · Проверьте у себя" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* телефон и экран тренера */}
      <g opacity={Math.min(1, devices)}>
        <Handset x={S4.phone.x} y={S4.phone.y} dark={dark}>
          <StatusBar s={s} net={1 - plane} plane={plane} />
          <ScreenTitle s={s} title="Присед" count={edit > 0 && editSent < 0.5 ? 1 : Math.max(0, queued)} />
          {SETS.map((set, i) =>
            i < shown ? (
              <SetRow
                key={set.id}
                s={s}
                i={i}
                text={setText(i === 2 && edit > 0 ? EDITED[2] : set)}
                sent={i === 2 && edit > 0 ? editSent : sent(i)}
                strike={i === 2 && edit > 0 ? { text: setText(set), draw: edit } : undefined}
                note={i === 2 && synced ? NOTES.plan : undefined}
                flash={frame < rowAt[i] + 16 ? 1 : 0}
                glow={i === 2 ? waitGlow : 0}
              />
            ) : null,
          )}
          <SetInput s={s} value="" tapAt={tap === undefined ? undefined : tap - 8} />
          <g opacity={here}>
            <rect x={s.x + 20} y={s.y + 306} width={s.w - 40} height={46} rx={23} fill={theme.ok} />
            <Label x={s.x + s.w / 2} y={s.y + 336} size={20} weight={700} color={theme.white}>
              подходы на месте ✓
            </Label>
          </g>
        </Handset>

        <Panel x={C.x} y={C.y} w={C.w} h={C.h} title="Экран тренера" icon={<Avatar x={C.x + 32} y={C.y + 30} color={theme.accent} letter="Т" />}>
          <Label x={C.x + 22} y={C.y + 86} anchor="start" size={20} weight={600} color={theme.soft}>
            подопечный · присед
          </Label>
          <Label x={C.x + 22} y={C.y + 128} anchor="start" size={22} weight={600} color={theme.soft}>
            подходов
          </Label>
          <Label x={C.x + C.w - 22} y={C.y + 128} anchor="end" size={26} weight={800} color={arrived ? theme.ok : theme.ink}>
            {arrived ? '3' : '0'}
          </Label>
          <Label x={C.x + 22} y={C.y + 168} anchor="start" size={22} weight={600} color={theme.soft}>
            объём
          </Label>
          <Label x={C.x + C.w - 22} y={C.y + 168} anchor="end" size={26} weight={800} color={arrived ? theme.ok : theme.ink}>
            {kgText(!arrived ? 0 : synced ? VOLUME_EDITED : VOLUME)}
          </Label>
          <Label x={C.x + 22} y={C.y + 208} anchor="start" size={22} weight={600} color={theme.soft}>
            план, 3-й
          </Label>
          <Label x={C.x + C.w - 22} y={C.y + 208} anchor="end" size={22} weight={800} color={planNew ? theme.accent : theme.ink}>
            {setText(planNew ? PLAN_NEW[2] : PLAN[2])}
          </Label>
          <g opacity={flag}>
            <rect x={C.x + 14} y={C.y + 226} width={C.w - 28} height={60} rx={8} fill={theme.altTint} stroke={theme.alt} strokeWidth={2.5} />
            <Label x={C.x + 28} y={C.y + 250} anchor="start" size={18} weight={700} color={theme.alt}>
              {`3-й сделан: ${setText(EDITED[2])}`}
            </Label>
            <Label x={C.x + 28} y={C.y + 274} anchor="start" size={18} weight={600} color={theme.alt}>
              по прежнему плану
            </Label>
          </g>
        </Panel>
      </g>

      {/* тест на повтор: запрос ИИ, зелёный прогон, защиту убрали, красный прогон */}
      <g opacity={tests}>
        <rect x={A.x} y={A.y} width={A.w} height={A.h} rx={14} fill={theme.white} stroke={theme.accent} strokeWidth={3} />
        <Label x={A.x + 20} y={A.y + 28} anchor="start" size={18} weight={700} color={theme.accent}>
          запрос ИИ
        </Label>
        <Label x={A.x + 20} y={A.y + 60} anchor="start" size={20} weight={700}>
          {typed(ASK, frame, b(3) + 12, 60)}
        </Label>
        <Terminal x={S4.term.x} y={S4.term.y} w={S4.term.w} at={b(3) + 44} lines={TEST_OK} />
      </g>
      <g opacity={run2}>
        <Slot x={S4.term2.x} y={S4.term2.y} w={S4.term2.w} h={terminalHeight(TEST_BROKEN.length)} text="прогон после поломки" />
      </g>
      <g opacity={off}>
        <Pill x={S4.term.x + S4.term.w / 2} y={GAP_Y} w={360} text="защиту от дублей убрали" color={theme.risk} fill={theme.white} size={20} compact />
      </g>
      <g opacity={broken}>
        <Terminal x={S4.term2.x} y={S4.term2.y} w={S4.term2.w} at={b(4) + 40} lines={TEST_BROKEN} />
      </g>
      <g opacity={red}>
        <Pill x={S4.term.x + S4.term.w / 2} y={GAP_Y} w={420} text="покраснел — значит, тест работает" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      <g opacity={nothingLost}>
        <Pill x={C.x + C.w / 2} y={C.y + C.h + 48} w={270} text="ничего не пропало ✓" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>

      {/* список проверок */}
      <g opacity={listIn}>
        <Panel x={L.x} y={L.y} w={L.w} h={LIST_H} title="Проверьте у себя">
          {TODAY.map((t, i) => (
            <TickRow key={t} x={L.x + 22} y={L.y + L.head + 14 + i * L.row} text={t} at={tickAt[i]} />
          ))}
        </Panel>
      </g>
    </KitScene>
  )
}
