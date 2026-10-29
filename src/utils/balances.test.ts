import { describe, it, expect } from 'vitest'
import type {
  Companero,
  DivisionParticipante,
  Gasto,
  Pago,
} from '../types'
import {
  calcularCuota,
  calcularBalances,
  cuotaPendienteDeGasto,
  deudasDeGasto,
  divisionIgual,
  simplificarDeudas,
  validarDivision,
} from './balances'

const companeros: Companero[] = [
  { id: 'c1', nombre: 'Ana' },
  { id: 'c2', nombre: 'Luis' },
  { id: 'c3', nombre: 'Maria' },
]

function gastoBase(overrides: Partial<Gasto> = {}): Gasto {
  return {
    id: 1,
    descripcion: 'Copias',
    monto: 30,
    pagadoPorId: 'c1',
    fecha: '2026-04-01',
    tipoDivision: 'igual',
    divisiones: divisionIgual(['c1', 'c2', 'c3']),
    ...overrides,
  }
}

describe('divisionIgual', () => {
  it('reparte el monto en partes iguales entre los participantes', () => {
    const divs = divisionIgual(['c1', 'c2', 'c3'])
    expect(divs).toHaveLength(3)
    expect(divs.every((d) => d.valor === 0)).toBe(true)
  })
})

describe('calcularCuota', () => {
  it('división igual reparte el monto entre todos', () => {
    const g = gastoBase()
    expect(calcularCuota(g, 'c2', companeros)).toBe(10)
  })

  it('división porcentual aplica el porcentaje indicado', () => {
    const g = gastoBase({
      tipoDivision: 'porcentaje',
      divisiones: [
        { companeroId: 'c1', valor: 50 },
        { companeroId: 'c2', valor: 30 },
        { companeroId: 'c3', valor: 20 },
      ],
    })
    expect(calcularCuota(g, 'c1', companeros)).toBe(15)
    expect(calcularCuota(g, 'c3', companeros)).toBe(6)
  })

  it('división exacta usa el monto indicado por persona', () => {
    const g = gastoBase({
      tipoDivision: 'exacto',
      divisiones: [
        { companeroId: 'c1', valor: 10 },
        { companeroId: 'c2', valor: 10 },
        { companeroId: 'c3', valor: 10 },
      ],
    })
    expect(calcularCuota(g, 'c2', companeros)).toBe(10)
  })
})

describe('cuotaPendienteDeGasto', () => {
  it('devuelve la cuota completa cuando no hay pagos', () => {
    const g = gastoBase()
    expect(cuotaPendienteDeGasto(g, 'c2', [], companeros)).toBe(10)
  })

  it('resta los pagos ya abonados para esa compra', () => {
    const g = gastoBase()
    const pagos: Pago[] = [{ id: 1, deId: 'c2', paraId: 'c1', monto: 4, fecha: '2026-04-02', gastoId: 1 }]
    expect(cuotaPendienteDeGasto(g, 'c2', pagos, companeros)).toBe(6)
  })

  it('no devuelve negativo si ya se pagó de más', () => {
    const g = gastoBase()
    const pagos: Pago[] = [{ id: 1, deId: 'c2', paraId: 'c1', monto: 15, fecha: '2026-04-02', gastoId: 1 }]
    expect(cuotaPendienteDeGasto(g, 'c2', pagos, companeros)).toBe(0)
  })
})

describe('deudasDeGasto', () => {
  it('genera una deuda por cada participante (incluye el pagador hacia sí mismo)', () => {
    const g = gastoBase()
    const deudas = deudasDeGasto(g, [], companeros)
    expect(deudas).toHaveLength(3)
    const otros = deudas.filter((d) => d.deId !== 'c1')
    expect(otros).toHaveLength(2)
    expect(otros.every((d) => d.monto === 10)).toBe(true)
  })
})

describe('calcularBalances', () => {
  it('el que pagó tiene balance positivo y los demás negativo', () => {
    const g = gastoBase()
    const balances = calcularBalances([g], [], companeros)
    const pagador = balances.find((b) => b.companeroId === 'c1')
    const deudor = balances.find((b) => b.companeroId === 'c2')
    expect(pagador!.balance).toBe(20) // pagó 30, debe 10
    expect(deudor!.balance).toBe(-10) // debe 10, no pagó nada
  })

  it('los pagos ajustan los balances', () => {
    const g = gastoBase()
    const pagos: Pago[] = [{ id: 1, deId: 'c2', paraId: 'c1', monto: 10, fecha: '2026-04-02', gastoId: 1 }]
    const balances = calcularBalances([g], pagos, companeros)
    // c1 pagó 30 y debe 10 (balance +20); recibe 10 de c2 → +10 neto (c3 aún no paga)
    expect(balances.find((b) => b.companeroId === 'c1')!.balance).toBe(10)
    // c2 debía 10 y pagó 10 → 0
    expect(balances.find((b) => b.companeroId === 'c2')!.balance).toBe(0)
  })
})

describe('simplificarDeudas', () => {
  it('reduce las deudas al mínimo de transacciones', () => {
    const balances = [
      { companeroId: 'c1', pagado: 30, debe: 0, balance: 30 },
      { companeroId: 'c2', pagado: 0, debe: 20, balance: -20 },
      { companeroId: 'c3', pagado: 0, debe: 10, balance: -10 },
    ]
    const deudas = simplificarDeudas(balances)
    expect(deudas.length).toBeLessThanOrEqual(2)
    const total = deudas.reduce((acc, d) => acc + d.monto, 0)
    expect(total).toBe(30)
  })
})

describe('validarDivision', () => {
  it('rechaza sin participantes', () => {
    expect(validarDivision(10, 'igual', [])).toBe('Selecciona al menos un participante')
  })

  it('porcentaje debe sumar 100', () => {
    const divs: DivisionParticipante[] = [
      { companeroId: 'c1', valor: 50 },
      { companeroId: 'c2', valor: 30 },
    ]
    expect(validarDivision(10, 'porcentaje', divs)).toContain('100%')
  })

  it('exacto debe sumar el monto', () => {
    const divs: DivisionParticipante[] = [
      { companeroId: 'c1', valor: 5 },
      { companeroId: 'c2', valor: 4 },
    ]
    expect(validarDivision(10, 'exacto', divs)).toContain('$10.00')
  })

  it('devuelve null cuando todo es válido', () => {
    const divs: DivisionParticipante[] = [
      { companeroId: 'c1', valor: 50 },
      { companeroId: 'c2', valor: 50 },
    ]
    expect(validarDivision(10, 'porcentaje', divs)).toBe(null)
  })
})
