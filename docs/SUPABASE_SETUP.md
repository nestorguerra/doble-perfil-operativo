# Configuracion de Supabase

## Objetivo

Dejar el backend listo para login seguro, base de datos persistente, sincronizacion y trazabilidad.

## Pasos

1. Crear un proyecto en Supabase.
2. Ir a SQL Editor.
3. Ejecutar las migraciones en orden:
   - `supabase/migrations/0001_initial_schema.sql`
   - `supabase/migrations/0002_auth_roles_and_permissions.sql`
4. Ir a Project Settings > API.
5. Copiar `Project URL` y `anon public key`.
6. Crear `.env` desde `.env.example`.
7. Rellenar:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
VITE_AUTH_REGISTRATION_ENABLED=true
```

`VITE_AUTH_REGISTRATION_ENABLED` controla si se puede crear usuario desde la pantalla publica. Para produccion cerrada, poner `false` tras crear los usuarios iniciales.

## Auth

La app usa Supabase Auth. No guarda passwords manualmente.

Tablas relevantes:

- `auth.users`: usuarios reales gestionados por Supabase.
- `public.user_profiles`: extension publica del usuario para nombre visible, rol y preferencias.
- Roles iniciales: `user` y `admin`.

## Realtime

Para sincronizacion en tiempo real:

1. Ir a Database > Replication.
2. Activar Realtime para las tablas necesarias.
3. Para Sprint 0 basta con `profiles`.
4. En sprints posteriores activar `activities`, `schedule_entries`, `notes`, `pending_tasks`, `tools`, `topics` y `change_history`.

## Seguridad

La migracion activa RLS en las tablas publicas.

Politica Sprint 1:

- Usuarios anonimos no tienen policies sobre tablas privadas.
- Usuarios autenticados pueden leer y escribir datos operativos compartidos.
- Cada usuario puede leer y actualizar su propio `user_profiles`.
- Usuarios `admin` pueden consultar y actualizar perfiles publicos de usuario.
- Un trigger bloquea cambios de rol si el usuario actual no es `admin`.

En sprints posteriores se puede endurecer por equipo, rol o pertenencia a workspace.

## Crear primer administrador

Tras crear el primer usuario, ejecutar en SQL Editor:

```sql
update public.user_profiles
set role = 'admin'
where id = (
  select id
  from auth.users
  where email = 'tu-email@empresa.com'
  limit 1
);
```
