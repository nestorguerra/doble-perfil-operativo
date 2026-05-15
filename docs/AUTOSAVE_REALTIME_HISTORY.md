# Autosave, realtime e historico - Autosave, Realtime e Historico

## Objetivo

Convertir la app en una herramienta confiable: guardar automaticamente, sincronizar cambios entre sesiones y registrar trazabilidad util.

## Entregado

- Autosave con debounce de 800 ms en formularios de edicion.
- Indicadores visibles de `Cambios pendientes`, `Guardando`, `Guardado` y `Error al guardar`.
- Reintento manual cuando falla un guardado.
- Guardado manual conservado como respaldo.
- Realtime sobre tablas clave mediante canal de Supabase.
- Timeline de cambios en dashboard.
- Timeline por actividad incluyendo cambios directos de actividad y cambios de entidades asociadas.
- Migracion SQL para mejorar los textos de `change_history`.
- Migracion SQL para asegurar tablas clave en la publicacion `supabase_realtime`.

## Alcance funcional

El autosave se aplica a edicion de:

- Perfiles.
- Actividades.
- Bloques horarios.
- Notas.
- Temas.
- Pendientes.
- Herramientas.

La creacion de registros sigue usando boton explicito para evitar crear datos vacios mientras el usuario escribe.

## Historico

La tabla `change_history` ya existia desde Fundacion tecnica. En Autosave, realtime e historico se mejora el trigger para generar resumenes legibles:

- `Actividad creada: ...`
- `Nota actualizada: ...`
- `Pendiente eliminado: ...`
- `Horario creado: ...`

## Realtime

La app escucha cambios en:

- `profiles`
- `activities`
- `activity_profiles`
- `schedule_entries`
- `pending_tasks`
- `notes`
- `topics`
- `tools`
- `change_history`

Cuando llega un evento, la app recarga el estado privado y muestra un estado de sincronizacion claro.

## QA recomendado

1. Entrar con un usuario valido.
2. Editar un perfil y esperar el indicador `Guardado`.
3. Recargar y comprobar que el cambio persiste.
4. Editar una actividad y comprobar que se actualiza el historico.
5. Editar una nota o pendiente desde el detalle de actividad.
6. Abrir la app en dos navegadores y comprobar que un cambio aparece en la otra sesion.
7. Desconectar temporalmente la red o provocar un error y comprobar que aparece `Error al guardar` con `Reintentar`.

## Gate de salida

El usuario puede confiar en que la informacion no se pierde: los cambios se guardan solos, se sincronizan y quedan trazados en historico.
