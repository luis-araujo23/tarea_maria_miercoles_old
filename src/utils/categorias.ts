import type { CategoriaMaterial } from '../types'

// El catálogo de categorías lo publica la API en `public/api/categorias.json`.

export function getCategoriaId(descripcion: string, categorias: CategoriaMaterial[]): string {
  const desc = descripcion.toLowerCase()
  const match = categorias.find((cat) =>
    cat.keywords.some((keyword) => desc.includes(keyword))
  )
  return match?.id ?? 'otros'
}

export function getCategoryIcon(descripcion: string, categorias: CategoriaMaterial[]): string {
  const id = getCategoriaId(descripcion, categorias)
  return categorias.find((c) => c.id === id)?.icono ?? '📎'
}

export function getCategoriaNombre(descripcion: string, categorias: CategoriaMaterial[]): string {
  const id = getCategoriaId(descripcion, categorias)
  return categorias.find((c) => c.id === id)?.nombre ?? 'Otros materiales'
}
