import { Router } from 'express';
import gastosRoutes from './gastos.routes.js';
import productosRoutes from './productos.routes.js';
import categoriasRoutes from './categorias.routes.js';
import companerosRoutes from './companeros.routes.js';
import pagosRoutes from './pagos.routes.js';
import authRoutes from './auth.routes.js';
import notificacionesRoutes from './notificaciones.routes.js';
import estadoRoutes from './estado.routes.js';

const router = Router();

// Módulos de la API REST
router.use('/gastos', gastosRoutes);
router.use('/productos', productosRoutes);
router.use('/categorias', categoriasRoutes);
router.use('/companeros', companerosRoutes);
router.use('/pagos', pagosRoutes);
router.use('/auth', authRoutes);
router.use('/notificaciones', notificacionesRoutes);
router.use('/estado', estadoRoutes);

// Endpoint de compra directa
import { crearCompra } from '../controllers/gastos.controller.js';
router.post('/compras', crearCompra);

// Health check para verificación de conectividad desde otras PCs
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mensaje: 'Backend UJAP Split (Express MVC) operativo',
    clienteIp: req.ip,
    servidorHora: new Date().toISOString(),
  });
});

export default router;
