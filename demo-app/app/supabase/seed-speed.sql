-- Данные для замера скорости: у Анны 2000 тренировок, в каждой по 20 подходов — 40 000 строк в sets.
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
