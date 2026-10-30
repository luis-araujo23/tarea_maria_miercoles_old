import * as companerosService from '../services/companeros.service.js';

export function listarCompaneros(req, res) {
  try {
    const lista = companerosService.listarCompaneros();
    res.json(lista);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Error al listar compañeros' });
  }
}

export function obtenerCompanero(req, res) {
  try {
    const { id } = req.params;
    const c = companerosService.obtenerCompaneroPorId(id);
    if (!c) return res.status(404).json({ error: 'Compañero no encontrado' });
    res.json(c);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Error al obtener compañero' });
  }
}

export function crearCompanero(req, res) {
  try {
    const { nombre } = req.body;
    const nuevo = companerosService.crearCompanero(nombre);
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(error.status || 422).json({ error: error.message || 'Error al registrar compañero' });
  }
}

export function eliminarCompanero(req, res) {
  try {
    const { id } = req.params;
    const resultado = companerosService.eliminarCompanero(id);
    res.json(resultado);
  } catch (error) {
    res.status(error.status || 404).json({ error: error.message || 'Error al eliminar compañero' });
  }
}
