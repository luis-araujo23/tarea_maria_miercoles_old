import * as categoriasService from '../services/categorias.service.js';

export function listarCategorias(req, res) {
  try {
    const categorias = categoriasService.listarCategorias();
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Error al listar categorías' });
  }
}

export function obtenerCategoria(req, res) {
  try {
    const { id } = req.params;
    const cat = categoriasService.obtenerCategoriaPorId(id);
    if (!cat) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json(cat);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Error al obtener categoría' });
  }
}

export function crearCategoria(req, res) {
  try {
    const nueva = categoriasService.crearCategoria(req.body);
    res.status(201).json(nueva);
  } catch (error) {
    res.status(error.status || 422).json({ error: error.message || 'Error al crear categoría' });
  }
}

export function actualizarCategoria(req, res) {
  try {
    const { id } = req.params;
    const actualizada = categoriasService.actualizarCategoria(id, req.body);
    res.json(actualizada);
  } catch (error) {
    res.status(error.status || 422).json({ error: error.message || 'Error al actualizar categoría' });
  }
}

export function eliminarCategoria(req, res) {
  try {
    const { id } = req.params;
    const resultado = categoriasService.eliminarCategoria(id);
    res.json(resultado);
  } catch (error) {
    res.status(error.status || 404).json({ error: error.message || 'Error al eliminar categoría' });
  }
}
