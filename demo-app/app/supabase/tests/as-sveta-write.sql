-- Может ли Света, подопечная Игоря, написать под чужой тренировкой: вставка от её имени под «Ногами» Анны (тренировка 1),
-- затем от имени Анны — комментарии к тренировке с подписью автора, как на странице. В конце rollback — ничего не меняется
-- ON_ERROR_ROLLBACK: ошибка одной команды откатывает только её, и проверка идёт дальше
\set ON_ERROR_ROLLBACK on
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"55555555-5555-5555-5555-555555555555"}', true);
insert into comments (workout_id, author_id, body) values (1, '55555555-5555-5555-5555-555555555555', 'Привет от Светы');
select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333"}', true);
select case when cm.author_id = c.user_id then c.name else 'Тренер' end as author, cm.body
  from comments cm
  join workouts w on w.id = cm.workout_id
  join clients c on c.id = w.client_id
 where cm.workout_id = 1
 order by cm.id;
rollback;
