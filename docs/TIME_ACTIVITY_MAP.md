# Horarios y mapa - Horarios y Mapa Visual de Actividad

## Objetivo

Permitir registrar dias y horas de trabajo y visualizarlos en un mapa/calendario por actividad.

## Epicas cubiertas

- EPIC 05 - Horarios y Registro de Trabajo.
- EPIC 06 - Mapa Visual de Actividad.
- EPIC 02 - Dashboard Principal.

## Items implementados

| Item | Resultado |
| --- | --- |
| TIME-01 | Formulario para anadir bloque horario con fecha, inicio, fin y nota opcional. |
| TIME-02 | Cada bloque se guarda contra `activity_id`. |
| TIME-03 | Cada bloque se guarda contra `profile_id`. |
| TIME-04 | Calculo automatico de minutos desde `schedule_entries.total_minutes` y validacion previa en UI. |
| TIME-05 | Edicion de bloque horario. |
| TIME-06 | Eliminacion de bloque horario. |
| TIME-07 | Vista semanal con bloques por dia. |
| MAP-01 | Heatmap de actividad de 28 dias con intensidad por minutos. |
| MAP-02 | Calendario/heatmap dentro del detalle de actividad. |
| MAP-03 | Diferenciacion por color de perfil. |
| MAP-04 | Tooltip nativo por dia con fecha, horas y perfiles. |
| MAP-05 | Filtro por perfil dentro del mapa. |

## Implementacion

- Crear bloque: inserta en `schedule_entries`.
- Editar bloque: actualiza `schedule_entries`.
- Eliminar bloque: borra el registro horario.
- El dashboard y fichas de perfil recalculan horas desde `schedule_entries`.
- El detalle de actividad muestra:
  - total de horas
  - filtro por perfil
  - semana de trabajo
  - heatmap de 28 dias
  - listado editable de bloques

## QA automatico

```bash
npm run check
```

Incluye:

- Calculo de minutos.
- Bloque sin actividad.
- Rango horario invalido.
- Normalizacion del payload horario.
- Tests de auth y actividades de fases anteriores.

## QA manual con Supabase conectado

1. Entrar con usuario real.
2. Abrir una actividad.
3. Anadir bloque horario con fecha, hora inicio, hora fin, perfil y nota.
4. Ver total de horas actualizado.
5. Confirmar que aparece en vista semanal.
6. Confirmar que aparece en heatmap.
7. Filtrar por perfil.
8. Editar el bloque y comprobar que mapa y totales cambian.
9. Eliminar el bloque y comprobar que mapa y totales se actualizan.
10. Recargar navegador y confirmar persistencia.

## Gate de salida

El usuario puede registrar trabajo y verlo reflejado visualmente.
