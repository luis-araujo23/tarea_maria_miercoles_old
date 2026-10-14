import { obtenerDb, guardarDb } from '../models/db.model.js';

function normalizarId(nombre) {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function listarCategorias() {
  const db = obtenerDb();
  return db.categorias || [];
}

export function obtenerCategoriaPorId(id) {
  const db = obtenerDb();
  const categoria = (db.categorias || []).find((c) => c.id === id);
  return categoria || null;
}

export function crearCategoria(datos) {
  const db = obtenerDb();
  const nombre = (datos.nombre || '').trim();
  const icono = (datos.icono || '📁').trim();
  const keywords = Array.isArray(datos.keywords)
    ? [...new Set(datos.keywords.map((k) => String(k).trim().toLowerCase()).filter(Boolean))]
    : [];

  if (!nombre) throw { status: 422, message: 'El nombre de la categoría es obligatorio' };

  const id = datos.id || normalizarId(nombre);
  if (!id) throw { status: 422, message: 'El identificador de categoría no es válido' };
  if (db.categorias.some((c) => c.id === id)) {
    throw { status: 422, message: `Ya existe una categoría llamada "${nombre}"` };
  }

  const nuevaCategoria = { id, nombre, icono, keywords };
  db.categorias = [...(db.categorias || []), nuevaCategoria];
  guardarDb(db);
  return nuevaCategoria;
}

export function actualizarCategoria(id, datos) {
  const db = obtenerDb();
  const indice = (db.categorias || []).findIndex((c) => c.id === id);
  if (indice < 0) throw { status: 404, message: `La categoría #${id} no existe` };

  const nombre = (datos.nombre || '').trim();
  if (!nombre) throw { status: 422, message: 'El nombre no puede estar vacío' };

  const keywords = Array.isArray(datos.keywords)
    ? [...new Set(datos.keywords.map((k) => String(k).trim().toLowerCase()).filter(Boolean))]
    : db.categorias[indice].keywords;

  const categoriaActualizada = {
    ...db.categorias[indice],
    ...datos,
    id,
    nombre,
    icono: datos.icono || db.categorias[indice].icono,
    keywords,
  };

  db.categorias[indice] = categoriaActualizada;
  guardarDb(db);
  return categoriaActualizada;
}

export function eliminarCategoria(id) {
  const db = obtenerDb();
  const existe = (db.categorias || []).some((c) => c.id === id);
  if (!existe) throw { status: 404, message: `La categoría #${id} no existe` };

  const productosAsociados = (db.productos || []).filter((p) => p.categoriaId === id).length;
  if (productosAsociados > 0) {
    throw { status: 422, message: `No se puede eliminar la categoría: tiene ${productosAsociados} producto(s) asociado(s)` };
  }

  db.categorias = db.categorias.filter((c) => c.id !== id);
  guardarDb(db);
  return { id, eliminado: true };
}
