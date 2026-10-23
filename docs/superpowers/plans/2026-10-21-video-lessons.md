# Видеоуроки ко всем главам и занятиям — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 27 объясняющих роликов на Remotion — 13 по главам книги и 14 по практическим дням — на страницах дней курса, с MP4 в хранилище опубликованной страницы.

**Architecture:** Общий набор `course/video/kit/` (сборка сценария с темпом «живее», проверки сценария, сцена с переходами и камерой, герои с позами, живые экраны). Каждый ролик — своя папка `course/video/<id>/` со сценарием, раскладкой, сценами и тестом. Единый каталог `course/video/catalog.ts` перечисляет ролики для Remotion Studio, рендера и сайта; сайт загружает код ролика лениво через `lazyComponent` плеера.

**Tech Stack:** Remotion 4.0.537 (`remotion`, `@remotion/player`, `@remotion/cli`), React 19, TypeScript, Vitest, Playwright 1.56.1.

**Spec:** `docs/superpowers/specs/2026-10-21-video-lessons-design.md` (дополняет `docs/superpowers/specs/2026-10-21-interactive-course-design.md`).

## Global Constraints

- Все пакеты Remotion строго `4.0.537`; кадр 1280×720, 30 кадров/с.
- Темп «живее»: 14 знаков/с, вступление 0,3 с, пауза между репликами 0,25 с, хвост сцены 1 с, реплика не короче 2,2 с; субтитры не быстрее 15 знаков/с.
- Длина: ролик главы 5400–8100 кадров (3–4,5 мин), ролик дня 1800–5400 кадров (1–3 мин).
- Сцен: 5–7 у ролика главы, 3–4 у ролика дня; горячих точек не меньше 2 у главы и не меньше 1 у дня, все внутри кадра.
- Текст в кадре не мельче 18 px; содержимое сцен выше y = 590 (ниже — субтитры).
- Цвета только из `course/video/theme.ts`; шрифт `theme.font`, моноширинный `theme.mono`.
- Герои: тренеры Марина (`theme.accent`) и Дима (`theme.alt`), подопечные Анна (номер 17) и Олег (номер 18), агент — робот-помощник; пример — приложение тренера и подопечного.
- Реплики своими словами, не пересказ книги; каждый факт, цифра и название сверяются с указанными разделами книги `vibe-coding-na-praktike-2026-10.html`.
- Голос — только синтез речи браузера на сайте; MP4 без звука, H.264, `--crf=28`, не больше 20 МБ, браузер рендера `/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`.
- Ролики только в курсе; книга не меняется. Дни 2–21 остаются `status: "draft"`.
- Весь текст интерфейса и роликов — по-русски.

## Review Focus

1. Текст в кадре наезжает на другой текст, обрезан краем или уходит под субтитры — кадр середины каждой сцены просматривается (шаг «кадры» в каждой задаче роликов); `scriptProblems` не ловит вёрстку.
2. Горячая точка не совпадает с объектом, потому что во время её окна двигается камера или объект — окна точек ставятся только на неподвижные отрезки; проверка — отладочный кадр с рамками точек (`showHotspots`) в задаче каждого ролика.
3. Код ролика не загрузился (сеть, ошибка в сцене) — блок показывает «Ролик не загрузился», страница дня не падает; тест в задаче 5.
4. На странице дня два ролика: запуск второго, пока играет первый, — первый встаёт на паузу, голоса не накладываются; тест в задаче 5 и e2e в задаче 14.
5. Ролик открыт на телефоне (390 px) — плеер не вызывает горизонтальной прокрутки страницы; e2e в задаче 6.

---

### Task 1: Сценарий с темпом «живее» и проверки сценария

**Files:**
- Create: `course/video/kit/script.ts`, `course/video/kit/checks.ts`
- Test: `course/video/kit/script.test.ts`, `course/video/kit/checks.test.ts`

**Interfaces:**
- Consumes: `VideoScript`, `Cue`, `VideoHotspot` (`course/video/types.ts`); `totalFrames`, `sceneStart`, `validateScript` (`course/video/lib/timeline.ts`).
- Produces:
  - `PACE = { cps: 14, lead: 0.3, gap: 0.25, tail: 1, minCue: 2.2 }`.
  - `type SceneDef = { id: string; lines: string[] }`.
  - `buildScript(id: string, scenes: SceneDef[], hotspots: (t: Timing) => VideoHotspot[]): Built`, где `Timing = { beat(sceneId: string, i: number): number /* кадр от начала сцены */; abs(sceneId: string, frame: number): number; sceneEnd(sceneId: string): number }` и `Built = Timing & { script: VideoScript; sceneIds: string[] }`. Длительность реплики: `max(minCue, text.length / cps + 0.4)` с; `beat` и `abs` бросают ошибку на неизвестной сцене или реплике.
  - `scriptProblems(script: VideoScript, kind: 'chapter' | 'day'): string[]` — пусто, если всё в порядке; иначе понятные строки: ошибки `validateScript`, длина вне диапазона, число сцен вне 5–7 / 3–4, сцена без реплик, реплика вне своей сцены, реплика быстрее 15 знаков/с, горячих точек меньше нормы, точка вне кадра.

- [ ] **Step 1: Тесты `buildScript`:** две сцены по две реплики → первая реплика начинается на кадре `round(0.3 × 30)`, вторая — через длительность первой плюс `round(0.25 × 30)`; короткая реплика длится не меньше 66 кадров; длина сцены = конец последней реплики + 30 кадров; `beat('нет', 0)` бросает ошибку; горячие точки получают кадры через `abs` и `sceneEnd`.
- [ ] **Step 2: Тесты `scriptProblems`:** правильный ролик дня → `[]`; ролик главы на 5000 кадров → строка про длину; 8 сцен у главы → строка про число сцен; одна горячая точка у главы → строка про точки; точка с `x + w > 1280` → строка про кадр; реплика 40 знаков на 2 с → строка про скорость.
- [ ] **Step 3:** `npx vitest run video/kit` — FAIL (модулей нет).
- [ ] **Step 4:** Реализовать `kit/script.ts` и `kit/checks.ts`.
- [ ] **Step 5:** `npx vitest run video/kit` — PASS; `npx tsc -b` — без ошибок.
- [ ] **Step 6:** Коммит `video: сценарий в темпе «живее» и проверки сценария`.

### Task 2: Сцена, переходы и камера

**Files:**
- Create: `course/video/kit/camera.ts`, `course/video/kit/KitScene.tsx`, `course/video/kit/hooks.ts`, `course/video/kit/parts.tsx`
- Modify: `course/video/pilot-rls/*` (импорты переезжают из `pilot-rls/kit.tsx` и `pilot-rls/hooks.ts`, которые удаляются)
- Test: `course/video/kit/camera.test.ts`

**Interfaces:**
- Produces:
  - `type CameraKey = { at: number; x: number; y: number; zoom: number }` (центр кадра в координатах холста 1280×720 и приближение, 1 — весь кадр).
  - `cameraAt(frame: number, keys: CameraKey[]): { x: number; y: number; zoom: number }` — плавно между ключами (ease in-out), до первого и после последнего — стоит; без ключей — `{ x: 640, y: 360, zoom: 1 }`.
  - `transitionAt(frame: number, duration: number, kind: 'fade' | 'slide' | 'zoom', length = 10): { opacity: number; dx: number; scale: number }` — появление в первые `length` кадров и уход в последние `length`; в середине `{1, 0, 1}`.
  - `<KitScene chip: string; duration: number; transition?: 'fade'|'slide'|'zoom' (по умолчанию 'fade'); camera?: CameraKey[]; children>` — фон `theme.paper`, `<svg viewBox="0 0 1280 720">` с группой, сдвинутой и увеличенной по камере; плашка `chip` вверху слева вне камеры.
  - `kit/hooks.ts`: `useAppear(at, length = 12)`, `usePop(at)`, `useTrack(keys)` — перенесены из пилота без изменений.
  - `kit/parts.tsx`: `Label`, `Arrow`, `Card` — перенесены из `pilot-rls/kit.tsx`; `Arrow` получает `draw?: number` (0–1, стрелка «рисуется»).
- [ ] **Step 1: Тесты:** `cameraAt` на середине между ключами `{at:0,x:640,y:360,zoom:1}` и `{at:30,x:400,y:300,zoom:2}` даёт значения строго между ключами, на кадре 30 и дальше — ровно второй ключ; `transitionAt(0, 300, 'fade').opacity === 0`, `transitionAt(150, 300, 'slide')` → `{opacity:1, dx:0, scale:1}`, `transitionAt(299, 300, 'zoom').opacity < 0.2`.
- [ ] **Step 2:** FAIL. **Step 3:** реализовать; сцены пилота переходят на `KitScene` (переход `'fade'`, без камеры), `kit/hooks.ts` и `kit/parts.tsx`; файлы `pilot-rls/kit.tsx` и `pilot-rls/hooks.ts` удаляются.
- [ ] **Step 4:** `npx vitest run video` — PASS; `npx tsc -b`; `npx oxlint` — без предупреждений.
- [ ] **Step 5:** Коммит `video: сцена с переходами и камерой`.

### Task 3: Герои с позами и агент

**Files:**
- Modify: `course/video/actors/Person.tsx`, `course/video/actors/Coach.tsx`, `course/video/actors/Client.tsx`, `course/video/actors/Hacker.tsx`
- Create: `course/video/actors/Agent.tsx`
- Test: `course/video/actors/Person.test.tsx`

**Interfaces:**
- Produces: `type Pose = 'stand' | 'point' | 'think' | 'cheer' | 'surprised'`; `type Mood = 'neutral' | 'happy' | 'worried'`; `Person({ color, accessory?, pose?: Pose, mood?: Mood })` (по умолчанию `stand`, `neutral`); `Coach`, `Client`, `Hacker` принимают и передают `pose`, `mood`; `Agent(props: ActorProps & { pose?: 'idle' | 'working' | 'done' })` — робот-помощник с подписью по умолчанию «Агент», цвет `theme.accent`.
- [ ] **Step 1: Тесты** (через `renderToStaticMarkup` внутри `<svg>`): разметка `Person` с `pose="point"` отличается от `pose="stand"`; каждая из пяти поз даёт разную разметку; `mood="happy"` и `mood="worried"` дают разные рты; `Person` без `pose` совпадает с `pose="stand"`.
- [ ] **Step 2:** FAIL. **Step 3:** реализовать: руки — отдельные пути, меняющиеся по позе; рот — дуга по настроению; `Agent` — корпус, антенна, экран-лицо, индикатор состояния.
- [ ] **Step 4:** PASS; `npx tsc -b`.
- [ ] **Step 5:** Коммит `video: позы героев и агент`.

### Task 4: Живые экраны и витрина набора

**Files:**
- Create: `course/video/kit/reveal.ts`, `course/video/kit/screens/Terminal.tsx`, `Editor.tsx`, `Diff.tsx`, `AgentChat.tsx`, `Chart.tsx`, `Checklist.tsx`, `Spotlight.tsx` (в `course/video/kit/screens/`), `course/video/KitShowcase.tsx`
- Modify: `course/video/Root.tsx` (композиция `kit-showcase`, 10 с)
- Test: `course/video/kit/reveal.test.ts`

**Interfaces:**
- Produces:
  - `typed(text: string, frame: number, start: number, cps = 30): string` — набранная к кадру часть строки (`cps` — знаков в секунду, 30 кадров/с).
  - `revealCount(frame: number, start: number, every: number, total: number): number` — сколько элементов уже показано (0…total).
  - `grow(frame: number, start: number, length: number): number` — 0…1 с плавностью.
  - Экраны (все принимают `x, y, w` и кадр начала `at`): `Terminal({ lines: { text: string; kind: 'cmd' | 'out' | 'ok' | 'err' }[] })` — команды набираются, вывод появляется построчно; `Editor({ file: string; lines: string[]; highlight?: number[] })`; `Diff({ lines: { text: string; kind: 'add' | 'del' | 'same' }[] })`; `AgentChat({ messages: { from: 'me' | 'agent'; text: string }[] })` — ответ агента «печатается»; `Chart({ kind: 'line' | 'bars'; values: number[]; labels?: string[]; unit?: string })` — растёт; `Checklist({ items: string[]; done: number })` — галочки по одной; `Spotlight({ x, y, r })` — затемнение всего, кроме круга.
  - `KitShowcase` — все экраны и позы в одном ролике для проверки глазами.
- [ ] **Step 1: Тесты:** `typed('client/17', 15, 0, 30) === 'client/17'.slice(0, 15)`, до `start` — пустая строка, после конца — вся строка; `revealCount(0, 10, 5, 4) === 0`, `revealCount(20, 10, 5, 4) === 3`, `revealCount(100, 10, 5, 4) === 4`; `grow` монотонна, `grow(start)` = 0, `grow(start + length)` = 1.
- [ ] **Step 2:** FAIL. **Step 3:** реализовать помощники и экраны (цвета терминала — `fg-term`-палитра книги из `theme`: добавить в `theme.ts` `termBg '#1E2027'`, `termBar '#2A2D37'`, `termText '#DADCE3'`, `termOk '#6FD3A6'`, `termErr '#FF8C7A'`, `termDim '#8B90A0'`).
- [ ] **Step 4:** PASS; `npx remotion still video/index.ts kit-showcase out/kit.png --frame=200 --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell` — посмотреть кадр: все экраны читаются, подписи не мельче 18 px.
- [ ] **Step 5:** Коммит `video: живые экраны и витрина набора`.

### Task 5: Каталог роликов и ленивая загрузка на сайте

**Files:**
- Create: `course/video/catalog.ts`
- Modify: `course/video/Root.tsx`, `course/src/video/registry.ts`, `course/src/video/VideoBlock.tsx`, `course/scripts/render-video.mjs` (без изменений интерфейса), `course/package.json` (скрипт `render:video`)
- Test: `course/src/video/registry.test.ts`, `course/src/video/VideoBlock.test.tsx`

**Interfaces:**
- Produces:
  - `catalog: Record<string, { title: string; kind: 'chapter' | 'day'; script: VideoScript; load: () => Promise<{ default: ComponentType }> }>` — один список роликов; каждый ролик экспортирует компонент по умолчанию из `video/<id>/Video.tsx` (пилот — из `video/pilot-rls/PilotRls.tsx`, добавить `export default`).
  - `Root` регистрирует `<Composition id lazyComponent={load} …>` для каждой записи каталога (плюс `smoke`, `kit-showcase`).
  - `videos: Record<string, { script; load; mp4Url?: string }>` в `registry.ts` строится из каталога и словаря `MP4: Record<string, string>` (`'pilot-rls'` → текущий адрес `/_blob/08c8f08ad24664e9822024a19eda61ef`).
  - `VideoBlock` передаёт `lazyComponent={entry.load}` вместо `component`; `errorFallback` и отказ загрузки показывают «Ролик не загрузился»; запуск ролика рассылает событие `vibecourse:video-play` с `videoId`, остальные плееры на странице по нему встают на паузу.
  - `render:video` = `node scripts/render-video.mjs` (аргументы: id ролика и путь MP4).
- [ ] **Step 1: Тесты:** `registry.test.ts` — у каждой записи `videos` есть `script` и `load`, `id` сценария совпадает с ключом, `scriptProblems(script, kind)` пуст для всех записей каталога; `VideoBlock.test.tsx` — при `load`, который отклоняется, виден текст «Ролик не загрузился» (Review Focus 3); событие `vibecourse:video-play` с чужим `videoId` вызывает паузу у плеера этого блока (Review Focus 4; плеер подменяется через `vi.mock('@remotion/player')` с `ref`, у которого `pause` — `vi.fn`).
- [ ] **Step 2:** FAIL. **Step 3:** реализовать.
- [ ] **Step 4:** `npm test` — PASS; `npm run e2e` — PASS (ролик дня 4 играет); `npm run build` — основной JS-файл сборки меньше прежних 1,3 МБ, код пилота — отдельный файл в `dist/assets`.
- [ ] **Step 5:** Коммит `course: каталог роликов и ленивая загрузка`.

### Task 6: Пилот в новом темпе

**Files:**
- Modify: `course/video/pilot-rls/script.ts`, `course/video/pilot-rls/scenes/*.tsx`, `course/video/pilot-rls/script.test.ts`, `course/video/pilot-rls/PilotRls.tsx`
- Test: `course/video/pilot-rls/script.test.ts`, `course/e2e/video.spec.ts`

**Interfaces:**
- Consumes: `buildScript`, `scriptProblems`, `KitScene`, `CameraKey`, герои с позами, экраны.
- Produces: `pilotRlsScript` через `buildScript('pilot-rls', …)`; `beat` берётся из результата; `PilotRls` принимает `showHotspots?: boolean` (рамки горячих точек для отладочных кадров) — так же устроены все следующие ролики.
- [ ] **Step 1: Тест:** `script.test.ts` сводится к `expect(scriptProblems(pilotRlsScript, 'chapter')).toEqual([])` плюс прежние проверки трёх горячих точек; e2e `video.spec.ts` дополняется проверкой: страница дня 4 на 390 px без горизонтальной прокрутки (Review Focus 5).
- [ ] **Step 2:** FAIL (в новом темпе ролик короче 5400 кадров).
- [ ] **Step 3:** Перевести сценарий на `buildScript`; добавить 3–5 реплик, чтобы длина вошла в 5400–8100 (например: в S2 — что такое запрос и ответ; в S4 — как выглядит правило в Supabase; в S5 — что делать, если чужие данные видны); каждой сцене — переход и 1–2 движения камеры к объекту, о котором реплика; позы героев по смыслу реплик.
- [ ] **Step 4:** PASS; кадры середины каждой сцены и отладочный кадр с `showHotspots` для каждой горячей точки — посмотреть глазами: текст не наезжает, рамки точек совпадают с объектами.
- [ ] **Step 5:** Коммит `video: пилот в новом темпе`.

### Задачи роликов (7–13): общий порядок

Каждый ролик `<id>` — папка `course/video/<id>/`: `script.ts` (через `buildScript`, экспорт `<camelId>Script`), `layout.ts` (координаты объектов и горячих точек), `scenes/S1….tsx`…, `Video.tsx` (`export default`, сцены в `<Sequence>` по `sceneStart`, `<Subtitles>`, проп `showHotspots`), `script.test.ts` (`scriptProblems(…, kind)` пуст). Ролик не трогает общие файлы; в каталог, `Root` и файлы дней его добавляет задача.

Шаги каждой задачи роликов:
- [ ] **Step 1:** Прочитать указанные разделы книги; написать `script.test.ts` для каждого ролика задачи.
- [ ] **Step 2:** `npx vitest run video/<id>` — FAIL.
- [ ] **Step 3:** Сценарий: по одной реплике на мысль, по одной метафоре-сцене на ролик (из задания), примеры на приложении тренера; сверить каждый факт с книгой. Сцены: каждые 3–4 с в кадре что-то меняется, текст ≥ 18 px, всё выше y = 590.
- [ ] **Step 4:** `npx vitest run video/<id>` — PASS; кадр середины каждой сцены и отладочный кадр каждой горячей точки — просмотреть, исправить наезды и обрезку, просмотреть ещё раз.
- [ ] **Step 5:** Добавить ролики в `catalog.ts` и блоки `{"type": "video", "videoId": "<id>", "title": "<название>"}` в начало `blocks` своих дней (порядок — как в таблице спецификации); `npm test` — PASS (`registry.test.ts` и `refs.test.ts` проверяют новые записи).
- [ ] **Step 6:** Коммит `video: ролики <ids>`.

Задания роликов (`kind: 'chapter'`, 5–7 сцен, ≥ 2 горячих точек):

| id | Название | Разделы книги | Что зритель выносит | Сцена-метафора |
|---|---|---|---|---|
| `ch-abc` | Как устроено приложение | sa1–sa6 | четыре части приложения; репозиторий и коммит; от компьютера к сайту (локально → окружения → хостинг); как понять, что работает (консоль, ошибка) | заказ «Сохранить подход» идёт по ресторану; Git как сохранения в игре |
| `ch-01` | Вайб-кодинг: шкала, а не выключатель | s5–s12, s77–s79 | пять режимов и выбор по цене ошибки; программирование с намерением; модель — по карточке, бенчмаркам и мини-набору; подписка и API | автопилот самолёта: от подсказки до полного автопилота, за посадку отвечает пилот |
| `ch-02` | Как говорить с ИИ, чтобы он понял | s14–s19 | ЦКОКФ; конкретность; итерации по обратной связи; сначала вопросы, план до кода, спецификация | заказ торта: «сделай вкусно» против подробного заказа |
| `ch-12` | Своё приложение по образцу | s84–s91 | что можно и нельзя брать у эталона; чистая комната в пять шагов; ловушки с ИИ; три прохода разбора | повар пробует блюдо и готовит своё по описанию вкуса |
| `ch-03` | Проблема 70% | s21–s22 | ИИ быстро даёт 70%, остальное — крайние случаи, ошибки, безопасность; золотые правила: маленький шаг, чтение диффа, откат, тест | ремонт: стены за день, проводка и трубы — остальная работа |
| `ch-06` | Прототип за вечер | s36–s40 | прототип проверяет идею на человеке; инструменты; итерации по скриншотам; прототип ≠ продукт (ключи, окружения) | картонный макет дома перед стройкой |
| `ch-05` | Читать код, который написал ИИ | s29–s34 | проходы чтения; «самое распространённое» ≠ подходящее; отладка по трассировке и бисекцией; рефакторинг делает код своим; три вида тестов | приёмка ремонта: проверяют не цвет стен, а что кран не течёт |
| `ch-04` | Что остаётся человеку | s24–s27 | опыт, вкус и решения за человеком; T-образный специалист; ИИ как наставник; осознанный рост, журнал запросов | шахматист вместе с компьютером |
| `ch-08` | Безопасность и надёжность | s48–s55, s82 | инъекции, IDOR, лимиты, пакеты; аудит и сканер секретов; N+1; проверки в CI; постепенный выкат и откат | замки, сигнализация и пробная партия перед выпуском |
| `ch-09` | Этика вайб-кодинга | s57–s60 | чей код и лицензии; признавать участие ИИ; предвзятость; золотые правила | цитаты со ссылкой в эссе |
| `ch-10` | Фоновые агенты | s62–s68, s83 | агент работает сам: задача → план → изменения → пул-реквест; параллельные агенты; где застревает; права, задачи и приёмка | поручение стажёру с чек-листом приёмки |
| `ch-11` | Что дальше | s70–s75 | ИИ в тестах и инцидентах; персонализация; менеджмент; агенты меняют работу; естественный язык как новый слой | лестница уровней: машинный код → языки → естественный язык |

Задания роликов дней (`kind: 'day'`, 3–4 сцены, ≥ 1 горячей точки; сцены: что строим сегодня — подводный камень — проверьте у себя):

| id | День | Что строим | Подводный камень |
|---|---|---|---|
| `day-08` | 8 | отзывы первых тренеров, приоритеты, задача фоновому агенту | расплывчатая задача агенту без критерия «готово» |
| `day-09` | 9 | шаблоны программ, недельные циклы, библиотека упражнений | правка шаблона меняет прошлые тренировки подопечных |
| `day-10` | 10 | личные рекорды, объём нагрузки, отчёт тренеру | пустые значения и разные единицы ломают расчёт |
| `day-11` | 11 | комментарии к тренировкам и уведомления | чужие комментарии видны другим; уведомления-спам |
| `day-12` | 12 | приглашение подопечного по ссылке | вечная многоразовая ссылка |
| `day-13` | 13 | своё отличие по жалобам пользователей эталонов | копировать фичи конкурентов вместо решения боли |
| `day-14` | 14 | тесты, скорость, отслеживание ошибок, резервные копии | копия есть, а восстановить из неё никто не пробовал |
| `day-15` | 15 | первое знакомство, пустые экраны, доступность | пустой экран без подсказки, что делать |
| `day-16` | 16 | цели КБЖУ, дневник питания, сводка тренеру | округления и единицы в расчёте калорий |
| `day-17` | 17 | замеры тела и фото прогресса | публичная ссылка на фото |
| `day-18` | 18 | запись тренировки без интернета | двойная отправка и конфликт после связи |
| `day-19` | 19 | запуск бета-теста с 3–5 тренерами | спрашивать «нравится?» вместо наблюдения |
| `day-20` | 20 | исправления по итогам бета-теста | чинить всё сразу без приоритетов |
| `day-21` | 21 | домен, страница о продукте, политика конфиденциальности, финальная проверка | забыть про данные о здоровье в политике |

### Task 7: Ролики `ch-abc` и `ch-01` и утверждение стиля

**Files:** `course/video/ch-abc/`, `course/video/ch-01/` (по общему порядку); Modify: `course/video/catalog.ts`, `course/content/days/day-01.json`.

- [ ] **Steps 1–6** по общему порядку.
- [ ] **Step 7:** `npm run render:video -- pilot-rls out/pilot-rls.mp4`, то же для `ch-abc` и `ch-01` — каждый файл ≤ 20 МБ, длительность совпадает со сценарием.
- [ ] **Step 8:** Отправить автору три MP4. **Остановка до ответа автора:** «да» — продолжать задачи 8–13; правки — внести в набор и три ролика, повторить шаги 7–8.

### Task 8: Ролики дня 2 — `ch-02`, `ch-12`
### Task 9: Ролики дня 3 — `ch-03`, `ch-06`
### Task 10: Ролики дня 5 — `ch-05`, `ch-04`; дня 6 — `ch-08`, `ch-09`
### Task 11: Ролики дня 7 — `ch-10`, `ch-11`
### Task 12: Ролики дней 8–14 — `day-08` … `day-14`
### Task 13: Ролики дней 15–21 — `day-15` … `day-21`

Каждая — по общему порядку для своих роликов; файлы дней — `day-02.json` … `day-21.json`.

### Task 14: MP4 всех роликов и публикация

**Files:**
- Create: `course/scripts/render-all.mjs`
- Modify: `course/src/video/registry.ts` (словарь `MP4`), `course/README.md`, `course/package.json` (скрипт `render:all`)
- Test: `course/src/video/registry.test.ts`, `course/e2e/video.spec.ts`

**Interfaces:**
- Consumes: `catalog`, `render-video.mjs`.
- Produces: `render-all.mjs [ids…]` — рендерит в `out/<id>.mp4` все ролики каталога (или перечисленные), пропускает файлы новее своего сценария, печатает таблицу «ролик — длительность — МБ» и завершается с ошибкой, если хоть один файл больше 20 МБ.
- [ ] **Step 1: Тесты:** в `registry.test.ts` — у каждого ролика каталога есть адрес MP4 вида `/_blob/<32 hex>`; в `e2e/video.spec.ts` — на странице дня 1 два плеера, запуск второго ставит первый на паузу (Review Focus 4).
- [ ] **Step 2:** FAIL. **Step 3:** `npm run render:all`; загрузить каждый MP4 в хранилище страницы (`Artifact` publish с `url` курса и `asset: true`), вписать адреса в `MP4`.
- [ ] **Step 4:** `npm test` и `npm run e2e` — PASS; `npm run build:artifact`; опубликовать `out/artifact/page.html` тем же путём с новыми файлами `assets/*` (старые — `null`).
- [ ] **Step 5:** `README.md`: как добавить ролик (папка, каталог, день), `render:video`, `render:all`, требования (браузер рендера, `ffprobe`). Коммит `course: MP4 всех роликов и публикация`.
