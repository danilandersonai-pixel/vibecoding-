# Ролики «Репозиторий»: неделя 1 (дни 2–7) — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Переделать 11 роликов недели 1 (`ch-02`, `ch-12`, `ch-03`, `ch-06`, `pilot-rls`, `ch-05`, `ch-04`, `ch-08`, `ch-09`, `ch-10`, `ch-11`) в стиле «Репозиторий» по образцу утверждённого пилота, на настоящих записях работы над приложением тренера.

**Architecture:** Набор пилота (`course/video/term/`, урок как данные, `buildLesson`, `lessonProblems`, плеер с главами) не меняется по сути. Сначала доводится основа: рекордер учитывает файлы, изменённые командами, держит браузер на всю сессию, сохраняет состояние после каждой сессии и пишет цепочку с середины, поднимает локальную базу Postgres 16 в роли Supabase. Урок подключает только свои записи. Затем записываются сессии `s03`–`s12` (приложение тренера растёт по программе дней 2–7), и по ним собираются 11 уроков.

**Tech Stack:** Remotion 4.0.537, React 19, TypeScript, Vitest 5, Playwright 1.56.1, Node 22, git 2.43, Next.js 16.4.3 (`create-next-app@16.4.3`), PostgreSQL 16 (`/usr/lib/postgresql/16/bin`), `pg` (node-postgres).

**Spec:** `docs/superpowers/specs/2026-10-28-video-lessons-v2-design.md` (разделы 1–7, 9; §1 и §11: остальные 25 роликов — после пилота, планами по неделям). Образцы и правила: `course/video/lessons/ch-abc`, `course/video/lessons/ch-01`, `course/video/term/README.md`. Пилот утверждён автором («Так делаем»).

## Global Constraints

- Все пакеты Remotion — строго `4.0.537`. Браузер рендера — `/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`; `playwright install` не запускать никогда.
- Кадр 1920 × 1080, 30 кадров/с. Текст в кадре не мельче 24 px, линии не тоньше 2 px. Содержимое — в прямоугольнике x 96–1824, y 96–872; шапка y 32–80; субтитры y 896–1040. Цвета — только из `course/video/term/theme.ts`; тема ролика всегда тёмная.
- Темп прежний: `PACE` (14 знаков/с, вступление 0,3 с, пауза 0,25 с, хвост 1 с, реплика не короче 2,2 с) не меняется. Субтитры не быстрее 15 знаков/с, не больше двух строк. В кадре что-то меняется не реже чем раз в 120 кадров.
- Каркас ролика главы (спецификация §6.2): «Что узнаете» (`agenda`) → 3–5 тематических глав (`explain` → `example` → `mistake`) → «Итог» (`recap`). Кадр записи — не меньше чем в трёх тематических главах. Пояснений по нажатию ≥ 2.
- Длина ролика главы — 5400–8100 кадров и не меньше прежнего ролика той же темы: `ch-02` ≥ 7751, `ch-12` ≥ 7894, `ch-03` ≥ 7951, `ch-06` ≥ 8029, `pilot-rls` ≥ 6098, `ch-05` ≥ 7921, `ch-04` ≥ 7738, `ch-08` ≥ 7987, `ch-09` ≥ 7905, `ch-10` ≥ 7984, `ch-11` ≥ 7731.
- Каждая строка вывода, диффа, файла и страницы в кадре — из записи сессии. Слова агента (запрос, ответ) и содержимое файлов, которые пишут агент и человек, — авторский текст; всё остальное выполняется по-настоящему. Придуманного вывода нет.
- Интерфейс Claude Code в кадре — только по схемам книги `ch1_agent_session` и `dk_modes` (`Reading …`, `Edited … (+N −M)`, `Run "…"? [y / n]`, режимы Plan / Manual / Accept edits). Других английских строк интерфейса не выдумывать.
- Весь текст кадров, реплик и интерфейса — по-русски. Факты, цифры и названия — из разделов книги `vibe-coding-na-praktike-2026-10.html`, указанных у главы; при расхождении права книга. Латинские слова в репликах — с произношением в `SAY` (`course/src/video/narration.ts`).
- Действующие лица записей (одни на всю неделю): тренер Марина (`marina@example.com`) — подопечные Анна (`anna@example.com`) и Олег (`oleg@example.com`); тренер Игорь (`igor@example.com`) — подопечная Света (`sveta@example.com`). Пароль у всех — `demo-password`. Автор коммитов — «Анна», как в пилоте. Эталоны в `docs/etalons.md` — без названий настоящих продуктов («Эталон А», «Эталон Б», «Эталон В»).
- Supabase в записях заменяет локальный PostgreSQL 16 на порту 54322 (порт базы `supabase start`) со слоем Supabase: роли `anon`, `authenticated`, `service_role`, схема `auth` с `auth.users` и `auth.uid()`. SQL миграций — такой, какой принял бы Supabase. В роликах это сказано честно (подпись на доске «локальная база вместо Supabase»), когда кадр показывает базу.
- `package.json` приложения тренера меняется только командами npm (`npm install`, `npm pkg set`), не шагами `write`/`edit`.
- Ключи и секреты в записях — заведомо ненастоящие и не похожие на форматы настоящих сервисов (`demo-ai-key-not-real`, `demo-secret-not-real-…`): ветка уходит на GitHub, сканер секретов GitHub не должен на них срабатывать.
- Не меняются: книга, ветка `claude/interactive-course`, ролики недель 2–3 (кроме совместимых правок общих типов), записи `s01-start` и `s02-sets` — только через перезапись рекордером (Задача 2).
- Сообщения коммитов курса — по-русски, в конце строки `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` и `Claude-Session: https://claude.ai/code/session_01DQgsSEqLgHui6HevL5dFCC`.
- Проверки курса (из `course/`): `npm test`, `npm run lint`, `npx tsc -b`, `npm run e2e` — зелёные в конце каждой задачи, где задача их касается.

## Review Focus

1. Перезапись в другой день (у npm вышли новые версии пакетов): запись с середины цепочки (`--from`) оставляет записи, состояния и хеши коммитов предыдущих сессий байт в байт прежними (тест — Задача 2).
2. Рекордер упал посреди сессии с базой: Postgres и dev-сервер остановлены, порты 54322 и 3000 свободны, следующая запись стартует без ручной уборки (тест — Задача 3).
3. Вход в браузере записи: cookie живёт между шагами браузера одной сессии и не переходит в следующую сессию (тест — Задача 1).
4. На странице дня два новых ролика с общими записями: каждый ролик грузит только свои записи, SVG-id не пересекаются (тест — Задача 4; e2e дня 2 — Задача 27).
5. Телефон 390 px на днях 2–7: нет горизонтальной прокрутки, список глав переносится, пояснение не закрывает кадр (тест — Задачи 5 и 27, e2e).

---

## Сессии недели 1 — сводка

| Сессия | Дата (`date`) | `db` | Что делает | Для роликов |
|---|---|---|---|---|
| `s03-spec` | `2026-10-29T10:00:00+03:00` | — | эталоны, вопросы в Plan, спецификация, расплывчатый запрос против ЦКОКФ, «Мои тренировки», план экрана тренера | `ch-02`, `ch-12` |
| `s04-rules` | `2026-10-30T10:00:00+03:00` | — | системные шрифты; отрицательный вес, правка ломает запятую, откат, тест сначала, разбор веса | `ch-03` |
| `s05-proto` | `2026-10-30T15:00:00+03:00` | — | прототип в ветке на выдуманных данных, ключ в браузере и его исправление, показ и новый виток | `ch-06` |
| `s06-auth` | `2026-10-31T10:00:00+03:00` | да | модель данных, вход для двух ролей, чужой подопечный по адресу, RLS, проверка и тест | `pilot-rls` |
| `s07-cycle` | `2026-11-01T10:00:00+03:00` | да | основной цикл, дата «как у большинства», тест на объём и его проверка, сквозной тест | `ch-05` |
| `s08-debug` | `2026-11-01T15:00:00+03:00` | да | падение со стектрейсом, причина, деление пополам, рефакторинг, наставник, журнал запросов, миграция с вопросом | `ch-05`, `ch-04`, `ch-11` |
| `s09-audit` | `2026-11-02T10:00:00+03:00` | да | график, инъекция, подбор пароля, выдуманный пакет, сканер секретов, N+1, проверка перед слиянием | `ch-08` |
| `s10-care` | `2026-11-02T15:00:00+03:00` | да | имена на любом языке, данные о здоровье в журнале, лицензии, метка ИИ в коммите | `ch-09` |
| `s11-ship` | `2026-11-03T10:00:00+03:00` | да | PWA, сборка и запуск, таблица паритета, план недель 2–3, карта проекта | `pilot-rls`, `ch-12` |
| `s12-agent` | `2026-11-03T15:00:00+03:00` | да | задача фоновому агенту, ветка, подгонка теста, приёмка, тесты из требований, дизайн-токены | `ch-10`, `ch-11` |

В таблицах сессий: «агент» — шаг `agent` (запрос одной строкой, ответ — авторский текст, вложенные шаги пишутся с `by: "agent"`); «человек» — обычный шаг. Режим агента в кадре задаёт урок (`mode`), но запрос пишется под этот режим: Plan — только чтение и ответ-план, Manual — с шагом-командой под вопрос `[y / n]`, Accept edits — правки без вопроса. Id шагов — постоянные: на них ссылаются уроки.

---

### Task 1: Записи: файлы после команд, браузер на сессию, адрес после перехода

**Files:**
- Modify: `course/scripts/session/record.mjs`, `course/scripts/session/record.test.ts`, `course/video/sessions/types.ts`, `course/video/sessions/check.ts`, `course/video/sessions/check.test.ts`, `course/video/term/frames/browserPlan.ts`, `course/video/term/frames/Browser.tsx`
- Modify: `course/video/term/README.md` (§4, §7: снять ограничение «после `git restore` файл не правят»)

**Interfaces:**
- Produces: `RunEvent.files?: { path: string; blob: string | null }[]` — файлы, которые команда создала, изменила (`blob` — хеш нового содержимого) или удалила (`null`); сравниваются отслеживаемые и неотслеживаемые неигнорируемые файлы проекта до и после команды (`git ls-files --cached --others --exclude-standard` + `git hash-object --no-filters --stdin-paths`); вне репозитория (до `git init`) поле не пишется; по пути, по алфавиту. `BrowserEvent.urlAfter?: string` — адрес страницы после нажатий (пишется, если отличается от `url`). Кадр `browser` в строке адреса показывает `url` до `at.action` и `urlAfter ?? url` после.
- Сверка `sessionProblems`: после `run` с `files` содержимое этих путей считается неизвестным, но с известным хешем; следующее событие `file` по пути проверяет `gitBlobHash(before ?? '')` (для `null` — `before === null`) против этого хеша, `read` — `gitBlobHash(text)`; дальше сверка идёт от их содержимого.
- Браузер записи: один Chromium и один контекст на сессию (создаётся на первом шаге `browser`, закрывается в конце сессии и при ошибке), `locale: 'ru-RU'`, `timezoneId: 'Europe/Moscow'`; cookie и `localStorage` живут между шагами сессии.

- [ ] **Step 1: Тесты** — в `record.test.ts`:
  - `it('run: файлы, которые команда создала, изменила и удалила')` — в учебной цепочке после коммита `a.txt` и `c.txt` шаг `run 'echo x > a.txt && touch b.txt && rm c.txt'` даёт `files` = `[{ path: 'a.txt', blob: gitBlobHash('x\n') }, { path: 'b.txt', blob: gitBlobHash('') }, { path: 'c.txt', blob: null }]`; команда без изменений — без поля `files`.
  - `it('edit после команды, изменившей файл: дифф от нового содержимого, сверка чистая')` — `write a.txt` (`a`) → commit → `run 'printf "b\\n" > a.txt'` → `edit a.txt` (`find: 'b'`, `replace: 'c'`): дифф правки — от `b`, `sessionProblems([...])` = `[]`.
  - `it('cookie живёт между шагами браузера одной сессии и не переходит в следующую')` — сервер учебной цепочки (`node -e` http) на `/set` ставит cookie `who=anna`, на `/` печатает cookie: второй шаг той же сессии видит `who=anna`, первый шаг следующей сессии — нет.
  - `it('urlAfter — адрес после перехода по нажатию')` — кнопка формы ведёт на `/done`: `urlAfter` = `http://localhost:3000/done`.
  - `it('браузер: локаль ru-RU и пояс Europe/Moscow')` — страница печатает `navigator.language` и `Intl.DateTimeFormat().resolvedOptions().timeZone`: `ru-RU`, `Europe/Moscow`.
  В `check.test.ts`: `test('файл изменён командой, а правка начинается со старого содержимого — ошибка «содержимое до правки другое»')` и `test('файл удалён командой, затем создан заново — сверка чистая')`.
- [ ] **Step 2:** `npx vitest run scripts/session video/sessions/check.test.ts` — новые тесты FAIL.
- [ ] **Step 3:** Реализовать в `record.mjs`, `types.ts`, `check.ts`; кадр `browser` — смена адреса на `at.action` (тест `browserPlan.test.ts`: `urlAfter` в строке адреса после действия).
- [ ] **Step 4:** `npx vitest run scripts/session video/sessions video/term` — PASS; `npm test` — PASS (старые записи без новых полей остаются валидными).
- [ ] **Step 5:** README набора: §4 — поля `files`, `urlAfter`, браузер на сессию; §7 — убрать строку про `git restore`.
- [ ] **Step 6: Commit** — `рекордер: файлы после команд, браузер на всю сессию, адрес после перехода`.

### Task 2: Состояние после сессии и запись с середины цепочки

**Files:**
- Modify: `course/scripts/session/record.mjs`, `course/scripts/record-session.mjs`, `course/scripts/session/record.test.ts`, `demo-app/README.md`, `course/video/term/README.md` (§4)
- Create (рекордером): `demo-app/state/s01-start.tar.gz`, `demo-app/state/s02-sets.tar.gz`
- Regenerate (рекордером): `course/video/sessions/s01-start.json`, `course/video/sessions/s02-sets.json`, `demo-app/app/**`

**Interfaces:**
- Consumes: Задача 1.
- Produces: `recordChain(defs, { workdir, npmCache, runLimitMs, state? })`, где `state?: { save: (id: string, project: string) => Promise<void>; restore?: { id: string; load: (project: string) => Promise<void> } }`. Состояние сессии — архив папки проекта без `node_modules`, `.next`, `test-results`, `playwright-report` (с `.git` и игнорируемыми файлами вроде `.env.local`), `tar -czf`. При `restore` проект разворачивается из архива, затем, если есть `package-lock.json`, выполняется `npm ci --prefer-offline --no-audit --no-fund` (не записывается), и цепочка идёт с сессии, следующей за `restore.id`.
- CLI: `node scripts/record-session.mjs` — вся цепочка (как раньше) и состояния всех сессий; `node scripts/record-session.mjs --from <id>` — от состояния сессии `from` у `<id>` записывает `<id>` и все следующие; записи и состояния сессий раньше `<id>` не трогает. Нет архива нужного состояния — ошибка «Нет состояния сессии «…» (demo-app/state/….tar.gz): запишите цепочку целиком». Неизвестный id — ошибка со списком id.

- [ ] **Step 1: Тесты** (`record.test.ts`, учебная цепочка a → b → c без npm):
  - `it('состояние: без node_modules и .next, с .git и .env.local')` — в архиве сессии a есть `.git/HEAD` и `.env.local`, нет `node_modules/`, `.next/`.
  - `it('запись с середины: b и c от состояния a — те же записи и хеши коммитов, что у всей цепочки')` — **Review Focus 1**: записи b и c совпадают с записями из полного прогона (поля `recorded`, вывод с временем — равны, потому что время не печатается учебными командами), хеши коммитов равны.
  - `it('--from: нет состояния предыдущей сессии — понятная ошибка')` и `it('--from: неизвестный id — ошибка со списком сессий')` — через запуск CLI на временной папке сессий (параметры путей CLI — переменные окружения `RECORD_SESSIONS_DIR`, `RECORD_OUT_DIR`, `RECORD_APP_DIR`, `RECORD_STATE_DIR`, по умолчанию — нынешние пути).
- [ ] **Step 2:** `npx vitest run scripts/session` — FAIL.
- [ ] **Step 3:** Реализовать; `demo-app/README.md` — раздел «Запись с середины цепочки» (зачем: прежние записи не меняются от новых версий npm; команда; где состояния).
- [ ] **Step 4:** `npx vitest run scripts/session` — PASS.
- [ ] **Step 5: Перезапись пилота один раз.** `node scripts/record-session.mjs` (вся цепочка: появятся состояния `s01-start`, `s02-sets`). Затем `npx vitest run video/sessions video/lessons`. Если версии пакетов изменились и разъехались диапазоны строк или снимки `script.gen.json` уроков `ch-abc`, `ch-01` — поправить диапазоны в уроках (не записи), обновить снимки (`-u`) и снять кадры изменившихся сцен (`node scripts/lesson-stills.mjs …`), посмотреть их. Пилотные уроки по-прежнему проходят `lessonProblems` с прежними `minFrames`.
- [ ] **Step 6:** `npm test` — PASS.
- [ ] **Step 7: Commit** — `рекордер: состояние после сессии и запись с середины цепочки; пилот перезаписан` (с архивами, записями, `demo-app/app`).

### Task 3: Локальная база в записях (Postgres 16 в роли Supabase)

**Files:**
- Create: `course/scripts/session/supabase-local.sql`
- Modify: `course/scripts/session/record.mjs`, `course/scripts/session/record.test.ts`, `demo-app/README.md`, `course/video/term/README.md` (§4)

**Interfaces:**
- Consumes: Задачи 1–2.
- Produces: поле сессии `db?: true`. Перед первым шагом такой сессии рекордер:
  1. создаёт папку для базы через `mkdtemp` в `os.tmpdir()` и отдаёт её пользователю `postgres` (`chown`);
  2. `runuser -u postgres -- /usr/lib/postgresql/16/bin/initdb -D <dir>/data -U postgres --auth=trust -E UTF8 --locale=C.UTF-8`;
  3. `runuser -u postgres -- /usr/lib/postgresql/16/bin/pg_ctl -D <dir>/data -o "-p 54322 -c listen_addresses=127.0.0.1 -k <dir>" -l <dir>/log -w start`;
  4. выполняет `supabase-local.sql`, затем файлы проекта `supabase/migrations/*.sql` по имени и `supabase/seed.sql`, если есть (как `supabase db reset`); их вывод не записывается, ошибка SQL останавливает запись с текстом ошибки и именем файла;
  5. добавляет в окружение команд сессии `PGHOST=127.0.0.1`, `PGPORT=54322`, `PGUSER=postgres`, `PGDATABASE=postgres`, `DATABASE_URL=postgresql://postgres@127.0.0.1:54322/postgres`.
  В конце сессии, при ошибке шага и в обработчике выхода — `pg_ctl stop -m fast` и удаление папки. Рекордер запущен не от root — ошибка «Сессия с db: true: Postgres запускается от пользователя postgres, рекордер нужно запускать от root».
- `supabase-local.sql` — слой, который у Supabase есть до первой миграции: `create extension if not exists pgcrypto`; роли `anon` (nologin), `authenticated` (nologin), `service_role` (nologin, bypassrls); `grant usage on schema public` и права по умолчанию на таблицы, последовательности и функции схемы `public` этим трём ролям (как у Supabase); схема `auth`, таблица `auth.users (id uuid primary key default gen_random_uuid(), email text unique not null, encrypted_password text not null, created_at timestamptz not null default now())`; функции `auth.uid()` (`nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid`) и `auth.role()`; `grant usage on schema auth` ролям `anon`, `authenticated`, `service_role`, `grant execute` на функции. Комментарий в начале файла: что это и почему (Docker нет — спецификация §3).

- [ ] **Step 1: Тесты** (`record.test.ts`, `describe('recordChain: база')`):
  - `it('db: psql видит базу, auth.uid() берёт sub из request.jwt.claims')` — шаг `run` с `psql -Atc "select set_config('request.jwt.claims', '{\"sub\":\"00000000-0000-0000-0000-000000000001\"}', false), auth.uid()"` печатает этот uuid; `run 'echo $DATABASE_URL'` — `postgresql://postgres@127.0.0.1:54322/postgres`.
  - `it('следующая сессия с db: миграции и seed проекта применены до первого шага')` — сессия a пишет `supabase/migrations/0001.sql` (`create table t (n int)`) и `supabase/seed.sql` (`insert into t values (7)`), коммит; сессия b (`db: true`) первым шагом `psql -Atc 'select n from t'` → `7`.
  - `it('ошибка шага в сессии с db: база остановлена, порт 54322 свободен')` — **Review Focus 2**: после первого шага сессии с `db` идёт шаг непонятного вида (`{ id: 'x', nope: 1 }`), `recordChain` бросает ошибку; после неё `connect(54322)` отказывает, и новая сессия с `db` стартует.
  - `it('сессия без db не получает PGHOST и DATABASE_URL')`.
- [ ] **Step 2:** `npx vitest run scripts/session` — FAIL.
- [ ] **Step 3:** Реализовать; `demo-app/README.md` — «Локальная база вместо Supabase»: что поднимается, порт, что слой `supabase-local.sql` повторяет из Supabase и чего не повторяет (нет PostgREST, нет настоящего Auth: вход в приложении — свой маршрут с проверкой пароля через `crypt`).
- [ ] **Step 4:** `npx vitest run scripts/session` — PASS; `npm test` — PASS.
- [ ] **Step 5: Commit** — `рекордер: локальная база Postgres 16 со слоем Supabase для сессий с db`.

### Task 4: Урок подключает только свои записи

**Files:**
- Modify: `course/video/term/lesson.ts` (тип `Lesson`), `course/video/term/build.ts`, `course/video/term/problems.ts`, `course/video/term/fixture-lesson.ts`, `course/video/lessons/ch-abc/lesson.ts`, `course/video/lessons/ch-01/lesson.ts`, `course/video/sessions/index.ts` (комментарий: только для тестов и скриптов), `course/package.json` (`"engines": { "node": ">=22.18" }`)
- Test: `course/video/term/build.test.ts`, `course/video/term/imports.test.ts` (новый)

**Interfaces:**
- Produces: `Lesson.sessions: SessionRecord[]` (обязательное). Урок импортирует нужные JSON сам: `import s01 from '../../sessions/s01-start.json'` и `sessions: [s01, s02] as SessionRecord[]`. `buildLesson` ищет события через `makeFind(lesson.sessions)`; ссылка сцены на сессию не из списка — проблема `lessonProblems`: «Сцена «…»: запись «s03-spec» не подключена к уроку (sessions)», а не исключение.

- [ ] **Step 1: Тесты:**
  - `build.test.ts`: `test('сцена ссылается на запись не из lesson.sessions — понятная проблема, а не исключение')`.
  - `imports.test.ts`: `test('код набора и уроков не импортирует общий список записей')` — ни один файл `video/term/**/*.ts(x)` и `video/lessons/**/*.ts(x)` (кроме `*.test.ts`) не импортирует `video/sessions/index` (`from '…/sessions'` или `'…/sessions/index'`); импорт `…/sessions/types` и `…/sessions/<id>.json` разрешён. **Review Focus 4.**
- [ ] **Step 2:** `npx vitest run video/term` — FAIL.
- [ ] **Step 3:** Реализовать; пилотные уроки и учебный урок набора получают `sessions`.
- [ ] **Step 4:** `npx vitest run video` — PASS, снимки `script.gen.json` пилотных уроков не изменились; `npm test`, `npx tsc -b` — PASS.
- [ ] **Step 5:** `npm run build` — в `dist/assets` кусок урока `ch-abc` не содержит записей, которых урок не подключил (проверить `grep -l '"s02-sets"' dist/assets/*.js` — только куски, где он нужен; результат записать в отчёт).
- [ ] **Step 6: Commit** — `video: урок подключает только свои записи; engines Node ≥ 22.18`.

### Task 5: Набор: доводка по итогам пилота

**Files:**
- Modify: `course/video/term/frame.ts`, `course/video/term/frames/terminalPlan.ts`, `agentPlan.ts`, `browserPlan.ts`, `agendaPlan.ts`, `recapPlan.ts`, `course/video/term/problems.ts`, `course/video/term/chrome/Header.tsx`, `course/video/term/lesson.ts` (doc-комментарий `verdict`), `course/src/video/HotspotLayer.tsx`, `course/src/styles/video.css`
- Test: соответствующие `*.test.ts(x)`, `course/e2e/video-chapters.spec.ts`

**Interfaces:**
- Produces: `FrameDef.appears?(spec, sceneTiming): Map<string, number>` — кадр сцены, с которого часть видна (для `terminal`: команда, вывод и строки вывода — с учётом набора 30 знаков/с и шага очереди 2 кадра; `agent`: `prompt`, `step:<id>`, `reply`; `browser`: `console`, `console:<k>`, поля и кнопки после `at.page`). `lessonProblems` для каждого пояснения с целью из `appears`: «Пояснение «…» открывается на кадре N, а «line:save-bad:3» появляется на кадре M».

- [ ] **Step 1: Тесты:**
  - `problems.test.ts`: `test('пояснение раньше появления строки вывода — проблема с кадрами')` и `test('пояснение после появления — без проблем')`.
  - `Header.test.tsx`: `test('правая часть шапки и название главы меняются на одном кадре')` (смена главы с длинным названием: оба меняются на кадре `at`, ни один не опаздывает).
  - `agendaPlan.test.ts`: `test('кикер «Что узнаете» помещается по ширине')`; `recapPlan.test.ts`: `test('блок книги не выходит выше SAFE при семи выводах')`.
  - `HotspotLayer.test.tsx`: `test('рамка пояснения рисуется снаружи зоны, не закрывая её край')` (рамка — `outline` с `outline-offset` ≥ рамки, а не `border` внутри).
  - e2e `video-chapters.spec.ts`: `test('телефон 390 px: открытое пояснение стоит под кадром и не закрывает его')` — **Review Focus 5**: на паузе на кадре пояснения нажать зону; верх панели пояснения не выше низа `.video-stage`; нет горизонтальной прокрутки.
- [ ] **Step 2:** соответствующие `npx vitest run …` и `npx playwright test e2e/video-chapters.spec.ts` — FAIL.
- [ ] **Step 3:** Реализовать: `appears` у трёх кадров и проверка; согласованная смена шапки; проверки ширины кикера и блока книги; рамка пояснения снаружи зоны; на экранах уже 600 px панель пояснения открывается под кадром (а не поверх). Doc-комментарий `verdict` в `lesson.ts` — по нынешнему поведению (серия сцен `mistake`, README §1).
- [ ] **Step 4:** Пилотные уроки: `npx vitest run video/lessons` — если новая проверка нашла ранние пояснения, сдвинуть их `at` в уроке (не проверку) и обновить снимки; снять кадры пояснений (`lesson-stills.mjs`) и посмотреть.
- [ ] **Step 5:** `npm test`, `npm run lint`, `npx tsc -b`, `npm run e2e` — PASS.
- [ ] **Step 6:** README набора: §2 (`appears`), §7 — убрать закрытые пункты.
- [ ] **Step 7: Commit** — `video: пояснение не раньше цели, согласованная шапка, пояснение под кадром на телефоне`.

---

## Порядок задачи сессии (Задачи 6–15)

Общий для всех сессий недели; контролёр передаёт этот раздел исполнителю вместе с брифом задачи. У каждой задачи — своя таблица шагов и свой тест.

**Files** (для сессии `<id>`):
- Create: `demo-app/sessions/<id>.mjs` (комментарий в начале — что делает сессия, как у `s02-sets.mjs`)
- Modify: `course/video/sessions/index.ts` (запись `<id>` по порядку цепочки), `course/video/sessions/sessions.test.ts` (тест задачи), `demo-app/README.md` (строка о сессии)
- Generated (рекордером): `course/video/sessions/<id>.json`, `demo-app/state/<id>.tar.gz`, `demo-app/app/**`

Шаги:
1. Тест задачи — в `sessions.test.ts` (у задачи — его имя и проверки).
2. `npx vitest run video/sessions` — FAIL (записи нет).
3. Написать `<id>.mjs` по таблице: `id`, `from` (предыдущая сессия), `date`, `db` (по сводке), шаги с id из таблицы, в том же порядке. Код приложения, который пишут агент и человек, должен по-настоящему работать: `npm run lint` и `npx tsc --noEmit` приложения чистые (исполнитель проверяет их в черновом прогоне). Записать: `node scripts/record-session.mjs --from <id>` (из `course/`).
4. `npx vitest run video/sessions` — PASS. Запись не совпала с ожиданием (другая строка, другой код выхода) — править шаги сессии и перезаписывать, а не JSON и не тест.
5. `npm test` — PASS: уроки, которые ссылаются на прежние сессии, не задеты (запись с середины не меняет прежних записей).
6. Commit — сообщение из задачи (вместе с записью, состоянием и `demo-app/app`).

### Task 6: Сессия `s03-spec` — спецификация и запрос по ЦКОКФ

**Files:** по «Порядку задачи сессии» для `s03-spec`.

**Interfaces:**
- Consumes: рекордер (Задачи 1–3), состояние `s02-sets`.
- Produces: события ниже (id постоянные).

| id | шаг |
|---|---|
| `etalons` | человек, write `docs/etalons.md`: эталоны А, Б, В (без названий продуктов); у каждого — сценарии, экраны, какие данные, жалобы из публичных отзывов; внизу — «что берём только как идею» (шаги 1–2 чистой комнаты: только публичный материал, без кода и текстов эталона) |
| `c-etalons` | commit `Разбор эталонов: сценарии, экраны, жалобы` |
| `questions` | агент: «Прочитай docs/idea.md и docs/etalons.md. Прежде чем я напишу спецификацию первой версии, задай мне вопросы — по одному на каждое решение, которое за меня принимать нельзя. Код не меняй»; шаги `q-idea` (read `docs/idea.md`), `q-etalons` (read `docs/etalons.md`); ответ — пять вопросов |
| `spec-file` | человек, write `docs/spec.md` своими словами: для кого; берём / меняем / откладываем; своё отличие из жалоб; три сценария первой версии (тренер назначает тренировку; подопечный видит свои тренировки и вписывает подходы; тренер видит прогресс), у каждого — критерий «готово»; чего нет в первой версии |
| `c-spec` | commit `Спецификация первой версии своими словами` |
| `dev` | run `npm run dev`, until `Ready` |
| `ask-vague` | агент: «Сделай экран тренировок»; шаг `vague-page` (write `app/trainings/page.tsx`: «решение большинства» — таблица тренировок всех людей с выдуманными именами, кнопки «Добавить» и «Фильтр» без действия) |
| `vague-view` | browser `/trainings` |
| `vague-status` | run `git status --short` (`?? app/trainings/`) |
| `drop-vague` | run `rm -r app/trainings` |
| `ask-ckokf` | агент, запрос по ЦКОКФ одной строкой: цель — экран «Мои тренировки» подопечного; контекст — сценарий 2 из docs/spec.md, входа пока нет, текущая подопечная — константа; ограничения — только свои тренировки, данные пока в `lib/workouts.ts`; критерий — Анна видит свои три тренировки, тренировки Олега — нет; формат — список изменений; шаги `ck-spec` (read `docs/spec.md`), `ck-data` (write `lib/workouts.ts`: подопечные Анна и Олег, у Анны 3 тренировки — среди них «Ноги» 3 подхода × 10 × 50 кг, у Олега 2; `CURRENT_CLIENT = 'anna'`), `ck-page` (write `app/workouts/page.tsx`) |
| `workouts-view` | browser `/workouts` — три тренировки Анны, ни одной Олега |
| `ask-volume` | агент: «На /workouts под каждой тренировкой покажи объём — сумму вес × повторы по подходам. Пример: три подхода по 10 раз с весом 50 кг — 1500 кг. Меняй только app/workouts/page.tsx и функцию объёма в lib/workouts.ts»; шаги `vol-fn` (edit `lib/workouts.ts`: `volume()`), `vol-page` (edit `app/workouts/page.tsx`) |
| `volume-view` | browser `/workouts` — у «Ноги» «Объём: 1500 кг» |
| `c-workouts` | commit `Экран «Мои тренировки» по спецификации` |
| `plan-coach` | агент: «Спланируй экран тренера «Подопечные» по docs/spec.md: какие файлы, какие данные, как проверить. Код не меняй»; шаги `p-spec` (read `docs/spec.md`), `p-data` (read `lib/workouts.ts`); ответ — план из четырёх шагов и вопрос, откуда брать список подопечных до входа |
| `log3` | run `git log --oneline` |

- [ ] **Step 1: Тест** (`sessions.test.ts`): `test('s03: расплывчатый запрос — чужие тренировки, ЦКОКФ — только свои, объём 1500')` — `vague-view.after` содержит имя, которого нет в `lib/workouts.ts`; `workouts-view.after` содержит три названия тренировок Анны и ни одного названия Олега; `volume-view.after` содержит `1500 кг`; `vague-status.out` = `['?? app/trainings/']`; у `drop-vague` в `files` — `{ path: 'app/trainings/page.tsx', blob: null }`; `questions.steps` = `['q-idea', 'q-etalons']`.
- [ ] **Steps 2–6:** по «Порядку задачи сессии» (`--from s03-spec`); commit `demo-app: сессия s03 — эталоны, спецификация, запрос по ЦКОКФ`.

### Task 7: Сессия `s04-rules` — последние 30 % и безопасный шаг

**Files:** по «Порядку задачи сессии» для `s04-rules`.

**Interfaces:**
- Consumes: состояние `s03-spec`. Produces: события ниже.

| id | шаг |
|---|---|
| `fonts` | человек, edit `app/layout.tsx`: убрать `next/font/google` (Geist) — сборке не нужна сеть; шрифт — системный |
| `fonts-css` | человек, edit `app/globals.css`: системный стек шрифтов вместо переменных Geist |
| `c-fonts` | commit `Системные шрифты: сборка без загрузки из сети` |
| `dev` | run `npm run dev`, until `Ready` |
| `neg` | browser `/`: fill `{ 'Вес, кг': '-5', 'Повторы': '8' }`, click `Сохранить подход` — в списке «-5 кг × 8» |
| `ask-neg` | агент: «Отрицательный вес сохраняется: ввела -5, в списке «-5 кг × 8». Нужно: вес больше нуля, иначе ошибка «Вес должен быть больше нуля»»; шаг `neg-fix` (edit `app/api/sets/route.ts`: разбор через `Number(weight)` с проверкой `> 0` — правка теряет замену запятой; это и есть «шаг вперёд — два назад») |
| `neg-view` | browser `/`: -5 и 8 → «Вес должен быть больше нуля» |
| `c-neg` | commit `Вес больше нуля` |
| `comma` | browser `/`: `62,5` и 8 → «Вес должен быть числом, например 60» |
| `log4` | run `git log --oneline -3` |
| `revert` | run `git revert --no-edit HEAD` |
| `comma-ok` | browser `/`: `62,5` и 8 → в списке «62.5 кг × 8» |
| `vitest` | run `npm install -D vitest` |
| `ask-test` | агент: «Сначала тест, потом код. Вынеси разбор веса в lib/weight.ts: parseWeight(text) возвращает число или текст ошибки. Случаи: "60" → 60, "62,5" → 62.5, "-5" → «Вес должен быть больше нуля», "60 кг" и "" → «Вес должен быть числом, например 60». Запусти тест до кода и после»; шаги `test-file` (write `lib/weight.test.ts`), `test-red` (run `npx vitest run` — падает: нет модуля), `weight-file` (write `lib/weight.ts`), `test-green` (run `npx vitest run` — 5 тестов прошли), `route-weight` (edit `app/api/sets/route.ts`: `parseWeight`) |
| `diff4` | run `git diff app/api/sets/route.ts` |
| `test-script` | run `npm pkg set scripts.test="vitest run"` |
| `test-all` | run `npm test` |
| `c-weight` | commit `Разбор веса в lib/weight.ts с тестами` |
| `neg2` | browser `/`: -5 → «Вес должен быть больше нуля» |
| `comma2` | browser `/`: `62,5` → сохранено |
| `log5` | run `git log --oneline` |

- [ ] **Step 1: Тест:** `test('s04: −5 сохраняется, правка ломает запятую, откат возвращает, тест сначала красный, потом зелёный')` — `neg.after` содержит `-5 кг × 8`; `neg-view.after` содержит `Вес должен быть больше нуля`; `comma.after` — `Вес должен быть числом`; `revert.out[0]` начинается с `[main `; `comma-ok.after` — `62.5 кг × 8`; `test-red.code` ≠ 0; `test-green.code` = 0 и вывод содержит `5 passed`; у `revert` в `files` есть `app/api/sets/route.ts`; `neg2`, `comma2` — как ожидается; в `server` событий браузера нет строк про Google Fonts.
- [ ] **Steps 2–6:** по «Порядку задачи сессии» (`--from s04-rules`); commit `demo-app: сессия s04 — последние 30 %, откат и тест сначала`.

### Task 8: Сессия `s05-proto` — прототип за вечер

**Files:** по «Порядку задачи сессии» для `s05-proto`.

**Interfaces:** Consumes: состояние `s04-rules`. Produces:

| id | шаг |
|---|---|
| `proto-branch` | run `git switch -c proto/coach` |
| `proto-doc` | человек, write `docs/prototype.md`: вопрос прототипа («поймёт ли тренер с первого взгляда, кому пора написать»), таймбокс 2 часа, тонкий срез — один экран «Подопечные», данные выдуманные, «готова выбросить», список упрощений |
| `ask-proto` | агент: запрос по шаблону старта прототипа из раздела s36 книги (прототип, а не продукт; вопрос; один экран; выдуманные данные в памяти, без входа и базы; стек проекта; в конце — список упрощений); шаги `fake-data` (write `lib/fake-clients.ts`: шесть подопечных Марины с датой последней тренировки), `proto-page` (write `app/coach/page.tsx`: «Подопечные» — имя и «последняя тренировка: N дн. назад») |
| `c-proto` | commit `Прототип: список подопечных` |
| `ask-advice` | агент: «Добавь на /coach кнопку «Совет ИИ» у подопечного: запрос к сервису ИИ, ключ — в .env.local»; шаги `key-env` (edit `.env.local`: `NEXT_PUBLIC_AI_KEY=demo-ai-key-not-real`), `advice-btn` (write `app/coach/advice-button.tsx`, `'use client'`, читает `process.env.NEXT_PUBLIC_AI_KEY`), `advice-use` (edit `app/coach/page.tsx`) |
| `build` | run `npm run build` |
| `leak` | run `grep -rl demo-ai-key-not-real .next/static \|\| echo "не найдено"` — путь куска в `.next/static` |
| `ask-key-fix` | агент: «Ключ попал в браузер: grep нашёл его в .next/static. Ключ — только на сервере: маршрут /api/advice, переменная без NEXT_PUBLIC_»; шаги `key-route` (write `app/api/advice/route.ts`, `process.env.AI_KEY`), `key-env-fix` (edit `.env.local`: `AI_KEY=…` вместо `NEXT_PUBLIC_AI_KEY=…`), `key-btn-fix` (edit `app/coach/advice-button.tsx`: `fetch('/api/advice')`) |
| `build2` | run `npm run build` |
| `leak2` | run та же команда, что `leak` — `не найдено` |
| `c-advice` | commit `Совет ИИ: ключ только на сервере` |
| `dev` | run `npm run dev`, until `Ready` |
| `proto-view` | browser `/coach` |
| `ask-iter` | агент: отзыв Марины после показа: «Сверху — те, кто не тренировался больше 7 дней, с пометкой «Пора написать»»; шаг `iter-page` (edit `app/coach/page.tsx`) |
| `proto-view2` | browser `/coach` — «Пора написать» у двоих сверху |
| `journal` | человек, edit `docs/prototype.md`: журнал решений — показ Марине, что изменили, вывод: «развивать: строить по-настоящему на базе в день 4» |
| `c-proto2` | commit `Прототип: сверху те, кому пора написать` |
| `main` | run `git switch main` |
| `branches` | run `git log --oneline --graph --all -8` |

- [ ] **Step 1: Тест:** `test('s05: ключ с NEXT_PUBLIC_ находится в сборке, после исправления — нет')` — `leak.out[0]` начинается с `.next/static/`; `leak2.out` = `['не найдено']`; `build.code` и `build2.code` = 0; `proto-view2.after` содержит `Пора написать`; `branches.out` содержит `proto/coach` и `main`.
- [ ] **Steps 2–6:** по «Порядку задачи сессии» (`--from s05-proto`); commit `demo-app: сессия s05 — прототип, ключ в браузере и его исправление`.

### Task 9: Сессия `s06-auth` — вход для двух ролей и RLS

**Files:** по «Порядку задачи сессии» для `s06-auth` (`db: true`).

**Interfaces:** Consumes: состояние `s05-proto`, база (Задача 3). Produces:

| id | шаг |
|---|---|
| `pg` | run `npm install pg` |
| `pg-types` | run `npm install -D @types/pg` |
| `ask-schema` | агент: «Модель данных первой версии по docs/spec.md: тренер, подопечный, тренировка, подход. Миграция для Supabase в supabase/migrations/0001_init.sql и демо-данные в supabase/seed.sql: тренеры Марина и Игорь, у Марины подопечные Анна и Олег, у Игоря — Света»; шаги `schema-file` (write `0001_init.sql`: `profiles` (id uuid → `auth.users`, `role` coach/client, `name`), `clients` (id bigint identity, `coach_id`, `user_id`, `name`), `workouts` (id identity, `client_id`, `title`, `day` date), `sets` (id identity, `workout_id`, `weight numeric check > 0`, `reps int check > 0`); RLS не включена), `seed-file` (write `seed.sql`: пять пользователей в `auth.users` с `crypt('demo-password', gen_salt('bf'))`, профили, подопечные с id 1 Анна, 2 Олег, 3 Света, тренировки из `lib/workouts.ts`) |
| `db-init` | run `psql -f supabase/migrations/0001_init.sql` |
| `db-seed` | run `psql -f supabase/seed.sql` |
| `tables` | run `psql -c '\dt public.*'` |
| `ask-login` | агент: «Вход для двух ролей: /login (почта и пароль), POST /api/login, сессия — подписанная cookie; тренер после входа — на /clients, подопечный — на /workouts. Запросы к базе — от имени вошедшего, как в Supabase: роль authenticated и auth.uid()»; шаги `db-lib` (write `lib/db.ts`: `Pool(DATABASE_URL)`; `asUser(uid, fn)` — `begin`, `set local role authenticated`, `set_config('request.jwt.claims', '{"sub":…,"role":"authenticated"}', true)`, `fn`, `commit`), `session-lib` (write `lib/session.ts`: подпись uid через HMAC-SHA256 `SESSION_SECRET`, `currentUser()`), `login-route` (write `app/api/login/route.ts`: проверка через `crypt` от владельца базы, как сервис входа; 200 `{ role }` и cookie, 401 «Неверная почта или пароль»), `login-page` (write `app/login/page.tsx`, клиентская форма: «Почта», «Пароль», кнопка «Войти»), `clients-page` (write `app/clients/page.tsx`: подопечные вошедшего тренера, `where coach_id = $1`), `client-page` (write `app/clients/[id]/page.tsx`: `where id = $1` — без проверки владельца; нет строки → `notFound()`, страница `app/clients/[id]/not-found.tsx` с текстом «Подопечный не найден») |
| `env-db` | человек, edit `.env.local`: `DATABASE_URL=postgresql://postgres@127.0.0.1:54322/postgres`, `SESSION_SECRET=demo-secret-not-real-session` |
| `dev` | run `npm run dev`, until `Ready` |
| `login-marina` | browser `/login`: fill `{ 'Почта': 'marina@example.com', 'Пароль': 'demo-password' }`, click `Войти` → `/clients`: Анна, Олег |
| `attack` | browser `/clients/3` — карточка Светы (подопечной Игоря) |
| `ask-rls` | агент: «Защиту — в базе: включи RLS на всех таблицах и политики: тренер видит и добавляет своих подопечных, их тренировки и подходы; подопечный видит себя, свои тренировки и вписывает свои подходы. Применить миграцию — с моего подтверждения»; шаги `rls-sql` (write `supabase/migrations/0002_rls.sql`: `enable row level security` на четырёх таблицах; политики select/insert/update на недели 1 по смыслу запроса, через `auth.uid()`), `rls-apply` (run `psql -f supabase/migrations/0002_rls.sql`) |
| `as-marina-file` | человек, write `supabase/tests/as-marina.sql`: `begin; set local role authenticated; select set_config('request.jwt.claims', '{"sub":"<uuid Марины из seed>"}', true); select id, name from clients order by id; rollback;` |
| `rls-check` | run `psql -f supabase/tests/as-marina.sql` — 1 Анна, 2 Олег |
| `attack2` | browser `/clients/3` → «Подопечный не найден» |
| `rls-on` | run `psql -c "select tablename, rowsecurity from pg_tables where schemaname = 'public' order by 1"` — везде `t` |
| `ask-rls-test` | агент: «Тест на чужие данные: от имени Марины — двое подопечных, от имени Игоря Анны не видно, без входа — ничего»; шаги `rls-test-file` (write `test/rls.test.ts`, vitest, `// @vitest-environment node`, `DATABASE_URL` из окружения), `rls-test-run` (run `npx vitest run test/rls.test.ts`) |
| `c-auth` | commit `Вход для двух ролей, модель данных и RLS` |
| `log6` | run `git log --oneline -5` |

- [ ] **Step 1: Тест:** `test('s06: без RLS чужой подопечный открывается, с RLS — нет')` — `login-marina.urlAfter` оканчивается на `/clients`, `after` содержит `Анна` и `Олег`, не содержит `Света`; `attack.after` содержит `Света`; `attack2.after` содержит `Подопечный не найден` и не содержит `Света`; `rls-check.out` содержит строки с `Анна` и `Олег` и не содержит `Света`; `rls-on.out` — четыре таблицы, у каждой `t`; `rls-test-run.code` = 0; `tables.out` перечисляет `clients`, `profiles`, `sets`, `workouts`.
- [ ] **Steps 2–6:** по «Порядку задачи сессии» (`--from s06-auth`); commit `demo-app: сессия s06 — вход для двух ролей, чужой подопечный и RLS`.

### Task 10: Сессия `s07-cycle` — основной цикл и тесты

**Files:** по «Порядку задачи сессии» для `s07-cycle` (`db: true`).

**Interfaces:** Consumes: состояние `s06-auth`. Produces:

| id | шаг |
|---|---|
| `dev` | run `npm run dev`, until `Ready` |
| `ask-assign` | агент: «Основной цикл по сценариям 1–2 из docs/spec.md: тренер на /clients/[id] назначает тренировку (поля «Название», «Дата», кнопка «Назначить»); подопечный видит свои тренировки из базы на /workouts и вписывает подходы на /workouts/[id] (поля «Вес, кг», «Повторы», кнопка «Сохранить подход», разбор веса — parseWeight); объём — в lib/volume.ts»; шаги `assign-action` (write `app/clients/[id]/actions.ts`), `client-page2` (edit `app/clients/[id]/page.tsx`: форма и список тренировок, дата — `new Date(day).toLocaleDateString()` — «как у большинства»), `workouts-db` (write `app/workouts/page.tsx`: из базы через `asUser`), `workout-page` (write `app/workouts/[id]/page.tsx`), `sets-action` (write `app/workouts/[id]/actions.ts`), `volume-lib` (write `lib/volume.ts`: `volume(sets)` — сумма вес × повторы, начальное значение 0), `drop-fake` (run `git rm -q lib/workouts.ts`) |
| `diff-stat` | run `git diff --stat HEAD` |
| `diff-assign` | run `git diff HEAD -- 'app/clients/[id]/page.tsx'` |
| `login-marina` | browser `/login` → `/clients` (как в `s06`) |
| `assign` | browser `/clients/1`: fill `{ 'Название': 'Грудь и спина', 'Дата': '2026-11-02' }`, click `Назначить` — дата в списке в американском виде (`11/2/2026`) |
| `ask-date` | агент: «Даты показываются как 11/2/2026, а приложение русское: нужно «2 ноября»»; шаги `dates-lib` (write `lib/dates.ts`: `formatDay` через `toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })`), `date-use-1`, `date-use-2` (edit страниц тренера и подопечного) |
| `assign-view` | browser `/clients/1` — «2 ноября» |
| `login-anna` | browser `/login` за Анну → `/workouts`: «Грудь и спина» и её прежние тренировки |
| `log-set` | browser `/workouts/<id «Грудь и спина»>`: `60` и `8`, click `Сохранить подход` → «60 кг × 8», объём 480 кг (id тренировки известен из seed и порядка вставки; при перезаписи он тот же) |
| `ask-volume-test` | агент: «Тест на объём по требованию: три подхода по 10 раз с весом 50 кг — 1500 кг; пустая тренировка — 0»; шаги `volume-test` (write `lib/volume.test.ts`), `volume-run` (run `npx vitest run lib/volume.test.ts`) |
| `break` | человек, edit `lib/volume.ts`: `weight * reps` → `weight + reps` (проверить, что тест ловит поломку) |
| `red` | run `npm test` — тест объёма красный |
| `unbreak` | run `git restore lib/volume.ts` |
| `green` | run `npm test` |
| `pw` | run `npm install -D @playwright/test@1.56.1` |
| `ask-e2e` | агент: «Сквозной тест сценария: Марина назначает тренировку Анне, Анна вписывает подход, Марина видит объём»; шаги `vitest-config` (write `vitest.config.ts`: `exclude` папки `e2e`), `pw-config` (write `playwright.config.ts`: `baseURL http://localhost:3000`, `webServer` с `reuseExistingServer: true`), `e2e-file` (write `e2e/cycle.spec.ts`), `e2e-run` (run `npx playwright test`) |
| `c-cycle` | commit `Основной цикл: назначить тренировку, вписать подходы; тесты` |

- [ ] **Step 1: Тест:** `test('s07: дата как у большинства, затем по-русски; тест ловит поломку; сквозной тест проходит')` — `assign.after` содержит `11/2/2026`; `assign-view.after` содержит `2 ноября`; `log-set.after` содержит `60 кг × 8` и `480`; `volume-run.code` = 0; `red.code` ≠ 0, `green.code` = 0; `e2e-run.code` = 0 и вывод содержит `1 passed`; `unbreak.files` содержит `lib/volume.ts`.
- [ ] **Steps 2–6:** по «Порядку задачи сессии» (`--from s07-cycle`); commit `demo-app: сессия s07 — основной цикл и тесты`.

### Task 11: Сессия `s08-debug` — отладка, рефакторинг, наставник

**Files:** по «Порядку задачи сессии» для `s08-debug` (`db: true`).

**Interfaces:** Consumes: состояние `s07-cycle`. Produces:

| id | шаг |
|---|---|
| `dev` | run `npm run dev`, until `Ready` |
| `ask-volumes` | агент: «На странице подопечного у каждой тренировки — объём»; шаг `volumes-page` (edit `app/clients/[id]/page.tsx`: подходы одним запросом через `json_agg`, объём — `volume(w.sets)`; у тренировки без подходов `json_agg` даёт `null`) |
| `login-marina` | browser `/login` → `/clients` |
| `assign2` | browser `/clients/1`: fill `{ 'Название': 'Ноги', 'Дата': '2026-11-04' }`, click `Назначить` — страница падает; в `server` — `TypeError` и стектрейс с `app/clients/[id]/page.tsx` |
| `ask-cause` | агент: запрос содержит дословно строку ошибки и первую строку стектрейса из `assign2.server` и «Найди причину, пока ничего не исправляй»; шаг `cause-read` (read `app/clients/[id]/page.tsx`); ответ — причина: `json_agg` без подходов даёт `null` |
| `ask-fix-cause` | агент: «Исправь причину в запросе, а не проверкой в разметке»; шаг `cause-fix` (edit: `coalesce(json_agg(…) filter (where s.id is not null), '[]')`) |
| `crash-ok` | browser `/clients/1` — «Ноги», объём 0 |
| `c-fix` | commit `Объём тренировок у тренера; тренировка без подходов не роняет страницу` |
| `ask-round` | агент: «Объём показывай целым числом»; шаг `round-fix` (edit `lib/volume.ts`) |
| `c-round` | commit `Объём — целым числом` |
| `ask-simplify` | агент: «Упрости lib/volume.ts»; шаг `simplify` (edit: `reduce` без начального значения — пустой массив теперь бросает `TypeError`) |
| `c-simplify` | commit `Упростить подсчёт объёма` |
| `ask-label` | агент: «Подпись «Объём, кг»»; шаг `label` (edit страницы) |
| `c-label` | commit `Подпись «Объём, кг»` |
| `ask-hint` | агент: «У тренировки без подходов — «Подходов пока нет»»; шаг `hint` (edit `app/workouts/[id]/page.tsx`) |
| `c-hint` | commit `Подсказка «Подходов пока нет»` |
| `test-red` | run `npm test` — «пустая тренировка — 0» красный |
| `bisect-start` | run `git bisect start HEAD HEAD~4` |
| `bisect-run` | run `git bisect run npx vitest run lib/volume.test.ts` — первый плохой коммит «Упростить подсчёт объёма» |
| `bisect-reset` | run `git bisect reset` |
| `revert-simplify` | run `git revert --no-edit HEAD~2` |
| `test-green` | run `npm test` |
| `ask-refactor` | агент: «Сделай код своим: на страницах тренера и подопечного одинаковый вывод подходов — вынеси в components/SetList.tsx; поведение не меняй, тесты должны остаться зелёными»; шаги `setlist` (write `components/SetList.tsx`), `use-setlist-1`, `use-setlist-2` (edit двух страниц), `refactor-test` (run `npm test`) |
| `diff-refactor` | run `git diff --stat` |
| `c-refactor` | commit `SetList: один вывод подходов на двух страницах` |
| `ask-mentor` | агент: «Режим наставника: объясни, как работает политика для тренера в supabase/migrations/0002_rls.sql. Код не меняй. В конце задай три вопроса, чтобы проверить, поняла ли я»; шаг `mentor-read` (read `supabase/migrations/0002_rls.sql`); ответ — объяснение простыми словами и три вопроса |
| `prompts` | человек, write `docs/prompts.md`: журнал запросов — дата, задача, запрос, что сработало, что нет; четыре записи (ЦКОКФ для «Моих тренировок», ошибка с текстом целиком, отрицательный вес, «найди причину, не исправляй») и строка еженедельного разбора |
| `ask-migration` | агент: «Добавь подходу заметку до 200 знаков; миграцию применяй с моего подтверждения»; шаги `note-sql` (write `supabase/migrations/0003_set_note.sql`), `note-apply` (run `psql -f supabase/migrations/0003_set_note.sql`), `note-form` (edit `app/workouts/[id]/page.tsx` и `actions.ts`: необязательное поле «Заметка») |
| `c-mentor` | commit `Журнал запросов и заметка к подходу` |

- [ ] **Step 1: Тест:** `test('s08: стектрейс, деление пополам находит «Упростить», откат возвращает зелёные тесты')` — `assign2.server` содержит `TypeError` и `page.tsx`; `ask-cause.prompt` содержит строку `TypeError` из `assign2.server` дословно; `crash-ok.after` содержит `Ноги`; `test-red.code` ≠ 0; `bisect-run.out` содержит `is the first bad commit` и `Упростить подсчёт объёма`; `test-green.code` = 0; `refactor-test.code` = 0; `note-apply.out` содержит `ALTER TABLE`.
- [ ] **Steps 2–6:** по «Порядку задачи сессии» (`--from s08-debug`); commit `demo-app: сессия s08 — отладка, деление пополам, рефакторинг, наставник`.

### Task 12: Сессия `s09-audit` — аудит безопасности

**Files:** по «Порядку задачи сессии» для `s09-audit` (`db: true`).

**Interfaces:** Consumes: состояние `s08-debug`. Produces:

| id | шаг |
|---|---|
| `dev` | run `npm run dev`, until `Ready` |
| `ask-chart` | агент: «График прогресса на странице подопечного: объём по тренировкам столбиками, SVG без библиотек, подписи — даты»; шаги `chart-comp` (write `components/ProgressChart.tsx`), `chart-use` (edit `app/clients/[id]/page.tsx`) |
| `login-marina` | browser `/login` → `/clients` |
| `chart-view` | browser `/clients/1` — «Прогресс: объём по тренировкам» и даты |
| `c-chart` | commit `График прогресса подопечного` |
| `ask-search` | агент: «Поиск подопечного по имени: GET /api/clients/search?q=»; шаг `search-route` (write `app/api/clients/search/route.ts`: «чтобы быстрее» — общий `Pool` владельца базы мимо RLS и склейка строки `ilike '%${q}%'`, без проверки входа) |
| `login-curl` | run `curl -s -c ~/marina.txt -H 'Content-Type: application/json' -d '{"email":"marina@example.com","password":"demo-password"}' http://localhost:3000/api/login` |
| `search-ok` | run `curl -s -b ~/marina.txt -G --data-urlencode 'q=Ан' http://localhost:3000/api/clients/search` — Анна |
| `inject` | run `curl -s -b ~/marina.txt -G --data-urlencode "q=' or 1=1 --" http://localhost:3000/api/clients/search` — все подопечные, и Света |
| `ask-inject-fix` | агент: запрос с командой и ответом `inject` дословно: «Параметры вместо склейки, запрос — от имени вошедшего тренера через asUser, без входа — 401»; шаг `search-fix` (write `route.ts`) |
| `inject2` | run та же команда, что `inject` — `[]` |
| `anon` | run `curl -s -G --data-urlencode 'q=Ан' http://localhost:3000/api/clients/search` — 401 `{"error":"Нужно войти"}` |
| `c-search` | commit `Поиск подопечных: параметры и права вошедшего` |
| `ask-limit` | агент: «Ограничь попытки входа: 5 неудачных за 15 минут, дальше 429 «Слишком много попыток, подождите 15 минут»»; шаги `limit-lib` (write `lib/rate-limit.ts`, в памяти по почте), `limit-use` (edit `app/api/login/route.ts`) |
| `limit-curl` | run `for i in 1 2 3 4 5 6; do curl -s -o /dev/null -w '%{http_code}\n' -H 'Content-Type: application/json' -d '{"email":"igor@example.com","password":"wrong"}' http://localhost:3000/api/login; done` — пять `401`, затем `429` |
| `c-limit` | commit `Не больше пяти неудачных входов за 15 минут` |
| `ask-pkg` | агент: «Как проще проверять права в маршрутах?»; шаг `pkg-read` (read `package.json`); ответ советует поставить пакет с правдоподобным, но несуществующим именем (исполнитель выбирает имя и проверяет, что `npm view` даёт 404) |
| `pkg-check` | run `npm view <это имя>` — `npm error 404` |
| `hook-file` | человек, write `.githooks/pre-commit`: проверка `git diff --cached` на строки вида `…(KEY\|SECRET)… = "…"` длиной от 12 знаков и `-----BEGIN … PRIVATE KEY`; нашла — «Похоже на секрет: <файл>:<строка>» и выход 1 |
| `hook-exec` | run `chmod +x .githooks/pre-commit` |
| `hook-on` | run `git config core.hooksPath .githooks` |
| `ask-pay` | агент: «Заготовка оплаты подписки тренера»; шаг `pay-lib` (write `lib/payments.ts` с `const PAY_SECRET = "demo-secret-not-real-payments-0001"` прямо в коде) |
| `commit-blocked` | run `git add -A && git commit -m 'Оплата подписки'` — хук не пускает, код ≠ 0 |
| `ask-pay-fix` | агент: «Сканер не пустил коммит: секрет в lib/payments.ts. Секрет — в .env.local, в коде — process.env»; шаги `pay-env` (edit `.env.local`), `pay-lib-fix` (edit `lib/payments.ts`) |
| `c-pay` | commit `Заготовка оплаты: секрет из окружения` |
| `seed-load-file` | человек, write `supabase/seed-load.sql`: ещё 10 подопечных Марины с одной-двумя тренировками каждый (для замера) |
| `seed-load` | run `psql -f supabase/seed-load.sql` |
| `ask-last` | агент: «В списке подопечных у каждого — дата последней тренировки. И печатай в журнал сервера каждый запрос к базе — «[sql] …», чтобы видеть, сколько их»; шаги `sql-log` (edit `lib/db.ts`), `last-n1` (edit `app/clients/page.tsx`: отдельный запрос на каждого подопечного) |
| `clients-n1` | browser `/clients` — в `server` 13 строк `[sql]` (1 + 12) |
| `ask-n1-fix` | агент: запрос с числом запросов из `clients-n1.server`: «Один запрос вместо тринадцати»; шаг `last-join` (edit: `left join lateral` / `max(day)`) |
| `clients-1` | browser `/clients` — одна строка `[sql]` на список |
| `c-n1` | commit `Список подопечных одним запросом` |
| `check-script` | run `npm pkg set scripts.check="npm run lint && npx tsc --noEmit && npm test && npm run build"` |
| `check-run` | run `npm run check` |
| `c-check` | commit `npm run check: линтер, типы, тесты и сборка` |

- [ ] **Step 1: Тест:** `test('s09: инъекция отдаёт чужих, после исправления — нет; пятый неудачный вход последний; секрет не проходит в коммит; N+1 → 1')` — `inject.out` содержит `Света`, `inject2.out` = `['[]']`, `anon.out` содержит `Нужно войти`; `limit-curl.out` = `['401','401','401','401','401','429']`; `pkg-check.code` ≠ 0 и вывод содержит `404`; `commit-blocked.code` ≠ 0 и вывод содержит `Похоже на секрет` и `lib/payments.ts`; число строк `[sql]` в `clients-n1.server` ≥ 11, в `clients-1.server` — 1; `check-run.code` = 0.
- [ ] **Steps 2–6:** по «Порядку задачи сессии» (`--from s09-audit`); commit `demo-app: сессия s09 — аудит безопасности`.

### Task 13: Сессия `s10-care` — бережно к людям и данным

**Files:** по «Порядку задачи сессии» для `s10-care` (`db: true`).

**Interfaces:** Consumes: состояние `s09-audit`. Produces:

| id | шаг |
|---|---|
| `dev` | run `npm run dev`, until `Ready` |
| `login-marina` | browser `/login` → `/clients` |
| `ask-add-client` | агент: «Тренер добавляет подопечного: на /clients поле «Имя» и кнопка «Добавить», с проверкой имени»; шаги `name-lib` (write `lib/names.ts`: проверка «как у большинства» — `/^[A-Za-z ]+$/`, ошибка «Имя может содержать только буквы»), `add-action` (write `app/clients/actions.ts`), `add-form` (edit `app/clients/page.tsx`) |
| `add-olga` | browser `/clients`: fill `{ 'Имя': 'Ольга' }`, click `Добавить` → «Имя может содержать только буквы» |
| `ask-names` | агент: «Имя «Ольга» не проходит. Имена бывают на любом языке, с дефисом и апострофом: «Анна-Мария», «Д'Артаньян». Сначала тест на эти случаи»; шаги `names-test` (write `lib/names.test.ts`), `names-fix` (write `lib/names.ts`: буквы любого алфавита, пробел, дефис, апостроф), `names-run` (run `npx vitest run lib/names.test.ts`) |
| `add-olga2` | browser: «Ольга» → добавлена |
| `add-anna-maria` | browser: «Анна-Мария» → добавлена |
| `login-anna` | browser `/login` за Анну → `/workouts` |
| `ask-log` | агент: «Пиши в журнал сервера сохранение подхода, чтобы разбирать ошибки»; шаг `log-full` (edit `app/workouts/[id]/actions.ts`: `console.log` с объектом подопечного и заметкой целиком) |
| `log-set2` | browser `/workouts/<id>`: fill `{ 'Вес, кг': '40', 'Повторы': '10', 'Заметка': 'болит колено' }`, click `Сохранить подход` — в `server` имя и «болит колено» |
| `ask-log-fix` | агент: «В журнале — данные о здоровье. Только id подхода и время, без имени и заметки»; шаг `log-min` (edit) |
| `log-set3` | browser: тот же ввод — в `server` строка без имени и заметки |
| `licenses` | run `npx --yes license-checker --summary` |
| `c-care` | commit с сообщением из двух абзацев: `Имена на любом языке; журнал без данных о здоровье`, пустая строка, `Co-Authored-By: Claude <noreply@anthropic.com>` |
| `show-label` | run `git log -1` |

- [ ] **Step 1: Тест:** `test('s10: «Ольга» не проходит, потом проходит; заметка о здоровье уходит из журнала; метка ИИ в коммите')` — `add-olga.after` содержит `Имя может содержать только буквы`; `add-olga2.after` и `add-anna-maria.after` содержат имена в списке; `names-run.code` = 0; `log-set2.server` содержит `болит колено`, `log-set3.server` — нет; `licenses.out` содержит `MIT`; `show-label.out` содержит `Co-Authored-By: Claude`.
- [ ] **Steps 2–6:** по «Порядку задачи сессии» (`--from s10-care`); commit `demo-app: сессия s10 — имена, данные о здоровье, лицензии, метка ИИ`.

### Task 14: Сессия `s11-ship` — публикация и паритет

**Files:** по «Порядку задачи сессии» для `s11-ship` (`db: true`).

**Interfaces:** Consumes: состояние `s10-care`. Produces:

| id | шаг |
|---|---|
| `ask-pwa` | агент: «Сделай приложение устанавливаемым на телефон: манифест и иконка»; шаги `manifest-file` (write `app/manifest.ts`: имя «Тренер», `display: 'standalone'`, `start_url: '/login'`), `icon-file` (write `app/icon.tsx` через `ImageResponse`) |
| `build` | run `npm run build` |
| `start` | run `npm start`, until `Ready` |
| `prod-login` | browser `/login` за Марину → `/clients` (рабочая сборка) |
| `prod-manifest` | browser `/manifest.webmanifest` |
| `c-pwa` | commit `Приложение ставится на телефон: манифест и иконка` |
| `parity` | человек, write `docs/parity.md`: таблица паритета — сценарии × эталоны А, Б, В × «наше» (есть / нет / позже), шаг 5 чистой комнаты |
| `c-parity` | commit `Таблица паритета с эталонами` |
| `plan-file` | человек, write `docs/plan-weeks-2-3.md`: что сказала Марина на пробе, приоритеты недель 2–3 по таблице паритета |
| `c-plan` | commit `План недель 2–3 после пробы с тренером` |
| `pass-map` | run `git ls-files app lib components supabase` |
| `pass-log` | run `git log --oneline --stat -3` |

- [ ] **Step 1: Тест:** `test('s11: рабочая сборка отвечает, манифест на месте')` — `build.code` = 0 и вывод содержит `/manifest.webmanifest`; `prod-login.urlAfter` оканчивается на `/clients`; `prod-manifest.after` содержит `Тренер` и `standalone`.
- [ ] **Steps 2–6:** по «Порядку задачи сессии» (`--from s11-ship`); commit `demo-app: сессия s11 — публикация, PWA, паритет`.

### Task 15: Сессия `s12-agent` — фоновый агент и приёмка

**Files:** по «Порядку задачи сессии» для `s12-agent` (`db: true`). Последняя сессия недели: `demo-app/app` — её последний коммит.

**Interfaces:** Consumes: состояние `s11-ship`. Produces:

| id | шаг |
|---|---|
| `task-file` | человек, write `docs/tasks/records.md` — задача фоновому агенту в четыре части: цель (личные рекорды подопечного: лучший вес в каждом упражнении-тренировке), контекст (файлы), критерий «готово» и тест (среди подходов 60 × 8, 62,5 × 5 и 57,5 × 10 рекорд — 62,5 кг), ограничения (не трогать миграции и вход; работа только в ветке `agent/records`) |
| `c-task` | commit `Задача фоновому агенту: личные рекорды` |
| `agent-branch` | run `git switch -c agent/records` |
| `ask-records` | агент: «Выполни задачу из docs/tasks/records.md»; шаги `rec-test` (write `lib/records.test.ts`: ожидание 62.5 по задаче), `rec-lib` (write `lib/records.ts` с ошибкой — рекорд по объёму подхода, а не по весу, выходит 57.5), `rec-run` (run `npx vitest run lib/records.test.ts` — красный), `rec-tamper` (edit `lib/records.test.ts`: ожидание 62.5 → 57.5 — подгонка под проверку), `rec-run2` (run — зелёный); ответ — «Готово, тесты зелёные» |
| `c-records` | commit `Личные рекорды` |
| `main-back` | run `git switch main` |
| `accept-log` | run `git log main..agent/records --oneline` |
| `accept-stat` | run `git diff main agent/records --stat` |
| `accept-test` | run `git show agent/records:lib/records.test.ts` |
| `agent-branch2` | run `git switch agent/records` |
| `ask-records-fix` | агент: «Тест подогнан под код: в задаче рекорд — 62,5 кг. Верни ожидание из задачи и исправь код, тест не трогай»; шаги `rec-untamper` (edit test: 57.5 → 62.5), `rec-fix` (edit `lib/records.ts`: по весу), `rec-run3` (run — зелёный) |
| `c-records2` | commit `Рекорды по весу, как в задаче` |
| `merge-records` | run `git switch main && git merge --no-ff agent/records -m 'Слияние: личные рекорды'` |
| `ask-spec-tests` | агент: «Тесты из требований docs/spec.md, сценарий 3 (тренер видит прогресс): по тесту на каждое требование»; шаги `spec-test` (write `lib/progress.test.ts`), `spec-run` (run `npx vitest run lib/progress.test.ts`) |
| `c-spec-tests` | commit `Тесты прогресса из требований` |
| `design-file` | человек, write `docs/design.md`: токены — цвета, отступы, «кнопка: высота 44 px — под палец», шрифт |
| `ask-button` | агент: «Сделай кнопку «Сохранить подход» побольше. Сначала спроси, если неясно»; шаг `button-read` (read `docs/design.md`); ответ — уточняющий вопрос: «Побольше — это высота 44 px из docs/design.md?» |
| `ask-button2` | агент: «Да: все кнопки — 44 px по docs/design.md»; шаг `button-css` (edit `app/globals.css`) |
| `dev` | run `npm run dev`, until `Ready` |
| `login-anna` | browser `/login` за Анну → `/workouts` |
| `c-design` | commit `Кнопки по дизайн-токенам` |
| `log-final` | run `git log --oneline --graph -14` |

- [ ] **Step 1: Тест:** `test('s12: агент подогнал тест, приёмка это ловит, после исправления — зелёный по задаче')` — `rec-run.code` ≠ 0, `rec-run2.code` = 0; дифф `rec-tamper` меняет `62.5` на `57.5`; `accept-test.out` содержит `57.5`; `rec-run3.code` = 0; `merge-records.code` = 0; `spec-run.code` = 0; `log-final.out` содержит `Слияние: личные рекорды`.
- [ ] **Steps 2–6:** по «Порядку задачи сессии» (`--from s12-agent`); `sessionProblems` с `demo-app/app` — пусто; commit `demo-app: сессия s12 — фоновый агент, приёмка, тесты из требований`.

---

## Порядок задачи урока (Задачи 16–26)

Общий для всех уроков недели; контролёр передаёт этот раздел исполнителю вместе с брифом задачи. У каждой задачи — свои id, длина, главы и записи. Образец — `video/lessons/ch-abc`, `video/lessons/ch-01`; правила — `video/term/README.md` (прочитать целиком до начала).

**Files** (для урока `<id>`):
- Create: `course/video/lessons/<id>/lesson.ts`, `Video.tsx`, `script.ts`, `script.gen.json` (снимок), `lesson.test.ts`
- Modify: `course/video/catalog.ts` (запись `<id>` → `./lessons/<id>/script` и `./lessons/<id>/Video`, название прежнее), `course/src/video/registry.ts` (убрать MP4 `<id>`), `course/src/video/narration.ts` (`SAY` для новых латинских слов), `course/src/video/narration.old-videos.spoken.txt` (снимок сокращается — обновить `-u`), тесты длины дня (`src/course/summary.test.ts`, `src/day/day.test.tsx`, `src/home/home.test.tsx`), `course/e2e/*.spec.ts` (где задача говорит)
- Delete: `course/video/<id>/` (`git rm -r`; ссылки на неё — `grep -rn "video/<id>"`)

**Interfaces:** Consumes: `Lesson` (с `sessions`, Задача 4), `buildLesson`, `lessonProblems`, `LessonVideo`; записи по таблице задачи; схемы `content/figures/*.svg?raw`. Produces: `export const <имя>: Lesson`, `export const <имя>Script: VideoScript`, `Video.tsx` — копия образца с пробросом пропов.

Шаги:
1. Прочитать разделы книги урока (якоря `id="sNN"` в `vibe-coding-na-praktike-2026-10.html`) и прежний сценарий `course/video/<id>/script.ts` (темы и уже сверенные факты). Прежнюю длину не пересчитывать — она в таблице задачи.
2. Тест `lesson.test.ts`: `lessonProblems(урок, { minFrames: <прежняя длина> })` пуст; снимок `buildLesson(урок).script` совпадает с `./script.gen.json` (`toMatchFileSnapshot`).
3. `npx vitest run video/lessons/<id>` — FAIL.
4. Сценарий: по одной мысли на реплику, каждый факт и цифра — из раздела книги главы; сцены — каркас главы (объяснение → пример → ошибка с вердиктами «Неверно» → «Верно»); кадр записи — в главах, где задача его называет; камера ведёт к тому, о чём реплика; пояснения — на командах и строках, где новичку нужно «а это что?» (не меньше 4). Схема раздела — из `content/figures/` с префиксом главы (`ch2_…` для главы 2), подобрать по тексту раздела. В кадре базы — подпись «локальная база вместо Supabase».
5. `npx vitest run video/lessons/<id>` — PASS (снимок создан); длина в окне «прежняя длина … 8100».
6. Каталог, реестр, удаление старой папки, `SAY`, снимок старой озвучки, тесты длины дня; e2e по задаче; `npm test` — PASS.
7. Кадры глазами: `node scripts/lesson-stills.mjs <id> video/lessons/<id>/script.gen.json <scratchpad>/stills/<id>` — каждый кадр сцены и пояснения: наезды, обрезка, мелкий текст, висячие слова, пустые углы, рамки пояснений на своих объектах, вердикт в шапке. Исправить и снять ещё раз — не меньше трёх проходов «смотрю — правлю — смотрю», пока не чисто.
8. `npm run lint`, `npx tsc -b` — PASS. Commit — `video: ролик <id> в стиле «Репозиторий»`.

Нужной команды или правки нет в записи — добавить шаг в сессию и перезаписать её и следующие (`node scripts/record-session.mjs --from <сессия>`), прогнать уроки, которые на них ссылаются; не придумывать вывод.

### Task 16: Ролик `ch-02` «Как говорить с ИИ, чтобы он понял»

Урок `ch02` (`video/lessons/ch-02`), книга s14–s19, `minFrames: 7751` (окно 7751–8100). Записи: `s02-sets`, `s03-spec`. Шаги — «Порядок задачи урока».

| Глава | Объяснение | Пример (запись) | Типичная ошибка |
|---|---|---|---|
| Что узнаете | — | — | — |
| Запрос — это техзадание (s14) | `ch2_ckokf`: цель, контекст, ограничения, критерий, формат; исполнитель — стажёр без памяти | `s03-spec`: `ask-ckokf` (Agent) → `workouts-view` (Browser: только тренировки Анны) | «Сделай экран тренировок»: `ask-vague` → `vague-view` (чужие тренировки, выдуманные имена) — «Неверно»; `workouts-view` — «Верно» |
| Конкретно и проверяемо (s15, s17) | `ch2_concrete`: пять правил; в запросе нет кода — решения ваши | `ask-volume` (пример с числами) → `volume-view` («1500 кг») | оценки вместо проверок: «побыстрее, покрасивее» (Board) |
| Круги уточнения (s16) | схема цикла уточнения раздела s16 | `s02-sets`: `save-bad` (Console) → `ask-fix` (текст ошибки целиком) → `save-hint` | та же просьба громче, без нового (Board) |
| Вопросы до старта и план (s18) | `ch2_questions_first`, `dk_plan` | `s03-spec`: `questions` (Plan: пять вопросов), `plan-coach` (план без правок) | большая задача сразу в работу (Board) |
| От спецификации (s19) | `ch2_spec` | `spec-file` (Editor: `docs/spec.md`), `ck-spec` (Reading) | пароль или ключ в запросе (Board, предупреждение s19) |
| Итог | — | — | — |

Кроме того: e2e «два старых ролика (1280 × 720) на компьютере — в один ряд» (`e2e/video.spec.ts`) перенести на день 7 (`ch-10`, `ch-11` — старые до Задачи 25).

### Task 17: Ролик `ch-12` «Своё приложение по образцу»

Урок `ch12`, книга s84–s92, `minFrames: 7894`. Записи: `s03-spec`, `s11-ship`. Шаги — «Порядок задачи урока».

| Глава | Объяснение | Пример (запись) | Типичная ошибка |
|---|---|---|---|
| Что узнаете | — | — | — |
| Что можно взять у эталона (s84, s85) | `ch12_scale`, `ch12_directions`: идеи и поведение — да, исполнение — нет | `s03-spec`: `etalons` (Editor: поведение и жалобы, без кода и текстов) | скопировать тексты, логотип и оформление (Board: копия против функционального аналога) |
| Чистая комната: собрать, разобрать, описать (s86–s88) | `ch12_cleanroom`: пять шагов и стена | `etalons` → `questions` (Plan) → `spec-file` (берём / меняем / откладываем, отличие из жалоб) | дать ИИ код или скриншоты эталона «сделай так же» — стена сломана (Board) |
| Собрать и сверить (s89) | новая сессия по описанию; таблица паритета (Board) | `ask-ckokf` (сборка по `docs/spec.md`); `s11-ship`: `parity` (Editor) | сверять «на глаз», без сценариев (Board) |
| Ловушки (s90) | семь ловушек карточками (Board) | — | одна ловушка серией `mistake` с вердиктами (по выбору из семи) |
| Три прохода по своему коду (s91) | карта → сценарий → детали (Board) | `s11-ship`: `pass-map`, `pass-log` (Terminal) | читать всё подряд с первого файла (Board) |
| Итог | — | — | — |

### Task 18: Ролик `ch-03` «Проблема 70%»

Урок `ch03`, книга — вступление главы 3, s21–s23, `minFrames: 7951`. Записи: `s02-sets`, `s04-rules`. Шаги — «Порядок задачи урока».

| Глава | Объяснение | Пример (запись) | Типичная ошибка |
|---|---|---|---|
| Что узнаете | — | — | — |
| Первые 70 % и последние 30 % (вступление гл. 3) | `3.1`, `ch3_iceberg` | `s04-rules`: `neg` (−5 сохраняется) | «вроде работает»: проверили только «60 × 8» (`s02-sets` `save-ok`) — «Неверно»; края (`neg`) — «Верно» |
| Шаг вперёд — два назад (вступление гл. 3) | три симптома (`ch3_three`) | `ask-neg` → `neg-view` → `comma` (запятая сломалась) | чинить по кругу, не глядя, что сломалось (Board) |
| Как работают на деле (s21) | `ch3_trust`, два паттерна (`ch3_modes` или схема раздела) | — (Board/Figure) | доверять без проверки (Board) |
| Один безопасный шаг и дифф (s22) | `ch3_step`, `ch3_diff_read` | `log4` → `revert` (откат шага) → `comma-ok`; `diff4` (Diff) | принять большую правку не читая (Board) |
| Тест до кода (s22) | `ch3_rollback`, `ch3_test_run` | `ask-test`: `test-red` → `test-green`; `neg2`, `comma2` | «проверю потом руками» (вердикты на `test-red`/`test-green`) |
| Итог | — | — | — |

Кроме того: e2e «два старых ролика в ряд» уже на дне 7 — не трогать.

### Task 19: Ролик `ch-06` «Прототип за вечер»

Урок `ch06`, книга s36–s41, `minFrames: 8029` — **окно 71 кадр (8029–8100)**: подгонять длину правкой одной-двух реплик в конце работы, не новыми сценами. Записи: `s05-proto`. Шаги — «Порядок задачи урока».

| Глава | Объяснение | Пример (запись) | Типичная ошибка |
|---|---|---|---|
| Что узнаете | — | — | — |
| Вопрос и тонкий срез (s36) | `ch6_slice`: таймбокс, срез, выдуманные данные, готовность выбросить | `proto-doc` (Editor), `ask-proto` → `proto-view` | прототип «всего сразу» без вопроса и срока (Board) |
| Инструменты (s37) | `ch6_tools` (таблица на октябрь 2026) | — | один инструмент «на всё» (Board) |
| Короткие циклы (s38) | `ch6_iter`, `ch6_screenshot` | `ask-iter` → `proto-view2`, `journal` (Editor), `c-proto2` (GitLog) | итерации без снимков состояния (Board) |
| Выбросить, развивать или переписать (s39) | дерево решения раздела s39 | `branches` (Terminal: ветка прототипа отдельно от `main`) | выдать прототип за продукт (Board: 70 % и 30 %) |
| Ловушки прототипа (s40) | `ch6_key` | `ask-advice` → `build` → `leak` («Неверно») → `ask-key-fix` → `build2` → `leak2` («Верно») | (серия `mistake` — сам пример) |
| Итог | — | — | — |

### Task 20: Ролик `pilot-rls` «Почему тренер не увидит чужих подопечных»

Урок `pilotRls` (`video/lessons/pilot-rls`), книга s42–s47, s81, `minFrames: 6098`. Записи: `s06-auth`, `s11-ship`. Название в каталоге прежнее. Шаги — «Порядок задачи урока».

| Глава | Объяснение | Пример (запись) | Типичная ошибка |
|---|---|---|---|
| Что узнаете | — | — | — |
| Каркас и модель данных (s42, s43) | `ch7_scaffold`, `ch7_tables` | `schema-file` (Editor), `db-init`, `db-seed`, `tables` (Terminal) | всё в одной таблице без связей (Board) |
| Вход и роли (s44) | `ch7_request`: путь запроса | `login-marina` (Browser → `/clients`) | защита только в интерфейсе: `attack` (`/clients/3` — Света) — «Неверно» |
| Политики в базе (s43) | `ch7_rules` | `ask-rls` (Manual, `[y / n]` на `rls-apply`), `rls-check` (Terminal), `attack2` («Подопечный не найден») — «Верно» | забыть RLS на новой таблице: проверка `rls-on` (Terminal) |
| Проверка и публикация (s45, s81) | `ch7_deploy`, `ch7_release` | `rls-test-run` (Terminal); `s11-ship`: `build`, `start`, `prod-login` | проверили только у себя (Board) |
| Итог | — | — | — |

Кроме того: e2e дня 4 в `e2e/video.spec.ts` (обложка, пояснение `client/18`, ошибка загрузки, 390 px, субтитры на обложке) опираются на старый `pilotRlsScript` — перевести их на старый ролик дня 8 (`day08Script`: его пояснения и реплики), поведение тестов не менять.

### Task 21: Ролик `ch-05` «Читать код, который написал ИИ»

Урок `ch05`, книга s29–s35, `minFrames: 7921`. Записи: `s07-cycle`, `s08-debug`. Шаги — «Порядок задачи урока».

| Глава | Объяснение | Пример (запись) | Типичная ошибка |
|---|---|---|---|
| Что узнаете | — | — | — |
| Четыре прохода по изменению (s29) | `ch5_passes` | `s07-cycle`: `diff-stat`, `diff-assign` | читать с первой строки до последней (Board) |
| Решение большинства (s30, s31) | `ch5_majority`, `ch5_filter` | `assign` («11/2/2026» — «Неверно») → `ask-date` → `assign-view` («2 ноября» — «Верно») | (серия `mistake` — сам пример) |
| Отладка (s32) | `ch5_stacktrace`, `ch5_debug`, `ch5_bisect` | `s08-debug`: `assign2` (стектрейс в выводе сервера), `ask-cause` («найди причину, не исправляй»), `cause-fix`; `test-red` → `bisect-run` | заглушить симптом проверкой в разметке (Board) |
| Рефакторинг (s33) | `ch5_refactor` | `ask-refactor` (`setlist`, `refactor-test`), `diff-refactor` | рефакторинг без тестов (Board) |
| Тесты (s34) | `ch5_failing_test`, `ch5_testcheck` | `s07-cycle`: `volume-run`; `break` → `red` → `unbreak` → `green`; `e2e-run` | тест, который ничего не проверяет (Board) |
| Итог | — | — | — |

### Task 22: Ролик `ch-04` «Что остаётся человеку»

Урок `ch04`, книга — вступление главы 4, s24–s28, `minFrames: 7738`. Записи: `s08-debug`. Шаги — «Порядок задачи урока».

| Глава | Объяснение | Пример (запись) | Типичная ошибка |
|---|---|---|---|
| Что узнаете | — | — | — |
| ИИ — усилитель (вступление гл. 4, s24) | `4.1`: матрица делегирования | `ask-migration` (Manual: `[y / n]` перед `note-apply` — решает человек) | отдать ИИ решение с высокой ценой ошибки (Board) |
| T-образный профиль (s25) | `ch4_T` | — | «знаю всё понемногу» (Board) |
| Наставник для начинающего (s26) | `ch4_mentor`, `ch4_mentor_chat` | `ask-mentor` (Plan: объяснение и три вопроса) | «просто сделай» без понимания (Board) |
| Осознанная практика (s27) | `ch4_growth`, `ch4_prompt_journal` | `prompts` (Editor: журнал запросов) | одни и те же запросы без разбора (Board) |
| Итог | — | — | — |

### Task 23: Ролик `ch-08` «Безопасность и надёжность»

Урок `ch08`, книга s48–s56, s82, `minFrames: 7987`. Записи: `s09-audit`. Шаги — «Порядок задачи урока».

| Глава | Объяснение | Пример (запись) | Типичная ошибка |
|---|---|---|---|
| Что узнаете | — | — | — |
| Инъекция и чужие данные (s48, s82) | `ch8_injection`, `ch8_idor` | `search-ok` → `inject` («Неверно») → `ask-inject-fix` → `inject2`, `anon` («Верно») | (серия `mistake` — сам пример) |
| Подбор паролей и выдуманные пакеты (s48) | `ch8_rate_limit`, `ch8_pkg_check` | `limit-curl`; `ask-pkg` → `pkg-check` (404) | поставить пакет из ответа ИИ, не проверив (вердикты на `ask-pkg`/`pkg-check`) |
| Аудит и сканер секретов (s49, s50) | `ch8_layers`, `ch8_secret_scan`, `ch8_review` | `hook-file`, `commit-blocked` → `ask-pay-fix` → `c-pay` | секрет в коде (вердикты) |
| Скорость: N+1 (s52) | `ch8_n1` | `clients-n1` (13 строк `[sql]`) → `ask-n1-fix` → `clients-1` | (вердикты на `clients-n1`/`clients-1`) |
| Проверки до слияния и выкатка (s54, s51, s55) | `ch8_ci_checks`, `ch8_rollout` | `check-script`, `check-run` | слить с красной проверкой (Board) |
| Итог | — | — | — |

### Task 24: Ролик `ch-09` «Этика вайб-кодинга»

Урок `ch09`, книга s57–s61, `minFrames: 7905`. Записи: `s10-care`. Шаги — «Порядок задачи урока».

| Глава | Объяснение | Пример (запись) | Типичная ошибка |
|---|---|---|---|
| Что узнаете | — | — | — |
| Чей код и лицензии (s57) | `ch9_ip` | `licenses` (Terminal) | вставить код под GPL в закрытый продукт (Board) |
| Прозрачность (s58) | `ch9_commit_label`, `ch9_transp` | `c-care`, `show-label` (метка в коммите) | скрыть участие ИИ (Board) |
| Предвзятость (s59) | `ch9_bias` | `add-olga` («Неверно») → `ask-names` → `names-run` → `add-olga2`, `add-anna-maria` («Верно») | (серия `mistake` — сам пример) |
| Данные о здоровье и правила (s60) | `ch9_rules` | `log-set2` (имя и заметка в журнале) → `ask-log-fix` → `log-set3` | (вердикты на `log-set2`/`log-set3`) |
| Итог | — | — | — |

### Task 25: Ролик `ch-10` «Фоновые агенты»

Урок `ch10`, книга s62–s69, s83, `minFrames: 7984`. Записи: `s12-agent`. Шаги — «Порядок задачи урока».

| Глава | Объяснение | Пример (запись) | Типичная ошибка |
|---|---|---|---|
| Что узнаете | — | — | — |
| Поставить задачу и проверить (s62, s63) | `10.1`, `ch10_agent_pr` | `task-file` (Editor: четыре части задачи) | расплывчатая задача агенту (Board) |
| В изоляции и параллельно (s64, s65) | `ch10_multi` или `dk_parallel` | `agent-branch`, GitLog (`c-task`, `c-records`, ветка `agent/records`) | агент правит `main` напрямую (Board) |
| Когда агент буксует (s67) | `ch10_stuck`, `ch10_risks` | `rec-run` (красный) → `rec-tamper` (Diff: подгонка) → `rec-run2` (зелёный) — «Неверно» | (серия `mistake` — сам пример) |
| Приёмка (s68) | `ch10_accept`, `ch10_perms` | `accept-log`, `accept-stat`, `accept-test` (57.5 против 62,5 в задаче), `ask-records-fix` → `rec-run3` — «Верно», `merge-records` | принять по ответу «Готово, тесты зелёные» (Board) |
| Возможности Claude Code (s83) | навыки, хуки, подагенты, плагины, задачи по расписанию, Remote Control, Claude in Chrome — карточками по книге (Board) | — | — |
| Итог | — | — | — |

Кроме того: e2e «два старых ролика в ряд» (день 7) после этой задачи теряет предмет — на дне 7 больше нет двух старых роликов, и в курсе не остаётся дня с двумя старыми. Заменить его тестом `'старый ролик (1280 × 720) один на дне — во всю ширину сетки'` на дне 8 (правило `:only-child` в `video.css`).

### Task 26: Ролик `ch-11` «Что дальше»

Урок `ch11`, книга s70–s76, `minFrames: 7731`. Записи: `s08-debug`, `s12-agent`. Шаги — «Порядок задачи урока».

| Глава | Объяснение | Пример (запись) | Типичная ошибка |
|---|---|---|---|
| Что узнаете | — | — | — |
| Тесты из требований (s70) | `ch11_spec_to_tests` | `s12-agent`: `ask-spec-tests` → `spec-run` | тесты «по коду», а не по требованиям (Board) |
| Разбор инцидента (s70) | `ch11_incident` | `s08-debug`: `assign2` → `ask-cause` → `cause-fix` → `crash-ok` | исправить без теста на повтор (Board) |
| Дизайн-система как контекст (s71, s72) | `ch11_design`, `ch11_pm` | `design-file` (Editor), `ask-button` (вопрос вместо догадки) → `ask-button2` | «Сделай кнопку побольше» без меры (вердикты: Board с догадкой — «Неверно», `ask-button` — «Верно») |
| Роли и язык (s73–s75) | `ch11_layers`, `ch11_industry` | — | — |
| Итог | — | — | — |

---

### Task 27: Проверка недели 1, правила, публикация

**Files:**
- Modify: `course/e2e/video-chapters.spec.ts`, `course/video/term/README.md`, `demo-app/README.md`

**Interfaces:**
- Consumes: всё выше.

- [ ] **Step 1: e2e** (`video-chapters.spec.ts`):
  - `test('день 2: два новых ролика, у каждого свои главы, кадры не мешают друг другу')` — **Review Focus 4**: у обоих роликов дня 2 списки «Главы ролика» с числом пунктов по урокам; запуск второго ставит первый на паузу; шапка второго кадра показывает свой номер главы целиком.
  - `for (const day of [2, 3, 4, 5, 6, 7]) test(\`день ${day} на телефоне 390 px — без горизонтальной прокрутки\`)` — **Review Focus 5**.
- [ ] **Step 2:** `npm run e2e` — PASS.
- [ ] **Step 3:** README набора — новые ловушки недели (база, вход в браузере, `--from`, окна длины), §7 — что осталось; `demo-app/README.md` — список сессий `s01`–`s12`.
- [ ] **Step 4:** Полная проверка из `course/`: `npm test`, `npm run lint`, `npx tsc -b`, `npm run e2e` — всё зелёное, вывод прочитан.
- [ ] **Step 5: Commit** — `video: неделя 1 в стиле «Репозиторий» — e2e и правила`.
- [ ] **Step 6:** `npm run build && node scripts/artifact-page.mjs dist out/artifact-video`; в `out/artifact-video/page.html` вернуть `<title>Вайб-курс «Пилот роликов»</title>`; опубликовать тем же путём (тот же адрес страницы `https://claude.ai/artifact/89U9omZ2QbodxrG8jdVU6E`) с `assets/*` и `book.html`; отправить ветку `video/terminal` (`git push -u origin video/terminal`); обновить описание чернового PR #7.
