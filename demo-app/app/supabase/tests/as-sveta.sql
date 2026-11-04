-- Что видит Света, подопечная Игоря: запрос от её имени, как его выполняет Supabase. В конце rollback — ничего не меняется
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"55555555-5555-5555-5555-555555555555"}', true);
select body from comments;
rollback;
