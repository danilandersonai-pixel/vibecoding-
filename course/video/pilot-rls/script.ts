import { cameraAt, toScreen, TRANSITION_FRAMES, type CameraKey, type Transition } from '../kit/camera'
import { buildScript, type SceneDef, type Timing } from '../kit/script'
import type { VideoHotspot } from '../types'
import { L, SHOT } from './layout'

// Сценарий пилотного ролика дня 4: «Почему тренер не увидит чужих подопечных».
// Тайминги считаются из длины реплик (темп «живее» из набора), а анимации сцен, камера
// и горячие точки привязаны к началу реплик (beat): правка текста не рассинхронизирует картинку.

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
      'Запрос — это просьба к серверу, а ответ — то, что сервер прислал обратно.',
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
      'В Supabase турникет — это политика на SQL: строку читает только её владелец.',
    ],
  },
  {
    id: 's5-check',
    lines: [
      'Проверьте у себя — это займёт две минуты.',
      'Заведите второго пользователя и войдите под ним.',
      'Откройте адрес чужой записи — с номером первого пользователя.',
      'Должно быть пусто. Видите чужое — RLS выключен или правило неверное.',
      'Частая причина — таблицу создал агент через SQL: там RLS сам не включается.',
      'Попросите агента включить RLS и написать политику, а потом проверьте снова.',
      'И помните: секретный ключ обходит все правила — ему место только на сервере.',
      'Запрос, который проверит все таблицы, есть в главе 7 книги.',
      'А наставник на дне 4 проверит это вместе с вами.',
    ],
  },
]

export type Staging = { transition: Transition; camera: CameraKey[] }

type Shot = { x: number; y: number; zoom: number }
const key = (at: number, shot: Shot): CameraKey => ({ at, ...shot })

// Переход и камера каждой сцены: камера едет к тому, о чём реплика, и стоит, пока открыта горячая точка.
function staging({ beat }: Timing): Record<string, Staging> {
  const b = (id: string) => (i: number) => beat(id, i)
  const s1 = b('s1-coaches')
  const s2 = b('s2-request')
  const s3 = b('s3-attack')
  const s4 = b('s4-turnstile')
  const s5 = b('s5-check')
  return {
    's1-coaches': {
      transition: 'fade',
      camera: [
        // тренеры крупно → весь кадр, когда появляются подопечные
        key(0, SHOT.coaches),
        key(s1(1) - 6, SHOT.coaches),
        key(s1(1) + 24, SHOT.whole),
        // наезд на базу и ключи: «шкафчики рядом, ключи — свои»
        key(s1(3) - 6, SHOT.whole),
        key(s1(3) + 24, SHOT.base),
      ],
    },
    's2-request': {
      transition: 'slide',
      camera: [
        // Анна с телефоном → весь путь запроса
        key(0, SHOT.close),
        key(s2(1) - 12, SHOT.close),
        key(s2(1) + 18, SHOT.whole),
        // экран со списком крупно → назад к подсказке про адрес (на ней горячая точка)
        key(s2(6) - 6, SHOT.whole),
        key(s2(6) + 20, SHOT.phone),
        key(s2(7) - 10, SHOT.phone),
        key(s2(7) + 14, SHOT.whole),
      ],
    },
    's3-attack': {
      transition: 'zoom',
      camera: [
        // подмена номера крупно (горячая точка client/18) → путь запроса
        key(0, SHOT.close),
        key(s3(4), SHOT.close),
        key(s3(4) + 24, SHOT.whole),
        // телефон, где кнопки «Олег» не было
        key(s3(8) - 6, SHOT.whole),
        key(s3(8) + 20, SHOT.phone),
      ],
    },
    's4-turnstile': {
      transition: 'slide',
      camera: [
        // база крупно → турникеты и проверка пропусков (горячая точка «Политика RLS»)
        key(0, SHOT.s4db),
        key(s4(1), SHOT.s4db),
        key(s4(1) + 30, SHOT.whole),
        // медленный наезд на код политики
        key(s4(10) - 6, SHOT.whole),
        key(s4(10) + 60, SHOT.s4code),
      ],
    },
    's5-check': {
      transition: 'fade',
      camera: [
        // проверка → вторая доска «что делать» → назад к книге и наставнику
        key(0, SHOT.whole),
        key(s5(4) - 4, SHOT.whole),
        key(s5(4) + 26, SHOT.board2),
        key(s5(7) - 4, SHOT.board2),
        key(s5(7) + 26, SHOT.whole),
      ],
    },
  }
}

type Rect = { x: number; y: number; w: number; h: number }

function hotspots(t: Timing): VideoHotspot[] {
  const cams = staging(t)
  // Окно точки — в кадрах сцены; рамка объекта на холсте переводится в кадр по камере в начале окна.
  const spot = (id: string, from: number, to: number, r: Rect, title: string, text: string): VideoHotspot => {
    const s = toScreen(r, cameraAt(from, cams[id].camera))
    return { from: t.abs(id, from), to: t.abs(id, to), x: Math.round(s.x), y: Math.round(s.y), w: Math.round(s.w), h: Math.round(s.h), title, text }
  }
  const end = (id: string) => t.sceneEnd(id) - t.abs(id, 0) - TRANSITION_FRAMES
  return [
    spot(
      's2-request',
      t.beat('s2-request', 7) + 14,
      end('s2-request'),
      { x: L.callout.x - 170, y: L.callout.y - 45, w: 340, h: 90 },
      'Запрос',
      'Адрес client/17 собирает приложение на телефоне. Человек может поменять его вручную — например, в инструментах браузера.',
    ),
    spot(
      's3-attack',
      t.beat('s3-attack', 2) + 25, // номер уже подменён
      t.beat('s3-attack', 4),
      { x: L.phone.x - 90, y: L.outY - 34, w: 180, h: 68 },
      'client/18',
      'Подменённый номер. Сервер без проверки владельца не отличит его от настоящего — это и есть IDOR.',
    ),
    spot(
      's4-turnstile',
      t.beat('s4-turnstile', 2),
      t.beat('s4-turnstile', 10) - 6,
      { x: L.s4gateX - 60, y: L.s4rowsY[0] - 60, w: 120, h: L.s4rowsY[2] - L.s4rowsY[0] + 120 },
      'Политика RLS',
      'Правило в самой базе: строку можно прочитать, только если её владелец — тот, кто вошёл. В Supabase: using (auth.uid() = user_id).',
    ),
  ]
}

const built = buildScript('pilot-rls', SCENES, hotspots)

export const pilotRlsScript = built.script
export const beat = built.beat
export const sceneDuration = (id: string) => built.sceneEnd(id) - built.abs(id, 0)
export const STAGING = staging(built)
