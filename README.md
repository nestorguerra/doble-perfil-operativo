# Doble Perfil Operativo

Aplicacion web para gestionar dos perfiles operativos interconectados con actividades, horarios, notas, pendientes, herramientas, temas trabajados y trazabilidad de cambios.

## Estado actual

Sprint 0 - Fundacion Tecnica:

- App frontend inicial con React + Vite.
- Sistema visual base con paneles tipo glass, tokens CSS, botones, inputs, badges y estados.
- Configuracion preparada para GitHub Pages con `base: "./"`.
- Integracion preparada con Supabase Auth y Supabase Realtime.
- Migracion SQL inicial con tablas, relaciones, constraints, indices, RLS y triggers de auditoria.
- Documentacion de configuracion de Supabase y staging.

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
```

Sin esas variables la app abre en modo local de Sprint 0. Con variables reales, carga perfiles desde Supabase.

## Comandos utiles

```bash
npm run dev
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
supabase/
  migrations/
    0001_initial_schema.sql
docs/
  SUPABASE_SETUP.md
  STAGING_DEPLOYMENT.md
```
