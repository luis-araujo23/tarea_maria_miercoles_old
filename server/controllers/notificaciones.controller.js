import * as notifService from '../services/notificaciones.service.js';

export function listarNotificaciones(req, res) {
  try {
    const lista = notifService.listarNotificaciones();
    res.json(lista);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar notificaciones' });
  }
}

export function crearNotificacion(req, res) {
  try {
    const nueva = notifService.crearNotificacion(req.body);
    res.status(201).json(nueva);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear notificación' });
  }
}

export function marcarLeida(req, res) {
  try {
    const { id } = req.params;
    const actualizada = notifService.marcarLeida(id);
    res.json(actualizada);
  } catch (error) {
    res.status(error.status || 404).json({ error: error.message });
  }
}
