import express from 'express';
import cors from 'cors';
import apiRouter from './routes/index.js';

const app = express();

/**
 * ============================================================================
 * CONFIGURACIÓN DE CORS (Slide 10 Entrega 3)
 * "Su frontend corre en un puerto (ej: localhost:5173) y su backend en otro
 * (ej: localhost:3000). El navegador bloquea peticiones entre 'orígenes'
 * distintos si el servidor no lo autoriza explícitamente."
 * ============================================================================
 */
app.use(cors());

// Parseo de cuerpos JSON
app.use(express.json());

// Registro de peticiones en consola (útil para ver peticiones desde otras PCs)
app.use((req, res, next) => {
  const ahora = new Date().toLocaleTimeString();
  console.log(`[${ahora}] ${req.method} ${req.originalUrl} - desde: ${req.ip}`);
  next();
});

// Rutas de la API bajo prefijo /api
app.use('/api', apiRouter);

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// Manejo centralizado de excepciones
app.use((err, req, res, _next) => {
  console.error('Error no controlado en Express:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Error interno del servidor',
    errores: err.errores || undefined,
  });
});

export default app;
