# Autenticacion y seguridad - Login y Base Segura

## Objetivo

Implementar autenticacion segura, sesion persistente, proteccion de rutas y reglas de acceso.

## Epicas cubiertas

- EPIC 01 - Autenticacion y Seguridad.
- EPIC 15 - Administracion y Configuracion.
- EPIC 16 - Calidad, Testing y Despliegue.

## Items implementados

| Item | Resultado |
| --- | --- |
| AUTH-01 | Pantalla de login con email, contrasena, carga y errores claros. |
| AUTH-02 | Registro controlado por `VITE_AUTH_REGISTRATION_ENABLED`. |
| AUTH-04 | Lectura inicial de sesion y listener de cambios de Supabase Auth. |
| AUTH-05 | Logout visible en cabecera y panel de sesion. |
| AUTH-06 | Dashboard privado no renderiza sin sesion. |
| AUTH-07 | RLS mantiene tablas privadas bloqueadas para anonimos. |
| ADMIN-03 | Roles simples `user/admin` en `user_profiles`. |
| QA-02 | Pruebas unitarias de validacion y matriz manual de login. |
| QA-06 | Matriz manual para permisos anonimo/autenticado. |

## Entregables

- Login funcional conectado a Supabase Auth cuando existen variables reales.
- Registro controlado.
- Sesion persistente.
- Logout.
- Rutas privadas.
- RLS inicial.
- Roles simples.
- QA documentada.

## Gate de salida

- Un usuario real puede entrar y salir.
- El dashboard no se ve sin autenticacion.
- Supabase bloquea accesos anonimos a tablas privadas.
