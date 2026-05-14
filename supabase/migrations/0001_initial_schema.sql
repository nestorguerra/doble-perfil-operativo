-- Sprint 0 - Fundacion Tecnica
-- Doble Perfil Operativo

create extension if not exists "pgcrypto";

create type public.activity_status as enum ('pending', 'in_progress', 'completed', 'paused', 'archived');
create type public.task_status as enum ('open', 'completed', 'cancelled');
create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'user',
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_profiles_role_check check (role in ('admin', 'user'))
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  color text not null default '#007aff',
  visible_role text not null default 'Perfil operativo',
  display_order smallint not null,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_color_check check (color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint profiles_display_order_unique unique (display_order)
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status public.activity_status not null default 'pending',
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activity_profiles (
  activity_id uuid not null references public.activities(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (activity_id, profile_id)
);

create table public.schedule_entries (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  work_date date not null,
  start_time time not null,
  end_time time not null,
  total_minutes integer generated always as (
    greatest(
      0,
      extract(epoch from (end_time - start_time))::integer / 60
    )
  ) stored,
  notes text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedule_entries_time_check check (end_time > start_time)
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete cascade,
  content text not null,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notes_has_parent_check check (profile_id is not null or activity_id is not null)
);

create table public.pending_tasks (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete cascade,
  title text not null,
  status public.task_status not null default 'open',
  priority public.task_priority not null default 'medium',
  due_date date,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pending_tasks_has_parent_check check (profile_id is not null or activity_id is not null)
);

create table public.tools (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete cascade,
  name text not null,
  description text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tools_has_parent_check check (profile_id is not null or activity_id is not null)
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete cascade,
  title text not null,
  description text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint topics_has_parent_check check (profile_id is not null or activity_id is not null)
);

create table public.change_history (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  change_type text not null,
  changed_by uuid references auth.users(id) on delete set null default auth.uid(),
  summary text not null,
  before_data jsonb,
  after_data jsonb,
  changed_at timestamptz not null default now(),
  constraint change_history_change_type_check check (change_type in ('insert', 'update', 'delete'))
);

create index profiles_created_by_idx on public.profiles(created_by);
create index profiles_updated_at_idx on public.profiles(updated_at desc);

create index activities_created_by_idx on public.activities(created_by);
create index activities_updated_at_idx on public.activities(updated_at desc);
create index activities_status_idx on public.activities(status);

create index activity_profiles_profile_id_idx on public.activity_profiles(profile_id);

create index schedule_entries_activity_id_idx on public.schedule_entries(activity_id);
create index schedule_entries_profile_id_idx on public.schedule_entries(profile_id);
create index schedule_entries_work_date_idx on public.schedule_entries(work_date desc);
create index schedule_entries_profile_date_idx on public.schedule_entries(profile_id, work_date desc);
create index schedule_entries_activity_date_idx on public.schedule_entries(activity_id, work_date desc);
create index schedule_entries_created_by_idx on public.schedule_entries(created_by);
create index schedule_entries_updated_at_idx on public.schedule_entries(updated_at desc);

create index notes_profile_id_idx on public.notes(profile_id);
create index notes_activity_id_idx on public.notes(activity_id);
create index notes_created_by_idx on public.notes(created_by);
create index notes_updated_at_idx on public.notes(updated_at desc);

create index pending_tasks_profile_id_idx on public.pending_tasks(profile_id);
create index pending_tasks_activity_id_idx on public.pending_tasks(activity_id);
create index pending_tasks_status_idx on public.pending_tasks(status);
create index pending_tasks_due_date_idx on public.pending_tasks(due_date);
create index pending_tasks_created_by_idx on public.pending_tasks(created_by);
create index pending_tasks_updated_at_idx on public.pending_tasks(updated_at desc);

create index tools_profile_id_idx on public.tools(profile_id);
create index tools_activity_id_idx on public.tools(activity_id);
create index tools_created_by_idx on public.tools(created_by);
create index tools_updated_at_idx on public.tools(updated_at desc);

create index topics_profile_id_idx on public.topics(profile_id);
create index topics_activity_id_idx on public.topics(activity_id);
create index topics_created_by_idx on public.topics(created_by);
create index topics_updated_at_idx on public.topics(updated_at desc);

create index change_history_entity_idx on public.change_history(entity_type, entity_id);
create index change_history_changed_by_idx on public.change_history(changed_by);
create index change_history_changed_at_idx on public.change_history(changed_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();

  if to_jsonb(new) ? 'updated_by' then
    new.updated_by = auth.uid();
  end if;

  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.log_change_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  target_id = coalesce(new.id, old.id);

  insert into public.change_history (
    entity_type,
    entity_id,
    change_type,
    changed_by,
    summary,
    before_data,
    after_data
  )
  values (
    tg_table_name,
    target_id,
    lower(tg_op),
    auth.uid(),
    tg_table_name || ' ' || lower(tg_op),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger activities_set_updated_at
before update on public.activities
for each row execute function public.set_updated_at();

create trigger schedule_entries_set_updated_at
before update on public.schedule_entries
for each row execute function public.set_updated_at();

create trigger notes_set_updated_at
before update on public.notes
for each row execute function public.set_updated_at();

create trigger pending_tasks_set_updated_at
before update on public.pending_tasks
for each row execute function public.set_updated_at();

create trigger tools_set_updated_at
before update on public.tools
for each row execute function public.set_updated_at();

create trigger topics_set_updated_at
before update on public.topics
for each row execute function public.set_updated_at();

create trigger profiles_log_change_history
after insert or update or delete on public.profiles
for each row execute function public.log_change_history();

create trigger activities_log_change_history
after insert or update or delete on public.activities
for each row execute function public.log_change_history();

create trigger schedule_entries_log_change_history
after insert or update or delete on public.schedule_entries
for each row execute function public.log_change_history();

create trigger notes_log_change_history
after insert or update or delete on public.notes
for each row execute function public.log_change_history();

create trigger pending_tasks_log_change_history
after insert or update or delete on public.pending_tasks
for each row execute function public.log_change_history();

create trigger tools_log_change_history
after insert or update or delete on public.tools
for each row execute function public.log_change_history();

create trigger topics_log_change_history
after insert or update or delete on public.topics
for each row execute function public.log_change_history();

alter table public.user_profiles enable row level security;
alter table public.profiles enable row level security;
alter table public.activities enable row level security;
alter table public.activity_profiles enable row level security;
alter table public.schedule_entries enable row level security;
alter table public.notes enable row level security;
alter table public.pending_tasks enable row level security;
alter table public.tools enable row level security;
alter table public.topics enable row level security;
alter table public.change_history enable row level security;

create policy "Users can read their own public profile"
on public.user_profiles
for select
to authenticated
using (id = auth.uid());

create policy "Users can insert their own public profile"
on public.user_profiles
for insert
to authenticated
with check (id = auth.uid());

create policy "Users can update their own public profile"
on public.user_profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "Authenticated users can read profiles"
on public.profiles
for select
to authenticated
using (true);

create policy "Authenticated users can manage profiles"
on public.profiles
for all
to authenticated
using (true)
with check (true);

create policy "Authenticated users can read activities"
on public.activities
for select
to authenticated
using (true);

create policy "Authenticated users can manage activities"
on public.activities
for all
to authenticated
using (true)
with check (true);

create policy "Authenticated users can read activity profile links"
on public.activity_profiles
for select
to authenticated
using (true);

create policy "Authenticated users can manage activity profile links"
on public.activity_profiles
for all
to authenticated
using (true)
with check (true);

create policy "Authenticated users can read schedule entries"
on public.schedule_entries
for select
to authenticated
using (true);

create policy "Authenticated users can manage schedule entries"
on public.schedule_entries
for all
to authenticated
using (true)
with check (true);

create policy "Authenticated users can read notes"
on public.notes
for select
to authenticated
using (true);

create policy "Authenticated users can manage notes"
on public.notes
for all
to authenticated
using (true)
with check (true);

create policy "Authenticated users can read pending tasks"
on public.pending_tasks
for select
to authenticated
using (true);

create policy "Authenticated users can manage pending tasks"
on public.pending_tasks
for all
to authenticated
using (true)
with check (true);

create policy "Authenticated users can read tools"
on public.tools
for select
to authenticated
using (true);

create policy "Authenticated users can manage tools"
on public.tools
for all
to authenticated
using (true)
with check (true);

create policy "Authenticated users can read topics"
on public.topics
for select
to authenticated
using (true);

create policy "Authenticated users can manage topics"
on public.topics
for all
to authenticated
using (true)
with check (true);

create policy "Authenticated users can read change history"
on public.change_history
for select
to authenticated
using (true);

insert into public.profiles (id, name, description, color, visible_role, display_order, is_active)
values
  (
    '11111111-1111-4111-8111-111111111111',
    'Perfil A',
    'Primer perfil operativo conectado al mapa de actividad.',
    '#007aff',
    'Perfil operativo',
    1,
    true
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'Perfil B',
    'Segundo perfil operativo con horarios, notas y pendientes propios.',
    '#30d158',
    'Perfil operativo',
    2,
    true
  )
on conflict (id) do update
set
  name = excluded.name,
  description = excluded.description,
  color = excluded.color,
  visible_role = excluded.visible_role,
  display_order = excluded.display_order,
  is_active = excluded.is_active;
