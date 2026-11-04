-- Индекс подходов по тренировке: по workout_id подходы ищут страница тренировки, карточка подопечного и отчёт тренера.
-- Внешний ключ sets.workout_id индекса не создаёт (сам Postgres строит его только для первичного ключа и unique),
-- поэтому без него база перебирала всю таблицу — в EXPLAIN ANALYZE это Seq Scan on sets.
create index sets_workout_id_idx on sets (workout_id);
