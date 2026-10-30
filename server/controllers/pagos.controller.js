import * as pagosService from '../services/pagos.service.js';

export function listarPagos(req, res) {
  try {
    const pagos = pagosService.listarPagos();
    res.json(pagos);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Error al listar pagos' });
  }
}

export function crearPago(req, res) {
  try {
    const nuevoPago = pagosService.crearPago(req.body);
    res.status(201).json(nuevoPago);
  } catch (error) {
    res.status(error.status || 422).json({ error: error.message || 'Error al registrar pago' });
  }
}

export function eliminarPago(req, res) {
  try {
    const { id } = req.params;
    const resultado = pagosService.eliminarPago(id);
    res.json(resultado);
  } catch (error) {
    res.status(error.status || 404).json({ error: error.message || 'Error al eliminar pago' });
  }
}
