# Ролики «Репозиторий»: пилот — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Основа новых роликов (записи сессий приложения тренера, тёмный набор кадров 1920 × 1080, урок как данные, главы в плеере) и два переделанных ролика дня 1 — `ch-abc` и `ch-01`.

**Architecture:** Рекордер по-настоящему выполняет шаги сессий `demo-app/sessions/*.mjs` (Next.js 16, git, Playwright) и пишет записи `course/video/sessions/*.json`. Урок — данные (`course/video/lessons/<id>/lesson.ts`): главы по каркасу, сцены из готовых кадров, кадры берут вывод из записей по id событий. `buildLesson` считает тайминг из реплик и выдаёт `VideoScript` 1920 × 1080 с главами; сценарий для сайта лежит готовым JSON (снимок vitest), а код кадров и записи грузятся лениво вместе с роликом.

**Tech Stack:** Remotion 4.0.537 (`remotion`, `@remotion/player`, `@remotion/cli`, `@remotion/bundler`, `@remotion/renderer`), React 19, TypeScript, Vitest 5, Playwright 1.56.1, Node 22, git 2.43, `create-next-app@16.4.3`.

**Spec:** `docs/superpowers/specs/2026-10-28-video-lessons-v2-design.md`

## Global Constraints

- Все пакеты Remotion — строго `4.0.537`. Браузер рендера — `/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`; `playwright install` не запускать никогда.
- Кадр 1920 × 1080, 30 кадров/с. Текст в кадре не мельче 24 px, линии не тоньше 2 px. Содержимое — в прямоугольнике x 96–1824, y 96–872; шапка y 32–80; субтитры y 896–1040.
- Цвета кадра — только из `course/video/term/theme.ts`: desk #141619, paper #1A1D21, raised #22262B, edge #2B3036, ink #E9EBEE, ink-soft #A3A9B1, ink-faint #868D96, fig-line #7A818A, fig-grid #3A4048, term-bg #0F1113, ok #5BC78F, err #F07C70, warn #E3B45C. Тема ролика всегда тёмная.
- Шрифты: Golos Text (текст, субтитры), Martian Mono (экраны). Пакеты `@fontsource-variable/golos-text@5.3.0` и `@fontsource-variable/martian-mono@5.3.0` — devDependencies, подключаются только в `course/video/index.ts`.
- Движение: появление 9 кадров `ease-out` cubic-bezier(.16,1,.3,1), уход `ease-in` (.5,0,.75,0); камера и смена окна 18; прорисовка линии 19; шаг очереди строк 2; набор 30 знаков/с, мигание курсора раз в 16 кадров; смена сцены 8 (растворение и сдвиг 16 px); смена главы 12. Каждые 3–4 с в кадре что-то меняется (промежуток не больше 120 кадров).
- Темп прежний: `PACE` из `course/video/kit/script.ts` (14 знаков/с, вступление 0,3 с, пауза 0,25 с, хвост 1 с, реплика не короче 2,2 с) не меняется. Субтитры не быстрее 15 знаков/с, не больше двух строк.
- Длина: ролик главы 5400–8100 кадров, ролик дня 1800–5400; не короче прежнего: `ch-abc` ≥ 7789, `ch-01` ≥ 7857.
- Пояснений по нажатию: у ролика главы ≥ 2, у ролика дня ≥ 1.
- Каждая строка вывода, диффа, файла и страницы в кадре — из записи сессии. Слова агента (запрос, ответ) и содержимое файлов, которые он пишет, — авторский текст; всё остальное выполняется по-настоящему.
- Интерфейс Claude Code в кадре — по схемам книги `ch1_agent_session` и `dk_modes`: «Reading …», «Edited … (+N −M)», `Run "…"? [y / n]`, режимы Plan / Manual / Accept edits. Других английских строк интерфейса не выдумывать.
- Весь текст кадров, реплик и интерфейса — по-русски. Факты, цифры и названия — из разделов книги `vibe-coding-na-praktike-2026-10.html`, указанных у урока.
- Не меняются: книга, ветка `claude/interactive-course`, остальные 25 роликов (кроме совместимых правок общих типов).
- Сообщения коммитов — по-русски, в конце строки `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` и `Claude-Session: https://claude.ai/code/session_01DQgsSEqLgHui6HevL5dFCC`.
- Проверки курса: `npm test`, `npm run lint`, `npx tsc -b`, `npm run e2e` (из `course/`) — зелёные в конце каждой задачи, где задача их касается.

## Review Focus

1. Телефон 390 px: полоса глав и список глав под роликом не дают горизонтальной прокрутки, длинные названия глав переносятся (тест — Задача 12, e2e).
2. Светлая тема сайта: кадр ролика остаётся тёмным, схема книги в кадре не берёт светлые токены страницы (тест — Задача 7, `Figure` задаёт все переменные `--fig-*` у себя).
3. Перемотка в середину набора команды или потока вывода: кадр — чистая функция номера кадра, без состояния (тест — Задачи 5–7, кадры не используют `useState`/`useEffect`).
4. Переход по главе во время воспроизведения: голос не накладывается, следующей звучит первая реплика главы (тест — Задача 9).
5. Шрифт ещё не загрузился или заменился: строки, рассчитанные на ширину знака Martian Mono, не вылезают из окна (тест — Задача 4, константа ширины не меньше измеренной).

---

### Task 1: Записи сессий: типы, патч, сверка

**Files:**
- Create: `course/video/sessions/types.ts`, `course/video/sessions/patch.ts`, `course/video/sessions/blob.ts`, `course/video/sessions/check.ts`
- Test: `course/video/sessions/patch.test.ts`, `course/video/sessions/check.test.ts`

**Interfaces:**
- Produces:

```ts
// types.ts
type By = { by?: 'agent' }
export type RunEvent = { id: string; kind: 'run'; cwd: string; cmd: string; out: string[]; code: number | null } & By
export type FileEvent = { id: string; kind: 'file'; path: string; before: string | null; after: string; diff: string[]; blob: string } & By
export type ReadEvent = { id: string; kind: 'read'; path: string; text: string; blob: string } & By
export type CommitEvent = { id: string; kind: 'commit'; cmd: string; hash: string; message: string; branch: string; parents: string[]; out: string[]; files: { path: string; blob: string }[] } & By
export type AgentEvent = { id: string; kind: 'agent'; prompt: string; reply: string; steps: string[] }
export type BrowserEvent = { id: string; kind: 'browser'; url: string; title: string; fields: { label: string; value: string }[]; buttons: string[]; before: string[]; after: string[]; console: { type: string; text: string }[]; network: { method: string; url: string; status: number }[]; server: string[] } & By
export type SessionEvent = RunEvent | FileEvent | ReadEvent | CommitEvent | AgentEvent | BrowserEvent
export type SessionRecord = { id: string; from: string | null; recorded: string; events: SessionEvent[] }
export type Find = <K extends SessionEvent['kind']>(session: string, id: string, kind: K) => Extract<SessionEvent, { kind: K }>
export function makeFind(records: SessionRecord[]): Find   // нет сессии или события, другой kind → Error с понятным текстом
```

- `applyPatch(before: string | null, diff: string[]): string` (patch.ts) — применяет вывод `git diff` к одному файлу; не ложится → `Error('Дифф не ложится: …')`.
- `gitBlobHash(data: string | Uint8Array): string` (blob.ts, `node:crypto`) — 40 hex, как `git hash-object`. Модуль только для тестов и рекордера: в код кадров не импортируется.
- `sessionProblems(records: SessionRecord[], app?: Map<string, string>): string[]` (check.ts) — `app`: путь → blob файлов `demo-app/app`.

- [ ] **Step 1: Тесты патча и хеша**

```ts
test('новый файл', () => {
  expect(applyPatch(null, ['diff --git a/a.txt b/a.txt', 'new file mode 100644', 'index 0000000..b4a6d2e', '--- /dev/null', '+++ b/a.txt', '@@ -0,0 +1,2 @@', '+one', '+two'])).toBe('one\ntwo\n')
})
test('правка с контекстом', () => {
  expect(applyPatch('a\nb\nc\n', ['diff --git a/x b/x', 'index 1..2 100644', '--- a/x', '+++ b/x', '@@ -1,3 +1,3 @@', ' a', '-b', '+B', ' c'])).toBe('a\nB\nc\n')
})
test('файл без перевода строки в конце', () => {
  expect(applyPatch('a\n', ['--- a/x', '+++ b/x', '@@ -1 +1 @@', '-a', '+b', '\\ No newline at end of file'])).toBe('b')
})
test('контекст не совпал — ошибка', () => {
  expect(() => applyPatch('z\n', ['--- a/x', '+++ b/x', '@@ -1 +1 @@', '-a', '+b'])).toThrow('Дифф не ложится')
})
test('хеш как у git', () => {
  expect(gitBlobHash('hello\n')).toBe('ce013625030ba8dba906f756967f9e9ca394464a')
  expect(gitBlobHash('')).toBe('e69de29bb2d1d6434b8b29ae775ad8c2e48c5391')
})
```

- [ ] **Step 2: Тесты сверки** — `check.test.ts` строит маленькую запись из двух сессий через хелпер в тесте (blob считается `gitBlobHash`): верная → `[]`. Каждая поломка даёт строку с этим фрагментом:
  - повтор id события → `повторяется событие «dev»`;
  - `from` указывает на сессию без записи → `нет записи сессии «s00-x»`;
  - `gitBlobHash(after) !== blob` у `file` или `gitBlobHash(text) !== blob` у `read` → `хеш не совпадает`;
  - `applyPatch(before, diff) !== after` → `дифф не даёт файл`;
  - `before` не равно последнему известному содержимому этого пути в цепочке (`file.after` или `read.text` раньше по цепочке) → `содержимое до правки другое`;
  - шаг агента ссылается на несуществующее событие → `шаг агента «x» не найден`;
  - `app` передан: файлы последнего коммита последней сессии ≠ `app` → `demo-app/app: нет файла «…»`, `лишний файл «…»`, `другой файл «…»`.
  - `makeFind`: `find('s01', 'nope', 'run')` бросает ошибку с `s01` и `nope`; событие другого вида — ошибка с обоими видами.

- [ ] **Step 3:** `npx vitest run video/sessions` — FAIL (модулей нет).
- [ ] **Step 4:** Написать `types.ts`, `patch.ts`, `blob.ts`, `check.ts`.
- [ ] **Step 5:** `npx vitest run video/sessions` — PASS; `npx tsc -b` — без ошибок.
- [ ] **Step 6: Commit** — `git add course/video/sessions && git commit -m "video: записи сессий — типы, патч и сверка"` (+ строки атрибуции).

### Task 2: Рекордер сессий

**Files:**
- Create: `course/scripts/session/record.mjs`, `course/scripts/record-session.mjs`
- Test: `course/scripts/session/record.test.ts` (первая строка `// @vitest-environment node`)

**Interfaces:**
- Consumes: типы и `sessionProblems` из Задачи 1.
- Produces:
  - `recordChain(defs: SessionDef[], opts: { workdir: string }): Promise<{ records: SessionRecord[]; project: string }>` — `defs` по порядку; `workdir` — пустая папка, внутри создаётся `home/` (это `~`) и проект `home/trainer-app`; `project` — абсолютный путь проекта после последней сессии.
  - CLI `node scripts/record-session.mjs` (из `course/`): берёт все `../demo-app/sessions/*.mjs` по имени, записывает **всю цепочку** во временной папке, пишет `video/sessions/<id>.json` (JSON с отступом 1) и заменяет `../demo-app/app/` файлами из `git ls-files` проекта.
  - Формат сессии (`export default`): `{ id, from, date: 'ISO-время', steps }`; шаги — как в спецификации §4.2, плюс `{ id, read: 'path' }` и `cwd: '~'` у шага `run` (иначе — корень проекта).

Правила записи (спецификация §4.2–4.3):
- окружение команд: `GIT_AUTHOR_NAME=Анна`, `GIT_AUTHOR_EMAIL=anna@example.com`, те же для `GIT_COMMITTER_*`; дата k-го коммита сессии — `date` + k минут (`GIT_AUTHOR_DATE`, `GIT_COMMITTER_DATE`); `NEXT_TELEMETRY_DISABLED=1`, `npm_config_update_notifier=false`, `npm_config_fund=false`, `PORT=3000`, `FORCE_COLOR=0`;
- вывод: убрать управляющие последовательности ANSI, заменить абсолютный путь `home/` на `~`, разбить на строки, отбросить пустые строки в конце; других правок нет;
- `run`: `bash -lc <cmd>`, stdout и stderr в порядке появления; `code` — код выхода; с `until` — ждать строку с этим текстом (не дольше 120 с, иначе ошибка), процесс оставить и в конце сессии остановить вместе с группой процессов; `code: null`;
- `write`/`edit`: `before` — содержимое до (null — файла не было); `edit` без найденного `find` — ошибка; `diff` — для нового файла `git diff --no-index --no-color -- /dev/null <path>`, для изменённого `git diff --no-color -- <path>`;
- `read`: текст и `git hash-object`;
- `commit`: `git add -A && git commit -m "<msg>"` (это и есть `cmd`); `hash` — 7 знаков, `branch` — `git branch --show-current`, `parents` — короткие хеши родителей, `files` — `git ls-tree -r HEAD`;
- `agent`: событие агента ставится перед своими шагами, у шагов `by: "agent"`, `steps` — их id;
- `browser`: нужен работающий шаг с `until`; Playwright (`chromium` из `@playwright/test`) открывает `http://localhost:3000` + `url`; `fields` — подписи `<label>` и значения полей после заполнения (`page.getByLabel(label).fill(value)`), `buttons` — тексты кнопок, `before` — видимый текст страницы до нажатия (строки `innerText`), `after` — после нажатия и `networkidle`; `console` — все сообщения консоли, `network` — ответы со статусом ≥ 400, `server` — строки вывода dev-сервера за время шага.

- [ ] **Step 1: Тест на учебной цепочке** — две сессии во временной папке, без сети:
  - `f01`: `run 'git init -b main'`, `write a.txt`, `commit 'один'`, `read a.txt`, `run 'cat nope.txt'`, `agent { prompt, reply }` со вложенным `edit a.txt`, `commit 'два'`;
  - `f02` (`from: 'f01'`): `run` с `until: 'Ready'` — `node -e` поднимает http-сервер на 3000 со страницей (label «Вес», поле, кнопка «Сохранить», по нажатию `fetch('/api')` отвечает 400) и печатает `Ready`; `browser` с `fill: { 'Вес': '60 кг' }, click: 'Сохранить'`.
  
  Проверки:
  ```ts
  expect(sessionProblems(records)).toEqual([])
  expect(find('f01', 'init', 'run').out[0]).toBe('Initialized empty Git repository in ~/trainer-app/.git/')
  expect(find('f01', 'cat', 'run').code).not.toBe(0)
  expect(find('f01', 'fix', 'file').by).toBe('agent')
  expect(find('f02', 'save', 'browser').network).toContainEqual(expect.objectContaining({ status: 400 }))
  expect(find('f02', 'save', 'browser').console.some((m) => m.type === 'error')).toBe(true)
  // повтор той же цепочки в другой папке даёт те же хеши коммитов
  expect(again.map(hashes)).toEqual(records.map(hashes))
  ```
  Таймаут теста 120 с.
- [ ] **Step 2:** `npx vitest run scripts/session` — FAIL.
- [ ] **Step 3:** Написать `record.mjs` и CLI.
- [ ] **Step 4:** `npx vitest run scripts/session` — PASS (дважды подряд — стабильно).
- [ ] **Step 5: Commit** — `video: рекордер сессий приложения тренера`.

### Task 3: Сессии пилота и приложение тренера

**Files:**
- Create: `demo-app/README.md`, `demo-app/sessions/s01-start.mjs`, `demo-app/sessions/s02-sets.mjs`, `course/video/sessions/index.ts`, `course/video/sessions/sessions.test.ts`
- Generated (рекордером): `course/video/sessions/s01-start.json`, `course/video/sessions/s02-sets.json`, `demo-app/app/**`

**Interfaces:**
- Consumes: `recordChain`/CLI (Задача 2), `makeFind`, `sessionProblems`, `gitBlobHash` (Задача 1).
- Produces: `sessions: Record<string, SessionRecord>` и `find: Find` в `course/video/sessions/index.ts` (JSON подключаются обычным `import`). Id событий ниже — постоянные: на них ссылаются уроки.

Сессия `s01-start` (`date: '2026-10-28T10:00:00+03:00'`, `from: null`):

| id | шаг |
|---|---|
| `create` | `run` в `~`: `npx create-next-app@16.4.3 trainer-app --yes --use-npm --disable-git` (если `--help` этой версии предлагает выключить AGENTS.md / CLAUDE.md — выключить: CLAUDE.md пишет агент) |
| `ls` | `run 'ls'` |
| `init` | `run 'git init -b main'` |
| `status` | `run 'git status --short'` |
| `c-start` | `commit 'Заготовка Next.js'` |
| `idea` | агент: запрос — задание «Описать идею» дня 1 своими словами; шаги `idea-file` (write `docs/idea.md`: два абзаца — для кого, какая задача, чем отличается) и `c-idea` (`commit 'Идея приложения в docs/idea.md'`) |
| `claude-md` | агент: запрос — задание «/init и CLAUDE.md» дня 1; шаги `claude-file` (write `CLAUDE.md`: цель; стек — Next.js 16, TypeScript strict, Supabase (база, вход, RLS, хранилище), Vercel, Vitest и Playwright; раздел «Нельзя» с тремя запретами из задания) и `c-claude` (`commit 'CLAUDE.md: цель, стек и запреты'`) |
| `log` | `run 'git log --oneline'` |
| `pkg` | `read 'package.json'` |
| `gitignore` | `read '.gitignore'` |

Сессия `s02-sets` (`date: '2026-10-28T14:00:00+03:00'`, `from: 's01-start'`):

| id | шаг |
|---|---|
| `branch` | `run 'git switch -c sets-form'` |
| `ask-form` | агент: «форма «Сохранить подход»: вес и повторы, API `app/api/sets/route.ts` проверяет, что вес — число, повторы — целое больше нуля, сохранённые подходы — списком под формой»; шаги `read-page` (read `app/page.tsx`), `route` (write `app/api/sets/route.ts`), `page` (write `app/page.tsx`) |
| `dev` | `run 'npm run dev'`, `until: 'Ready'` |
| `save-bad` | `browser`: `url '/'`, `fill { 'Вес, кг': '60 кг', 'Повторы': '8' }`, `click 'Сохранить подход'` |
| `ask-fix` | агент: запрос содержит дословно текст первой ошибки консоли из `save-bad` и «что делала / что ждала / что вышло»; шаги `read-route` (read `app/api/sets/route.ts`), `fix` (edit `app/page.tsx`: ответ сервера с ошибкой показывается под формой в `<p role="alert">`) |
| `save-hint` | `browser`: тот же ввод и `click 'Сохранить подход'` |
| `save-ok` | `browser`: `fill { 'Вес, кг': '60', 'Повторы': '8' }`, `click 'Сохранить подход'` |
| `diff` | `run 'git diff --stat'` |
| `c-form` | `commit 'Форма «Сохранить подход» с проверкой веса'` |
| `restyle` | агент: «сделай страницу посимпатичнее»; шаг `css` (write `app/globals.css` — крупная непрошеная переделка) |
| `diff-css` | `run 'git diff --stat'` |
| `restore` | `run 'git restore app/globals.css'` |
| `clean` | `run 'git status --short'` |
| `main` | `run 'git switch main'` |
| `merge` | `run 'git merge sets-form'` |
| `start-dev` | `run 'npm run start-dev'` |
| `scripts` | `run 'npm run'` |
| `env` | write `.env.local`: `TRAINER_API_KEY=demo-key-not-real` |
| `ignored` | `run 'git check-ignore -v .env.local'` |
| `status-env` | `run 'git status --short'` |
| `mini` | агент: «составь мини-набор из пяти задач этого проекта для проверки моделей, у каждой — критерий «готово»»; шаги `mini-file` (write `docs/mini-set.md`), `c-mini` (`commit 'Мини-набор задач для выбора модели'`) |
| `log2` | `run 'git log --oneline'` |

Поведение приложения (код пишет исполнитель; оно должно по-настоящему работать):
- `app/api/sets/route.ts`: `POST` с JSON `{ weight, reps }`; вес — `Number(String(weight).replace(',', '.'))`; не число → 400 `{ error: 'Вес должен быть числом, например 60' }`; повторы не целое > 0 → 400 `{ error: 'Повторы — целое число больше нуля' }`; иначе подход в массив модуля и 201 `{ set: { weight, reps }, volume: weight * reps }`; `GET` → список.
- `app/page.tsx` (`'use client'`): заголовок «Тренировка», поля с подписями «Вес, кг» и «Повторы» (`type="text"`), кнопка «Сохранить подход», список строк `«60 кг × 8»`. Первая версия (`page`) при ответе с ошибкой ничего не показывает; `fix` добавляет текст ошибки.

- [ ] **Step 1: Тест записей пилота** (`sessions.test.ts`, `// @vitest-environment node`):

```ts
test('записи сходятся между собой и с demo-app/app', () => {
  expect(sessionProblems(Object.values(sessions), appBlobs('../demo-app/app'))).toEqual([])
})
test('ошибка 400 видна в консоли, подсказка и сохранение — после правки', () => {
  const bad = find('s02-sets', 'save-bad', 'browser')
  expect(bad.network).toContainEqual(expect.objectContaining({ method: 'POST', status: 400 }))
  expect(bad.console.find((m) => m.type === 'error')?.text).toMatch(/400/)
  expect(bad.after.join('\n')).not.toContain('60 кг × 8')
  expect(find('s02-sets', 'ask-fix', 'agent').prompt).toContain(bad.console.find((m) => m.type === 'error')!.text)
  expect(find('s02-sets', 'save-hint', 'browser').after.join('\n')).toContain('Вес должен быть числом, например 60')
  const ok = find('s02-sets', 'save-ok', 'browser')
  expect(ok.after.join('\n')).toContain('60 кг × 8')
  expect(ok.console.filter((m) => m.type === 'error')).toEqual([])
})
test('git: слияние, выдуманная команда, ключ вне коммитов', () => {
  expect(find('s02-sets', 'merge', 'run').out.join('\n')).toContain('Fast-forward')
  expect(find('s02-sets', 'start-dev', 'run').code).not.toBe(0)
  expect(find('s02-sets', 'start-dev', 'run').out.join('\n')).toContain('Missing script')
  expect(find('s02-sets', 'ignored', 'run').out[0]).toMatch(/^\.gitignore:\d+:/)
  expect(find('s02-sets', 'status-env', 'run').out).toEqual([])
  expect(find('s01-start', 'claude-file', 'file').after).toMatch(/Next\.js 16[\s\S]*Нельзя/)
})
```
`appBlobs(dir)` — хелпер теста: все файлы папки рекурсивно, путь → `gitBlobHash(readFileSync(...))`.

- [ ] **Step 2:** `npx vitest run video/sessions/sessions.test.ts` — FAIL (записей нет).
- [ ] **Step 3:** Написать `demo-app/sessions/*.mjs`, `demo-app/README.md` (что это, правило «правится только записью», команда перезаписи), `index.ts`; запустить `node scripts/record-session.mjs` из `course/` (несколько минут: ставятся пакеты Next.js).
- [ ] **Step 4:** `npx vitest run video/sessions` — PASS. Если запись не совпала с ожиданием (другая строка консоли, другой текст ошибки) — править шаги сессии и перезаписывать, а не JSON.
- [ ] **Step 5:** `npm test` — PASS.
- [ ] **Step 6: Commit** — `demo-app: сессии пилота — заготовка, идея, CLAUDE.md, форма подхода` (вместе с записями и `demo-app/app`).

### Task 4: Основа набора «Репозиторий»

**Files:**
- Create: `course/video/term/theme.ts`, `course/video/term/text.ts`, `course/video/term/camera.ts`, `course/video/term/motion.ts`, `course/video/term/frame.ts`, `course/video/term/book.ts`, `course/video/term/book-sections.json` (снимок), `course/video/term/chrome/Header.tsx`, `course/video/term/chrome/Subtitles.tsx`, `course/video/term/chrome/Verdict.tsx`, `course/video/webpack-override.mjs`, `course/remotion.config.ts`, `course/scripts/measure-fonts.mjs`
- Modify: `course/video/index.ts` (шрифты, `src/styles/figures.css`), `course/package.json` (два пакета шрифтов)
- Test: `course/video/term/text.test.ts`, `course/video/term/camera.test.ts`, `course/video/term/motion.test.ts`, `course/video/term/book.test.ts`, `course/video/term/chrome/chrome.test.tsx`

**Interfaces:**
- Consumes: `SubtitlesShown` (`course/video/lib/subtitlesShown.ts`), `Cue` (`course/video/types.ts`), `SessionEvent`, `Find` (Задача 1).
- Produces:

```ts
// theme.ts
export const T: { desk; paper; raised; edge; ink; soft; faint; line; grid; termBg; ok; err; warn; font; mono }  // значения — Global Constraints
export const CANVAS = { w: 1920, h: 1080 }
export const SAFE = { x: 96, y: 96, w: 1728, h: 776 }
export const HEADER = { y: 32, h: 48 }
export const SUBS = { top: 896, bottom: 1040, size: 40, lineHeight: 1.4, maxWidth: 1500, maxLines: 2 }
export const MIN_TEXT = 24
export const MONO = { size: 24, advance: number /* em, из замера */, line: 36 }
export const GOLOS = { avg: number /* em, средняя ширина знака русского текста 500, из замера */ }
export const MOTION = { appear: 9, move: 18, draw: 19, stagger: 2, typeCps: 30, blink: 16, sceneFade: 8, sceneShift: 16, chapter: 12, maxStill: 120 }
// text.ts
export function monoChars(widthPx: number, size?: number): number          // сколько знаков Martian Mono влезает
export function wrapMono(line: string, maxChars: number): string[]          // перенос по ширине, пустая строка → ['']
export function fitText(text: string, maxChars: number): string             // обрезка с «…»
export function textWidth(text: string, sizePx: number): number             // оценка ширины Golos Text
export function wrapText(text: string, sizePx: number, maxWidth: number): string[]
// camera.ts — холст 1920×1080, центр (960, 540)
export type Shot = { x: number; y: number; zoom: number }
export type CameraKey = { at: number } & Shot
export const WHOLE: Shot
export function cameraAt(frame: number, keys: CameraKey[]): Shot          // между ключами — ease-out за MOTION.move кадров после at
export function toScreen(r: Rect, cam: Shot): Rect
export function focusShot(r: Rect): Shot                                   // часть в центр, zoom — вписать в SAFE с полем 48 px, не больше 1.6
// motion.ts
export function easeOut(t: number): number; export function easeIn(t: number): number   // cubic-bezier из Global Constraints
export function appear(frame: number, at: number, len?: number): number   // 0 → 1
export function typedCount(text: string, frame: number, at: number): number // знаков набрано при 30 знаков/с
// frame.ts — контракт кадра
export type Rect = { x: number; y: number; w: number; h: number }
export type Clock = { beat(i: number): number; duration: number; lines: number } // beat(i) — кадр сцены, где начинается реплика i
export type LessonInfo = { id: string; title: string; chapters: string[]; book: string[] }
export type FrameCtx = { find: Find; lesson: LessonInfo }
export type FrameDef<S> = {
  layout(spec: S, ctx: FrameCtx): Record<string, Rect>          // части кадра на холсте; всегда есть 'frame'
  moments(spec: S, clock: Clock, ctx: FrameCtx): number[]       // кадры сцены, где картинка меняется
  problems(spec: S, ctx: FrameCtx, clock: Clock): string[]      // ссылки, диапазоны, переполнение
  Component(props: { spec: S; clock: Clock; ctx: FrameCtx }): JSX.Element  // <g> внутри общего <svg viewBox="0 0 1920 1080">
}
// book.ts
export function bookSection(id: string): { id: string; chapter: string; title: string } | null
export function bookRef(ids: string[], maxChars: number): string   // «книга · Азбука · Код, языки и чужие детали»; гл. N для глав; обрезка fitText
// chrome
export function Header(p: { lessonId: string; chapter: { n: number; total: number; title: string }; book: string; at: number }): JSX.Element // смена главы — 12 кадров, номер прокручивается
export function TermSubtitles(p: { cues: Cue[] }): JSX.Element | null   // уважает SubtitlesShown; две строки по wrapText
export function Verdict(p: { mistake: boolean; verdict: { at: number; kind: 'wrong' | 'right' }[] }): JSX.Element | null // метка «Типичная ошибка» (err) и «Неверно» (err) / «Верно» (ok)
```

- `book-sections.json`: id раздела → `{ chapter, title }` для всех разделов из `course/content/book-index.json` (поля `a`, `c`, `s`); файл поддерживается тестом через `toMatchFileSnapshot`, `book-index.json` в код роликов не импортируется.
- `webpack-override.mjs`: `export function webpackOverride(config)` — правило `resourceQuery: /raw/` → `type: 'asset/source'`, а существующие правила для `.svg` получают `resourceQuery: { not: [/raw/] }`; `remotion.config.ts` вызывает `Config.overrideWebpackConfig(webpackOverride)`.

- [ ] **Step 1: Замер шрифтов.** `scripts/measure-fonts.mjs` поднимает Chromium (`chromium` из `@playwright/test`) со страницей, где подключены woff2 из `@fontsource-variable/*`, и печатает: ширину знака Martian Mono 24 px (в em; по строке из 100 знаков `0`, `ш`, `M`, берётся максимум) и среднюю ширину Golos Text 500 по тексту реплик старых `ch-abc` и `ch-01` (в em). Числа, округлённые вверх до 0,01 em, — в `MONO.advance` и `GOLOS.avg`; в комментарии рядом — дата замера и команда.
- [ ] **Step 2: Тесты**
  - `text.test.ts`: `monoChars(1728)` = `Math.floor(1728 / (24 * MONO.advance))`; `wrapMono('a'.repeat(25), 10)` → три строки 10/10/5; `fitText('абвгде', 4)` → `'абв…'`; `wrapText` реплики из 120 знаков при 40 px и 1500 px — не больше двух строк; **Review Focus 5:** `expect(MONO.advance).toBeGreaterThanOrEqual(0.6)` и константа не меньше замера, записанного в комментарии (`MEASURED_ADVANCE` экспортируется рядом).
  - `camera.test.ts`: `toScreen({x:960,y:540,w:100,h:100}, WHOLE)` = тот же прямоугольник; `focusShot` части 400×200 в центре — zoom 1.6; `cameraAt` до первого ключа — первый, через 18 кадров после `at` — следующий ключ точно, на полпути — между ними.
  - `motion.test.ts`: `easeOut(0)=0`, `easeOut(1)=1`, `easeOut(0.5) > 0.8`; `easeIn(0.5) < 0.35`; `appear(f, 10)` = 0 при f ≤ 10 и 1 при f ≥ 19; `typedCount('abcdef', 10 + 3, 10)` = 3 (30 знаков/с → 1 знак на кадр).
  - `book.test.ts`: снимок `book-sections.json` (`toMatchFileSnapshot`); `bookSection('sa3')` → `{ chapter: 'Азбука', title: 'Где живёт код: терминал, редактор и репозиторий' }`; `bookRef(['s5'], 56)` начинается с `книга · гл. 1 · ` и не длиннее 56 знаков.
  - `chrome.test.tsx`: `TermSubtitles` в `SubtitlesShown` false — ничего; true — текст реплики текущего кадра; в разметке `Header`, `TermSubtitles`, `Verdict` нет `font-size` меньше 24.
- [ ] **Step 3:** `npx vitest run video/term` — FAIL.
- [ ] **Step 4:** Написать модули; `npm i -D @fontsource-variable/golos-text@5.3.0 @fontsource-variable/martian-mono@5.3.0`; `video/index.ts` импортирует их CSS и `../src/styles/figures.css`.
- [ ] **Step 5:** `npx vitest run video/term` — PASS; `npx tsc -b`, `npm run lint` — чисто.
- [ ] **Step 6: Проверка рендера.** Временная композиция `term-check` (1920×1080, 60 кадров: шапка, субтитр, строка Martian Mono и `<svg>` из `content/figures/abc_restaurant.svg?raw`) в `Root.tsx`; `npx remotion still video/index.ts term-check <scratchpad>/term-check.png --frame=30 --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell` — открыть картинку: шрифты Golos/Martian (не запасные), схема видна. Композицию оставить: её используют Задачи 5–7 для проверки кадров.
- [ ] **Step 7: Commit** — `video: основа набора «Репозиторий» — тема, текст, камера, шапка и субтитры`.

### Task 5: Кадры записей — Terminal, Editor, Diff

**Files:**
- Create: `course/video/term/frames/Terminal.tsx`, `course/video/term/frames/Editor.tsx`, `course/video/term/frames/Diff.tsx`, `course/video/term/frames/Window.tsx` (общее окно: полоса с заголовком, тело), `course/video/term/frames/index.ts`
- Test: `course/video/term/frames/frames.test.tsx`, фикстура `course/video/term/frames/fixture.ts` (маленькая `SessionRecord` и `FrameCtx`)

**Interfaces:**
- Consumes: всё из Задачи 4; `Find`, события (Задача 1).
- Produces (спеки кадров; `at` — номер реплики сцены):

```ts
export type TerminalSpec = { type: 'terminal'; title?: string; items: { session: string; event: string /* run | commit */; at: number; lines?: [number, number] }[] }
// части: 'frame', 'cmd:<event>', 'out:<event>', 'line:<event>:<k>' (k — номер показанной строки вывода с 0)
export type EditorSpec = { type: 'editor'; session: string; event: string /* file | read */; tree?: { session: string; commit: string }; lines?: [number, number] /* строки файла с 1 */; highlight?: { at: number; lines: [number, number] }[]; typing?: { at: number }; ghost?: { at: number; accept: number } }
// части: 'frame', 'tree', 'code', 'line:<n>'
export type DiffSpec = { type: 'diff'; items: { session: string; event: string /* file */; at: number; lines?: [number, number] }[]; highlight?: { at: number; event: string; lines: [number, number] }[] }
// части: 'frame', 'file:<event>', 'line:<event>:<k>'
export type FrameSpec = TerminalSpec | EditorSpec | DiffSpec            // Задачи 6–7 дописывают
export const FRAMES: { [K in FrameSpec['type']]: FrameDef<Extract<FrameSpec, { type: K }>> }
```

Поведение:
- `Terminal`: подсказка `<cwd> $ ` (cwd из события, `~/trainer-app`), команда набирается с курсором, вывод после набора идёт строками с шагом 2 кадра; строки длиннее окна переносятся (`wrapMono`); окно прокручивается, когда строки не помещаются. У `commit` команда — `cmd` события, вывод — `out`. Код выхода ≠ 0 — последняя строка вывода цвета `err`.
- `Editor`: слева дерево (папки свёрнуты до двух уровней, файл события выделен), справа файл с номерами строк; `highlight` — полоса под строками растягивается за 9 кадров; `typing` — новые строки диффа набираются; `ghost` — новые строки серым `faint`, на реплике `accept` — обычным цветом (подсказка принята).
- `Diff`: заголовок `путь  +N −M`, строки `-` на подложке `err` 14 %, `+` на подложке `ok` 16 %, контекст `soft`; строки появляются очередью.
- `problems`: нет события или не тот вид; диапазон `lines` вне вывода/файла; после переноса не помещается в окно и окно не прокручивается (для `Editor` и `Diff` — показ больше 18 строк); часть вне `SAFE`; `ghost`/`typing` у `read`.
- `moments`: каждая появившаяся строка/команда/подсветка, конец набора.

- [ ] **Step 1: Тесты** (`frames.test.tsx`, на фикстуре):
  - `FRAMES.terminal.layout` — все части внутри `SAFE`; `line:<event>:0` ниже `cmd:<event>`;
  - строка вывода из 300 знаков в окне ширины `SAFE.w` занимает `Math.ceil(300 / monoChars(...))` строк;
  - `problems` ловит: неизвестное событие, `lines: [0, 99]` при трёх строках вывода, `ghost` у `read`;
  - рендер `<Component>` через `renderToStaticMarkup` с моком `useCurrentFrame` (приём из `video/kit/screens/screens.test.tsx`): на кадре `clock.beat(0) + 3` набрано 3 знака команды; после набора и 2 кадров — первая строка вывода;
  - Editor с `ghost`: до `accept` новые строки цвета `T.faint`, после — `T.ink`;
  - Diff: строки `+` имеют заливку `T.ok`, `-` — `T.err`; заголовок содержит `+N −M` из диффа;
  - **Review Focus 3:** исходники `frames/*.tsx` не содержат `useState` и `useEffect` (тест читает файлы папки);
  - все `font-size` в разметке ≥ 24.
- [ ] **Step 2:** `npx vitest run video/term/frames` — FAIL.
- [ ] **Step 3:** Написать кадры и `index.ts`.
- [ ] **Step 4:** `npx vitest run video/term/frames` — PASS.
- [ ] **Step 5:** Добавить в `term-check` по сцене каждого кадра на настоящих записях (`s02-sets`: `dev`, `route`, `fix`), снять кадры середины, посмотреть: читаемость, переносы, обрезка. Исправить и снять ещё раз.
- [ ] **Step 6: Commit** — `video: кадры терминала, редактора и диффа`.

### Task 6: Кадры записей — Agent, GitLog, Browser

**Files:**
- Create: `course/video/term/frames/Agent.tsx`, `course/video/term/frames/GitLog.tsx`, `course/video/term/frames/Browser.tsx`
- Modify: `course/video/term/frames/index.ts`
- Test: `course/video/term/frames/frames2.test.tsx`

**Interfaces:**
- Consumes: Задачи 4–5 (`Window`, `wrapMono`, `FrameDef`).
- Produces:

```ts
export type AgentSpec = { type: 'agent'; session: string; event: string /* agent */; mode?: 'Plan' | 'Manual' | 'Accept edits'; chat?: boolean; ask?: string[] /* id шагов с вопросом [y / n] */; diffLines?: number /* по умолчанию 6 */; at: { prompt: number; steps: number[] /* по шагу события */; reply: number } }
// части: 'frame', 'prompt', 'step:<id>', 'reply', 'mode'
export type GitLogSpec = { type: 'gitlog'; rows: { session: string; event: string /* commit */; at: number }[]; heads?: { at: number; branch: string; commit: string }[]; dirty?: { at: number; until: number; text: string } }
// части: 'commit:<event>', 'head:<branch>', 'dirty'
export type BrowserSpec = { type: 'browser'; session: string; event: string /* browser */; console?: boolean; at: { page: number; action?: number; console?: number } }
// части: 'frame', 'url', 'page', 'field:<label>', 'button:<label>', 'console', 'console:<k>'
```

Поведение:
- `Agent` — сессия Claude Code в тёмном окне: запрос `> …` набирается; шаги — строки как на схеме `ch1_agent_session`: `read` → «Reading <путь>», `file` → «Edited <путь> (+N −M)» и первые `diffLines` строк диффа под ней, `run` → `Run "<cmd>"? [y / n]` (если id в `ask`, затем «y») и вывод, `commit` → `Run "<cmd>"? [y / n]` и вывод; ответ (`reply`) — абзацем `soft`; `mode` — подпись режима в нижней строке окна. `chat: true` — без шагов: запрос, ответ и код из диффа первого шага `file` блоком.
- `GitLog` — как `git log --graph`: строка = точка, короткий хеш, сообщение; ветка не `main` — второй дорожкой, линия прорисовывается за 19 кадров; `heads` — метки веток переезжают к коммиту за 18 кадров; `dirty` — пунктирная строка «незакоммиченные правки: <text>» цвета `warn`.
- `Browser` — окно браузера: строка адреса `localhost:3000<путь>`, страница векторно (заголовок `title`, подписи и значения `fields`, кнопки `buttons`, строки `before` → `after` на реплике `action`); `console: true` — снизу панель «Console»: сообщения `console` (ошибки — `err`, со значком ✕) появляются на реплике `at.console`.
- `problems`: неверный вид события; `at.steps.length !== event.steps.length`; id из `ask` не среди шагов; коммит из `heads` не среди `rows`; текст не помещается.

- [ ] **Step 1: Тесты** (фикстура Задачи 5, дополненная агентом, коммитами в двух ветках и событием `browser`):
  - Agent: строки шагов — `Reading app/page.tsx`, `Edited app/api/sets/route.ts (+N −M)` с числами из диффа фикстуры, `Run "npm test"? [y / n]` только для шага из `ask`; `chat` — нет строк «Reading»;
  - GitLog: коммит ветки `sets-form` — правее коммитов `main`; метка `head:main` на кадре `beat(at) + 18` стоит у нового коммита;
  - Browser: часть `field:Вес, кг` содержит значение `60 кг`; до `action` видны строки `before`, после — `after`; сообщение консоли с типом `error` цвета `T.err`;
  - `problems` ловит несовпадение числа шагов и неизвестный id в `ask`;
  - части внутри `SAFE`, `font-size` ≥ 24, нет `useState`/`useEffect` (тот же тест папки).
- [ ] **Step 2:** `npx vitest run video/term/frames` — FAIL.
- [ ] **Step 3:** Написать кадры, добавить в `FrameSpec` и `FRAMES`.
- [ ] **Step 4:** `npx vitest run video/term/frames` — PASS.
- [ ] **Step 5:** Сцены в `term-check` на записях (`s02-sets`: `ask-fix`, `save-bad` с консолью; коммиты `c-start`, `c-idea`, `c-claude`, `c-form`, `c-mini` и `heads` для `merge`) — снять, посмотреть, исправить, снять ещё раз.
- [ ] **Step 6: Commit** — `video: кадры агента, истории git и браузера`.

### Task 7: Кадры без записей — Figure, Board, Agenda, Recap

**Files:**
- Create: `course/video/term/frames/Figure.tsx`, `course/video/term/frames/svg.ts`, `course/video/term/frames/Board.tsx`, `course/video/term/frames/Agenda.tsx`, `course/video/term/frames/Recap.tsx`
- Modify: `course/video/term/frames/index.ts`
- Test: `course/video/term/frames/frames3.test.tsx`, `course/video/term/frames/svg.test.ts`

**Interfaces:**
- Consumes: Задачи 4–6; `content/figures/_defs.svg` (маркеры стрелок); `bookSection`.
- Produces:

```ts
export function splitSvg(svg: string): { viewBox: [number, number, number, number]; children: string[]; minFont: number } // svg.ts: верхние дочерние элементы по порядку, самый мелкий font-size (атрибуты и корневой по умолчанию)
export type FigureSpec = { type: 'figure'; svg: string /* ?raw */; crop?: [number, number, number, number]; reveal?: { from: number; to: number }; focus?: { at: number; name: string; rect: [number, number, number, number] }[] }
// части: 'frame', 'focus:<name>'
export type BoardSpec = { type: 'board'; title?: string;
  table?: { head: string[]; rows: string[][]; at: number[]; mark?: { at: number; row: number; tone?: 'ok' | 'err' | 'warn' }[] };
  cards?: { title: string; text: string[]; at: number; tone?: 'ok' | 'err' | 'warn' }[];
  scale?: { left: string; right: string; items: { label: string; pos: number; at: number }[]; marker?: { at: number; pos: number }[] } }
// части: 'title', 'row:<k>', 'card:<k>', 'item:<k>', 'marker'
export type AgendaSpec = { type: 'agenda'; at?: number[] }        // пункты — ctx.lesson.chapters без первой и последней
// части: 'item:<k>'
export type RecapSpec = { type: 'recap'; items: { text: string; at: number }[] }  // внизу — разделы ctx.lesson.book по bookSection
// части: 'item:<k>', 'book'
```

Поведение:
- `Figure`: схема (или её `crop`) вписывается в `SAFE`; элементы появляются по порядку между репликами `reveal.from` и `reveal.to` (по умолчанию все к `beat(0) + 19`); у `<path>` линия прорисовывается (`pathLength="1"`, `stroke-dashoffset`); `focus` приглушает остальное до 35 % и обводит часть рамкой `ink` 2 px; обёртка задаёт у себя все переменные `--fig-*`, `--accent`, `--ink`, `--paper`, которые использует `src/styles/figures.css`, тёмными значениями `T` и подключает `_defs.svg`.
- `Board`: таблица по образцу книги (линия сверху 2 px `ink`, под шапкой и снизу `soft`, между строками `edge`), карточки, шкала с бегущим маркером; текст Golos Text не мельче 28 px; длинный текст — по `wrapText`.
- `Agenda`: «Что узнаете» и строки глав как лог: номер `02`, название; появляются по `at` или очередью от `beat(0)`.
- `Recap`: «Итог» и пункты по `at`; внизу «Книга:» и разделы `bookSection` (глава · название).
- `problems`: `scale × minFont < 24` (схему нужно обрезать `crop`); `crop` вне `viewBox`; текст карточки/таблицы не помещается; раздел книги не найден.

- [ ] **Step 1: Тесты**
  - `splitSvg` на `content/figures/1.1.svg`: `viewBox` `[0, 0, 760, 410]`, `children.length` > 10, `minFont` = 11.5;
  - Figure `1.1.svg` без `crop` → в `problems` строка о мелком тексте; с `crop: [0, 40, 760, 370]` — без неё (масштаб ≥ 24 / 11.5);
  - **Review Focus 2:** стиль обёртки Figure содержит каждую переменную `var(--…)`, встречающуюся в `src/styles/figures.css` (тест читает файл и сверяет), со значением из `T`;
  - Board: строка таблицы с `mark` tone `err` имеет цвет `T.err`; карточка шире `SAFE` → `problems`;
  - Agenda на `ctx.lesson.chapters = ['Что узнаете', 'А', 'Б', 'Итог']` — две строки «А», «Б»;
  - Recap выводит названия разделов `bookSection` для `ctx.lesson.book`;
  - части внутри `SAFE`, `font-size` ≥ 24, нет `useState`/`useEffect`.
- [ ] **Step 2:** `npx vitest run video/term/frames` — FAIL.
- [ ] **Step 3:** Написать кадры и `svg.ts`, добавить в `FrameSpec` и `FRAMES`.
- [ ] **Step 4:** `npx vitest run video/term/frames` — PASS.
- [ ] **Step 5:** Сцены в `term-check` (`abc_restaurant` с фокусом, таблица из трёх строк, шкала, Agenda, Recap) — снять, посмотреть, исправить, снять ещё раз.
- [ ] **Step 6: Commit** — `video: кадры схем книги, доски, плана и итога`.

### Task 8: Урок как данные и общий ролик

**Files:**
- Create: `course/video/term/lesson.ts` (типы), `course/video/term/build.ts`, `course/video/term/problems.ts`, `course/video/term/LessonVideo.tsx`, `course/video/term/fixture-lesson.ts`, `course/video/term/fixture-lesson.gen.json` (снимок), `course/scripts/lesson-stills.mjs`
- Modify: `course/video/types.ts`, `course/video/lib/timeline.ts`, `course/src/course/summary.ts` (`videoMeta`), `course/video/Root.tsx` (композиция `term-lesson` из фикстуры вместо `term-check`; `term-check` удалить)
- Test: `course/video/term/build.test.ts`, `course/video/term/problems.test.ts`, `course/video/lib/timeline.test.ts`, `course/src/course/summary.test.ts` (дописать)

**Interfaces:**
- Consumes: `buildScript`, `PACE` (`course/video/kit/script.ts`), `FRAMES`, `FrameSpec` (Задачи 5–7), камера, шапка, субтитры, `Verdict` (Задача 4), `find` (Задача 3).
- Produces:

```ts
// types.ts (совместимо со старыми роликами)
export type VideoChapter = { from: number; title: string }
export type VideoScript = { id: string; fps: 30; width: 1280 | 1920; height: 720 | 1080; scenes: { id: string; durationInFrames: number }[]; cues: Cue[]; hotspots: VideoHotspot[]; chapters?: VideoChapter[]; poster?: number }
// lesson.ts
export type Role = 'intro' | 'explain' | 'example' | 'mistake' | 'summary'
export type LessonScene = { id: string; role: Role; frame: FrameSpec; lines: string[]; camera?: { at: number; target: string | 'whole' }[]; spots?: { at: number; until?: number; target: string; title: string; text: string }[]; verdict?: { at: number; kind: 'wrong' | 'right' }[] }
export type LessonChapter = { id: string; title: string; book?: string[]; scenes: LessonScene[] }
export type Lesson = { id: string; kind: 'chapter' | 'day'; title: string; book: string[]; chapters: LessonChapter[] }
// build.ts
export type BuiltScene = { id: string; chapter: number; start: number; duration: number; clock: Clock; scene: LessonScene }
export function buildLesson(lesson: Lesson, ctx?: FrameCtx): { script: VideoScript; scenes: BuiltScene[] }
// problems.ts
export function lessonProblems(lesson: Lesson, opts?: { minFrames?: number; checkLength?: boolean /* по умолчанию true */; ctx?: FrameCtx }): string[]
// LessonVideo.tsx
export function LessonVideo(p: { lesson: Lesson; debugSpots?: boolean }): JSX.Element
```

Правила `buildLesson`:
- тайминг сцен — `buildScript(lesson.id, сцены всех глав по порядку, …)`; затем `width: 1920, height: 1080`;
- `chapters` — `{ from: начало первой сцены главы, title }`;
- `poster` — середина первой сцены с ролью `example`;
- камера сцены: ключ на `beat(at)` с `focusShot(часть)` (`'whole'` — `WHOLE`), движение 18 кадров; без ключей — `WHOLE`;
- пояснение: окно `beat(at)` … `beat(until)` (по умолчанию конец сцены минус 12 кадров), прямоугольник — часть кадра через `toScreen` при камере на начале окна; кадры ролика — абсолютные;
- `ctx` по умолчанию — `{ find, lesson: { id, title, chapters: названия глав, book } }`.

Правила `lessonProblems` (спецификация §6.2, §9), каждая строка называет сцену:
- первая глава — одна сцена `intro` с кадром `agenda`, последняя — одна сцена `summary` с кадром `recap`;
- ролик главы: 3–5 тематических глав; в каждой сцены по ролям в порядке explain → example → mistake, каждой роли хотя бы одна; не меньше трёх тематических глав содержат сцену с кадром записи (`terminal`, `editor`, `diff`, `agent`, `gitlog`, `browser`) — в остальных тема может не позволять (спецификация §6.2 «где тема это позволяет»);
- ролик дня: в главе «Пример» есть сцена с кадром записи;
- ролик дня: главы «Что строим сегодня» (intro) → «Пример» (example) → «Подводный камень» (mistake) → «Проверьте у себя» (summary);
- длина в рамках вида и ≥ `minFrames` (если `checkLength` не `false`);
- реплика: не быстрее 15 знаков/с (`text.length / ((to − from) / 30)`), не больше двух строк субтитров (`wrapText` 40 px, 1500 px);
- `problems` каждого кадра (`FRAMES[type].problems`);
- цели камеры и пояснений — существующие части кадра; пояснение внутри кадра 1920×1080, не в первых и последних 12 кадрах сцены, камера во время окна пояснения стоит;
- `at` ≤ числа реплик сцены − 1 у камеры, пояснений, вердиктов и спеки кадра;
- сцена `mistake` — хотя бы один `wrong` и один `right` в `verdict`, `wrong` раньше;
- пояснений: глава ≥ 2, день ≥ 1;
- разделы `lesson.book` и `chapter.book` найдены `bookSection`;
- промежуток между соседними моментами (начало сцены, `moments` кадра, ключи камеры, вердикты, конец сцены) ≤ 120 кадров;
- `validateScript(script)` пуст.

`LessonVideo`: фон `desk`; один `<svg viewBox="0 0 1920 1080">`; сцены в `<Sequence>` по `start`; внутри группа камеры (`cameraAt`) с кадром; смена сцены 8 кадров (растворение и сдвиг 16 px), на границе глав — `Header` прокручивает номер (12 кадров); `Verdict` у сцен `mistake`; `TermSubtitles` поверх; `debugSpots` рисует рамки пояснений.

`lesson-stills.mjs <compositionId> <script.gen.json> <outDir>`: один раз собирает бандл (`@remotion/bundler`, `webpackOverride`), читает сценарий из JSON и снимает (`@remotion/renderer` `renderStill`, браузер headless_shell) кадр середины каждой сцены и кадр середины каждого пояснения с `debugSpots: true`; печатает пути.

- [ ] **Step 1: Тесты**
  - `timeline.test.ts`: `validateScript` ловит главы не по возрастанию, первую главу не с 0, главу за концом, `poster` за концом;
  - `build.test.ts` на `fixture-lesson.ts` (урок «главы» из 5 глав на записях `s02-sets`): `width`/`height` 1920/1080; `chapters.map(c => c.title)` = названия глав; `chapters[0].from === 0`; `poster` — середина первой сцены `example`; прямоугольник пояснения по части `cmd:dev` при `WHOLE` равен части; при фокусе — `toScreen` с этим фокусом;
  - `problems.test.ts`: фикстура с `checkLength: false` → `[]`; без него — строка о длине (фикстура короче 5400 кадров); поломки по одной, каждая даёт свою строку — сцена `mistake` без `right`; пояснение в последних 12 кадрах; реплика 200 знаков (три строки субтитров); камера движется во время пояснения; цель камеры `cmd:nope`; глава без `example`; промежуток 5 с без изменений; раздел `s999`;
  - снимок сценария фикстуры: `toMatchFileSnapshot('./fixture-lesson.gen.json')` (нужен `lesson-stills.mjs`);
  - `summary.test.ts`: `videoMeta` у сценария с `poster` берёт его как `posterFrame`.
- [ ] **Step 2:** `npx vitest run video/term video/lib src/course` — FAIL.
- [ ] **Step 3:** Написать типы, `buildLesson`, `lessonProblems`, `LessonVideo`, фикстуру, `lesson-stills.mjs`; поправить `types.ts`, `timeline.ts`, `summary.ts`, `Root.tsx`.
- [ ] **Step 4:** `npx vitest run` — PASS; `npx tsc -b`, `npm run lint` — чисто.
- [ ] **Step 5:** `node scripts/lesson-stills.mjs term-lesson video/term/fixture-lesson.gen.json <scratchpad>/stills/fixture` — посмотреть кадры: шапка, смена главы, вердикт, субтитры, рамки пояснений на своих местах.
- [ ] **Step 6: Commit** — `video: урок как данные — сборка, проверки и общий ролик`.

### Task 9: Плеер: главы, пояснения по размеру кадра, без MP4

**Files:**
- Modify: `course/src/video/VideoControls.tsx`, `course/src/video/VideoBlock.tsx`, `course/src/video/HotspotLayer.tsx`, `course/src/styles/video.css`
- Test: `course/src/video/VideoBlock.test.tsx`, `course/src/video/useNarration.test.ts` (дописать)

**Interfaces:**
- Consumes: `VideoChapter`, `VideoScript.chapters`, `poster` (Задача 8).
- Produces:
  - `VideoControls` — новый необязательный проп `chapters?: VideoChapter[]`: под полосой перемотки сегменты (`.video-seek-chapters`, `aria-hidden`), ширина ∝ длине главы, зазор 2 px, пройденное — `ink`; подпись текущей главы `<span class="video-chapter" data-testid="video-chapter">3/7 · Git: история проекта</span>` рядом со временем;
  - `VideoBlock` — под `video-meta` список `<ol class="video-chapters" aria-label="Главы ролика">`, в пункте `<button>` с `<span class="video-chapter-time">м:сс</span>` и названием; текущая глава — `aria-current="true"`; нажатие — `seek(from)` и `play()`;
  - `HotspotLayer` — пропы `width`, `height` (размер кадра сценария); проценты от них;
  - у роликов без глав разметка панели и блока прежняя.

- [ ] **Step 1: Тесты** (`VideoBlock.test.tsx`, на сценарии-фикстуре 1920×1080 с тремя главами, зарегистрированном через мок реестра так же, как существующие тесты):
  - сегментов три, их ширины пропорциональны длинам глав;
  - `video-chapter` на кадре внутри второй главы — `2/3 · <название>`;
  - нажатие на кнопку третьей главы: `seekTo(from)` и `play()` у плеера; пункт получает `aria-current`;
  - пояснение с `x: 960, w: 192` у сценария 1920 даёт `left: 50%`, `width: 10%`;
  - у нового ролика (нет `mp4Url`) кнопки «Скачать MP4» нет;
  - старый ролик 1280×720 без глав: сегментов и списка глав нет, пояснения — как раньше;
  - **Review Focus 4** (`useNarration.test.ts`): во время воспроизведения событие `seeked` на начало главы отменяет речь, а следующий `frameupdate` после начала первой реплики главы произносит именно её.
- [ ] **Step 2:** `npx vitest run src/video` — FAIL.
- [ ] **Step 3:** Написать; стили в `video.css` — токенами курса (`--ink`, `--rule`, `--ink-soft`, `--font-ui`), область нажатия пункта главы ≥ 44 px, названия переносятся. Комментарий в `video.css` про «кадр 1280×720» поправить.
- [ ] **Step 4:** `npx vitest run src/video` — PASS; `npm test` — PASS.
- [ ] **Step 5: Commit** — `course: главы роликов на перемотке и списком, пояснения по размеру кадра`.

### Task 10: Ролик `ch-abc` «Как устроено приложение»

**Files:**
- Create: `course/video/lessons/ch-abc/lesson.ts`, `course/video/lessons/ch-abc/Video.tsx`, `course/video/lessons/ch-abc/script.ts`, `course/video/lessons/ch-abc/script.gen.json` (снимок), `course/video/lessons/ch-abc/lesson.test.ts`
- Modify: `course/video/catalog.ts` (запись `ch-abc` → новый урок), `course/src/video/registry.ts` (убрать MP4 `ch-abc`)
- Delete: `course/video/ch-abc/` (старый ролик)

**Interfaces:**
- Consumes: `Lesson`, `buildLesson`, `lessonProblems`, `LessonVideo` (Задача 8); записи `s01-start`, `s02-sets` (id событий — Задача 3); схемы `content/figures/abc_*.svg` через `?raw`.
- Produces: `export const chAbc: Lesson` (lesson.ts); `export const chAbcScript: VideoScript` (script.ts — `import data from './script.gen.json'`); `Video.tsx` — `export default function Video(p: { debugSpots?: boolean }) { return <LessonVideo lesson={chAbc} {...p} /> }`.

Содержание — таблица спецификации §8.2. Главы: «Что узнаете»; «Четыре части приложения» (sa1, sa2); «Git: история проекта» (sa3); «От компьютера к сайту» (sa4); «Как понять, что работает» (sa5); «Слова про ИИ» (sa6); «Итог». Опорные записи:
- четыре части — `ls`, `pkg`, `route`, `page`; ошибка — `env`, `ignored`, `status-env`;
- git — `init`, `status`, `c-start`, `log`, `branch`, `c-form`, `merge`, `diff`; ошибка — `restyle`/`diff-css`/`restore`/`clean`;
- к сайту — `dev`, `save-ok`; схема `abc_envs`;
- работает ли — `save-bad` с консолью, `ask-fix`, `save-hint`;
- слова про ИИ — `ask-form` (Reading, Edited), схема `abc_aiwords`; ошибка — `start-dev`, `scripts`.

- [ ] **Step 1:** Прочитать разделы книги sa1–sa6 (`vibe-coding-na-praktike-2026-10.html`, якоря `id="sa1"` … `id="sa6"`) и прежний сценарий `course/video/ch-abc/script.ts` (темы и уже сверенные факты).
- [ ] **Step 2: Тест**

```ts
test('урок ch-abc проходит проверки', () => {
  expect(lessonProblems(chAbc, { minFrames: 7789 })).toEqual([])
})
test('сценарий для сайта совпадает со сборкой', async () => {
  await expect(JSON.stringify(buildLesson(chAbc).script, null, 1) + '\n').toMatchFileSnapshot('./script.gen.json')
})
```
- [ ] **Step 3:** `npx vitest run video/lessons/ch-abc` — FAIL.
- [ ] **Step 4:** Сценарий: по одной мысли на реплику, каждый факт сверить с книгой; сцены — каркас главы (объяснение → пример → ошибка), в каждой главе хотя бы одна сцена с записью; камера ведёт к тому, о чём реплика; пояснения — на командах и строках, где новичку нужно «а это что?» (не меньше 4).
- [ ] **Step 5:** `npx vitest run video/lessons/ch-abc` — PASS (снимок `script.gen.json` создан).
- [ ] **Step 6:** Каталог: `'ch-abc': { title: 'Как устроено приложение', kind: 'chapter', script: chAbcScript, load: () => import('./lessons/ch-abc/Video') }`; убрать MP4 из `registry.ts`; удалить `course/video/ch-abc/`; `npm test` — PASS.
- [ ] **Step 7: Кадры глазами.** `node scripts/lesson-stills.mjs ch-abc video/lessons/ch-abc/script.gen.json <scratchpad>/stills/ch-abc` — посмотреть каждый кадр: наезды, обрезка, мелкий или нечитаемый текст, пустые углы, рамки пояснений на объектах. Исправить и снять ещё раз, пока не чисто.
- [ ] **Step 8: Commit** — `video: ролик ch-abc в стиле «Репозиторий»`.

### Task 11: Ролик `ch-01` «Вайб-кодинг: шкала, а не выключатель»

**Files:**
- Create: `course/video/lessons/ch-01/lesson.ts`, `Video.tsx`, `script.ts`, `script.gen.json`, `lesson.test.ts` (в той же папке)
- Modify: `course/video/catalog.ts`, `course/src/video/registry.ts`
- Delete: `course/video/ch-01/`

**Interfaces:**
- Consumes: как Задача 10. Produces: `ch01: Lesson`, `ch01Script: VideoScript`, `Video.tsx`.

Содержание — таблица спецификации §8.3. Главы: «Что узнаете»; «Пять режимов» (s5, s12); «Программирование с намерением» (s6, s7); «Модель по карточке» (s8–s11, s77); «Бенчмарки и мини-набор» (s78, s11); «Подписка и API» (s79); «Итог». Опорные записи и схемы:
- режимы — схема `1.1` (с `crop`), Editor с `ghost` на `fix` или `route` (подсказка), Agent `chat` (чат), Agent с `ask` и `mode: 'Manual'` на `ask-fix` (агент с вопросом), GitLog с `c-form` (задача целиком → коммит); ошибка — Board-шкала с зоной риска (вход и права);
- намерение — Editor на `claude-file` (настоящий CLAUDE.md), Agent на `claude-md`; ошибка — Board с запросом «Сделай вход» против запроса с целью, рамками и критерием «готово»;
- модель — схемы `ch1_modelcard`, `ch1_models`; Board-таблица Haiku / Sonnet / Opus 5.5 по книге;
- бенчмарки — схема `ch1_trust`; Editor на `mini-file` (настоящий мини-набор); ошибка — Board-карточки ловушек замеров;
- подписка — Board: абонемент против счётчика, окно в пять часов и недельный лимит, `/usage`; ошибка — сразу API или самый дорогой тариф.

- [ ] **Step 1:** Прочитать разделы s5–s12, s77–s79 и прежний `course/video/ch-01/script.ts`. Все цифры (цены, баллы, лимиты, окна) — из книги.
- [ ] **Step 2:** Тест как в Задаче 10 с `minFrames: 7857`.
- [ ] **Step 3:** `npx vitest run video/lessons/ch-01` — FAIL.
- [ ] **Step 4:** Сценарий и сцены (как Задача 10, Step 4; записи — в главах «Пять режимов», «Программирование с намерением», «Бенчмарки и мини-набор»).
- [ ] **Step 5:** `npx vitest run video/lessons/ch-01` — PASS.
- [ ] **Step 6:** Каталог, реестр, удаление старой папки; `npm test` — PASS.
- [ ] **Step 7:** Кадры глазами — `node scripts/lesson-stills.mjs ch-01 video/lessons/ch-01/script.gen.json <scratchpad>/stills/ch-01`, как Задача 10, Step 7.
- [ ] **Step 8: Commit** — `video: ролик ch-01 в стиле «Репозиторий»`.

### Task 12: Проверка пилота, правила набора, публикация

**Files:**
- Create: `course/video/term/README.md`, `course/e2e/video-chapters.spec.ts`
- Modify: `course/e2e/video.spec.ts` (если старые проверки дня 1 опирались на старые ролики)

**Interfaces:**
- Consumes: всё выше.

- [ ] **Step 1: e2e глав** (`video-chapters.spec.ts`):
  - день 1: у ролика «Как устроено приложение» есть список «Главы ролика» из 7 пунктов; нажатие на третий пункт — время ролика не меньше начала главы и ролик идёт (кнопка «Пауза» видна); `data-testid="video-chapter"` начинается с `3/7`;
  - **Review Focus 1:** день 1 при ширине 390 px — `document.documentElement.scrollWidth <= window.innerWidth`, список глав виден;
  - в светлой теме (`localStorage['vibe-course-theme'] = 'light'`) фон кадра ролика (`.video-frame` первый `svg` → вычисленный цвет фона композиции) — `#141619`.
- [ ] **Step 2:** `npm run e2e` — новые тесты PASS, старые PASS (поправить старые, если они проверяли состав старых роликов дня 1, а не поведение).
- [ ] **Step 3:** `course/video/term/README.md` — правила для следующих 25 роликов: каркас, кадры и их спеки, как записывать сессии, как снимать кадры, уроки ревью этого пилота.
- [ ] **Step 4:** Полная проверка из `course/`: `npm test`, `npm run lint`, `npx tsc -b`, `npm run e2e` — всё зелёное, вывод прочитан.
- [ ] **Step 5:** `npm run build && node scripts/artifact-page.mjs dist out/artifact-video` — страница собрана; открыть `out/artifact-video/page.html` через Playwright на `#/day/1`, запустить оба ролика, посмотреть кадры.
- [ ] **Step 6: Commit** — `video: правила набора «Репозиторий» и e2e глав`.
- [ ] **Step 7:** Опубликовать `course/out/artifact-video/page.html` отдельной страницей Claude («Вайб-курс — пилот роликов»), отправить ветку `video/terminal` (`git push -u origin video/terminal`) и открыть черновой пул-реквест в `design/terminal`.
