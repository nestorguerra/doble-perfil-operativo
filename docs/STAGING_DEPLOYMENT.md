# Despliegue Staging

## Objetivo

Tener una ruta clara para probar antes de produccion y poder publicar en GitHub Pages.

## GitHub Pages

La app esta preparada para despliegue estatico porque `vite.config.js` usa:

```js
base: "./"
```

Esto permite que el build funcione aunque el repositorio se publique en una ruta tipo:

```text
https://usuario.github.io/nombre-repo/
```

## Build local

```bash
npm run build
npm run preview
```

## Entorno staging recomendado

Ramas:

- `main`: produccion.
- `staging`: validacion previa.

Supabase:

- Proyecto Supabase de staging si se quiere separar datos reales y datos de prueba.
- Variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` propias para staging.

## Gate Sprint 0

Para cerrar este sprint:

- La app debe abrir en local.
- `npm run build` debe completar sin errores.
- La migracion SQL debe poder ejecutarse en Supabase.
- La ruta de publicacion en GitHub Pages debe estar documentada.
