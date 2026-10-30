import { ref, computed } from 'vue'
import type { RolUsuario, Usuario } from '../types'
import { enviarJson, obtenerJson } from '../services/clienteHttp'

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

/** Mapa de cuentas base → Companero.id que garantiza la relación Usuario ↔ Companero. */
const COMPANERO_DE_CUENTA: Record<string, string> = {
  'maria@ujap.edu.ve': 'c1',
  'juan@ujap.edu.ve': 'c2',
  'carlos@ujap.edu.ve': 'c3',
}

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
    companeroId: COMPANERO_DE_CUENTA[cuenta.email],
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
    const companeroId =
      typeof parsed.companeroId === 'string' ? parsed.companeroId : undefined
    const cuenta = cuentas.find(
      (c) =>
        (nombre && normalizarNombre(nombreVisible(c)) === normalizarNombre(nombre)) ||
        (nombre && normalizarNombre(c.nombre) === normalizarNombre(nombre)) ||
        (email && normalizarEmail(c.email) === normalizarEmail(email)),
    )
    if (cuenta && rol === cuenta.rol) {
      const sesion = sesionDeCuenta(cuenta)
      // Prioriza el companeroId persistido; si no existe, usa el del mapa base.
      return { ...sesion, companeroId: companeroId ?? sesion.companeroId }
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

async function sincronizarCuentasDesdeServidor() {
  try {
    const usuariosRemotos = await obtenerJson<
      { id: string; nombre: string; apellido?: string; email: string }[]
    >('auth/usuarios')
    if (Array.isArray(usuariosRemotos)) {
      let cambio = false
      for (const u of usuariosRemotos) {
        if (!todasLasCuentas().some((c) => c.email.toLowerCase() === u.email.toLowerCase())) {
          cuentasRegistradas.value.push({
            nombre: u.nombre,
            apellido: u.apellido || '',
            email: u.email,
            clave: CLAVE_ASIGNADA,
            rol: 'usuario',
          })
          cambio = true
        }
      }
      if (cambio) guardarCuentasRegistradas(cuentasRegistradas.value)
    }
  } catch {
    /* ignore */
  }
}
sincronizarCuentasDesdeServidor()

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

  async function login(identificador: string, clave: string): Promise<boolean> {
    try {
      const res = await enviarJson<{ ok: boolean; usuario: Usuario }>('auth/login', 'POST', {
        identificador,
        clave,
      })
      if (res?.ok && res.usuario) {
        usuario.value = res.usuario
        guardarUsuario(res.usuario)
        return true
      }
    } catch {
      // Fallback a cuentas locales
    }

    const cuenta = buscarCuenta(identificador, clave)
    if (!cuenta) return false

    const sesion = sesionDeCuenta(cuenta)
    usuario.value = sesion
    guardarUsuario(sesion)
    return true
  }

  async function signup(
    nombre: string,
    apellido: string,
    email: string,
    clave: string,
  ): Promise<ResultadoSignup> {
    const nombreLimpio = limpiarTexto(nombre)
    const apellidoLimpio = limpiarTexto(apellido)
    const emailLimpio = normalizarEmail(email)
    const visible = nombreVisible({ nombre: nombreLimpio, apellido: apellidoLimpio })
    const errores: ResultadoSignup['errores'] = {}

    if (normalizarNombre(nombreLimpio) === 'admin') {
      errores.nombre = 'Este nombre no está disponible'
    }

    const ocupadoNombre = todasLasCuentas().some(
      (c) => normalizarNombre(nombreVisible(c)) === normalizarNombre(visible),
    )
    if (!errores.nombre && ocupadoNombre) {
      errores.apellido = 'Este nombre y apellido ya están registrados'
    }

    const ocupadoEmail = todasLasCuentas().some(
      (c) => normalizarEmail(c.email) === emailLimpio,
    )
    if (ocupadoEmail) {
      errores.email = 'Este correo ya está registrado'
    }

    if (Object.keys(errores).length > 0) {
      return { ok: false, errores }
    }

    try {
      const res = await enviarJson<{ ok: boolean; usuario: Usuario }>('auth/signup', 'POST', {
        nombre: nombreLimpio,
        apellido: apellidoLimpio,
        email: emailLimpio,
        clave,
      })

      if (res?.ok && res.usuario) {
        const nueva: Cuenta = {
          nombre: nombreLimpio,
          apellido: apellidoLimpio,
          email: emailLimpio,
          clave,
          rol: 'usuario',
        }
        cuentasRegistradas.value = [...cuentasRegistradas.value, nueva]
        guardarCuentasRegistradas(cuentasRegistradas.value)

        usuario.value = res.usuario
        guardarUsuario(res.usuario)
        return { ok: true, errores: {} }
      }
    } catch {
      // Fallback a almacenamiento local si el backend no responde
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

  /** Vincula la sesión actual con un Companero.id (se llama tras crear la cuenta). */
  function asignarCompanero(companeroId: string) {
    if (!usuario.value) return
    usuario.value = { ...usuario.value, companeroId }
    guardarUsuario(usuario.value)
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
    asignarCompanero,
    listarUsuarios,
  }
}
