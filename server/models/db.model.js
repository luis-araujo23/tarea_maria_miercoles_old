import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const SEED_FILE = path.join(DATA_DIR, 'seed.json');

/**
 * Estado en memoria del backend ("hoy: en memoria; semana 12: PostgreSQL").
 * Se respalda en disco en server/data/db.json para que las operaciones
 * persistan ante reinicios y se compartan entre todas las PCs de la red.
 */
let inMemoryDb = null;

function cargarSemilla() {
  if (fs.existsSync(SEED_FILE)) {
    const raw = fs.readFileSync(SEED_FILE, 'utf-8');
    return JSON.parse(raw);
  }
  return {
    categorias: [],
    productos: [],
    companeros: [],
    gastos: [],
    pagos: [],
    usuarios: [],
    notificaciones: [],
  };
}

export function obtenerDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      inMemoryDb = JSON.parse(raw);
      return inMemoryDb;
    } else {
      inMemoryDb = cargarSemilla();
      guardarDb(inMemoryDb);
      return inMemoryDb;
    }
  } catch (error) {
    console.error('Error leyendo base de datos, usando memoria:', error);
    if (!inMemoryDb) inMemoryDb = cargarSemilla();
    return inMemoryDb;
  }
}

export function guardarDb(datos) {
  inMemoryDb = datos;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(datos, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error persistiendo base de datos en disco:', error);
  }
}

export function restaurarDb() {
  const semilla = cargarSemilla();
  guardarDb(semilla);
  return semilla;
}
