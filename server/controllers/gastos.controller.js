import * as gastosService from '../services/gastos.service.js';

/**
 * Controlador de Gastos
 * Recibe peticiones HTTP, delega la lógica al servicio y responde con JSON y códigos de estado.
 */

export function listarGastos(req, res) {
  try {
    const gastos = gastosService.listarGastos();
    res.json(gastos);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Error al listar los gastos' });
  }
}

export function obtenerGasto(req, res) {
  try {
    const { id } = req.params;
    const gasto = gastosService.obtenerGastoPorId(id);
    if (!gasto) {
      return res.status(404).json({ error: `Gasto con ID ${id} no encontrado` });
    }
    res.json(gasto);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Error al obtener el gasto' });
  }
}

export function crearGasto(req, res) {
  try {
    const nuevoGasto = gastosService.crearGasto(req.body);
    res.status(201).json(nuevoGasto);
  } catch (error) {
    res.status(error.status || 422).json({ error: error.message || 'Error al crear el gasto' });
  }
}

export function crearCompra(req, res) {
  try {
    const nuevoGasto = gastosService.crearCompra(req.body);
    res.status(201).json(nuevoGasto);
  } catch (error) {
    res.status(error.status || 422).json({ error: error.message || 'Error al registrar la compra' });
  }
}

export function actualizarGasto(req, res) {
  try {
    const { id } = req.params;
    const gastoActualizado = gastosService.actualizarGasto(id, req.body);
    res.json(gastoActualizado);
  } catch (error) {
    res.status(error.status || 422).json({ error: error.message || 'Error al actualizar el gasto' });
  }
}

export function eliminarGasto(req, res) {
  try {
    const { id } = req.params;
    const resultado = gastosService.eliminarGasto(id);
    res.json(resultado);
  } catch (error) {
    res.status(error.status || 404).json({ error: error.message || 'Error al eliminar el gasto' });
  }
}

export function vaciarGastos(req, res) {
  try {
    const resultado = gastosService.vaciarGastos();
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Error al vaciar los gastos' });
  }
}
