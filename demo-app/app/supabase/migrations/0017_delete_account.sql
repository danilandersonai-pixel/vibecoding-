-- Удаление аккаунта (docs/privacy.md, «Как удалить аккаунт»): подопечный удаляет свой аккаунт — все свои строки.
-- Удалить пользователя из auth.users напрямую нельзя: каскад доходит до profiles, а на профиль без каскада ссылаются clients,
-- comments, invites, feedback и programs — база отказывает (clients_user_id_fkey). Поэтому строки удаляются по порядку: сначала те,
-- что ссылаются на другие, в конце — сам пользователь. Функция — одна транзакция: не удалилось что-то одно, не удалится ничего.
-- Удаляет только вошедшего (auth.uid()): чужой аккаунт так не удалить. Тренер так аккаунт не удалит — у него подопечные.
-- Файлы фото удаляет приложение (app/account/actions.ts): функция возвращает номер подопечного, по нему — папка снимков.
-- security definer: функция работает с правами владельца базы — пользователю auth.users закрыта, а удалять нужно и там.
create function delete_account() returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  my_client bigint;
begin
  select id into my_client from clients where user_id = me;
  if my_client is null then
    raise exception 'Удалить можно только свой аккаунт подопечного';
  end if;
  -- тренировки: подходы, строки тренировок, комментарии под ними (и тренера тоже), потом сами тренировки
  delete from sets where workout_id in (select id from workouts where client_id = my_client);
  delete from workout_items where workout_id in (select id from workouts where client_id = my_client);
  delete from comments where workout_id in (select id from workouts where client_id = my_client) or author_id = me;
  delete from workouts where client_id = my_client;
  -- питание, замеры и строки фото
  delete from food_entries where client_id = my_client;
  delete from nutrition_goals where client_id = my_client;
  delete from measurements where client_id = my_client;
  delete from photos where client_id = my_client;
  -- приглашение, по которому пришёл, и замечания
  delete from invites where accepted_by = me;
  delete from feedback where author_id = me;
  -- программы, если он их создал: политика программ (0004) сверяет хозяина, но не роль («Подождёт» беты).
  -- Строки программ уйдут каскадом, у строк чужих тренировок пропадёт только ссылка на шаблон (0005)
  delete from programs where coach_id = me;
  delete from clients where id = my_client;
  -- профиль удалит каскад от auth.users (0001_init.sql)
  delete from auth.users where id = me;
  return my_client;
end;
$$;

-- Вызывает вошедший из приложения (роль authenticated); без входа — нельзя
revoke execute on function delete_account() from public, anon;
grant execute on function delete_account() to authenticated;
