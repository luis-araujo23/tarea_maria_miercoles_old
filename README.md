# UJAP Split

Aplicación web para dividir gastos entre compañeros de la UJAP. Cada estudiante compra materiales del semestre (copias, lápices, alquiler de videobeam, etc.), elige con quién los comparte y la app calcula cuánto le toca pagar a cada uno.

Hecha con **Vue 3**, **TypeScript**, **Vue Router** y **Vite**.

## Funcionalidades

- Compra de materiales y división del costo en partes iguales entre los compañeros elegidos.
- Registro de abonos: cada usuario paga su propia parte, total o parcial.
- Barra de progreso que muestra cuánto ha pagado cada compañero de su deuda.
- Dashboard de administración con ventas, dinero cobrado y saldos pendientes.
- Conversión de montos a bolívares con la tasa del día.

## Instalación

Requiere [Node.js](https://nodejs.org/) instalado.

```sh
npm install
npm run dev
```

Luego abre en el navegador la dirección que muestra la terminal (normalmente `http://localhost:5173`).

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo con recarga automática. |
| `npm run type-check` | Revisa los tipos de TypeScript. |
| `npm run build` | Revisa los tipos y genera la versión de producción en `dist/`. |
| `npm run preview` | Sirve localmente la versión de producción. |

## Usuarios y roles

La app tiene dos roles:

- **Usuario:** compra materiales, elige con quién dividirlos y paga su parte en "Mis deudas". Solo puede registrar pagos de su propia cuenta.
- **Administrador:** ve el dashboard con los saldos de todo el grupo y gestiona gastos y materiales.

Cuentas de prueba (todas con la contraseña `1233`):

| Usuario | Rol |
|---|---|
| `María` | Usuario |
| `Juan` | Usuario |
| `Carlos` | Usuario |
| `admin` | Administrador |

También se puede crear una cuenta nueva desde "Crear cuenta"; las cuentas nuevas tienen rol de usuario.

## Rutas

La navegación usa Vue Router, así que cambiar de pantalla no recarga la página.

| Ruta | Pantalla | Acceso |
|---|---|---|
| `/login` | Inicio de sesión | Público |
| `/signup` | Crear cuenta | Público |
| `/app/materiales` | Catálogo de materiales y compras | Usuario y admin |
| `/app/balance` | Mis deudas y abonos | Usuario (no aparece en el menú del admin) |
| `/app/dashboard` | Dashboard de administración | Admin |
| `/app/gastos` | Lista de gastos del grupo | Admin |
| `/app/gastos/:id` | Detalle de un gasto (ruta dinámica) | Admin |

Si alguien entra sin sesión a una ruta privada, se le redirige al login. Si un usuario normal intenta abrir una ruta de admin, se le redirige a Materiales.
