# Configuracion de Supabase

## Objetivo

Dejar el backend listo para login seguro, base de datos persistente, sincronizacion y trazabilidad.

## Pasos

1. Crear un proyecto en Supabase.
2. Ir a SQL Editor.
3. Ejecutar `supabase/migrations/0001_initial_schema.sql`.
4. Ir a Project Settings > API.
5. Copiar `Project URL` y `anon public key`.
6. Crear `.env` desde `.env.example`.
7. Rellenar:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

## Auth

La app usa Supabase Auth. No guarda passwords manualmente.

Tablas relevantes:

- `auth.users`: usuarios reales gestionados por Supabase.
- `public.user_profiles`: extension publica del usuario para nombre visible, rol y preferencias.

## Realtime

Para sincronizacion en tiempo real:

1. Ir a Database > Replication.
2. Activar Realtime para las tablas necesarias.
3. Para Sprint 0 basta con `profiles`.
4. En sprints posteriores activar `activities`, `schedule_entries`, `notes`, `pending_tasks`, `tools`, `topics` y `change_history`.

## Seguridad

La migracion activa RLS en las tablas publicas.

Politica Sprint 0:

- Usuarios autenticados pueden leer y escribir datos operativos compartidos.
- `user_profiles` solo permite gestionar el perfil propio.

En sprints posteriores se puede endurecer por equipo, rol o pertenencia a workspace.
