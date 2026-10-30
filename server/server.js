import os from 'node:os';
import dotenv from 'dotenv';
import app from './app.js';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0'; // Escucha en todas las interfaces para permitir acceso desde otras PCs

function obtenerIpsLocales() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const nombre of Object.keys(interfaces)) {
    for (const iface of interfaces[nombre] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

const server = app.listen(PORT, HOST, () => {
  const ips = obtenerIpsLocales();
  console.log('\n======================================================');
  console.log('🚀 SERVIDOR EXPRESS — UJAP SPLIT (Entrega 3: Patrón MVC)');
  console.log('======================================================');
  console.log(`📡 Local:    http://localhost:${PORT}`);
  if (ips.length > 0) {
    ips.forEach((ip) => {
      console.log(`🌐 Red LAN:  http://${ip}:${PORT} (Acceso desde otra PC/móvil)`);
    });
  }
  console.log(`📦 API Base: http://localhost:${PORT}/api/`);
  console.log(`📋 Health:   http://localhost:${PORT}/api/health`);
  console.log('======================================================\n');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`ℹ️ El puerto ${PORT} ya está en uso por otra instancia del servidor.`);
  } else {
    console.error('Error al iniciar el servidor Express:', err);
  }
});
