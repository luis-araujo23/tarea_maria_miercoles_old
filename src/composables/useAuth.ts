import { ref, computed } from 'vue'
import type { Usuario } from '../types'

const AUTH_KEY = 'ujap-split-auth'

function cargarUsuario(): Usuario | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      if (typeof parsed.nombre === 'string' && typeof parsed.email === 'string') {
        return { nombre: parsed.nombre, email: parsed.email }
      }
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

const usuario = ref<Usuario | null>(cargarUsuario())

export function useAuth() {
  const autenticado = computed(() => usuario.value !== null)

  function login(_email: string, _password: string): boolean {
    // Mock: en el futuro se reemplazara con llamada API real
    const nombre = _email.split('@')[0] ?? 'Usuario'
    const nuevoUsuario: Usuario = { nombre, email: _email }
    usuario.value = nuevoUsuario
    guardarUsuario(nuevoUsuario)
    return true
  }

  function signup(nombre: string, email: string, _password: string): boolean {
    // Mock: en el futuro se reemplazara con llamada API real
    const nuevoUsuario: Usuario = { nombre, email }
    usuario.value = nuevoUsuario
    guardarUsuario(nuevoUsuario)
    return true
  }

  function logout() {
    usuario.value = null
    guardarUsuario(null)
  }

  return {
    usuario,
    autenticado,
    login,
    signup,
    logout,
  }
}
