import { useCurrentFrame } from 'remotion'
import { Actor } from '../../actors/Actor'
import { Person, type Mood, type Pose } from '../../actors/Person'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Callout, Mark, Pill } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { BAR, LH, TERM_PAD, terminalStarts, type TermLine } from '../../kit/screens/layout'
import { Terminal } from '../../kit/screens/Terminal'
import { theme } from '../../theme'
import { S6 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'

const ID = 's6-rollback'
const T = S6.term
const P = S6.points
const O = S6.outside
const D = S6.dots
const K = S6.checks
const RC = S6.recap

// откат (рис. 3.8): история сохранений и отмена неудачного коммита
const GIT: TermLine[] = [
  { text: 'git log --oneline', kind: 'cmd' },
  { text: 'c7e19f  Кнопка «Сохранить подход»', kind: 'out' },
  { text: '9d02c5  Журнал тренировок', kind: 'out' },
  { text: '5e8f10  Начало проекта', kind: 'out' },
  { text: 'git revert c7e19f', kind: 'cmd' },
  { text: 'отмена записана новым коммитом', kind: 'ok' },
]
const HISTORY = [
  { hash: '5e8f10', ok: true },
  { hash: '9d02c5', ok: true },
  { hash: 'c7e19f', ok: false },
  { hash: 'отмена', ok: true },
]
const POINTS = ['перед запросом 3', 'перед запросом 2', 'перед запросом 1']
const BACK = ['код', 'беседа', 'всё вместе']
const OUTSIDE = ['✗ команды в терминале', '✗ изменения в базе', '✗ выкладка сайта']
// три прогона (рис. 3.9)
const CHECKS = [
  { title: 'Обычный случай', lines: ['всё как задумано:', 'нажали — получили'] },
  { title: 'Пустой ввод', lines: ['ничего не ввели,', 'пустой список'] },
  { title: 'Странный ввод', lines: ['длинный текст,', 'символы < и &,', 'нет интернета'] },
]
// тесты (рис. 3.10): всё зелёное и одна красная строка
const PASS: TermLine[] = [
  { text: 'npm test', kind: 'cmd' },
  { text: 'PASS  сохранение подхода', kind: 'ok' },
  { text: 'PASS  пустой ввод', kind: 'ok' },
  { text: '2 passed, 0 failed', kind: 'ok' },
]
const FAIL: TermLine[] = [
  { text: 'npm test', kind: 'cmd' },
  { text: 'PASS  сохранение подхода', kind: 'ok' },
  { text: 'FAIL  пустой ввод', kind: 'err' },
  { text: '1 passed, 1 failed', kind: 'err' },
]
const CORE = ['маленький шаг', 'дифф', 'откат', 'тест']
const CHIP = 20
const chipW = (t: string) => Math.round(t.length * CHIP * 0.56 + 28)

// Сцена 6: откат — git log и git revert (история цела); контрольные точки /rewind и Esc Esc — но они
// не возвращают того, что случилось снаружи. «Вроде работает» — один сценарий из десятков; три прогона;
// тесты: зелёное — принимаем, красное — целиком ИИ. Итог: 70% быстро, остальное — по правилам.
export function S6Rollback() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: откат в терминале и полоса истории
  const gitAt = b(0) + 20
  const gitStarts = terminalStarts(GIT, gitAt)
  const badRow = appear(frame, gitStarts[1] + 20, 8)
  const histAt = [b(0) + 30, b(0) + 40, b(0) + 50, gitStarts[5] + 4]
  const badMark = appear(frame, gitStarts[1] + 20, 8)
  const whole = useAppear(b(0) + 150)

  // контрольные точки и что они не вернут
  const points = useAppear(b(1) + 6)
  const pointAt = POINTS.map((_, i) => b(1) + 30 + i * 12)
  const rewind = useAppear(b(1) + 74)
  const escAt = [b(1) + 98, b(1) + 106]
  const picked = frame >= b(1) + 122
  const backAt = BACK.map((_, i) => b(1) + 132 + i * 20)
  const outside = useAppear(b(2) + 10)
  const outAt = [b(2) + 92, b(2) + 111, b(2) + 124]
  const commit = useAppear(b(2) + 164)

  // доска 2: «вроде работает» и три прогона
  const say = useAppear(b(3) + 34)
  const sure = frame >= b(4) + 186
  const dotsIn = (i: number) => b(3) + 70 + i * 2
  // зелёные сценарии: обычный (уже проверен), пустой ввод, странный ввод
  const greenAt = [b(3) + 110, b(4) + 112, b(4) + 178]
  const doneAt = [b(4) + 84, b(4) + 112, b(4) + 178]
  const one = useAppear(b(3) + 150) * (1 - appear(frame, b(4) + 186, 10))
  const three = useAppear(b(4) + 190)
  const cardAt = [b(4) + 40, b(4) + 66, b(4) + 100]
  const you = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(3) + 30, ['cheer', 'happy']],
    [b(3) + 120, ['think', 'worried']],
    [b(4) + 40, ['point', 'neutral']],
    [b(4) + 186, ['cheer', 'happy']],
  ])

  // доска 3: тесты и итог
  const passAt = b(5) + 20
  const failAt = b(5) + 70
  const green = useAppear(b(5) + 60)
  const red = useAppear(b(5) + 120)
  const failRow = appear(frame, terminalStarts(FAIL, failAt)[2] + 6, 8)
  const recap = useAppear(b(6) + 6)
  const seventy = appear(frame, b(6) + 40, 16)
  const thirty = appear(frame, b(6) + 70, 16)
  const coreAt = [b(6) + 99, b(6) + 131, b(6) + 144, b(6) + 161]

  const rowY = (i: number) => T.y + BAR + TERM_PAD + i * LH
  const H = S6.history
  return (
    <KitScene chip="6 / 6 · Откат и проверка" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* откат: история и отмена неудачного коммита */}
      {frame >= gitAt && <Terminal x={T.x} y={T.y} w={T.w} at={gitAt} lines={GIT} />}
      <g opacity={badRow}>
        <rect x={T.x + 6} y={rowY(1) + 1} width={T.w - 12} height={LH - 2} rx={5} fill="none" stroke={theme.termErr} strokeWidth={3} />
      </g>
      {/* полоса истории: три сохранения и отмена — новое сохранение */}
      <line x1={H.x} y1={H.y} x2={H.x + 3 * H.step} y2={H.y} stroke={theme.line} strokeWidth={4} opacity={appear(frame, histAt[0])} />
      {HISTORY.map((h, i) => {
        const x = H.x + i * H.step
        const bad = !h.ok && badMark > 0
        return (
          <g key={h.hash} opacity={appear(frame, histAt[i], 8)}>
            <circle cx={x} cy={H.y} r={16} fill={i === 3 ? theme.okTint : bad ? theme.riskTint : theme.paper} stroke={i === 3 ? theme.ok : bad ? theme.risk : theme.accent} strokeWidth={4} />
            {bad && <Mark x={x} y={H.y} ok={false} r={10} />}
            <text x={x} y={H.y + 44} textAnchor="middle" fill={i === 3 ? theme.ok : theme.ink} style={{ font: `600 18px ${i === 3 ? theme.font : theme.mono}` }}>
              {h.hash}
            </text>
          </g>
        )
      })}
      <g opacity={whole}>
        <Pill x={H.x + 1.5 * H.step} y={H.y + 92} text="история цела ✓" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>

      {/* контрольные точки */}
      <g opacity={points}>
        <Card x={P.x} y={P.y} w={P.w} h={P.h} stroke={theme.accent}>
          <Label x={P.x + 24} y={P.y + 40} anchor="start" size={24} color={theme.accent} weight={700}>
            Контрольные точки
          </Label>
        </Card>
      </g>
      <g opacity={rewind}>
        <Pill x={P.x + 82} y={P.y + 84} text="/rewind" color={theme.ink} fill={theme.codeBg} size={20} mono compact />
        <Label x={P.x + 160} y={P.y + 91} anchor="start" size={20} color={theme.soft} weight={600}>
          или
        </Label>
      </g>
      {escAt.map((at, i) => (
        <g key={at} opacity={appear(frame, at, 6)}>
          <Pill x={P.x + 232 + i * 74} y={P.y + 84} w={64} text="Esc" color={theme.ink} fill={theme.white} size={20} mono compact />
        </g>
      ))}
      <g opacity={appear(frame, escAt[1] + 6)}>
        <Label x={P.x + 346} y={P.y + 91} anchor="start" size={18} color={theme.soft} weight={600}>
          в пустом поле
        </Label>
      </g>
      {POINTS.map((t, i) => {
        const y = P.y + 132 + i * 38
        const on = picked && i === 1
        return (
          <g key={t} opacity={appear(frame, pointAt[i], 8)}>
            {on && <rect x={P.x + 14} y={y - 18} width={250} height={36} rx={8} fill={theme.accentTint} stroke={theme.accent} strokeWidth={2} />}
            <circle cx={P.x + 34} cy={y} r={8} fill={on ? theme.accent : theme.paper} stroke={theme.accent} strokeWidth={3} />
            <Label x={P.x + 52} y={y + 7} anchor="start" size={20} weight={on ? 700 : 500}>
              {t}
            </Label>
          </g>
        )
      })}
      {BACK.map((t, i) => (
        <g key={t} opacity={appear(frame, backAt[i], 8)}>
          <Pill x={P.x + 400} y={P.y + 132 + i * 38} w={236} text={`вернуть: ${t}`} color={theme.ok} fill={theme.okTint} size={18} compact />
        </g>
      ))}
      {/* что точки не вернут */}
      <g opacity={outside}>
        <Card x={O.x} y={O.y} w={O.w} h={O.h} stroke={theme.risk}>
          <Label x={O.x + 24} y={O.y + 36} anchor="start" size={22} color={theme.risk} weight={700}>
            Это не коммит — не вернут:
          </Label>
        </Card>
      </g>
      {OUTSIDE.map((t, i) => {
        const row = i < 2 ? 0 : 1
        const before = OUTSIDE.slice(row * 2, i).reduce((s, x) => s + chipW(x) + 12, 0)
        return (
          <g key={t} opacity={appear(frame, outAt[i], 8)}>
            <Pill x={O.x + 24 + before + chipW(t) / 2} y={O.y + 74 + row * 46} text={t} color={theme.risk} fill={theme.riskTint} size={CHIP} compact />
          </g>
        )
      })}
      <g opacity={commit}>
        <Pill x={O.x + 24 + chipW(OUTSIDE[2]) + 12 + chipW('перед риском — коммит') / 2} y={O.y + 120} text="перед риском — коммит" color={theme.ok} fill={theme.okTint} size={CHIP} compact />
      </g>

      {/* доска 2: «вроде работает» */}
      <Actor x={S6.you.x} y={S6.you.y} scale={0.8} label="Вы" enterAt={b(3) + 20}>
        <Person color={theme.soft} pose={you[0]} mood={you[1]} />
      </Actor>
      <g opacity={say}>
        <Callout x={S6.say.x} y={S6.say.y} tx={S6.you.x + 12} ty={S6.you.y - 74} text={sure ? 'Проверил три сценария ✓' : 'Вроде работает!'} color={sure ? theme.ok : theme.risk} fill={sure ? theme.okTint : theme.white} size={22} />
      </g>
      {/* сценарии: проверен один из десятков */}
      {Array.from({ length: D.cols * D.rows }, (_, i) => {
        const cx = D.x + (i % D.cols) * D.step
        const cy = D.y + Math.floor(i / D.cols) * D.step
        const g = i < greenAt.length ? appear(frame, greenAt[i], 8) : 0
        return (
          <g key={i} opacity={appear(frame, dotsIn(i), 6)}>
            <circle cx={cx} cy={cy} r={13} fill={g > 0.5 ? theme.ok : theme.paper} stroke={g > 0.5 ? theme.ok : theme.line} strokeWidth={3} />
          </g>
        )
      })}
      <g opacity={one}>
        <Pill x={D.x + D.cols * D.step + 150} y={D.y + 60} text="проверен 1 из десятков" color={theme.risk} fill={theme.riskTint} size={CHIP} compact />
      </g>
      <g opacity={three}>
        <Pill x={D.x + D.cols * D.step + 150} y={D.y + 60} text="проверены 3 главных" color={theme.ok} fill={theme.okTint} size={CHIP} compact />
      </g>
      {CHECKS.map((c, i) => {
        const x = K.x + i * (K.w + K.gap)
        const a = appear(frame, cardAt[i])
        const done = appear(frame, doneAt[i], 8)
        return (
          <g key={c.title} opacity={a} transform={`translate(0 ${(1 - a) * 16})`}>
            <Card x={x} y={K.y} w={K.w} h={K.h} stroke={done > 0 ? theme.ok : theme.accent} fill={done > 0 ? theme.okTint : theme.paper}>
              <Label x={x + 20} y={K.y + 40} anchor="start" size={22} weight={700}>
                {c.title}
              </Label>
              {c.lines.map((l, j) => (
                <Label key={l} x={x + 20} y={K.y + 82 + j * 30} anchor="start" size={20} color={theme.soft} weight={500}>
                  {l}
                </Label>
              ))}
            </Card>
            <g opacity={done}>
              <Mark x={x + K.w - 30} y={K.y + K.h - 30} ok r={18} />
            </g>
          </g>
        )
      })}

      {/* доска 3: тесты */}
      {frame >= passAt && <Terminal x={S6.pass.x} y={S6.pass.y} w={S6.pass.w} at={passAt} lines={PASS} />}
      {frame >= failAt && <Terminal x={S6.fail.x} y={S6.fail.y} w={S6.fail.w} at={failAt} lines={FAIL} />}
      <g opacity={failRow}>
        <rect x={S6.fail.x + 6} y={S6.fail.y + BAR + TERM_PAD + 2 * LH + 1} width={S6.fail.w - 12} height={LH - 2} rx={5} fill="none" stroke={theme.termErr} strokeWidth={3} />
      </g>
      <g opacity={green}>
        <Pill x={S6.pass.x + S6.pass.w / 2} y={344} text="всё зелёное — можно принимать" color={theme.ok} fill={theme.okTint} size={CHIP} compact />
      </g>
      <g opacity={red}>
        <Pill x={S6.fail.x + S6.fail.w / 2} y={344} text="красную строку — ИИ целиком" color={theme.risk} fill={theme.riskTint} size={CHIP} compact />
      </g>

      {/* итог: 70% даёт ИИ быстро, остальное — по правилам */}
      <g opacity={recap}>
        <Card x={RC.x} y={RC.y} w={RC.w} h={RC.h} stroke={theme.accent}>
          <Label x={RC.x + 24} y={RC.y + 38} anchor="start" size={24} color={theme.accent} weight={700}>
            Итог главы
          </Label>
        </Card>
      </g>
      <g opacity={seventy}>
        <rect x={RC.x + 24} y={RC.y + 62} width={350 * seventy} height={56} rx={10} fill={theme.accent} />
        <Label x={RC.x + 44} y={RC.y + 98} anchor="start" size={22} color={theme.white} weight={700}>
          70% — ИИ, быстро
        </Label>
      </g>
      <g opacity={thirty}>
        <rect x={RC.x + 384} y={RC.y + 62} width={150} height={56} rx={10} fill={theme.riskTint} stroke={theme.risk} strokeWidth={3} strokeDasharray="10 6" />
        <Label x={RC.x + 459} y={RC.y + 98} size={22} color={theme.risk} weight={700}>
          30% — вы
        </Label>
      </g>
      <g opacity={appear(frame, coreAt[0] - 10)}>
        <Label x={RC.x + 580} y={RC.y + 38} anchor="start" size={20} color={theme.soft} weight={600}>
          последние 30% проходят так:
        </Label>
      </g>
      {CORE.map((t, i) => {
        const before = CORE.slice(0, i).reduce((s, x) => s + chipW(x) + 14, 0)
        return (
          <g key={t} opacity={appear(frame, coreAt[i], 8)}>
            <Pill x={RC.x + 580 + before + chipW(t) / 2} y={RC.y + 90} text={t} color={theme.ok} fill={theme.okTint} size={CHIP} compact />
          </g>
        )
      })}
    </KitScene>
  )
}
