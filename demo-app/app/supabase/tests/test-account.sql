-- Тестовый аккаунт: Вера — подопечная Марины (supabase/seed.sql) с тренировкой, подходом, комментарием и замером,
-- как у подопечного после первой тренировки. На нём проверяем обещание политики (docs/privacy.md): аккаунт можно удалить.
-- Это не демо-данные и не миграция: запускается вручную (psql -f). Пароль demo-password, в auth.users — только его хеш (bcrypt).
insert into auth.users (id, email, encrypted_password) values
  ('77777777-7777-7777-7777-777777777777', 'vera@example.com', crypt('demo-password', gen_salt('bf')));

insert into profiles (id, role, name) values
  ('77777777-7777-7777-7777-777777777777', 'client', 'Вера');

insert into clients (coach_id, user_id, name) values
  ('11111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'Вера');

-- номер Веры в clients ставит база — тренировку и замер вешаем на него через user_id
insert into workouts (client_id, title, day)
  select id, 'Ноги', '2026-11-16' from clients where user_id = '77777777-7777-7777-7777-777777777777';

insert into measurements (client_id, day, weight, waist, hips)
  select id, '2026-11-16', 61.5, 70, 96 from clients where user_id = '77777777-7777-7777-7777-777777777777';

-- подход и комментарий — к её тренировке; комментарий пишет сама Вера
insert into sets (workout_id, weight, reps, note)
  select w.id, 20, 12, 'колено уходит внутрь' from workouts w join clients c on c.id = w.client_id
   where c.user_id = '77777777-7777-7777-7777-777777777777';

insert into comments (workout_id, author_id, body)
  select w.id, c.user_id, 'После приседа тянет поясницу' from workouts w join clients c on c.id = w.client_id
   where c.user_id = '77777777-7777-7777-7777-777777777777';
