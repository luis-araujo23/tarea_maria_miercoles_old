import { describe, it, expect } from 'vitest'
import type { Companero, CategoriaMaterial, Producto, Gasto } from '../types'
import {
  validarNombreCompanero,
  validarNombrePersona,
  validarApellido,
  validarEmail,
  validarContrasena,
  validarConfirmacionContrasena,
  validarGasto,
  validarCategoria,
  validarProducto,
  validarCompra,
  validarPago,
  validarPagoDeCompra,
} from './validaciones'
import { divisionIgual } from './balances'

const companeros: Companero[] = [
  { id: 'c1', nombre: 'Ana' },
  { id: 'c2', nombre: 'Luis' },
]

function gastoValido(overrides: Partial<Omit<Gasto, 'id'>> = {}): Omit<Gasto, 'id'> {
  return {
    descripcion: 'Copias',
    monto: 30,
    pagadoPorId: 'c1',
    fecha: '2026-04-01',
    tipoDivision: 'igual',
    divisiones: divisionIgual(['c1', 'c2']),
    ...overrides,
  }
}

describe('validarNombreCompanero', () => {
  it('acepta un nombre válido', () => {
    expect(validarNombreCompanero('Ana')).toBeNull()
  })

  it('rechaza nombre vacío o muy corto', () => {
    expect(validarNombreCompanero('')).toBe('Ingresa un nombre')
    expect(validarNombreCompanero('A')).toContain('al menos 2 caracteres')
  })
})

describe('validarNombrePersona y validarApellido', () => {
  it('aceptan nombres con letras y espacios', () => {
    expect(validarNombrePersona('Maria Jose')).toBeNull()
    expect(validarApellido('Pérez-García')).toBeNull()
  })

  it('rechazan números', () => {
    expect(validarNombrePersona('Ana2')).toContain('numeros')
    expect(validarApellido('Garcia1')).toContain('numeros')
  })
})

describe('validarEmail', () => {
  it('acepta correos válidos', () => {
    expect(validarEmail('ana@ujap.edu.ve')).toBeNull()
  })

  it('rechaza correos inválidos o con espacios', () => {
    expect(validarEmail('no-es-correo')).toBe('Ingresa un correo electronico valido')
    expect(validarEmail('ana @ujap.edu.ve')).toBe('El correo no puede contener espacios')
  })
})

describe('validarContrasena', () => {
  it('acepta contraseñas con letra y número, 8+ caracteres', () => {
    expect(validarContrasena('Clave123')).toBeNull()
  })

  it('rechaza contraseñas débiles', () => {
    expect(validarContrasena('corta')).toContain('al menos 8 caracteres')
    expect(validarContrasena('SoloLetras')).toContain('numero')
    expect(validarContrasena('12345678')).toContain('una letra')
  })
})

describe('validarConfirmacionContrasena', () => {
  it('valida que coincidan', () => {
    expect(validarConfirmacionContrasena('Clave123', 'Clave123')).toBeNull()
    expect(validarConfirmacionContrasena('Clave123', 'Otra')).toBe('Las contrasenas no coinciden')
  })
})

describe('validarGasto', () => {
  it('acepta un gasto válido', () => {
    expect(validarGasto(gastoValido(), companeros)).toBeNull()
  })

  it('rechaza monto inválido', () => {
    expect(validarGasto(gastoValido({ monto: 0 }), companeros)).toContain('mayor a 0')
  })

  it('rechaza si el pagador no es participante', () => {
    expect(
      validarGasto(gastoValido({ pagadoPorId: 'c9' }), companeros),
    ).toContain('El pagador no existe en el grupo')
  })
})

describe('validarCategoria', () => {
  const categorias: CategoriaMaterial[] = [
    { id: 'cat1', nombre: 'Utiles', icono: '📓', keywords: [] },
  ]

  it('acepta una categoría válida', () => {
    expect(validarCategoria({ nombre: 'Libros', icono: '📚', keywords: ['texto'] }, categorias)).toBeNull()
  })

  it('rechaza nombre duplicado', () => {
    expect(
      validarCategoria({ nombre: 'Utiles', icono: '📓', keywords: [] }, categorias),
    ).toContain('Ya existe una categoría llamada')
  })
})

describe('validarProducto', () => {
  const categorias: CategoriaMaterial[] = [
    { id: 'cat1', nombre: 'Utiles', icono: '📓', keywords: [] },
  ]
  const productos: Producto[] = [
    { id: 'p1', nombre: 'Cuaderno', precio: 5, categoriaId: 'cat1', icono: '📓' },
  ]

  it('acepta un producto válido', () => {
    expect(
      validarProducto({ nombre: 'Lapiz', precio: 2, categoriaId: 'cat1', icono: '✏️' }, categorias, productos),
    ).toBeNull()
  })

  it('rechaza precio inválido y categoría inexistente', () => {
    expect(
      validarProducto({ nombre: 'Lapiz', precio: 0, categoriaId: 'cat1', icono: '✏️' }, categorias, productos),
    ).toContain('mayor a 0')
    expect(
      validarProducto({ nombre: 'Lapiz', precio: 2, categoriaId: 'cat9', icono: '✏️' }, categorias, productos),
    ).toContain('no existe')
  })
})

describe('validarCompra', () => {
  const productos: Producto[] = [
    { id: 'p1', nombre: 'Cuaderno', precio: 5, categoriaId: 'cat1', icono: '📓' },
  ]

  it('acepta una compra válida', () => {
    expect(validarCompra('p1', 'c1', ['c1', 'c2'], productos, companeros)).toBeNull()
  })

  it('rechaza si el pagador no participa', () => {
    expect(validarCompra('p1', 'c1', ['c2'], productos, companeros)).toContain('incluirte')
  })
})

describe('validarPago', () => {
  const deudas = [{ deId: 'c2', paraId: 'c1', monto: 10 }]

  it('acepta un pago dentro de la deuda', () => {
    expect(validarPago('c2', 'c1', 5, companeros, deudas)).toBeNull()
  })

  it('rechaza pagarse a sí mismo y montos mayores a la deuda', () => {
    expect(validarPago('c1', 'c1', 5, companeros, deudas)).toContain('distintos')
    expect(validarPago('c2', 'c1', 15, companeros, deudas)).toContain('no puede superar')
  })
})

describe('validarPagoDeCompra', () => {
  it('acepta un pago dentro de lo pendiente', () => {
    expect(validarPagoDeCompra('c2', 'c1', 5, 10, companeros)).toBeNull()
  })

  it('rechaza cuando no hay pendiente o se pasa del monto', () => {
    expect(validarPagoDeCompra('c2', 'c1', 1, 0, companeros)).toContain('saldada')
    expect(validarPagoDeCompra('c2', 'c1', 15, 10, companeros)).toContain('no puede superar')
  })
})
