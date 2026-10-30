import { obtenerDb, restaurarDb } from '../models/db.model.js';

export function obtenerEstadoCompleto() {
  const db = obtenerDb();
  return {
    companeros: db.companeros || [],
    gastos: db.gastos || [],
    pagos: db.pagos || [],
    categorias: db.categorias || [],
    productos: db.productos || [],
  };
}

export function restaurarEstadoOriginal() {
  const restaurado = restaurarDb();
  return {
    companeros: restaurado.companeros || [],
    gastos: restaurado.gastos || [],
    pagos: restaurado.pagos || [],
    categorias: restaurado.categorias || [],
    productos: restaurado.productos || [],
  };
}
