-- Может ли подопечная создать программу: вставка от имени Анны (подопечная Марины, supabase/seed.sql), как её выполнил бы Supabase.
-- Политика «тренер ведёт свои программы» (0004_programs.sql) сверяет только хозяина (coach_id = auth.uid()), а роль — нет;
-- приглашения (0008_invites.sql) создаёт только тренер. Замечание беты «Подождёт» (docs/beta-findings.md). В конце rollback — ничего не меняется
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333"}';
insert into programs (coach_id, title) values ('33333333-3333-3333-3333-333333333333', 'Программа подопечной') returning title;
rollback;
