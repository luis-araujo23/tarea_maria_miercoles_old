import { Router } from 'express';
import {
  listarCompaneros,
  obtenerCompanero,
  crearCompanero,
  eliminarCompanero,
} from '../controllers/companeros.controller.js';

const router = Router();

router.get('/', listarCompaneros);
router.get('/:id', obtenerCompanero);
router.post('/', crearCompanero);
router.delete('/:id', eliminarCompanero);

export default router;
