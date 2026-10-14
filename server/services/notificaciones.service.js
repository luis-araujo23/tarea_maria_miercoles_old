import { obtenerDb, guardarDb } from '../models/db.model.js';

export function listarNotificaciones() {
  const db = obtenerDb();
  return db.notificaciones || [];
}

export function crearNotificacion(datos) {
  const db = obtenerDb();
  const nuevaNotificacion = {
    _id: `notif_${Date.now()}`,
    tipo: datos.tipo || 'general',
    leida: false,
    creadaEn: new Date().toISOString(),
    destinatario: datos.destinatario || {},
    contexto: datos.contexto || {},
    evento: datos.evento || {},
    canal: datos.canal || ['in_app'],
    metadatos: datos.metadatos || {},
  };

  db.notificaciones = [nuevaNotificacion, ...(db.notificaciones || [])];
  guardarDb(db);
  return nuevaNotificacion;
}

export function marcarLeida(id) {
  const db = obtenerDb();
  const notif = (db.notificaciones || []).find((n) => n._id === id);
  if (!notif) throw { status: 404, message: 'Notificación no encontrada' };

  notif.leida = true;
  guardarDb(db);
  return notif;
}
