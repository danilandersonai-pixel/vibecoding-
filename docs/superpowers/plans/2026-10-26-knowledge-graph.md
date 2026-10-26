# Граф знаний курса и книги — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Экран «Граф знаний» внутри курса: весь учебный материал (части, главы, разделы, схемы книги, термины словаря, недели, дни, видеоуроки) — узлами со связями, с поиском узла, фильтрами по типам, карточкой узла и переходами в книгу и в курс.

**Architecture:** Скрипт сборки `course/scripts/build-graph.mjs` собирает узлы, связи и раскладку из книги, словаря, индекса книги и дней в `course/content/graph.json`. Курс получает маршрут `#/graph[/<id>]` и лениво загружаемый экран (`React.lazy` + `import()` данных): рисунок — Sigma.js поверх graphology, карточка/поиск/фильтры — обычные React-компоненты, логика — чистые функции модели.

**Tech Stack:** React 19 + TypeScript, Vite 8, Vitest + Testing Library, Playwright; `sigma@3.0.3`, `graphology@0.26.0` (приложение), `d3-force@3.0.0` (только скрипт, devDependency).

**Spec:** `docs/superpowers/specs/2026-10-26-knowledge-graph-design.md` — тексты интерфейса, таблицы узлов (§2) и связей (§3) — оттуда дословно.

## Global Constraints

- Тексты интерфейса — по-русски, дословно из спецификации §5; подписи групп карточки — из таблицы §3.
- Цвета, скругления, тени — только переменные `course/src/styles/tokens.css`; цвета узлов — §5 («Части и главы — `--cover-bg`; разделы — `--ink-soft`; схемы — `--fig-line`; термины — `--accent`; недели и дни — `--fig-ok`; видеоуроки — `--warn`»).
- Нажимаемое ≥ 44 × 44 px; текст ≥ 13 px; видимая рамка фокуса; 320 px — без прокрутки вбок; тёмная тема; `prefers-reduced-motion` — без анимации камеры.
- Экран графа, `sigma`/`graphology` и `graph.json` — отдельные куски сборки (`React.lazy`, `import()`), не в `index-*.js`; `graph.json` ≤ 500 КБ.
- Версии зависимостей точно: `sigma@3.0.3`, `graphology@0.26.0`, `d3-force@3.0.0` (dev).
- Никакого `dangerouslySetInnerHTML` для текстов узлов (схема — через существующий `Figure`).
- Прокрутка/переходы — `navigate()` из `course/src/router.ts`, `goToResult()` из `course/src/search/goTo.ts`, `scrollBehavior()` из `course/src/home/scroll.ts`.
- TDD; перед коммитом в `course/`: `npm test`, `npx tsc -b`, `npm run lint`; у задач с e2e — `npm run e2e` (Playwright настроен, браузер в /opt/pw-browsers, никогда не запускать `playwright install`). Коммиты с трейлерами `Co-Authored-By` и `Claude-Session`.

## Review Focus

1. Термин с сокращением в скобках и короткие слова: «Политики доступа к строкам (RLS)» связан с разделом про RLS (s43), а «Код» не связывается с текстом, где есть только «кодинг»/«кодовая» (Task 2).
2. Граф открыт сразу по адресу `#/graph/term:<n>` (холодная загрузка) — выбран этот узел, открыта его карточка; адрес с несуществующим или битым id (`#/graph/%E0%A4%A`) — общий вид без ошибок (Task 5).
3. Нет WebGL — вместо рисунка сообщение, поиск узла и карточки со связями работают (Task 5).
4. Смена темы при открытом графе — цвета узлов перечитываются из переменных (Task 5).
5. Телефон 320 px: карточка-панель с длинным названием раздела и «Показать все» не вылезает вбок, закрывается «Закрыть» (Task 5, e2e).

---

### Task 1: Сборка графа — узлы и связи строения

**Files:**
- Create: `course/scripts/build-graph.mjs`, `course/scripts/build-graph.test.ts`

**Interfaces:**
- Consumes: `readBook(html)` из `course/scripts/extract-book.mjs` (экспорт уже есть).
- Produces (экспорты `build-graph.mjs`, JS без типов — в тестах как в `extract-book.test.ts`):
  - `buildNodes({ book, glossary, bookIndex, weeks, days }) → GraphNode[]`, где `GraphNode = { id, type, label, text, book?, day?, video?, figure? }` (без `x, y, size` — их добавит Task 2), `type ∈ 'part' | 'chapter' | 'section' | 'figure' | 'term' | 'week' | 'day' | 'video'`;
  - `structureEdges({ book, glossary, weeks, days }) → GraphEdge[]`, `GraphEdge = { s, t, kind, w? }`, виды `part-ch`, `ch-sec`, `sec-fig`, `ch-fig`, `term-ch`, `week-day`, `day-video`, `day-term`, `day-sec`, `day-fig`, `video-ch` (§3);
  - id узлов: `part:I`…`part:IV`, `ch:<id>`, `sec:<id>`, `fig:<n>`, `term:<номер в словаре с 1>`, `week:<n>`, `day:<n>`, `video:<id>`.
  - подписи (`label`): часть — «Часть I · Основы»; глава — `head` («Глава 4 · За пределами 70%»); раздел — текст заголовка `h3` без тегов; схема — `cap`; термин — `term`; неделя — «Неделя 1 · Вся книга и первая работающая версия»; день — «День 3 · <тема>»; видеоурок — название блока `video`.
  - текст (`text`): глава — полный заголовок из `h` без тегов; раздел — первый фрагмент индекса книги с этим якорем, у которого `t !== s`, обрезанный до 240 знаков по границе слова с «…»; термин — определение; неделя — `result`; день — `goal`; видеоурок — «День N · <тема дня>»; часть и схема — `''`.
  - `book`: глава и раздел — свой id; схема — якорь ближайшего раздела (или главы); термин — `refs[0]`. `day` — у дня и видеоурока; `video` — у видеоурока; `figure` — у схемы.

- [ ] **Step 1: Тесты на книге-образце** (объект `{ blocks: [...] }` и маленькие словарь/недели/дни прямо в тесте):
  - `it('узлы всех типов с id, подписями и текстом')` — часть «Часть I · Основы», глава `ch:ch1` с `book: 'ch1'`, раздел `sec:s1` с текстом первого абзаца, схема `fig:x1` с `figure: 'x1'` и `book` раздела, термин `term:1` с определением, неделя, день `day:1` с целью, видеоурок `video:ch-01` с `day: 1`;
  - `it('главы about, design, index и всё в них не входят')`;
  - `it('главы до первой части и после последней главы части — без части')` — нет `part-ch` для `pre`, `abc`, `glossary`, `sources`;
  - `it('связи строения книги')` — `part-ch`, `ch-sec`, `sec-fig`, `ch-fig` (схема до первого раздела главы);
  - `it('связи курса')` — `week-day`, `day-video`, `day-term` (по `cards`, термин находится по названию), `day-sec` (по `bookRef.section`), `day-fig` (по `figure` блоков `diagram`/`idea`), `video-ch` (`ch-04` → `ch:ch4`, `ch-abc` → `ch:abc`; `day-08` и `pilot-rls` — без связи с главой);
  - `it('термин связан с главами из refs, без повторов')`;
  - `it('нет петель и повторов пары и вида')`.
- [ ] **Step 2:** `npx vitest run scripts/build-graph.test.ts` — FAIL (нет модуля).
- [ ] **Step 3:** Реализовать `buildNodes` и `structureEdges` (чтение дней из JSON без Zod: `cards`, `blocks` по умолчанию `[]`).
- [ ] **Step 4:** PASS; `npm test`, `npx tsc -b`, `npm run lint` — PASS.
- [ ] **Step 5:** Коммит `course: граф — узлы и связи строения книги и курса`.

### Task 2: Сборка графа — упоминания терминов, раскладка, файл

**Files:**
- Modify: `course/scripts/build-graph.mjs`, `course/scripts/build-graph.test.ts`, `course/package.json` (скрипт `build:graph`, devDependency `d3-force@3.0.0`)
- Create: `course/content/graph.json` (генерируется)

**Interfaces:**
- Consumes: Task 1.
- Produces:
  - `termVariants(term: string) → string[]` (нормализованные варианты по §3.1);
  - `mentions(variants: string[], normalizedText: string) → boolean` по правилам §3.1 (слово ≤ 4 знаков — целиком; длиннее — начало слова длиной `max(4, длина − 2)`; слова многословного варианта подряд);
  - `mentionEdges({ glossary, bookIndex, chapterOf }) → GraphEdge[]` — `term-term` и `term-text` (вес `w` — число фрагментов; фрагменты введения главы → цель `ch:<id>`);
  - `layout(nodes, edges, seed = 1) → nodes` с `x, y` (округление до 0,1) и `size` (3–14, логарифм от числа связей); `d3-force`: `forceLink`, `forceManyBody`, `forceCenter`, `forceCollide`, `randomSource` с детерминированным генератором от `seed`, 300 шагов;
  - `buildGraph(sources) → { nodes, edges }` и запуск `node scripts/build-graph.mjs <book.html> <contentDir>` → пишет `<contentDir>/graph.json` (компактный JSON); `npm run build:graph` = `node scripts/build-graph.mjs ../vibe-coding-na-praktike-2026-10.html content`.
  - нормализация в скрипте повторяет `course/src/search/normalize.ts` (`normalize`) — тест сверяет на одинаковых входах.

- [ ] **Step 1: Тесты:**
  - `it('варианты термина: без скобок и из скобок')` — `termVariants('Политики доступа к строкам (RLS)')` → `['политики доступа к строкам', 'rls']`;
  - `it('короткие слова — только целиком')` — `mentions(['код'], 'кодинг и кодовая база')` → `false`, `mentions(['код'], 'пишет код')` → `true`; `mentions(['rls'], 'политики rls')` → `true`;
  - `it('длинные слова — по началу')` — `mentions(['агент'], 'два агентов')` → `true`; `mentions(['модель'], 'модели')` → `true`; `mentions(['политики доступа к строкам'], 'политики доступа к строкам базы')` → `true`, а слова не подряд → `false`;
  - `it('нормализация совпадает с поиском курса')` — на 5 строках с «ё», кавычками, тире результат равен `normalize` из `src/search/normalize.ts`;
  - `it('упоминания: термин в определении и в тексте раздела с весом')` — на образце;
  - `it('раскладка повторяется и без NaN')` — два запуска `layout` с одним `seed` равны; все `x, y, size` — конечные числа, `size` в [3, 14];
  - на настоящих данных (`readBook` книги, `content/glossary.json`, `content/book-index.json`, `content/weeks.json`, `content/days`): `it('настоящий граф: число узлов по типам')` — части 4, главы 16, разделы 99, схемы 112, термины 280, недели 3, дни 21, видеоуроки 27; `it('настоящий граф: связи целы')` — у каждой связи оба конца есть, петель и повторов нет; `it('RLS связан с разделом s43')` — есть `term-text` от термина «Политики доступа к строкам (RLS)» к `sec:s43`; `it('«Агент фонового программирования» упоминает «Агент»')`; `it('graph.json совпадает со свежей сборкой')` — `buildGraph(...)` глубоко равен `content/graph.json`; `it('graph.json не больше 500 КБ')`.
- [ ] **Step 2:** `npx vitest run scripts/build-graph.test.ts` — новые случаи FAIL.
- [ ] **Step 3:** `npm install -D d3-force@3.0.0`; реализовать; `npm run build:graph`; проверить `git status` — новый только `content/graph.json`.
- [ ] **Step 4:** PASS; `npm test`, `npx tsc -b`, `npm run lint` — PASS. В отчёте — размер `graph.json` и число связей по видам.
- [ ] **Step 5:** Коммит `course: граф — упоминания терминов, раскладка и graph.json`.

### Task 3: Модель графа и загрузка данных

**Files:**
- Create: `course/src/graph/model.ts`, `course/src/graph/load.ts`, `course/src/graph/model.test.ts`

**Interfaces:**
- Consumes: формат `graph.json` (Task 2); `normalize`, `queryWords` из `course/src/search/normalize.ts`.
- Produces:
  - типы `NodeType`, `EdgeKind`, `GraphNode` (с `x, y, size`), `GraphEdge`, `GraphData = { nodes; edges }`;
  - `TYPE_ORDER: NodeType[] = ['part', 'chapter', 'section', 'figure', 'term', 'week', 'day', 'video']`; `TYPE_LABEL` — «Часть», «Глава», «Раздел», «Схема», «Термин», «Неделя», «День», «Видеоурок»; `TYPE_FILTER_LABEL` — «Части», «Главы», «Разделы», «Схемы», «Термины», «Недели», «Дни», «Видеоуроки»;
  - `GROUP_TITLES: Record<EdgeKind, { out: string; in: string }>` — подписи §3 (у «откуда» / у «куда»; для `sec-fig` — «Схемы» / «Раздел», `ch-fig` — «Схемы» / «Глава»);
  - `type GraphIndex = { nodes: GraphNode[]; byId: Map<string, GraphNode>; edges: GraphEdge[]; counts: Record<NodeType, number> }`, `indexGraph(data: GraphData): GraphIndex`;
  - `type NeighborGroup = { kind: EdgeKind; title: string; items: { node: GraphNode; w?: number }[] }`, `neighborGroups(index, id): NeighborGroup[]` — группы в порядке строк таблицы §3, в строке сначала «откуда», потом «куда»; `term-text` — по убыванию `w`, затем по подписи; остальные — в порядке узлов в данных;
  - `findNodes(index, query, limit = 8): GraphNode[]` — по `label`: точное совпадение → начало → все слова в подписи; при равенстве — по `TYPE_ORDER`, затем порядок данных; запрос короче 2 знаков → `[]`;
  - `nodeActions(node): { book?: string; day?: number; videoDay?: number }` — книга у раздела/главы/схемы/термина с `book`; день у дня; ролик — день видеоурока;
  - `load.ts`: `useGraph(): { status: 'loading' | 'ready' | 'failed'; index?: GraphIndex }` — одно хранилище на приложение (`useSyncExternalStore`), данные через `import('../../content/graph.json')`.

- [ ] **Step 1: Тесты** (на маленьком `GraphData` в тесте и на настоящем `content/graph.json`):
  - `it('группы карточки в порядке таблицы и с подписями')` — у термина: «Объясняется в главе», «Упоминает термины», «Упоминается в терминах», «Встречается в тексте», «В курсе»; у главы: «Часть», «Разделы», «Схемы», «Термины главы», «Термины в тексте», «Видеоуроки по главе»;
  - `it('«Встречается в тексте» — по числу упоминаний')`;
  - `it('поиск узла: точное, начало, слова; ё и регистр')` — `findNodes(idx, 'АГЕНТ')[0].label === 'Агент'`; `findNodes(idx, 'а')` → `[]`;
  - `it('действия узла')` — раздел → `book`, день → `day`, видеоурок → `videoDay`, часть → `{}`;
  - `it('загрузка: ready и failed')` — с подменённым `import`.
- [ ] **Step 2:** `npx vitest run src/graph` — FAIL.
- [ ] **Step 3:** Реализовать.
- [ ] **Step 4:** PASS; `npm test`, `npx tsc -b`, `npm run lint` — PASS.
- [ ] **Step 5:** Коммит `course: граф — модель, группы связей и загрузка`.

### Task 4: Карточка узла, поиск узла, фильтры

**Files:**
- Create: `course/src/graph/NodeCard.tsx`, `course/src/graph/NodeSearch.tsx`, `course/src/graph/TypeFilters.tsx`, `course/src/styles/graph.css`, `course/src/graph/parts.test.tsx`
- Modify: `course/src/main.tsx` (подключить `graph.css`)

**Interfaces:**
- Consumes: Task 3; `Figure` из `course/src/components/Figure.tsx`; `navigate`; `goToResult`; значки `course/src/components/icons.tsx`.
- Produces:
  - `NodeCard({ index, id, onSelect(id: string) })` — `aside aria-label="Узел графа"`; без `id` — «Выберите узел на графе или найдите его поиском»; кикер `TYPE_LABEL`, `h2` подпись, текст, у схемы — `Figure`; группы `h3` + кнопки-узлы (у `term-text` — «· N»), первые 8 и «Показать все N»; действия «Открыть в книге» (`book.html#<book>`, новая вкладка), «Открыть день» (`navigate('#/day/N')`), «Смотреть ролик» (`goToResult({ day, anchor: 'part-theory' })`);
  - `NodeSearch({ index, onSelect })` — `input type="search"`, доступное имя «Найти на графе», подсказка «Термин, глава, день…»; до 8 вариантов (`role="listbox"`, варианты `role="option"`: подпись и тип); ↑/↓/Enter выбирают, Esc очищает; «Ничего не нашлось» при пустой выдаче;
  - `TypeFilters({ counts, hidden: ReadonlySet<NodeType>, onToggle(type) })` — кнопки «Термины 280» и т. п. с `aria-pressed` (нажата = тип показан) и цветной точкой типа.

- [ ] **Step 1: Тесты:** `it('карточка термина: определение, группы, книга')`; `it('«Показать все N» раскрывает группу')`; `it('кнопка-узел выбирает соседа')`; `it('действия: день и ролик ведут в курс')` — адрес `#/day/N`, `goToResult` вызван с `part-theory`; `it('пустая карточка — подсказка')`; `it('поиск узла с клавиатуры')` — «агент», ↓, Enter → `onSelect('term:…')`; `it('фильтры: aria-pressed и переключение')`.
- [ ] **Step 2:** `npx vitest run src/graph` — новые случаи FAIL.
- [ ] **Step 3:** Реализовать и сверстать (карточка — `.paper`, `--radius-xl`; группы — список кнопок ≥ 44 px, длинные подписи переносятся).
- [ ] **Step 4:** PASS; `npm test`, `npx tsc -b`, `npm run lint` — PASS.
- [ ] **Step 5:** Коммит `course: граф — карточка узла, поиск и фильтры`.

### Task 5: Рисунок, экран графа, маршрут и входы

**Files:**
- Create: `course/src/graph/GraphCanvas.tsx`, `course/src/graph/GraphPage.tsx`, `course/src/graph/GraphButton.tsx`, `course/src/graph/page.test.tsx`, `course/e2e/graph.spec.ts`
- Modify: `course/package.json` (`sigma@3.0.3`, `graphology@0.26.0`), `course/src/router.ts` (+ `router.test.ts`), `course/src/App.tsx`, `course/src/home/SiteBar.tsx`, `course/src/day/DayHeader.tsx`, `course/src/search/courseIndex.ts` (`TermEntry.graphId`), `course/src/search/SearchDialog.tsx` (ссылка «На графе»), `course/src/components/icons.tsx` (`IconGraph`), `course/src/styles/graph.css`

**Interfaces:**
- Consumes: Tasks 3–4.
- Produces:
  - `Route` += `{ name: 'graph'; node?: string }`; `parseRoute('#/graph')` → `{ name: 'graph' }`, `'#/graph/term%3A12'` → `{ name: 'graph', node: 'term:12' }`, битая кодировка → `{ name: 'graph' }`;
  - `GraphCanvas({ index, selected: string | null, hidden: ReadonlySet<NodeType>, onSelect(id: string | null): void, onUnsupported(): void })` — Sigma 3 + graphology: координаты и размеры из данных, цвета из переменных темы (перечитываются при смене `prefers-color-scheme` и атрибута `data-theme`), подписи — у крупных узлов, остальные при приближении (`labelRenderedSizeThreshold`), подсветка соседей выбранного через `nodeReducer`/`edgeReducer`, скрытые типы, камера к узлу (`animate`, без анимации при reduced-motion), `clickNode`/`clickStage`; нет WebGL (ошибка создания Sigma или нет контекста `webgl`) — `onUnsupported()`;
  - `GraphPage({ node?: string })` — разметка §5 (компьютер/телефон), «← Курс» (`navigate('#/')`), `h1` «Граф знаний», `NodeSearch`, `TypeFilters`, `GraphCanvas`, `NodeCard`; выбор узла → `history.replaceState` на `#/graph/<id>`; состояния: «Загружаю граф…», «Граф сейчас недоступен» (+ «← Курс»), «Рисунок графа не поддерживается этим браузером — пользуйтесь поиском и карточками»; на ≤ 960 px карточка — нижняя панель с «Закрыть»;
  - `GraphButton({ className })` — «Граф» со значком; на ≤ 640 px подпись скрыта визуально; переход `navigate('#/graph')`;
  - `TermEntry.graphId` (`term:<номер с 1>`) и в окне поиска у термина ссылка-кнопка «На графе» → `navigate('#/graph/' + encodeURIComponent(graphId))`.

- [ ] **Step 1: Тесты** (`page.test.tsx`, `GraphCanvas` подменён; `router.test.ts`):
  - маршрут: три случая выше;
  - `it('холодный вход по #/graph/term:N — выбран узел, карточка открыта')` (Review Focus 2) и `it('неизвестный id — общий вид')`;
  - `it('нет WebGL — сообщение, поиск и карточки работают')` (Review Focus 3);
  - `it('данные не загрузились — «Граф сейчас недоступен»')`;
  - `it('выбор узла меняет адрес без новой записи истории')`;
  - `it('цвета перечитываются при смене темы')` (Review Focus 4; `GraphCanvas` с подменённым `Sigma` и `matchMedia`);
  - `it('кнопка «Граф» в верхней строке главной и в шапке дня')`; `it('«На графе» у термина в поиске')`.
- [ ] **Step 2:** `npx vitest run src/graph src/router.test.ts` — FAIL.
- [ ] **Step 3:** `npm install sigma@3.0.3 graphology@0.26.0`; реализовать; `App` — `React.lazy(() => import('./graph/GraphPage'))` в `Suspense` с «Загружаю граф…».
- [ ] **Step 4: e2e** `graph.spec.ts`: с главной «Граф» → `h1` «Граф знаний»; поиск «Агент» → карточка с определением и «Объясняется в главе»; нажатие на связь — новая карточка и адрес `#/graph/…`; «Открыть день» у дня → `#/day/N`; «Назад» уводит с графа; 390 и 320 px — нет прокрутки вбок, карточка-панель закрывается (Review Focus 5); тёмная тема — экран открывается без ошибок; после сборки `graph`-кусок и данные — отдельные файлы `dist/assets`, не в `index-*.js`.
- [ ] **Step 5:** `npm test`, `npx tsc -b`, `npm run lint`, `npm run e2e` — PASS.
- [ ] **Step 6:** Коммит `course: экран «Граф знаний», маршрут и входы`.

### Task 6: Проверка и публикация

**Files:**
- Modify: `course/README.md` (строка про граф и `npm run build:graph`), по находкам проверки — стили/разметка Tasks 4–5.

- [ ] **Step 1:** Снимки экрана графа (общий вид, выбранный термин, глава, день; 1440 / 390 / 320; светлая и тёмная тема) скриптом во временной папке вне репозитория; сверка по §5: подписи читаются, цвета типов различимы, ничего не вылезает, текст ≥ 13 px, нажимаемое ≥ 44 px.
- [ ] **Step 2:** `npm test`, `npx tsc -b`, `npm run lint`, `npm run e2e` — PASS; `npm run build:artifact`.
- [ ] **Step 3:** README; коммит `course: граф знаний — проверка и публикация`. Публикацию на адрес курса делает контролёр.
