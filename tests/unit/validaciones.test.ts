import { describe, it, expect } from 'vitest'
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
} from '../../src/utils/validaciones'
import type { Companero, CategoriaMaterial, Producto, DeudaSimplificada } from '../../src/types'

describe('Validaciones de Formularios y Negocio (Frontend)', () => {
  const companerosDemo: Companero[] = [
    { id: 'c1', nombre: 'María' },
    { id: 'c2', nombre: 'Juan' },
    { id: 'c3', nombre: 'Carlos' },
  ]

  const categoriasDemo: CategoriaMaterial[] = [
    { id: 'cat-papeleria', nombre: 'Papelería y copias', icono: '📄', keywords: ['hojas'] },
    { id: 'cat-equipos', nombre: 'Equipos y tecnología', icono: '💻', keywords: ['proyector'] },
  ]

  const productosDemo: Producto[] = [
    { id: 'p-resma', nombre: 'Resma de hojas', precio: 5.5, categoriaId: 'cat-papeleria', icono: '📄' },
  ]

  describe('validarNombreCompanero', () => {
    it('rechaza nombres vacíos o espacios en blanco', () => {
      expect(validarNombreCompanero('')).toBe('Ingresa un nombre')
      expect(validarNombreCompanero('   ')).toBe('Ingresa un nombre')
    })

    it('rechaza nombres de menos de 2 caracteres', () => {
      expect(validarNombreCompanero('A')).toMatch(/al menos 2 caracteres/)
    })

    it('rechaza nombres que superan 50 caracteres', () => {
      expect(validarNombreCompanero('A'.repeat(51))).toMatch(/no puede superar 50 caracteres/)
    })

    it('acepta nombres válidos', () => {
      expect(validarNombreCompanero('Pedro')).toBeNull()
      expect(validarNombreCompanero('Ana Lucía')).toBeNull()
    })
  })

  describe('validarNombrePersona y validarApellido', () => {
    it('rechaza números en nombre y apellido', () => {
      expect(validarNombrePersona('Juan123')).toMatch(/no puede contener numeros/i)
      expect(validarApellido('Perez99')).toMatch(/no puede contener numeros/i)
    })

    it('rechaza nombres demasiado cortos o largos', () => {
      expect(validarNombrePersona('J')).toMatch(/al menos 2 caracteres/i)
      expect(validarApellido('P'.repeat(35))).toMatch(/no puede superar 30 caracteres/i)
    })

    it('acepta nombres con acentos y caracteres especiales válidos', () => {
      expect(validarNombrePersona('María José')).toBeNull()
      expect(validarApellido('González')).toBeNull()
    })
  })

  describe('validarEmail', () => {
    it('rechaza email vacío o con espacios', () => {
      expect(validarEmail('')).toMatch(/Ingresa tu correo/i)
      expect(validarEmail('test @ujap.edu.ve')).toMatch(/no puede contener espacios/i)
    })

    it('rechaza formatos de email inválidos', () => {
      expect(validarEmail('correo-invalido')).toMatch(/correo electronico valido/i)
      expect(validarEmail('estudiante@')).toMatch(/correo electronico valido/i)
      expect(validarEmail('@ujap.edu.ve')).toMatch(/correo electronico valido/i)
    })

    it('acepta emails institucionales válidos', () => {
      expect(validarEmail('estudiante@ujap.edu.ve')).toBeNull()
      expect(validarEmail('maria.garcia@gmail.com')).toBeNull()
    })
  })

  describe('validarContrasena y validarConfirmacionContrasena', () => {
    it('rechaza contraseñas con espacios', () => {
      expect(validarContrasena('clave con espacio')).toMatch(/no puede contener espacios/i)
    })

    it('rechaza contraseñas menores a 8 caracteres', () => {
      expect(validarContrasena('1234567')).toMatch(/al menos 8 caracteres/i)
    })

    it('rechaza contraseñas sin números o sin letras', () => {
      expect(validarContrasena('sololetras')).toMatch(/incluir al menos un numero/i)
      expect(validarContrasena('123456789')).toMatch(/incluir al menos una letra/i)
    })

    it('acepta contraseñas seguras con letras y números', () => {
      expect(validarContrasena('ujap2026segura')).toBeNull()
    })

    it('valida la coincidencia de confirmación de contraseña', () => {
      expect(validarConfirmacionContrasena('ujap2026', 'otraClave')).toMatch(/no coinciden/i)
      expect(validarConfirmacionContrasena('ujap2026', 'ujap2026')).toBeNull()
    })
  })

  describe('validarGasto', () => {
    it('rechaza descripción vacía', () => {
      const payload = {
        descripcion: '   ',
        monto: 20,
        pagadoPorId: 'c1',
        fecha: '2026-10-22',
        tipoDivision: 'igual' as const,
        divisiones: [{ companeroId: 'c1', valor: 20 }],
      }
      expect(validarGasto(payload, companerosDemo)).toMatch(/Ingresa una descripción/i)
    })

    it('rechaza montos menores o iguales a 0 o NaN', () => {
      const payload = {
        descripcion: 'Alquiler',
        monto: -5,
        pagadoPorId: 'c1',
        fecha: '2026-10-22',
        tipoDivision: 'igual' as const,
        divisiones: [{ companeroId: 'c1', valor: 0 }],
      }
      expect(validarGasto(payload, companerosDemo)).toMatch(/monto válido mayor a 0/i)
    })

    it('rechaza pagador no incluido en los participantes', () => {
      const payload = {
        descripcion: 'Copias',
        monto: 10,
        pagadoPorId: 'c1',
        fecha: '2026-10-22',
        tipoDivision: 'igual' as const,
        divisiones: [{ companeroId: 'c2', valor: 10 }],
      }
      expect(validarGasto(payload, companerosDemo)).toMatch(/pagador debe estar incluido/i)
    })

    it('rechaza porcentajes que no suman 100%', () => {
      const payload = {
        descripcion: 'Materiales',
        monto: 100,
        pagadoPorId: 'c1',
        fecha: '2026-10-22',
        tipoDivision: 'porcentaje' as const,
        divisiones: [
          { companeroId: 'c1', valor: 40 },
          { companeroId: 'c2', valor: 30 },
        ],
      }
      expect(validarGasto(payload, companerosDemo)).toMatch(/deben sumar 100%/i)
    })

    it('rechaza montos exactos que no suman el total', () => {
      const payload = {
        descripcion: 'Materiales',
        monto: 50,
        pagadoPorId: 'c1',
        fecha: '2026-10-22',
        tipoDivision: 'exacto' as const,
        divisiones: [
          { companeroId: 'c1', valor: 20 },
          { companeroId: 'c2', valor: 15 },
        ],
      }
      expect(validarGasto(payload, companerosDemo)).toMatch(/deben sumar \$50.00/i)
    })

    it('acepta un gasto correctamente formulado', () => {
      const payload = {
        descripcion: 'Copias de Examen',
        monto: 30,
        pagadoPorId: 'c1',
        fecha: '2026-10-22',
        tipoDivision: 'igual' as const,
        divisiones: [
          { companeroId: 'c1', valor: 10 },
          { companeroId: 'c2', valor: 10 },
          { companeroId: 'c3', valor: 10 },
        ],
      }
      expect(validarGasto(payload, companerosDemo)).toBeNull()
    })
  })

  describe('validarProducto y validarCategoria', () => {
    it('rechaza categoría con nombre repetido', () => {
      const err = validarCategoria(
        { nombre: 'Papelería y copias', icono: '📄', keywords: [] },
        categoriasDemo
      )
      expect(err).toMatch(/Ya existe una categoría/i)
    })

    it('rechaza producto con precio no positivo o categoría inexistente', () => {
      expect(
        validarProducto(
          { nombre: 'Cuaderno', precio: 0, categoriaId: 'cat-papeleria', icono: '📓' },
          categoriasDemo,
          productosDemo
        )
      ).toMatch(/precio válido mayor a 0/i)

      expect(
        validarProducto(
          { nombre: 'Cuaderno', precio: 5, categoriaId: 'inexistente', icono: '📓' },
          categoriasDemo,
          productosDemo
        )
      ).toMatch(/categoría del producto no existe/i)
    })

    it('rechaza producto con nombre repetido', () => {
      expect(
        validarProducto(
          { nombre: 'Resma de hojas', precio: 6, categoriaId: 'cat-papeleria', icono: '📄' },
          categoriasDemo,
          productosDemo
        )
      ).toMatch(/Ya existe un producto/i)
    })
  })

  describe('validarPago y validarPagoDeCompra', () => {
    it('rechaza que pagador y receptor sean la misma persona', () => {
      const deudas: DeudaSimplificada[] = [{ deId: 'c2', paraId: 'c1', monto: 15 }]
      expect(validarPago('c1', 'c1', 10, companerosDemo, deudas)).toMatch(/deben ser distintos/i)
    })

    it('rechaza pago sin deuda pendiente entre esas personas', () => {
      const deudas: DeudaSimplificada[] = [{ deId: 'c2', paraId: 'c1', monto: 15 }]
      expect(validarPago('c3', 'c1', 10, companerosDemo, deudas)).toMatch(/No hay deuda pendiente/i)
    })

    it('rechaza pago superior a la deuda pendiente', () => {
      const deudas: DeudaSimplificada[] = [{ deId: 'c2', paraId: 'c1', monto: 15 }]
      expect(validarPago('c2', 'c1', 25, companerosDemo, deudas)).toMatch(/no puede superar la deuda/i)
    })

    it('rechaza pago de compra que supera lo pendiente', () => {
      expect(validarPagoDeCompra('c2', 'c1', 20, 15, companerosDemo)).toMatch(/no puede superar lo pendiente/i)
      expect(validarPagoDeCompra('c2', 'c1', 10, 15, companerosDemo)).toBeNull()
    })
  })
})
