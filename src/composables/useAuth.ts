import { ref, computed } from 'vue'
import type { RolUsuario, Usuario } from '../types'

const AUTH_KEY = 'ujap-split-auth'
const USERS_KEY = 'ujap-split-users'
const CLAVE_ASIGNADA = '1233'

interface Cuenta {
  nombre: string
  apellido: string
  email: string
  clave: string
  rol: RolUsuario
}

const CUENTAS_BASE: Cuenta[] = [
  { nombre: 'María', apellido: '', email: 'maria@ujap.edu.ve', clave: CLAVE_ASIGNADA, rol: 'usuario' },
  { nombre: 'Juan', apellido: '', email: 'juan@ujap.edu.ve', clave: CLAVE_ASIGNADA, rol: 'usuario' },
  { nombre: 'Carlos', apellido: '', email: 'carlos@ujap.edu.ve', clave: CLAVE_ASIGNADA, rol: 'usuario' },
  { nombre: 'admin', apellido: '', email: 'admin@ujap.edu.ve', clave: CLAVE_ASIGNADA, rol: 'admin' },
]

export interface UsuarioPublico {
  nombre: string
  apellido: string
  email: string
  nombreVisible: string
}

export type CampoSignup = 'nombre' | 'apellido' | 'email'

export interface ResultadoSignup {
  ok: boolean
  errores: Partial<Record<CampoSignup, string>>
}

function limpiarTexto(valor: string) {
  return valor.trim().replace(/\s+/g, ' ')
}

function nombreVisible(cuenta: Pick<Cuenta, 'nombre' | 'apellido'>) {
  return [cuenta.nombre, cuenta.apellido].filter(Boolean).join(' ')
}

function normalizarNombre(valor: string) {
  return valor
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

function normalizarEmail(valor: string) {
  return valor.trim().toLowerCase()
}

function parseCuenta(raw: unknown): Cuenta | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Record<string, unknown>
  if (typeof item.nombre !== 'string' || typeof item.email !== 'string') return null
  if (typeof item.clave !== 'string') return null
  if (item.rol !== 'admin' && item.rol !== 'usuario') return null
  return {
    nombre: item.nombre,
    apellido: typeof item.apellido === 'string' ? item.apellido : '',
    email: item.email,
    clave: item.clave,
    rol: item.rol,
  }
}

function cargarCuentasRegistradas(): Cuenta[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.map(parseCuenta).filter((c): c is Cuenta => c !== null)
  } catch {
    return []
  }
}

function guardarCuentasRegistradas(cuentas: Cuenta[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(cuentas))
}

function sesionDeCuenta(cuenta: Cuenta): Usuario {
  return {
    nombre: nombreVisible(cuenta),
    apellido: cuenta.apellido,
    email: cuenta.email,
    rol: cuenta.rol,
  }
}

function cargarUsuario(cuentas: Cuenta[]): Usuario | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const nombre = typeof parsed.nombre === 'string' ? parsed.nombre : ''
    const email = typeof parsed.email === 'string' ? parsed.email : ''
    const rol = parsed.rol === 'admin' || parsed.rol === 'usuario' ? parsed.rol : null
    const cuenta = cuentas.find(
      (c) =>
        (nombre && normalizarNombre(nombreVisible(c)) === normalizarNombre(nombre)) ||
        (nombre && normalizarNombre(c.nombre) === normalizarNombre(nombre)) ||
        (email && normalizarEmail(c.email) === normalizarEmail(email)),
    )
    if (cuenta && rol === cuenta.rol) {
      return sesionDeCuenta(cuenta)
    }
  } catch {
    /* ignore */
  }
  return null
}

function guardarUsuario(usuario: Usuario | null) {
  if (usuario) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(usuario))
  } else {
    localStorage.removeItem(AUTH_KEY)
  }
}

const cuentasRegistradas = ref<Cuenta[]>(cargarCuentasRegistradas())

function todasLasCuentas() {
  return [...CUENTAS_BASE, ...cuentasRegistradas.value]
}

const usuario = ref<Usuario | null>(cargarUsuario(todasLasCuentas()))

export function useAuth() {
  const autenticado = computed(() => usuario.value !== null)
  const esAdmin = computed(() => usuario.value?.rol === 'admin')

  function buscarCuenta(identificador: string, clave: string): Cuenta | undefined {
    const nombreNorm = normalizarNombre(identificador)
    const emailNorm = normalizarEmail(identificador)
    return todasLasCuentas().find(
      (c) =>
        c.clave === clave &&
        (normalizarNombre(c.nombre) === nombreNorm ||
          normalizarNombre(nombreVisible(c)) === nombreNorm ||
          normalizarEmail(c.email) === emailNorm),
    )
  }

  function login(identificador: string, clave: string): boolean {
    const cuenta = buscarCuenta(identificador, clave)
    if (!cuenta) return false

    const sesion = sesionDeCuenta(cuenta)
    usuario.value = sesion
    guardarUsuario(sesion)
    return true
  }

  function signup(
    nombre: string,
    apellido: string,
    email: string,
    clave: string,
  ): ResultadoSignup {
    const nombreLimpio = limpiarTexto(nombre)
    const apellidoLimpio = limpiarTexto(apellido)
    const emailLimpio = normalizarEmail(email)
    const visible = nombreVisible({ nombre: nombreLimpio, apellido: apellidoLimpio })
    const errores: ResultadoSignup['errores'] = {}

    if (normalizarNombre(nombreLimpio) === 'admin') {
      errores.nombre = 'Este nombre no esta disponible'
    }

    const ocupadoNombre = todasLasCuentas().some(
      (c) => normalizarNombre(nombreVisible(c)) === normalizarNombre(visible),
    )
    if (!errores.nombre && ocupadoNombre) {
      errores.apellido = 'Este nombre y apellido ya estan registrados'
    }

    const ocupadoEmail = todasLasCuentas().some(
      (c) => normalizarEmail(c.email) === emailLimpio,
    )
    if (ocupadoEmail) {
      errores.email = 'Este correo ya esta registrado'
    }

    if (Object.keys(errores).length > 0) {
      return { ok: false, errores }
    }

    const nueva: Cuenta = {
      nombre: nombreLimpio,
      apellido: apellidoLimpio,
      email: emailLimpio,
      clave,
      rol: 'usuario',
    }

    cuentasRegistradas.value = [...cuentasRegistradas.value, nueva]
    guardarCuentasRegistradas(cuentasRegistradas.value)

    const sesion = sesionDeCuenta(nueva)
    usuario.value = sesion
    guardarUsuario(sesion)
    return { ok: true, errores: {} }
  }

  function logout() {
    usuario.value = null
    guardarUsuario(null)
  }

  /** Cuentas reales de la app, sin contraseña ni administradores. */
  function listarUsuarios(): UsuarioPublico[] {
    return todasLasCuentas()
      .filter((c) => c.rol === 'usuario')
      .map((c) => ({
        nombre: c.nombre,
        apellido: c.apellido,
        email: c.email,
        nombreVisible: nombreVisible(c),
      }))
  }

  return {
    usuario,
    autenticado,
    esAdmin,
    login,
    signup,
    logout,
    listarUsuarios,
  }
}
