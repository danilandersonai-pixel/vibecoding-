-- Что видит Марина: запрос от её имени, как его выполняет Supabase. В конце rollback — ничего не меняется
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111"}', true);
select id, name from clients order by id;
rollback;
