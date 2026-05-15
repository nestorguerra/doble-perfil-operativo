# Autenticacion y seguridad - QA Login y Permisos

## Objetivo

Validar que el acceso basico queda protegido: login, registro controlado, sesion persistente, logout y RLS.

## Pruebas automaticas incluidas

```bash
npm run test
npm run check
```

Cobertura actual:

- Normalizacion de email.
- Validacion de email.
- Login sin email valido.
- Login sin contrasena.
- Registro sin nombre visible.
- Registro con contrasena corta.
- Registro con confirmacion incorrecta.

## QA manual con Supabase conectado

### AUTH-01 - Login correcto

1. Configurar `.env` con Supabase real.
2. Crear usuario en Supabase Auth o usar registro controlado.
3. Entrar con email y contrasena.
4. Resultado esperado: se muestra el dashboard privado.

### AUTH-01 - Login incorrecto

1. Introducir email valido y contrasena incorrecta.
2. Resultado esperado: aparece `Email o contrasena incorrectos.`
3. Resultado esperado: no se renderiza el dashboard privado.

### AUTH-02 - Registro controlado

1. Poner `VITE_AUTH_REGISTRATION_ENABLED=true`.
2. Abrir tab `Registro`.
3. Crear usuario con nombre visible, email y contrasena confirmada.
4. Resultado esperado: usuario creado en Supabase Auth y fila creada en `user_profiles`.

### AUTH-04 - Sesion persistente

1. Entrar al dashboard.
2. Recargar navegador.
3. Resultado esperado: el usuario sigue dentro.

### AUTH-05 - Logout

1. Pulsar `Cerrar sesion`.
2. Resultado esperado: vuelve la pantalla de login.
3. Abrir la URL de nuevo.
4. Resultado esperado: no se ve dashboard sin login.

### AUTH-07 / QA-06 - RLS anonimo

Desde Supabase API o cliente anonimo sin sesion:

```js
await supabase.from("profiles").select("*")
```

Resultado esperado:

- Sin sesion no devuelve datos privados por RLS.

### AUTH-07 / QA-06 - RLS autenticado

Con usuario autenticado:

```js
await supabase.from("profiles").select("*")
```

Resultado esperado:

- Devuelve los perfiles permitidos.

## Gate de salida

- Usuario real puede entrar y salir.
- Dashboard no se ve sin autenticacion.
- Supabase bloquea accesos anonimos a tablas privadas.
- Frontend conoce el rol `user/admin`.
