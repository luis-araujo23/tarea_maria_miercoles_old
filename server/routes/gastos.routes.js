import { Router } from 'express';
import {
  listarGastos,
  obtenerGasto,
  crearGasto,
  actualizarGasto,
  eliminarGasto,
  crearCompra,
  vaciarGastos,
} from '../controllers/gastos.controller.js';

const router = Router();

/**
 * ============================================================================
 * PATRONES DE DISEÑO: Las 5 rutas de un CRUD completo (Slide 13 Entrega 3)
 * Entidad principal: Gastos
 * ============================================================================
 */

router.get('/', listarGastos);             // 1. Read (todos)
router.get('/:id', obtenerGasto);          // 2. Read (uno)
router.post('/', crearGasto);              // 3. Create
router.put('/:id', actualizarGasto);       // 4. Update
router.delete('/:id', eliminarGasto);      // 5. Delete

// Rutas auxiliares de negocio
router.post('/compra', crearCompra);       // Registro de gasto proveniente de compra de producto
router.delete('/', vaciarGastos);          // Limpieza de gastos

export default router;
