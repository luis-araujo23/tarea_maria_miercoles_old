import type { Companero, Usuario } from '../types'

function normalizar(valor: string) {
  return valor
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function coincidenNombres(a: string, b: string): boolean {
  const na = normalizar(a)
  const nb = normalizar(b)
  if (!na || !nb) return false
  if (na === nb) return true
  const primeroA = na.split(' ')[0] ?? ''
  const primeroB = nb.split(' ')[0] ?? ''
  return primeroA === nb || primeroB === na
}

export function companeroDeUsuario(
  usuario: Usuario | null,
  companeros: Companero[],
): Companero | null {
  if (!usuario) return null
  return companeros.find((c) => coincidenNombres(c.nombre, usuario.nombre)) ?? null
}

export function companeroPorNombre(
  nombre: string,
  companeros: Companero[],
): Companero | null {
  return companeros.find((c) => coincidenNombres(c.nombre, nombre)) ?? null
}
