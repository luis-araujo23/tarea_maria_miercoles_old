/**
 * API simulada de UJAP Split.
 *
 * Las lecturas iniciales salen de endpoints JSON reales (`public/api/*.json`)
 * consultados con `fetch`. A partir de ahí el "servidor" guarda su base de
 * datos en localStorage: las escrituras son asíncronas, validan igual que un
 * backend y devuelven la colección ya actualizada.
 *
 * Las vistas nunca tocan el almacenamiento: solo conocen estas funciones.
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
import { ErrorApi, latenciaSimulada, obtenerJson } from './clienteHttp'
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

// --- Persistencia del "servidor" -------------------------------------------

function leerDb(): AppState | null {
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
    // Datos corruptos o manipulados: se ignoran y se vuelve a sembrar del API.
    return null
  }
}

function escribirDb(estado: AppState): void {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(estado))
  } catch {
    throw new ErrorApi(
      'almacenamiento',
      'No se pudieron guardar los cambios: el almacenamiento del navegador está lleno o bloqueado',
      507,
    )
  }
}

/** Descarga el estado inicial desde los endpoints de la API con `fetch`. */
async function descargarSemilla(): Promise<AppState> {
  const [companeros, gastos, pagos, categorias, productos] = await Promise.all([
    obtenerJson<unknown>('companeros.json'),
    obtenerJson<unknown>('gastos.json'),
    obtenerJson<unknown>('pagos.json'),
    obtenerJson<unknown>('categorias.json'),
    obtenerJson<unknown>('productos.json'),
  ])

  return normalizarEstado({ companeros, gastos, pagos, categorias, productos })
}

async function cargarDb(): Promise<AppState> {
  const guardado = leerDb()
  if (guardado) return guardado

  const semilla = await descargarSemilla()
  escribirDb(semilla)
  return semilla
}

/**
 * Aplica un cambio sobre la base de datos y lo persiste. Recibir siempre el
 * estado fresco evita escribir encima de cambios hechos desde otra pestaña.
 */
async function transaccion<T>(operacion: (db: AppState) => T): Promise<T> {
  const db = await cargarDb()
  const resultado = operacion(db)
  escribirDb(db)
  await latenciaSimulada()
  return resultado
}

function errorValidacion(mensaje: string): ErrorApi {
  return new ErrorApi('validacion', mensaje, 422)
}

function errorNoEncontrado(mensaje: string): ErrorApi {
  return new ErrorApi('no-encontrado', mensaje, 404)
}

// --- Lectura ----------------------------------------------------------------

/**
 * GET del estado completo. Con `forzarServidor` descarta la copia local y
 * vuelve a pedir los datos originales al API.
 */
export async function obtenerEstado(forzarServidor = false): Promise<AppState> {
  if (forzarServidor) {
    const semilla = await descargarSemilla()
    escribirDb(semilla)
    await latenciaSimulada()
    return semilla
  }

  const estado = await cargarDb()
  await latenciaSimulada(0.5)
  return estado
}

// --- Gastos -----------------------------------------------------------------

export function crearGasto(datos: DatosGasto): Promise<Gasto[]> {
  return transaccion((db) => {
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

    return db.gastos
  })
}

export function actualizarGasto(id: number, datos: DatosGasto): Promise<Gasto[]> {
  return transaccion((db) => {
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

    return db.gastos
  })
}

export function eliminarGasto(id: number): Promise<Gasto[]> {
  return transaccion((db) => {
    if (!db.gastos.some((g) => g.id === id)) {
      throw errorNoEncontrado(`El gasto #${id} ya no existe`)
    }

    db.gastos = db.gastos.filter((g) => g.id !== id)
    return db.gastos
  })
}

export function vaciarGastos(): Promise<Gasto[]> {
  return transaccion((db) => {
    if (db.gastos.length === 0) {
      throw errorValidacion('No hay gastos que eliminar')
    }

    db.gastos = []
    return db.gastos
  })
}

// --- Pagos ------------------------------------------------------------------

export function crearPago(datos: DatosPago): Promise<Pago[]> {
  return transaccion((db) => {
    const nota = datos.nota?.trim()
    let error: string | null

    if (datos.gastoId !== undefined) {
      const gasto = db.gastos.find((g) => g.id === datos.gastoId)
      if (!gasto) throw errorNoEncontrado('Esa compra ya no existe')

      const pendiente = cuotaPendienteDeGasto(
        gasto,
        datos.deId,
        db.pagos,
        db.companeros,
      )
      error = validarPagoDeCompra(
        datos.deId,
        datos.paraId,
        datos.monto,
        pendiente,
        db.companeros,
      )
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

    return db.pagos
  })
}

export function crearCompra(datos: DatosCompra): Promise<Gasto[]> {
  return transaccion((db) => {
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

    const errorGasto = validarGasto(gasto, db.companeros)
    if (errorGasto) throw errorValidacion(errorGasto)

    db.gastos = [gasto, ...db.gastos]
    return db.gastos
  })
}

export function guardarProducto(datos: DatosProducto, id?: string): Promise<Producto[]> {
  return transaccion((db) => {
    const error = validarProducto(datos, db.categorias, db.productos, id)
    if (error) throw errorValidacion(error)

    const nombre = datos.nombre.trim()
    const precio = redondear(datos.precio)

    if (id) {
      const indice = db.productos.findIndex((p) => p.id === id)
      if (indice < 0) throw errorNoEncontrado('Ese producto ya no existe')
      db.productos[indice] = {
        id,
        nombre,
        precio,
        categoriaId: datos.categoriaId,
        icono: datos.icono,
      }
      return db.productos
    }

    const nuevoId = `p-${idDesdeNombre(nombre) || Date.now()}`
    if (db.productos.some((p) => p.id === nuevoId)) {
      throw errorValidacion(`Ya existe un producto llamado "${nombre}"`)
    }

    db.productos = [
      ...db.productos,
      { id: nuevoId, nombre, precio, categoriaId: datos.categoriaId, icono: datos.icono },
    ]
    return db.productos
  })
}

export function eliminarProducto(id: string): Promise<Producto[]> {
  return transaccion((db) => {
    if (!db.productos.some((p) => p.id === id)) {
      throw errorNoEncontrado('Ese producto ya no existe')
    }
    db.productos = db.productos.filter((p) => p.id !== id)
    return db.productos
  })
}

export function eliminarPago(id: number): Promise<Pago[]> {
  return transaccion((db) => {
    if (!db.pagos.some((p) => p.id === id)) {
      throw errorNoEncontrado(`El pago #${id} ya no existe`)
    }

    db.pagos = db.pagos.filter((p) => p.id !== id)
    return db.pagos
  })
}

// --- Compañeros -------------------------------------------------------------

export function crearCompanero(nombre: string): Promise<Companero[]> {
  return transaccion((db) => {
    const error = validarNombreCompanero(nombre)
    if (error) throw errorValidacion(error)

    const limpio = nombre.trim().replace(/\s+/g, ' ')
    if (db.companeros.some((c) => c.nombre.toLowerCase() === limpio.toLowerCase())) {
      throw errorValidacion(`${limpio} ya forma parte del grupo`)
    }

    db.companeros = [...db.companeros, { id: siguienteIdCompanero(db.companeros), nombre: limpio }]
    return db.companeros
  })
}

export function eliminarCompanero(id: string): Promise<Companero[]> {
  return transaccion((db) => {
    const companero = db.companeros.find((c) => c.id === id)
    if (!companero) throw errorNoEncontrado('Ese compañero ya no está en el grupo')

    if (db.companeros.length <= 1) {
      throw errorValidacion('Debe quedar al menos un compañero en el grupo')
    }

    // Borrarlo dejaría gastos y pagos apuntando a alguien inexistente.
    const gastosLigados = db.gastos.filter(
      (g) => g.pagadoPorId === id || g.divisiones.some((d) => d.companeroId === id),
    ).length
    const pagosLigados = db.pagos.filter((p) => p.deId === id || p.paraId === id).length

    if (gastosLigados > 0 || pagosLigados > 0) {
      const partes: string[] = []
      if (gastosLigados > 0) partes.push(`${gastosLigados} gasto(s)`)
      if (pagosLigados > 0) partes.push(`${pagosLigados} pago(s)`)
      throw errorValidacion(
        `No se puede eliminar a ${companero.nombre}: participa en ${partes.join(' y ')}`,
      )
    }

    db.companeros = db.companeros.filter((c) => c.id !== id)
    return db.companeros
  })
}

// --- Categorías -------------------------------------------------------------

export function guardarCategoria(
  datos: DatosCategoria,
  id?: string,
): Promise<CategoriaMaterial[]> {
  return transaccion((db) => {
    const error = validarCategoria(datos, db.categorias, id)
    if (error) throw errorValidacion(error)

    const nombre = datos.nombre.trim()
    const keywords = [...new Set(datos.keywords.map((k) => k.trim().toLowerCase()).filter(Boolean))]

    if (id) {
      const indice = db.categorias.findIndex((c) => c.id === id)
      if (indice < 0) throw errorNoEncontrado('Esa categoría ya no existe')

      db.categorias[indice] = { id, nombre, icono: datos.icono, keywords }
      return db.categorias
    }

    const nuevoId = idDesdeNombre(nombre)
    if (!nuevoId) throw errorValidacion('El nombre debe incluir letras o números')
    if (db.categorias.some((c) => c.id === nuevoId)) {
      throw errorValidacion(`Ya existe una categoría llamada "${nombre}"`)
    }

    db.categorias = [...db.categorias, { id: nuevoId, nombre, icono: datos.icono, keywords }]
    return db.categorias
  })
}

export function eliminarCategoria(id: string): Promise<CategoriaMaterial[]> {
  return transaccion((db) => {
    if (!db.categorias.some((c) => c.id === id)) {
      throw errorNoEncontrado('Esa categoría ya no existe')
    }

    db.categorias = db.categorias.filter((c) => c.id !== id)
    return db.categorias
  })
}
