export interface CategoriaMaterial {
  id: string
  nombre: string
  icono: string
  keywords: string[]
}

export const CATEGORIAS: CategoriaMaterial[] = [
  { id: 'copias', nombre: 'Copias e impresiones', icono: '🖨️', keywords: ['copia', 'impres', 'xerox'] },
  { id: 'papel', nombre: 'Hojas y papel', icono: '📄', keywords: ['hoja', 'resma', 'papel'] },
  { id: 'escritura', nombre: 'Lápices y bolígrafos', icono: '✏️', keywords: ['lapic', 'bolígrafo', 'marcador'] },
  { id: 'cuadernos', nombre: 'Cuadernos y apuntes', icono: '📓', keywords: ['cuaderno', 'libreta', 'apunte'] },
  { id: 'libros', nombre: 'Libros y manuales', icono: '📚', keywords: ['libro', 'manual', 'texto'] },
  { id: 'equipo', nombre: 'Equipo y tecnología', icono: '💾', keywords: ['usb', 'memoria', 'calculadora', 'videobeam', 'proyector', 'data show'] },
  { id: 'laboratorio', nombre: 'Laboratorio', icono: '🔬', keywords: ['laboratorio', 'práctica', 'practica'] },
  { id: 'otros', nombre: 'Otros materiales', icono: '📎', keywords: [] },
]

export function getCategoriaId(descripcion: string): string {
  const desc = descripcion.toLowerCase()
  const match = CATEGORIAS.find((cat) =>
    cat.keywords.some((keyword) => desc.includes(keyword))
  )
  return match?.id ?? 'otros'
}

export function getCategoryIcon(descripcion: string): string {
  const id = getCategoriaId(descripcion)
  return CATEGORIAS.find((c) => c.id === id)?.icono ?? '📎'
}

export function getCategoriaNombre(descripcion: string): string {
  const id = getCategoriaId(descripcion)
  return CATEGORIAS.find((c) => c.id === id)?.nombre ?? 'Otros materiales'
}
