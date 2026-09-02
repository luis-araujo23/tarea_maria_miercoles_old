export type TipoDivision = 'igual' | 'porcentaje' | 'exacto'

export type VistaApp = 'gastos' | 'companeros' | 'materiales'

export interface Companero {
  id: string
  nombre: string
}

export interface DivisionParticipante {
  companeroId: string
  valor: number
}

export interface Gasto {
  id: number
  descripcion: string
  monto: number
  pagadoPorId: string
  fecha: string
  tipoDivision: TipoDivision
  divisiones: DivisionParticipante[]
}

export interface Pago {
  id: number
  deId: string
  paraId: string
  monto: number
  fecha: string
  nota?: string
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

export interface Usuario {
  nombre: string
  email: string
}

export interface AppState {
  companeros: Companero[]
  gastos: Gasto[]
  pagos: Pago[]
}
