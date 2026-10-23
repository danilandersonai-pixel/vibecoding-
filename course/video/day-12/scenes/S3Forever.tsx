import { useCurrentFrame } from 'remotion'
import { Coach } from '../../actors/Coach'
import { Hacker } from '../../actors/Hacker'
import type { Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Pill, Slot } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { theme } from '../../theme'
import { CHAIN, CHAIN_ROW, INVITE, RECORD_ROW, S3, untilText } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { Door, Stranger } from './parts'

const ID = 's3-forever'
const LINK = 'trener.app/join/marina'
const CH = S3.chat
const LI = S3.list
const DI = S3.dima
const RE = S3.record
const CN = S3.chain

// поля записи приглашения: подпись и значение (значение появляется по реплике)
const RECORD = ['код', 'тренер', 'срок', 'принял', 'отзыв']

// Сцена 3 (подводный камень): вечная многоразовая ссылка — как код от двери зала в общем чате;
// пересланная в чат, она приводит незнакомых, а угаданный адрес — к Диме. Исправление примера:
// одноразовая ссылка на 48 часов, случайный код, тренер из записи, отзыв; новичок видит только своё.
export function S3Forever() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()
  const a = (at: number, len = 10) => appear(frame, at, len)

  // доска 1: вечная ссылка и её свойства
  const tags = [a(b(0) + 50), a(b(0) + 80)]
  const who = a(b(0) + 120)
  const wide = a(4, 12) // камера на общем плане с начала: места остальных элементов подписаны и видны сразу
  const door = a(b(1) + 10, 12)
  const doorTag = a(b(1) + 50)
  const chat = a(b(2) + 6)
  const read = a(b(2) + 110)
  const strangerAt = [b(3) + 8, b(3) + 22, b(3) + 36]
  const toStrangers = a(b(3) + 4, 14)
  const toList = a(b(3) + 44, 14)
  const unknownAt = [b(3) + 54, b(3) + 68, b(3) + 82]
  const program = a(b(3) + 112)
  const guess = a(b(4) + 14)
  const guessed = a(b(4) + 76)
  const toDima = a(b(4) + 84, 16)
  const dima = a(b(4) + 70)
  const dimaUnknown = a(b(4) + 104)

  // доска 2: запись приглашения и проверки сервера
  const board2 = a(b(5) - 4, 14)
  const head = a(b(5) + 20)
  const decide = a(b(5) + 40)
  const valueAt = [b(6) + 10, b(6) + 60, b(5) + 60, b(5) + 90, b(7) + 20]
  const chainAt = [b(6) + 40, b(5) + 100, b(5) + 120, b(7) + 50]
  const final = a(b(6) + 90)
  const before = a(b(7) + 90)
  const accepted = a(b(8) + 10)
  const stranger2At = b(8) + 16
  const forward = a(b(8) + 24)
  const toRefuse = a(b(8) + 40, 12)
  const refuse = a(b(8) + 50)
  const rlsPill = a(b(8) + 64)

  const marina = stepAt<Pose>(frame, [
    [0, 'stand'],
    [b(3) + 60, 'surprised'],
    [b(4) + 20, 'think'],
  ])
  const marina2 = stepAt<Pose>(frame, [
    [0, 'think'],
    [b(7), 'stand'],
    [b(8) + 50, 'cheer'],
  ])

  return (
    <KitScene chip="3 / 4 · Подводный камень: вечная ссылка" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* вечная многоразовая ссылка */}
      <Pill x={S3.link.x} y={S3.link.y} text={LINK} color={theme.risk} fill={theme.riskTint} size={24} mono />
      <g opacity={tags[0]}>
        <Pill x={S3.link.x - 100} y={S3.tagY} text="вечная" color={theme.risk} fill={theme.white} size={20} compact />
      </g>
      <g opacity={tags[1]}>
        <Pill x={S3.link.x + 50} y={S3.tagY} text="многоразовая" color={theme.risk} fill={theme.white} size={20} compact />
      </g>
      <Pill x={S3.count.x} y={S3.count.y} w={118} text={`вошли: ${1 + unknownAt.filter((at) => frame >= at).length}`} color={theme.risk} fill={theme.white} size={20} compact />
      <g opacity={who}>
        <Label x={S3.link.x} y={S3.whoY} size={20} weight={600} color={theme.soft}>
          кто открыл — тот и подопечный
        </Label>
      </g>

      {/* как код от двери зала в общем чате */}
      <g opacity={wide * (1 - door)}>
        <Slot x={S3.door.x - 46} y={S3.door.y - 70} w={92} h={140} text="дверь" />
      </g>
      <g opacity={door}>
        <Door x={S3.door.x} y={S3.door.y} />
      </g>
      <g opacity={doorTag}>
        <Pill x={S3.door.x} y={S3.door.y + 98} text="код — в общем чате" color={theme.risk} fill={theme.white} size={18} compact />
      </g>

      {/* чат зала: Анна пересылает ссылку */}
      <g opacity={wide * (1 - chat)}>
        <Slot x={CH.x} y={CH.y} w={CH.w} h={CH.h} text="чат зала" />
      </g>
      <g opacity={chat}>
        <Card x={CH.x} y={CH.y} w={CH.w} h={CH.h} stroke={theme.line} fill={theme.paper}>
          <Label x={CH.x + 20} y={CH.y + 34} anchor="start" size={20} color={theme.soft} weight={600}>
            Чат «Зал на Ленина» · 40 человек
          </Label>
          <rect x={CH.x + 16} y={CH.y + 50} width={CH.w - 32} height={86} rx={14} fill={theme.okTint} stroke={theme.ok} strokeWidth={2} />
          <Label x={CH.x + 32} y={CH.y + 80} anchor="start" size={20} color={theme.ok} weight={700}>
            Анна:
          </Label>
          <Label x={CH.x + 98} y={CH.y + 80} anchor="start" size={20} weight={500}>
            {typed('Классный тренер!', frame, b(2) + 24, 30)}
          </Label>
          <text x={CH.x + 32} y={CH.y + 118} fill={theme.risk} style={{ font: `600 20px ${theme.mono}`, whiteSpace: 'pre' }}>
            {typed(LINK, frame, b(2) + 50, 40)}
          </text>
          <g opacity={read}>
            <Label x={CH.x + CH.w - 32} y={CH.y + 118} anchor="end" size={18} color={theme.soft} weight={600}>
              прочитали все
            </Label>
          </g>
        </Card>
      </g>

      {/* трое незнакомых из чата — в списке Марины */}
      <Arrow x1={CH.x + CH.w + 4} y1={S3.strangerY} x2={S3.strangers[0] - 34} y2={S3.strangerY} color={theme.risk} draw={toStrangers} />
      {S3.strangers.map((x, i) => (
        <Stranger key={x} x={x} y={S3.strangerY} scale={0.5} enterAt={strangerAt[i]} />
      ))}
      <g opacity={a(b(3) + 40)}>
        <Pill x={S3.strangers[1]} y={S3.strangerY + 64} text="трое незнакомых" color={theme.risk} fill={theme.white} size={18} compact />
      </g>
      <Arrow x1={S3.strangers[2] + 36} y1={S3.strangerY - 30} x2={LI.x - 8} y2={LI.y + 196} color={theme.risk} draw={toList} />

      <g opacity={wide}>
        <Card x={LI.x} y={LI.y} w={LI.w} h={LI.h} stroke={theme.accent} fill={theme.paper}>
          <Label x={LI.x + 20} y={LI.y + 38} anchor="start" size={22} weight={700} color={theme.accent}>
            Подопечные Марины
          </Label>
          <rect x={LI.x + 16} y={LI.y + 52} width={LI.w - 32} height={36} rx={8} fill={theme.okTint} stroke={theme.ok} strokeWidth={2.5} />
          <Label x={LI.x + 32} y={LI.y + 77} anchor="start" size={20} weight={700}>
            Анна
          </Label>
          {unknownAt.map((at, i) => (
            <g key={at}>
              <g opacity={1 - a(at)}>
                <Slot x={LI.x + 16} y={LI.y + 96 + i * 44} w={LI.w - 32} h={36} r={8} />
              </g>
              <g opacity={a(at)}>
                <rect x={LI.x + 16} y={LI.y + 96 + i * 44} width={LI.w - 32} height={36} rx={8} fill={theme.riskTint} stroke={theme.risk} strokeWidth={2.5} />
                <Label x={LI.x + 32} y={LI.y + 121 + i * 44} anchor="start" size={20} weight={700} color={theme.risk}>
                  ??? · из чата
                </Label>
              </g>
            </g>
          ))}
          <g opacity={program}>
            <Pill x={LI.x + LI.w / 2} y={LI.y + 250} text="им видна программа «Старт»" color={theme.risk} fill={theme.white} size={18} compact />
          </g>
        </Card>
      </g>
      <Coach x={S3.marina.x} y={S3.marina.y} scale={0.55} label="Марина" enterAt={6} pose={marina} mood={frame >= b(3) + 60 ? 'worried' : 'neutral'} />

      {/* угаданный адрес: join/dima ведёт к Диме */}
      <g opacity={wide * (1 - guess)}>
        <Slot x={S3.guess.x - 140} y={S3.guess.y - 20} w={280} h={40} r={20} text="другой адрес?" />
      </g>
      <Hacker x={S3.hacker.x} y={S3.hacker.y} scale={0.5} enterAt={b(4) + 6} />
      <g opacity={guess}>
        <Pill x={S3.guess.x} y={S3.guess.y} w={280} text={'trener.app/join/' + typed('dima', frame, b(4) + 40, 8)} color={theme.risk} fill={theme.riskTint} size={20} mono />
      </g>
      <g opacity={guessed}>
        <Pill x={S3.guess.x} y={S3.guess.y + 52} text="угадали адрес" color={theme.risk} fill={theme.white} size={18} compact />
      </g>
      <Arrow x1={S3.guess.x + 146} y1={S3.guess.y} x2={DI.x - 8} y2={S3.guess.y} color={theme.risk} draw={toDima} />
      <g opacity={wide * (1 - dima)}>
        <Slot x={DI.x} y={DI.y} w={DI.w} h={DI.h} text="тренер Дима" />
      </g>
      <g opacity={dima}>
        <Card x={DI.x} y={DI.y} w={DI.w} h={DI.h} stroke={theme.alt} fill={theme.paper}>
          <Label x={DI.x + 16} y={DI.y + 32} anchor="start" size={20} weight={700} color={theme.alt}>
            Подопечные Димы
          </Label>
          <rect x={DI.x + 14} y={DI.y + 44} width={DI.w - 28} height={30} rx={7} fill={theme.altTint} stroke={theme.alt} strokeWidth={2} />
          <Label x={DI.x + 28} y={DI.y + 66} anchor="start" size={18} weight={700}>
            Олег
          </Label>
          <g opacity={dimaUnknown}>
            <rect x={DI.x + 14} y={DI.y + 80} width={DI.w - 28} height={30} rx={7} fill={theme.riskTint} stroke={theme.risk} strokeWidth={2} />
            <Label x={DI.x + 28} y={DI.y + 102} anchor="start" size={18} weight={700} color={theme.risk}>
              ??? · угадал адрес
            </Label>
          </g>
        </Card>
      </g>

      {/* доска 2: приглашение — запись в базе */}
      <g opacity={board2}>
        <Card x={RE.x} y={RE.y} w={RE.w} h={RE.h} stroke={theme.accent} fill={theme.paper}>
          <g opacity={head}>
            <Label x={RE.x + 24} y={RE.y + 40} anchor="start" size={22} weight={700} color={theme.accent}>
              Приглашение · запись в базе
            </Label>
          </g>
          <g opacity={decide}>
            <Pill x={RE.x + 444} y={RE.y + 34} text="решаете вы" color={theme.alt} fill={theme.white} size={18} compact />
          </g>
          {RECORD.map((k, i) => {
            const y = RE.y + 64 + i * RECORD_ROW
            const v = a(valueAt[i])
            return (
              <g key={k}>
                <line x1={RE.x + 20} y1={y} x2={RE.x + RE.w - 20} y2={y} stroke={theme.grid} strokeWidth={2} />
                <Label x={RE.x + 24} y={y + 33} anchor="start" size={20} color={theme.soft}>
                  {k}
                </Label>
                <g opacity={1 - v}>
                  <Slot x={RE.x + 146} y={y + 8} w={250} h={34} r={8} />
                </g>
                <g opacity={v}>
                  {i === 0 && (
                    <text x={RE.x + 150} y={y + 33} fill={theme.ink} style={{ font: `600 20px ${theme.mono}`, whiteSpace: 'pre' }}>
                      {typed(INVITE.code, frame, valueAt[0] + 4, 30)}
                    </text>
                  )}
                  {i === 1 && (
                    <>
                      <Label x={RE.x + 150} y={y + 33} anchor="start" size={20} weight={700} color={theme.accent}>
                        Марина
                      </Label>
                      <Label x={RE.x + 234} y={y + 33} anchor="start" size={18} color={theme.soft}>
                        · из записи, не из адреса
                      </Label>
                    </>
                  )}
                  {i === 2 && (
                    <Label x={RE.x + 150} y={y + 33} anchor="start" size={20} weight={600}>
                      {`${INVITE.hours} ч · ${untilText(INVITE)}`}
                    </Label>
                  )}
                  {i === 3 && (
                    <Label x={RE.x + 150} y={y + 33} anchor="start" size={20} weight={700} color={accepted > 0 ? theme.ok : theme.soft}>
                      {accepted > 0 ? `${INVITE.acceptedBy} · один раз` : '— пока никто'}
                    </Label>
                  )}
                  {i === 4 && (
                    <g>
                      {/* отозвать можно, пока не приняли; после Анны кнопка гаснет */}
                      <rect x={RE.x + 150} y={y + 8} width={140} height={34} rx={8} fill={theme.white} stroke={accepted > 0 ? theme.line : theme.risk} strokeWidth={2.5} />
                      <Label x={RE.x + 220} y={y + 32} size={20} weight={700} color={accepted > 0 ? theme.line : theme.risk}>
                        Отозвать
                      </Label>
                      <g opacity={before}>
                        <Label x={RE.x + 306} y={y + 32} anchor="start" size={18} color={theme.soft}>
                          {accepted > 0 ? '— уже принято' : '— пока не приняли'}
                        </Label>
                      </g>
                    </g>
                  )}
                </g>
              </g>
            )
          })}
        </Card>

        {/* сервер проверяет ссылку по порядку */}
        <Card x={CN.x} y={CN.y} w={CN.w} h={CN.h} stroke={theme.ok} fill={theme.paper}>
          <Label x={CN.x + 24} y={CN.y + 40} anchor="start" size={22} weight={700} color={theme.ok}>
            Сервер проверяет ссылку
          </Label>
          {CHAIN.map((c, i) => {
            const y = CN.y + 60 + i * CHAIN_ROW
            const v = a(chainAt[i])
            const hit = i === 1 ? refuse : 0
            return (
              <g key={c.ask}>
                <g opacity={1 - v}>
                  <Slot x={CN.x + 20} y={y} w={CN.w - 40} h={44} r={10} />
                </g>
                <g opacity={v}>
                  <rect x={CN.x + 20} y={y} width={CN.w - 40} height={44} rx={10} fill={theme.paper} stroke={theme.line} strokeWidth={2} />
                  <circle cx={CN.x + 44} cy={y + 22} r={13} fill={theme.ok} />
                  <Label x={CN.x + 44} y={y + 29} size={18} weight={700} color={theme.white}>
                    {String(i + 1)}
                  </Label>
                  <Label x={CN.x + 68} y={y + 29} anchor="start" size={20} weight={600}>
                    {c.ask}
                  </Label>
                  <Label x={CN.x + 330} y={y + 29} anchor="end" size={18} color={theme.soft}>
                    нет →
                  </Label>
                  <Pill x={CN.x + 444} y={y + 22} w={176} text={c.no} color={theme.risk} fill={hit > 0 ? theme.riskTint : theme.white} size={18} compact />
                </g>
              </g>
            )
          })}
          <g opacity={final}>
            <Pill x={CN.x + CN.w / 2} y={CN.y + 60 + 4 * CHAIN_ROW + 22} w={420} text="✓ подопечный тренера из записи" color={theme.ok} fill={theme.okTint} size={20} compact />
          </g>
        </Card>
      </g>

      {/* ссылка из чата больше не работает; новичок видит только своё */}
      <Stranger x={S3.stranger2.x} y={S3.stranger2.y} scale={0.5} enterAt={stranger2At} />
      <g opacity={forward}>
        <Pill x={S3.forward.x} y={S3.forward.y} text="…/join/k7Qx9fLm2aT4" color={theme.soft} fill={theme.white} size={18} mono />
        <Label x={S3.forward.x} y={S3.forward.y + 46} size={18} color={theme.soft}>
          ссылка из чата
        </Label>
      </g>
      <Arrow x1={S3.forward.x + 126} y1={S3.forward.y} x2={S3.refuse.x - 110} y2={S3.refuse.y} color={theme.risk} draw={toRefuse} />
      <g opacity={refuse}>
        <Pill x={S3.refuse.x} y={S3.refuse.y} text="отказ: уже принято" color={theme.risk} fill={theme.riskTint} size={18} compact />
      </g>
      <g opacity={rlsPill}>
        <Pill x={S3.rlsPill.x} y={S3.rlsPill.y} text="новичок видит только своё" color={theme.ok} fill={theme.okTint} size={18} compact />
      </g>
      <Coach x={S3.marina2.x} y={S3.marina2.y} scale={0.55} label="Марина" enterAt={b(5) + 30} pose={marina2} mood={frame >= b(8) + 50 ? 'happy' : 'neutral'} />
    </KitScene>
  )
}
