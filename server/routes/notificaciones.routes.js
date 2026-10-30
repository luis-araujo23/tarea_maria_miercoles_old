import { Router } from 'express';
import {
  listarNotificaciones,
  crearNotificacion,
  marcarLeida,
} from '../controllers/notificaciones.controller.js';

const router = Router();

router.get('/', listarNotificaciones);
router.post('/', crearNotificacion);
router.put('/:id/leida', marcarLeida);

export default router;
