import { ref, watch } from 'vue'
import type { AppState, Companero, Gasto, Pago } from '../types'
import { divisionIgual } from '../utils/balances'

const STORAGE_KEY = 'ujap-split-state'

const DEFAULT_COMPANEROS: Companero[] = [
  { id: 'c1', nombre: 'María' },
  { id: 'c2', nombre: 'Juan' },
  { id: 'c3', nombre: 'Carlos' },
  { id: 'c4', nombre: 'Ana' },
]

function crearGastosIniciales(): Gasto[] {
  const ids = DEFAULT_COMPANEROS.map((c) => c.id)
  const division = divisionIgual(ids)

  return [
    {
      id: 1,
      descripcion: 'Copias de apuntes — Cálculo I (80 hojas)',
      monto: 12.0,
      pagadoPorId: 'c1',
      fecha: '2026-01-15',
      tipoDivision: 'igual',
      divisiones: division,
    },
    {
      id: 2,
      descripcion: 'Caja de lápices y bolígrafos para el grupo',
      monto: 6.5,
      pagadoPorId: 'c2',
      fecha: '2026-01-18',
      tipoDivision: 'igual',
      divisiones: division,
    },
    {
      id: 3,
      descripcion: 'Alquiler de videobeam — exposición final',
      monto: 25.0,
      pagadoPorId: 'c3',
      fecha: '2026-01-22',
      tipoDivision: 'porcentaje',
      divisiones: [
        { companeroId: 'c1', valor: 30 },
        { companeroId: 'c2', valor: 25 },
        { companeroId: 'c3', valor: 25 },
        { companeroId: 'c4', valor: 20 },
      ],
    },
    {
      id: 4,
      descripcion: 'Resma de hojas tamaño carta',
      monto: 8.5,
      pagadoPorId: 'c4',
      fecha: '2026-02-01',
      tipoDivision: 'igual',
      divisiones: division,
    },
    {
      id: 5,
      descripcion: 'Impresión de trabajos de laboratorio (x4)',
      monto: 10.0,
      pagadoPorId: 'c1',
      fecha: '2026-02-05',
      tipoDivision: 'exacto',
      divisiones: [
        { companeroId: 'c1', valor: 2.5 },
        { companeroId: 'c2', valor: 2.5 },
        { companeroId: 'c3', valor: 2.5 },
        { companeroId: 'c4', valor: 2.5 },
      ],
    },
  ]
}

function migrarGasto(raw: Record<string, unknown>, companeros: Companero[]): Gasto | null {
  if (typeof raw.id !== 'number' || typeof raw.descripcion !== 'string') return null

  const monto = typeof raw.monto === 'number' ? raw.monto : 0
  let pagadoPorId = typeof raw.pagadoPorId === 'string' ? raw.pagadoPorId : ''

  if (!pagadoPorId && typeof raw.pagadoPor === 'string') {
    pagadoPorId =
      companeros.find((c) => c.nombre === raw.pagadoPor)?.id ?? companeros[0]?.id ?? ''
  }

  const fecha = typeof raw.fecha === 'string' ? raw.fecha : new Date().toISOString().slice(0, 10)
  const tipoDivision = (raw.tipoDivision as Gasto['tipoDivision']) ?? 'igual'
  const divisiones = Array.isArray(raw.divisiones)
    ? (raw.divisiones as Gasto['divisiones'])
    : divisionIgual(companeros.map((c) => c.id))

  return {
    id: raw.id,
    descripcion: raw.descripcion,
    monto,
    pagadoPorId,
    fecha,
    tipoDivision,
    divisiones,
  }
}

function cargarEstado(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      const companeros = (parsed.companeros as Companero[]) ?? DEFAULT_COMPANEROS
      if (companeros.length && Array.isArray(parsed.gastos)) {
        const gastos = (parsed.gastos as Record<string, unknown>[])
          .map((g) => migrarGasto(g, companeros))
          .filter((g): g is Gasto => g !== null)

        return {
          companeros,
          gastos,
          pagos: (parsed.pagos as Pago[]) ?? [],
        }
      }
    }
  } catch {
    /* usar datos iniciales */
  }

  return {
    companeros: DEFAULT_COMPANEROS,
    gastos: crearGastosIniciales(),
    pagos: [],
  }
}

function guardarEstado(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function useAppStore() {
  const inicial = cargarEstado()
  const companeros = ref<Companero[]>(inicial.companeros)
  const gastos = ref<Gasto[]>(inicial.gastos)
  const pagos = ref<Pago[]>(inicial.pagos)
  const nextGastoId = ref(
    Math.max(0, ...gastos.value.map((g) => g.id)) + 1
  )
  const nextPagoId = ref(
    Math.max(0, ...pagos.value.map((p) => p.id)) + 1
  )
  const nextCompaneroId = ref(
    Math.max(
      0,
      ...companeros.value.map((c) => Number.parseInt(c.id.replace(/\D/g, ''), 10) || 0)
    ) + 1
  )

  watch(
    [companeros, gastos, pagos],
    () => {
      guardarEstado({
        companeros: companeros.value,
        gastos: gastos.value,
        pagos: pagos.value,
      })
    },
    { deep: true }
  )

  function nombreCompanero(id: string): string {
    return companeros.value.find((c) => c.id === id)?.nombre ?? 'Desconocido'
  }

  return {
    companeros,
    gastos,
    pagos,
    nextGastoId,
    nextPagoId,
    nextCompaneroId,
    nombreCompanero,
  }
}
