# Sprint 8 - QA, Produccion y GitHub Pages

## Objetivo

Cerrar el producto para uso real: recuperar contrasena, administrar usuarios, revisar auditoria, evitar conflictos basicos, duplicar actividades, destacar notas, ver mapa relacional y desplegar en GitHub Pages.

## Entregables implementados

- `AUTH-03`: recuperacion de contrasena mediante Supabase Auth.
- `ADMIN-02`: vista basica de usuarios visibles desde `user_profiles`.
- `ADMIN-05`: auditoria basica sobre `change_history`.
- `SYNC-06`: deteccion minima de conflictos por `updated_at`.
- `HIST-06`: filtros de historico por texto, entidad, usuario y fecha.
- `MAP-07`: mapa relacional por actividad.
- `NOTE-07`: notas destacadas con estado persistido.
- `ACT-06`: duplicado de actividad con titulo, descripcion, estado y perfiles base.
- `UI-07`: microinteracciones con respeto a `prefers-reduced-motion`.
- `QA-05`: validacion responsive local en desktop y movil.
- `QA-08`: build estatico preparado para GitHub Pages.
- `QA-09`: smoke test de produccion documentado.

## Migracion necesaria

Aplicar:

```sql
supabase/migrations/0006_production_qa_features.sql
```

Esta migracion anade `notes.is_pinned` e indices para auditoria y notas destacadas.

## Smoke test critico

1. Abrir la URL de GitHub Pages.
2. Confirmar que carga la app.
3. Entrar con usuario real.
4. Revisar dashboard.
5. Crear actividad.
6. Duplicar actividad.
7. Crear horario y comprobar mapa.
8. Crear nota, destacarla y recargar.
9. Crear pendiente, herramienta y tema.
10. Revisar auditoria en Ajustes.
11. Probar ancho movil, tablet y desktop.

## Nota de produccion

GitHub Pages solo sirve el frontend estatico. Para que login, base de datos y sincronizacion funcionen, el repositorio debe tener configuradas `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y la allow-list de redireccion de Supabase debe incluir la URL publica de GitHub Pages.
