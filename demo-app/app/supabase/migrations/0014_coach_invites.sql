-- Приглашение тренера: по нему заводится тренер, а не подопечный (бета, docs/beta.md). Обычное приглашение (0008_invites.sql)
-- по-прежнему заводит подопечного того тренера, кто его создал.
-- role — кого заводит приглашение. У тренерского приглашения тренера-хозяина нет: coach_id пуст.
-- Создаёт тренерское приглашение только владелец базы (psql): тренеру права по столбцам из 0008 дают писать лишь coach_id,
-- поэтому у его приглашений role всегда client. Кнопки в приложении нет.
alter table invites add column role text not null default 'client' check (role in ('client', 'coach'));
alter table invites alter column coach_id drop not null;
alter table invites add constraint invites_coach_by_role check ((role = 'client') = (coach_id is not null));

-- Принять приглашение — с ролью. Регистрация (app/join/[code]/actions.ts) заводит профиль подопечного; по обычному
-- приглашению он становится подопечным тренера из приглашения, как раньше, а по тренерскому — тренером: профиль coach,
-- строки в clients нет. Возвращает роль — регистрация по ней ведёт на первый экран.
drop function accept_invite(text, uuid, text);
create function accept_invite(invite_code text, new_user uuid, client_name text) returns text
language plpgsql
set search_path = public
as $$
declare
  invite invites;
begin
  select * into invite from invites where code = invite_code for update;
  if not found then
    raise exception 'Приглашение не найдено';
  elsif invite.accepted_by is not null then
    raise exception 'Приглашение уже использовано';
  elsif invite.revoked_at is not null then
    raise exception 'Приглашение отозвано';
  elsif invite.expires_at <= now() then
    raise exception 'Срок приглашения истёк';
  end if;
  update invites set accepted_by = new_user where id = invite.id;
  if invite.role = 'coach' then
    update profiles set role = 'coach' where id = new_user;
  else
    insert into clients (coach_id, user_id, name) values (invite.coach_id, new_user, client_name);
  end if;
  return invite.role;
end;
$$;

revoke execute on function accept_invite(text, uuid, text) from public, anon, authenticated;
