// Сессия 19: надёжность (утро 10 ноября; база — из миграций и seed, db: true). Последняя сессия недели 2, ролик дня 14.
// Проверки: первый шаг typegen (npx next typegen) — в состоянии сессии нет папки .next, а npx tsc --noEmit в npm run check ищет типы
// маршрутов Next (как в s13). npm run check — линтер, типы, тесты приложения и сборка — зелёный. Сквозной тест e2e/cycle.spec.ts с s09
// падает на getByLabel("Дата"): по подстроке её находит и подпись графика «Объём тренировок по датам» (strict mode: два элемента).
// Человек ставит точную подпись — getByLabel("Дата", { exact: true }), и npx playwright test проходит целиком: cycle и quick-set (s18).
// Сервер для него поднимает и гасит playwright.config.ts (s07, reuseExistingServer), поэтому шага dev нет: порт 3000 свободен.
// Скорость: человек пишет supabase/seed-speed.sql — Анне 2000 тренировок по 20 подходов (generate_series, 40 000 строк в sets), данные
// для замера, как seed-load.sql в s09; psql -f загружает их. EXPLAIN ANALYZE запроса страницы тренировки (подходы по workout_id) —
// Seq Scan on sets: внешний ключ индекса не создаёт, база перебирает всю таблицу. Агенту — эта строка вывода; он пишет миграцию
// 0009_sets_workout_index.sql и применяет её psql -f с подтверждения. Тот же EXPLAIN ANALYZE — Bitmap Index Scan по sets_workout_id_idx:
// план тот же и до автоматического analyze, и после (подходы одной тренировки лежат на разных страницах таблицы). Время в выводе
// при перезаписи меняется: реплики на число не опираются.
// Копии: сначала /backups/ в .gitignore (в копии почты и хеши паролей, в git ей не место), потом pg_dump -n public — «копия есть».
// Подводный камень — учения: копия одной public в пустую базу restore_check не восстанавливается: pg_restore выходит с кодом 1
// и «errors ignored on restore: 42» — profiles ссылается на auth.users, политики вызывают auth.uid(), а схемы auth в копии нет
// (и extensions — invites берёт код из gen_random_bytes; CREATE SCHEMA public — уже есть); auth.users в копии нет — войти некому.
// Исправление — копия всей базы (pg_dump без -n): восстанавливается в restore_full без ошибок, подходов в рабочей базе и в копии поровну.
// Человек записывает учения в docs/restore.md: шаги, что сверять (подходы, пользователи, вход), где лежит копия. Про вход — то, что
// нашёл черновой прогон: pg_restore -d не переносит настроек самой базы (search_path со схемой extensions, а в ней crypt() входа),
// на копии их задают заново. Строки для кадра сессия создаёт сама (seed-speed.sql); базы restore_check и restore_full живут до конца сессии.
// Запись с середины цепочки: node scripts/record-session.mjs --from s19-reliability (из course/). Id шагов постоянные: на них ссылаются уроки.
// Режимы в ролике: ask-index — Accept edits (правка без вопроса, psql -f — с вопросом [y / n]).
// Разработчица в репликах агента и в документах по имени не названа: подопечная тоже Анна.

// Сквозной тест s07: подпись «Дата» по подстроке находит и график (s09) — точная подпись. Правит человек, кавычки файла — двойные
const CYCLE_DATE = 'await marina.getByLabel("Дата").fill("2026-11-09");'
const CYCLE_DATE_EXACT = 'await marina.getByLabel("Дата", { exact: true }).fill("2026-11-09");'

// Данные для замера — пишет человек, по образцу seed-load.sql (s09): не миграция и не демо-данные, запускается вручную
const SEED_SPEED = `-- Данные для замера скорости: у Анны 2000 тренировок, в каждой по 20 подходов — 40 000 строк в sets.
-- Это не демо-данные и не миграция: запускается вручную (psql -f), чтобы EXPLAIN ANALYZE показал план на настоящем объёме.

-- 2000 тренировок Анны, по одной в день, в прошлом
insert into workouts (client_id, title, day)
select c.id, 'Замер ' || n, date '2026-10-01' - n
from clients c, generate_series(1, 2000) as n
where c.user_id = '33333333-3333-3333-3333-333333333333';

-- В каждой — 20 подходов: вес 40–60 кг, 6–12 повторов
insert into sets (workout_id, weight, reps)
select w.id, 40 + s % 5 * 5, 6 + s % 7
from workouts w, generate_series(1, 20) as s
where w.title like 'Замер %';
`

// Индекс — пишет агент. Внешний ключ индекса не создаёт: по workout_id подходы ищут страница тренировки, карточка и отчёт тренера
const INDEX_SQL = `-- Индекс подходов по тренировке: по workout_id подходы ищут страница тренировки, карточка подопечного и отчёт тренера.
-- Внешний ключ sets.workout_id индекса не создаёт (сам Postgres строит его только для первичного ключа и unique),
-- поэтому без него база перебирала всю таблицу — в EXPLAIN ANALYZE это Seq Scan on sets.
create index sets_workout_id_idx on sets (workout_id);
`

// .gitignore: копии базы — рядом с .env*, в git им не место
const IGNORE_ENV = '# env files (can opt-in for committing if needed)\n.env*\n'
const IGNORE_ENV_BACKUPS = `${IGNORE_ENV}
# копии базы (pg_dump): в них почты и хеши паролей
/backups/
`

// Учения — пишет человек. Про вход — из чернового прогона: на restore_full запрос входа падает, crypt() не находится
const RESTORE = `# Учения: восстановление из копии

Копия, из которой ни разу не восстанавливались, — не копия. Поэтому копию базы мы не только делаем, но и восстанавливаем — в отдельную учебную базу — и сверяем с рабочей. Рабочую базу учения не трогают.

## Где лежит копия

- \`backups/trainer-full.dump\` в папке проекта — копия всей базы (\`pg_dump -Fc\`).
- В git её нет: \`/backups/\` в \`.gitignore\`. В копии — почты пользователей и хеши паролей.
- Папка проекта годится только для учений: пропадёт компьютер — пропадёт и копия. Копию на случай беды держат там, куда не дотянутся ни агент, ни его команды.

## Шаги

1. Копия всей базы: \`pg_dump -Fc -f backups/trainer-full.dump\`.
   Копия одной схемы \`public\` (\`pg_dump -n public\`) не годится: \`profiles\` и политики RLS ссылаются на схему \`auth\`, а её в такой копии нет. \`pg_restore\` кончается ошибками, \`auth.users\` в копии нет — войти некому.
2. Пустая учебная база и восстановление в неё: \`createdb restore_full && pg_restore -d restore_full backups/trainer-full.dump\` — без ошибок.
3. Сверить копию с рабочей базой — список ниже.
4. Записать дату и что не сошлось. Учебную базу удалить: \`dropdb restore_full\`.

## Что сверять

- Подходы: \`select count(*) from sets\` — в рабочей базе и в копии одно число.
- Пользователи: \`select count(*) from auth.users\` — тоже одно число. Без них в приложение никто не войдёт.
- Вход: приложение с \`DATABASE_URL\` на \`restore_full\` — войти тренером и подопечным. Числа этого не покажут: настройки самой базы \`pg_restore -d\` не переносит, а среди них \`search_path\` со схемой \`extensions\`. В ней лежит \`crypt()\`, которым вход сверяет пароль. На копии его задают заново: \`alter database restore_full set search_path to "$user", public, extensions\`.

## Журнал

- 10 ноября: копия одной \`public\` не восстановилась — нет схемы \`auth\`. Копия всей базы восстановилась, подходов в рабочей базе и в копии поровну. Пользователей и вход ещё не сверяли.
`

export default {
  id: 's19-reliability',
  from: 's18-quick-set',
  date: '2026-11-10T10:00:00+03:00',
  db: true,
  steps: [
    // подготовка: в состоянии сессии нет папки .next, а npx tsc --noEmit в npm run check ищет типы маршрутов Next
    { id: 'typegen', run: 'npx next typegen' },
    // линтер, типы, тесты приложения и сборка
    { id: 'check-run', run: 'npm run check' },
    // getByLabel("Дата") по подстроке находит и подпись графика «Объём тренировок по датам» (s09) — точная подпись; правит человек
    { id: 'e2e-fix', edit: 'e2e/cycle.spec.ts', find: CYCLE_DATE, replace: CYCLE_DATE_EXACT },
    // оба сквозных теста: cycle (s07) и quick-set (s18); сервер поднимает и гасит playwright.config.ts
    { id: 'e2e-all', run: 'npx playwright test' },
    { id: 'c-e2e-fix', commit: 'Сквозной тест: точная подпись «Дата»' },
    // скорость: данные для замера — пишет человек
    { id: 'speed-file', write: 'supabase/seed-speed.sql', content: SEED_SPEED },
    { id: 'speed-load', run: 'psql -f supabase/seed-speed.sql' },
    // до индекса: Seq Scan on sets — перебор всей таблицы
    { id: 'explain', run: 'psql -c "explain analyze select weight, reps from sets where workout_id = 1500"' },
    {
      // Accept edits: правка без вопроса, psql -f — с вопросом [y / n]
      id: 'ask-index',
      agent: {
        prompt: 'Вот вывод EXPLAIN ANALYZE: Seq Scan on sets по workout_id. Добавь индекс миграцией, применяй с подтверждения',
        reply: 'Индекс sets_workout_id_idx на sets (workout_id): внешний ключ сам индекса не создаёт. Проверь тем же EXPLAIN ANALYZE.',
      },
      steps: [
        { id: 'index-sql', write: 'supabase/migrations/0009_sets_workout_index.sql', content: INDEX_SQL },
        { id: 'index-apply', run: 'psql -f supabase/migrations/0009_sets_workout_index.sql' },
      ],
    },
    // после индекса: Bitmap Index Scan по sets_workout_id_idx
    { id: 'explain2', run: 'psql -c "explain analyze select weight, reps from sets where workout_id = 1500"' },
    // копии — не в git: сначала .gitignore, потом копия
    { id: 'backup-ignore', edit: '.gitignore', find: IGNORE_ENV, replace: IGNORE_ENV_BACKUPS },
    // копия одной схемы public — «копия есть»
    { id: 'dump-public', run: 'mkdir -p backups && pg_dump -n public -Fc -f backups/trainer.dump' },
    // подводный камень — учения: в копии нет схемы auth, на неё ссылаются profiles и политики; pg_restore — код 1
    { id: 'restore-try', run: 'createdb restore_check && pg_restore -d restore_check backups/trainer.dump' },
    // пользователей в копии нет — войти некому
    { id: 'restore-users', run: 'psql -d restore_check -c "select count(*) from auth.users"' },
    // исправление — копия всей базы
    { id: 'dump-all', run: 'pg_dump -Fc -f backups/trainer-full.dump' },
    { id: 'restore-full', run: 'createdb restore_full && pg_restore -d restore_full backups/trainer-full.dump' },
    // подходов в рабочей базе и в копии поровну
    { id: 'restore-count', run: 'psql -At -c "select count(*) from sets" && psql -At -d restore_full -c "select count(*) from sets"' },
    // учения — пишет человек: шаги, что сверять, где лежит копия
    { id: 'restore-doc', write: 'docs/restore.md', content: RESTORE },
    { id: 'c-reliability', commit: 'Индекс подходов; учения по восстановлению' },
  ],
}
