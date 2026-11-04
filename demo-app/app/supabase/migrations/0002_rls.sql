-- Защита в базе: RLS на всех таблицах. Строку видно и можно менять, только если её пропускает политика.
-- Политики — для вошедших (роль authenticated); без входа (роль anon) не видно ничего. auth.uid() — id вошедшего.

alter table profiles enable row level security;
alter table clients enable row level security;
alter table workouts enable row level security;
alter table sets enable row level security;

-- Профиль: каждый видит свой
create policy "свой профиль" on profiles
  for select to authenticated using (id = auth.uid());

-- Подопечные: тренер видит, добавляет и меняет своих; подопечный видит себя
create policy "тренер видит своих" on clients
  for select to authenticated using (coach_id = auth.uid());
create policy "тренер добавляет своих" on clients
  for insert to authenticated with check (coach_id = auth.uid());
create policy "тренер меняет своих" on clients
  for update to authenticated using (coach_id = auth.uid());
create policy "подопечный видит себя" on clients
  for select to authenticated using (user_id = auth.uid());

-- Тренировки: тренер — у своих подопечных, подопечный — свои
create policy "тренер видит тренировки" on workouts
  for select to authenticated using (client_id in (select id from clients where coach_id = auth.uid()));
create policy "тренер добавляет тренировки" on workouts
  for insert to authenticated with check (client_id in (select id from clients where coach_id = auth.uid()));
create policy "тренер меняет тренировки" on workouts
  for update to authenticated using (client_id in (select id from clients where coach_id = auth.uid()));
create policy "подопечный видит тренировки" on workouts
  for select to authenticated using (client_id in (select id from clients where user_id = auth.uid()));

-- Подходы: тренер — в тренировках своих подопечных, подопечный — в своих тренировках
create policy "тренер видит подходы" on sets
  for select to authenticated using (workout_id in (
    select w.id from workouts w join clients c on c.id = w.client_id where c.coach_id = auth.uid()));
create policy "тренер добавляет подходы" on sets
  for insert to authenticated with check (workout_id in (
    select w.id from workouts w join clients c on c.id = w.client_id where c.coach_id = auth.uid()));
create policy "тренер меняет подходы" on sets
  for update to authenticated using (workout_id in (
    select w.id from workouts w join clients c on c.id = w.client_id where c.coach_id = auth.uid()));
create policy "подопечный видит подходы" on sets
  for select to authenticated using (workout_id in (
    select w.id from workouts w join clients c on c.id = w.client_id where c.user_id = auth.uid()));
create policy "подопечный добавляет подходы" on sets
  for insert to authenticated with check (workout_id in (
    select w.id from workouts w join clients c on c.id = w.client_id where c.user_id = auth.uid()));
