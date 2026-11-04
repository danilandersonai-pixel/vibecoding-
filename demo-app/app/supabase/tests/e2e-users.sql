-- Люди, которых ждут сквозные тесты e2e/first-run.spec.ts: Наташа — тренер без подопечных, Вера — подопечная Марины
-- (supabase/seed.sql) без тренировок. В seed.sql их нет: Наташу заводил supabase/tests/new-coach.sql, Веру — приглашение Марины,
-- а тестовый аккаунт Веры (supabase/tests/test-account.sql) удалён на странице «Аккаунт».
-- Это не демо-данные и не миграция: запускается вручную (psql -f) перед общим прогоном npx playwright test. Повторный запуск
-- ничего не меняет и не падает (on conflict do nothing) — и там, где Наташу уже завёл new-coach.sql.
-- Пароль у обеих demo-password, в auth.users — только его хеш (bcrypt).
insert into auth.users (id, email, encrypted_password) values
  ('66666666-6666-6666-6666-666666666666', 'natasha@example.com', crypt('demo-password', gen_salt('bf'))),
  ('77777777-7777-7777-7777-777777777777', 'vera@example.com', crypt('demo-password', gen_salt('bf')))
on conflict (id) do nothing;

insert into profiles (id, role, name) values
  ('66666666-6666-6666-6666-666666666666', 'coach', 'Наташа'),
  ('77777777-7777-7777-7777-777777777777', 'client', 'Вера')
on conflict (id) do nothing;

insert into clients (coach_id, user_id, name) values
  ('11111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'Вера')
on conflict (user_id) do nothing;
