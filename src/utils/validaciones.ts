import type { CategoriaMaterial, Companero, DeudaSimplificada, Gasto, Producto } from '../types'
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

const MAX_EMAIL = 80
const MIN_CLAVE = 8
const MAX_CLAVE = 64
const MIN_NOMBRE_PERSONA = 2
const MAX_NOMBRE_PERSONA = 30
const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const NOMBRE_PERSONA_RE =
  /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '\-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/

function validarParteNombre(
  valor: string,
  etiqueta: 'nombre' | 'apellido',
): string | null {
  const trimmed = valor.trim().replace(/\s+/g, ' ')
  const articulo = etiqueta === 'nombre' ? 'el nombre' : 'el apellido'
  const posesivo = etiqueta === 'nombre' ? 'tu nombre' : 'tu apellido'

  if (!trimmed) return `Ingresa ${posesivo}`
  if (trimmed.length < MIN_NOMBRE_PERSONA) {
    return `${etiqueta === 'nombre' ? 'El nombre' : 'El apellido'} debe tener al menos ${MIN_NOMBRE_PERSONA} caracteres`
  }
  if (trimmed.length > MAX_NOMBRE_PERSONA) {
    return `${etiqueta === 'nombre' ? 'El nombre' : 'El apellido'} no puede superar ${MAX_NOMBRE_PERSONA} caracteres`
  }
  if (/\d/.test(trimmed)) return `${etiqueta === 'nombre' ? 'El nombre' : 'El apellido'} no puede contener numeros`
  if (!NOMBRE_PERSONA_RE.test(trimmed)) {
    return `Ingresa ${articulo} solo con letras`
  }
  return null
}

export function validarNombrePersona(nombre: string): string | null {
  return validarParteNombre(nombre, 'nombre')
}

export function validarApellido(apellido: string): string | null {
  return validarParteNombre(apellido, 'apellido')
}

export function validarEmail(email: string): string | null {
  const trimmed = email.trim()
  if (!trimmed) return 'Ingresa tu correo electronico'
  if (trimmed.includes(' ')) return 'El correo no puede contener espacios'
  if (trimmed.length > MAX_EMAIL) {
    return `El correo no puede superar ${MAX_EMAIL} caracteres`
  }
  if (!EMAIL_RE.test(trimmed)) return 'Ingresa un correo electronico valido'
  return null
}

export function validarContrasena(clave: string): string | null {
  if (!clave) return 'Ingresa tu contrasena'
  if (/\s/.test(clave)) return 'La contrasena no puede contener espacios'
  if (clave.length < MIN_CLAVE) {
    return `La contrasena debe tener al menos ${MIN_CLAVE} caracteres`
  }
  if (clave.length > MAX_CLAVE) {
    return `La contrasena no puede superar ${MAX_CLAVE} caracteres`
  }
  if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(clave)) {
    return 'La contrasena debe incluir al menos una letra'
  }
  if (!/\d/.test(clave)) {
    return 'La contrasena debe incluir al menos un numero'
  }
  return null
}

export function validarConfirmacionContrasena(
  clave: string,
  confirmacion: string,
): string | null {
  if (!confirmacion) return 'Confirma tu contrasena'
  if (clave !== confirmacion) return 'Las contrasenas no coinciden'
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

const MIN_CATEGORIA = 2
const MAX_CATEGORIA = 40
const MAX_KEYWORDS = 15
const MAX_LARGO_KEYWORD = 30

export interface DatosCategoria {
  nombre: string
  icono: string
  keywords: string[]
}

/** `idActual` se pasa al editar, para no chocar la categoría consigo misma. */
export function validarCategoria(
  datos: DatosCategoria,
  categorias: CategoriaMaterial[],
  idActual?: string
): string | null {
  const nombre = datos.nombre.trim()
  if (!nombre) return 'Ingresa un nombre para la categoría'
  if (nombre.length < MIN_CATEGORIA) {
    return `El nombre debe tener al menos ${MIN_CATEGORIA} caracteres`
  }
  if (nombre.length > MAX_CATEGORIA) {
    return `El nombre no puede superar ${MAX_CATEGORIA} caracteres`
  }

  if (!datos.icono.trim()) return 'Selecciona un ícono para la categoría'

  if (datos.keywords.length > MAX_KEYWORDS) {
    return `Usa como máximo ${MAX_KEYWORDS} palabras clave`
  }
  if (datos.keywords.some((k) => k.length > MAX_LARGO_KEYWORD)) {
    return `Cada palabra clave debe tener menos de ${MAX_LARGO_KEYWORD} caracteres`
  }

  const repetida = categorias.some(
    (c) => c.id !== idActual && c.nombre.trim().toLowerCase() === nombre.toLowerCase()
  )
  if (repetida) return `Ya existe una categoría llamada "${nombre}"`

  return null
}

export interface DatosProducto {
  nombre: string
  precio: number
  categoriaId: string
  icono: string
}

export function validarProducto(
  datos: DatosProducto,
  categorias: CategoriaMaterial[],
  productos: Producto[],
  idActual?: string
): string | null {
  const nombre = datos.nombre.trim()
  if (!nombre) return 'Ingresa el nombre del producto'
  if (nombre.length < 2) return 'El nombre del producto debe tener al menos 2 caracteres'
  if (nombre.length > 80) return 'El nombre del producto no puede superar 80 caracteres'

  if (typeof datos.precio !== 'number' || Number.isNaN(datos.precio) || datos.precio <= 0) {
    return 'Ingresa un precio válido mayor a 0'
  }

  if (!datos.icono.trim()) return 'Selecciona un ícono'
  if (!datos.categoriaId) return 'Selecciona una categoría'
  if (!categorias.some((c) => c.id === datos.categoriaId)) {
    return 'La categoría del producto no existe'
  }

  const repetido = productos.some(
    (p) => p.id !== idActual && p.nombre.trim().toLowerCase() === nombre.toLowerCase()
  )
  if (repetido) return `Ya existe un producto llamado "${nombre}"`

  return null
}

export function validarCompra(
  productoId: string,
  pagadoPorId: string,
  participanteIds: string[],
  productos: Producto[],
  companeros: Companero[]
): string | null {
  if (!productos.some((p) => p.id === productoId)) return 'Ese producto ya no está a la venta'
  if (!companeros.some((c) => c.id === pagadoPorId)) {
    return 'Tu perfil de compañero no está en el grupo. Pídele al admin que te agregue.'
  }

  const unicos = [...new Set(participanteIds)]
  if (unicos.length === 0) return 'Elige al menos una persona para dividir el pago'
  if (!unicos.includes(pagadoPorId)) {
    return 'Debes incluirte en el grupo que va a pagar el producto'
  }
  if (unicos.some((id) => !companeros.some((c) => c.id === id))) {
    return 'Hay compañeros seleccionados que ya no están en el grupo'
  }

  return null
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

export function validarPagoDeCompra(
  deId: string,
  paraId: string,
  monto: number,
  pendiente: number,
  companeros: Companero[]
): string | null {
  if (!deId || !paraId) return 'Selecciona quién paga y quién recibe'
  if (!companeros.some((c) => c.id === deId)) return 'El pagador no existe en el grupo'
  if (!companeros.some((c) => c.id === paraId)) return 'El receptor no existe en el grupo'
  if (typeof monto !== 'number' || Number.isNaN(monto) || monto <= 0) {
    return 'Ingresa un monto válido mayor a 0'
  }
  if (pendiente <= 0.009) return 'Tu parte de esta compra ya está saldada'
  if (monto > pendiente + 0.009) {
    return `El monto no puede superar lo pendiente de $${pendiente.toFixed(2)}`
  }
  return null
}
