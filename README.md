# Doble Perfil Operativo

Aplicacion web para gestionar dos perfiles operativos interconectados con actividades, horarios, notas, pendientes, herramientas, temas trabajados y trazabilidad de cambios.

## Estado actual

Sprint 3 - Actividades:

- App frontend inicial con React + Vite.
- Sistema visual base con paneles tipo glass, tokens CSS, botones, inputs, badges y estados.
- Configuracion preparada para GitHub Pages con `base: "./"`.
- Login, registro controlado, sesion persistente, logout y rutas privadas.
- Dashboard privado con resumen operativo.
- Dos perfiles interconectados con fichas y edicion basica.
- Indicadores de horas, actividades activas, pendientes y ultimos cambios.
- Navegacion principal con Dashboard, Perfiles, Actividades y Ajustes.
- CRUD de actividades: crear, editar, listar, abrir detalle y eliminar logicamente.
- Estados de actividad: pendiente, en curso, pausada y completada.
- Detalle de actividad con horarios, notas, pendientes, herramientas, temas y cambios.
- Integracion con Supabase Auth y Supabase Realtime.
- Migraciones SQL con tablas, relaciones, constraints, indices, RLS, roles y triggers de auditoria.
- Documentacion de configuracion de Supabase, staging y QA de permisos.

## Ejecutar en local

```bash
npm install
npm run dev
```

## Variables de entorno

Copia `.env.example` a `.env` y rellena:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
VITE_AUTH_REGISTRATION_ENABLED=true
```

Sin las variables de Supabase, la app muestra la pantalla de acceso bloqueada para no exponer el dashboard. Con variables reales, activa login y carga los datos privados desde Supabase.

## Comandos utiles

```bash
npm run dev
npm run test
npm run build
npm run preview
npm run check
```

## Estructura

```text
src/
  App.jsx
  styles.css
  lib/
    seed.js
    supabase.js
    authValidation.js
    activityValidation.js
supabase/
  migrations/
    0001_initial_schema.sql
    0002_auth_roles_and_permissions.sql
    0003_profiles_dashboard_support.sql
docs/
  SUPABASE_SETUP.md
  STAGING_DEPLOYMENT.md
  SPRINT_1_QA.md
  SPRINT_2_DASHBOARD_PROFILES.md
  SPRINT_3_ACTIVITIES.md
```
