# Ролики «Репозиторий»: неделя 3 (дни 15–21) — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Переделать 7 последних роликов курса (`day-15` … `day-21`) в стиле «Репозиторий» на настоящих записях: приложение тренера доводится до продукта — первое знакомство, питание, замеры и фото, работа без интернета, бета-тест, исправления, запуск.

**Architecture:** Основа недель 1–2 не меняется: рекордер, набор кадров, урок как данные, ролик дня с каркасом `DAY_CHAPTERS`. Сначала тесты старых роликов отвязываются от `day-15`: после недели 3 старых роликов 1280 × 720 в каталоге не останется. Потом записываются сессии `s20`–`s26`, каждая продолжает предыдущую. По ним собираются 7 уроков.

**Tech Stack:** как в неделе 2: Remotion 4.0.537, React 19, TypeScript, Vitest, Playwright 1.56.1, Node 22, git, Next.js 16.4.3, PostgreSQL 16 (`psql`, `pg_dump`, `pg_restore`, `createdb`), `pg`. Новое в приложении тренера — `@axe-core/playwright` (решение автора, 31 октября); ImageMagick `convert` для снимка в s22.

**Spec:** `docs/superpowers/specs/2026-10-28-video-lessons-v2-design.md`: §6.2 «Ролик дня», §2, §3, §4, §9. Образцы и правила:
- план недели 2 `docs/superpowers/plans/2026-10-30-video-lessons-v2-week2.md` — его разделы «Порядок задачи сессии» и «Порядок задачи урока» действуют и здесь, с правками ниже;
- уроки `course/video/lessons/day-08` … `day-14`;
- `course/video/term/README.md` (ловушки 1–27, раздел «Ролик дня»);
- факт-лист недели 3 `.superpowers/sdd/2026-10-31-video-lessons-v2-week3/week3-research.md` (настоящие находки приложения, разделы книги, схемы, варианты сессий).

Неделя 2 опубликована. Автор: «Да начинай» (недели 2–3), работать автономно. Ответы автора 31 октября: имена новых людей выбирает контролёр; `@axe-core/playwright` ставить; `/join` — один ответ на занятую и неверную почту плюс лимит попыток; даты — с честной неделей беты.

## Global Constraints

- Всё из Global Constraints планов недель 1 и 2 действует: Remotion `4.0.537`; кадр 1920 × 1080; `PACE`; тёмная тема; вывод только из записей; интерфейс Claude Code — по `ch1_agent_session` и `dk_modes`; текст по-русски; `SAY`; секреты ненастоящие; `package.json` приложения — только командами npm; сообщения коммитов и строки атрибуции; проверки `npm test`, `npm run lint`, `npx tsc -b`, `npm run e2e`. Никогда не запускать `playwright install`.
- Каркас ролика дня — `DAY_CHAPTERS`: «Что строим сегодня» (`agenda` с 3 `items`) → «Пример» (кадр записи обязателен) → «Подводный камень» («Неверно» → «Верно», вердикт — когда результат на экране; подтверждённая открытая находка после «Верно» — своё «Неверно») → «Проверьте у себя» (`recap`). Пояснений — не меньше 2.
- Длина ролика дня — до 5400 кадров и не меньше прежнего: `day-15` ≥ 4683, `day-16` ≥ 5040, `day-17` ≥ 4999, `day-18` ≥ 5205, `day-19` ≥ 4568, `day-20` ≥ 5232, `day-21` ≥ 5110. У `day-18` (195) и `day-20` (168) окна самые узкие: один камень.
- Действующие лица — как в неделе 2 (Марина: Анна, Олег; Игорь: Света; пароль `demo-password`; разработчицу по имени не называть). Новые (выбор контролёра по решению автора):
  - **Наташа** (`natasha@example.com`) — новый тренер без подопечных, s20: файл автора `supabase/tests/new-coach.sql`;
  - **Полина** (`polina@example.com`) — тренер беты, которую обычное приглашение заводит подопечной (камень s24);
  - **Тимур** (`timur@example.com`) и **Ксения** (`ksenia@example.com`) — тренеры беты по тренерскому приглашению, s24;
  - **Вера** (`vera@example.com`) — новая подопечная в s20 (приглашение Марины) и тестовый аккаунт в s26 (файл автора).

  База сбрасывается на старте каждой сессии: люди, созданные шагами, в следующую сессию не переходят.
- Даты сессий (`date`): `s20` — `2026-11-11T10:00:00+03:00`, `s21` — `11-12`, `s22` — `11-13`, `s23` — `11-14`, `s24` — `11-15`; неделя беты; `s25` — `2026-11-22T10:00:00+03:00`, `s26` — `2026-11-23T10:00:00+03:00`.
- Миграции недели — по порядку и с этими номерами: `0010_nutrition.sql` (s21), `0011_measurements.sql`, `0012_photos.sql` (s22), `0013_sets_client_key.sql` (s23), `0014_coach_invites.sql`, `0015_feedback.sql`, `0016_errors.sql` (s24), `0017_delete_account.sql` (s26). Применяет шаг `psql -f` своей сессии, со следующей — рекордер.
- Настоящих часов в кадре нет: день и неделя питания — в адресе (`?day=2026-11-12`, `?week=2026-11-09`), дата фото и замеров — в форме или файле данных, `created_at` журнала сбоев в кадр не попадает.
- Файлы людей вне git: фото — в `storage/photos/` (в `.gitignore`), cookie для `curl` — в файлах вне проекта (ловушка 19). Ни в одном коммите сессии нет `public/uploads/`, `storage/`, `backups/`.
- Сквозные тесты приложения в сессиях — только свой файл (`npx playwright test e2e/<файл>`). Общий прогон — один раз, в s26, после шага `e2e-wait` в s20.
- Нельзя записать локально — доска или схема книги с честной подписью: Vercel (деплой, домен, DNS, https, откат), настоящий Supabase (Storage, панель, письма), GitHub (PR, CI), Sentry, живые люди (тренеры беты, показ молча, подтверждение), телефон (режим полёта, камера), юрист. Подписи: «локальная папка вместо хранилища Supabase», «Playwright отключает сеть», «журнал в базе вместо сервиса отслеживания ошибок», «замечания беты — авторский текст».
- Не меняются: книга; записи и состояния `s01`–`s19` (новые сессии — `--from s20-first-run` и дальше); уроки недель 1–2, кроме совместимых правок набора.
- Ответ `/join` (решение автора): на занятую почту и на отказ приглашения — один текст «Проверьте почту или войдите, если аккаунт уже есть»; лимит — 5 попыток за 15 минут на код приглашения (`lib/rate-limit.ts`). Проверка формата почты и пароля остаётся своей.

## Review Focus

1. **Перезапись с середины после сессий с миграциями.** Цепочка `0010` … `0017`, которую со следующей сессии применяет рекордер, даёт ту же схему, что в конце сессии; `0013` добавляет `client_key` к таблице с подходами из `seed.sql` без ошибки (столбец допускает `null`). Тест — Задача 6: шаг `schema` s24 показывает `client_key` в `sets`; рекордер падает на миграции с ошибкой, поэтому каждая следующая запись — проверка предыдущих миграций.
2. **Настоящие часы.** При перезаписи в другой день в кадре те же даты: питание 12 ноября и неделя с 9 ноября, фото 13 ноября, замеры по фиксированным датам, срок беты «22 ноября», журнал сбоев без времени. Тест — Задачи 3, 4, 6 (строки дат в `after` и `out`).
3. **Фото и cookie вне git.** Ни один коммит s22–s26 не содержит `public/uploads/`, `storage/`, `backups/` и файлов cookie. Тест — Задача 4 (обход коммитов сессии, как в s19).
4. **Тесты старых роликов.** После Задачи 1 юнит-тесты 1280 × 720 стоят на замороженной фикстуре, их число прежнее; после Задачи 15 в каталоге нет ни одного старого ролика, а `npm test` и `npm run e2e` проходят. Тест — Задачи 1 и 15.
5. **Ролик дня на телефоне 390 px для дней 15–21.** Пункты плана переносятся, горизонтальной прокрутки нет, первое пояснение под кадром. Тест — e2e Задачи 16.

---

## Сессии недели 3 — сводка

| Сессия | `from` | Дата | `db` | Что делает | Ролик |
|---|---|---|---|---|---|
| `s20-first-run` | `s19-reliability` | `2026-11-11T10:00:00+03:00` | да | первый экран Веры; Наташа без подопечных — пустой список без слова; путь новичка в Plan; меню, выход, пустые экраны в три части; axe — контраст тёмной схемы | `day-15` |
| `s21-nutrition` | `s20-first-run` | `2026-11-12T10:00:00+03:00` | да | правила словами; схема с RLS; тесты расчёта до кода; цели и дневник; два итога за один день → одна функция | `day-16` |
| `s22-progress` | `s21-nutrition` | `2026-11-13T10:00:00+03:00` | да | замеры с RLS; фото в `public/` открывается без входа и просится в git; выдача только своим; удаление вместе с файлом | `day-17` |
| `s23-offline` | `s22-progress` | `2026-11-14T10:00:00+03:00` | да | вопрос Анны; без сети подход пропадает; очередь «не отправлено»; потерянный ответ — дубль; номер подхода один раз | `day-18` |
| `s24-beta` | `s23-offline` | `2026-11-15T10:00:00+03:00` | да | план беты; Полина стала подопечной; тренерское приглашение; «Сообщить о проблеме»; сбой без журнала → страница ошибки и журнал | `day-19` |
| `s25-beta-fixes` | `s24-beta` | `2026-11-22T10:00:00+03:00` | да | замечания по тяжести; «исправь всё» — много файлов без тестов; круг одного исправления 2–3 раза | `day-20` |
| `s26-launch` | `s25-beta-fixes` | `2026-11-23T10:00:00+03:00` | да | страница о продукте; данные людей и политика; удалить аккаунт нечем → удаление; чек-лист перед запуском; план на месяц | `day-21` |

Id шагов постоянные: на них ссылаются уроки. «Агент» — шаг `agent`, «человек» — обычный шаг.

---

### Task 1: Тесты старого ролика — без `day-15`; произношение

**Files:**
- Create: `course/src/video/fixtures/old-video.json` (замороженный сценарий 1280 × 720 — копия данных `day15Script` на коммите BASE)
- Modify: `course/src/video/VideoBlock.test.tsx`, `course/src/video/termScript.test.ts`, `course/src/course/summary.test.ts`, `course/e2e/video.spec.ts`, `course/src/video/narration.ts`, `course/src/video/narration.test.ts`
- Test: те же файлы

**Interfaces:**
- Consumes: `day15Script`, `day21Script` (старые сценарии), `SAY`, `spokenText`.
- Produces: `oldVideoFixture: VideoScript` (импорт JSON) — подопечный юнит-тестов 1280 × 720 до конца курса. e2e старого ролика стоят на дне 21, его переделывает Задача 15.

- [ ] **Step 1: Тест произношения:** `test('SAY: «test» и «git» внутри обычных слов и путей не переозвучиваются')` в `narration.test.ts` — `spokenText('e2e/first-run.spec.ts')` и `spokenText('github')` не содержат «тест» и «гит» посреди слова, а `spokenText('git log')` по-прежнему читает «гит лог». Проверить, что сейчас FAIL (или PASS — тогда находка неактуальна, правило не трогать, Ruling).
- [ ] **Step 2:** `npx vitest run src/video/narration.test.ts` — FAIL.
- [ ] **Step 3:** Сузить правила `SAY` для `test` и `git` (границы слова и окружение). Снимок `narration.old-videos.spoken.txt` не меняется.
- [ ] **Step 4:** Юнит-тесты (`VideoBlock`, `termScript`, `summary`) перевести с `day15Script` на `oldVideoFixture`, поведение и число тестов прежние. В `VideoBlock.test.tsx` длительность «2:36» и зона «Пустой экран с подсказкой» берутся из фикстуры. e2e `video.spec.ts` (обложка, пояснение, ошибка загрузки, «старый ролик один на дне», субтитры) — на день 21: заголовок, название ролика и зона — из `day21Script`. В `e2e/video-chapters.spec.ts` старый ролик телефонного цикла — тоже день 21 (`SCRIPTS['day-21']`, `DAYS[21]`, проверка «без списка глав» — у дня 21), цикл — дни 2–14 и 21; уроки дней 15–20 (Задачи 9–14) добавляют свой день в цикл как ролик дня. **Review Focus 4.**
- [ ] **Step 5:** `npm test`, `npm run e2e` — PASS, число тестов прежнее. Commit `video: тесты старого ролика — на фикстуре и дне 21; SAY без ложных совпадений`.

---

## Порядок задачи сессии (Задачи 2–8)

Как в плане недели 2 (раздел «Порядок задачи сессии»), с уточнениями:
- **Запись.** `node scripts/record-session.mjs --from <id>` из `course/`. Прежние записи и состояния байт в байт не меняются.
- **Черновик до записи.** Ожидаемые ошибки, помеченные ⚠, сначала проверяются черновым прогоном. Если ошибка не воспроизводится, камень меняется на настоящий на том же месте (та же тема дня), шаги таблицы переименовываются только при нужде — Ruling. Вывод не придумывается.
- **Данные шагов.** Строки и люди, которые нужны кадру, сессия создаёт сама: шагами браузера или `psql -f` своего файла.
- **Код приложения.** Проверяется в черновом прогоне: `npm run lint`, `npx tsc --noEmit`, тесты приложения. Ответ агента — авторский, короткий, не больше, чем сделали его шаги. Окно агента — 18 строк (проверка через `plan()`).
- **Accept edits.** Команда агента идёт с вопросом `[y / n]`; Plan — только чтение.

### Task 2: Сессия `s20-first-run` — первое знакомство и доступность

**Files:** по «Порядку задачи сессии» для `s20-first-run`. **Interfaces:** Consumes: состояние `s19-reliability`. Produces: события ниже.

| id | шаг |
|---|---|
| `typegen` | run `npx next typegen` |
| `e2e-wait` | человек, edit `e2e/quick-set.spec.ts`: после входа явно ждать страницу (`waitForURL` или `toHaveURL` с пределом 15 с) — нестабильность s18 на холодном dev |
| `c-e2e-wait` | commit `Сквозной тест ждёт вход` |
| `dev` | run `npm run dev`, until `Ready` |
| `login-marina` | browser `/login`: Марина |
| `invite-vera` | browser `/clients`: «Создать приглашение» |
| `vera-join` | browser `url: { from: 'invite-vera', match }`: Вера регистрируется — попадает на «Мои тренировки», «Тренировок пока нет», дальше ни слова |
| `natasha-file` | человек, write `supabase/tests/new-coach.sql`: Наташа в `auth.users` (`crypt('demo-password', gen_salt('bf'))`) и профиль `coach`, как `seed.sql` |
| `natasha-apply` | run `psql -f supabase/tests/new-coach.sql` |
| `login-natasha` | browser `/login`: Наташа |
| `natasha-empty` | browser `/clients`: заголовок, сразу форма «Имя / Добавить», «Приглашений пока нет» — о пустом списке ни слова |
| `ask-path` | агент (Plan): «Пройди путь нового тренера и нового подопечного: что они видят первым, где пусто и куда идти дальше. Код не меняй». Шаги: `p-clients` (read `app/clients/page.tsx`), `p-workouts` (read `app/workouts/page.tsx`), `p-layout` (read `app/layout.tsx`), `p-report` (read `app/report/page.tsx`). Ответ: меню и выхода нет; «Программы» и «Отчёт» — только по адресу; пустые экраны без шага; «Добавить» по имени заводит подопечного без входа; на `/report` без месяца — подсказка для разработчика |
| `ask-first` | агент: «Сделай первый экран: меню по роли с выходом, пустые экраны в три части — что здесь будет, что сделать, кнопка. Сначала сквозной тест». Шаги: `first-e2e` (write `e2e/first-run.spec.ts`: Наташа видит «Подопечных пока нет» и кнопку «Создать приглашение», Вера — что тренировку назначит тренер, в меню есть «Выйти»), `first-red` (run `npx playwright test e2e/first-run.spec.ts`), `first-nav` (write `components/Nav.tsx`: «Подопечные · Программы · Отчёт · Выйти» / «Мои тренировки · Выйти»), `first-layout` (edit `app/layout.tsx`), `first-logout` (write `app/api/logout/route.ts`), `first-clients` (edit `app/clients/page.tsx`: пустой список в три части; форма по имени — «Добавить без входа» с подписью, что войти такой подопечный не сможет), `first-workouts` (edit `app/workouts/page.tsx`), `first-report` (edit `app/report/page.tsx`: без месяца — ссылки на месяцы с тренировками из базы, без настоящих часов), `first-green` (run тот же файл) |
| `c-first` | commit `Первый экран: меню, выход, пустые экраны с шагом` |
| `natasha-hint` | browser `/clients`: «Подопечных пока нет…», «Создать приглашение», меню |
| `login-vera` | browser `/login`: Вера |
| `vera-hint` | browser `/workouts`: тренировку назначит тренер; меню «Мои тренировки · Выйти» |
| `a11y-install` | run `npm install -D @axe-core/playwright` |
| `ask-a11y` | агент: «Проверь доступность: axe на входе, у тренера и у подопечного в светлой и тёмной схеме, и вход одной клавиатурой. Сначала тест, код не меняй». Шаги: `a11y-e2e` (write `e2e/a11y.spec.ts`: axe `wcag2a`/`wcag2aa` на `/login`, `/clients`, `/workouts` в `colorScheme: 'light'` и `'dark'`; Tab — «Почта» → «Пароль» → «Войти», Enter → `/clients`), `a11y-red` (run `npx playwright test e2e/a11y.spec.ts` — ⚠ ожидаю `color-contrast` в тёмной схеме). Ответ — какие правила нарушены и где |
| `ask-contrast` | агент: «Исправь контраст в тёмной схеме токенами в globals.css, остальное не трогай». Шаги: `contrast-css` (edit `app/globals.css`), `a11y-green` (run тот же файл) |
| `c-a11y` | commit `Доступность: axe и клавиатура, контраст тёмной схемы` |

- [ ] **Step 1: Тест** `test('s20: новичок без шага → пустой экран в три части; меню и выход; axe — красный, после токенов — зелёный')`:
  - `vera-join.after` содержит «Тренировок пока нет», `natasha-empty.after` не содержит «Подопечных пока нет»;
  - `first-red.code` ≠ 0, `first-green.code` = 0;
  - `natasha-hint.after` содержит «Подопечных пока нет» и «Создать приглашение», `vera-hint.after` содержит «Выйти»;
  - `a11y-red.code` ≠ 0 и `a11y-red.out` содержит название нарушенного правила axe; `a11y-green.code` = 0;
  - `package.json` приложения после `a11y-install` содержит `@axe-core/playwright` в `devDependencies`.
- [ ] **Steps 2–6:** по «Порядку задачи сессии» (`--from s20-first-run`). Commit `demo-app: сессия s20 — первый экран, пустые экраны, доступность`.

### Task 3: Сессия `s21-nutrition` — питание и один итог на двоих

**Files:** по «Порядку задачи сессии» для `s21-nutrition`. **Interfaces:** Consumes: `s20-first-run`. Produces: события ниже.

| id | шаг |
|---|---|
| `typegen` | run `npx next typegen` |
| `nutrition-doc` | человек, write `docs/nutrition.md`: на этикетке — на 100 г; порция = значение × граммы / 100; число без единицы не пишем; больше 900 ккал на 100 г — переспросить «это кДж?»; итог дня у подопечного и сводка тренера — одна функция, округление один раз, при показе; цели тренера на день — ккал, белки, жиры, углеводы. Внизу: «Это решения нашего приложения» |
| `c-nutrition-doc` | commit `Питание: правила словами` |
| `ask-schema` | агент: «Сделай схему питания по docs/nutrition.md: цели тренера и дневник подопечного, RLS сразу. Миграцию применяй с моего подтверждения». Шаги: `n-sql` (write `supabase/migrations/0010_nutrition.sql`: `nutrition_goals`, `food_entries` — день, продукт, граммы, значения на 100 г; RLS и политики: подопечный — свои, тренер — своих), `n-apply` (run `psql -f …`), `n-test` (write `test/nutrition.test.ts`: Анна пишет своё, Марина видит, Света не видит), `n-run` (run `npx vitest run test/nutrition.test.ts`) |
| `ask-calc` | агент: «Расчёт по правилам: сначала тесты, потом код». Шаги: `calc-test` (write `lib/nutrition.test.ts`: 60 г при 350 ккал на 100 г → 210; 1464 на 100 г → ошибка «это кДж?»; «52,5» с запятой → 52,5; итог дня — сумма порций без округления), `calc-red` (run), `calc-code` (write `lib/nutrition.ts`: `portion(per100: number, grams: number): number`, `checkPer100(kcal: number): string \| null`, `dayTotal(entries): number`), `calc-green` (run) |
| `c-calc` | commit `Питание: схема, RLS, расчёт порции` |
| `ask-pages` | агент: «Страницы: дневник подопечного за день и цели со сводкой у тренера на карточке. День и неделя — в адресе». Шаги: `pages-anna` (write `app/nutrition/page.tsx` и `actions.ts`: строки с ккал порции, «Итого» — сумма показанных, уже округлённых строк), `pages-coach` (edit `app/clients/[id]/page.tsx`: форма целей, сводка недели через `dayTotal` и одно округление), `pages-nav` (edit `components/Nav.tsx`: «Питание») |
| `c-pages` | commit `Питание: дневник и сводка` |
| `dev` | run `npm run dev`, until `Ready` |
| `login-marina` | browser `/login`: Марина |
| `goals-set` | browser `/clients/1`: цели 1800 ккал, белки 120, жиры 60, углеводы 200, «Сохранить» |
| `login-anna` | browser `/login`: Анна |
| `food-1` … `food-3` | browser `/nutrition?day=2026-11-12`: три продукта с числами с этикеток. Числа подобрать в черновике так, чтобы построчное округление и одно округление итога разошлись на 1 ккал (настоящие продукты и граммы) |
| `anna-day` | browser `/nutrition?day=2026-11-12`: «Итого: N ккал» |
| `login-marina2` | browser `/login`: Марина |
| `coach-day` | browser `/clients/1?week=2026-11-09`: «12 ноября: N+1 ккал из 1800» — за один день два итога |
| `ask-one` | агент: «У подопечной и у тренера за один день разные итоги. Одна функция и одно округление для обоих экранов, сначала тест». Шаги: `one-test` (edit `lib/nutrition.test.ts`: итог экрана подопечного = итог сводки на тех же трёх строках), `one-red` (run), `one-code` (edit `app/nutrition/page.tsx`: итог — `dayTotal`, округление при показе одной функцией), `one-green` (run) |
| `c-one` | commit `Один итог дня на двоих` |
| `login-anna2` | browser `/login`: Анна |
| `anna-day2` | browser `/nutrition?day=2026-11-12`: «Итого: N+1 ккал» |

- [ ] **Step 1: Тест** `test('s21: тесты расчёта до кода; два итога за день расходятся, после одной функции — совпадают; чужой не видит дневник')`:
  - `calc-red.code` ≠ 0, `calc-green.code` = 0, `n-run.code` = 0;
  - число ккал в `anna-day.after` отличается от числа в `coach-day.after` ровно на 1;
  - `one-red.code` ≠ 0, `one-green.code` = 0;
  - число в `anna-day2.after` равно числу в `coach-day.after`;
  - `coach-day.after` содержит «12 ноября». **Review Focus 2.**
- [ ] **Steps 2–6:** `--from s21-nutrition`. Commit `demo-app: сессия s21 — питание, один итог на двоих`.

### Task 4: Сессия `s22-progress` — замеры и фото только своим

**Files:** по «Порядку задачи сессии» для `s22-progress`. **Interfaces:** Consumes: `s21-nutrition`. Produces: события ниже.

| id | шаг |
|---|---|
| `typegen` | run `npx next typegen` |
| `ask-measure` | агент: «Замеры тела — вес, талия, бёдра по датам: у подопечного форма, у тренера строки на карточке. RLS сразу, миграцию — с подтверждения». Шаги: `m-sql` (write `0011_measurements.sql`, проверки `> 0`), `m-apply`, `m-page` (write `app/measurements/page.tsx` и `actions.ts`), `m-coach` (edit `app/clients/[id]/page.tsx`), `m-test` (write `test/measurements.test.ts`: Света не видит замеры Анны), `m-run` |
| `c-measure` | commit `Замеры тела` |
| `m-data-file` | человек, write `supabase/tests/measurements.sql`: четыре замера Анны 16, 23, 30 октября и 6 ноября |
| `m-data-apply` | run `psql -f supabase/tests/measurements.sql` |
| `ask-photos` | агент: «Фото прогресса раз в месяц: подопечный загружает снимок, тренер видит. Сделай просто». Шаги: `ph-sql` (write `0012_photos.sql`: `photos` — подопечный, день, путь; RLS), `ph-apply`, `ph-route` (write `app/api/photos/route.ts`: `POST` кладёт файл в `public/uploads/<client_id>/<день>.jpg` и пишет строку), `ph-page` (edit `app/measurements/page.tsx`: список фото со ссылками) |
| `c-photos` | commit `Фото прогресса` |
| `dev` | run `npm run dev`, until `Ready` |
| `login-anna` | browser `/login`: Анна |
| `anna-measure` | browser `/measurements`: четыре замера по датам |
| `photo-make` | run `convert -size 600x800 xc:gray <файл вне проекта>.jpg` |
| `anna-curl` | run `curl` вход Анны с cookie в файл вне проекта (ловушка 19) |
| `photo-upload` | run `curl -b … -F photo=@… -F day=2026-11-13 http://localhost:3000/api/photos` |
| `photo-open` | run `curl -sI http://localhost:3000/uploads/1/2026-11-13.jpg` без cookie — ⚠ ожидаю `200 OK` и `image/jpeg` |
| `photo-git` | run `git status --short` — `?? public/uploads/` |
| `ask-private` | агент: «Фото открывается без входа по угадываемому адресу и лежит в public, рядом с кодом. Сделай: файлы вне public и вне git, выдача только вошедшему — подопечному и его тренеру — через RLS, удаление — строка и файл. Сначала тест». Шаги: `pr-test` (write `test/photos.test.ts`), `pr-red` (run), `pr-store` (edit `app/api/photos/route.ts`: `storage/photos/<client_id>/…`), `pr-get` (write `app/api/photos/[id]/route.ts`: `GET` — без входа 401, чужому 404 по `asUser`; `DELETE` — строка и файл), `pr-ignore` (edit `.gitignore`: `/storage/`), `pr-clean` (run удаление `public/uploads` буквальным путём), `pr-green` (run) |
| `c-private` | commit `Фото — только своим, удаление вместе с файлом` |
| `photo-upload2` | run тот же `curl` загрузки |
| `photo-anon` | run `curl -sI` нового адреса без cookie — `401` |
| `sveta-curl` | run вход Светы `curl` |
| `photo-sveta` | run `curl -sI` с cookie Светы — `404` |
| `marina-curl` | run вход Марины `curl` |
| `photo-marina` | run `curl -sI` с cookie Марины — `200`, `image/jpeg` |
| `photo-old` | run `curl -sI` старого `/uploads/1/2026-11-13.jpg` — `404` |
| `login-marina` | browser `/login`: Марина |
| `coach-measure` | browser `/clients/1`: замеры Анны по датам и фото |
| `photo-del` | run `curl -X DELETE` с cookie Анны |
| `photo-ls` | run `ls storage/photos/1; psql -At -c "select count(*) from photos"` — пусто и `0` |

- [ ] **Step 1: Тест** `test('s22: фото в public открывается без входа и просится в git; после — только своим, удаление с файлом; файлов людей нет в коммитах')`:
  - `photo-open.out` содержит `200` и `image/jpeg`; `photo-git.out` содержит `public/uploads/`;
  - `pr-red.code` ≠ 0, `pr-green.code` = 0;
  - `photo-anon.out` — `401`, `photo-sveta.out` — `404`, `photo-marina.out` — `200` и `image/jpeg`, `photo-old.out` — `404`;
  - последняя строка `photo-ls.out` — `0`;
  - ни один коммит сессии не содержит путей `public/uploads/`, `storage/`, `backups/`. **Review Focus 3.**
  - `anna-measure.after` содержит «16 октября» и «6 ноября». **Review Focus 2.**
- [ ] **Steps 2–6:** `--from s22-progress`. Commit `demo-app: сессия s22 — замеры, фото только своим`.

### Task 5: Сессия `s23-offline` — подход без связи и без дублей

**Files:** по «Порядку задачи сессии» для `s23-offline`. **Interfaces:** Consumes: `s22-progress`. Produces: события ниже.

| id | шаг |
|---|---|
| `typegen` | run `npx next typegen` |
| `why-grep` | run `grep -n "интернет" docs/feedback.md` — вопрос Анны (s13) |
| `ask-offline-test` | агент: «Подход в зале без интернета: сначала сквозной тест — без сети подход сохраняется с пометкой «не отправлено», сеть вернулась — уходит, тренер видит». Шаги: `off-e2e` (write `e2e/offline.spec.ts`: `context.setOffline(true)`, подход, пометка; сеть — отправка; счёт подходов до и после, как `quick-set.spec.ts`), `off-red` (run `npx playwright test e2e/offline.spec.ts` — ⚠ без сети форма не сохраняет) |
| `ask-queue` | агент: «Сделай очередь на телефоне: подход сначала в очередь, отправка по порядку, «отправлено» — только после ответа сервера. У каждого подхода свой номер». Шаги: `q-route` (write `app/api/workouts/[id]/sets/route.ts`: JSON, cookie, `asUser`), `q-form` (write `components/SetForm.tsx`: очередь в `localStorage`, `crypto.randomUUID()`, отправка по `online`), `q-page` (edit `app/workouts/[id]/page.tsx`), `q-green` (run тот же файл) |
| `c-queue` | commit `Подход без связи: очередь на отправку` |
| `ask-lost` | агент: «Проверь случай: сервер подход принял, а ответ потерялся — телефон отправит снова». Шаги: `lost-e2e` (edit `e2e/offline.spec.ts`: тест «ответ потерялся — один подход, одна строка»: `page.route` пропускает запрос `route.fetch()` и обрывает ответ `route.abort()`), `lost-red` (run — ожидали 1, получили 2) |
| `lost-db` | run `psql -At -c "select count(*) from sets where workout_id = 1"` |
| `ask-key` | агент: «Сервер должен принимать номер подхода один раз: уникальный ключ в базе, на повтор — «принято». Миграцию — с подтверждения». Шаги: `key-sql` (write `0013_sets_client_key.sql`: `client_key uuid unique`, допускает `null`), `key-apply`, `key-route` (edit маршрут: `insert … on conflict (client_key) do nothing`, на повтор — тот же ответ), `key-green` (run `npx playwright test e2e/offline.spec.ts`) |
| `c-key` | commit `Без дублей: номер подхода принимается один раз` |

- [ ] **Step 1: Тест** `test('s23: без сети подход пропадал; очередь; потерянный ответ даёт дубль, ключ — один раз')`:
  - `why-grep.out` содержит «интернет»;
  - `off-red.code` ≠ 0, `q-green.code` = 0;
  - `lost-red.code` ≠ 0 и `lost-red.out` содержит ожидаемое `1` и полученное `2`;
  - `key-green.code` = 0;
  - `0013` применяется со следующей сессии — проверяет шаг `schema` в s24 (Задача 6). **Review Focus 1.**
- [ ] **Steps 2–6:** `--from s23-offline`. Commit `demo-app: сессия s23 — подход без связи, без дублей`.

### Task 6: Сессия `s24-beta` — бета: приглашение тренера, замечания и сбои

**Files:** по «Порядку задачи сессии» для `s24-beta`. **Interfaces:** Consumes: `s23-offline`. Produces: события ниже.

| id | шаг |
|---|---|
| `typegen` | run `npx next typegen` |
| `schema` | run `psql -c "\d sets"` — `client_key` и его уникальный индекс из `0013`, применённой рекордером |
| `beta-doc` | человек, write `docs/beta.md`: кто — Полина, Тимур и Ксения, тренеры из других залов; срок — неделя, до 22 ноября; задачи — пригласить подопечного, назначить программу, открыть отчёт; замечания — кнопкой «Сообщить о проблеме»: что делали, что ожидали, что вышло; одну сессию смотрим молча и записываем, где застряли; «нравится?» не спрашиваем |
| `c-beta-doc` | commit `План беты` |
| `dev` | run `npm run dev`, until `Ready` |
| `login-marina` | browser `/login`: Марина |
| `invite-coach` | browser `/clients`: «Создать приглашение» — для Полины |
| `polina-join` | browser `url: { from: 'invite-coach', match }`: Полина регистрируется — «Мои тренировки» |
| `polina-db` | run `psql -c "select p.name, p.role, c.coach_id is not null as has_coach from profiles p left join clients c on c.user_id = p.id where p.name = 'Полина'"` — `client`, тренер есть |
| `ask-coach-invite` | агент: «Тренерам беты нужно своё приглашение: по нему заводится тренер, а не подопечный. Создаёт его только владелец базы, кнопки в приложении нет. Сначала тест». Шаги: `ci-test` (edit `test/invites.test.ts`: тренерское → профиль `coach` без записи в `clients`; обычное → `client`), `ci-red` (run), `ci-sql` (write `0014_coach_invites.sql`), `ci-apply`, `ci-join` (edit `app/join/[code]/actions.ts`), `ci-green` (run) |
| `c-coach-invite` | commit `Приглашение тренера` |
| `beta-invites-file` | человек, write `supabase/tests/beta-invites.sql`: тренерские приглашения для Тимура и Ксении с заданными кодами |
| `beta-invites-apply` | run `psql -f supabase/tests/beta-invites.sql` |
| `timur-join` | browser `/join/<код Тимура>`: Тимур регистрируется — пустой экран тренера дня 15 |
| `timur-db` | run `psql -c "select name, role from profiles where name in ('Тимур', 'Полина')"` |
| `ask-report` | агент: «Замечания — в одно место: «Сообщить о проблеме» в меню, форма — что делали, что ожидали, что вышло, страница сама; строка в таблице feedback, читает только владелец базы». Шаги: `fb-sql` (write `0015_feedback.sql`), `fb-apply`, `fb-page` (write `app/problem/page.tsx` и `actions.ts`), `fb-nav` (edit `components/Nav.tsx`) |
| `c-feedback` | commit `Сообщить о проблеме` |
| `timur-feedback` | browser `/problem`: Тимур пишет замечание (авторский текст: что делал, что ожидал, что вышло) |
| `fb-db` | run `psql -c "select page, did, expected, got from feedback"` |
| `crash` | browser `/clients/abc` (Тимур) — ⚠ ожидаю 500 на `bigint` |
| `errors-before` | run `psql -At -c "select count(*) from pg_tables where tablename = 'errors'"` — журнала нет: `0` |
| `ask-errors` | агент: «О сбое тренер не напишет. Нужна понятная страница ошибки и журнал сбоев в базе. Сначала тест». Шаги: `err-test` (write `test/errors.test.ts`), `err-red` (run), `err-sql` (write `0016_errors.sql`: путь, сообщение, время), `err-apply`, `err-page` (write `app/error.tsx`: «Что-то пошло не так», без стектрейса), `err-hook` (write `instrumentation.ts`: `onRequestError` пишет путь и сообщение в `errors` — ⚠ поведение Next 16 проверить в черновике; если хука нет — запись из `error.tsx` через серверное действие, Ruling), `err-green` (run) |
| `c-errors` | commit `Сбои: понятная страница и журнал` |
| `crash2` | browser `/clients/abc` — «Что-то пошло не так» |
| `errors-db` | run `psql -c "select path, message from errors"` — строка со сбоем, без времени в выводе |

- [ ] **Step 1: Тест** `test('s24: обычное приглашение заводит тренера беты подопечной; тренерское — тренером; замечание в таблице; сбой — понятная страница и строка журнала')`:
  - `schema.out` содержит `client_key` (миграции `0010`–`0013` применены рекордером со следующей сессии). **Review Focus 1.**
  - `polina-join.urlAfter` — `/workouts`, `polina-db.out` содержит `client`;
  - `ci-red.code` ≠ 0, `ci-green.code` = 0;
  - `timur-join.after` содержит «Подопечных пока нет», `timur-db.out` содержит `Тимур` и `coach`;
  - `fb-db.out` содержит текст замечания Тимура;
  - `crash2.after` содержит «Что-то пошло не так», `errors-db.out` содержит `/clients/abc`;
  - `beta-doc` содержит «22 ноября». **Review Focus 2.**
- [ ] **Steps 2–6:** `--from s24-beta`. Commit `demo-app: сессия s24 — бета, приглашение тренера, замечания и сбои`.

### Task 7: Сессия `s25-beta-fixes` — исправления по одному

**Files:** по «Порядку задачи сессии» для `s25-beta-fixes`. **Interfaces:** Consumes: `s24-beta`. Produces: события ниже.

| id | шаг |
|---|---|
| `typegen` | run `npx next typegen` |
| `findings-doc` | человек, write `docs/beta-findings.md`: замечания беты и журнала по стопкам дня 8 — «Портит данные»: `/join` без лимита попыток; по ответу «почта уже зарегистрирована» видно чужую почту (аудит дня 12); «Мешает каждый день»: `/clients/abc` — «Что-то пошло не так» вместо «не найдено» (журнал дня 19); пустой комментарий молча пропадает (замечание Тимура); «Подождёт»: политика вставки программ без проверки роли. Каждая строка — что делали, что ожидали, что вышло. Текст авторский, но каждое замечание воспроизводится шагами этой сессии |
| `c-findings` | commit `Замечания беты по стопкам` |
| `all-branch` | run `git switch -c fix/all` |
| `ask-all` | агент: «Исправь все замечания из docs/beta-findings.md». Шаги — правки по одной на файл: `all-join` (`app/join/[code]/actions.ts`), `all-rate` (`lib/rate-limit.ts`), `all-id` (`app/clients/[id]/page.tsx`), `all-comment` (`app/workouts/[id]/actions.ts`), `all-programs` (новая миграция в ветке). Ответ: «Исправил все пять» |
| `c-all` | commit `Все замечания беты` |
| `all-stat` | run `git diff main fix/all --stat` — много файлов, ни одного в `test/` и `e2e/` |
| `all-drop` | run `git switch main && git branch -D fix/all` |
| `ask-join-fix` | агент: «Первое замечание: /join. Сначала тест, который повторяет беду: шесть попыток с занятой почтой. Потом правка, тест после этого не трогай». Шаги: `jf-test` (write `e2e/join-limit.spec.ts`: на занятую почту и на отказ приглашения — один текст; шестая попытка — «Слишком много попыток»), `jf-red` (run `npx playwright test e2e/join-limit.spec.ts`), `jf-code` (edit `app/join/[code]/actions.ts`: текст из Global Constraints, лимит через `lib/rate-limit.ts`), `jf-green` (run) |
| `c-join-fix` | commit `/join: один ответ и лимит попыток` |
| `ask-id-fix` | агент: «Второе: /clients/abc. Тест, правка, тест не трогать». Шаги: `id-test` (write `e2e/not-found.spec.ts`: нечисловой номер — «Не найдено»), `id-red`, `id-code` (edit `app/clients/[id]/page.tsx` и `app/workouts/[id]/page.tsx`: `notFound()`), `id-green` |
| `c-id-fix` | commit `Нечисловой номер — «не найдено»` |
| `ask-comment-fix` | агент: «Третье: пустой комментарий. Тест, правка, тест не трогать». Шаги: `cm-test`, `cm-red`, `cm-code` (ошибка под полем), `cm-green` |
| `c-comment-fix` | commit `Пустой комментарий — понятная ошибка` |
| `fix-log` | run `git log --stat --oneline -3` — три коммита, в каждом тест и код |

- [ ] **Step 1: Тест** `test('s25: «исправь всё» — пять файлов без тестов; три круга — красный, правка, зелёный, коммит с тестом')`:
  - `all-stat.out` называет пять файлов `ask-all` и ни одного пути `test/` или `e2e/`; `all-drop.out` содержит `Deleted branch fix/all`;
  - `jf-red`, `id-red`, `cm-red` — код ≠ 0; `jf-green`, `id-green`, `cm-green` — код 0;
  - `jf-test` не меняется после `jf-red` (шаги агента: правка теста только в `jf-test`);
  - в `fix-log.out` три коммита, у каждого есть путь `e2e/` или `test/` и путь кода;
  - `jf-code` содержит текст «Проверьте почту или войдите, если аккаунт уже есть».
- [ ] **Steps 2–6:** `--from s25-beta-fixes`. Commit `demo-app: сессия s25 — исправления беты по одному`.

### Task 8: Сессия `s26-launch` — запуск

**Files:** по «Порядку задачи сессии» для `s26-launch`. **Interfaces:** Consumes: `s25-beta-fixes`. Produces: события ниже.

| id | шаг |
|---|---|
| `typegen` | run `npx next typegen` |
| `dev` | run `npm run dev`, until `Ready` |
| `home-before` | browser `/` (без входа): прототип s02 — «Тренировка / Вес, кг / Повторы / Сохранить подход» |
| `ask-home` | агент: «Главная — страница о продукте: для кого, что умеет, как начать; «Войти» и «Политика конфиденциальности». Прототип подходов в памяти убери». Шаги: `home-page` (write `app/page.tsx`), `home-api` (run удаление `app/api/sets/route.ts` буквальным путём) |
| `c-home` | commit `Главная — о продукте` |
| `home-after` | browser `/`: для кого, что умеет, как начать |
| `ask-data` | агент (Plan): «Перечисли таблицы и файлы, где лежат данные людей, и что в них. Код не меняй». Шаги: `d-tables` (run `psql -c '\dt public.*'`), `d-photos` (read `app/api/photos/route.ts`). Ответ: данные о здоровье — подходы, заметки, комментарии, питание, замеры, фото |
| `privacy-doc` | человек, write `docs/privacy.md`: что храним, зачем, кто видит (подопечный видит все шаблоны программ своего тренера — сказать прямо), где лежит (база и папка фото), как удалить аккаунт. Внизу: «Это не юридическая консультация: правила различаются по странам» |
| `ask-privacy-page` | агент: «Страница /privacy по docs/privacy.md». Шаги: `pv-page` (write `app/privacy/page.tsx`) |
| `c-privacy` | commit `Политика конфиденциальности` |
| `vera-file` | человек, write `supabase/tests/test-account.sql`: Вера — подопечная Марины с тренировкой, подходом, комментарием и замером |
| `vera-apply` | run `psql -f supabase/tests/test-account.sql` |
| `del-try` | run `psql -c "delete from auth.users where email = 'vera@example.com'"` — ⚠ ожидаю ошибку внешнего ключа |
| `ask-delete` | агент: «Политика обещает удаление, а удалить нечем. Подопечный удаляет свой аккаунт: все его строки и файлы фото. Сначала тест, миграцию — с подтверждения». Шаги: `del-test` (write `test/delete-account.test.ts`), `del-red`, `del-sql` (write `0017_delete_account.sql`: функция удаления своих строк по порядку), `del-apply`, `del-action` (write `app/account/page.tsx` и `actions.ts`: «Удалить аккаунт», файлы из `storage/photos/<client_id>`), `del-green` |
| `c-delete` | commit `Удаление аккаунта` |
| `login-vera` | browser `/login`: Вера |
| `vera-delete` | browser `/account`: «Удалить аккаунт» — на главную |
| `del-count` | run `psql -At -c "select count(*) from auth.users where email = 'vera@example.com'"` — `0` |
| `ask-checklist` | агент (Plan): «Пройди чек-лист перед первым релизом: по каждому пункту — сделано, не сделано или не знаю, и где это видно. Код не меняй». Шаги: `cl-rls` (read `supabase/migrations/0002_rls.sql`), `cl-env` (read `.gitignore`), `cl-err` (read `app/error.tsx`), `cl-e2e` (run `ls e2e`), `cl-restore` (read `docs/restore.md`). Ответ: по пунктам s45; «проверенный способ отката релиза — не сделано: выкладки ещё нет»; адрес приглашения из заголовка `Host` — «не знаю, проверить на хостинге» |
| `check-run` | run `npm run check` |
| `e2e-all` | run `npx playwright test` |
| `roadmap-doc` | человек, write `docs/roadmap.md`: «позже» из паритета, пожелания беты, раз в неделю — журнал сбоев, раз в месяц — учения с копией, одна область сопровождения — агенту на месяц |
| `c-launch` | commit `План на месяц после запуска` |

- [ ] **Step 1: Тест** `test('s26: главная о продукте; удалить аккаунт нечем → удаление; проверки и все сквозные тесты зелёные')`:
  - `home-before.after` содержит «Сохранить подход», `home-after.after` содержит «Войти» и «Политика конфиденциальности»;
  - `del-try.code` ≠ 0 и `del-try.out` содержит `foreign key`;
  - `del-red.code` ≠ 0, `del-green.code` = 0, последняя строка `del-count.out` — `0`;
  - `check-run.code` и `e2e-all.code` = 0, `e2e-all.out` называет все файлы `e2e/`;
  - `privacy-doc` называет питание, замеры и фото.
- [ ] **Steps 2–6:** `--from s26-launch`. Commit `demo-app: сессия s26 — запуск`.

---

## Порядок задачи урока (Задачи 9–15)

Как в плане недели 2 (раздел «Порядок задачи урока»): урок `kind: 'day'`, экспорт `dayNN` и `dayNNScript`, `DAY_CHAPTERS`, 3 `items`, кадр записи в «Пример», «Неверно» → «Верно» по экрану, `recap` с действиями, не меньше 2 пояснений, окно «прежняя длина … 5400», удалить `course/video/day-NN/` (ссылки — `grep -rn "video/day-NN\|day-NN/script\|dayNNScript"`), тесты длины дня. Уроки ревью недели 2 (`lesson-dispatch-context.md`, «Week 2 day lessons») действуют. Латиница в репликах — через `SAY`: новые слова недели — `axe`, `localStorage`, `curl`, `uuid`, `on conflict`, `unique`, `Tab`, `Enter`, `JPEG`, `Sentry`, `CNAME`, `DNS`, `Hobby`.

### Task 9: Ролик `day-15` «Первое знакомство и полировка»

Урок `day15`, книга: s36, s38, s41, s45, s59, s71. `minFrames: 4683`. Запись: `s20-first-run`.

| Глава | Сцены |
|---|---|
| Что строим сегодня | `items`: «Первый экран новичка», «Пустой экран с подсказкой», «Проверка доступности» |
| Пример | `vera-join` (Browser: первый экран новой подопечной); `ask-path` (Agent, Plan); `ask-first` (Agent: тест красный → меню и пустые экраны → зелёный); `vera-hint` (Browser) |
| Подводный камень | `natasha-empty` (пустой список без слова) — «Неверно»; `natasha-hint` — «Верно»; `ask-a11y` (`a11y-red`: правило контраста в тёмной схеме) — «Неверно»; `ask-contrast` (`contrast-css`, `a11y-green`) — «Верно». Подпись: цвет и рамку фокуса кадр не рисует — их показывает отчёт axe |
| Проверьте у себя | три части пустого экрана; вход одной клавиатурой (рис. 9.5 `ch9_keyboard`, если влезает при ≥ 24 px, иначе доска); ИИ проверяет — решаете вы (s45); показ молча трём знакомым (s38, s41) — доской |

Кроме того: тесты старого ролика уже на дне 21 (Задача 1); `src/day/day.test.tsx` и `summary.test.ts` — длина нового дня 15.

### Task 10: Ролик `day-16` «Питание»

Урок `day16`, книга: s22, s34, s43, s51, s60. `minFrames: 5040`. Запись: `s21-nutrition`.

| Глава | Сцены |
|---|---|
| Что строим сегодня | «Цели тренера», «Дневник по этикетке», «Один итог на двоих» |
| Пример | `nutrition-doc` (Editor: правила словами); `ask-schema` (RLS сразу, негативный тест); `ask-calc` (тесты до кода: 210, «это кДж?», запятая); `goals-set`, `anna-day` (Browser) |
| Подводный камень | `anna-day` и `coach-day` — у одного дня два итога — «Неверно»; `ask-one` (`one-red` → `one-code` → `one-green`), `anna-day2` — «Верно» |
| Проверьте у себя | единица у каждого числа; правдоподобие — больше 900 ккал на 100 г переспросить; одно округление — одной функцией, правило тестом (s34); чужой не видит дневник (s51) |

### Task 11: Ролик `day-17` «Замеры и фото прогресса»

Урок `day17`, книга: s43, s48, s82, s60, s22. `minFrames: 4999`. Запись: `s22-progress`.

| Глава | Сцены |
|---|---|
| Что строим сегодня | «Замеры по неделям», «Фото — только своим», «Удаление вместе с файлом» |
| Пример | `ask-measure` (схема и RLS, негативный тест); `anna-measure`, `coach-measure` (Browser) |
| Подводный камень | `photo-upload`, `photo-open` (200 без входа), `photo-git` (`public/uploads/` просится в git) — «Неверно»; доска s82 (Tea, открытое хранилище); `ask-private`; `photo-anon` (401), `photo-sveta` (404), `photo-marina` (200) — «Верно». Подпись «локальная папка вместо хранилища Supabase» |
| Проверьте у себя | войдите вторым пользователем и откройте чужое (s48); файлы людей — вне public и вне git; удаление — строка и файл (`photo-del`, `photo-ls`); секрет — только в окружении (s22) |

### Task 12: Ролик `day-18` «Тренировка без интернета»

Урок `day18`, книга: s22, s23, s25, s43, s34, s87. `minFrames: 5205` (окно 195 кадров — один камень). Запись: `s23-offline`.

| Глава | Сцены |
|---|---|
| Что строим сегодня | «Подход без связи», «Очередь на отправку», «Без дублей» |
| Пример | `why-grep` (вопрос Анны); `ask-offline-test` (`off-red`); `ask-queue` (`q-green`). Подпись «Playwright отключает сеть» |
| Подводный камень | `ask-lost` (`lost-red`: ожидали 1, получили 2) — «Неверно»; `ask-key` (`key-sql`, `key-green`) — «Верно» |
| Проверьте у себя | отключите интернет и запишите, что вышло (s23); номер у каждого действия — защита от дублей (s25); уникальный ключ просите явно (s43); конфликт правок — доской |

### Task 13: Ролик `day-19` «Бета-тест: запуск»

Урок `day19`, книга: s38, s41, s55, s16, s45. `minFrames: 4568`. Запись: `s24-beta`.

| Глава | Сцены |
|---|---|
| Что строим сегодня | «План беты», «Тренер по приглашению тренера», «Замечания и сбои в одном месте» |
| Пример | `beta-doc` (Editor); `timur-feedback` (Browser), `fb-db` (Terminal) |
| Подводный камень | `polina-join`, `polina-db` (`client`) — «Неверно»; `ask-coach-invite` (`ci-red` → `ci-green`), `timur-join`, `timur-db` (`coach`) — «Верно»; `crash`, `errors-before` — «Неверно»; `ask-errors`, `crash2`, `errors-db` — «Верно». Подпись «журнал в базе вместо сервиса отслеживания ошибок» |
| Проверьте у себя | задача вместо «нравится?», молчать и записывать (s38, s41) — доской; замечание: что делал, что ожидал, что вышло (s16); сначала немногим — канарейка (s55) — доской; ошибки понятны человеку и записаны для нас (s45) |

### Task 14: Ролик `day-20` «Бета-тест: исправления»

Урок `day20`, книга: s22, s19, s32, s34, s51, s54. `minFrames: 5232` (окно 168 кадров — один камень и один круг). Запись: `s25-beta-fixes`.

| Глава | Сцены |
|---|---|
| Что строим сегодня | «Список по тяжести», «Исправление с тестом», «Одно исправление — один коммит» |
| Пример | `findings-doc` (Editor: стопки дня 8) |
| Подводный камень | `ask-all` → `all-stat` (пять файлов, ни одного теста) — «Неверно»; `all-drop`; `ask-join-fix` (`jf-red` → `jf-code` → `jf-green`) — «Верно»; `fix-log` |
| Проверьте у себя | тест повторяет беду, каждый баг — тест навсегда (s51); правим код, а не тест (s34, рис. 5.6 — доской с её текстом); одно исправление — один коммит (s22, s54); «исправлено» говорит тот, кто нашёл — доской |

### Task 15: Ролик `day-21` «Запуск» и последние старые ролики

Урок `day21`, книга: s81, s45, s47, s57, s60, s76. `minFrames: 5110`. Запись: `s26-launch`.

| Глава | Сцены |
|---|---|
| Что строим сегодня | «Страница о продукте», «Политика от своих данных», «Чек-лист перед запуском» |
| Пример | `home-before` → `home-after` (Browser); свой домен — доской по s81 (A и CNAME, https сам, до 48 часов, Hobby — для некоммерческих); `ask-data` (Plan); `privacy-doc` (Editor); `ask-checklist` (Plan), `check-run`, `e2e-all` |
| Подводный камень | `del-try` (политика обещает удаление, а удалить нечем) — «Неверно»; `ask-delete` (`del-red` → `del-green`), `vera-delete`, `del-count` — «Верно» |
| Проверьте у себя | чек-лист s45: сделано, не сделано, не знаю — и проверить руками несколько пунктов; телефон и главный сценарий (s47); политика — не юридическая консультация (s57); одна область сопровождения — агенту на месяц (s76, `roadmap-doc`) |

Кроме того — старых роликов больше нет:
- [ ] e2e старого ролика (Задача 1 поставила их на день 21): обложка, пояснение и субтитры — на `script.gen.json` нового дня 21 (`poster`), тест ошибки загрузки — без изменений; тест «старый ролик (1280 × 720) один на дне» удалить (нет предмета). В телефонном цикле `video-chapters.spec.ts` день 21 — ролик дня, проверки «без списка глав» больше нет.
- [ ] `narration.test.ts`: тест «произношение реплик старых роликов не меняется молча» и снимок `narration.old-videos.spoken.txt` удалить (старых реплик нет); адреса MP4 `day-15` … `day-21` убрать из `src/video/registry.ts`.
- [ ] Код 1280 × 720 и скачивания MP4 не удалять: его держат тесты на фикстуре, судьба — после решения автора об озвучке (`docs/superpowers/notes/2026-10-30-voiceover.md`). README §7 называет его.
- [ ] **Review Focus 4:** `npm test`, `npm run e2e` — PASS; в каталоге нет сценария 1280 × 720 (тест в `registry.test.ts`: у каждого ролика каталога `width` 1920).

---

### Task 16: Проверка недели 3, правила, публикация

**Files:**
- Modify: `course/e2e/video-chapters.spec.ts`, `course/video/term/README.md`, `demo-app/README.md`, `course/video/RULES.md`, `course/README.md`

**Interfaces:** Consumes: всё выше.

- [ ] **Step 1: e2e:** телефонный цикл «390 px» — дни 2–21, `dayLesson` — 8–21, в `SCRIPTS` и `DAYS` — семь новых дней; пункты плана дней 15–21 на экране и в кадре. **Review Focus 5.**
- [ ] **Step 2:** `npm run e2e` — PASS.
- [ ] **Step 3:** README набора:
  - ловушки недели 3 — сквозные тесты приложения вместо шагов браузера (сеть, файлы, схема цвета), `curl` для файлов, только свой файл e2e;
  - §7 — курс переделан целиком; что осталось: код 1280 × 720 и MP4 до решения об озвучке, отложенные мелочи.

  `demo-app/README.md` — сессии `s20`–`s26`; `RULES.md` и `course/README.md` — без ссылок на старые `day-15`.
- [ ] **Step 4:** Полная проверка из `course/`: `npm test`, `npm run lint`, `npx tsc -b`, `npm run e2e`.
- [ ] **Step 5:** Commit `video: неделя 3 в стиле «Репозиторий» — e2e и правила`.
- [ ] **Step 6:** `npm run build && node scripts/artifact-page.mjs dist out/artifact-video`. В `page.html` — `<title>Вайб-курс «Пилот роликов»</title>`. Публикация тем же путём, адрес прежний: `https://claude.ai/artifact/89U9omZ2QbodxrG8jdVU6E`, старые файлы сборки — `null`. Затем `git push -u origin video/terminal`, описание PR #7.
