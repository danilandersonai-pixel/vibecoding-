import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion'
import defs from '../../content/figures/_defs.svg?raw'
import vibe from '../../content/figures/1.1.svg?raw'
import aiwords from '../../content/figures/abc_aiwords.svg?raw'
import envs from '../../content/figures/abc_envs.svg?raw'
import restaurant from '../../content/figures/abc_restaurant.svg?raw'
import modelcard from '../../content/figures/ch1_modelcard.svg?raw'
import models from '../../content/figures/ch1_models.svg?raw'
import trust from '../../content/figures/ch1_trust.svg?raw'
import { find } from '../sessions'
import { bookRef } from './book'
import { Header } from './chrome/Header'
import { TermSubtitles } from './chrome/Subtitles'
import { Verdict } from './chrome/Verdict'
import type { Clock, FrameCtx } from './frame'
import { frameDef } from './frames'
import type { FrameSpec } from './frames'
import { appear } from './motion'
import { CANVAS, FIGURE_VARS, MONO, SAFE, T } from './theme'

// Временная композиция «term-check»: проверка набора на экране. На ней смотрят кадры задач 5–7; задача 8 её удалит.
// Кадры 0–59 — основа: шапка, субтитр, строка Martian Mono, схема книги.
// Дальше идут сцены кадров на настоящих записях, у каждой своё число реплик lines (по умолчанию три — на кадрах 30, 120, 210 сцены;
// сцена длится 60 + 90 · lines кадров). Начала сцен:
//   60 Terminal (dev и server-строки save-bad), 390 Terminal (start-dev: код выхода 1), 720 Editor (route, дерево, подсветка),
//   1050 Editor (fix, набор), 1380 Editor (fix, подсказка ghost), 1710 Editor (read package.json, без дерева), 2040 Diff (route и fix, подсветка),
//   2370 Agent (idea: ask c-idea, Manual), 2970 Agent (ask-fix, Accept edits), 3660 Agent (chat, ask-form), 4170 GitLog (пять коммитов, heads, dirty),
//   4770 Browser (save-bad, консоль: только ошибка), 5100 Browser (save-hint, marks err, без консоли), 5430 Browser (save-ok, консоль, marks ok),
//   5760 Figure (abc_restaurant, части по очереди, затем focus на «Бэкенде»), 6180 Figure (1.1 с crop), 6510 Board (таблица из трёх строк, mark),
//   6930 Board (шкала с маркером), 7530 Board (карточки), 7950 Agenda (пять глав), 8280 Recap (три пункта, книга: sa1 и sa2),
//   8700 Board (таблица с длинными ячейками, mark err), 9210 Board (пять карточек), 9720 Recap (длинные пункты, пять разделов главы 1),
//   схемы пилота по 240 кадров: 10140 abc_envs, 10380 abc_aiwords, 10620 ch1_trust, 10860 ch1_modelcard (crop), 11100 ch1_models (crop).
// Снимок сцены: npx remotion still video/index.ts term-check out.png --frame=N --browser-executable=…/headless_shell
// Метки ошибки: … --frame=50 --props='{"mistake":true}'. Части кадров рамками: … --props='{"parts":true}' (положение частей из layout — проверить, что они лежат на том, что видно).
export type TermCheckProps = { mistake: boolean; parts: boolean }

const CUES = [{ from: 10, to: 60, text: 'Телефон Анны — зал, его зовут фронтендом: всё, что видно и нажимается.' }]
const VERDICT: { at: number; kind: 'wrong' | 'right' }[] = [
  { at: 20, kind: 'wrong' },
  { at: 45, kind: 'right' },
]

const FIGURE = { w: 1590 } // схема 760 px шириной → 1590: самый мелкий текст (11,5 px) становится 24 px
const CELL = MONO.size * MONO.advance

function Base({ mistake }: Pick<TermCheckProps, 'mistake'>) {
  const frame = useCurrentFrame()
  const zeros = 40
  return (
    <AbsoluteFill style={{ background: T.desk }}>
      {/* Маркеры стрелок схем; не hidden: в display:none Chrome стрелок не рисует */}
      <div dangerouslySetInnerHTML={{ __html: defs }} />
      <div
        className="figure"
        style={{ ...FIGURE_VARS, position: 'absolute', left: SAFE.x + (SAFE.w - FIGURE.w) / 2, top: SAFE.y, width: FIGURE.w, opacity: appear(frame, 0) }}
        dangerouslySetInnerHTML={{ __html: restaurant }}
      />
      <svg viewBox={`0 0 ${CANVAS.w} ${CANVAS.h}`} width={CANVAS.w} height={CANVAS.h} style={{ position: 'absolute', inset: 0 }}>
        <Header lessonId="ch-abc" chapter={{ n: 2, total: 7, title: 'Git: история проекта' }} book={mistake ? '' : bookRef(['sa3'], 56)} at={0} />
        <Verdict mistake={mistake} verdict={mistake ? VERDICT : []} />
        {/* Рамка шириной в zeros знаков по замеренной ширине: нули должны ложиться в неё вплотную */}
        <rect x={SAFE.x} y={832} width={zeros * CELL} height={40} fill="none" stroke={T.line} strokeWidth={2} />
        <text x={SAFE.x} y={860} fill={T.ink} style={{ fontFamily: T.mono, fontSize: MONO.size, fontWeight: 500, fontVariantLigatures: 'none' }}>
          {'0'.repeat(zeros)}
        </text>
        <text x={SAFE.x + zeros * CELL + 48} y={860} fill={T.ok} style={{ fontFamily: T.mono, fontSize: MONO.size, fontWeight: 500, fontVariantLigatures: 'none' }}>
          {'$ git commit -m "первое сохранение"'}
        </text>
      </svg>
      <TermSubtitles cues={CUES} />
    </AbsoluteFill>
  )
}

const S1 = 's01-start'
const S2 = 's02-sets'
const TREE = { session: S2, commit: 'c-form' }
const BASE_FRAMES = 60
/** Сцена по умолчанию — из трёх реплик. */
const SCENE_LINES = 3
/** Сцена из n реплик: 30 + n · 90 + 30 кадров. */
const sceneFrames = (lines: number) => 30 + lines * 90 + 30

const SCENES: { spec: FrameSpec; cue: string; lines?: number; lesson?: Partial<FrameCtx['lesson']> }[] = [
  {
    spec: {
      type: 'terminal',
      items: [
        { session: S2, event: 'dev', at: 0 },
        { session: S2, event: 'save-bad', at: 1, lines: [227, 237] },
      ],
    },
    cue: 'Сервер запущен. Нажимаем «Сохранить подход» с пустым весом — в его выводе строка запроса.',
  },
  {
    spec: {
      type: 'terminal',
      items: [
        { session: S2, event: 'start-dev', at: 0 },
        { session: S2, event: 'scripts', at: 1 },
      ],
    },
    cue: 'Такого скрипта нет: команда завершилась с ошибкой, последняя строка красная.',
  },
  {
    spec: { type: 'editor', session: S2, event: 'route', tree: TREE, lines: [1, 17], highlight: [{ at: 1, lines: [13, 15] }] },
    cue: 'Файл маршрута: функция toNumber отличает пустое поле от нуля.',
  },
  {
    spec: { type: 'editor', session: S2, event: 'fix', tree: TREE, lines: [20, 36], typing: { at: 0 } },
    cue: 'В форму добавляются строки с ошибкой — они набираются.',
  },
  {
    spec: { type: 'editor', session: S2, event: 'fix', tree: TREE, lines: [20, 36], ghost: { at: 0, accept: 1 } },
    cue: 'Подсказка серым, принимаем её — строки становятся обычными.',
  },
  {
    spec: { type: 'editor', session: 's01-start', event: 'pkg', lines: [1, 18], highlight: [{ at: 1, lines: [3, 5] }] },
    cue: 'Прочитанный файл без дерева: package.json.',
  },
  {
    spec: {
      type: 'diff',
      items: [
        { session: S2, event: 'route', at: 0, lines: [1, 4] },
        { session: S2, event: 'fix', at: 1, lines: [9, 20] },
      ],
      highlight: [{ at: 2, event: 'fix', lines: [13, 15] }],
    },
    cue: 'Дифф: убранное красным, новое зелёным.',
  },
  {
    spec: { type: 'agent', session: S1, event: 'idea', mode: 'Manual', ask: ['c-idea'], diffLines: 3, at: { prompt: 0, steps: [3, 4], reply: 5 } },
    cue: 'Агент записал идею и спрашивает разрешения на коммит: ответ «y».',
    lines: 6,
  },
  {
    spec: { type: 'agent', session: S2, event: 'ask-fix', mode: 'Accept edits', diffLines: 8, at: { prompt: 0, steps: [4, 5], reply: 6 } },
    cue: 'Агент прочитал маршрут и поправил страницу: правки под «Edited».',
    lines: 7,
  },
  {
    spec: { type: 'agent', session: S2, event: 'ask-form', chat: true, diffLines: 8, at: { prompt: 0, steps: [], reply: 3 } },
    cue: 'Чат только отвечает и показывает код, файлы не трогает.',
    lines: 5,
  },
  {
    spec: {
      type: 'gitlog',
      rows: [
        { session: S1, event: 'c-start', at: 0 },
        { session: S1, event: 'c-idea', at: 1 },
        { session: S1, event: 'c-claude', at: 2 },
        { session: S2, event: 'c-form', at: 3 },
        { session: S2, event: 'c-mini', at: 5 },
      ],
      heads: [
        { at: 0, branch: 'main', commit: 'c-start' },
        { at: 1, branch: 'main', commit: 'c-idea' },
        { at: 2, branch: 'main', commit: 'c-claude' },
        { at: 3, branch: 'sets-form', commit: 'c-form' },
        { at: 4, branch: 'main', commit: 'c-form' },
        { at: 5, branch: 'main', commit: 'c-mini' },
      ],
      dirty: { at: 2, until: 3, text: 'app/api/sets/route.ts, app/page.tsx, app/layout.tsx' },
    },
    cue: 'Ветка уходит вправо, после слияния main переезжает к её коммиту.',
    lines: 6,
  },
  {
    spec: { type: 'browser', session: S2, event: 'save-bad', console: true, consoleLines: [5, 5], at: { page: 0, console: 1 } },
    cue: 'Нажали «Сохранить подход» — на странице тихо, а в консоли красная строка.',
  },
  {
    spec: { type: 'browser', session: S2, event: 'save-hint', marks: [{ line: 'Вес должен быть числом, например 60', tone: 'err' }], at: { page: 0, action: 1 } },
    cue: 'После правки под формой появляется подсказка красным.',
  },
  {
    spec: { type: 'browser', session: S2, event: 'save-ok', console: true, marks: [{ line: '60 кг × 8', tone: 'ok' }], at: { page: 0, action: 1, console: 2 } },
    cue: 'Вес «60» — подход попадает в список.',
  },
  {
    spec: {
      type: 'figure',
      svg: restaurant,
      reveal: { from: 0, to: 1 },
      focus: [{ at: 2, name: 'Бэкенд', rect: [457.6, 76, 139.2, 114] }],
    },
    cue: 'Схема ресторана: части приходят по порядку, потом рамка на бэкенде — остальное приглушено.',
    lines: 4,
  },
  {
    spec: { type: 'figure', svg: vibe, crop: [0, 40, 760, 370], reveal: { from: 0, to: 2 } },
    cue: 'Схема 1.1 без заголовка: обрезка нужна, чтобы мелкий текст стал крупным.',
  },
  {
    spec: {
      type: 'board',
      title: 'Пять режимов работы с ИИ',
      table: {
        head: ['Режим', 'Кто пишет код', 'Что проверять'],
        rows: [
          ['Подсказка в редакторе', 'человек, ИИ дописывает строку', 'каждую строку'],
          ['Чат', 'человек переносит куски', 'код перед вставкой'],
          ['Агент с вопросом', 'агент, человек отвечает «y» или «n»', 'каждую команду и правку'],
        ],
        at: [0, 1, 2],
        mark: [{ at: 3, row: 2, tone: 'warn' }],
      },
    },
    cue: 'Таблица: строки приходят по очереди, последняя подсвечена.',
    lines: 4,
  },
  {
    spec: {
      type: 'board',
      scale: {
        left: 'человек понимает весь код',
        right: 'код почти не читают',
        items: [
          { label: 'Подсказка в редакторе', pos: 0, at: 0 },
          { label: 'Чат', pos: 0.25, at: 1 },
          { label: 'Агент с вопросом', pos: 0.5, at: 2 },
          { label: 'Задача агенту целиком', pos: 0.75, at: 3 },
          { label: 'Вайб-кодинг', pos: 1, at: 4 },
        ],
        marker: [{ at: 4, pos: 0.25 }, { at: 5, pos: 0.75 }],
      },
    },
    cue: 'Шкала режимов: пункты по очереди, треугольник показывает, где мы сейчас.',
    lines: 6,
  },
  {
    spec: {
      type: 'board',
      title: 'Что выбрать',
      cards: [
        { title: 'Абонемент', text: ['платите раз в месяц', 'у него есть лимит на пять часов'], at: 0, tone: 'ok' },
        { title: 'Счётчик', text: ['платите за каждый запрос — как за воду по счётчику'], at: 1 },
        { title: 'Предел', text: ['дошли до лимита — ждёте окна'], at: 2, tone: 'err' },
      ],
    },
    cue: 'Карточки с рамкой: цвет рамки и заголовка — состояние.',
    lines: 4,
  },
  { spec: { type: 'agenda' }, cue: 'Что узнаете: главы урока строками, как лог.' },
  {
    spec: {
      type: 'recap',
      items: [
        { text: 'У приложения четыре части: зал, официант, кухня и склад.', at: 0 },
        { text: 'Секреты хранятся в .env.local, а не в чате.', at: 1 },
        { text: 'Ошибку сначала читают целиком, а потом отправляют агенту вместе с текстом.', at: 2 },
      ],
    },
    cue: 'Итог: галочки по одному, внизу ссылка на разделы книги.',
    lines: 4,
  },
  {
    spec: {
      type: 'board',
      title: 'Модель по карточке',
      table: {
        head: ['Что смотреть', 'Что это значит на деле', 'Как проверить'],
        rows: [
          ['Окно контекста', 'сколько текста модель держит в голове одновременно, пока работает над задачей', 'сравнить с размером проекта и перепиской'],
          ['Срез знаний', 'до какой даты модель знает мир; всё новее она не видела', 'спросить про свежую версию инструмента'],
          ['Цена', 'сколько стоит миллион токенов на входе и на выходе', 'посчитать на своей задаче'],
          ['Скорость', 'сколько знаков в секунду выдаёт модель', 'запустить одну и ту же задачу'],
        ],
        at: [0, 1, 2, 3],
        mark: [{ at: 4, row: 1, tone: 'err' }],
      },
    },
    cue: 'Длинные ячейки переносятся, столбцы не налезают друг на друга.',
    lines: 5,
  },
  {
    spec: {
      type: 'board',
      title: 'Пять причин не доверять замеру',
      cards: [
        { title: 'Выбор тестов', text: ['показали те, где модель сильна'], at: 0, tone: 'warn' },
        { title: 'Утечка в обучение', text: ['тест уже был в данных модели'], at: 1 },
        { title: 'Свои условия', text: ['у разработчиков подсказки другие, чем у вас'], at: 2 },
        { title: 'Усреднение', text: ['среднее прячет провалы на нужной задаче'], at: 3, tone: 'err' },
        { title: 'Дата', text: ['через месяц цифры уже другие'], at: 4 },
      ],
    },
    cue: 'Пять карточек укладываются в два ряда по три.',
    lines: 5,
  },
  {
    spec: {
      type: 'recap',
      items: [
        { text: 'Вайб-кодинг — не выключатель, а шкала: чем выше цена ошибки, тем больше кода человек понимает сам и тем чаще проверяет за агентом.', at: 0 },
        { text: 'Модель выбирают по карточке: окно контекста, срез знаний и цена на вашей задаче, а не по названию и громкому бренду.', at: 1 },
        { text: 'Цифры из анонса — только один уровень доверия.', at: 2 },
      ],
    },
    lesson: { book: ['s5', 's6', 's7', 's77', 's78'] },
    cue: 'Длинные пункты переносятся под знаком, разделы книги идут столбцом.',
    lines: 4,
  },
  { spec: { type: 'figure', svg: envs }, cue: 'abc_envs целиком.', lines: 2 },
  { spec: { type: 'figure', svg: aiwords }, cue: 'abc_aiwords целиком.', lines: 2 },
  { spec: { type: 'figure', svg: trust }, cue: 'ch1_trust целиком.', lines: 2 },
  { spec: { type: 'figure', svg: modelcard, crop: [0, 40, 760, 350] }, cue: 'ch1_modelcard: окно карточки без заголовка и нижней плашки.', lines: 2 },
  { spec: { type: 'figure', svg: models, crop: [0, 36, 760, 334] }, cue: 'ch1_models: три ступени и легенда, без заголовка и нижних плашек.', lines: 2 },
]

const CTX: FrameCtx = {
  find,
  lesson: {
    id: 'term-check',
    title: 'Проверка кадров',
    chapters: ['Что узнаете', 'Четыре части приложения', 'Git: история проекта', 'От компьютера к сайту', 'Как понять, что работает', 'Итог'],
    book: ['sa1', 'sa2'],
  },
}

const clockOf = (lines: number): Clock => ({ beat: (i) => 30 + i * 90, duration: 30 + lines * 90 + 30, lines })

function Scene({ spec, cue, parts, lines = SCENE_LINES, lesson }: { spec: FrameSpec; cue: string; parts: boolean; lines?: number; lesson?: Partial<FrameCtx['lesson']> }) {
  const clock = clockOf(lines)
  const ctx: FrameCtx = lesson ? { ...CTX, lesson: { ...CTX.lesson, ...lesson } } : CTX
  const { Component } = frameDef(spec)
  return (
    <AbsoluteFill style={{ background: T.desk }}>
      <svg viewBox={`0 0 ${CANVAS.w} ${CANVAS.h}`} width={CANVAS.w} height={CANVAS.h} style={{ position: 'absolute', inset: 0 }}>
        <Header lessonId="term-check" chapter={{ n: 2, total: 3, title: 'Кадры записей' }} book="" at={-100} />
        <Component spec={spec} clock={clock} ctx={ctx} />
        {parts &&
          Object.entries(frameDef(spec).layout(spec, ctx)).map(([name, r]) => (
            <g key={name}>
              <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="none" stroke={T.warn} strokeWidth={2} />
              <text x={r.x + r.w + 6} y={r.y + 20} fill={T.warn} style={{ font: `500 24px ${T.mono}` }}>
                {name}
              </text>
            </g>
          ))}
      </svg>
      <TermSubtitles cues={[{ from: 0, to: sceneFrames(lines), text: cue }]} />
    </AbsoluteFill>
  )
}

// Длина сцены и её начало: основа и сцены перед ней
const lengthOf = (scene: { lines?: number }) => sceneFrames(scene.lines ?? SCENE_LINES)
const STARTS = SCENES.map((_, i) => BASE_FRAMES + SCENES.slice(0, i).reduce((sum, scene) => sum + lengthOf(scene), 0))

/** Длина композиции term-check: основа и сцены кадров. */
export const TERM_CHECK_FRAMES = BASE_FRAMES + SCENES.reduce((sum, scene) => sum + lengthOf(scene), 0)

export function TermCheck({ mistake, parts }: TermCheckProps) {
  return (
    <>
      <Sequence from={0} durationInFrames={BASE_FRAMES}>
        <Base mistake={mistake} />
      </Sequence>
      {SCENES.map((scene, i) => (
        <Sequence key={i} from={STARTS[i]} durationInFrames={lengthOf(scene)}>
          <Scene {...scene} parts={parts} />
        </Sequence>
      ))}
    </>
  )
}
