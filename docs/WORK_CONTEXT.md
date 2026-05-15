# Contexto de trabajo - Notas, Temas, Pendientes y Herramientas

## Objetivo

Completar el trabajo diario de perfiles y actividades con entidades editables, persistentes y asociadas a contexto real.

## Entregado

- CRUD de notas.
- CRUD de temas trabajados.
- CRUD de pendientes.
- CRUD de herramientas.
- Asociacion de cada item con perfil, actividad o ambos.
- Vista de trabajo diario en ficha de perfil.
- Vista de contexto diario en detalle de actividad.
- Pendientes con estado abierto/completado, prioridad y fecha limite opcional.
- Notas con autor y fecha visible cuando Supabase devuelve auditoria.
- Dashboard actualizado con notas recientes.
- Validaciones reutilizables para evitar items sin contenido o sin asociacion.

## Pantallas afectadas

- Dashboard: mantiene pendientes proximos y anade notas recientes.
- Perfiles: anade panel de trabajo diario con notas, temas, pendientes y herramientas.
- Actividades: anade panel de contexto diario en el detalle de actividad.

## Tablas usadas

No se ha creado una migracion nueva porque las tablas estaban incluidas desde Fundacion tecnica:

- `notes`
- `topics`
- `pending_tasks`
- `tools`

Todas usan las relaciones ya preparadas con `profile_id`, `activity_id`, `created_by`, `updated_by`, `created_at` y `updated_at`.

## Criterios de aceptacion cubiertos

- Un tema se guarda, edita, elimina y aparece en perfil o actividad.
- Un pendiente se crea, se completa, admite prioridad y fecha limite, y aparece donde corresponde.
- Una herramienta se crea, edita, elimina y puede asociarse a perfil o actividad.
- Una nota se crea, edita y muestra fecha/autor cuando hay datos de auditoria.
- La app conserva datos al recargar porque todas las operaciones van contra Supabase.

## QA recomendado

1. Entrar con usuario valido.
2. Abrir Perfil A.
3. Crear una nota, un tema, un pendiente y una herramienta.
4. Editar cada item.
5. Completar el pendiente.
6. Eliminar un item con confirmacion.
7. Abrir una actividad y repetir la prueba asociada a actividad.
8. Recargar navegador y comprobar persistencia.

## Gate de salida

La app ya permite gestionar el trabajo diario completo: actividad, horarios, mapa visual, notas, temas, pendientes y herramientas quedan conectados con perfiles y actividades.
