# Курс по книге, фаза 1: каркас, день 1 и пилотный ролик — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сайт курса с картой 21 дня, полностью готовым днём 1, пилотным объясняющим роликом дня 4 (плеер на странице и MP4) и наставником для Claude Code, опубликованный как приватная страница Claude.

**Architecture:** Приложение Vite + React в `course/`. Содержание дней — JSON-файлы, проверяемые схемой Zod; страница дня рендерит блоки по типам. Прогресс — один интерфейс с двумя хранилищами (база страницы Claude и localStorage). Ролики — композиции Remotion в `course/video/`: одна и та же композиция играет в `@remotion/player` на странице и рендерится в MP4. Наставник — навык Claude Code в `mentor/`, чек-листы которого генерируются из тех же JSON дней.

**Tech Stack:** Vite 8, React 19, TypeScript 5 (последняя 5.x), Zod 4, Vitest 5 + Testing Library + jsdom, Playwright 1.56.1, Remotion 4.0.537 (`remotion`, `@remotion/player`, `@remotion/cli`).

**Spec:** `docs/superpowers/specs/2026-10-21-interactive-course-design.md`

## Global Constraints

- Весь интерфейс и содержание — на русском языке.
- Содержание дня — `course/content/days/day-NN.json` (NN с ведущим нулём), проверяется схемой при тестах и сборке.
- Прогресс в Claude — документ `data/users/<id>/progress` возможности `db`; вне Claude — `localStorage` ключ `vibecourse:progress`.
- ИИ (`sample`) вызывается только по нажатию кнопки; ошибки показываются сообщением, без повторов в цикле.
- Публикация — приватная страница Claude с `capabilities: {sample: {}, db: {}, user: {}, assets: {}}`; перед публикацией загрузить навыки `artifact-design` и `artifact-capabilities`.
- Шрифты Literata (текст), Onest (интерфейс), JetBrains Mono (код) и цветовые токены книги; светлая и тёмная тема; ширина 390 px без горизонтальной прокрутки.
- Ролики: все пакеты Remotion строго версии 4.0.537; 1280×720, 30 кадров/с; субтитры всегда в кадре; голос в плеере — Web Speech API, язык `ru-RU`; MP4 — H.264, не больше 20 МБ.
- Ссылка в книгу — `book.html#<id раздела>` (книга сама открывается по якорю).
- Наставник: команда `/mentor N`; файлы `.claude/skills/mentor/SKILL.md` и `.claude/skills/mentor/days/day-NN.md`; итог — в `mentor-log.md` проекта; наставник даёт подсказки, а не готовые решения, и не меняет код без просьбы.
- Playwright — `@playwright/test@1.56.1` (браузеры уже стоят в `/opt/pw-browsers`, `playwright install` не запускать).

## Review Focus

1. Курс открыт вне Claude (нет `window.claude` или `use()` вернул `null` через 10 с) — всё, кроме ИИ, работает, прогресс в браузере, блок ИИ показывает «доступно в Claude». Тест — в задаче 4 и задаче 8.
2. Прогресс есть и в браузере, и в базе (например, день начат вне Claude) — при загрузке объединяется без потерь: отмеченные шаги не исчезают, лучший результат теста не уменьшается. Тест — в задаче 4.
3. Повторное нажатие «Спросить ИИ», пока ответ не пришёл, и ошибки `not_granted`, `rate_limited`, `refused` — второй запрос не уходит, сообщение понятное, кнопка не зависает. Тест — в задаче 8.
4. В браузере нет синтеза речи или русского голоса — ролик идёт с субтитрами, переключатель голоса скрыт. Тест — в задаче 12.
5. `localStorage` недоступен (приватный режим) или в нём испорченные данные — страница открывается с чистым прогрессом в памяти, без падения. Тест — в задаче 4.

---

### Task 1: Каркас приложения курса

**Files:**
- Create: `course/package.json`, `course/vite.config.ts`, `course/tsconfig.json`, `course/index.html`, `course/src/main.tsx`, `course/src/App.tsx`, `course/src/styles/tokens.css`, `course/src/styles/base.css`, `course/vitest.config.ts`, `course/playwright.config.ts`, `course/.gitignore`
- Test: `course/src/App.test.tsx`, `course/e2e/smoke.spec.ts`

**Interfaces:**
- Produces: скрипты npm `dev`, `build`, `test` (vitest run), `e2e` (playwright test, сервер — `vite preview` на порту 4173); `App` — корневой компонент; CSS-переменные книги (`--paper`, `--ink`, `--accent`, `--fig-*` и т. д.) для светлой и тёмной темы.

- [ ] **Step 1:** Создать проект шаблоном `npm create vite@latest course -- --template react-ts`, закрепить точные версии стека в `package.json`, `vite.config.ts` с `base: './'`. В `.gitignore` — `node_modules`, `dist`, `out`, `test-results`.
- [ ] **Step 2: Тест.** `App.test.tsx`: `render(<App/>)` → на странице заголовок «Вайб-кодинг: курс на 21 день».
- [ ] **Step 3:** `npm test` — FAIL (нет заголовка).
- [ ] **Step 4:** `App` выводит заголовок; `tokens.css` переносит токены цветов и шрифтов из `<style>` книги (`vibe-coding-na-praktike-2026-10.html`, блок `:root{…}` и оба тёмных варианта); подключение шрифтов Google Fonts как в книге.
- [ ] **Step 5:** `e2e/smoke.spec.ts`: страница открывается на 1440×900 и 390×844, заголовок виден, `document.documentElement.scrollWidth <= innerWidth`.
- [ ] **Step 6:** `npm test && npm run build && npm run e2e` — всё PASS.
- [ ] **Step 7:** Коммит `course: каркас приложения`.

### Task 2: Схема содержания дня

**Files:**
- Create: `course/src/content/schema.ts`, `course/src/content/load.ts`, `course/content/days/day-01.json` (временный минимальный), `course/src/content/fixtures/valid-day.json`
- Test: `course/src/content/schema.test.ts`

**Interfaces:**
- Produces (`schema.ts`, Zod-схемы и выведенные типы):
  - `Day = { id: string; number: number; week: 1|2|3; status: 'ready'|'draft'; title: string; goal: string; result: string; minutes: {theory: number; practice: number}; blocks: Block[]; quiz: QuizQuestion[]; practice: PracticeStep[]; mentor: {command: string; checklist: MentorCheck[]; questions: string[]}; cards: string[] }`
  - `Block` — объединение по полю `type`: `video {videoId, title}`; `idea {id, title, text, figure?: string, bookRef?: BookRef}`; `diagram {id, figure, caption, hotspots: Hotspot[], steps?: string[]}`; `trainer` с `kind`: `prompt-builder {id, task, parts: {key: 'goal'|'context'|'constraints'|'criteria'|'format', label, good: string[], bad: string[]}[]}`, `find-the-bug {id, title, lines: string[], bugLines: number[], explanation}`, `sort {id, title, buckets: {id, label}[], items: {id, text, bucket}[]}`; `scenario {id, title, start, nodes: Record<string, {text, choices: {label, next}[], ending?: 'good'|'bad'|'neutral'}>}`; `ai-helper {id, mode: 'prompt-review'|'ask', title, placeholder, context}`
  - `Hotspot = {id, x, y, w, h, title, text}` (координаты в долях 0–1 от размеров схемы); `BookRef = {section: string, label: string}`; `QuizQuestion = {id, question, options: string[], correct: number, explanation}`; `PracticeStep = {id, title, prompt?: string, done: string}`; `MentorCheck = {id, text, auto?: 'tests'|'lint'|'secrets'|'rls'|'file'}`
  - `load.ts`: `getDays(): Day[]` (все файлы `content/days/*.json` через `import.meta.glob`, по возрастанию `number`), `getDay(n: number): Day | undefined`.
- Для `status: 'draft'` обязательны только `id`, `number`, `week`, `status`, `title`, `goal`; остальные поля можно опустить (по умолчанию пустые строки, массивы и `minutes: {theory: 0, practice: 0}`). Для `'ready'` — все поля и минимум 5 вопросов, 1 шаг практики, 1 пункт чек-листа, 2 вопроса наставника.

- [ ] **Step 1: Тесты.** `schema.test.ts`: (а) `valid-day.json` проходит; (б) `ready`-день с 4 вопросами теста отклоняется, в ошибке путь `quiz`; (в) `correct` вне диапазона `options` отклоняется; (г) `scenario` со ссылкой `next` на несуществующий узел отклоняется; (д) каждый файл `content/days/*.json` проходит схему; (е) номера дней уникальны и `id` = `day-NN`.
- [ ] **Step 2:** `npm test` — FAIL.
- [ ] **Step 3:** Реализовать схемы с проверками (б)–(г) через `superRefine`, `load.ts`, минимальный `day-01.json` со `status: 'draft'`.
- [ ] **Step 4:** `npm test` — PASS.
- [ ] **Step 5:** Коммит `course: схема содержания дня`.

### Task 3: Схемы и термины из книги

**Files:**
- Create: `course/scripts/extract-book.mjs`, `course/content/figures/` (генерируется), `course/content/glossary.json` (генерируется), `course/src/styles/figures.css`, `course/src/components/Figure.tsx`, `course/src/components/FigureDefs.tsx`
- Modify: `course/package.json` (скрипт `extract:book`)
- Test: `course/scripts/extract-book.test.ts`, `course/src/components/Figure.test.tsx`

**Interfaces:**
- Consumes: книга `../vibe-coding-na-praktike-2026-10.html` (данные — JSON после `const BOOK = `, SVG схем в `BOOK.figs`, словарь — блок списка с классом `gl`).
- Produces: `extract-book.mjs <book.html> <outDir>` пишет `figures/<id>.svg` для **всех** схем книги и `glossary.json` — массив `{term: string, definition: string, refs: string[]}`; `figures.css` — правила `.fg-*` из книги; `<Figure id="abc_restaurant" />` вставляет SVG инлайном; `<FigureDefs/>` — скрытый `<svg><defs>` с маркерами `bk-arrow`, `bk-arrow-acc`, `bk-arrow-risk`, `bk-arrow-ok` (копия из книги), монтируется один раз в `App`.

- [ ] **Step 1: Тесты.** Скрипт на книге создаёт `abc_restaurant.svg`, содержащий `class="fg-`; `glossary.json` содержит термин «Бенчмарк» и не меньше 270 терминов; `Figure` для неизвестного id выводит «Схема не найдена», а не падает.
- [ ] **Step 2:** FAIL. **Step 3:** реализовать. **Step 4:** PASS.
- [ ] **Step 5:** Коммит `course: схемы и словарь из книги` (сгенерированные файлы коммитятся).

### Task 4: Хранение прогресса

**Files:**
- Create: `course/src/progress/model.ts`, `course/src/progress/stores.ts`, `course/src/progress/useProgress.ts`
- Test: `course/src/progress/model.test.ts`, `course/src/progress/stores.test.ts`

**Interfaces:**
- Produces:
  - `Progress = { version: 1; updatedAt: string; days: Record<string, DayProgress>; streak: {lastDate: string | null; count: number}; cards: Record<string, 'know' | 'repeat'> }`
  - `DayProgress = { steps: Record<string, boolean>; quiz: {best: number; total: number; answers: Record<string, number>}; trainers: Record<string, boolean>; scenarios: Record<string, string>; notes: string; mentorAccepted: boolean; completedAt?: string }`
  - чистые функции: `emptyProgress(): Progress`; `markStep(p, dayId, stepId, done): Progress`; `recordQuiz(p, dayId, answers, score, total): Progress` (best = max); `setTrainerDone`, `setScenarioEnding`, `setNotes`, `setMentorAccepted`, `setCard`; `touchStreak(p, today: string /*YYYY-MM-DD*/): Progress` (тот же день — без изменений, следующий — +1, пропуск — 1); `dayStatus(p, day: Day): 'not-started'|'in-progress'|'done'` (done — все шаги отмечены, тест сдан не ниже 80 %, наставник принял); `mergeProgress(a, b): Progress` (шаги и тренажёры — объединение «сделано», best — максимум, заметки — из более нового `updatedAt`, серия — бо́льшая); `parseProgress(raw: unknown): Progress` (невалидное → `emptyProgress()`).
  - `ProgressStore = { kind: 'claude' | 'local' | 'memory'; load(): Promise<Progress>; save(p: Progress): Promise<void> }`; `localStore(storage?: Storage)`; `claudeStore(db, userId)` (документ `data/users/${userId}/progress`); `memoryStore()`.
  - `useProgress(): { progress: Progress; update(fn: (p: Progress) => Progress): void; storeKind: ProgressStore['kind'] }` — сразу рендерит из `localStore` (или `memoryStore`, если `localStorage` бросает), затем асинхронно пробует `window.claude?.use('db')` и `use('user')`; при успехе загружает документ, делает `mergeProgress` и переключается на `claudeStore`; сохранение — с задержкой 800 мс, одна запись за раз.

- [ ] **Step 1: Тесты модели:** серия (тот же день / следующий / через день); `recordQuiz` не уменьшает `best`; `dayStatus` для каждого из трёх состояний; `mergeProgress` сохраняет отмеченный шаг из любой стороны и максимальный `best`; `parseProgress({version: 99})` и `parseProgress('мусор')` → пустой прогресс.
- [ ] **Step 2: Тесты хранилищ:** `localStore` с хранилищем, чьи методы бросают, не падает при `load/save` (Review Focus 5); `claudeStore` с фейковым `db` пишет ровно в `data/users/u1/progress`; `useProgress` без `window.claude` остаётся на `local` (Review Focus 1); при фейковом `window.claude`, где в базе есть шаг, а в браузере другой, — после загрузки отмечены оба (Review Focus 2).
- [ ] **Step 3:** FAIL. **Step 4:** реализовать. **Step 5:** PASS.
- [ ] **Step 6:** Коммит `course: хранение прогресса`.

### Task 5: Карта курса и страница дня

**Files:**
- Create: `course/src/router.ts`, `course/src/pages/MapPage.tsx`, `course/src/pages/DayPage.tsx`, `course/src/components/BlockView.tsx`, `course/src/components/BookLink.tsx`, `course/src/styles/layout.css`
- Modify: `course/src/App.tsx`
- Test: `course/src/router.test.ts`, `course/e2e/navigation.spec.ts`

**Interfaces:**
- Consumes: `getDays`, `getDay` (задача 2), `useProgress`, `dayStatus` (задача 4).
- Produces: маршруты по якорю — `#/` (карта), `#/day/N` (день); `parseRoute(hash: string): {name: 'map'} | {name: 'day', n: number}` (неизвестное → карта); `BlockView({block, dayId})` — переключатель по `block.type`, для ещё не реализованных типов выводит заглушку «Скоро» (задачи 6–9 и 12 подключают свои компоненты сюда); `BookLink({bookRef})` → `<a href="book.html#{section}" target="_blank">`.
- Карта: 21 карточка по неделям, у каждой номер, название, статус (`dayStatus`), черновики помечены «готовится»; сверху серия дней и общий процент. Страница дня: блоки в порядке спецификации — «Зачем сегодня» (goal, result, minutes), теория (`blocks`), тест, практика, наставник, итог дня; кнопки «назад к карте» и «следующий день».

- [ ] **Step 1: Тесты.** `parseRoute`: `'#/day/3'` → день 3, `'#/day/99'` и `'#/abc'` → карта. e2e: карта показывает 21 карточку; клик по дню 1 открывает его цель; «назад» возвращает к карте; ссылка книги ведёт на `book.html#s77`.
- [ ] **Step 2:** FAIL. **Step 3:** реализовать. **Step 4:** PASS (`npm test && npm run e2e`).
- [ ] **Step 5:** Коммит `course: карта и страница дня`.

### Task 6: Блоки теории, тест, карточки и заметки

**Files:**
- Create: `course/src/blocks/IdeaBlock.tsx`, `course/src/blocks/DiagramBlock.tsx`, `course/src/blocks/Quiz.tsx`, `course/src/blocks/quiz.ts`, `course/src/blocks/Cards.tsx`, `course/src/blocks/Notes.tsx`
- Modify: `course/src/components/BlockView.tsx`, `course/src/pages/DayPage.tsx`
- Test: `course/src/blocks/quiz.test.ts`, `course/src/blocks/DiagramBlock.test.tsx`, `course/e2e/quiz.spec.ts`

**Interfaces:**
- Consumes: `Figure` (задача 3), `useProgress`, `recordQuiz`, `setCard`, `setNotes` (задача 4), `glossary.json`.
- Produces: `scoreQuiz(questions: QuizQuestion[], answers: Record<string, number>): {score: number; total: number}`; `IdeaBlock` (текст с абзацами по `\n\n`, схема, `BookLink`); `DiagramBlock` (схема с прозрачными кнопками-зонами по `hotspots`, нажатие показывает `title/text`; при `steps` — кнопки «назад/дальше» и подпись шага); `Quiz` (ответ подсвечивается сразу, показывается `explanation`, «пройти заново»; результат пишется через `recordQuiz`); `Cards` (термины дня из словаря, кнопки «знаю» / «повторить»; карточки «повторить» из прошлых дней показываются в итоге дня); `Notes` (поле, сохранение через `setNotes`).

- [ ] **Step 1: Тесты.** `scoreQuiz` на 6 вопросах с 4 верными → `{score: 4, total: 6}`; `DiagramBlock`: клик по зоне показывает её `title`, второй клик скрывает; e2e: ответить на все вопросы дня 1, перезагрузить страницу — лучший результат на месте.
- [ ] **Step 2:** FAIL. **Step 3:** реализовать. **Step 4:** PASS.
- [ ] **Step 5:** Коммит `course: теория, тест, карточки, заметки`.

### Task 7: Тренажёры и ситуации с выбором

**Files:**
- Create: `course/src/blocks/trainers/PromptBuilder.tsx`, `course/src/blocks/trainers/FindTheBug.tsx`, `course/src/blocks/trainers/SortTrainer.tsx`, `course/src/blocks/trainers/evaluate.ts`, `course/src/blocks/Scenario.tsx`
- Modify: `course/src/components/BlockView.tsx`
- Test: `course/src/blocks/trainers/evaluate.test.ts`, `course/src/blocks/Scenario.test.tsx`

**Interfaces:**
- Consumes: типы `trainer`, `scenario` (задача 2); `setTrainerDone`, `setScenarioEnding` (задача 4).
- Produces: `evaluatePrompt(parts, chosen: Record<key, string>): {missing: key[]; weak: key[]; ok: boolean}` (выбран вариант из `bad` → `weak`, не выбран ничего → `missing`); `evaluateBugs(bugLines: number[], clicked: number[]): {found: number[]; missed: number[]; wrong: number[]}`; `evaluateSort(items, placed: Record<itemId, bucketId>): {correct: string[]; wrong: string[]}`. Компоненты используют их и отмечают тренажёр пройденным при `ok`/всех найденных/всех верных. `Scenario` идёт по узлам, на `ending` показывает итог и «сыграть заново», концовка пишется в прогресс; перетаскивание в `SortTrainer` дублируется выбором корзины кнопкой (для телефона).

- [ ] **Step 1: Тесты** трёх функций оценки (по одному случаю на каждое поле результата) и `Scenario`: выбор ведёт по `next`, на узле с `ending: 'bad'` появляется «сыграть заново», после него снова стартовый узел.
- [ ] **Step 2:** FAIL. **Step 3:** реализовать. **Step 4:** PASS.
- [ ] **Step 5:** Коммит `course: тренажёры и ситуации`.

### Task 8: ИИ на странице

**Files:**
- Create: `course/src/ai/ai.ts`, `course/src/blocks/AiHelper.tsx`
- Modify: `course/src/components/BlockView.tsx`
- Test: `course/src/ai/ai.test.ts`, `course/src/blocks/AiHelper.test.tsx`

**Interfaces:**
- Consumes: `window.claude.use('sample')` → `sample(input, opts) : Promise<{text}>`, `sample.json<T>(input, opts)`; ошибки `{code, message}` (коды `not_granted`, `rate_limited`, `refused`, `sampling_disabled`, `invalid_json` и др.); блок `ai-helper` (задача 2).
- Produces: `getAi(): Promise<Ai | null>`; `Ai = { reviewPrompt(prompt: string, context: string): Promise<PromptReview>; ask(question: string, context: string, onText?: (t: string) => void): Promise<string> }`; `PromptReview = {parts: {key: 'goal'|'context'|'constraints'|'criteria'|'format'; ok: boolean; advice: string}[]; summary: string}`; `aiErrorMessage(code: string): string` (русские тексты: `not_granted` → «Разрешите ИИ в настройках страницы», `rate_limited` → «Лимит на сейчас исчерпан, попробуйте позже», `refused` → «ИИ не стал отвечать на этот запрос», остальные → «Не получилось, попробуйте ещё раз»).
- `reviewPrompt` вызывает `sample.json` с инструкцией: оценить запрос по пяти элементам ЦКОКФ книги (гл. 2), ответ строго JSON формата `PromptReview`, `modelTier: 'quick'`; `ask` — `sample` с инструкцией отвечать только в рамках `context` (материал дня) и простыми словами, `cache: false`, стриминг через `onText`.
- `AiHelper`: без `Ai` показывает «ИИ доступен, когда курс открыт в Claude»; пока запрос идёт, кнопка заблокирована и повторное нажатие ничего не отправляет; ошибка → `aiErrorMessage`; при `not_granted` блок сворачивается до этой подсказки.

- [ ] **Step 1: Тесты** с фейковым `sample`: (а) `getAi()` без `window.claude` → `null`, `AiHelper` показывает подсказку (Review Focus 1); (б) два быстрых клика — фейк вызван один раз (Review Focus 3); (в) фейк отклоняет `{code: 'rate_limited'}` — видно «Лимит на сейчас исчерпан», кнопка снова активна; (г) `reviewPrompt` возвращает разобранные `parts` из ответа фейка; ответ без поля `parts` → ошибка с общим текстом.
- [ ] **Step 2:** FAIL. **Step 3:** реализовать. **Step 4:** PASS.
- [ ] **Step 5:** Коммит `course: ИИ на странице`.

### Task 9: Практика и блок наставника на странице

**Files:**
- Create: `course/src/blocks/Practice.tsx`, `course/src/blocks/MentorBlock.tsx`, `course/src/components/CopyButton.tsx`
- Modify: `course/src/pages/DayPage.tsx`
- Test: `course/src/blocks/Practice.test.tsx`

**Interfaces:**
- Consumes: `PracticeStep`, `mentor` (задача 2); `markStep`, `setMentorAccepted` (задача 4).
- Produces: `CopyButton({text})` — копирует через `navigator.clipboard.writeText`, при отказе выделяет текст в поле для ручного копирования, подпись «Скопировано» на 2 с; `Practice` — шаги с галочкой, запросом в блоке «Запрос» и строкой «Готово, когда: …»; `MentorBlock` — команда `/mentor N` с копированием, список пунктов чек-листа, переключатель «Наставник принял день».

- [ ] **Step 1: Тест:** отметка шага сохраняется в прогрессе; при `clipboard.writeText`, бросающем ошибку, текст выделен и видна подсказка «Скопируйте вручную».
- [ ] **Step 2:** FAIL. **Step 3:** реализовать. **Step 4:** PASS.
- [ ] **Step 5:** Коммит `course: практика и наставник на странице`.

### Task 10: Основа видео на Remotion

**Files:**
- Create: `course/video/index.ts`, `course/video/Root.tsx`, `course/video/types.ts`, `course/video/lib/timeline.ts`, `course/video/lib/Subtitles.tsx`, `course/video/actors/` (`Coach.tsx`, `Client.tsx`, `Phone.tsx`, `Server.tsx`, `Database.tsx`, `Turnstile.tsx`, `Hacker.tsx`, `Packet.tsx`), `course/video/theme.ts`
- Modify: `course/package.json` (зависимости `remotion`, `@remotion/player`, `@remotion/cli` = `4.0.537`; скрипт `studio`)
- Test: `course/video/lib/timeline.test.ts`

**Interfaces:**
- Produces:
  - `VideoScript = { id: string; fps: 30; width: 1280; height: 720; scenes: {id: string; durationInFrames: number}[]; cues: Cue[]; hotspots: VideoHotspot[] }`; `Cue = {from: number; to: number; text: string}` (кадры от начала ролика); `VideoHotspot = {from: number; to: number; x: number; y: number; w: number; h: number; title: string; text: string}` (пиксели кадра 1280×720).
  - `totalFrames(s): number`; `sceneStart(s, sceneId): number`; `validateScript(s): string[]` (пустой массив — без ошибок; ошибки: реплики пересекаются, реплика или зона выходит за конец ролика, у реплики `to <= from`).
  - `<Subtitles cues={...}/>` — внизу кадра, полупрозрачная плашка, текущая реплика по `useCurrentFrame()`.
  - Актёры — простые векторные фигуры в стиле схем книги (цвета из `theme.ts`, совпадают с токенами книги), принимают `x, y, scale, highlight?` и анимируются через `interpolate`/`spring` Remotion.

- [ ] **Step 1: Тесты** `validateScript`: корректный сценарий → `[]`; пересекающиеся реплики, реплика за концом и зона за концом → по одной понятной ошибке; `totalFrames` = сумма сцен.
- [ ] **Step 2:** FAIL. **Step 3:** реализовать, зарегистрировать в `Root.tsx` пустую тестовую композицию `smoke` (2 с).
- [ ] **Step 4:** PASS; `npx remotion still video/index.ts smoke out/smoke.png --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell` создаёт PNG.
- [ ] **Step 5:** Коммит `course: основа видео на Remotion`.

### Task 11: Пилотный ролик «Почему тренер не увидит чужих подопечных» и MP4

**Files:**
- Create: `course/video/pilot-rls/script.ts`, `course/video/pilot-rls/PilotRls.tsx`, `course/video/pilot-rls/scenes/` (`S1Coaches.tsx`, `S2Request.tsx`, `S3Attack.tsx`, `S4Turnstile.tsx`, `S5CheckYourself.tsx`), `course/scripts/render-video.mjs`
- Modify: `course/video/Root.tsx`, `course/package.json` (скрипт `render:pilot`)
- Test: `course/video/pilot-rls/script.test.ts`

**Interfaces:**
- Consumes: `VideoScript`, `validateScript`, `Subtitles`, актёры (задача 10).
- Produces: `pilotRlsScript: VideoScript` (`id: 'pilot-rls'`), композиция `pilot-rls` в `Root.tsx`, компонент `PilotRls` (используется плеером в задаче 12); `render-video.mjs <compositionId> <out.mp4>` — рендер H.264, `--crf=28`, браузер `/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`; после рендера печатает длительность и размер и завершается с ошибкой, если файл больше 20 МБ.
- Сценарий (свой текст, не пересказ книги), сцены и смысл реплик:
  1. **S1Coaches** (~30 с): два тренера, у каждого по три подопечных; данные всех лежат в одной базе — «как вещи в общей раздевалке».
  2. **S2Request** (~45 с): подопечный нажимает «Мои тренировки», пакет летит телефон → сервер → база с адресом `client/17`, возвращается его тренировка.
  3. **S3Attack** (~45 с): злоумышленник меняет `client/17` на `client/18`; без защиты база отдаёт чужие данные; красная вспышка и подпись «так утекают данные».
  4. **S4Turnstile** (~60 с): RLS — турникет у каждой строки базы: пропускает, только если пропуск (кто вошёл) совпадает с владельцем записи; повтор атаки — турникет закрыт; оговорка «проверка в интерфейсе не защищает, защищает база».
  5. **S5CheckYourself** (~40 с): «проверьте у себя за 2 минуты»: второй пользователь → попытка открыть чужое → должно быть пусто; отсылка к запросу из книги (гл. 7).
- Горячие точки: на S2 — пакет (что внутри запроса), на S3 — адрес `client/18`, на S4 — турникет (что такое политика RLS).

- [ ] **Step 1: Тест** `script.test.ts`: `validateScript(pilotRlsScript)` → `[]`; длительность 3–5 минут (`5400..9000` кадров); у каждой сцены есть хотя бы одна реплика; горячих точек ровно 3.
- [ ] **Step 2:** FAIL. **Step 3:** сценарий и сцены. **Step 4:** PASS; `npx remotion still … pilot-rls --frame=<середина каждой сцены>` — 5 PNG, проверить глазами: текст читается, ничего не обрезано.
- [ ] **Step 5:** `npm run render:pilot` → `out/pilot-rls.mp4` ≤ 20 МБ, длительность совпадает со сценарием.
- [ ] **Step 6:** Коммит `course: пилотный ролик про RLS` (MP4 не коммитится).

### Task 12: Плеер ролика на странице

**Files:**
- Create: `course/src/video/VideoBlock.tsx`, `course/src/video/narration.ts`, `course/src/video/useNarration.ts`, `course/src/video/HotspotLayer.tsx`, `course/src/video/registry.ts`
- Modify: `course/src/components/BlockView.tsx`
- Test: `course/src/video/narration.test.ts`, `course/e2e/video.spec.ts`

**Interfaces:**
- Consumes: `PilotRls`, `pilotRlsScript` (задача 11); `@remotion/player` (`Player`, `PlayerRef`, события `play`, `pause`, `seeked`, `frameupdate`).
- Produces: `registry.ts` — `videos: Record<string, {component, script, mp4Url?: string}>` (ключ = `videoId` блока); `cueStarting(prevFrame: number, frame: number, cues: Cue[]): Cue | null` (реплика, чьё начало пересечено при обычном воспроизведении; при перемотке назад или скачке больше 15 кадров — `null`); `pickRussianVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null` (первый с `lang`, начинающимся на `ru`); `useNarration(playerRef, cues, enabled)` — озвучивает начавшуюся реплику, на паузе и перемотке вызывает `speechSynthesis.cancel()`.
- `VideoBlock`: плеер 16:9 на ширину блока, кнопки «пауза/воспроизведение», полоса перемотки, переключатель «Голос» (скрыт, если `speechSynthesis` нет или `pickRussianVoice` вернул `null`), на паузе — `HotspotLayer` с кнопками зон текущего кадра, нажатие показывает пояснение; ссылка «Скачать MP4», если задан `mp4Url`.

- [ ] **Step 1: Тесты:** `cueStarting` — пересечение начала реплики, перемотка назад, скачок на 100 кадров; `pickRussianVoice` — список без русского → `null` (Review Focus 4); e2e: на странице дня 4 ролик играет, после паузы на кадре сцены S3 видна кнопка зоны «client/18» и её пояснение открывается.
- [ ] **Step 2:** FAIL. **Step 3:** реализовать. **Step 4:** PASS.
- [ ] **Step 5:** Коммит `course: плеер ролика на странице`.

### Task 13: Содержание дня 1 и черновик дня 4

**Files:**
- Modify: `course/content/days/day-01.json`
- Create: `course/content/days/day-04.json`, `course/content/days/day-02.json`…`day-21.json` (черновики: только `title`, `goal`, `week`, `status: 'draft'` по программе спецификации)
- Test: `course/e2e/day-01.spec.ts`

**Interfaces:**
- Consumes: схема (задача 2), все типы блоков (задачи 6–9, 12), id схем книги (задача 3), разделы книги.
- Day 1 (`status: 'ready'`), тема «Азбука и глава 1»:
  - `goal`/`result`: понимать, из чего состоит приложение, какие бывают режимы работы с ИИ и как выбрать модель; к концу дня — настроенные инструменты, репозиторий приложения для тренера с `CLAUDE.md` и описанием идеи, установленный наставник.
  - Теория (4–5 блоков `idea`, у каждого `bookRef`): устройство приложения через «ресторан» (схема `abc_restaurant`, раздел `sa1`); где живёт код: терминал, редактор, репозиторий, коммит (`sa3`); спектр режимов от автодополнения до агентов (схема `1.1`, раздел `s5`); как понять модель — карточка и бенчмарки (схемы `ch1_modelcard`, `ch1_trust`, разделы `s77`, `s78`); подписки, токены и лимиты (`s79`).
  - Интерактив: `diagram` по `abc_restaurant` с 4 зонами (зал — фронтенд, кухня — бэкенд, склад — база данных, официант — API); `trainer/sort` «какой режим подходит задаче» (корзины: вайб-кодинг, разработка с помощью ИИ, делегирование агенту; 6 задач из жизни приложения для тренера); `scenario` «выбираем модель для проекта» (3 ветки: самая дорогая на всё → бюджет кончился к среде; только по рейтингу арены → красиво, но ошибки в коде; базовая модель по умолчанию + флагман для планирования и мини-набор → хороший финал); `ai-helper` в режиме `ask` с контекстом дня.
  - Тест: 6 вопросов по теории дня с объяснениями, сверенными с книгой.
  - Практика (6 шагов, у каждого `prompt` и `done`): установить Claude Code и войти; создать на GitHub приватный репозиторий `trainer-app`; открыть его в Claude Code (окружение Local); описать идею в `docs/idea.md` (для кого, какая задача, чем отличается) — запрос задаёт вопросы по одному; `/init` и правка `CLAUDE.md` (стек из спецификации, три запрета); установить наставника — скопировать папку `mentor` из репозитория `danilandersonai-pixel/vibecoding-` в `.claude/skills/mentor` и запустить `/mentor 1`.
  - Наставник: чек-лист — есть хотя бы один коммит; `CLAUDE.md` существует и называет цель и стек (`auto: 'file'`); `docs/idea.md` отвечает на «для кого / какая задача / чем отличается»; вопросы — «Что в вашем `CLAUDE.md` агенту делать запрещено и почему?», «Какую модель вы взяли для планирования, а какую для повседневной работы и почему?».
  - Карточки — точные названия терминов из `glossary.json`: «Фронтенд», «Бэкенд», «База данных», «API», «Репозиторий», «Коммит», «Агент», «Контекстное окно», «Токен», «Карточка модели (model card, system card)», «Бенчмарк», «MCP».
- Day 4 (`status: 'draft'`): заголовок и цель по программе, один блок `video` с `videoId: 'pilot-rls'`.

- [ ] **Step 0: Юнит-тест** `course/src/content/cards.test.ts`: каждый термин из `cards` всех дней есть в `glossary.json` (точное совпадение `term`).
- [ ] **Step 1: e2e-тест** «прохождение дня 1»: открыть день, раскрыть зону «кухня», пройти сортировку, дойти до хорошего финала ситуации, ответить на тест на 100 %, отметить все шаги и «наставник принял» — на карте день 1 «пройден», серия = 1.
- [ ] **Step 2:** FAIL. **Step 3:** написать содержание; каждую мысль и объяснение теста сверить с указанными разделами книги. **Step 4:** PASS, схема проходит для всех 21 файлов.
- [ ] **Step 5:** Коммит `course: день 1 и черновики дней`.

### Task 14: Наставник для Claude Code

**Files:**
- Create: `mentor/SKILL.md`, `course/scripts/build-mentor.mjs`, `mentor/days/day-01.md` (генерируется), `mentor/README.md`
- Modify: `course/package.json` (скрипт `build:mentor`)
- Test: `course/scripts/build-mentor.test.ts`

**Interfaces:**
- Consumes: `Day` (задача 2), `day-01.json` (задача 13).
- Produces: `build-mentor.mjs <daysDir> <outDir>` пишет `day-NN.md` для каждого дня со `status: 'ready'`: заголовок «День N — <title>», цель, чек-лист с пометками автоматических проверок, вопросы наставника.
- `SKILL.md`: frontmatter `name: mentor`, `description:` (когда вызывать — «проверка практики дня курса: /mentor N»). Инструкция: взять N из аргумента; прочитать `days/day-NN.md` рядом с навыком (нет файла — сказать, что день ещё не готов); выполнить автоматические проверки по пометкам (`tests` — тесты проекта, `lint` — линтер, `secrets` — поиск ключей и паролей в отслеживаемых git файлах, `rls` — попытка прочитать чужие данные вторым пользователем по инструкции из чек-листа, `file` — наличие и содержание файла); задать вопросы по одному и разобрать ответы; на невыполненное — подсказка, а не готовое решение; код не менять без просьбы; дописать в `mentor-log.md` проекта дату, номер дня, вердикт «принят / не принят» и список пунктов.

- [ ] **Step 1: Тест:** скрипт на `day-01.json` создаёт `day-01.md`, содержащий «День 1», каждый пункт чек-листа и оба вопроса; для черновиков файлы не создаются.
- [ ] **Step 2:** FAIL. **Step 3:** реализовать скрипт и `SKILL.md`. **Step 4:** PASS.
- [ ] **Step 5:** Ручная проверка: во временной папке с `git init`, без `CLAUDE.md`, прочитать `SKILL.md` и `day-01.md` и пройти инструкцию по шагам — пункт про `CLAUDE.md` должен получиться «не выполнен», с подсказкой; затем добавить файл — «выполнен».
- [ ] **Step 6:** Коммит `mentor: наставник и чек-лист дня 1`.

### Task 15: Публикация как приватная страница Claude

**Files:**
- Create: `course/scripts/artifact-page.mjs`, `course/README.md`
- Modify: `course/package.json` (скрипт `build:artifact`), `course/src/video/registry.ts` (`mp4Url` после загрузки)
- Test: `course/scripts/artifact-page.test.ts`

**Interfaces:**
- Consumes: сборка Vite (`dist/`), книга, `out/pilot-rls.mp4`.
- Produces: `artifact-page.mjs <dist> <out>` собирает `out/page.html` — содержимое страницы для публикации: `<title>Вайб-курс</title>`, ссылки на `assets/*.css`, `<script type="module" src="assets/*.js">`, `<div id="root">` (без собственного `<!doctype>`, `<html>`, `<head>` — их добавляет публикация), и копирует `assets/` и книгу как `book.html`.

- [ ] **Step 1: Тест:** на учебной `dist/index.html` скрипт оставляет title, все `link`/`script` с относительными путями `assets/…`, `#root` и не содержит `<html` и `<head`.
- [ ] **Step 2:** FAIL. **Step 3:** реализовать. **Step 4:** PASS; `npm run build:artifact`.
- [ ] **Step 5:** Загрузить навыки `artifact-design` и `artifact-capabilities`; опубликовать `out/page.html` с `files` (`assets/*`, `book.html`) и `capabilities: {sample: {}, db: {}, user: {}, assets: {}}`; загрузить `out/pilot-rls.mp4` в хранилище страницы (`asset: true`), вписать полученный адрес в `registry.ts`, пересобрать и опубликовать тем же путём.
- [ ] **Step 6:** Проверка после публикации по навыку: один `ArtifactData` `list` коллекции `data/users` и тот же запрос с пониженным уровнем доступа — чужой прогресс не виден; открыть страницу — карта, день 1 и ролик дня 4 на месте. Одной строкой сообщить, что проверено и что проверить не удалось.
- [ ] **Step 7:** `course/README.md`: как запустить локально, как собрать, отрендерить ролик и опубликовать. Коммит `course: публикация`.
