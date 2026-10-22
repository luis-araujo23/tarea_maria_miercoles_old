import { describe, it, expect } from 'vitest'
import { calcularCuota } from '../../src/utils/balances'
import type { Gasto, Companero } from '../../src/types'

describe('Utilidades de Balances y Cuotas (Frontend)', () => {
  const companerosDemo: Companero[] = [
    { id: 'c1', nombre: 'María' },
    { id: 'c2', nombre: 'Juan' },
    { id: 'c3', nombre: 'Carlos' },
  ]

  it('calcula cuotas equitativas (partes iguales) correctamente', () => {
    const gasto: Gasto = {
      id: 1,
      descripcion: 'Resma de papel',
      monto: 30,
      pagadoPorId: 'c1',
      fecha: '2026-10-16',
      tipoDivision: 'igual',
      divisiones: [
        { companeroId: 'c1', valor: 0 },
        { companeroId: 'c2', valor: 0 },
        { companeroId: 'c3', valor: 0 },
      ],
    }

    expect(calcularCuota(gasto, 'c1', companerosDemo)).toBe(10)
    expect(calcularCuota(gasto, 'c2', companerosDemo)).toBe(10)
    expect(calcularCuota(gasto, 'c3', companerosDemo)).toBe(10)
  })

  it('calcula cuotas porcentuales (%) correctamente', () => {
    const gasto: Gasto = {
      id: 2,
      descripcion: 'Alquiler proyector',
      monto: 100,
      pagadoPorId: 'c1',
      fecha: '2026-10-16',
      tipoDivision: 'porcentaje',
      divisiones: [
        { companeroId: 'c1', valor: 50 },
        { companeroId: 'c2', valor: 30 },
        { companeroId: 'c3', valor: 20 },
      ],
    }

    expect(calcularCuota(gasto, 'c1', companerosDemo)).toBe(50)
    expect(calcularCuota(gasto, 'c2', companerosDemo)).toBe(30)
    expect(calcularCuota(gasto, 'c3', companerosDemo)).toBe(20)
  })

  it('calcula cuotas por montos exactos ($) correctamente', () => {
    const gasto: Gasto = {
      id: 3,
      descripcion: 'Materiales varios',
      monto: 55,
      pagadoPorId: 'c2',
      fecha: '2026-10-16',
      tipoDivision: 'exacto',
      divisiones: [
        { companeroId: 'c1', valor: 25 },
        { companeroId: 'c2', valor: 20 },
        { companeroId: 'c3', valor: 10 },
      ],
    }

    expect(calcularCuota(gasto, 'c1', companerosDemo)).toBe(25)
    expect(calcularCuota(gasto, 'c2', companerosDemo)).toBe(20)
    expect(calcularCuota(gasto, 'c3', companerosDemo)).toBe(10)
  })

  it('retorna 0 si el compañero no participa en el gasto', () => {
    const gasto: Gasto = {
      id: 4,
      descripcion: 'Gasto individual',
      monto: 15,
      pagadoPorId: 'c1',
      fecha: '2026-10-16',
      tipoDivision: 'exacto',
      divisiones: [{ companeroId: 'c1', valor: 15 }],
    }

    expect(calcularCuota(gasto, 'c2', companerosDemo)).toBe(0)
  })
})
