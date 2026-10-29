import { describe, it, expect, vi } from 'vitest'
import type { Gasto } from '../types'
import type { BalancePersona } from '../types'
import { gastosACSV, balancesACSV, descargarCSV } from './exportar'

const companeroNombres = { c1: 'Ana', c2: 'Luis' }

const gastos: Gasto[] = [
  {
    id: 1,
    descripcion: 'Copias',
    monto: 30,
    pagadoPorId: 'c1',
    fecha: '2026-04-01',
    tipoDivision: 'igual',
    divisiones: [
      { companeroId: 'c1', valor: 10 },
      { companeroId: 'c2', valor: 10 },
      { companeroId: 'c3', valor: 10 },
    ],
  },
  {
    id: 2,
    descripcion: 'Videobeam',
    monto: 15.5,
    pagadoPorId: 'c2',
    fecha: '2026-04-02',
    tipoDivision: 'exacto',
    divisiones: [
      { companeroId: 'c1', valor: 5 },
      { companeroId: 'c2', valor: 10.5 },
    ],
  },
]

const balances: BalancePersona[] = [
  { companeroId: 'c1', pagado: 30, debe: 15, balance: 15 },
  { companeroId: 'c2', pagado: 15.5, debe: 20.5, balance: -5 },
]

describe('gastosACSV', () => {
  it('genera cabeceras y una fila por gasto', () => {
    const csv = gastosACSV(gastos, companeroNombres)
    const lineas = csv.split('\n')
    expect(lineas[0]).toContain('Fecha')
    expect(lineas[0]).toContain('Descripcion')
    expect(lineas[0]).toContain('Pagado por')
    expect(lineas[0]).toContain('Participantes')
    expect(lineas).toHaveLength(3) // cabecera + 2 gastos
  })

  it('usa los nombres de los compañeros', () => {
    const csv = gastosACSV(gastos, companeroNombres)
    expect(csv).toContain('Ana')
    expect(csv).toContain('Luis')
  })

  it('escapa comillas y comas en la descripcion', () => {
    const raro = { ...gastos[0], descripcion: 'Copia, "apuntes"' } as Gasto
    const csv = gastosACSV([raro], companeroNombres)
    expect(csv).toContain('"Copia, ""apuntes"""')
  })
})

describe('balancesACSV', () => {
  it('genera cabeceras y una fila por balance', () => {
    const csv = balancesACSV(balances)
    const lineas = csv.split('\n')
    expect(lineas[0]).toContain('Companero')
    expect(lineas[0]).toContain('Balance (USD)')
    expect(lineas).toHaveLength(3)
  })

  it('formatea montos con dos decimales', () => {
    const csv = balancesACSV(balances)
    expect(csv).toContain('15.00')
    expect(csv).toContain('-5.00')
  })
})

describe('descargarCSV', () => {
  it('crea un enlace de descarga y lo limpia', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click')
    const append = vi.spyOn(document.body, 'appendChild')
    const remove = vi.spyOn(document.body, 'removeChild')

    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn(() => 'blob:test'),
      configurable: true,
      writable: true,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: vi.fn(),
      configurable: true,
      writable: true,
    })
    try {
      descargarCSV('a,b\n1,2', 'prueba.csv')

      expect(URL.createObjectURL).toHaveBeenCalled()
      expect(URL.revokeObjectURL).toHaveBeenCalled()
      expect(append).toHaveBeenCalled()
      expect(click).toHaveBeenCalled()
      expect(remove).toHaveBeenCalled()
    } finally {
      delete (URL as any).createObjectURL
      delete (URL as any).revokeObjectURL
      click.mockRestore()
      append.mockRestore()
      remove.mockRestore()
    }
  })
})
