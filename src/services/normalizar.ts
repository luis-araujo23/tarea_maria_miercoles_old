/**
 * Validación de todo lo que entra a la aplicación desde afuera: respuestas de
 * la API y contenido del almacenamiento local. Un registro que no cumple el
 * contrato se descarta en vez de romper las vistas más adelante.
 */

import type {
  AppState,
  CategoriaMaterial,
  Companero,
  DivisionParticipante,
  Gasto,
  Pago,
  Producto,
  TipoDivision,
} from '../types'
import { divisionIgual } from '../utils/balances'
import { ErrorApi } from './clienteHttp'

const TIPOS_DIVISION: TipoDivision[] = ['igual', 'porcentaje', 'exacto']
const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

function esTextoConContenido(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.trim().length > 0
}

function esMontoValido(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isFinite(valor) && valor > 0
}

function hoy(): string {
  return new Date().toISOString().slice(0, 10)
}

function normalizarFecha(valor: unknown): string {
  if (typeof valor !== 'string' || !FECHA_RE.test(valor)) return hoy()
  return Number.isNaN(Date.parse(valor)) ? hoy() : valor
}

export function normalizarCompanero(crudo: unknown): Companero | null {
  if (!esObjeto(crudo)) return null
  if (!esTextoConContenido(crudo.id) || !esTextoConContenido(crudo.nombre)) return null
  return { id: crudo.id.trim(), nombre: crudo.nombre.trim() }
}

function normalizarDivisiones(
  crudo: unknown,
  companeros: Companero[],
): DivisionParticipante[] {
  if (!Array.isArray(crudo)) return divisionIgual(companeros.map((c) => c.id))

  const validas = crudo.reduce<DivisionParticipante[]>((acc, item) => {
    if (!esObjeto(item)) return acc
    if (!esTextoConContenido(item.companeroId)) return acc
    if (!companeros.some((c) => c.id === item.companeroId)) return acc

    const valor = item.valor
    if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0) return acc

    acc.push({ companeroId: item.companeroId, valor })
    return acc
  }, [])

  // Un gasto sin participantes válidos se reparte entre todo el grupo.
  return validas.length > 0 ? validas : divisionIgual(companeros.map((c) => c.id))
}

export function normalizarGasto(crudo: unknown, companeros: Companero[]): Gasto | null {
  if (!esObjeto(crudo)) return null
  if (typeof crudo.id !== 'number' || !Number.isInteger(crudo.id)) return null
  if (!esTextoConContenido(crudo.descripcion)) return null
  if (!esMontoValido(crudo.monto)) return null

  // Los estados guardados por versiones viejas traían el nombre del pagador.
  let pagadoPorId = esTextoConContenido(crudo.pagadoPorId) ? crudo.pagadoPorId : ''
  if (!pagadoPorId && esTextoConContenido(crudo.pagadoPor)) {
    pagadoPorId = companeros.find((c) => c.nombre === crudo.pagadoPor)?.id ?? ''
  }
  if (!companeros.some((c) => c.id === pagadoPorId)) return null

  const tipoDivision = TIPOS_DIVISION.includes(crudo.tipoDivision as TipoDivision)
    ? (crudo.tipoDivision as TipoDivision)
    : 'igual'

  return {
    id: crudo.id,
    descripcion: crudo.descripcion.trim(),
    monto: crudo.monto,
    pagadoPorId,
    fecha: normalizarFecha(crudo.fecha),
    tipoDivision,
    divisiones: normalizarDivisiones(crudo.divisiones, companeros),
    productoId: esTextoConContenido(crudo.productoId) ? crudo.productoId : undefined,
  }
}

export function normalizarPago(crudo: unknown, companeros: Companero[]): Pago | null {
  if (!esObjeto(crudo)) return null
  if (typeof crudo.id !== 'number' || !Number.isInteger(crudo.id)) return null
  if (!esTextoConContenido(crudo.deId) || !esTextoConContenido(crudo.paraId)) return null
  if (crudo.deId === crudo.paraId) return null
  if (!esMontoValido(crudo.monto)) return null
  if (!companeros.some((c) => c.id === crudo.deId)) return null
  if (!companeros.some((c) => c.id === crudo.paraId)) return null

  return {
    id: crudo.id,
    deId: crudo.deId,
    paraId: crudo.paraId,
    monto: crudo.monto,
    fecha: normalizarFecha(crudo.fecha),
    nota: esTextoConContenido(crudo.nota) ? crudo.nota.trim() : undefined,
    gastoId: typeof crudo.gastoId === 'number' && Number.isInteger(crudo.gastoId)
      ? crudo.gastoId
      : undefined,
  }
}

export function normalizarProducto(crudo: unknown): Producto | null {
  if (!esObjeto(crudo)) return null
  if (!esTextoConContenido(crudo.id) || !esTextoConContenido(crudo.nombre)) return null
  if (!esMontoValido(crudo.precio)) return null
  if (!esTextoConContenido(crudo.categoriaId) || !esTextoConContenido(crudo.icono)) return null

  return {
    id: crudo.id.trim(),
    nombre: crudo.nombre.trim(),
    precio: crudo.precio,
    categoriaId: crudo.categoriaId.trim(),
    icono: crudo.icono,
  }
}

export function normalizarCategoria(crudo: unknown): CategoriaMaterial | null {
  if (!esObjeto(crudo)) return null
  if (!esTextoConContenido(crudo.id) || !esTextoConContenido(crudo.nombre)) return null
  if (!esTextoConContenido(crudo.icono)) return null

  const keywords = Array.isArray(crudo.keywords)
    ? crudo.keywords
        .filter(esTextoConContenido)
        .map((k) => k.trim().toLowerCase())
    : []

  return {
    id: crudo.id.trim(),
    nombre: crudo.nombre.trim(),
    icono: crudo.icono,
    keywords,
  }
}

function comoLista(crudo: unknown, recurso: string): unknown[] {
  if (!Array.isArray(crudo)) {
    throw new ErrorApi('formato', `El servidor no devolvió una lista de ${recurso}`, 502)
  }
  return crudo
}

/**
 * Arma el estado de la aplicación a partir de datos sin verificar. Los
 * compañeros son obligatorios porque gastos y pagos se apoyan en sus ids.
 */
export function normalizarEstado(crudo: {
  companeros: unknown
  gastos: unknown
  pagos: unknown
  categorias: unknown
  productos?: unknown
}): AppState {
  const companeros = comoLista(crudo.companeros, 'compañeros')
    .map(normalizarCompanero)
    .filter((c): c is Companero => c !== null)

  const idsUnicos = new Set(companeros.map((c) => c.id))
  if (idsUnicos.size !== companeros.length) {
    throw new ErrorApi('formato', 'El servidor devolvió compañeros con ids repetidos', 502)
  }

  const gastos = comoLista(crudo.gastos, 'gastos')
    .map((g) => normalizarGasto(g, companeros))
    .filter((g): g is Gasto => g !== null)

  const pagos = comoLista(crudo.pagos, 'pagos')
    .map((p) => normalizarPago(p, companeros))
    .filter((p): p is Pago => p !== null)

  const categorias = comoLista(crudo.categorias, 'categorías')
    .map(normalizarCategoria)
    .filter((c): c is CategoriaMaterial => c !== null)

  const productos = Array.isArray(crudo.productos)
    ? crudo.productos.map(normalizarProducto).filter((p): p is Producto => p !== null)
    : []

  return { companeros, gastos, pagos, categorias, productos }
}
