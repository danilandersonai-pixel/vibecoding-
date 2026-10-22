import { interpolate, useCurrentFrame } from 'remotion'
import { Agent, type AgentPose } from '../../actors/Agent'
import { useAppear } from '../../kit/hooks'
import { KitScene } from '../../kit/KitScene'
import { appear, CLAMP, trackAt } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Cloud, Mark, Pill } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { BAR } from '../../kit/screens/layout'
import { Window } from '../../kit/screens/Window'
import { theme } from '../../theme'
import { BOARD2, BOARD3, S3 } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { CodeRows, Lens, Lock, Slot, Toggle, Warn } from './parts'

const ID = 's3-license'
const P = S3.pipe
const TL = S3.tool
const CL = S3.cloud
const TM = S3.terms
const LN = S3.lanes

// строки кода: в нашем окне и в чужом строки 2–5 совпадают
const OURS = [280, 340, 300, 360, 260, 320, 220]
const THEIRS = [240, 300, 300, 360, 260, 320, 180]
const rowY = (i: number) => S3.rowY + i * S3.rowH
// проверка в CI сверху вниз
const PIPE = ['коммит с кодом от ИИ', 'CI · сканер лицензий', 'найден открытый код под GPL']
const ASKS = ['учится на вашем коде?', 'где хранится?', 'кто имеет доступ?']
const SECRETS = ['секреты компании', 'чужой закрытый код']

// Сцена 3: модель почти дословно повторяет чужой код; мягкие лицензии и копилефт (GPL);
// в закрытом платном приложении — юридический риск. Сканер лицензий в CI и фильтр дословных совпадений.
// Ваши данные: учится ли модель на коде, где он хранится; секреты — только по корпоративному договору.
export function S3License() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: наш файл и чужой проект
  const oursAt = 4
  const theirsAt = b(0) + 30
  const oursShown = Math.min(OURS.length, Math.max(0, Math.floor((frame - oursAt - 14) / 6) + 1))
  const match = appear(frame, b(0) + 90, 12)
  const bridge = appear(frame, b(0) + 120, 12)
  const gpl = frame >= b(1) + 70
  const soft = useAppear(b(1) + 20)
  const copyleft = useAppear(b(1) + 80)
  const lanesSlot = useAppear(b(0) + 40)
  const agent = stepAt<AgentPose>(frame, [
    [0, 'working'],
    [b(0) + 70, 'done'],
    [b(1), 'idle'],
  ])
  const closed = useAppear(b(2) + 6)
  const tag = trackAt(frame, [
    [b(2) + 14, S3.theirs.x + S3.theirs.w - 56, S3.theirs.y + BAR / 2],
    [b(2) + 42, S3.ours.x + 250, rowY(3) + 14],
  ])
  const tagOn = frame >= b(2) + 14 && frame < b(2) + 44
  const risky = appear(frame, b(2) + 42, 10)
  const stamp = useAppear(b(2) + 50)

  // доска 2: сканер лицензий в CI и фильтр в инструменте
  const pipeAt = [b(3) + 30, b(3) + 50, b(3) + 106]
  const scan = frame >= b(3) + 56 && frame < b(3) + 104 ? ((frame - b(3) - 56) % 24) / 24 : -1
  const tool = useAppear(b(3) + 110)
  const on = interpolate(frame, [b(3) + 136, b(3) + 146], [0, 1], CLAMP)
  const toolNote = useAppear(b(3) + 160)

  // доска 3: ваши данные в инструменте
  const cloud = useAppear(b(4) + 14)
  const code = useAppear(b(4) + 24)
  const toCloud = interpolate(frame, [b(4) + 36, b(4) + 52], [0, 1], CLAMP)
  const askAt = ASKS.map((_, i) => b(4) + 56 + i * 28)
  const terms = useAppear(b(4) + 120)
  const lens = useAppear(b(4) + 146)
  const plan = useAppear(b(4) + 168)
  const secretAt = [b(5) + 6, b(5) + 16]
  const slide = interpolate(frame, [b(5) + 24, b(5) + 50], [0, 110], CLAMP)
  const barrier = useAppear(b(5) + 44)
  const refuse = useAppear(b(5) + 58)

  return (
    <KitScene chip="3 / 6 · Лицензии и ваши данные" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* наш файл */}
      <Window
        x={S3.ours.x}
        y={S3.ours.y}
        w={S3.ours.w}
        h={S3.ours.h}
        at={oursAt}
        bar={
          <>
            <Label x={18} y={BAR / 2 + 7} anchor="start" size={20} weight={700}>
              наше приложение
            </Label>
            <g opacity={closed}>
              <Lock x={S3.ours.w - 236} y={BAR / 2} scale={0.8} />
              <Pill x={S3.ours.w - 116} y={BAR / 2} text="закрытое, платное" color={theme.ink} fill={theme.white} size={18} compact />
            </g>
          </>
        }
      >
        <rect x={16} y={rowY(2) - S3.ours.y - 16} width={S3.ours.w - 32} height={4 * S3.rowH + 2} rx={8} fill={risky > 0 ? theme.riskTint : theme.altTint} opacity={Math.max(match, risky)} />
        <CodeRows x={30} y={rowY(0) - S3.ours.y} widths={OURS} step={S3.rowH} shown={oursShown} hi={[2, 3, 4, 5]} hiColor={risky > 0 ? theme.risk : theme.alt} hiOpacity={match} />
      </Window>

      {/* чужой проект с лицензией */}
      {frame >= theirsAt && (
        <Window
          x={S3.theirs.x}
          y={S3.theirs.y}
          w={S3.theirs.w}
          h={S3.theirs.h}
          at={theirsAt}
          bar={
            <>
              <Label x={18} y={BAR / 2 + 7} anchor="start" size={20} weight={700}>
                чужой проект
              </Label>
              <Pill x={S3.theirs.w - 64} y={BAR / 2} w={gpl ? 80 : 110} text={gpl ? 'GPL' : 'лицензия'} color={theme.alt} fill={gpl ? theme.altTint : theme.white} size={18} compact />
            </>
          }
        >
          <rect x={16} y={rowY(2) - S3.theirs.y - 16} width={S3.theirs.w - 32} height={4 * S3.rowH + 2} rx={8} fill={theme.altTint} opacity={match} />
          <CodeRows x={30} y={rowY(0) - S3.theirs.y} widths={THEIRS} step={S3.rowH} hi={[2, 3, 4, 5]} hiOpacity={match} />
        </Window>
      )}

      {/* почти дословно */}
      <g opacity={bridge}>
        {[rowY(2) - 16, rowY(5) + 16].map((y) => (
          <line key={y} x1={S3.ours.x + S3.ours.w + 6} y1={y} x2={S3.theirs.x - 6} y2={y} stroke={theme.alt} strokeWidth={3} strokeDasharray="8 7" />
        ))}
        <Label x={640} y={rowY(3) + 10} size={20} color={theme.alt} weight={800}>
          почти
        </Label>
        <Label x={640} y={rowY(4) + 8} size={20} color={theme.alt} weight={800}>
          дословно
        </Label>
      </g>

      {/* места будущих полос лицензий */}
      {[soft, copyleft].map((a, i) => (
        <g key={i} opacity={lanesSlot * (1 - a)}>
          <Slot x={LN.x} y={LN.y[i]} w={290} h={42} r={21} />
          <line x1={LN.x + 165} y1={LN.y[i]} x2={LN.x + 560} y2={LN.y[i]} stroke={theme.line} strokeWidth={2.5} strokeDasharray="8 7" />
        </g>
      ))}
      {/* агент, который выдал код */}
      <Agent x={S3.agent.x} y={S3.agent.y} scale={0.7} enterAt={6} pose={agent} />

      {/* мягкие лицензии и копилефт */}
      <g opacity={soft}>
        <Pill x={LN.x} y={LN.y[0]} w={290} text="мягкая лицензия" color={theme.ok} fill={theme.okTint} size={20} />
        <Arrow x1={LN.x + 155} y1={LN.y[0]} x2={LN.x + 225} y2={LN.y[0]} color={theme.ok} />
        <Label x={LN.x + 240} y={LN.y[0] + 7} anchor="start" size={20} color={theme.soft} weight={700}>
          ставит мало условий
        </Label>
      </g>
      <g opacity={copyleft}>
        <Pill x={LN.x} y={LN.y[1]} w={290} text="копилефт, например GPL" color={theme.alt} fill={theme.altTint} size={20} />
        <Arrow x1={LN.x + 155} y1={LN.y[1]} x2={LN.x + 225} y2={LN.y[1]} color={theme.alt} />
        <Label x={LN.x + 240} y={LN.y[1] + 7} anchor="start" size={20} color={theme.risk} weight={700}>
          откройте и свой код, где этот кусок
        </Label>
      </g>

      {/* кусок под GPL в закрытом приложении — риск */}
      {tagOn && <Pill x={tag.x} y={tag.y} w={80} text="GPL" color={theme.alt} fill={theme.white} size={18} compact />}
      <g opacity={stamp}>
        <Pill x={S3.ours.x + 285} y={rowY(3) + 14} w={340} text="юридический риск" color={theme.risk} fill={theme.white} size={24} />
        <Warn x={S3.ours.x + 145} y={rowY(3) + 13} size={30} />
      </g>

      {/* доска 2: сканер лицензий в CI */}
      {PIPE.map((t, i) => {
        const y = P.y + i * (P.h + P.gap)
        const bad = i === 2
        return (
          <g key={t} opacity={appear(frame, pipeAt[i])}>
            <Card x={P.x} y={y} w={P.w} h={P.h} stroke={bad ? theme.risk : i === 1 ? theme.accent : theme.line} fill={bad ? theme.riskTint : theme.white}>
              {bad && <Mark x={P.x + 40} y={y + P.h / 2} ok={false} r={16} />}
              <Label x={P.x + (bad ? 70 : 28)} y={y + P.h / 2 + 8} anchor="start" size={22} color={bad ? theme.risk : theme.ink} weight={700}>
                {t}
              </Label>
              {i === 1 && (
                <g>
                  <CodeRows x={P.x + P.w - 120} y={y + 28} widths={[90, 70, 90]} step={18} color={theme.grid} />
                  {scan >= 0 && <rect x={P.x + P.w - 128} y={y + 16 + scan * 56} width={110} height={6} rx={3} fill={theme.accent} />}
                </g>
              )}
            </Card>
            {i > 0 && <Arrow x1={P.x + P.w / 2} y1={y - P.gap + 2} x2={P.x + P.w / 2} y2={y - 4} color={theme.line} />}
          </g>
        )
      })}
      {frame >= b(3) + 110 && (
        <Window x={TL.x} y={TL.y} w={TL.w} h={TL.h} at={b(3) + 110} bar={<Label x={18} y={BAR / 2 + 7} anchor="start" size={20} weight={700}>настройки ИИ-инструмента</Label>}>
          <g opacity={tool}>
            <Label x={28} y={BAR + 60} anchor="start" size={22} weight={700}>
              фильтр дословных
            </Label>
            <Label x={28} y={BAR + 90} anchor="start" size={22} weight={700}>
              совпадений
            </Label>
            <Toggle x={TL.w - 70} y={BAR + 68} on={on} />
            {on >= 1 && <Mark x={TL.w - 70} y={BAR + 124} ok r={14} />}
          </g>
          <g opacity={toolNote}>
            <Label x={28} y={TL.h - 30} anchor="start" size={20} color={theme.soft} weight={600}>
              если инструмент его даёт
            </Label>
          </g>
        </Window>
      )}

      {/* доска 3: ваши данные в инструменте */}
      <g opacity={cloud}>
        <Cloud x={CL.x} y={CL.y} w={CL.w} h={CL.h} stroke={theme.accent}>
          <Label x={CL.x + CL.w / 2} y={CL.y + 124} size={24} weight={700}>
            ИИ-инструмент
          </Label>
        </Cloud>
      </g>
      <g opacity={code}>
        <rect x={S3.code.x - 60} y={S3.code.y - 40} width={120} height={80} rx={8} fill={theme.white} stroke={theme.ink} strokeWidth={3} />
        <CodeRows x={S3.code.x - 46} y={S3.code.y - 20} widths={[88, 64, 76]} step={18} />
        <Label x={S3.code.x} y={S3.code.y + 76} size={22} weight={700}>
          ваш код
        </Label>
      </g>
      <Arrow x1={S3.code.x + 70} y1={S3.code.y} x2={CL.x + 70} y2={S3.code.y} color={theme.accent} draw={toCloud} />
      {ASKS.map((t, i) => (
        <g key={t} opacity={appear(frame, askAt[i])}>
          <Pill x={S3.asks.x} y={S3.asks.y[i]} text={t} color={theme.accent} fill={theme.white} size={20} compact />
        </g>
      ))}
      <g opacity={terms}>
        <Card x={TM.x} y={TM.y} w={TM.w} h={TM.h} stroke={theme.ink} fill={theme.white}>
          <Label x={TM.x + 24} y={TM.y + 38} anchor="start" size={22} weight={700}>
            Условия использования
          </Label>
          <CodeRows x={TM.x + 24} y={TM.y + 64} widths={[200, 150]} step={16} />
        </Card>
      </g>
      <g opacity={lens}>
        <Lens x={TM.x + TM.w - 44} y={TM.y + 58} r={18} />
      </g>
      <g opacity={plan}>
        <Card x={S3.plan.x - 130} y={TM.y} w={330} h={TM.h} stroke={theme.ok} fill={theme.okTint}>
          <Label x={S3.plan.x + 35} y={TM.y + 38} size={20} color={theme.ok} weight={700}>
            корпоративный тариф
          </Label>
          <Label x={S3.plan.x + 35} y={TM.y + 70} size={20} weight={600}>
            гарантии обычно строже
          </Label>
        </Card>
      </g>
      {SECRETS.map((t, i) => (
        <g key={t} opacity={appear(frame, secretAt[i])} transform={`translate(${slide} 0)`}>
          <Lock x={S3.secrets.x - 132} y={S3.secrets.y[i]} scale={0.8} color={theme.risk} />
          <Pill x={S3.secrets.x} y={S3.secrets.y[i]} w={224} text={t} color={theme.ink} fill={theme.white} size={18} compact />
        </g>
      ))}
      <g opacity={barrier}>
        <line x1={BOARD3 + 470} y1={410} x2={BOARD3 + 470} y2={530} stroke={theme.risk} strokeWidth={5} strokeLinecap="round" />
        <Mark x={BOARD3 + 470} y={470} ok={false} r={18} />
      </g>
      <g opacity={refuse}>
        <Pill x={BOARD3 + 760} y={470} text="без корпоративного договора — нет" color={theme.risk} fill={theme.riskTint} size={20} />
      </g>
      {/* подпись доски 2: что ловит сканер */}
      <g opacity={appear(frame, pipeAt[0])}>
        <Label x={BOARD2 + 90} y={510} anchor="start" size={20} color={theme.soft} weight={600}>
          ловит фрагменты известного открытого кода
        </Label>
      </g>
    </KitScene>
  )
}
