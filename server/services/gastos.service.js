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

export function listarGastos() {
  const db = obtenerDb();
  return db.gastos || [];
}

export function obtenerGastoPorId(id) {
  const db = obtenerDb();
  const gastoId = Number(id);
  const gasto = (db.gastos || []).find((g) => g.id === gastoId);
  return gasto || null;
}

export function crearGasto(datos) {
  const db = obtenerDb();
  const descripcion = (datos.descripcion || '').trim();
  const monto = Number(datos.monto);
  const pagadoPorId = (datos.pagadoPorId || '').trim();

  if (!descripcion) {
    throw { status: 422, message: 'La descripción del gasto es obligatoria' };
  }
  if (!Number.isFinite(monto) || monto <= 0) {
    throw { status: 422, message: 'El monto debe ser un número positivo' };
  }
  if (!pagadoPorId || !db.companeros.some((c) => c.id === pagadoPorId)) {
    throw { status: 422, message: 'Debes indicar quién pagó el gasto con un compañero válido' };
  }

  let divisiones = datos.divisiones;
  if (!Array.isArray(divisiones) || divisiones.length === 0) {
    // Si no se enviaron divisiones, se divide equitativamente entre todos los compañeros del grupo
    const n = db.companeros.length || 1;
    const cuota = redondear(monto / n);
    divisiones = db.companeros.map((c) => ({ companeroId: c.id, valor: cuota }));
  }

  const nuevoGasto = {
    id: siguienteId(db.gastos || []),
    descripcion,
    monto: redondear(monto),
    pagadoPorId,
    fecha: datos.fecha || hoy(),
    tipoDivision: datos.tipoDivision || 'igual',
    divisiones,
    productoId: datos.productoId || undefined,
  };

  db.gastos = [nuevoGasto, ...(db.gastos || [])];
  guardarDb(db);
  return nuevoGasto;
}

export function crearCompra(datos) {
  const db = obtenerDb();
  const { productoId, pagadoPorId, participanteIds } = datos;

  const producto = (db.productos || []).find((p) => p.id === productoId);
  if (!producto) {
    throw { status: 404, message: 'El producto seleccionado no existe en el catálogo' };
  }

  const pagador = (db.companeros || []).find((c) => c.id === pagadoPorId);
  if (!pagador) {
    throw { status: 422, message: 'El compañero que pagó no pertenece al grupo' };
  }

  const participantes = Array.isArray(participanteIds) && participanteIds.length > 0
    ? [...new Set(participanteIds)]
    : [pagadoPorId];

  const cuota = redondear(producto.precio / participantes.length);
  const divisiones = participantes.map((cId) => ({ companeroId: cId, valor: cuota }));

  const nuevoGasto = {
    id: siguienteId(db.gastos || []),
    descripcion: producto.nombre,
    monto: redondear(producto.precio),
    pagadoPorId,
    fecha: hoy(),
    tipoDivision: 'igual',
    divisiones,
    productoId: producto.id,
  };

  db.gastos = [nuevoGasto, ...(db.gastos || [])];
  guardarDb(db);
  return nuevoGasto;
}

export function actualizarGasto(id, datos) {
  const db = obtenerDb();
  const gastoId = Number(id);
  const indice = (db.gastos || []).findIndex((g) => g.id === gastoId);

  if (indice < 0) {
    throw { status: 404, message: `El gasto #${id} no existe en el sistema` };
  }

  const descripcion = (datos.descripcion || '').trim();
  const monto = Number(datos.monto);
  const pagadoPorId = (datos.pagadoPorId || '').trim();

  if (!descripcion) {
    throw { status: 422, message: 'La descripción del gasto no puede estar vacía' };
  }
  if (!Number.isFinite(monto) || monto <= 0) {
    throw { status: 422, message: 'El monto debe ser un valor positivo' };
  }
  if (!pagadoPorId || !db.companeros.some((c) => c.id === pagadoPorId)) {
    throw { status: 422, message: 'El compañero que pagó no es válido' };
  }

  const gastoActualizado = {
    ...db.gastos[indice],
    ...datos,
    id: gastoId,
    descripcion,
    monto: redondear(monto),
    pagadoPorId,
  };

  db.gastos[indice] = gastoActualizado;
  guardarDb(db);
  return gastoActualizado;
}

export function eliminarGasto(id) {
  const db = obtenerDb();
  const gastoId = Number(id);
  const gasto = (db.gastos || []).find((g) => g.id === gastoId);

  if (!gasto) {
    throw { status: 404, message: `El gasto #${id} no existe` };
  }

  // VALIDACIÓN: Cuando exista una compra, no se puede eliminar hasta que los demás
  // usuarios que estén en la compra cancelen su parte.
  const participantes = gasto.divisiones || [];
  const cuotaIgual = (gasto.tipoDivision === 'igual' && participantes.length > 0)
    ? (gasto.monto / participantes.length)
    : 0;

  const tieneDeudasPendientes = participantes.some((d) => {
    // El comprador pagó al contado al comprarla
    if (d.companeroId === gasto.pagadoPorId) return false;
    const cuota = gasto.tipoDivision === 'igual' ? cuotaIgual : d.valor;
    const pagado = (db.pagos || [])
      .filter((p) => p.gastoId === gastoId && p.deId === d.companeroId)
      .reduce((acc, p) => acc + p.monto, 0);
    return (cuota - pagado) > 0.009;
  });

  if (tieneDeudasPendientes) {
    throw {
      status: 422,
      message: 'No se puede eliminar esta compra hasta que los demás usuarios cancelen su parte.',
    };
  }

  // Al eliminar la compra saldada, se eliminan también los pagos asociados para no dejar
  // saldos huérfanos ni deudas fantasma en el sistema.
  db.gastos = db.gastos.filter((g) => g.id !== gastoId);
  db.pagos = (db.pagos || []).filter((p) => p.gastoId !== gastoId);
  guardarDb(db);
  return { id: gastoId, eliminado: true };
}

export function vaciarGastos() {
  const db = obtenerDb();

  // Validar si hay compras con participantes que aún deben su cuota
  const tienePendientes = (db.gastos || []).some((gasto) => {
    const participantes = gasto.divisiones || [];
    const cuotaIgual = (gasto.tipoDivision === 'igual' && participantes.length > 0)
      ? (gasto.monto / participantes.length)
      : 0;
    return participantes.some((d) => {
      if (d.companeroId === gasto.pagadoPorId) return false;
      const cuota = gasto.tipoDivision === 'igual' ? cuotaIgual : d.valor;
      const pagado = (db.pagos || [])
        .filter((p) => p.gastoId === gasto.id && p.deId === d.companeroId)
        .reduce((acc, p) => acc + p.monto, 0);
      return (cuota - pagado) > 0.009;
    });
  });

  if (tienePendientes) {
    throw {
      status: 422,
      message: 'No se pueden limpiar los gastos porque existen compras con pagos pendientes. Todos deben cancelar su parte primero.',
    };
  }

  db.gastos = [];
  db.pagos = [];
  guardarDb(db);
  return { eliminados: true, total: 0 };
}
