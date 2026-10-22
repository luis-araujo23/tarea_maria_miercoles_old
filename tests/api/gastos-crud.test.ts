import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
// @ts-expect-error Servidor Express en JS
import app from '../../server/app.js'
// @ts-expect-error Modelo DB en JS
import { restaurarDb } from '../../server/models/db.model.js'

describe('API REST — 5 Operaciones CRUD y Endpoints Express (Entrega 3)', () => {
  beforeAll(() => {
    restaurarDb()
  })

  // 1. Health check y conectividad
  it('GET /api/health responde 200 con estado operativo del backend', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('status', 'ok')
    expect(res.body).toHaveProperty('mensaje')
  })

  // 2. CRUD 1: Read all (GET /api/gastos)
  it('1. GET /api/gastos lista todos los gastos registrados', async () => {
    const res = await request(app).get('/api/gastos')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  // 3. CRUD 2: Create (POST /api/gastos)
  let nuevoGastoId: number

  it('2. POST /api/gastos crea un nuevo gasto con cálculo de cuotas (Create)', async () => {
    const payload = {
      descripcion: 'Fotocopias de Guía de Algoritmos',
      monto: 15.0,
      pagadoPorId: 'c1',
      tipoDivision: 'igual',
      divisiones: [
        { companeroId: 'c1', valor: 15.0 }, // Compra individual para permitir borrado directo en test CRUD
      ],
    }

    const res = await request(app)
      .post('/api/gastos')
      .send(payload)
      .set('Content-Type', 'application/json')

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.descripcion).toBe(payload.descripcion)
    expect(res.body.monto).toBe(15.0)
    nuevoGastoId = res.body.id
  })

  // 4. CRUD 3: Read one (GET /api/gastos/:id)
  it('3. GET /api/gastos/:id obtiene el detalle de un gasto específico (Read one)', async () => {
    const res = await request(app).get(`/api/gastos/${nuevoGastoId}`)
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(nuevoGastoId)
    expect(res.body.descripcion).toBe('Fotocopias de Guía de Algoritmos')
  })

  // 5. CRUD 4: Update (PUT /api/gastos/:id)
  it('4. PUT /api/gastos/:id actualiza un gasto existente (Update)', async () => {
    const payloadActualizado = {
      descripcion: 'Fotocopias y Anillado de Guía',
      monto: 18.0,
      pagadoPorId: 'c1',
    }

    const res = await request(app)
      .put(`/api/gastos/${nuevoGastoId}`)
      .send(payloadActualizado)
      .set('Content-Type', 'application/json')

    expect(res.status).toBe(200)
    expect(res.body.descripcion).toBe('Fotocopias y Anillado de Guía')
    expect(res.body.monto).toBe(18.0)
  })

  // 6. CRUD 5: Delete (DELETE /api/gastos/:id)
  it('5. DELETE /api/gastos/:id elimina el gasto saldado (Delete)', async () => {
    const res = await request(app).delete(`/api/gastos/${nuevoGastoId}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('eliminado', true)

    // Verificar que ya no existe (404)
    const resVerificacion = await request(app).get(`/api/gastos/${nuevoGastoId}`)
    expect(resVerificacion.status).toBe(404)
  })

  // 7. Validaciones del Service (Status 422)
  it('POST /api/gastos rechaza petición con descripción vacía (422)', async () => {
    const res = await request(app)
      .post('/api/gastos')
      .send({ descripcion: '', monto: 20, pagadoPorId: 'c1' })

    expect(res.status).toBe(422)
    expect(res.body).toHaveProperty('error')
  })

  it('POST /api/gastos rechaza petición con monto negativo o cero (422)', async () => {
    const res = await request(app)
      .post('/api/gastos')
      .send({ descripcion: 'Test', monto: -10, pagadoPorId: 'c1' })

    expect(res.status).toBe(422)
    expect(res.body).toHaveProperty('error')
  })

  it('POST /api/gastos rechaza pagador inválido (422)', async () => {
    const res = await request(app)
      .post('/api/gastos')
      .send({ descripcion: 'Test', monto: 20, pagadoPorId: 'no_existe' })

    expect(res.status).toBe(422)
    expect(res.body).toHaveProperty('error')
  })

  // 8. Módulos complementarios de la API
  it('GET /api/companeros devuelve la lista de participantes', async () => {
    const res = await request(app).get('/api/companeros')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)
  })

  it('GET /api/categorias devuelve las categorías de materiales', async () => {
    const res = await request(app).get('/api/categorias')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('GET /api/productos devuelve el catálogo de productos', async () => {
    const res = await request(app).get('/api/productos')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('GET /api/notificaciones devuelve los documentos de eventos NoSQL', async () => {
    const res = await request(app).get('/api/notificaciones')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})
