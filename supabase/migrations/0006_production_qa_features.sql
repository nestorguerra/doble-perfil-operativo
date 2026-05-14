-- Sprint 8 - QA, Produccion y GitHub Pages
-- Soporte para notas destacadas y consultas de produccion.

alter table public.notes
  add column if not exists is_pinned boolean not null default false;

create index if not exists notes_is_pinned_idx on public.notes (is_pinned, updated_at desc);
create index if not exists change_history_changed_by_idx on public.change_history (changed_by, changed_at desc);
create index if not exists change_history_entity_type_idx on public.change_history (entity_type, changed_at desc);
