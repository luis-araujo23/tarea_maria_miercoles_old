import { ref, readonly } from 'vue'

export type ToastTipo = 'success' | 'error' | 'info'

const visible = ref(false)
const mensaje = ref('')
const tipo = ref<ToastTipo>('error')
let timer: ReturnType<typeof setTimeout> | null = null

/**
 * Toast compartido de la aplicacion.
 *
 * Cualquier vista o composable puede llamar a `mostrar()` para notificar al
 * usuario, y un unico componente (`ToastGlobal`) se encarga de renderizarlo.
 * Esto evita que cada vista gestione su propio toast por separado.
 */
export function usarToast() {
  function mostrar(texto: string, t: ToastTipo = 'error') {
    if (timer) clearTimeout(timer)
    visible.value = true
    mensaje.value = texto
    tipo.value = t
    timer = setTimeout(() => {
      visible.value = false
    }, 3000)
  }

  return {
    visible: readonly(visible),
    mensaje: readonly(mensaje),
    tipo: readonly(tipo),
    mostrar,
  }
}

/** Estado expuesto para el componente global de notificaciones. */
export const estadoToast = {
  visible: readonly(visible),
  mensaje: readonly(mensaje),
  tipo: readonly(tipo),
}

/**
 * Muestra un toast desde cualquier lado de la app (por ejemplo, el manejador
 * global de errores en main.ts).
 */
export const mostrarToastGlobal = (texto: string, t: ToastTipo = 'error') => {
  if (timer) clearTimeout(timer)
  visible.value = true
  mensaje.value = texto
  tipo.value = t
  timer = setTimeout(() => {
    visible.value = false
  }, 3000)
}
