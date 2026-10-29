/**
 * Gestor de tema visual (claro / oscuro).
 *
 * Lee la preferencia guardada en localStorage, detecta la preferencia del
 * sistema como valor por defecto y aplica un atributo `data-tema` en el
 * elemento <html> para que las variables CSS de base.css se adapten.
 */

import { ref, computed } from 'vue'

const TEMA_KEY = 'ujap-split-tema'
type Tema = 'claro' | 'oscuro'

function temaGuardado(): Tema {
  try {
    const raw = localStorage.getItem(TEMA_KEY)
    if (raw === 'claro' || raw === 'oscuro') return raw
  } catch {
    /* ignorar */
  }
  // Detectar preferencia del sistema como valor por defecto
  if (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return 'oscuro'
  }
  return 'claro'
}

/** Estado compartido (singleton). */
const tema = ref<Tema>(temaGuardado())

export function useTema() {
  function setTema(nuevo: Tema) {
    tema.value = nuevo
    document.documentElement.setAttribute('data-tema', nuevo)
    try {
      localStorage.setItem(TEMA_KEY, nuevo)
    } catch {
      /* localStorage lleno o bloqueado */
    }
  }

  const esOscuro = computed(() => tema.value === 'oscuro')

  // Aplicar el tema al cargar el modulo
  document.documentElement.setAttribute('data-tema', tema.value)

  return {
    tema,
    setTema,
    esOscuro,
  }
}
