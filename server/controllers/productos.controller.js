import * as productosService from '../services/productos.service.js';

export function listarProductos(req, res) {
  try {
    const productos = productosService.listarProductos();
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Error al listar productos' });
  }
}

export function obtenerProducto(req, res) {
  try {
    const { id } = req.params;
    const producto = productosService.obtenerProductoPorId(id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Error al obtener producto' });
  }
}

export function crearProducto(req, res) {
  try {
    const nuevo = productosService.crearProducto(req.body);
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(error.status || 422).json({ error: error.message || 'Error al crear producto' });
  }
}

export function actualizarProducto(req, res) {
  try {
    const { id } = req.params;
    const actualizado = productosService.actualizarProducto(id, req.body);
    res.json(actualizado);
  } catch (error) {
    res.status(error.status || 422).json({ error: error.message || 'Error al actualizar producto' });
  }
}

export function eliminarProducto(req, res) {
  try {
    const { id } = req.params;
    const resultado = productosService.eliminarProducto(id);
    res.json(resultado);
  } catch (error) {
    res.status(error.status || 404).json({ error: error.message || 'Error al eliminar producto' });
  }
}
