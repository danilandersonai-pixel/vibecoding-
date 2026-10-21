import type { Cue, VideoHotspot, VideoScript } from '../types'
import { L } from './layout'

// Сценарий пилотного ролика дня 4: «Почему тренер не увидит чужих подопечных».
// Тайминги считаются из длины реплик, а анимации сцен привязаны к началу реплик (beat),
// поэтому правка текста не рассинхронизирует картинку и субтитры.

const FPS = 30
const CPS = 13 // знаков в секунду — темп чтения субтитров и синтеза речи
const LEAD = 0.6
const GAP = 0.45
const TAIL = 1.6

type SceneDef = { id: string; lines: string[] }

const SCENES: SceneDef[] = [
  {
    id: 's1-coaches',
    lines: [
      'Это Марина и Дима — два тренера в одном приложении.',
      'У Марины три подопечных, у Димы — тоже три.',
      'Тренировки всех шестерых лежат в одной общей базе.',
      'Как вещи в общей раздевалке: шкафчики рядом, а ключ у каждого свой.',
      'Разберёмся, что не даёт чужому открыть шкафчик Анны.',
    ],
  },
  {
    id: 's2-request',
    lines: [
      'Анна открывает приложение и нажимает «Мои тренировки».',
      'Телефон отправляет запрос. Внутри — адрес: client/17.',
      'Семнадцать — это номер Анны в базе.',
      'Сервер передаёт запрос в базу: дай тренировки клиента 17.',
      'База находит строки Анны и отправляет их обратно.',
      'На экране — её жим и присед за неделю. Всё работает.',
      'Заметьте: номер в адресе пришёл с телефона.',
      'А всё, что приходит с телефона, можно подменить.',
    ],
  },
  {
    id: 's3-attack',
    lines: [
      'Теперь запрос отправляет кто-то другой.',
      'Тренер-конкурент или просто любопытный — у него обычный аккаунт.',
      'Он берёт тот же запрос и меняет одну цифру: client/18.',
      'Восемнадцать — это Олег, подопечный Димы.',
      'Сервер видит правильный запрос и передаёт его в базу.',
      'И база послушно отдаёт тренировки Олега.',
      'Так утекают данные: веса, замеры, заметки о здоровье.',
      'У этой ошибки есть имя — IDOR, доступ к чужому по подменённому номеру.',
      'Кнопки «Олег» у него в приложении не было. Но запросу кнопки не нужны.',
    ],
  },
  {
    id: 's4-turnstile',
    lines: [
      'Защиту ставят туда, где лежат данные, — в саму базу.',
      'В Supabase это RLS: правила доступа к строкам.',
      'Представьте турникет перед каждой строкой.',
      'При входе в приложение человек получает пропуск: кто он.',
      'Турникет сверяет пропуск с владельцем строки.',
      'Анна просит свои тренировки — её турникет открывается.',
      'Повторим атаку: client/18. Пропуск не Олега — турникет закрыт.',
      'База возвращает пустой список. Без ошибок и подсказок.',
      'Спрятать кнопку в интерфейсе — не защита. Интерфейс можно обойти.',
      'Правило в базе работает для любого запроса, откуда бы он ни пришёл.',
    ],
  },
  {
    id: 's5-check',
    lines: [
      'Проверьте у себя — это займёт две минуты.',
      'Заведите второго пользователя и войдите под ним.',
      'Откройте адрес чужой записи — с номером первого пользователя.',
      'Должно быть пусто. Видите чужое — RLS выключен или правило неверное.',
      'Запрос, который проверит все таблицы, есть в главе 7 книги.',
      'А наставник на дне 4 проверит это вместе с вами.',
    ],
  },
]

function lineSeconds(text: string): number {
  return Math.max(2.6, text.length / CPS + 0.5)
}

function build() {
  const scenes: VideoScript['scenes'] = []
  const cues: Cue[] = []
  const beats: Record<string, number[]> = {}
  let start = 0
  for (const def of SCENES) {
    let t = LEAD
    beats[def.id] = []
    for (const text of def.lines) {
      const dur = lineSeconds(text)
      const from = start + Math.round(t * FPS)
      beats[def.id].push(from - start)
      cues.push({ from, to: start + Math.round((t + dur) * FPS), text })
      t += dur + GAP
    }
    const durationInFrames = Math.round((t - GAP + TAIL) * FPS)
    scenes.push({ id: def.id, durationInFrames })
    start += durationInFrames
  }
  return { scenes, cues, beats }
}

const built = build()

/** Кадр (от начала сцены), на котором начинается реплика i сцены. */
export function beat(sceneId: string, i: number): number {
  const b = built.beats[sceneId]?.[i]
  if (b === undefined) throw new Error(`Нет реплики ${i} в сцене ${sceneId}`)
  return b
}

function abs(sceneId: string, frame: number): number {
  let start = 0
  for (const s of built.scenes) {
    if (s.id === sceneId) return start + frame
    start += s.durationInFrames
  }
  throw new Error(`Нет сцены ${sceneId}`)
}

function sceneEnd(sceneId: string): number {
  const s = built.scenes.find((x) => x.id === sceneId)!
  return abs(sceneId, s.durationInFrames)
}

const hotspots: VideoHotspot[] = [
  {
    from: abs('s2-request', beat('s2-request', 6)),
    to: sceneEnd('s2-request'),
    x: L.callout.x - 170,
    y: L.callout.y - 45,
    w: 340,
    h: 90,
    title: 'Запрос',
    text: 'Адрес client/17 собирает приложение на телефоне. Человек может поменять его вручную — например, в инструментах браузера.',
  },
  {
    from: abs('s3-attack', beat('s3-attack', 2)),
    to: abs('s3-attack', beat('s3-attack', 4)),
    x: L.packetAbovePhone.x - 130,
    y: L.packetAbovePhone.y - 45,
    w: 260,
    h: 90,
    title: 'client/18',
    text: 'Подменённый номер. Сервер без проверки владельца не отличит его от настоящего — это и есть IDOR.',
  },
  {
    from: abs('s4-turnstile', beat('s4-turnstile', 2)),
    to: sceneEnd('s4-turnstile'),
    x: L.s4gateX - 60,
    y: L.s4rowsY[0] - 60,
    w: 120,
    h: L.s4rowsY[2] - L.s4rowsY[0] + 120,
    title: 'Политика RLS',
    text: 'Правило в самой базе: строку можно прочитать, только если её владелец — тот, кто вошёл. В Supabase: using (auth.uid() = user_id).',
  },
]

export const pilotRlsScript: VideoScript = { id: 'pilot-rls', fps: 30, width: 1280, height: 720, scenes: built.scenes, cues: built.cues, hotspots }

export const SCENE_IDS = SCENES.map((s) => s.id)
