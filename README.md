# Doble Perfil Operativo

Aplicacion web para gestionar dos perfiles operativos interconectados con actividades, horarios, notas, pendientes, herramientas, temas trabajados y trazabilidad de cambios.

## Estado actual

Sprint 8 - QA, Produccion y GitHub Pages:

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
- Registro de bloques horarios por actividad y perfil.
- Calculo automatico de horas.
- Vista semanal, heatmap por actividad, tooltips y filtro por perfil.
- CRUD de notas, temas, pendientes y herramientas.
- Asociacion de trabajo diario con perfiles y actividades.
- Dashboard actualizado con pendientes abiertos y notas recientes.
- Autosave con debounce en formularios de edicion.
- Indicadores de guardado, error y reintento.
- Sincronizacion realtime sobre tablas clave.
- Historico legible por entidad y timeline en detalle de actividad.
- Busqueda rapida en actividades, notas, pendientes, temas y herramientas.
- Historico por perfil.
- Vista mensual y filtro por rango de fechas en horarios.
- Etiquetas simples en temas.
- Filtros de pendientes y catalogo reutilizable de herramientas.
- Ajustes de usuario con nombre visible y preferencias basicas.
- Recuperacion de contrasena con Supabase Auth.
- Gestion basica de usuarios visibles y auditoria de cambios filtrable.
- Control minimo de conflictos usando `updated_at` antes de guardar.
- Notas destacadas y visibles en dashboard/contexto.
- Duplicado de actividades con datos base y perfiles asociados.
- Mapa relacional por actividad con perfiles, herramientas, temas, notas y pendientes.
- Microinteracciones y revision responsive para produccion.
- Integracion con Supabase Auth y Supabase Realtime.
- Migraciones SQL con tablas, relaciones, constraints, indices, RLS, roles y triggers de auditoria.
- Documentacion de configuracion de Supabase, staging y QA de permisos.
- Matriz de trazabilidad completa y readiness de produccion en `docs/PRODUCT_TRACEABILITY_AND_PRODUCTION_READINESS.md`.

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

Para GitHub Pages, configura en el repositorio:

- Variable `VITE_SUPABASE_URL`.
- Secret `VITE_SUPABASE_ANON_KEY`.
- Variable opcional `VITE_AUTH_REGISTRATION_ENABLED`.

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
    autosave.js
    timeValidation.js
    workItemValidation.js
supabase/
  migrations/
    0001_initial_schema.sql
    0002_auth_roles_and_permissions.sql
    0003_profiles_dashboard_support.sql
    0004_autosave_realtime_history.sql
    0005_commercial_ux_admin.sql
    0006_production_qa_features.sql
docs/
  SUPABASE_SETUP.md
  STAGING_DEPLOYMENT.md
  SPRINT_1_QA.md
  SPRINT_2_DASHBOARD_PROFILES.md
  SPRINT_3_ACTIVITIES.md
  SPRINT_4_TIME_ACTIVITY_MAP.md
  SPRINT_5_WORK_CONTEXT.md
  SPRINT_6_AUTOSAVE_REALTIME_HISTORY.md
  SPRINT_7_COMMERCIAL_UX_ADMIN.md
  SPRINT_8_QA_PRODUCTION.md
  PRODUCT_TRACEABILITY_AND_PRODUCTION_READINESS.md
```
