# UX comercial y administracion - UX Comercial, Responsive y Administracion

## Objetivo

Pulir la experiencia para que el producto se sienta comercial, facil y preparado para usuarios reales en escritorio y movil.

## Entregado

- Busqueda rapida en actividades, notas, pendientes, temas y herramientas.
- Estados visibles de sincronizacion en vistas privadas.
- Refuerzo responsive en dashboard, detalle, formularios, mapas y busqueda.
- Foco visible para navegacion por teclado.
- Ajustes de usuario con nombre visible y preferencia de densidad.
- Historico por perfil.
- Actividades archivadas en lugar de borrado destructivo.
- Vista mensual de horarios.
- Filtro por rango de fechas en horarios/mapa.
- Etiquetas simples para temas.
- Filtros de pendientes por estado dentro del contexto diario.
- Catalogo reutilizable de herramientas para crear nuevas herramientas desde existentes.

## Cambios de base de datos

Nueva migracion:

- `supabase/migrations/0005_commercial_ux_admin.sql`

Incluye:

- Columna `topics.tags text[]`.
- Indice GIN para busqueda futura por etiquetas.
- Preferencia inicial `density` en `user_profiles.preferences`.

## UX

La pantalla de entrada y la shell privada se actualizan a UX comercial y administracion. Se mantienen paneles tipo glass, blur, sombras sobrias y contraste suficiente. Los estados de carga/sincronizacion aparecen como banner discreto cuando la app no esta en estado estable.

## QA recomendado

1. Probar busqueda con texto presente en actividad, nota, pendiente, tema y herramienta.
2. Abrir un perfil y comprobar su historico.
3. Abrir una actividad, cambiar rango de fechas y comprobar que semana, heatmap, vista mensual y listado cambian.
4. Crear o editar un tema con etiquetas separadas por coma.
5. Crear herramienta usando el catalogo reutilizable.
6. Filtrar pendientes por abiertos y completados.
7. Editar ajustes de usuario y comprobar persistencia.
8. Revisar desktop y movil.

## Gate de salida

La app se siente como producto comercial: busqueda, filtros, administracion, responsive, accesibilidad basica y vistas de actividad listas para uso real.
