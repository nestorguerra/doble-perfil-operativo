# Actividades - Actividades

## Objetivo

Implementar el nucleo operativo del producto: creacion, edicion, listado y detalle de actividades.

## Epicas cubiertas

- EPIC 04 - Actividades.
- EPIC 03 - Gestion de Perfiles Interconectados.
- EPIC 16 - Calidad, Testing y Despliegue.

## Items implementados

| Item | Resultado |
| --- | --- |
| ACT-01 | Formulario para crear actividad con titulo, descripcion, estado y perfiles asociados. |
| ACT-02 | Edicion de titulo, descripcion, estado y perfiles vinculados. |
| ACT-03 | Listado de actividades con titulo, estado, perfiles y filtros. |
| ACT-04 | Detalle de actividad con cabecera, estado, perfiles, horarios, notas, pendientes, herramientas, temas y cambios. |
| ACT-05 | Estados pendiente, en curso, pausada y completada con badge visual. |
| ACT-08 | Eliminacion logica mediante estado `archived` y confirmacion en UI. |
| QA-01 | Validaciones de titulo obligatorio y al menos un perfil asociado. |
| QA-03 | Flujo preparado para crear, editar, recargar y comprobar persistencia con Supabase conectado. |

## Implementacion

- Crear actividad: inserta en `activities` y despues en `activity_profiles`.
- Editar actividad: actualiza `activities`, borra enlaces anteriores y recrea `activity_profiles`.
- Eliminar actividad: actualiza `status = 'archived'`.
- Listados principales: excluyen `archived`.
- Dashboard y fichas de perfil se alimentan del mismo estado sincronizado.

## QA automatico

```bash
npm run check
```

Incluye:

- Validacion de actividad sin titulo.
- Validacion de actividad sin perfil.
- Normalizacion de actividad.
- Validaciones de auth de fases anteriores.

## QA manual con Supabase conectado

1. Entrar con usuario real.
2. Abrir `Actividades`.
3. Crear actividad con titulo, descripcion, estado y un perfil.
4. Confirmar que aparece en listado y detalle.
5. Editar la actividad y asociarla a ambos perfiles.
6. Confirmar que aparece en ambas fichas de perfil.
7. Cambiar estado y probar filtros.
8. Recargar navegador y confirmar persistencia.
9. Eliminar con confirmacion.
10. Confirmar que deja de verse en listados principales.

## Gate de salida

El usuario puede gestionar actividades reales de punta a punta.
