# Dashboard y perfiles - Dashboard y Perfiles Interconectados

## Objetivo

Crear la vista principal del producto y las fichas de los dos perfiles operativos.

## Epicas cubiertas

- EPIC 02 - Dashboard Principal.
- EPIC 03 - Gestion de Perfiles Interconectados.
- EPIC 15 - Administracion y Configuracion.
- EPIC 13 - Diseno UX/UI Comercial.

## Items implementados

| Item | Resultado |
| --- | --- |
| DASH-01 | Vista resumen con tarjetas de Perfil A y Perfil B, indicadores y accesos rapidos. |
| DASH-02 | Listado de actividades activas desde Supabase. |
| DASH-03 | Ultimos cambios desde `change_history`, con entidad, usuario y fecha. |
| DASH-04 | Pendientes abiertos ordenados por prioridad y fecha limite. |
| DASH-05 | Horas acumuladas calculadas desde `schedule_entries`. |
| DASH-07 | Filtros por estado: todos, pendiente, en curso, pausada, completada. |
| PROF-01 | Perfil A y Perfil B siguen inicializados por migracion. |
| PROF-02 | Edicion de nombre, descripcion, color y rol visible del perfil. |
| PROF-03 | Ficha de perfil con cabecera, actividades, horarios, pendientes y contexto. |
| PROF-04 | Lectura de actividades vinculadas mediante `activity_profiles`. |
| PROF-05 | Actividades compartidas identificadas si tienen mas de un perfil vinculado. |
| PROF-06 | Resumen de horas por perfil. |
| ADMIN-04 | Vista Ajustes para configurar perfiles. |
| UI-03 | Navegacion principal Dashboard, Perfiles, Actividades y Ajustes. |
| UI-04 | Estados vacios con accion clara. |

## Migracion nueva

`supabase/migrations/0003_profiles_dashboard_support.sql`

Incluye:

- `profiles.visible_role`
- indice `profiles_is_active_idx`

## QA manual

Con Supabase conectado y usuario autenticado:

1. Entrar al dashboard.
2. Ver Perfil A y Perfil B en tarjetas superiores.
3. Abrir una ficha de perfil desde la tarjeta.
4. Editar nombre, descripcion, color y rol visible.
5. Confirmar que el dashboard refleja los cambios.
6. Revisar que actividades activas aparecen si existen.
7. Cambiar filtros en Actividades.
8. Ver estados vacios si no hay datos.
9. Confirmar que sin sesion no se renderiza ninguna vista privada.

## Gate de salida

- El usuario entra y entiende el producto.
- Puede editar perfiles.
- Puede ver informacion basica de ambos perfiles.
- El dashboard queda alimentado por datos reales cuando Supabase esta conectado.
