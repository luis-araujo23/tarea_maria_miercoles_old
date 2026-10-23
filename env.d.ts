/// <reference types="vite/client" />

declare module '*/server/app.js' {
  const app: any
  export default app
}

declare module '*/server/models/db.model.js' {
  export function obtenerDb(): any
  export function guardarDb(db: any): void
  export function restaurarDb(): any
}
