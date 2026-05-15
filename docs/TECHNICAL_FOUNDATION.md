# Fundacion tecnica - Fundacion Tecnica

## Objetivo

Preparar la base tecnica para desarrollar el producto sin rehacer decisiones estructurales a mitad del proyecto.

## Epicas cubiertas

- EPIC 14 - Modelo de Datos.
- EPIC 16 - Calidad, Testing y Despliegue.
- EPIC 13 - Diseno UX/UI Comercial.

## Entregables

- Repositorio inicial.
- Estructura de carpetas.
- Configuracion de Supabase documentada.
- SQL inicial de base de datos.
- Variables de entorno publicas mediante `.env.example`.
- Sistema visual base.
- Primer entorno tecnico ejecutable como staging local.

## Items implementados

| Item | Resultado |
| --- | --- |
| DATA-01 | Supabase Auth preparado y tabla `user_profiles` creada. |
| DATA-02 | Tabla `profiles` con dos perfiles iniciales. |
| DATA-03 | Tabla `activities` y puente `activity_profiles`. |
| DATA-04 | Tabla `schedule_entries`. |
| DATA-05 | Tabla `notes`. |
| DATA-06 | Tabla `pending_tasks`. |
| DATA-07 | Tabla `tools`. |
| DATA-08 | Tabla `topics`. |
| DATA-09 | Tabla `change_history` y triggers de auditoria. |
| DATA-10 | Indices para consultas principales. |
| DATA-11 | Foreign keys, checks, defaults y RLS base. |
| QA-07 | Documentacion de staging y build para GitHub Pages. |
| UI-01 | Tokens CSS y componentes visuales base. |

## Gate de salida

- El equipo puede ejecutar la app con `npm run dev`.
- La base de datos puede crearse ejecutando la migracion SQL.
- El modelo soporta las epicas del backlog.
- Existe ruta clara para publicar en GitHub Pages.
