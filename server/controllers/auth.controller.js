import * as authService from '../services/auth.service.js';

export function login(req, res) {
  try {
    const { identificador, clave } = req.body;
    if (!identificador || !clave) {
      return res.status(400).json({ error: 'Debes proporcionar identificador y contraseña' });
    }
    const usuario = authService.login(identificador, clave);
    res.json({ ok: true, usuario });
  } catch (error) {
    res.status(error.status || 401).json({ ok: false, error: error.message || 'Error en autenticación' });
  }
}

export function signup(req, res) {
  try {
    const usuario = authService.signup(req.body);
    res.status(201).json({ ok: true, usuario });
  } catch (error) {
    res.status(error.status || 422).json({
      ok: false,
      error: error.message || 'Error en el registro',
      errores: error.errores || {},
    });
  }
}

export function listarUsuarios(req, res) {
  try {
    const usuarios = authService.listarUsuarios();
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
}
