import { useCurrentFrame } from 'remotion'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear, trackAt } from '../../kit/motion'
import { Arrow, Label } from '../../kit/parts'
import { Mark, Pill, Slot } from '../../kit/props'
import { stepAt } from '../../kit/reveal'
import { theme } from '../../theme'
import { dbRow, EDITED, kgText, NOTES, PLAN, PLAN_NEW, REC, rowTop, S3, screenOf, setText, SETS, VOLUME, VOLUME_DOUBLE } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Avatar, DbIcon, Handset, Panel, ScreenTitle, SetInput, SetPacket, SetRow, Signal, StatusBar } from './parts'

const ID = 's3-double'
const D = S3.db
const C = S3.coach
const RC = S3.rec
const PC = S3.plan
const FLY = 24
// нижняя часть карточки базы: пояснения
const NOTE_Y = [D.y + 316, D.y + 356]

/** Подход в пути по ключам [кадр, x, y]; виден с первого до последнего ключа. */
function Flying({ keys, text, color, lost = 0 }: { keys: [number, number, number][]; text: string; color?: string; lost?: number }) {
  const frame = useCurrentFrame()
  if (frame < keys[0][0] || frame >= keys[keys.length - 1][0] + (lost > 0 ? 24 : 0)) return null
  const p = trackAt(frame, keys)
  return <SetPacket x={p.x} y={p.y} text={text} color={color} lost={lost} />
}

// Сцена 3 (подводный камень): связь мигнула, ответ «принято» потерялся — телефон шлёт подход ещё раз,
// у Марины четыре подхода и 1050 кг; по содержанию повтор не отличить; номер подхода и защита
// от дублей. Доска 2: конфликт правки без связи и нового плана, одна запись затирает чужую правку;
// правило примера — план и подходы отдельно, расхождение видно обеим.
export function S3Double() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()
  const s = screenOf(S3.phone)
  const s2 = screenOf(S3.phone2)

  // ---- доска 1: повтор после потерянного ответа ----
  const flicker = Math.floor((frame - b(0) - 20) / 18) % 2 === 0 ? 0 : 1
  const net = frame < b(0) + 20 ? 1 : frame < b(1) ? flicker : frame < b(1) + 66 ? 1 : frame < b(2) + 40 ? 0 : 1
  const titles = appear(frame, b(0) + 30, 10) * (1 - appear(frame, b(1), 10))
  const titles2 = appear(frame, b(0) + 62, 10) * (1 - appear(frame, b(1), 10))
  const send1 = b(1) + 10
  const row3 = appear(frame, send1 + FLY, 8)
  const reply1 = b(1) + 44
  const lostX = appear(frame, b(1) + 68, 8) * (1 - appear(frame, b(2) + 34, 10))
  const waitGlow = appear(frame, b(1) + 116, 8) * (1 - appear(frame, b(2), 10))
  const send2 = b(2) + 50
  const reply2 = b(2) + 90
  const rewind = appear(frame, b(5) + 6, 14)
  const dup = appear(frame, send2 + FLY, 8) * (1 - rewind)
  const send3 = b(6) + 10
  const reply3 = b(6) + 70
  const sent3 = appear(frame, reply2 + FLY, 8) * (1 - appear(frame, b(5) + 6, 8)) + appear(frame, reply3 + FLY, 8)
  const idAt = [b(5) + 28, b(5) + 42, b(5) + 56]
  const dbIdAt = [b(5) + 80, b(5) + 92, b(5) + 104]
  const realAt = [b(4) + 20, b(4) + 34, b(4) + 88]
  const real = (i: number) => appear(frame, realAt[i], 10) * (1 - rewind)
  const repeat = appear(frame, b(4) + 100, 10) * (1 - rewind)
  const same = appear(frame, b(4) + 124, 10) * (1 - rewind)
  const again = appear(frame, b(5) + 12, 10) * (1 - appear(frame, b(6) + 30, 10))
  const skip = appear(frame, send3 + FLY + 6, 10)
  const hit = frame >= send3 + FLY && frame < send3 + FLY + 34 ? 1 : 0
  const guard = appear(frame, b(7) + 6, 12)
  const ask = appear(frame, b(7) + 90, 12)
  // экран Марины: три → четыре → снова три
  const coachIn = appear(frame, b(2) + 26, 12)
  const wrong = frame >= b(3) + 10 && frame < b(5) + 12
  const was = appear(frame, b(3) + 40, 10) * (1 - appear(frame, b(5) + 12, 8))
  const fine = appear(frame, reply3 + FLY + 16, 10)

  // ---- доска 2: конфликт ----
  const net2 = appear(frame, b(10) + 10, 10)
  const editTap = b(8) + 40
  const edit = appear(frame, b(8) + 56, 12)
  const editSent = appear(frame, b(10) + 50, 8)
  const planEdit = appear(frame, b(9) + 20, 12)
  const planSend = b(9) + 60
  const oneIn = appear(frame, planSend + FLY, 10) * (1 - appear(frame, b(11) + 4, 10))
  const copy = b(10) + 24
  const overwrite = appear(frame, copy + 26, 12)
  const lostEdit = appear(frame, b(10) + 100, 10) * (1 - appear(frame, b(11) + 4, 10))
  const editWait = appear(frame, b(8) + 104, 8) * (1 - appear(frame, b(8) + 170, 10))
  const splitPlan = appear(frame, b(11) + 14, 12)
  const splitSets = appear(frame, b(11) + 40, 12)
  const flag = appear(frame, b(11) + 80, 12)
  const flagPhone = appear(frame, b(11) + 92, 12)

  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(3) + 20, ['surprised', 'worried']],
    [b(3) + 90, ['think', 'worried']],
    [b(5) + 20, ['stand', 'neutral']],
    [b(7) + 40, ['cheer', 'happy']],
  ])

  const rowX = s.x + s.w - 70
  const rowMid = (i: number) => rowTop(s, i) + 30
  const dbIn = { x: D.x + 40, y: dbRow(2) + 24 }
  // значение строки Марины в плане (доска 2): 55 → 52,5 → затёрто до 55 → снова 52,5
  const plan3 = frame >= b(11) + 4 ? PLAN_NEW[2] : frame >= b(10) + 70 ? PLAN[2] : frame >= b(9) + 20 ? PLAN_NEW[2] : PLAN[2]

  return (
    <KitScene chip="3 / 4 · Подводный камень" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* ---- доска 1: телефон Анны ---- */}
      <Handset x={S3.phone.x} y={S3.phone.y}>
        <StatusBar s={s} net={net} />
        <ScreenTitle s={s} title="Присед" count={sent3 > 0.5 ? 0 : 1} />
        {SETS.map((set, i) => (
          <SetRow key={set.id} s={s} i={i} text={setText(set)} id={set.id} idOn={appear(frame, idAt[i], 10)} sent={i < 2 ? 1 : sent3} glow={i === 2 ? waitGlow : 0} />
        ))}
        <SetInput s={s} value="" />
      </Handset>

      {/* связь и путь */}
      <line x1={S3.phone.x + 312} y1={300} x2={D.x - 10} y2={300} stroke={theme.line} strokeWidth={3} strokeDasharray="8 8" />
      <Signal x={S3.signal.x} y={S3.signal.y} on={net} label={net > 0.5 ? 'есть сеть' : 'нет сети'} />
      <g opacity={lostX}>
        <path d="M399 328 l32 32 m0 -32 l-32 32" stroke={theme.risk} strokeWidth={5} strokeLinecap="round" />
        <Label x={415} y={392} size={18} weight={700} color={theme.risk}>
          потерялся
        </Label>
      </g>

      {/* сервер и база: подходы Анны */}
      <Panel x={D.x} y={D.y} w={D.w} h={D.h} title="Сервер · база" icon={<DbIcon x={D.x + 32} y={D.y + 30} />}>
        {[0, 1, 2, 3].map((i) => {
          const y = dbRow(i)
          const set = SETS[Math.min(i, 2)]
          const on = i < 2 ? 1 : i === 2 ? row3 : dup
          const shift = i < 3 ? appear(frame, dbIdAt[i], 8) : 0
          const idOn = i < 3 ? appear(frame, dbIdAt[i] + 8, 8) : 0
          const bad = i === 3
          return (
            <g key={i} opacity={on}>
              <rect x={D.x + 14} y={y} width={D.w - 28} height={D.rowH} rx={8} fill={bad ? theme.riskTint : i === 2 && hit ? theme.altTint : theme.paper} stroke={bad ? theme.risk : i === 2 && hit ? theme.alt : theme.grid} strokeWidth={bad || (i === 2 && hit) ? 3 : 2} />
              <g opacity={idOn}>
                <text x={D.x + 28} y={y + 31} fill={theme.accent} style={{ font: `600 18px ${theme.mono}`, fontVariantLigatures: 'none' }}>
                  {set.id}
                </text>
              </g>
              <Label x={D.x + 28 + 66 * shift} y={y + 32} anchor="start" size={22} weight={700} color={bad ? theme.risk : theme.ink}>
                {setText(set)}
              </Label>
              <g opacity={bad ? repeat : real(i)}>
                <Label x={D.x + D.w - 28} y={y + 31} anchor="end" size={18} weight={700} color={bad ? theme.risk : theme.ok}>
                  {bad ? 'повтор' : 'настоящий'}
                </Label>
              </g>
            </g>
          )
        })}
        {/* пустое место четвёртой строки после исправления: повтор пропущен */}
        <g opacity={skip}>
          <Pill x={D.x + D.w / 2} y={dbRow(3) + D.rowH / 2} w={D.w - 40} text={`${SETS[2].id} уже есть — пропуск`} color={theme.alt} fill={theme.altTint} size={18} compact />
        </g>
        <g opacity={titles}>
          <Pill x={D.x + D.w / 2} y={NOTE_Y[0]} w={230} text="двойная отправка" color={theme.risk} fill={theme.white} size={20} compact />
        </g>
        <g opacity={titles2}>
          <Pill x={D.x + D.w / 2} y={NOTE_Y[1]} w={230} text="конфликт" color={theme.risk} fill={theme.white} size={20} compact />
        </g>
        <g opacity={same}>
          <Pill x={D.x + D.w / 2} y={NOTE_Y[1]} w={D.w - 40} text="по содержанию не отличить" color={theme.risk} fill={theme.white} size={18} compact />
        </g>
        <g opacity={again}>
          <Pill x={D.x + D.w / 2} y={NOTE_Y[1]} w={D.w - 40} text="заново — с номерами" color={theme.accent} fill={theme.white} size={18} compact />
        </g>
        <g opacity={guard}>
          <Pill x={D.x + D.w / 2} y={NOTE_Y[1]} w={D.w - 40} text="защита от дублей" color={theme.ok} fill={theme.okTint} size={20} compact />
        </g>
      </Panel>

      {/* подход и ответы в пути */}
      <Flying keys={[[send1, rowX, rowMid(2)], [send1 + FLY, dbIn.x, dbIn.y]]} text={setText(SETS[2])} />
      <Flying keys={[[reply1, D.x + 20, 344], [b(1) + 66, 415, 344]]} text="принято" color={theme.ok} lost={appear(frame, b(1) + 66, 20)} />
      <Flying keys={[[send2, rowX, rowMid(2)], [send2 + FLY, dbIn.x, dbIn.y]]} text={setText(SETS[2])} />
      <Flying keys={[[reply2, D.x + 20, 344], [reply2 + FLY, rowX, rowMid(2) + 14]]} text="принято" color={theme.ok} />
      <Flying keys={[[send3, rowX, rowMid(2)], [send3 + FLY, dbIn.x + 40, dbIn.y]]} text={`${SETS[2].id} · ${setText(SETS[2])}`} />
      <Flying keys={[[reply3, D.x + 20, 344], [reply3 + FLY, rowX, rowMid(2) + 14]]} text="принято" color={theme.ok} />

      {/* экран Марины */}
      <g opacity={coachIn}>
        <Panel x={C.x} y={C.y} w={C.w} h={C.h} title="Экран Марины" icon={<Avatar x={C.x + 32} y={C.y + 30} color={theme.accent} letter="М" />}>
          <Label x={C.x + 24} y={C.y + 86} anchor="start" size={20} weight={600} color={theme.soft}>
            Анна · присед · сегодня
          </Label>
          <Label x={C.x + 24} y={C.y + 132} anchor="start" size={22} weight={600} color={theme.soft}>
            подходов
          </Label>
          <Label x={C.x + C.w - 24} y={C.y + 132} anchor="end" size={26} weight={800} color={wrong ? theme.risk : theme.ink}>
            {wrong ? '4' : '3'}
          </Label>
          <Label x={C.x + 24} y={C.y + 178} anchor="start" size={22} weight={600} color={theme.soft}>
            объём
          </Label>
          <Label x={C.x + C.w - 24 - 40 * fine} y={C.y + 178} anchor="end" size={26} weight={800} color={wrong ? theme.risk : theme.ink}>
            {kgText(wrong ? VOLUME_DOUBLE : VOLUME)}
          </Label>
          <g opacity={fine}>
            <Mark x={C.x + C.w - 36} y={C.y + 170} ok r={14} />
          </g>
          <g opacity={was}>
            <Label x={C.x + C.w - 24} y={C.y + 222} anchor="end" size={18} weight={600} color={theme.soft}>
              {`было 3 и ${kgText(VOLUME)}`}
            </Label>
          </g>
        </Panel>
      </g>
      <Arrow x1={D.x + D.w + 8} y1={C.y + 140} x2={C.x - 8} y2={C.y + 140} color={theme.line} draw={coachIn} />
      <g opacity={ask}>
        <Pill x={C.x + C.w / 2} y={C.y + C.h + 24} w={250} text="просите у ИИ явно" color={theme.alt} fill={theme.white} size={20} compact />
      </g>
      <Coach x={S3.marina.x} y={S3.marina.y} scale={0.65} label="Марина" color={theme.accent} enterAt={b(2) + 34} pose={marina[0]} mood={marina[1]} />

      {/* ---- доска 2: конфликт ---- */}
      <Handset x={S3.phone2.x} y={S3.phone2.y}>
        <StatusBar s={s2} net={net2} />
        <ScreenTitle s={s2} title="Присед" count={edit > 0 && editSent < 0.5 ? 1 : 0} />
        {EDITED.map((set, i) =>
          i < 2 ? (
            <SetRow key={set.id} s={s2} i={i} text={setText(set)} id={set.id} idOn={1} sent={1} />
          ) : (
            <SetRow
              key={set.id}
              s={s2}
              i={i}
              text={setText(set)}
              id={set.id}
              idOn={1}
              sent={edit > 0 ? editSent : 1}
              strike={{ text: setText(SETS[2]), draw: edit }}
              note={flagPhone > 0 ? NOTES.plan : undefined}
              glow={editWait}
            />
          ),
        )}
        <SetInput s={s2} value="" tapAt={frame >= editTap && frame < editTap + 18 ? editTap : undefined} />
      </Handset>

      {/* запись на сервере: одна общая (камень) или две отдельные (правило) */}
      <g opacity={1 - appear(frame, planSend + FLY, 10)}>
        <Slot x={RC.x} y={REC.planY} w={RC.w} h={REC.setsY + REC.setsH - REC.planY} text="запись на сервере" />
      </g>
      <g opacity={oneIn}>
        <Panel x={RC.x} y={REC.oneY} w={RC.w} h={REC.oneH} title="Тренировка — одна запись" icon={<DbIcon x={RC.x + 32} y={REC.oneY + 30} />} stroke={overwrite > 0 ? theme.risk : theme.line}>
          <Label x={RC.x + 24} y={REC.oneY + 88} anchor="start" size={20} weight={600} color={theme.soft}>
            третий подход
          </Label>
          <Label x={RC.x + 24} y={REC.oneY + 130} anchor="start" size={22} weight={600} color={theme.soft}>
            план
          </Label>
          <Label x={RC.x + RC.w - 24} y={REC.oneY + 130} anchor="end" size={24} weight={800} color={overwrite > 0 ? theme.risk : theme.ink}>
            {setText(overwrite > 0 ? PLAN[2] : PLAN_NEW[2])}
          </Label>
          <Label x={RC.x + 24} y={REC.oneY + 172} anchor="start" size={22} weight={600} color={theme.soft}>
            сделано
          </Label>
          <Label x={RC.x + RC.w - 24} y={REC.oneY + 172} anchor="end" size={24} weight={800}>
            {setText(overwrite > 0 ? EDITED[2] : SETS[2])}
          </Label>
        </Panel>
      </g>
      <g opacity={lostEdit}>
        <Pill x={RC.x + RC.w / 2} y={REC.oneY + REC.oneH + 40} w={300} text="правка Марины пропала" color={theme.risk} fill={theme.white} size={20} compact />
      </g>
      <g opacity={splitPlan}>
        <Panel x={RC.x} y={REC.planY} w={RC.w} h={REC.planH} title="План · меняет Марина" icon={<Avatar x={RC.x + 32} y={REC.planY + 30} color={theme.accent} letter="М" />} stroke={theme.accent}>
          <Label x={RC.x + 24} y={REC.planY + 94} anchor="start" size={20} weight={600} color={theme.soft}>
            1-й и 2-й подходы
          </Label>
          <Label x={RC.x + RC.w - 24} y={REC.planY + 94} anchor="end" size={22} weight={800}>
            {setText(PLAN_NEW[0])}
          </Label>
          <Label x={RC.x + 24} y={REC.planY + 130} anchor="start" size={20} weight={600} color={theme.soft}>
            3-й подход
          </Label>
          <Label x={RC.x + RC.w - 24} y={REC.planY + 130} anchor="end" size={22} weight={800} color={theme.accent}>
            {setText(PLAN_NEW[2])}
          </Label>
        </Panel>
      </g>
      <g opacity={splitSets}>
        <Panel x={RC.x} y={REC.setsY} w={RC.w} h={REC.setsH} title="Подходы · пишет Анна" icon={<Avatar x={RC.x + 32} y={REC.setsY + 30} color={theme.ok} letter="А" />} stroke={theme.ok}>
          {EDITED.map((set, i) => (
            <g key={set.id}>
              <text x={RC.x + 24} y={REC.setsY + 88 + i * 32} fill={theme.accent} style={{ font: `600 18px ${theme.mono}`, fontVariantLigatures: 'none' }}>
                {set.id}
              </text>
              <Label x={RC.x + RC.w - 24} y={REC.setsY + 88 + i * 32} anchor="end" size={22} weight={800} color={i === 2 ? theme.ok : theme.ink}>
                {setText(set)}
              </Label>
            </g>
          ))}
        </Panel>
      </g>

      {/* экран Марины: план */}
      <Panel x={PC.x} y={PC.y} w={PC.w} h={PC.h} title="Экран Марины" icon={<Avatar x={PC.x + 32} y={PC.y + 30} color={theme.accent} letter="М" />}>
        <Label x={PC.x + 24} y={PC.y + 86} anchor="start" size={20} weight={600} color={theme.soft}>
          план · присед
        </Label>
        {PLAN.map((p, i) => {
          const y = PC.y + 102 + i * 54
          const v = i === 2 ? plan3 : p
          const lost = i === 2 && frame >= b(10) + 70 && frame < b(11) + 4
          const hot = i === 2 && planEdit > 0 && planEdit < 1
          return (
            <g key={i}>
              <rect x={PC.x + 16} y={y} width={PC.w - 32} height={44} rx={8} fill={lost ? theme.riskTint : theme.paper} stroke={lost ? theme.risk : hot ? theme.accent : theme.grid} strokeWidth={lost || hot ? 3 : 2} />
              <Label x={PC.x + 32} y={y + 30} anchor="start" size={20} weight={600} color={theme.soft}>
                {`${i + 1}-й`}
              </Label>
              <Label x={PC.x + PC.w - 32} y={y + 30} anchor="end" size={22} weight={800} color={lost ? theme.risk : i === 2 && frame >= b(9) + 20 ? theme.accent : theme.ink}>
                {setText(v)}
              </Label>
            </g>
          )
        })}
        <g opacity={flag}>
          <rect x={PC.x + 16} y={PC.y + 264} width={PC.w - 32} height={52} rx={8} fill={theme.altTint} stroke={theme.alt} strokeWidth={2.5} />
          <Label x={PC.x + 30} y={PC.y + 286} anchor="start" size={18} weight={700} color={theme.alt}>
            {`3-й сделан: ${setText(EDITED[2])}`}
          </Label>
          <Label x={PC.x + 30} y={PC.y + 308} anchor="start" size={18} weight={600} color={theme.alt}>
            по прежнему плану
          </Label>
        </g>
      </Panel>
      {/* правка плана и копия Анны в пути */}
      <Flying keys={[[planSend, PC.x + 40, PC.y + 240], [planSend + FLY, RC.x + RC.w - 60, REC.oneY + 120]]} text="новый план" color={theme.accent} />
      <Flying keys={[[copy, s2.x + s2.w - 70, rowTop(s2, 2) + 30], [copy + 26, RC.x + 70, REC.oneY + 120]]} text="копия Анны" color={theme.ok} />

    </KitScene>
  )
}
