import * as estadoService from '../services/estado.service.js';

export function obtenerEstado(req, res) {
  try {
    const estado = estadoService.obtenerEstadoCompleto();
    res.json(estado);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el estado del sistema' });
  }
}

export function restaurarEstado(req, res) {
  try {
    const estado = estadoService.restaurarEstadoOriginal();
    res.json({ ok: true, mensaje: 'Estado restaurado con éxito a valores semilla', estado });
  } catch (error) {
    res.status(500).json({ error: 'Error al restaurar estado original' });
  }
}
