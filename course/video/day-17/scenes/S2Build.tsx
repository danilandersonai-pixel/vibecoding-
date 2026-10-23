import { useCurrentFrame } from 'remotion'
import { Agent } from '../../actors/Agent'
import { Coach } from '../../actors/Coach'
import { Database } from '../../actors/Database'
import type { Mood, Pose } from '../../actors/Person'
import { Phone } from '../../actors/Phone'
import { KitScene } from '../../kit/KitScene'
import { appear, trackAt } from '../../kit/motion'
import { Arrow, Card, Label } from '../../kit/parts'
import { Browser, Mark, Pill, Slot } from '../../kit/props'
import { stepAt, typed } from '../../kit/reveal'
import { PHONE_SCALE } from '../../kit/screens/layout'
import { theme } from '../../theme'
import { ANNA, FORM, HIPS, LINK_PUBLIC, PHOTOS, photoPath, S2, shortDate, storageThumbX, THUMB, TREND, WAIST, WEIGHT } from '../layout'
import { beat, sceneDuration, STAGING } from '../script'
import { CameraScreen, MeasureScreen, PhotoThumb, Trend } from './parts'

const ID = 's2-build'
const BR = S2.browser
const ST = S2.storage
const TB = S2.table
const B2 = S2.browser2
const CH = 12 // ширина знака моноширинного шрифта 20 px

const fmt = (v: number) => String(v).replace('.', ',')
// строки замеров Анны в базе: номер Анны, что и сколько
const ROWS = [`${ANNA} · вес ${fmt(WEIGHT[4])}`, `${ANNA} · талия ${fmt(WAIST[4])}`, `${ANNA} · бёдра ${fmt(HIPS[4])}`]

// Сцена 2 (что строим сегодня): замеры — строки в базе и графики у Марины; фото — файлы в хранилище
// файлов, в таблице только путь (папка 17 — номер Анны, дата снимка); Марина открывает фото рядом
// с графиком. Агент собрал всё за вечер — а как открывается фото?
export function S2Build() {
  const b = (i: number) => beat(ID, i)
  const frame = useCurrentFrame()
  const a = (at: number, len = 10) => appear(frame, at, len)

  // доска 1: форма замеров → база → графики Марины
  const shown = [b(0) + 40, b(0) + 62, b(0) + 84].filter((at) => frame >= at).length
  const tap = b(0) + 104
  const toDb = a(b(0) + 108, 14)
  const db = a(b(0) + 112)
  const dbLit = frame >= b(0) + 126
  const dbTag = a(b(0) + 140)
  const toPage = a(b(1) + 4, 14)
  const page = b(1) + 10
  const weightAt = b(1) + 34
  const weightTag = a(b(1) + 120)
  const waistAt = b(2) + 8
  const waistTag = a(b(2) + 70)

  // доска 2: камера → хранилище → таблица с путями → страница Марины
  const phone2 = b(3) + 30
  const storage = a(b(3) + 40)
  const toStorage = a(b(3) + 50, 14)
  const thumbAt = [b(3) + 60, b(3) + 74]
  const notTable = a(b(3) + 100) * (1 - a(b(3) + 150))
  const table = a(b(3) + 150)
  const rowAt = [b(4) + 10, b(4) + 26, b(5) + 64]
  const folderHi = a(b(4) + 70)
  const dateHi = a(b(4) + 120)
  const shot = b(5) + 10
  const fly = trackAt(frame, [
    [b(5) + 24, S2.phone2.x - 30, S2.phone2.y - 60],
    [b(5) + 56, storageThumbX(ST.x, 2), ST.y + 98],
  ])
  const flying = frame >= b(5) + 24 && frame < b(5) + 56
  const flyW = 60 + (THUMB.w - 60) * appear(frame, b(5) + 24, 32)
  const landed = frame >= b(5) + 56
  const page2 = b(5) + 70
  const photo2 = a(b(5) + 90)
  const agentIn = b(6) + 8
  const works = a(b(6) + 36)
  // остальное гаснет, камера едет к странице Марины; адрес фото набирается, «public» подсвечивается
  const rest = 1 - a(b(6) + 80)
  const link = typed(LINK_PUBLIC, frame, b(6) + 124, 40)
  const pub = a(b(6) + 160)

  const marina = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(1) + 40, ['point', 'neutral']],
    [b(2) + 80, ['cheer', 'happy']],
  ])
  const marina2 = stepAt<[Pose, Mood]>(frame, [
    [0, ['stand', 'neutral']],
    [b(5) + 90, ['point', 'happy']],
  ])

  // строка таблицы с подсветкой папки и даты: (x, y) — начало базовой линии
  const pathRow = (path: string, x: number, y: number, at: number) => (
    <g key={path}>
      <rect x={x - 3} y={y - 19} width={3 * CH + 4} height={26} rx={5} fill={theme.accentTint} opacity={folderHi * a(at, 6)} />
      <rect x={x + 3 * CH - 1} y={y - 19} width={10 * CH + 2} height={26} rx={5} fill={theme.altTint} opacity={dateHi * a(at + 4, 8)} />
      <text x={x} y={y} fill={theme.ink} style={{ font: `500 20px ${theme.mono}`, whiteSpace: 'pre', fontVariantLigatures: 'none' }}>
        {typed(path, frame, at, 40)}
      </text>
    </g>
  )

  return (
    <KitScene chip="2 / 4 · Что строим сегодня" duration={sceneDuration(ID)} {...STAGING[ID]}>
      {/* ===== доска 1: замеры ===== */}
      <Pill x={S2.phone.x} y={128} text={`Анна · ${ANNA}`} color={theme.ok} fill={theme.white} size={20} compact />
      <Phone x={S2.phone.x} y={S2.phone.y} scale={PHONE_SCALE} enterAt={2}>
        <MeasureScreen rows={FORM} shown={shown} tapAt={tap} saved={frame >= tap + 6} />
      </Phone>
      <Arrow x1={S2.phone.x + 100} y1={S2.phone.y} x2={S2.db.x - 136} y2={S2.phone.y} color={theme.ok} draw={toDb} />
      <g opacity={1 - db}>
        <Slot x={S2.db.x - 139} y={S2.db.y - 90} w={278} h={180} text="база" />
      </g>
      {frame >= b(0) + 112 && <Database x={S2.db.x} y={S2.db.y} enterAt={b(0) + 112} rows={ROWS.map((text) => ({ text, color: theme.ok, dim: !dbLit }))} />}
      <g opacity={dbTag}>
        <Pill x={S2.db.x} y={206} text="таблица «замеры»" color={theme.soft} fill={theme.white} size={20} compact />
      </g>
      <Arrow x1={S2.db.x + 142} y1={S2.db.y} x2={BR.x - 8} y2={S2.db.y} color={theme.accent} draw={toPage} />
      <g opacity={1 - a(page)}>
        <Slot x={BR.x} y={BR.y} w={BR.w} h={BR.h} text="страница Марины" />
      </g>
      <Browser x={BR.x} y={BR.y} w={BR.w} h={BR.h} at={page} url={`trener.app/clients/${ANNA}`}>
        <Label x={20} y={76} anchor="start" size={22} weight={800}>
          Анна · замеры
        </Label>
        <Pill x={BR.w - 62} y={68} text="пример" color={theme.soft} fill={theme.white} size={18} compact />
        <Trend x={18} y={94} w={210} h={222} title="Вес, кг" values={WEIGHT} min={TREND.weight.min} max={TREND.weight.max} at={weightAt} unit="кг" />
        <Trend x={252} y={94} w={210} h={222} title="Талия, см" values={WAIST} min={TREND.waist.min} max={TREND.waist.max} at={waistAt} color={theme.alt} unit="см" />
      </Browser>
      <g opacity={weightTag}>
        <Pill x={BR.x + 123} y={BR.y + BR.h + 30} text="вес почти стоит" color={theme.soft} fill={theme.white} size={20} compact />
      </g>
      <g opacity={waistTag}>
        <Pill x={BR.x + 357} y={BR.y + BR.h + 30} text="талия −2,5 см" color={theme.alt} fill={theme.altTint} size={20} compact />
      </g>
      <Coach x={S2.marina.x} y={S2.marina.y} scale={0.5} label="Марина" enterAt={b(1) + 14} pose={marina[0]} mood={marina[1]} />

      {/* ===== доска 2: фото ===== */}
      <g opacity={rest}>
        <Pill x={S2.phone2.x} y={128} text={`Анна · ${ANNA}`} color={theme.ok} fill={theme.white} size={20} compact />
        <Phone x={S2.phone2.x} y={S2.phone2.y} scale={PHONE_SCALE} enterAt={phone2}>
          <CameraScreen tapAt={shot} done={frame >= shot + 14} />
        </Phone>
        <Arrow x1={S2.phone2.x + 100} y1={ST.y + 140} x2={ST.x - 20} y2={ST.y + 140} color={theme.ok} draw={toStorage} />

        {/* хранилище файлов: папка Анны и снимки */}
        <g opacity={1 - storage}>
          <Slot x={ST.x} y={ST.y} w={ST.w} h={ST.h} text="хранилище файлов" />
        </g>
        <g opacity={storage}>
          <Card x={ST.x} y={ST.y} w={ST.w} h={ST.h} stroke={theme.alt} fill={theme.white}>
            <Label x={ST.x + 22} y={ST.y + 38} anchor="start" size={22} weight={800}>
              Хранилище файлов
            </Label>
            <Pill x={ST.x + ST.w - 70} y={ST.y + 30} text="Supabase" color={theme.soft} fill={theme.white} size={18} compact />
            <path d={`M${ST.x + 24} ${ST.y + 60} h14 l5 6 h19 v20 h-38 Z`} fill={theme.altTint} stroke={theme.alt} strokeWidth={2.5} strokeLinejoin="round" />
            <text x={ST.x + 72} y={ST.y + 82} fill={theme.ink} style={{ font: `600 20px ${theme.mono}`, whiteSpace: 'pre' }}>
              {`${ANNA}/`}
            </text>
          </Card>
          {PHOTOS.map((d, i) => {
            const x = storageThumbX(ST.x, i)
            const y = ST.y + 98
            if (i < 2) {
              return (
                <g key={d} opacity={a(thumbAt[i])}>
                  <PhotoThumb x={x} y={y} w={THUMB.w} h={THUMB.h} date={shortDate(d)} />
                </g>
              )
            }
            return (
              <g key={d}>
                {!landed && <Slot x={x} y={y} w={THUMB.w} h={THUMB.h} r={8} />}
                {landed && <PhotoThumb x={x} y={y} w={THUMB.w} h={THUMB.h} date={shortDate(d)} stroke={theme.ok} />}
              </g>
            )
          })}
        </g>
        {flying && <PhotoThumb x={fly.x} y={fly.y} w={flyW} h={(flyW * THUMB.h) / THUMB.w} stroke={theme.ok} />}

        {/* таблица: только путь к файлу */}
        <g opacity={1 - table}>
          <Slot x={TB.x} y={TB.y} w={TB.w} h={TB.h} text={notTable > 0 ? undefined : 'таблица'} />
        </g>
        <g opacity={notTable}>
          <PhotoThumb x={TB.x + 150} y={TB.y + 32} w={56} h={72} />
          <Mark x={TB.x + 236} y={TB.y + 68} ok={false} r={18} />
        </g>
        <g opacity={table}>
          <Card x={TB.x} y={TB.y} w={TB.w} h={TB.h} stroke={theme.line} fill={theme.white}>
            <Label x={TB.x + 20} y={TB.y + 30} anchor="start" size={20} weight={700}>
              таблица «фото» · путь к файлу
            </Label>
          </Card>
          {PHOTOS.map((d, i) => pathRow(photoPath(d), TB.x + 20, TB.y + 62 + i * 30, rowAt[i]))}
          <g opacity={folderHi}>
            <Pill x={TB.x + TB.w - 78} y={TB.y + 55} w={130} text="номер Анны" color={theme.accent} fill={theme.white} size={18} compact />
          </g>
          <g opacity={dateHi}>
            <Pill x={TB.x + TB.w - 78} y={TB.y + 90} w={130} text="дата снимка" color={theme.alt} fill={theme.white} size={18} compact />
          </g>
        </g>

        <Agent x={S2.agent.x} y={S2.agent.y} scale={0.5} enterAt={agentIn} pose="done" />
        <Coach x={S2.marina2.x} y={S2.marina2.y} scale={0.5} label="Марина" enterAt={b(5) + 76} pose={marina2[0]} mood={marina2[1]} />
        <g opacity={works}>
          <Pill x={S2.marina2.x + 158} y={S2.marina2.y - 4} text="всё работает" color={theme.ok} fill={theme.okTint} size={20} compact />
        </g>
      </g>

      {/* страница Марины: график и фото рядом, внизу — адрес фото */}
      <g opacity={1 - a(page2)}>
        <Slot x={B2.x} y={B2.y} w={B2.w} h={B2.h} text="страница Марины" />
      </g>
      <Browser x={B2.x} y={B2.y} w={B2.w} h={B2.h} at={page2} url={`trener.app/clients/${ANNA}`}>
        <Label x={18} y={74} anchor="start" size={22} weight={800}>
          Анна · прогресс
        </Label>
        <Trend x={14} y={88} w={210} h={196} title="Талия, см" values={WAIST} min={TREND.waist.min} max={TREND.waist.max} at={page2} color={theme.alt} unit="см" />
        <g opacity={1 - photo2}>
          <Slot x={256} y={92} w={150} h={176} r={8} text="фото" />
        </g>
        <g opacity={photo2}>
          <PhotoThumb x={256} y={92} w={150} h={176} date={shortDate(PHOTOS[2])} />
        </g>
        <rect x={20 + 2 * CH - 2} y={B2.h - 33} width={6 * CH + 4} height={26} rx={5} fill={theme.riskTint} stroke={theme.risk} strokeWidth={2} opacity={pub} />
        <text x={20} y={B2.h - 14} fill={theme.ink} style={{ font: `500 20px ${theme.mono}`, whiteSpace: 'pre', fontVariantLigatures: 'none' }}>
          {link}
        </text>
      </Browser>
    </KitScene>
  )
}
