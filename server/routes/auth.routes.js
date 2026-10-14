import { Router } from 'express';
import {
  login,
  signup,
  listarUsuarios,
} from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', login);
router.post('/signup', signup);
router.get('/usuarios', listarUsuarios);

export default router;
