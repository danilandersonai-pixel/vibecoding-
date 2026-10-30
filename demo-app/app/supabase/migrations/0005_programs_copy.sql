-- Копия вместо ссылки: строка тренировки хранит своё упражнение, подходы и повторы — копию строки шаблона на момент назначения.
-- Правка и удаление шаблона прошлые тренировки и их подходы больше не меняют.

-- Копия в строке тренировки. Строки, назначенные раньше, получают её из своего шаблона
alter table workout_items
  add column exercise_id bigint references exercises (id),
  add column sets int check (sets > 0),
  add column reps int check (reps > 0);

update workout_items wi
   set exercise_id = pi.exercise_id, sets = pi.sets, reps = pi.reps
  from program_items pi
 where pi.id = wi.program_item_id;

alter table workout_items
  alter column exercise_id set not null,
  alter column sets set not null,
  alter column reps set not null;

-- Связь со шаблоном — без каскада: удалили строку шаблона — у строки тренировки пропадает только ссылка
alter table workout_items
  alter column program_item_id drop not null,
  drop constraint workout_items_program_item_id_fkey,
  add constraint workout_items_program_item_id_fkey
    foreign key (program_item_id) references program_items (id) on delete set null;

-- Подходы — без каскада: строку тренировки с подходами база удалить не даст
alter table sets
  drop constraint sets_workout_item_id_fkey,
  add constraint sets_workout_item_id_fkey
    foreign key (workout_item_id) references workout_items (id);

-- Копия при назначении: новая строка тренировки без упражнения берёт упражнение, подходы и повторы из своей строки шаблона.
-- Функция работает с правами того, кто вставляет: чужую строку шаблона ей не прочитать (RLS), и строка без упражнения не вставится
create function copy_program_item() returns trigger
  language plpgsql
  set search_path = public
as $$
begin
  if new.exercise_id is null then
    select pi.exercise_id, pi.sets, pi.reps
      into new.exercise_id, new.sets, new.reps
      from program_items pi
     where pi.id = new.program_item_id;
  end if;
  return new;
end;
$$;

create trigger copy_program_item
  before insert on workout_items
  for each row execute function copy_program_item();

-- Упражнения тренировки — из её копии, а не из шаблона
create or replace view workout_exercises with (security_invoker = true) as
  select wi.id, wi.workout_id, e.name as exercise, wi.sets, wi.reps
    from workout_items wi
    join exercises e on e.id = wi.exercise_id;
