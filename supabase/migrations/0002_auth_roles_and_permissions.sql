-- Sprint 1 - Login y Base Segura
-- Roles simples, helpers de permisos y ajuste de RLS.

alter table public.user_profiles
  drop constraint if exists user_profiles_role_check;

update public.user_profiles
set role = case
  when role in ('owner', 'admin') then 'admin'
  else 'user'
end;

alter table public.user_profiles
  alter column role set default 'user';

alter table public.user_profiles
  add constraint user_profiles_role_check check (role in ('admin', 'user'));

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select role
      from public.user_profiles
      where id = auth.uid()
      limit 1
    ),
    'user'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'admin';
$$;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_admin() to authenticated;

create or replace function public.prevent_unauthorized_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role and not public.is_admin() then
    raise exception 'Only admins can change user roles';
  end if;

  return new;
end;
$$;

drop trigger if exists user_profiles_prevent_role_escalation on public.user_profiles;
create trigger user_profiles_prevent_role_escalation
before update on public.user_profiles
for each row execute function public.prevent_unauthorized_role_change();

drop policy if exists "Admins can read all public profiles" on public.user_profiles;
create policy "Admins can read all public profiles"
on public.user_profiles
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update user roles" on public.user_profiles;
create policy "Admins can update user roles"
on public.user_profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create index if not exists user_profiles_role_idx on public.user_profiles(role);
