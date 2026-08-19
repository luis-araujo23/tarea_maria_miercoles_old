import type { Companero, DeudaSimplificada, Gasto } from '../types'
import { validarDivision } from './balances'

const MAX_DESCRIPCION = 200
const MIN_NOMBRE = 2
const MAX_NOMBRE = 50

export function validarNombreCompanero(nombre: string): string | null {
  const trimmed = nombre.trim()
  if (!trimmed) return 'Ingresa un nombre'
  if (trimmed.length < MIN_NOMBRE) {
    return `El nombre debe tener al menos ${MIN_NOMBRE} caracteres`
  }
  if (trimmed.length > MAX_NOMBRE) {
    return `El nombre no puede superar ${MAX_NOMBRE} caracteres`
  }
  return null
}

export function validarGasto(
  payload: Omit<Gasto, 'id'>,
  companeros: Companero[]
): string | null {
  if (companeros.length === 0) {
    return 'Agrega al menos un compañero al grupo'
  }

  const descripcion = payload.descripcion.trim()
  if (!descripcion) return 'Ingresa una descripción'
  if (descripcion.length > MAX_DESCRIPCION) {
    return `La descripción no puede superar ${MAX_DESCRIPCION} caracteres`
  }

  if (typeof payload.monto !== 'number' || Number.isNaN(payload.monto) || payload.monto <= 0) {
    return 'Ingresa un monto válido mayor a 0'
  }

  if (!payload.pagadoPorId) return 'Selecciona quién pagó'
  if (!companeros.some((c) => c.id === payload.pagadoPorId)) {
    return 'El pagador no existe en el grupo'
  }

  if (!payload.fecha) return 'Selecciona una fecha'

  if (!payload.divisiones.some((d) => d.companeroId === payload.pagadoPorId)) {
    return 'El pagador debe estar incluido entre los participantes'
  }

  for (const division of payload.divisiones) {
    if (!companeros.some((c) => c.id === division.companeroId)) {
      return 'Hay participantes que ya no existen en el grupo'
    }
  }

  return validarDivision(payload.monto, payload.tipoDivision, payload.divisiones)
}

export function obtenerDeudaEntre(
  deId: string,
  paraId: string,
  deudas: DeudaSimplificada[]
): number {
  const deuda = deudas.find((d) => d.deId === deId && d.paraId === paraId)
  return deuda?.monto ?? 0
}

export function validarPago(
  deId: string,
  paraId: string,
  monto: number,
  companeros: Companero[],
  deudas: DeudaSimplificada[]
): string | null {
  if (companeros.length < 2) {
    return 'Se necesitan al menos 2 compañeros para registrar un pago'
  }

  if (!deId || !paraId) return 'Selecciona quién paga y quién recibe'
  if (!companeros.some((c) => c.id === deId)) return 'El pagador no existe en el grupo'
  if (!companeros.some((c) => c.id === paraId)) return 'El receptor no existe en el grupo'
  if (deId === paraId) return 'El pagador y receptor deben ser distintos'

  if (typeof monto !== 'number' || Number.isNaN(monto) || monto <= 0) {
    return 'Ingresa un monto válido mayor a 0'
  }

  const deudaMaxima = obtenerDeudaEntre(deId, paraId, deudas)
  if (deudaMaxima <= 0.009) {
    return 'No hay deuda pendiente entre estas personas'
  }
  if (monto > deudaMaxima + 0.009) {
    return `El monto no puede superar la deuda de $${deudaMaxima.toFixed(2)}`
  }

  return null
}
