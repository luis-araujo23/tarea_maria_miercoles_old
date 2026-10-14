import { obtenerDb, guardarDb } from '../models/db.model.js';

function redondear(monto) {
  return Math.round(Number(monto) * 100) / 100;
}

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

function siguienteId(items) {
  return items.reduce((mayor, item) => Math.max(mayor, Number(item.id) || 0), 0) + 1;
}

export function listarPagos() {
  const db = obtenerDb();
  return db.pagos || [];
}

export function crearPago(datos) {
  const db = obtenerDb();
  const deId = (datos.deId || '').trim();
  const paraId = (datos.paraId || '').trim();
  const monto = Number(datos.monto);

  if (!deId || !paraId) {
    throw { status: 422, message: 'Se debe indicar quién paga y quién recibe' };
  }
  if (deId === paraId) {
    throw { status: 422, message: 'Un compañero no puede pagarse a sí mismo' };
  }
  if (!Number.isFinite(monto) || monto <= 0) {
    throw { status: 422, message: 'El monto del pago debe ser mayor a cero' };
  }

  const pagador = (db.companeros || []).find((c) => c.id === deId);
  const receptor = (db.companeros || []).find((c) => c.id === paraId);
  if (!pagador || !receptor) {
    throw { status: 422, message: 'Los participantes del pago deben existir en el grupo' };
  }

  const nuevoPago = {
    id: siguienteId(db.pagos || []),
    deId,
    paraId,
    monto: redondear(monto),
    fecha: datos.fecha || hoy(),
    nota: (datos.nota || '').trim() || undefined,
    gastoId: datos.gastoId ? Number(datos.gastoId) : undefined,
  };

  db.pagos = [nuevoPago, ...(db.pagos || [])];
  guardarDb(db);
  return nuevoPago;
}

export function eliminarPago(id) {
  const db = obtenerDb();
  const pagoId = Number(id);
  const existe = (db.pagos || []).some((p) => p.id === pagoId);
  if (!existe) throw { status: 404, message: `El pago #${id} no existe` };

  db.pagos = db.pagos.filter((p) => p.id !== pagoId);
  guardarDb(db);
  return { id: pagoId, eliminado: true };
}
