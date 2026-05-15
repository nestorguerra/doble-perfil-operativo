-- UX comercial y administracion - UX Comercial, Responsive y Administracion
-- Etiquetas simples para temas y soporte de preferencias de usuario.

alter table public.topics
  add column if not exists tags text[] not null default '{}'::text[];

create index if not exists topics_tags_idx on public.topics using gin (tags);

update public.user_profiles
set preferences = coalesce(preferences, '{}'::jsonb) || jsonb_build_object('density', 'comfortable')
where preferences is null or not (preferences ? 'density');
