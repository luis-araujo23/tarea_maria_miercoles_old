import { Router } from 'express';
import {
  obtenerEstado,
  restaurarEstado,
} from '../controllers/estado.controller.js';

const router = Router();

router.get('/', obtenerEstado);
router.post('/restaurar', restaurarEstado);

export default router;
