import { obtenerDb, guardarDb } from '../models/db.model.js';

function siguienteIdCompanero(companeros) {
  const mayor = (companeros || []).reduce((max, c) => {
    const numero = Number.parseInt((c.id || '').replace(/\D/g, ''), 10);
    return Number.isNaN(numero) ? max : Math.max(max, numero);
  }, 0);
  return `c${mayor + 1}`;
}

export function listarCompaneros() {
  const db = obtenerDb();
  return db.companeros || [];
}

export function obtenerCompaneroPorId(id) {
  const db = obtenerDb();
  const c = (db.companeros || []).find((item) => item.id === id);
  return c || null;
}

export function crearCompanero(nombre) {
  const db = obtenerDb();
  const limpio = (nombre || '').trim().replace(/\s+/g, ' ');

  if (!limpio) {
    throw { status: 422, message: 'El nombre del compañero no puede estar vacío' };
  }
  if ((db.companeros || []).some((c) => c.nombre.toLowerCase() === limpio.toLowerCase())) {
    throw { status: 422, message: `${limpio} ya forma parte del grupo` };
  }

  const nuevo = {
    id: siguienteIdCompanero(db.companeros || []),
    nombre: limpio,
  };

  db.companeros = [...(db.companeros || []), nuevo];
  guardarDb(db);
  return nuevo;
}

export function eliminarCompanero(id) {
  const db = obtenerDb();
  const companero = (db.companeros || []).find((c) => c.id === id);
  if (!companero) {
    throw { status: 404, message: 'Ese compañero no se encuentra en el grupo' };
  }

  if ((db.companeros || []).length <= 1) {
    throw { status: 422, message: 'Debe quedar al menos un compañero en el grupo' };
  }

  const gastosLigados = (db.gastos || []).filter(
    (g) => g.pagadoPorId === id || (g.divisiones || []).some((d) => d.companeroId === id),
  ).length;

  const pagosLigados = (db.pagos || []).filter(
    (p) => p.deId === id || p.paraId === id,
  ).length;

  if (gastosLigados > 0 || pagosLigados > 0) {
    const partes = [];
    if (gastosLigados > 0) partes.push(`${gastosLigados} gasto(s)`);
    if (pagosLigados > 0) partes.push(`${pagosLigados} pago(s)`);
    throw {
      status: 422,
      message: `No se puede eliminar a ${companero.nombre}: participa en ${partes.join(' y ')}`,
    };
  }

  db.companeros = db.companeros.filter((c) => c.id !== id);
  guardarDb(db);
  return { id, eliminado: true };
}
