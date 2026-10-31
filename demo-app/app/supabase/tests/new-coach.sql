-- Новый тренер без подопечных: Наташа. Регистрации тренера в приложении нет, поэтому заводим её, как тренеров в seed.sql:
-- пользователь в auth.users (пароль demo-password, в базе только его хеш bcrypt) и профиль тренера.
-- Это не демо-данные и не миграция: запускается вручную (psql -f), чтобы пройти первый день нового тренера.
insert into auth.users (id, email, encrypted_password) values
  ('66666666-6666-6666-6666-666666666666', 'natasha@example.com', crypt('demo-password', gen_salt('bf')));

insert into profiles (id, role, name) values
  ('66666666-6666-6666-6666-666666666666', 'coach', 'Наташа');
