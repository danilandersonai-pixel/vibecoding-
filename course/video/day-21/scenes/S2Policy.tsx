import { useCurrentFrame } from 'remotion'
import { Client } from '../../actors/Client'
import { Coach } from '../../actors/Coach'
import type { Mood, Pose } from '../../actors/Person'
import { KitScene } from '../../kit/KitScene'
import { appear } from '../../kit/motion'
import { Card, Label } from '../../kit/parts'
import { Callout, Mark, Pill, Slot } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { theme } from '../../theme'
import { ANNA2, LAW_PILL, POL2, POL2_H, POL_ROW, POLICY, SEE, TILE_ITEMS, TILES, tileY, TPL, TPL_ROWS } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { DataIcon, Padlock, Scales } from './parts'

const ID = 's2-policy'
const RIGHT = { x: POL2.x + POL2.w + 40, y: 110, w: 400, h: 420 }

// Сцена 2 (подводный камень): общий шаблон политики — имя, почта, «для улучшения сервиса»; а приложение
// хранит вес и замеры, фото тела, дневник питания — данные о здоровье, о них в шаблоне ни слова.
// Политика от своих данных: что, зачем, кто видит, где, как удалить; Анну видит только Марина;
// законы разные — закон своей страны или юрист.
export function S2Policy() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()

  // доска 1: общий шаблон (крупно)
  const tpl = appear(frame, b(0) + 4, 12)
  const ask = appear(frame, b(0) + 70, 10)
  const stamp = appear(frame, b(1) + 14, 10)
  const tplAt = [b(1) + 30, b(1) + 62, b(1) + 112]
  const noWord = appear(frame, b(3) + 56, 8)

  // что хранит приложение: места — сразу (видны и крупно), заголовок и плитки — по реплике
  const slots = appear(frame, b(0) + 20, 12)
  const head = appear(frame, b(2) + 10, 12)
  const tileAt = [b(2) + 64, b(2) + 104, b(2) + 140]
  const tagAt = [b(3) + 10, b(3) + 20, b(3) + 30]
  const crossAt = [b(3) + 48, b(3) + 56, b(3) + 64]
  const who = appear(frame, b(3) + 108, 12)

  // доска 2: политика по своим данным — вопрос и ответ по реплике
  const qAt = [b(4) + 60, b(4) + 92, b(4) + 112, b(4) + 134, b(4) + 160]
  const right = appear(frame, b(4) + 30, 12) * (1 - appear(frame, b(5) + 4, 8))
  const lock = appear(frame, b(5) + 40, 10)
  const only = appear(frame, b(5) + 50, 10)
  const closed = appear(frame, b(5) + 96, 10)
  const law = appear(frame, b(6) + 16, 12)

  const anna = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(3) + 100, ['surprised', 'worried']],
    [b(3) + 150, ['think', 'worried']],
  ])
  // Анна показывает на своего тренера Марину: видят только они
  const anna2 = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'happy']],
    [b(5) + 40, ['point', 'happy']],
    [b(5) + 130, ['stand', 'happy']],
    [b(6), ['think', 'neutral']],
  ])
  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(5) + 50, ['stand', 'happy']],
  ])
  const dima = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(5) + 100, ['think', 'neutral']],
  ])

  return (
    <KitScene chip="2 / 4 · Подводный камень: здоровье в политике" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* ---- доска 1: общий шаблон ---- */}
      <g opacity={tpl}>
        <Card x={TPL.x} y={TPL.y} w={TPL.w} h={TPL.h} stroke={theme.line} fill={theme.white}>
          <Label x={TPL.x + 24} y={TPL.y + 42} anchor="start" size={22} weight={800}>
            Политика конфиденциальности
          </Label>
          <line x1={TPL.x + 16} y1={TPL.y + 110} x2={TPL.x + TPL.w - 16} y2={TPL.y + 110} stroke={theme.grid} strokeWidth={2} />
        </Card>
        {TPL_ROWS.map((r, i) => (
          <g key={r} opacity={1 - appear(frame, tplAt[i], 6)}>
            <Slot x={TPL.x + 24} y={TPL.y + 130 + i * 46} w={TPL.w - 48} h={34} r={8} color={theme.grid} />
          </g>
        ))}
      </g>
      <g opacity={stamp}>
        <Pill x={TPL.x + 24 + 75} y={TPL.y + 80} text="общий шаблон" color={theme.alt} fill={theme.altTint} size={18} compact />
      </g>
      {TPL_ROWS.map((r, i) => {
        const y = TPL.y + 130 + i * 46
        return (
          <g key={r} opacity={appear(frame, tplAt[i], 6)}>
            <circle cx={TPL.x + 38} cy={y + 17} r={5} fill={theme.line} />
            <Label x={TPL.x + 54} y={y + 24} anchor="start" size={21}>
              {typed(r, frame, tplAt[i], 40)}
            </Label>
          </g>
        )
      })}
      <g opacity={ask * (1 - noWord)}>
        <Pill x={TPL.x + TPL.w / 2} y={TPL.y + 292} text="о здоровье — ?" color={theme.risk} fill={theme.white} size={20} compact />
      </g>
      <g opacity={noWord}>
        <Pill x={TPL.x + TPL.w / 2} y={TPL.y + 292} text="о здоровье — ни слова" color={theme.risk} fill={theme.riskTint} size={20} compact />
      </g>

      {/* что приложение хранит на деле: три плитки, затем пометка «здоровье» и крестики шаблону */}
      <g opacity={head}>
        <Label x={TILES.x} y={132} anchor="start" size={22} weight={800}>
          Что приложение хранит на деле
        </Label>
      </g>
      {TILE_ITEMS.map((t, i) => {
        const y = tileY(i)
        const on = appear(frame, tileAt[i], 10)
        return (
          <g key={t.title}>
            <g opacity={slots * (1 - on)}>
              <Slot x={TILES.x} y={y} w={TILES.w} h={TILES.h} text="?" />
            </g>
            <g opacity={on}>
              <Card x={TILES.x} y={y} w={TILES.w} h={TILES.h} stroke={theme.accent} fill={theme.white}>
                <DataIcon kind={t.icon} x={TILES.x + 50} y={y + TILES.h / 2} />
                <Label x={TILES.x + 96} y={y + 44} anchor="start" size={22} weight={800}>
                  {t.title}
                </Label>
                <Label x={TILES.x + 96} y={y + 76} anchor="start" size={18} color={theme.soft}>
                  {t.day}
                </Label>
              </Card>
            </g>
            <g opacity={appear(frame, tagAt[i], 8)}>
              <Pill x={TILES.x + 266} y={y + 70} w={108} text="здоровье" color={theme.risk} fill={theme.riskTint} size={18} compact />
            </g>
            <g opacity={appear(frame, crossAt[i], 8)}>
              <Mark x={(TPL.x + TPL.w + TILES.x) / 2} y={y + TILES.h / 2} ok={false} r={14} />
            </g>
          </g>
        )
      })}
      <Client x={ANNA2.x} y={ANNA2.y} scale={0.8} label="Анна" enterAt={b(2) + 50} pose={anna[0]} mood={anna[1]} />
      <g opacity={who}>
        <Callout x={ANNA2.x - 10} y={236} tx={ANNA2.x - 4} ty={ANNA2.y - 86} text="Кто видит моё фото?" color={theme.risk} />
      </g>

      {/* ---- доска 2: политика по своим данным ---- */}
      <Card x={POL2.x} y={POL2.y} w={POL2.w} h={POL2_H} stroke={theme.ok} fill={theme.white}>
        <Label x={POL2.x + 24} y={POL2.y + 44} anchor="start" size={24} weight={800}>
          Политика конфиденциальности
        </Label>
        <Pill x={POL2.x + 640} y={POL2.y + 36} text="по своим данным" color={theme.ok} fill={theme.okTint} size={18} compact />
        <line x1={POL2.x + 16} y1={POL2.y + POL_ROW.head - 4} x2={POL2.x + POL2.w - 16} y2={POL2.y + POL_ROW.head - 4} stroke={theme.grid} strokeWidth={2} />
      </Card>
      {POLICY.map((p, i) => {
        const top = POL2.y + POL_ROW.head + i * POL_ROW.h
        const on = appear(frame, qAt[i], 8)
        return (
          <g key={p.q}>
            <g opacity={1 - on}>
              <Slot x={POL2.x + 20} y={top + 8} w={POL2.w - 40} h={POL_ROW.h - 16} r={10} text={p.q.toLowerCase()} />
            </g>
            <g opacity={on}>
              <Pill x={POL2.x + 24 + POL_ROW.labelW / 2} y={top + POL_ROW.h / 2} w={POL_ROW.labelW} text={p.q} color={theme.ok} fill={theme.okTint} size={20} compact />
              <Label x={POL2.x + POL_ROW.valueX} y={top + POL_ROW.h / 2 + 7} anchor="start" size={21}>
                {typed(p.a, frame, qAt[i] + 6, 40)}
              </Label>
            </g>
          </g>
        )
      })}

      {/* кто видит данные Анны: Анна и её тренер Марина; Диме закрыто */}
      <g opacity={right}>
        <Slot x={RIGHT.x} y={RIGHT.y} w={RIGHT.w} h={RIGHT.h} r={14} text="кто видит" />
      </g>
      <Client x={SEE.anna.x} y={SEE.anna.y} scale={0.6} label="Анна" enterAt={b(5) + 6} pose={anna2[0]} mood={anna2[1]} />
      <Coach x={SEE.marina.x} y={SEE.marina.y} scale={0.6} label="Марина" enterAt={b(5) + 18} pose={marina[0]} mood={marina[1]} />
      <g opacity={lock}>
        <Padlock x={SEE.lock.x} y={SEE.lock.y} s={2} />
      </g>
      <g opacity={only}>
        <Pill x={SEE.lock.x} y={SEE.anna.y + 104} text="видят только они" color={theme.ok} fill={theme.okTint} size={20} compact />
      </g>
      <Coach x={SEE.dima.x} y={SEE.dima.y} scale={0.55} label="Дима" color={theme.alt} enterAt={b(5) + 80} pose={dima[0]} mood={dima[1]} />
      <g opacity={closed}>
        <Mark x={SEE.dima.x + 80} y={SEE.dima.y - 30} ok={false} r={14} />
        <Label x={SEE.dima.x + 102} y={SEE.dima.y - 23} anchor="start" size={20} weight={700} color={theme.risk}>
          закрыто
        </Label>
      </g>

      {/* законы разные: закон своей страны или юрист */}
      <g opacity={law}>
        <Scales x={LAW_PILL.x - 340} y={LAW_PILL.y} />
        <Pill x={LAW_PILL.x} y={LAW_PILL.y} text="требования — по закону вашей страны · спросите юриста" color={theme.soft} fill={theme.white} size={20} compact />
      </g>
    </KitScene>
  )
}
