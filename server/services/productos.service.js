import { obtenerDb, guardarDb } from '../models/db.model.js';

function normalizarId(nombre) {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function listarProductos() {
  const db = obtenerDb();
  return db.productos || [];
}

export function obtenerProductoPorId(id) {
  const db = obtenerDb();
  const producto = (db.productos || []).find((p) => p.id === id);
  return producto || null;
}

export function crearProducto(datos) {
  const db = obtenerDb();
  const nombre = (datos.nombre || '').trim();
  const precio = Number(datos.precio);
  const categoriaId = (datos.categoriaId || '').trim();
  const icono = (datos.icono || '📦').trim();

  if (!nombre) throw { status: 422, message: 'El nombre del producto es obligatorio' };
  if (!Number.isFinite(precio) || precio <= 0) throw { status: 422, message: 'El precio debe ser un número mayor a cero' };
  if (!categoriaId || !db.categorias.some((c) => c.id === categoriaId)) {
    throw { status: 422, message: 'La categoría especificada no existe' };
  }

  const nuevoId = datos.id || `p-${normalizarId(nombre) || Date.now()}`;
  if (db.productos.some((p) => p.id === nuevoId)) {
    throw { status: 422, message: `Ya existe un producto con el nombre "${nombre}"` };
  }

  const nuevoProducto = {
    id: nuevoId,
    nombre,
    precio: Math.round(precio * 100) / 100,
    categoriaId,
    icono,
  };

  db.productos = [...(db.productos || []), nuevoProducto];
  guardarDb(db);
  return nuevoProducto;
}

export function actualizarProducto(id, datos) {
  const db = obtenerDb();
  const indice = (db.productos || []).findIndex((p) => p.id === id);
  if (indice < 0) {
    throw { status: 404, message: `El producto #${id} no existe` };
  }

  const nombre = (datos.nombre || '').trim();
  const precio = Number(datos.precio);
  const categoriaId = (datos.categoriaId || '').trim();

  if (!nombre) throw { status: 422, message: 'El nombre del producto no puede estar vacío' };
  if (!Number.isFinite(precio) || precio <= 0) throw { status: 422, message: 'El precio debe ser mayor a cero' };
  if (!categoriaId || !db.categorias.some((c) => c.id === categoriaId)) {
    throw { status: 422, message: 'La categoría no existe' };
  }

  const productoActualizado = {
    ...db.productos[indice],
    ...datos,
    id,
    nombre,
    precio: Math.round(precio * 100) / 100,
    categoriaId,
    icono: datos.icono || db.productos[indice].icono,
  };

  db.productos[indice] = productoActualizado;
  guardarDb(db);
  return productoActualizado;
}

export function eliminarProducto(id) {
  const db = obtenerDb();
  const existe = (db.productos || []).some((p) => p.id === id);
  if (!existe) throw { status: 404, message: `El producto #${id} no existe` };

  db.productos = db.productos.filter((p) => p.id !== id);
  guardarDb(db);
  return { id, eliminado: true };
}
