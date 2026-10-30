import { Router } from 'express';
import {
  listarPagos,
  crearPago,
  eliminarPago,
} from '../controllers/pagos.controller.js';

const router = Router();

router.get('/', listarPagos);
router.post('/', crearPago);
router.delete('/:id', eliminarPago);

export default router;
