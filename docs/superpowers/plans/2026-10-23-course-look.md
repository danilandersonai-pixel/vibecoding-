# Новый вид курса «Обложка книги» — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Главная, страница дня и плеер роликов курса выглядят как на макетах направления А «Обложка книги» — на компьютере, телефоне и в тёмной теме, — а все прежние возможности работают.

**Architecture:** Вид — новые React-компоненты главной (`src/home/`) и дня (`src/day/`) поверх прежних блоков; логика, которую показывают компоненты (текущий день, части дня, состав дня, обложка ролика), вынесена в чистые функции `src/course/` с тестами. Стили — переменные в `tokens.css` и по файлу на экран вместо одного `layout.css`. Плеер — прежний Remotion `Player` с обложкой на кадре первой горячей точки.

**Tech Stack:** React 19, TypeScript, Vite 8, Zod, Vitest + Testing Library, Playwright, oxlint, Remotion Player 4.0.537.

**Spec:** `docs/superpowers/specs/2026-10-23-course-look-design.md`. Макеты: https://claude.ai/artifact/LHfwPSbDtbWzjbKYWuonzs (артборды «А · Обложка книги», «А · Страница дня», «А · День на телефоне»).

## Global Constraints

- Новых зависимостей нет; Remotion — 4.0.537, ролики, MP4, содержание дней (`content/days/*.json`) и книга не меняются.
- Весь текст интерфейса — по-русски; тексты, заданные спецификацией, — дословно (обложка, диф, факты, шаги дня, строки «Продолжить», карточка черновика).
- Цвета — только переменные из `src/styles/tokens.css` (значения — таблица §2 спецификации); в компонентах нет литералов цвета, кроме SVG-иллюстраций, которые тоже берут `var(--…)`.
- Шрифты: Onest — интерфейс и заголовки, Literata — текст для чтения и подзаголовки курсивом, JetBrains Mono — код, запросы, диф, длительность.
- Скругления 20 / 16 / 14 / 10 px и круглые метки; тень только у карточки «Продолжить» и обложки ролика.
- Всё нажимаемое — не меньше 44 × 44 px; видимая рамка `:focus-visible` цвета акцента.
- Ширина содержимого до 1200 px; поля 32 px, на телефоне (≤ 640 px) 16 px; план дня колонкой при ширине > 960 px, полосой — при ≤ 960 px.
- Переходы внутри страницы («Карта», «Как устроен курс», пункты плана дня, «Дальше» в плеере) — кнопки со `scrollIntoView`, не якоря `#…`: якорь занят маршрутом `#/day/N`.
- `@media (prefers-reduced-motion: reduce)` выключает все анимации и переходы.
- Тёмная тема — как сейчас: `prefers-color-scheme: dark` и `:root[data-theme="dark"]`.
- Контраст текста к фону ≥ 4,5 : 1 в обеих темах.
- Проверки перед каждым коммитом: `npm test`, `npx tsc -b`, `npm run lint` — чисто; в задачах, где меняется поведение страницы, ещё `npm run e2e`.

## Review Focus

1. Ученик проходил дни не по порядку (день 3 пройден, день 2 — нет): «Продолжить» ведёт в день 2, на карте день 3 — «пройден», день 2 — «сейчас».
2. Узкий телефон (320 px) и очень длинная тема дня: страница не прокручивается вбок, строки карты и шапки переносятся.
3. Черновой день, где есть одни части и нет других (тест есть, практики нет): в плане дня есть «Проверка понимания», «Практика» и «Наставник» — бледные «скоро», карточка «Остальное готовится» называет только недостающее.
4. Ролик, код которого не загрузился: нет обложки и панели, есть «Ролик не загрузился», остальная страница работает.
5. Клавиатура: пункты плана дня, кнопка ▶ на обложке и «Продолжить» доступны с Tab и видимо выделяются при фокусе.

---

### Task 1: Переменные стилей и разбиение стилей по экранам

**Files:**
- Modify: `course/src/styles/tokens.css`, `course/src/styles/base.css`, `course/src/main.tsx`
- Create: `course/src/styles/home.css`, `course/src/styles/day.css`, `course/src/styles/blocks.css`, `course/src/styles/video.css`
- Delete: `course/src/styles/layout.css` (его правила разнесены без изменений по четырём новым файлам)
- Test: `course/src/styles/tokens.test.ts`

**Interfaces:**
- Produces (CSS-переменные, светлая / тёмная тема):
  - `--desk` `#F4F2EC` / `#111317` (фон страницы); `--paper`, `--paper-edge`, `--rule`, `--ink`, `--ink-soft`, `--accent`, `--accent-ink`, `--tint` — прежние значения;
  - `--cover-bg` `#1D2B8F` / `#18236F`; `--cover-ink` `#F4F5FF`; `--cover-soft` `#B2BAF0`; `--cover-add` `#90E4BE`; `--cover-del` `#FFAD9E` (обе темы одинаково);
  - `--fig-ok` `#2E7D5B` / `#5CC49A`; `--fig-risk` `#C4432C` / `#F2765E` — прежние;
  - новые: `--term-bg` `#1F2228` / `#2A2D34`, `--term-ink` `#E8E5DD`, `--term-soft` `#A4A8B0`, `--term-edge` `#3A3E46`;
  - новые: `--radius-xl: 20px`, `--radius-l: 16px`, `--radius-m: 14px`, `--radius-s: 10px`, `--shadow-raised` (значение прежней `--shadow`), `--content: 1200px`.
- Produces (классы в `base.css`): `.btn` (≥ 44 px, `--radius-m`), `.btn-primary` (фон `--accent`, текст белый), `.btn-cover` (фон `--cover-ink`, текст `--cover-bg`), `.btn-ghost` (рамка), `.kicker` (13 px, прописные, разрядка 0,16 em, цвет `--ink-soft`), `.paper` (фон `--paper`, рамка `--paper-edge`, `--radius-xl`), `:focus-visible` — рамка 2 px `--accent`, отступ 2 px.

- [ ] **Step 1: Тест переменных и контраста.** `tokens.test.ts` читает `tokens.css` (`fs.readFileSync`), выделяет три блока (`:root{…}`, блок внутри `prefers-color-scheme: dark`, `:root[data-theme="dark"]{…}`) и проверяет:
  - `it('в светлой и тёмной теме есть все переменные')` — каждая переменная из списка выше задана в светлом блоке и в обоих тёмных (кроме `--radius-*`, `--content`, которые только в светлом);
  - `it('фон страницы светлой темы — #F4F2EC')`;
  - `it('контраст текста не ниже 4,5 : 1')` — пары (текст, фон) по формуле WCAG (функция `contrast(a: string, b: string): number` внутри теста): `--ink`/`--desk`, `--ink`/`--paper`, `--ink-soft`/`--paper`, `--accent-ink`/`--paper`, `#FFFFFF`/`--accent` (только светлая), `--cover-ink`/`--cover-bg`, `--cover-soft`/`--cover-bg`, `--fig-ok`/`--paper`, `--fig-risk`/`--paper`, `--term-ink`/`--term-bg`, `--term-soft`/`--term-bg` — каждая ≥ 4.5 в обеих темах.
- [ ] **Step 2:** `npx vitest run src/styles` — FAIL (нет `--term-bg`, фон `#D9DCD7`).
- [ ] **Step 3:** Обновить `tokens.css` по Interfaces; добавить классы в `base.css`; разнести правила `layout.css` по `home.css` (карта и итоги), `day.css` (страница дня, навигация), `blocks.css` (блоки теории, тест, практика, наставник, карточки, ИИ), `video.css` (плеер), удалить `layout.css`, в `main.tsx` импортировать `tokens`, `base`, `figures`, `home`, `day`, `blocks`, `video` в этом порядке. Пара, не проходящая контраст, — сдвинуть светлоту её цвета внутри того же тона и записать решение в отчёт.
- [ ] **Step 4:** `npx vitest run src/styles` — PASS; `npm test`, `npx tsc -b`, `npm run lint`, `npm run e2e` — PASS (вид меняется только фоном).
- [ ] **Step 5:** Коммит `course: переменные стилей нового вида и стили по экранам`.

### Task 2: Недели курса в содержании

**Files:**
- Create: `course/content/weeks.json`
- Modify: `course/src/content/schema.ts`, `course/src/content/load.ts`
- Test: `course/src/content/weeks.test.ts`

**Interfaces:**
- Produces: `WeekSchema = z.object({ number: z.union([z.literal(1), z.literal(2), z.literal(3)]), title: z.string().min(1), result: z.string().min(1) })`, `type Week`; `getWeeks(): Week[]` — три недели по возрастанию номера (загрузка как у дней: `import weeks from '../../content/weeks.json'`, разбор схемой массива ровно из 3 элементов).
- `weeks.json` — дословно таблица из §3 спецификации:
  1. «Вся книга и первая работающая версия» — «Приложение на телефоне у первого тренера.»
  2. «Функциональность до уровня конкурентов» — «Программы, рекорды, уведомления и своё отличие.»
  3. «Доводка до продукта» — «Бета-тест с тренерами и запуск на своём домене.»

- [ ] **Step 1: Тесты.** `it('три недели по порядку с названием и итогом')` — `getWeeks().map(w => w.number)` = `[1,2,3]`, `getWeeks()[0].result` = «Приложение на телефоне у первого тренера.»; `it('схема отвергает неделю без итога')` — `WeekSchema.safeParse({ number: 1, title: 'x', result: '' }).success === false`; `it('у каждого дня есть его неделя')` — для каждого `getDays()` найдётся неделя с `number === day.week`.
- [ ] **Step 2:** `npx vitest run src/content/weeks.test.ts` — FAIL (нет `getWeeks`).
- [ ] **Step 3:** Реализовать по Interfaces.
- [ ] **Step 4:** Тот же запуск — PASS; `npm test`, `npx tsc -b`, `npm run lint` — PASS.
- [ ] **Step 5:** Коммит `course: недели курса — в содержании`.

### Task 3: Текущий день и части дня

**Files:**
- Create: `course/src/course/currentDay.ts`, `course/src/course/dayParts.ts`
- Test: `course/src/course/currentDay.test.ts`, `course/src/course/dayParts.test.ts`

**Interfaces:**
- Consumes: `dayStatus(p: Progress, day: Day): DayStatus`, `emptyProgress()`, `markStep`, `recordQuiz`, `setMentorAccepted`, `setTrainerDone`, `setScenarioEnding`, `setNotes`, `setCard` из `src/progress/model.ts`; `Day` из `src/content/schema.ts`.
- Produces:
  - `currentDay(progress: Progress, days: Day[]): { n: number; returning: boolean; allDone: boolean; doneCount: number }` — `n` — номер первого по порядку дня со статусом не `done`; если все `done` — `allDone: true`, `n: days.length`; `returning` — хоть один день не `not-started` или `progress.streak.count > 0`; `doneCount` — число дней `done`.
  - `type PartId = 'why' | 'theory' | 'quiz' | 'practice' | 'mentor' | 'summary'`; `type Part = { id: PartId; title: string; available: boolean; trackable: boolean; done: boolean }`; `PART_TITLES: Record<PartId, string>` = «Зачем сегодня», «Теория», «Проверка понимания», «Практика», «Наставник», «Итог дня»; `dayParts(day: Day, progress: Progress): Part[]` — шесть частей в этом порядке. Правила — §6 спецификации: `available` — why и summary всегда, theory — `blocks.length > 0`, quiz/practice — непустые, mentor — `mentor.checklist.length > 0`; `trackable` — why никогда, theory — есть тренажёр или ситуация, quiz/practice/mentor — когда available, summary — всегда; `done` — theory: все тренажёры `true` в `trainers` и у всех ситуаций есть концовка; quiz: `total > 0 && best / total >= 0.8`; practice: все шаги; mentor: `mentorAccepted`; summary: заметки не пусты или все `day.cards` отмечены в `progress.cards`.
  - `partsDone(parts: Part[]): { done: number; total: number }` — по `trackable`.

- [ ] **Step 1: Тесты `currentDay`** (дни — `getDays()`):
  - `it('новичок — день 1, не вернувшийся')` → `{ n: 1, returning: false, allDone: false, doneCount: 0 }`;
  - `it('день 1 пройден — текущий день 2, вернувшийся')` — прогресс, где у day-01 все шаги, тест 6 из 6, наставник принял → `n: 2, returning: true, doneCount: 1`;
  - `it('дни не по порядку: пройден 3, не пройден 2 — текущий 2')` (Review Focus 1);
  - `it('серия без отметок — уже вернувшийся')` — `streak.count = 2` → `returning: true, n: 1`;
  - `it('все дни пройдены — allDone')` — на трёх-дневном списке из фикстур, все `done` → `{ allDone: true, n: 3, doneCount: 3 }`.
- [ ] **Step 2: Тесты `dayParts`** (день 1 и черновой день 10 из `getDays()`, плюс собранный в тесте день с тестом и без практики):
  - `it('у дня 1 доступны все шесть частей')`, порядок и названия по `PART_TITLES`;
  - `it('у чернового дня 10 тест, практика и наставник недоступны')`, theory — доступна (ролик), summary — доступна;
  - `it('день с тестом, но без практики')` — quiz available, practice и mentor — нет (Review Focus 3);
  - `it('отметки: тест сдан на 5 из 6, практика сделана, наставник принял')` — quiz/practice/mentor `done: true`; на 4 из 6 — quiz `done: false`;
  - `it('теория дня 1 пройдена, когда пройдены тренажёр и ситуация')`;
  - `it('итог дня — по заметкам')`;
  - `it('partsDone считает только отслеживаемые части')` — для пустого прогресса дня 1 `{ done: 0, total: 5 }`.
- [ ] **Step 3:** `npx vitest run src/course` — FAIL (модулей нет).
- [ ] **Step 4:** Реализовать по Interfaces.
- [ ] **Step 5:** `npx vitest run src/course` — PASS; `npm test`, `npx tsc -b`, `npm run lint` — PASS.
- [ ] **Step 6:** Коммит `course: текущий день и части дня`.

### Task 4: Состав дня, обложка ролика, строка готовности

**Files:**
- Create: `course/src/course/summary.ts`
- Test: `course/src/course/summary.test.ts`

**Interfaces:**
- Consumes: `videos` из `src/video/registry.ts`, `totalFrames` из `video/lib/timeline.ts`, `Day`.
- Produces:
  - `formatDuration(seconds: number): string` — `м:сс` (`260 → '4:20'`, `65 → '1:05'`);
  - `videoMeta(videoId: string): { seconds: number; posterFrame: number; hotspots: number } | null` — `seconds = Math.round(totalFrames / fps)`; `posterFrame = hotspots[0]?.from ?? Math.floor(totalFrames / 3)`; `null` для неизвестного id;
  - `dayVideoSummary(day: Day): { count: number; seconds: number }` — по блокам `video` с известными роликами;
  - `plural(n: number, one: string, few: string, many: string): string` — `1 видеоурок`, `2 видеоурока`, `5 видеоуроков`, `11 видеоуроков`, `21 видеоурок`;
  - `daySummaryLine(day: Day): string` — части через « · »: «K видеоурок(а/ов) · м:сс», «тест», «N шаг(а/ов) практики» — только существующие;
  - `readinessLine(days: Day[]): string` — см. Step 1.

- [ ] **Step 1: Тесты:**
  - `it('formatDuration')` — `260 → '4:20'`, `65 → '1:05'`, `0 → '0:00'`;
  - `it('обложка ролика — начало первой горячей точки')` — `videoMeta('pilot-rls').posterFrame === pilotRlsScript.hotspots[0].from`, `seconds === 203`; `videoMeta('нет')` → `null`;
  - `it('plural')` — 1, 2, 5, 11, 21, 22 для «видеоурок / видеоурока / видеоуроков»;
  - `it('состав дня 1')` — `daySummaryLine(день 1) === '2 видеоурока · 8:42 · тест · 6 шагов практики'`;
  - `it('состав чернового дня 4')` — `'1 видеоурок · 3:23'`;
  - `it('строка готовности: готов день 1, черновики 2–21 с роликами')` — `readinessLine(getDays())` = «Полностью готов день 1; в днях 2–21 уже есть цель и видеоуроки, остальное появляется по мере готовности.»;
  - `it('строка готовности: готовы дни 1–3 и 5, черновик 4 без роликов')` — на фикстуре: «Полностью готовы дни 1–3, 5; в дне 4 уже есть цель, остальное появляется по мере готовности.»;
  - `it('строка готовности: все готовы')` → «Все дни курса готовы полностью.»
- [ ] **Step 2:** `npx vitest run src/course/summary.test.ts` — FAIL.
- [ ] **Step 3:** Реализовать. Диапазоны — подряд идущие номера через «–», группы через «, »; «готов день N» / «готовы дни …»; «в дне N» / «в днях …»; «цель и видеоуроки», если у каждого черновика `dayVideoSummary(day).count > 0`, иначе «цель».
- [ ] **Step 4:** Тот же запуск — PASS; `npm test`, `npx tsc -b`, `npm run lint` — PASS.
- [ ] **Step 5:** Коммит `course: состав дня, обложка ролика, строка готовности`.

### Task 5: Иллюстрации и значки

**Files:**
- Create: `course/src/components/illustrations.tsx`, `course/src/components/icons.tsx`
- Test: `course/src/components/illustrations.test.tsx`

**Interfaces:**
- Produces:
  - `Coach`, `Student`, `Agent` — `({ size?: number; className?: string }) => JSX` — плоские SVG-фигуры как на макете (голова-круг с глазами и улыбкой, тело-«колокол»; у тренера свисток, у агента квадратная голова с антенной); `size` — высота в px (по умолчанию 112), `aria-hidden="true"`, цвета — `var(--cover-ink)`, `var(--accent)`, `var(--cover-add)`, `var(--cover-soft)`, `var(--cover-del)`, `var(--cover-bg)`;
  - значки `IconArrow`, `IconPlay`, `IconPause`, `IconBook`, `IconCheck`, `IconExpand`, `IconVideo`, `IconSteps` (`({ size?: number }) => JSX`, по умолчанию 18, линейные 24×24 `stroke="currentColor"`, `aria-hidden="true"`).

- [ ] **Step 1: Тесты:** `it('иллюстрации скрыты от чтения с экрана и масштабируются')` — у `Coach`, `Student`, `Agent` корневой `svg` с `aria-hidden="true"` и `height` = `size`; `it('значки берут цвет текста')` — у каждого значка `stroke="currentColor"` или `fill="currentColor"`, `aria-hidden="true"`.
- [ ] **Step 2:** `npx vitest run src/components/illustrations.test.tsx` — FAIL.
- [ ] **Step 3:** Реализовать.
- [ ] **Step 4:** PASS; `npm test`, `npx tsc -b`, `npm run lint` — PASS.
- [ ] **Step 5:** Коммит `course: иллюстрации героев и значки`.

### Task 6: Обложка главной, «Продолжить», «Как проходит день»

**Files:**
- Create: `course/src/home/SiteBar.tsx`, `course/src/home/HomeCover.tsx`, `course/src/home/ContinueCard.tsx`, `course/src/home/DaySteps.tsx`, `course/src/home/scroll.ts`
- Modify: `course/src/styles/home.css`
- Test: `course/src/home/home.test.tsx`

**Interfaces:**
- Consumes: `currentDay`, `daySummaryLine`, `plural`, `Coach`, `Student`, `Agent`, значки, `RouteLink`, `getDays`, `catalog` (число роликов — `Object.keys(catalog).length`).
- Produces:
  - `scrollToId(id: string): void` — `document.getElementById(id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })`;
  - `SiteBar()` — знак «В», «Вайб-курс»; кнопка «Карта» (`scrollToId('map')`); ссылка «Книга» `href="book.html"` `target="_blank"` `rel="noopener"`;
  - `HomeCover({ cta: { label: string; to: string } })` — разметка и тексты §3 п. 2 спецификации дословно; главная кнопка — `RouteLink` с `cta`; «Как устроен курс» — кнопка `scrollToId('how')`; строка фактов «21 день · 3 недели», «N видеоуроков», «Практика в Claude Code», «Наставник в Claude Code»;
  - `ContinueCard({ state: ReturnType<typeof currentDay>; day: Day; streak: number })` — `section` с `aria-label="Продолжить обучение"`; кольцо (`conic-gradient` по `doneCount / 21`) с процентом; кикер «Вы остановились здесь · пройдено K из 21» / «С чего начать»; заголовок «День N · тема»; строка `daySummaryLine(day)`; «S дней подряд» (`plural`) при S > 0; кнопка «Продолжить» / «Начать» — `RouteLink` на `#/day/N`; при `allDone` — «Курс пройден» и кнопка «К карте» (`scrollToId('map')`);
  - `DaySteps()` — `section id="how"`, заголовок «Как проходит день», четыре шага: «Видеоурок» — «короткий ролик с пояснениями по нажатию»; «Теория и тест» — «мысли из книги, схемы, тренажёры и проверка понимания»; «Практика в Claude Code» — «готовые запросы: копируете и делаете шаг за шагом»; «Наставник проверяет» — «команда /mentor сверяет сделанное в вашем проекте».

- [ ] **Step 1: Тесты** (обёртка — `CourseProgressContext.Provider` с заданным прогрессом, как в существующих тестах блоков):
  - `it('новичок: кнопка «Начать день 1» и карточка «С чего начать»')` — у обложки ссылка с именем «Начать день 1» и `href="#/day/1"`; в «Продолжить обучение» — «С чего начать», «День 1 · Азбука и знакомство с моделями», «2 видеоурока · 8:42 · тест · 6 шагов практики», кольцо «0%»;
  - `it('вернувшийся: «Продолжить день 2», пройдено 1 из 21, серия')` — день 1 пройден, серия 3 → «Продолжить день 2», «пройдено 1 из 21», «5%», «3 дня подряд»;
  - `it('всё пройдено: «Курс пройден»')`;
  - `it('книга открывается в новой вкладке')` — ссылка «Книга»: `href="book.html"`, `target="_blank"`;
  - `it('факты обложки: 27 видеоуроков')`;
  - `it('«Как устроен курс» прокручивает к шагам, адрес не меняется')` — шпион на `Element.prototype.scrollIntoView`, клик по кнопке → вызван, `window.location.hash` не изменился.
- [ ] **Step 2:** `npx vitest run src/home` — FAIL.
- [ ] **Step 3:** Реализовать компоненты и их стили в `home.css` по макету «А · Обложка книги»: обложка `--cover-bg` во всю ширину, внутри контейнер `--content`; заголовок 76 px / на ≤ 640 px 40 px; диф — `pre` JetBrains Mono 15 px, «−» `--cover-del`, «+» `--cover-add`, заголовок дифа `--cover-soft`; на ≤ 640 px диф под текстом, герои 72 px; «Продолжить» — `.paper` с `--shadow-raised`, `margin-top: -28px`, кнопка `.btn-primary`; шаги — сетка `repeat(auto-fit, minmax(220px, 1fr))`.
- [ ] **Step 4:** `npx vitest run src/home` — PASS; `npm test`, `npx tsc -b`, `npm run lint` — PASS.
- [ ] **Step 5:** Коммит `course: обложка главной, «Продолжить» и шаги дня`.

### Task 7: Карта-путь и сборка главной

**Files:**
- Create: `course/src/home/RouteMap.tsx`
- Modify: `course/src/pages/MapPage.tsx`, `course/src/styles/home.css`, `course/src/App.tsx`, `course/src/App.test.tsx`, `course/e2e/navigation.spec.ts`, `course/e2e/smoke.spec.ts`, `course/e2e/day-01.spec.ts`
- Test: `course/src/home/RouteMap.test.tsx`

**Interfaces:**
- Consumes: `getWeeks`, `getDays`, `dayStatus`, `currentDay`, `dayVideoSummary`, `readinessLine`, `plural`, Task 6 компоненты.
- Produces: `RouteMap({ progress: Progress })` — `section id="map"`: кикер «Карта курса», `h2` «Путь от идеи до запуска», легенда «пройден / сейчас / впереди», `p` со строкой `readinessLine(getDays())`, три недели (`h3` с названием, номер «01/02/03», «Неделя N», итог), в каждой — `ol` из 7 строк: `RouteLink` (`testId="day-card"`, `href="#/day/N"`) с точкой пути, «День N», темой, значком ролика и «K ролик(а/ов)» (`plural(k, 'ролик', 'ролика', 'роликов')`), меткой «пройден» (`done`) или «сейчас» (день `currentDay(...).n`, если не `allDone`). Меток «готовится» нет. `MapPage` = обложка (`SiteBar` внутри) → `ContinueCard` → `DaySteps` → `RouteMap`; `App` убирает обёртку `.shell` для главной (обложка во всю ширину), страница дня сохраняет свою.

- [ ] **Step 1: Тесты `RouteMap`:** `it('21 день по трём неделям, без «готовится»')` — 21 `day-card`, три `h3` с названиями недель, нет текста «готовится»; `it('отметки пути: пройден, сейчас, впереди')` — день 1 пройден → у строки 1 «пройден», у строки 2 «сейчас»; `it('дни не по порядку')` — пройден 3, не пройден 2 → у 3 «пройден», у 2 «сейчас» (Review Focus 1); `it('строка готовности над картой')` — текст из `readinessLine`; `it('у дня число роликов')` — у строки 1 «2 ролика», у строки 4 «1 ролик».
- [ ] **Step 2:** `npx vitest run src/home/RouteMap.test.tsx` — FAIL.
- [ ] **Step 3:** Реализовать `RouteMap` и стили по макету (строки дня и карточки главной при наведении поднимаются на 2 px, кольцо «Продолжить» заполняется за 400 мс — без анимации при `prefers-reduced-motion`): неделя — `.paper`, номер 64 px `--accent`; линия пути — 2 px, у пройденных `--accent`, иначе `--rule`; точка 22 px: пройден — заливка `--accent`, сейчас — кольцо 5 px и подсвеченная строка (`--tint`), впереди — рамка 2 px `--fig-line`; на ≤ 640 px название недели над днями, строка дня переносится. Собрать `MapPage`, поправить `App`.
- [ ] **Step 4: Обновить тесты страницы:** `App.test.tsx` — `h1` «Своё приложение с ИИ за 21 день»; `smoke.spec.ts` — тот же `h1`, размеры 1440 × 900, 390 × 844 и 320 × 640 без прокрутки вбок (Review Focus 2); `navigation.spec.ts` — 21 `day-card`, переход в день 1 и обратно по ссылке «Карта курса» (её даёт Task 8; до неё — проверка `page.goto('/')`); `day-01.spec.ts` — после прохождения дня возврат `page.goto('/')`, у первого `day-card` «пройден», в «Продолжить обучение» — «1 день подряд».
- [ ] **Step 5:** `npm test`, `npx tsc -b`, `npm run lint`, `npm run e2e` — PASS.
- [ ] **Step 6:** Коммит `course: карта-путь и новая главная`.

### Task 8: Каркас страницы дня

**Files:**
- Create: `course/src/day/DayHeader.tsx`, `course/src/day/DayToc.tsx`, `course/src/day/PartHeading.tsx`, `course/src/day/DraftNotice.tsx`, `course/src/day/NextDayCard.tsx`
- Modify: `course/src/pages/DayPage.tsx`, `course/src/styles/day.css`, `course/e2e/navigation.spec.ts`, `course/e2e/day-01.spec.ts`
- Test: `course/src/day/day.test.tsx`

**Interfaces:**
- Consumes: `dayParts`, `partsDone`, `PART_TITLES`, `dayVideoSummary`, `formatDuration`, `plural`, `getWeeks`, `scrollToId`, `Agent`, значки, `RouteLink`, `DAY_COUNT`.
- Produces:
  - `DayHeader({ day: Day })` — шапка §4 п. 1: «← Карта курса» (`RouteLink` `#/`), «←» / «→» (`RouteLink` на соседний день с `aria-label` «Предыдущий день» / «Следующий день»; у дня 1 и 21 — неактивный `span` с `aria-disabled="true"`), «День N из 21»; кикер «День 0N · Неделя W · название недели»; `h1` — тема; цель курсивом; метки «K видеоурока · м:сс», «Теория ≈ T мин», «Практика ≈ P мин», «Тест · Q вопросов» — только существующие; плашка «Результат дня» с `Agent`, если `day.result`;
  - `DayToc({ parts: Part[] })` — `nav aria-label="План дня"`: кикер «План дня», полоса и «Сделано X из Y частей» (`partsDone`), список кнопок (`button`, `scrollToId('part-' + id)`), у недоступной — `disabled` и подпись «скоро»; текущая часть — по `IntersectionObserver` на `section[id^="part-"]` (если `IntersectionObserver` нет — подсветки нет);
  - `PartHeading({ part: Part; index: number; extra?: ReactNode })` — номер в квадрате (пройдена — `--fig-ok` с ✓, иначе контур) и `h2`;
  - `DraftNotice({ missing: PartId[] })` — карточка с `Agent`: «Остальное готовится: <названия недостающих частей строчными через запятую и «и»> появятся позже.» (для дня 10 — «Остальное готовится: проверка понимания, практика и наставник появятся позже.»);
  - `NextDayCard({ day: Day })` — «Следующий день · День N+1 · тема», `daySummaryLine` следующего дня, кнопка «Перейти» (`RouteLink`); у дня 21 — «Курс завершён» и «К карте».
  - `DayPage` — `DayHeader` → двухколоночная обёртка (`DayToc` + `main`) → секции `id="part-<id>"` только для доступных частей → `DraftNotice` (если есть недоступные) → `NextDayCard`. Отдельных «Скоро» нет. Прежняя `Nav` удаляется.

- [ ] **Step 1: Тесты** (провайдер прогресса как в Task 6):
  - `it('шапка дня 1: тема, цель, метки и результат')` — `h1` «Азбука и знакомство с моделями», «2 видеоурока · 8:42», «Теория ≈ 40 мин», «Практика ≈ 80 мин», «Тест · 6 вопросов», «Результат дня»;
  - `it('у дня 1 нет «Предыдущего дня», у дня 21 нет «Следующего»')` — `aria-disabled`;
  - `it('план дня: шесть пунктов, «Сделано 0 из 5 частей»')`;
  - `it('черновой день 10: одна карточка «Остальное готовится», без «Скоро»')` — текст DraftNotice дословно, `queryByText('Скоро')` → `null`, в плане «Проверка понимания», «Практика», «Наставник» — `disabled` с «скоро» (Review Focus 3);
  - `it('пункт плана прокручивает к части, адрес не меняется')`;
  - `it('пункты плана доступны с клавиатуры')` — у доступных пунктов `button` без `tabindex="-1"` (Review Focus 5);
  - `it('следующий день и конец курса')` — у дня 1 «День 2 · Эталоны и спецификация» и «Перейти»; у дня 21 «Курс завершён».
- [ ] **Step 2:** `npx vitest run src/day` — FAIL.
- [ ] **Step 3:** Реализовать и сверстать по макетам «А · Страница дня» и «А · День на телефоне»: шапка `--cover-bg`, `h1` 60 / 36 px; колонка плана 240 px слева и `position: sticky; top: 16px` при > 960 px; при ≤ 960 px — полоса кнопок-«таблеток» `position: sticky; top: 0`, `overflow-x: auto` внутри себя; номер части 40 px, `h2` 32 / 26 px; «Следующий день» — `--cover-bg`, `--radius-xl`.
- [ ] **Step 4: Сквозные тесты:** в `navigation.spec.ts` и `day-01.spec.ts` возврат на карту — ссылкой «Карта курса»; добавить `it('план дня прокручивает к практике')` — клик «Практика» в «План дня» → секция `#part-practice` в видимой области, адрес остаётся `#/day/1`.
- [ ] **Step 5:** `npm test`, `npx tsc -b`, `npm run lint`, `npm run e2e` — PASS.
- [ ] **Step 6:** Коммит `course: каркас страницы дня — шапка, план, черновики, следующий день`.

### Task 9: Блоки теории

**Files:**
- Modify: `course/src/components/BlockView.tsx`, `course/src/blocks/IdeaBlock.tsx`, `course/src/blocks/DiagramBlock.tsx`, `course/src/blocks/Scenario.tsx`, `course/src/blocks/AiHelper.tsx`, `course/src/blocks/trainers/PromptBuilder.tsx`, `course/src/blocks/trainers/FindTheBug.tsx`, `course/src/blocks/trainers/SortTrainer.tsx`, `course/src/components/BookLink.tsx`, `course/src/pages/DayPage.tsx`, `course/src/styles/blocks.css`
- Test: `course/src/blocks/theory.test.tsx`

**Interfaces:**
- Consumes: `IconBook`.
- Produces: `BlockView({ block, dayId, ideaIndex?: { i: number; n: number } })` — `DayPage` передаёт номер мысли среди блоков `idea` дня; `IdeaBlock({ block, index? })` — кикер «Мысль i из n», `h3`, абзацы Literata 18 px (ширина ≤ 40 em), `BookLink` — кнопка-ссылка со значком книги «В книге: …»; у схемы, тренажёров, ситуации и помощника ИИ — карточка `.paper` и кикер «Схема», «Тренажёр», «Ситуация», «Спросите ИИ». Заголовки блоков (`h3`) и роли кнопок не меняются — сквозные тесты дня 1 находят блоки по ним.

- [ ] **Step 1: Тесты:** `it('мысль: кикер «Мысль 1 из 6» и ссылка в книгу со значком')` (день 1, первый блок `idea`); `it('тренажёр, ситуация и помощник ИИ подписаны кикером')`; `it('у схемы прежние зоны-кнопки')` — кнопки с названиями зон из дня 1 на месте.
- [ ] **Step 2:** `npx vitest run src/blocks/theory.test.tsx` — FAIL.
- [ ] **Step 3:** Реализовать и сверстать по макету «А · Страница дня» (карточка мысли — `.paper`, отступы 32 × 36, на телефоне 22 × 18).
- [ ] **Step 4:** `npm test`, `npx tsc -b`, `npm run lint`, `npm run e2e` — PASS (прохождение дня 1 — зелёное).
- [ ] **Step 5:** Коммит `course: новый вид блоков теории`.

### Task 10: Тест, практика, наставник, итог дня

**Files:**
- Modify: `course/src/blocks/Quiz.tsx`, `course/src/blocks/Practice.tsx`, `course/src/blocks/MentorBlock.tsx`, `course/src/blocks/Notes.tsx`, `course/src/blocks/Cards.tsx`, `course/src/components/CopyButton.tsx`, `course/src/styles/blocks.css`
- Test: `course/src/blocks/parts.test.tsx`

**Interfaces:**
- Produces:
  - `Quiz` — над вопросами «Верно: k» (по текущим ответам); каждый вопрос — карточка `.paper` с «Вопрос i из n», текст вопроса 21 px, варианты — кнопки-строки ≥ 52 px с кружком; после ответа — классы `is-correct` / `is-wrong` и пояснение в цветной плашке; `data-testid` `quiz-question`, `quiz-result`, `quiz-best` и тексты «Результат: …», «Лучший результат: …» сохраняются;
  - `Practice` — справа в заголовке части «Сделано a из b шагов» (через `PartHeading` `extra` или внутри блока), шаг — карточка: `input type="checkbox"` 24 px, подпись «Шаг i. название» (доступное имя содержит `step.title`), тёмный блок `--term-bg` с кикером «Запрос для Claude Code» и `CopyButton`, строка «Готово, когда: …» с `IconCheck` цвета `--fig-ok`; пройденный шаг — рамка `--fig-ok`;
  - `MentorBlock` — две карточки рядом (`flex-wrap`): синяя (`--cover-bg`) с пояснением курсивом и командой + `CopyButton` (вариант `tone="cover"`), «бумажная» — «Что он проверит» и «О чём спросит»; ниже переключатель «Наставник принял день»;
  - `CopyButton({ text, tone?: 'term' | 'cover' })` — кнопка ≥ 44 px в цветах тёмного или синего блока;
  - `Cards` — сетка `repeat(auto-fill, minmax(200px, 1fr))`; карточка — `.paper`, термин-кнопка, определение по нажатию, внизу две кнопки «Знаю» / «Повторить» по `flex: 1 1 0` внутри рамки карточки;
  - `Notes` — поле на «бумаге».

- [ ] **Step 1: Тесты:**
  - `it('тест: «Вопрос 1 из 6» и счёт «Верно: 1» после верного ответа')`;
  - `it('практика: «Шаг 1. …», «Запрос для Claude Code», «Готово, когда:», счёт шагов')`;
  - `it('наставник: команда /mentor 1 с кнопкой «Скопировать»')`;
  - `it('карточки терминов: кнопки «Знаю» и «Повторить» внутри своей карточки')` — для каждой карточки `within(card).getAllByRole('button')` содержит обе кнопки, а у кнопок стиль `flex: 1 1 0` (проверка класса `card-action`).
- [ ] **Step 2:** `npx vitest run src/blocks/parts.test.tsx` — FAIL.
- [ ] **Step 3:** Реализовать и сверстать по макету.
- [ ] **Step 4:** `npm test`, `npx tsc -b`, `npm run lint`, `npm run e2e` — PASS (`quiz.spec.ts`, `day-01.spec.ts` — зелёные).
- [ ] **Step 5:** Коммит `course: новый вид теста, практики, наставника и итога дня`.

### Task 11: Плеер роликов

**Files:**
- Create: `course/src/video/VideoCover.tsx`, `course/src/video/VideoControls.tsx`
- Modify: `course/src/video/VideoBlock.tsx`, `course/src/video/HotspotLayer.tsx`, `course/src/styles/video.css`, `course/src/video/VideoBlock.test.tsx`, `course/e2e/video.spec.ts`, `course/src/pages/DayPage.tsx` (подряд идущие блоки `video` теории — в обёртке `.video-grid`: два в ряд при > 960 px, один — уже; каждому ролику — его номер `index` среди роликов дня)
- Test: `course/src/video/VideoBlock.test.tsx` (новые случаи)

**Interfaces:**
- Consumes: `videoMeta`, `formatDuration`, значки `IconPlay`, `IconPause`, `IconExpand`, `scrollToId` не нужен — «Дальше» прокручивает к следующему элементу после `figure` (`nextElementSibling ?? closest('section').nextElementSibling`).
- Produces:
  - `VideoBlock({ videoId, title, index?: number })` — `index` — номер ролика среди роликов дня (подпись «Видеоурок i»); состояния `cover` (до первого запуска) → `playing` / `paused` → `ended`; `Player` получает `initialFrame={videoMeta(videoId).posterFrame}`; при первом запуске — `seekTo(0)` и `play()`;
  - `VideoCover({ title: string; label: string; duration: string; onPlay(): void })` — поверх кадра: затемнение снизу, кнопка ▶ 76 / 64 px с `aria-label={`Смотреть ролик «${title}»`}`, «Видеоурок i» слева внизу, длительность справа внизу;
  - `VideoControls({ playing, frame, duration, fps, voice, voiceOn, onToggle, onSeek, onVoice, onFullscreen? })` — кнопка со значком и `aria-label` «Смотреть» / «Пауза», ползунок `aria-label="Перемотка"`, время `data-testid="video-time"`, «Голос», кнопка «Во весь экран» только если `document.fullscreenEnabled`;
  - под кадром — название ролика и строка «м:сс · N пояснений по нажатию» (`plural(n, 'пояснение', 'пояснения', 'пояснений')`), «Скачать MP4» — маленькой кнопкой.
  - `HotspotLayer` показывается только когда ролик хоть раз запускали и стоит на паузе.
  - В конце (`ended`) поверх кадра — «Смотреть ещё раз» (`seekTo(0)`, `play()`) и «Дальше» (прокрутка к следующему материалу).

- [ ] **Step 1: Тесты** (подменённый `Player` из существующего теста дополнить: запоминать `initialFrame` из пропсов, `play`, события `ended`):
  - `it('до запуска — обложка на кадре первой горячей точки, рамок точек нет')` — `initialFrame === pilotRlsScript.hotspots[0].from`, есть кнопка «Смотреть ролик «Ролик»», нет кнопок с названиями зон;
  - `it('нажатие на обложку запускает ролик с начала')` — `seekTo(0)` и `play` вызваны, обложки нет;
  - `it('после конца — «Смотреть ещё раз» и «Дальше»')` — `emit('ended')`;
  - `it('строка под роликом: длительность и число пояснений')` — «3:23 · N пояснений по нажатию» для пилота;
  - прежние случаи («Ролик не загрузился» без кнопок «Смотреть», пауза чужого ролика, «Ролик готовится») — остаются зелёными; в случае отказа загрузки нет и обложки (Review Focus 4).
- [ ] **Step 2:** `npx vitest run src/video/VideoBlock.test.tsx` — новые случаи FAIL.
- [ ] **Step 3:** Реализовать и сверстать по макету: кадр `--radius-l`, `--shadow-raised`; затемнение `linear-gradient(180deg, transparent 40%, color-mix(in srgb, var(--cover-bg) 55%, transparent))`; кнопка ▶ — круг `--cover-ink`, значок `--cover-bg`; панель — кнопки 44 px, ползунок `accent-color: var(--accent)`; полноэкранный режим — `stageRef.current.requestFullscreen()`, выход — `document.exitFullscreen()`; при `prefers-reduced-motion` пульсация рамок выключена (как сейчас).
- [ ] **Step 4: Сквозные тесты** `video.spec.ts`: кнопки панели искать с `exact: true` (`{ name: 'Смотреть', exact: true }`, `{ name: 'Пауза', exact: true }`); первый тест — запуск через обложку «Смотреть ролик «Почему тренер не увидит чужих подопечных»»; на дне 1 — две обложки, две кнопки панели; добавить `it('до запуска ролик не пустой: видна обложка с кнопкой ▶')`.
- [ ] **Step 5:** `npm test`, `npx tsc -b`, `npm run lint`, `npm run e2e` — PASS.
- [ ] **Step 6:** Коммит `course: плеер с обложкой, новой панелью и экраном в конце`.

### Task 12: Проверка вида и публикация

**Files:**
- Modify: по находкам проверки — стили `course/src/styles/*.css` и разметка компонентов из задач 6–11; `course/README.md` (строка о внешнем виде и макетах)

**Interfaces:**
- Consumes: всё выше; `npm run build:artifact`.

- [ ] **Step 1: Скриншоты.** Скриптом Playwright во временной папке вне репозитория (сборка `npm run build`, `npx vite preview --port 4180`): главная, день 1 (верх, теория, практика), день 4 (ролик до запуска), день 10 (черновик) — на 1440 × 900, 390 × 844, 320 × 640 и в тёмной теме (`colorScheme: 'dark'`), плюс главная при `reducedMotion: 'reduce'`.
- [ ] **Step 2: Сверка** с макетами «А · Обложка книги», «А · Страница дня», «А · День на телефоне»: ничего не вылезает за рамки, нет пустых прямоугольников, текст не мельче 13 px, на телефоне нет прокрутки вбок; найденное исправить, повторить Step 1.
- [ ] **Step 3:** `npm test`, `npx tsc -b`, `npm run lint`, `npm run e2e` — PASS.
- [ ] **Step 4:** `npm run build:artifact`; опубликовать `out/artifact/page.html` на адрес курса https://claude.ai/artifact/DQS4Yzu177UmpDCoXDuYJ4 (новые `assets/*` и `book.html` в `files`, исчезнувшие `assets/*` — `null`; возможности страницы не менять).
- [ ] **Step 5:** README — строка: вид курса описан в `docs/superpowers/specs/2026-10-23-course-look-design.md`, макеты — ссылка. Коммит `course: новый вид курса — проверка и публикация`.

## Отличия плана от спецификации

- §4 п. 11 («`#/day/99` — «День не найден»»): маршрут `#/day/99` по-прежнему открывает карту (`router.test.ts` закрепляет это поведение с фазы 1); «День не найден» показывается, только если номер 1–21, а файла дня нет.
- §4 п. 4 («под роликом … строка «о чём»»): в данных роликов нет описания «о чём», поэтому строка под роликом — «м:сс · N пояснений по нажатию» (длительность и число горячих точек из сценария).
