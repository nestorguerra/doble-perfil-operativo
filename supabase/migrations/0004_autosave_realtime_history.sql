-- Autosave, realtime e historico - Autosave, Realtime e Historico
-- Mejora el resumen de auditoria y asegura tablas clave en Supabase Realtime.

create or replace function public.log_change_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  action_label text;
  entity_label text;
  payload jsonb;
  summary_text text;
  target_id uuid;
  title_value text;
begin
  target_id = coalesce(new.id, old.id);
  payload = case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;

  action_label = case tg_op
    when 'INSERT' then 'creado'
    when 'UPDATE' then 'actualizado'
    when 'DELETE' then 'eliminado'
    else lower(tg_op)
  end;

  entity_label = case tg_table_name
    when 'activities' then 'Actividad'
    when 'schedule_entries' then 'Horario'
    when 'notes' then 'Nota'
    when 'pending_tasks' then 'Pendiente'
    when 'tools' then 'Herramienta'
    when 'topics' then 'Tema'
    when 'profiles' then 'Perfil'
    else tg_table_name
  end;

  title_value = coalesce(
    nullif(payload ->> 'title', ''),
    nullif(payload ->> 'name', ''),
    nullif(left(payload ->> 'content', 48), ''),
    nullif(payload ->> 'work_date', ''),
    target_id::text
  );

  summary_text = entity_label || ' ' || action_label || ': ' || title_value;

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
    summary_text,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach table_name in array array[
      'profiles',
      'activities',
      'activity_profiles',
      'schedule_entries',
      'pending_tasks',
      'notes',
      'topics',
      'tools',
      'change_history'
    ]
    loop
      if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = table_name
      ) then
        execute format('alter publication supabase_realtime add table public.%I', table_name);
      end if;
    end loop;
  end if;
end;
$$;
