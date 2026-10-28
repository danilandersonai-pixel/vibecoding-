import { totalFrames, validateScript } from '../lib/timeline'
import type { Cue } from '../types'
import { bookSection } from './book'
import { buildLesson, cameraKeys, isBeat, lessonCtx, sceneParts, SPOT_EDGE, spotTimed, spotWindow } from './build'
import type { BuiltScene } from './build'
import { cameraAt, toScreen } from './camera'
import type { Shot } from './camera'
import { HEADER_BOOK, bookRoom, cellsFor, titleRoom, verdictWidth } from './chrome/layout'
import type { FrameCtx, Rect } from './frame'
import { frameDef } from './frames'
import type { FrameSpec } from './frames'
import { shownLines } from './frames/shown'
import { beatProblem } from './frames/source'
import { terminalScrolls } from './frames/terminalPlan'
import type { Lesson, LessonChapter, LessonScene, Role } from './lesson'
import { balanceText, fitText } from './text'
import { CANVAS, FPS, MOTION, SUBS } from './theme'

// Проверка урока (спецификация §6.2 и §9): пустой список — урок готов. Каждая строка называет сцену («сцена «id»: …»),
// главу или урок и говорит, что не так. Логику кадров не повторяет: части, моменты и показанные строки берёт у самих кадров.

/** Кадры записей: такой есть в тематических главах ролика главы (где тема позволяет) и в «Примере» ролика дня. */
export const RECORD_FRAMES: FrameSpec['type'][] = ['terminal', 'editor', 'diff', 'agent', 'gitlog', 'browser']
/** Длина ролика, кадров: глава 3–4,5 мин, день 1–3 мин. */
export const LENGTH = { chapter: [5400, 8100], day: [1800, 5400] } as const
/** Пояснений по нажатию — не меньше. */
export const MIN_SPOTS = { chapter: 2, day: 1 } as const
/** Главы ролика дня по порядку: название и роль сцен. */
export const DAY_CHAPTERS: { title: string; role: Role }[] = [
  { title: 'Что строим сегодня', role: 'intro' },
  { title: 'Пример', role: 'example' },
  { title: 'Подводный камень', role: 'mistake' },
  { title: 'Проверьте у себя', role: 'summary' },
]
/** Субтитры не быстрее, знаков в секунду. */
export const MAX_CPS = 15
/** Тематических глав у ролика главы и из них с кадром записи — не меньше. */
const THEMES = { min: 3, max: 5, records: 3 }
/** Порядок ролей в тематической главе. */
const ORDER: Partial<Record<Role, number>> = { explain: 0, example: 1, mistake: 2 }

/**
 * Шум песочницы: контейнер записи без доступа к fonts.googleapis.com, и dev-сервер Next.js пишет предупреждения про Google Fonts
 * (с «Import trace» шрифтов рядом). Это артефакт записи, а не урок: зрителю такие строки не показываем.
 */
const NOISE = [/fonts\.googleapis\.com/, /Failed to download .* from Google Fonts/, /internal\/font\/google/]
const NEAR = 8

/** Строки шума песочницы среди показанных: о Google Fonts и «Import trace» не дальше NEAR строк от них. */
export function sandboxNoise(lines: string[]): string[] {
  const loud = lines.map((l) => NOISE.some((re) => re.test(l)))
  return lines.filter((l, i) => loud[i] || (/Import trace/.test(l) && loud.some((x, j) => x && Math.abs(i - j) <= NEAR)))
}

const mmss = (frames: number) => {
  const s = Math.round(frames / FPS)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
const quote = (text: string) => `«${fitText(text, 48)}»`
const sameShot = (a: Shot, b: Shot) => Math.abs(a.x - b.x) < 0.01 && Math.abs(a.y - b.y) < 0.01 && Math.abs(a.zoom - b.zoom) < 1e-4
const isRecord = (s: LessonScene) => RECORD_FRAMES.includes(s.frame.type)

function structureProblems(lesson: Lesson): string[] {
  const out: string[] = []
  const L = `урок «${lesson.id}»`
  const chapters = lesson.chapters
  if (chapters.length < 2) return [`${L}: глав ${chapters.length}, а нужны хотя бы первая («Что узнаете») и последняя («Итог»)`]

  const single = (c: LessonChapter, role: Role, type: FrameSpec['type'], which: string) => {
    const s = c.scenes
    if (s.length !== 1 || s[0].role !== role || s[0].frame.type !== type) {
      const here = s.length === 1 ? `сцена ${s[0].role} с кадром ${s[0].frame.type}` : `сцен ${s.length}`
      out.push(`глава «${c.id}»: ${which} глава — одна сцена ${role} с кадром ${type}, а здесь ${here}`)
    }
  }
  single(chapters[0], 'intro', 'agenda', 'первая')
  single(chapters[chapters.length - 1], 'summary', 'recap', 'последняя')

  if (lesson.kind === 'chapter') {
    const themes = chapters.slice(1, -1)
    if (themes.length < THEMES.min || themes.length > THEMES.max) out.push(`${L}: тематических глав ${themes.length}, а у ролика главы их ${THEMES.min}–${THEMES.max}`)
    for (const c of themes) {
      let rank = -1
      let prev: Role | null = null
      for (const s of c.scenes) {
        const r = ORDER[s.role]
        if (r === undefined) {
          out.push(`сцена «${s.id}»: роль ${s.role} бывает только в первой и последней главе, а в тематической — explain, example, mistake`)
          continue
        }
        if (r < rank) out.push(`глава «${c.id}»: сцены идут не по порядку explain → example → mistake: «${s.id}» (${s.role}) после ${prev}`)
        if (r >= rank) {
          rank = r
          prev = s.role
        }
      }
      for (const role of ['explain', 'example', 'mistake'] as const) {
        if (!c.scenes.some((s) => s.role === role)) out.push(`глава «${c.id}»: нет сцены с ролью ${role} — в тематической главе по порядку объяснение, пример и типичная ошибка`)
      }
    }
    const withRecord = themes.filter((c) => c.scenes.some(isRecord)).length
    const need = Math.min(THEMES.records, themes.length)
    if (withRecord < need) out.push(`${L}: кадр записи (${RECORD_FRAMES.join(', ')}) есть в ${withRecord} тематических главах, а нужен не меньше чем в ${need}`)
  } else {
    if (chapters.length !== DAY_CHAPTERS.length) {
      out.push(`${L}: у ролика дня ${DAY_CHAPTERS.length} главы — ${DAY_CHAPTERS.map((d) => `«${d.title}»`).join(' → ')}, а здесь ${chapters.length}`)
    } else {
      chapters.forEach((c, i) => {
        const want = DAY_CHAPTERS[i]
        if (c.title !== want.title) out.push(`глава «${c.id}»: у ролика дня глава ${i + 1} — «${want.title}», а здесь «${c.title}»`)
        if (i === 1 || i === 2) {
          for (const s of c.scenes) if (s.role !== want.role) out.push(`сцена «${s.id}»: в главе «${want.title}» сцены с ролью ${want.role}, а здесь ${s.role}`)
        }
      })
      const example = chapters[1]
      if (!example.scenes.some(isRecord)) out.push(`глава «${example.id}»: в «Примере» нужна сцена с кадром записи (${RECORD_FRAMES.join(', ')})`)
    }
  }
  return out
}

function bookProblems(lesson: Lesson): string[] {
  const out: string[] = []
  for (const id of lesson.book) if (!bookSection(id)) out.push(`урок «${lesson.id}»: раздела книги «${id}» нет (book-sections.json)`)
  for (const c of lesson.chapters) {
    for (const id of c.book ?? []) if (!bookSection(id)) out.push(`глава «${c.id}»: раздела книги «${id}» нет (book-sections.json)`)
  }
  return out
}

// Реплики сцены: не быстрее MAX_CPS и не больше двух строк субтитров — тем же переносом, что рисует TermSubtitles.
function cueProblems(b: BuiltScene, cues: Cue[]): string[] {
  const S = `сцена «${b.id}»`
  const out: string[] = []
  if (b.scene.lines.length === 0) out.push(`${S}: нет реплик — время сцены считается из них`)
  cues.forEach((c, i) => {
    const cps = [...c.text].length / ((c.to - c.from) / FPS)
    if (cps > MAX_CPS) out.push(`${S}: реплика ${i} ${quote(c.text)} идёт быстрее ${MAX_CPS} знаков/с (${cps.toFixed(1)})`)
    const rows = balanceText(c.text, SUBS.size, SUBS.maxWidth).length
    if (rows > SUBS.maxLines) out.push(`${S}: реплика ${i} ${quote(c.text)} занимает ${rows} строки субтитров, а можно не больше ${SUBS.maxLines} — сократите или разделите её`)
  })
  return out
}

// Терминал прокручивается, а цель — строка или команда элемента, который появляется раньше последнего: к концу сцены (снимок частей) она уже не там.
function scrolledTarget(spec: FrameSpec, target: string, ctx: FrameCtx): boolean {
  if (spec.type !== 'terminal' || spec.items.length === 0 || !terminalScrolls(spec, ctx)) return false
  const event = (/^(?:cmd|out):(.+)$/.exec(target) ?? /^line:(.+):\d+$/.exec(target))?.[1]
  const item = spec.items.find((i) => i.event === event)
  return item !== undefined && item.at < spec.items[spec.items.length - 1].at
}

function sceneProblems(lesson: Lesson, b: BuiltScene, ctx: FrameCtx): string[] {
  const S = `сцена «${b.id}»`
  const out: string[] = []
  const { scene, clock } = b
  const spec = scene.frame
  const def = frameDef(spec)
  const frameBad = def.problems(spec, ctx, clock)
  out.push(...frameBad.map((p) => `${S}: ${p}`))
  const parts = sceneParts(b, ctx)
  const names = Object.keys(parts)

  // Цель камеры или пояснения — часть кадра; у прокручиваемого терминала — не из раннего элемента
  const target = (who: string, name: string, whose: string): Rect | null => {
    const part = parts[name]
    if (!part) {
      const list = names.length > 8 ? `${names.slice(0, 8).join(', ')} и ещё ${names.length - 8}` : names.join(', ')
      out.push(`${S}: ${who}: части «${name}» нет в кадре ${spec.type} (есть: ${list})`)
      return null
    }
    if (scrolledTarget(spec, name, ctx)) out.push(`${S}: ${who}: терминал прокручивается — цель ${whose} «${name}» к концу сцены на другом месте; разделите сцену`)
    return part
  }

  // Камера
  ;(scene.camera ?? []).forEach((k, i) => {
    const why = beatProblem(k.at, clock.lines)
    if (why) out.push(`${S}: camera[${i}]: ${why}`)
    if (k.target !== 'whole') target(`camera[${i}]`, k.target, 'камеры')
  })
  const keys = cameraKeys(b, parts)

  // Пояснения: окно вне смены сцены, прямоугольник на экране внутри кадра, камера в окне стоит
  ;(scene.spots ?? []).forEach((s, i) => {
    const who = `spots[${i}]`
    const why = beatProblem(s.at, clock.lines)
    if (why) out.push(`${S}: ${who}: ${why}`)
    if (s.until !== undefined && !why && !spotTimed(b, s)) out.push(`${S}: ${who}: until ${s.until} — нужна реплика после at (${s.at}) и не дальше конца сцены (${clock.lines})`)
    const part = target(who, s.target, 'пояснения')
    if (!spotTimed(b, s)) return
    const w = spotWindow(b, s)
    if (w.from < SPOT_EDGE) out.push(`${S}: ${who}: начинается на кадре ${w.from} — это первые ${SPOT_EDGE} кадров сцены, там смена сцены`)
    if (w.to > b.duration - SPOT_EDGE) out.push(`${S}: ${who}: кончается на кадре ${w.to} — это последние ${SPOT_EDGE} кадров сцены (в ней ${b.duration}), там смена сцены`)
    const start = cameraAt(w.from, keys)
    for (let f = w.from; f < w.to; f++) {
      if (!sameShot(cameraAt(f, keys), start)) {
        out.push(`${S}: ${who}: камера движется во время пояснения (кадр ${f} сцены) — ключ камеры поставьте до него или после`)
        break
      }
    }
    if (part) {
      const r = toScreen(part, start)
      const eps = 0.01
      if (r.x < -eps || r.y < -eps || r.x + r.w > CANVAS.w + eps || r.y + r.h > CANVAS.h + eps) {
        out.push(`${S}: ${who}: «${s.target}» после камеры за краем кадра ${CANVAS.w} × ${CANVAS.h} (x ${Math.round(r.x)}, y ${Math.round(r.y)}, ${Math.round(r.w)} × ${Math.round(r.h)})`)
      }
    }
  })

  // Вердикты: только у сцены mistake, сначала wrong, потом right
  const verdict = scene.verdict ?? []
  verdict.forEach((v, i) => {
    const why = beatProblem(v.at, clock.lines)
    if (why) out.push(`${S}: verdict[${i}]: ${why}`)
  })
  if (scene.role !== 'mistake' && verdict.length > 0) out.push(`${S}: вердикты бывают только у сцены mistake — у остальных справа в шапке ссылка на книгу`)
  if (scene.role === 'mistake') {
    const first = (kind: 'wrong' | 'right') => Math.min(...verdict.filter((v) => v.kind === kind).map((v) => v.at))
    if (!verdict.some((v) => v.kind === 'wrong') || !verdict.some((v) => v.kind === 'right')) {
      out.push(`${S}: у сцены mistake нужен вердикт wrong («Неверно») и вердикт right («Верно»), а есть: ${verdict.map((v) => v.kind).join(', ') || 'ничего'}`)
    } else if (first('wrong') >= first('right')) {
      out.push(`${S}: вердикт wrong («Неверно») должен идти раньше right («Верно»): сначала неверный вариант, потом верный`)
    }
  }

  // Шапка: название главы целиком — рядом со ссылкой на книгу, а в сцене mistake — рядом с метками ошибки
  const title = lesson.chapters[b.chapter].title
  const n = [...title].length
  if (scene.role === 'mistake') {
    const room = titleRoom(lesson.id, cellsFor(verdictWidth(verdict.length > 0)))
    if (n > room) out.push(`${S}: название главы «${title}» (${n} знаков) налезает на метку «Типичная ошибка» в шапке — рядом с ней помещается ${room}`)
  } else {
    const room = bookRoom(lesson.id, title)
    if (room < HEADER_BOOK.min) out.push(`${S}: название главы «${title}» (${n} знаков) не помещается в шапку рядом со ссылкой на книгу — ей остаётся ${Math.max(0, room)} знаков, а нужно ${HEADER_BOOK.min}`)
  }

  // Шум песочницы среди показанных строк записи
  const noise = sandboxNoise(shownLines(spec, ctx))
  if (noise.length > 0) {
    out.push(`${S}: в кадре шум песочницы — ${noise.length} строк о Google Fonts (первая: ${quote(noise[0].trim())}): это контейнер записи без доступа к fonts.googleapis.com, зрителю его не показываем — выберите lines без них`)
  }

  // Каждые 3–4 с в кадре что-то меняется: начало сцены, моменты кадра, ключи камеры, вердикты, конец сцены
  if (frameBad.length === 0 && clock.lines > 0) {
    const at = [0, ...def.moments(spec, clock, ctx), ...keys.map((k) => k.at), ...verdict.filter((v) => isBeat(v.at, clock.lines)).map((v) => clock.beat(v.at)), b.duration]
    const moments = [...new Set(at.filter((f) => f >= 0 && f <= b.duration))].sort((x, y) => x - y)
    moments.forEach((f, i) => {
      const next = moments[i + 1]
      if (next !== undefined && next - f > MOTION.maxStill) {
        out.push(`${S}: кадр стоит без изменений ${next - f} кадров (с ${f} по ${next} кадр сцены), а можно не дольше ${MOTION.maxStill} — действие на реплику, камера или короче реплика`)
      }
    })
  }
  return out
}

/**
 * Проблемы урока: каркас (§6.2), разделы книги, длина (если checkLength не false; не короче minFrames), реплики и субтитры,
 * проблемы кадров, камера и пояснения, вердикты, шапка, шум песочницы, промежутки без изменений, сценарий (validateScript).
 */
export function lessonProblems(lesson: Lesson, opts: { minFrames?: number; checkLength?: boolean; ctx?: FrameCtx } = {}): string[] {
  const ctx = opts.ctx ?? lessonCtx(lesson)
  const L = `урок «${lesson.id}»`
  const out = [...structureProblems(lesson), ...bookProblems(lesson)]

  const ids = new Set<string>()
  for (const s of lesson.chapters.flatMap((c) => c.scenes)) {
    if (ids.has(s.id)) out.push(`сцена «${s.id}»: id сцены повторяется — id сцен уникальны во всём уроке`)
    ids.add(s.id)
  }

  const { script, scenes } = buildLesson(lesson, ctx)
  const total = totalFrames(script)
  if (opts.checkLength !== false) {
    const [lo, hi] = LENGTH[lesson.kind]
    const kind = lesson.kind === 'chapter' ? 'главы' : 'дня'
    if (total < lo || total > hi) out.push(`${L}: длина ${total} кадров (${mmss(total)}), а у ролика ${kind} ${lo}–${hi} кадров (${mmss(lo)}–${mmss(hi)})`)
    if (opts.minFrames !== undefined && total < opts.minFrames) out.push(`${L}: длина ${total} кадров, а должна быть не короче прежнего: ${opts.minFrames} (${mmss(opts.minFrames)})`)
  }

  let cue = 0
  for (const b of scenes) {
    out.push(...cueProblems(b, script.cues.slice(cue, cue + b.scene.lines.length)))
    cue += b.scene.lines.length
    try {
      out.push(...sceneProblems(lesson, b, ctx))
    } catch (e) {
      out.push(`сцена «${b.id}»: проверка не прошла: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const spots = scenes.reduce((sum, b) => sum + (b.scene.spots?.length ?? 0), 0)
  if (spots < MIN_SPOTS[lesson.kind]) out.push(`${L}: пояснений ${spots}, а у ролика ${lesson.kind === 'chapter' ? 'главы' : 'дня'} нужно не меньше ${MIN_SPOTS[lesson.kind]}`)
  out.push(...validateScript(script).map((e) => `${L}: сценарий: ${e}`))
  return out
}
