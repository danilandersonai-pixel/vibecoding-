-- Слой Supabase для локальной базы записей.
--
-- Что это. Рекордер (record.mjs) для сессий с `db: true` поднимает обычный PostgreSQL 16 на порту 54322 (порт базы `supabase start`)
-- и до первой миграции проекта выполняет этот файл. Он создаёт то, что в настоящем Supabase есть в базе с самого начала:
-- расширение pgcrypto, роли anon, authenticated и service_role, права на схему public и схему auth с таблицей auth.users
-- и функциями auth.uid() и auth.role(). Миграции приложения после этого пишутся так же, как для Supabase.
--
-- Почему так. Docker в контейнере записи не запускается, поэтому `supabase start` недоступен (спецификация §3).
-- Чего здесь нет: PostgREST (HTTP-интерфейса к таблицам), настоящего Auth (токенов, писем, провайдеров входа), хранилища файлов.
-- Вход в приложении — свой маршрут, который проверяет пароль через crypt() по auth.users.
--
-- Файл можно выполнить повторно: ничего не пересоздаётся, если уже есть.

create extension if not exists pgcrypto;

-- Роли для запросов от имени пользователя: на них действуют политики RLS; service_role политики обходит
do $$
begin
  if not exists (select from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end
$$;

-- Схема public и таблицы, последовательности и функции, которые создаёт postgres (миграции идут от его имени), доступны этим ролям;
-- доступ к строкам дальше ограничивают политики RLS
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

-- Пользователи: упрощённая auth.users (в Supabase в ней больше столбцов). Пароль хранится хешем: crypt('пароль', gen_salt('bf'))
create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  encrypted_password text not null,
  created_at timestamptz not null default now()
);

-- Кто сейчас обращается к базе: Supabase кладёт данные токена в request.jwt.claims. Пустая строка (так claims остаётся
-- после конца транзакции, где их задали через set_config(…, true)) читается как «нет данных», а не как ошибка разбора json.
create or replace function auth.uid() returns uuid
language sql stable
as $$
  select nullif(nullif(current_setting('request.jwt.claims', true), '')::json->>'sub', '')::uuid
$$;

create or replace function auth.role() returns text
language sql stable
as $$
  select nullif(nullif(current_setting('request.jwt.claims', true), '')::json->>'role', '')
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid(), auth.role() to anon, authenticated, service_role;
