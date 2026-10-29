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

## Datos (API simulada)

La app no tiene backend propio: los datos iniciales son archivos JSON en `public/api/` (`gastos`, `pagos`, `companeros`, `categorias` y `productos`).

- Se piden con `fetch` y `async/await` en `src/services/clienteHttp.ts`, con tiempo límite, un reintento y mensajes de error claros.
- Mientras cargan, las pantallas muestran un indicador de carga; si fallan, muestran el error y un botón para reintentar.
- Los cambios (compras, pagos, materiales) pasan por `src/services/apiUjapSplit.ts`, que los valida y los guarda en el `localStorage` del navegador.
- El botón ⟳ junto al indicador "Datos" del encabezado descarta esos cambios y vuelve a cargar los datos originales.

## Estructura del proyecto

```text
public/api/         Datos iniciales en JSON (API simulada)
src/components/     Componentes reutilizables
src/composables/    Estado compartido, sesión y tasa de cambio
src/router/         Rutas y protección por rol
src/services/       Cliente HTTP y API simulada
src/types/          Tipos de TypeScript
src/utils/          Cálculo de deudas, validaciones y utilidades
src/views/          Pantallas de la app
laboratorio-datos/  Diagrama entidad-relación, script SQL y ejemplo NoSQL
```
