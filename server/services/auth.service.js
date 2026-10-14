import { obtenerDb, guardarDb } from '../models/db.model.js';

function normalizar(texto) {
  return (texto || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function login(identificador, clave) {
  const db = obtenerDb();
  const idNorm = normalizar(identificador);
  const emailNorm = (identificador || '').trim().toLowerCase();

  const usuario = (db.usuarios || []).find((u) => {
    const uNombre = normalizar(u.nombre);
    const uNombreCompleto = normalizar(`${u.nombre} ${u.apellido || ''}`.trim());
    const uEmail = (u.email || '').trim().toLowerCase();

    return (uNombre === idNorm || uNombreCompleto === idNorm || uEmail === emailNorm) && u.clave === clave;
  });

  if (!usuario) {
    throw { status: 401, message: 'Usuario o contraseña incorrectos' };
  }

  // Buscar si tiene un compañero asociado en el grupo
  const companeroAsociado = (db.companeros || []).find(
    (c) => normalizar(c.nombre) === normalizar(usuario.nombre) || c.usuarioId === usuario.id,
  );

  return {
    id: usuario.id,
    nombre: usuario.nombre,
    apellido: usuario.apellido || '',
    email: usuario.email,
    rol: usuario.rol,
    companeroId: companeroAsociado ? companeroAsociado.id : undefined,
  };
}

export function signup(datos) {
  const db = obtenerDb();
  const nombre = (datos.nombre || '').trim();
  const apellido = (datos.apellido || '').trim();
  const email = (datos.email || '').trim().toLowerCase();
  const clave = datos.clave;

  const errores = {};

  if (!nombre) errores.nombre = 'El nombre es obligatorio';
  if (!email) errores.email = 'El correo es obligatorio';
  if (!clave || clave.length < 4) errores.clave = 'La contraseña debe tener al menos 4 caracteres';

  if (normalizar(nombre) === 'admin') {
    errores.nombre = 'Este nombre no está disponible';
  }

  const nombreCompletoNorm = normalizar(`${nombre} ${apellido}`);
  const yaExisteNombre = (db.usuarios || []).some(
    (u) => normalizar(`${u.nombre} ${u.apellido || ''}`) === nombreCompletoNorm,
  );
  if (yaExisteNombre) {
    errores.apellido = 'Este nombre y apellido ya están registrados';
  }

  const yaExisteEmail = (db.usuarios || []).some(
    (u) => (u.email || '').trim().toLowerCase() === email,
  );
  if (yaExisteEmail) {
    errores.email = 'Este correo ya está registrado';
  }

  if (Object.keys(errores).length > 0) {
    throw { status: 422, message: 'Error de validación en el registro', errores };
  }

  const nuevoUsuario = {
    id: `u-${Date.now()}`,
    nombre,
    apellido,
    email,
    clave,
    rol: 'usuario',
  };

  db.usuarios = [...(db.usuarios || []), nuevoUsuario];

  // Si no existe un compañero con ese nombre en el grupo, se crea automáticamente para poder participar en gastos
  let companero = (db.companeros || []).find((c) => normalizar(c.nombre) === normalizar(nombre));
  if (!companero) {
    const mayor = (db.companeros || []).reduce((max, c) => {
      const num = Number.parseInt((c.id || '').replace(/\D/g, ''), 10);
      return Number.isNaN(num) ? max : Math.max(max, num);
    }, 0);
    companero = {
      id: `c${mayor + 1}`,
      nombre,
      usuarioId: nuevoUsuario.id,
    };
    db.companeros = [...(db.companeros || []), companero];
  }

  guardarDb(db);

  return {
    id: nuevoUsuario.id,
    nombre: nuevoUsuario.nombre,
    apellido: nuevoUsuario.apellido,
    email: nuevoUsuario.email,
    rol: nuevoUsuario.rol,
    companeroId: companero.id,
  };
}

export function listarUsuarios() {
  const db = obtenerDb();
  return (db.usuarios || [])
    .filter((u) => u.rol === 'usuario')
    .map((u) => ({
      id: u.id,
      nombre: u.nombre,
      apellido: u.apellido || '',
      email: u.email,
      nombreVisible: [u.nombre, u.apellido].filter(Boolean).join(' '),
    }));
}
