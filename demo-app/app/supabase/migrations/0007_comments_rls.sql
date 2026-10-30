-- RLS на comments: в 0006 таблицу создали из SQL без неё, и любой вошедший читал все комментарии — Света видела комментарии Анны.
-- Политики смотрят на workouts и clients, а на comments не ссылается ни одна политика других таблиц: круга политик нет.

alter table comments enable row level security;

-- Читают подопечный тренировки и его тренер
create policy "подопечный и тренер читают" on comments
  for select to authenticated using (workout_id in (
    select w.id from workouts w join clients c on c.id = w.client_id
     where c.user_id = auth.uid() or c.coach_id = auth.uid()));

-- Пишут они же и только от своего имени: автор — сам вошедший
create policy "подопечный и тренер пишут" on comments
  for insert to authenticated with check (
    author_id = auth.uid()
    and workout_id in (
      select w.id from workouts w join clients c on c.id = w.client_id
       where c.user_id = auth.uid() or c.coach_id = auth.uid()));
