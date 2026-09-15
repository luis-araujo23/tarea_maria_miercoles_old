export type TipoDivision = 'igual' | 'porcentaje' | 'exacto'

export type VistaApp = 'gastos' | 'materiales' | 'balance'

export interface Companero {
  id: string
  nombre: string
}

export interface DivisionParticipante {
  companeroId: string
  valor: number
}

export interface Producto {
  id: string
  nombre: string
  precio: number
  categoriaId: string
  icono: string
}

export interface Gasto {
  id: number
  descripcion: string
  monto: number
  pagadoPorId: string
  fecha: string
  tipoDivision: TipoDivision
  divisiones: DivisionParticipante[]
  /** Presente cuando el gasto nació de una compra en Materiales. */
  productoId?: string
}

export interface Pago {
  id: number
  deId: string
  paraId: string
  monto: number
  fecha: string
  nota?: string
  /** Si existe, el pago salda la deuda de esa compra concreta. */
  gastoId?: number
}

export interface DeudaSimplificada {
  deId: string
  paraId: string
  monto: number
}

export interface BalancePersona {
  companeroId: string
  pagado: number
  debe: number
  balance: number
}

export interface CategoriaMaterial {
  id: string
  nombre: string
  icono: string
  keywords: string[]
}

export type RolUsuario = 'admin' | 'usuario'

export interface Usuario {
  nombre: string
  apellido: string
  email: string
  rol: RolUsuario
}

export interface TasaCambio {
  /** Bolivares por 1 USD. */
  valor: number
  /** Fecha ISO en que el proveedor publico la tasa. */
  actualizado: string
  proveedor: string
}

export interface AppState {
  companeros: Companero[]
  gastos: Gasto[]
  pagos: Pago[]
  categorias: CategoriaMaterial[]
  productos: Producto[]
}
