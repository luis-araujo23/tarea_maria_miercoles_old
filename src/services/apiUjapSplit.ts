/**
 * API de UJAP Split (Entrega 3).
 *
 * Se comunica con el backend Express mediante peticiones HTTP REST:
 * - GET    /api/estado
 * - GET    /api/gastos, POST /api/gastos, PUT /api/gastos/:id, DELETE /api/gastos/:id
 * - POST   /api/compras
 * - POST   /api/productos, PUT /api/productos/:id, DELETE /api/productos/:id
 * - POST   /api/categorias, PUT /api/categorias/:id, DELETE /api/categorias/:id
 * - POST   /api/companeros, DELETE /api/companeros/:id
 * - POST   /api/pagos, DELETE /api/pagos/:id
 *
 * Mantiene un respaldo local en localStorage como fallback de alta disponibilidad
 * para garantizar que la app nunca se caiga incluso si el servidor no está encendido.
 */

import type { AppState, CategoriaMaterial, Companero, Gasto, Pago, Producto } from '../types'
import { calcularBalances, cuotaPendienteDeGasto, divisionIgual, simplificarDeudas } from '../utils/balances'
import {
  validarCategoria,
  validarCompra,
  validarGasto,
  validarNombreCompanero,
  validarPago,
  validarPagoDeCompra,
  validarProducto,
  type DatosCategoria,
  type DatosProducto,
} from '../utils/validaciones'
import { ErrorApi, enviarJson, latenciaSimulada, obtenerJson } from './clienteHttp'
import { normalizarEstado } from './normalizar'

const DB_KEY = 'ujap-split-db-v3'

export type DatosGasto = Omit<Gasto, 'id'>

export interface DatosPago {
  deId: string
  paraId: string
  monto: number
  nota?: string
  gastoId?: number
}

export interface DatosCompra {
  productoId: string
  pagadoPorId: string
  participanteIds: string[]
}

function redondear(monto: number): number {
  return Math.round(monto * 100) / 100
}

function hoy(): string {
  return new Date().toISOString().slice(0, 10)
}

function siguienteId(items: { id: number }[]): number {
  return items.reduce((mayor, item) => Math.max(mayor, item.id), 0) + 1
}

function siguienteIdCompanero(companeros: Companero[]): string {
  const mayor = companeros.reduce((max, c) => {
    const numero = Number.parseInt(c.id.replace(/\D/g, ''), 10)
    return Number.isNaN(numero) ? max : Math.max(max, numero)
  }, 0)
  return `c${mayor + 1}`
}

function idDesdeNombre(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// --- Persistencia local de respaldo ------------------------------------------

function leerDbLocal(): AppState | null {
  try {
    const crudo = localStorage.getItem(DB_KEY)
    if (!crudo) return null

    const parsed = JSON.parse(crudo) as Record<string, unknown>
    return normalizarEstado({
      companeros: parsed.companeros,
      gastos: parsed.gastos,
      pagos: parsed.pagos,
      categorias: parsed.categorias,
      productos: parsed.productos,
    })
  } catch {
    return null
  }
}

function escribirDbLocal(estado: AppState): void {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(estado))
  } catch {
    /* ignore */
  }
}

async function cargarFallbackLocal(): Promise<AppState> {
  const guardado = leerDbLocal()
  if (guardado) return guardado

  try {
    const [companeros, gastos, pagos, categorias, productos] = await Promise.all([
      obtenerJson<unknown>('companeros.json').catch(() => [
        { id: 'c1', nombre: 'María' },
        { id: 'c2', nombre: 'Juan' },
        { id: 'c3', nombre: 'Carlos' },
      ]),
      obtenerJson<unknown>('gastos.json').catch(() => []),
      obtenerJson<unknown>('pagos.json').catch(() => []),
      obtenerJson<unknown>('categorias.json').catch(() => []),
      obtenerJson<unknown>('productos.json').catch(() => []),
    ])

    const normalizado = normalizarEstado({ companeros, gastos, pagos, categorias, productos })
    escribirDbLocal(normalizado)
    return normalizado
  } catch {
    return { companeros: [], gastos: [], pagos: [], categorias: [], productos: [] }
  }
}

function errorValidacion(mensaje: string): ErrorApi {
  return new ErrorApi('validacion', mensaje, 422)
}

function errorNoEncontrado(mensaje: string): ErrorApi {
  return new ErrorApi('no-encontrado', mensaje, 404)
}

// --- Lectura de Estado ------------------------------------------------------

export async function obtenerEstado(forzarServidor = false): Promise<AppState> {
  try {
    if (forzarServidor) {
      await enviarJson('estado/restaurar', 'POST').catch(() => null)
    }
    const estado = await obtenerJson<AppState>('estado')
    escribirDbLocal(estado)
    return estado
  } catch (error) {
    // Si el backend no está disponible en este instante, usar respaldo local
    return cargarFallbackLocal()
  }
}

// --- Gastos (Las 5 rutas del CRUD de Entrega 3) ------------------------------

export async function crearGasto(datos: DatosGasto): Promise<Gasto[]> {
  try {
    await enviarJson<Gasto>('gastos', 'POST', datos)
    const estado = await obtenerJson<AppState>('estado')
    escribirDbLocal(estado)
    return estado.gastos
  } catch (e) {
    if (e instanceof ErrorApi && (e.estado === 422 || e.estado === 404)) throw e
    // Fallback local
    const db = await cargarFallbackLocal()
    const error = validarGasto(datos, db.companeros)
    if (error) throw errorValidacion(error)

    db.gastos = [
      {
        ...datos,
        id: siguienteId(db.gastos),
        descripcion: datos.descripcion.trim(),
        monto: redondear(datos.monto),
      },
      ...db.gastos,
    ]
    escribirDbLocal(db)
    await latenciaSimulada()
    return db.gastos
  }
}

export async function actualizarGasto(id: number, datos: DatosGasto): Promise<Gasto[]> {
  try {
    await enviarJson<Gasto>(`gastos/${id}`, 'PUT', datos)
    const estado = await obtenerJson<AppState>('estado')
    escribirDbLocal(estado)
    return estado.gastos
  } catch (e) {
    if (e instanceof ErrorApi && (e.estado === 422 || e.estado === 404)) throw e
    // Fallback local
    const db = await cargarFallbackLocal()
    const indice = db.gastos.findIndex((g) => g.id === id)
    if (indice < 0) throw errorNoEncontrado(`El gasto #${id} ya no existe`)

    const error = validarGasto(datos, db.companeros)
    if (error) throw errorValidacion(error)

    db.gastos[indice] = {
      ...datos,
      id,
      descripcion: datos.descripcion.trim(),
      monto: redondear(datos.monto),
    }
    escribirDbLocal(db)
    await latenciaSimulada()
    return db.gastos
  }
}

export async function eliminarGasto(id: number): Promise<Gasto[]> {
  try {
    await enviarJson<{ id: number; eliminado: boolean }>(`gastos/${id}`, 'DELETE')
    const estado = await obtenerJson<AppState>('estado')
    escribirDbLocal(estado)
    return estado.gastos
  } catch (e) {
    if (e instanceof ErrorApi && (e.estado === 422 || e.estado === 404)) throw e
    const db = await cargarFallbackLocal()
    const gasto = db.gastos.find((g) => g.id === id)
    if (!gasto) {
      throw errorNoEncontrado(`El gasto #${id} ya no existe`)
    }
    const cuota = gasto.tipoDivision === 'igual' && gasto.divisiones.length > 0 ? (gasto.monto / gasto.divisiones.length) : 0
    const tienePendientes = gasto.divisiones.some((d) => {
      if (d.companeroId === gasto.pagadoPorId) return false
      const cuotaPersona = gasto.tipoDivision === 'igual' ? cuota : d.valor
      const pagado = db.pagos
        .filter((p) => p.gastoId === id && p.deId === d.companeroId)
        .reduce((sum, p) => sum + p.monto, 0)
      return (cuotaPersona - pagado) > 0.009
    })
    if (tienePendientes) {
      throw errorValidacion('No se puede eliminar esta compra hasta que los demás usuarios cancelen su parte.')
    }
    db.gastos = db.gastos.filter((g) => g.id !== id)
    db.pagos = db.pagos.filter((p) => p.gastoId !== id)
    escribirDbLocal(db)
    await latenciaSimulada()
    return db.gastos
  }
}

export async function vaciarGastos(): Promise<Gasto[]> {
  try {
    await enviarJson('gastos', 'DELETE')
    const estado = await obtenerJson<AppState>('estado')
    escribirDbLocal(estado)
    return estado.gastos
  } catch (e) {
    if (e instanceof ErrorApi && (e.estado === 422 || e.estado === 404)) throw e
    const db = await cargarFallbackLocal()
    db.gastos = []
    db.pagos = []
    escribirDbLocal(db)
    return []
  }
}

export async function crearCompra(datos: DatosCompra): Promise<Gasto[]> {
  try {
    await enviarJson('compras', 'POST', datos)
    const estado = await obtenerJson<AppState>('estado')
    escribirDbLocal(estado)
    return estado.gastos
  } catch (e) {
    if (e instanceof ErrorApi && (e.estado === 422 || e.estado === 404)) throw e
    const db = await cargarFallbackLocal()
    const error = validarCompra(
      datos.productoId,
      datos.pagadoPorId,
      datos.participanteIds,
      db.productos,
      db.companeros,
    )
    if (error) throw errorValidacion(error)

    const producto = db.productos.find((p) => p.id === datos.productoId)
    if (!producto) throw errorNoEncontrado('Ese producto ya no está a la venta')

    const participantes = [...new Set(datos.participanteIds)]
    const gasto: Gasto = {
      id: siguienteId(db.gastos),
      descripcion: producto.nombre,
      monto: redondear(producto.precio),
      pagadoPorId: datos.pagadoPorId,
      fecha: hoy(),
      tipoDivision: 'igual',
      divisiones: divisionIgual(participantes),
      productoId: producto.id,
    }

    db.gastos = [gasto, ...db.gastos]
    escribirDbLocal(db)
    await latenciaSimulada()
    return db.gastos
  }
}

// --- Pagos ------------------------------------------------------------------

export async function crearPago(datos: DatosPago): Promise<Pago[]> {
  try {
    await enviarJson('pagos', 'POST', datos)
    const estado = await obtenerJson<AppState>('estado')
    escribirDbLocal(estado)
    return estado.pagos
  } catch (e) {
    if (e instanceof ErrorApi && (e.estado === 422 || e.estado === 404)) throw e
    const db = await cargarFallbackLocal()
    const nota = datos.nota?.trim()
    let error: string | null = null

    if (datos.gastoId !== undefined) {
      const gasto = db.gastos.find((g) => g.id === datos.gastoId)
      if (!gasto) throw errorNoEncontrado('Esa compra ya no existe')

      const pendiente = cuotaPendienteDeGasto(gasto, datos.deId, db.pagos, db.companeros)
      error = validarPagoDeCompra(datos.deId, datos.paraId, datos.monto, pendiente, db.companeros)
      if (!error && !gasto.divisiones.some((d) => d.companeroId === datos.deId)) {
        error = 'No participas en esta compra'
      }
    } else {
      const deudas = simplificarDeudas(calcularBalances(db.gastos, db.pagos, db.companeros))
      error = validarPago(datos.deId, datos.paraId, datos.monto, db.companeros, deudas)
    }

    if (error) throw errorValidacion(error)

    db.pagos = [
      {
        id: siguienteId(db.pagos),
        deId: datos.deId,
        paraId: datos.paraId,
        monto: redondear(datos.monto),
        fecha: hoy(),
        nota: nota || undefined,
        gastoId: datos.gastoId,
      },
      ...db.pagos,
    ]
    escribirDbLocal(db)
    await latenciaSimulada()
    return db.pagos
  }
}

export async function eliminarPago(id: number): Promise<Pago[]> {
  try {
    await enviarJson(`pagos/${id}`, 'DELETE')
    const estado = await obtenerJson<AppState>('estado')
    escribirDbLocal(estado)
    return estado.pagos
  } catch (e) {
    if (e instanceof ErrorApi && (e.estado === 422 || e.estado === 404)) throw e
    const db = await cargarFallbackLocal()
    db.pagos = db.pagos.filter((p) => p.id !== id)
    escribirDbLocal(db)
    await latenciaSimulada()
    return db.pagos
  }
}

// --- Productos --------------------------------------------------------------

export async function guardarProducto(datos: DatosProducto, id?: string): Promise<Producto[]> {
  try {
    if (id) {
      await enviarJson(`productos/${id}`, 'PUT', datos)
    } else {
      await enviarJson('productos', 'POST', datos)
    }
    const estado = await obtenerJson<AppState>('estado')
    escribirDbLocal(estado)
    return estado.productos
  } catch (e) {
    if (e instanceof ErrorApi && (e.estado === 422 || e.estado === 404)) throw e
    const db = await cargarFallbackLocal()
    const error = validarProducto(datos, db.categorias, db.productos, id)
    if (error) throw errorValidacion(error)

    const nombre = datos.nombre.trim()
    const precio = redondear(datos.precio)

    if (id) {
      const indice = db.productos.findIndex((p) => p.id === id)
      if (indice < 0) throw errorNoEncontrado('Ese producto ya no existe')
      db.productos[indice] = { id, nombre, precio, categoriaId: datos.categoriaId, icono: datos.icono }
    } else {
      const nuevoId = `p-${idDesdeNombre(nombre) || Date.now()}`
      db.productos = [...db.productos, { id: nuevoId, nombre, precio, categoriaId: datos.categoriaId, icono: datos.icono }]
    }
    escribirDbLocal(db)
    await latenciaSimulada()
    return db.productos
  }
}

export async function eliminarProducto(id: string): Promise<Producto[]> {
  try {
    await enviarJson(`productos/${id}`, 'DELETE')
    const estado = await obtenerJson<AppState>('estado')
    escribirDbLocal(estado)
    return estado.productos
  } catch (e) {
    if (e instanceof ErrorApi && (e.estado === 422 || e.estado === 404)) throw e
    const db = await cargarFallbackLocal()
    db.productos = db.productos.filter((p) => p.id !== id)
    escribirDbLocal(db)
    await latenciaSimulada()
    return db.productos
  }
}

// --- Compañeros -------------------------------------------------------------

export async function crearCompanero(nombre: string): Promise<Companero[]> {
  try {
    await enviarJson('companeros', 'POST', { nombre })
    const estado = await obtenerJson<AppState>('estado')
    escribirDbLocal(estado)
    return estado.companeros
  } catch (e) {
    if (e instanceof ErrorApi && (e.estado === 422 || e.estado === 404)) throw e
    const db = await cargarFallbackLocal()
    const limpio = nombre.trim().replace(/\s+/g, ' ')
    db.companeros = [...db.companeros, { id: siguienteIdCompanero(db.companeros), nombre: limpio }]
    escribirDbLocal(db)
    await latenciaSimulada()
    return db.companeros
  }
}

export async function eliminarCompanero(id: string): Promise<Companero[]> {
  try {
    await enviarJson(`companeros/${id}`, 'DELETE')
    const estado = await obtenerJson<AppState>('estado')
    escribirDbLocal(estado)
    return estado.companeros
  } catch (e) {
    if (e instanceof ErrorApi && (e.estado === 422 || e.estado === 404)) throw e
    const db = await cargarFallbackLocal()
    db.companeros = db.companeros.filter((c) => c.id !== id)
    escribirDbLocal(db)
    await latenciaSimulada()
    return db.companeros
  }
}

// --- Categorías -------------------------------------------------------------

export async function guardarCategoria(
  datos: DatosCategoria,
  id?: string,
): Promise<CategoriaMaterial[]> {
  try {
    if (id) {
      await enviarJson(`categorias/${id}`, 'PUT', datos)
    } else {
      await enviarJson('categorias', 'POST', datos)
    }
    const estado = await obtenerJson<AppState>('estado')
    escribirDbLocal(estado)
    return estado.categorias
  } catch (e) {
    if (e instanceof ErrorApi && (e.estado === 422 || e.estado === 404)) throw e
    const db = await cargarFallbackLocal()
    const nombre = datos.nombre.trim()
    const keywords = [...new Set(datos.keywords.map((k) => k.trim().toLowerCase()).filter(Boolean))]

    if (id) {
      const indice = db.categorias.findIndex((c) => c.id === id)
      if (indice < 0) throw errorNoEncontrado('Esa categoría ya no existe')
      db.categorias[indice] = { id, nombre, icono: datos.icono, keywords }
    } else {
      const nuevoId = idDesdeNombre(nombre)
      db.categorias = [...db.categorias, { id: nuevoId, nombre, icono: datos.icono, keywords }]
    }
    escribirDbLocal(db)
    await latenciaSimulada()
    return db.categorias
  }
}

export async function eliminarCategoria(id: string): Promise<CategoriaMaterial[]> {
  try {
    await enviarJson(`categorias/${id}`, 'DELETE')
    const estado = await obtenerJson<AppState>('estado')
    escribirDbLocal(estado)
    return estado.categorias
  } catch (e) {
    if (e instanceof ErrorApi && (e.estado === 422 || e.estado === 404)) throw e
    const db = await cargarFallbackLocal()
    db.categorias = db.categorias.filter((c) => c.id !== id)
    escribirDbLocal(db)
    await latenciaSimulada()
    return db.categorias
  }
}
