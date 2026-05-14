-- Sprint 2 - Dashboard y Perfiles Interconectados
-- Campo visible de rol operativo y soporte de configuracion de perfiles.

alter table public.profiles
  add column if not exists visible_role text not null default 'Perfil operativo';

update public.profiles
set visible_role = 'Perfil operativo'
where visible_role is null or trim(visible_role) = '';

create index if not exists profiles_is_active_idx on public.profiles(is_active);
