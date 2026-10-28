/**
 * Atajos de teclado globales de la aplicacion.
 *
 * Permite registrar manejadores para atajos comunes y los dispara cuando el
 * usuario presiona la combinacion correspondiente en cualquier parte de la
 * app. Los eventos se propagan mediante CustomEvent en window para que cada
 * vista decida que hacer con ellos (desacoplamiento).
 */

import { onMounted, onUnmounted } from 'vue'

type Atajo = 'nuevo-gasto' | 'cerrar-modales' | 'enfocar-buscador'

type Manejador = () => void

const manejadores = new Map<Atajo, Manejador[]>()

function teclaEs(e: KeyboardEvent, tecla: string, conCtrlCmd: boolean): boolean {
  const teclaPresionada = e.key.toLowerCase() === tecla.toLowerCase()
  const ctrlCmd = conCtrlCmd ? e.ctrlKey || e.metaKey : true
  return teclaPresionada && ctrlCmd
}

function manejarTecla(e: KeyboardEvent): void {
  // Ctrl/Cmd + N: nuevo gasto
  if (teclaEs(e, 'n', true)) {
    manejadores.get('nuevo-gasto')?.forEach((h) => h())
  }

  // Esc: cerrar modales
  if (e.key === 'Escape') {
    manejadores.get('cerrar-modales')?.forEach((h) => h())
  }

  // Ctrl/Cmd + F: enfocar buscador
  if (teclaEs(e, 'f', true)) {
    manejadores.get('enfocar-buscador')?.forEach((h) => h())
  }
}

/** Registra un manejador para un atajo. */
function registrar(atajo: Atajo, manejador: Manejador): void {
  if (!manejadores.has(atajo)) {
    manejadores.set(atajo, [])
  }
  manejadores.get(atajo)!.push(manejador)
}

export function useAtajosTeclado() {
  function iniciar(): void {
    window.addEventListener('keydown', manejarTecla)
  }

  function detener(): void {
    window.removeEventListener('keydown', manejarTecla)
  }

  onMounted(iniciar)
  onUnmounted(detener)

  return {
    registrar,
  }
}

/** Atajos disponibles para documentar en la UI. */
export const ATAJOS: Record<Atajo, { descripcion: string; teclas: string }> = {
  'nuevo-gasto': { descripcion: 'Nuevo gasto', teclas: 'Ctrl/Cmd + N' },
  'cerrar-modales': { descripcion: 'Cerrar modales', teclas: 'Esc' },
  'enfocar-buscador': { descripcion: 'Buscar gastos', teclas: 'Ctrl/Cmd + F' },
}
