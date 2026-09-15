import { computed, ref } from 'vue'
import type { TasaCambio } from '../types'

const API_URL = 'https://open.er-api.com/v6/latest/USD'
const MONEDA = 'VES'
const CACHE_KEY = 'ujap-split-tasa'
const TIMEOUT_MS = 8000
const CACHE_TTL_MS = 6 * 60 * 60 * 1000

/**
 * Estado compartido: el modulo se evalua una sola vez, asi que todas las vistas
 * que llamen a useTasaCambio() leen la misma tasa y no repiten la peticion.
 */
const tasa = ref<TasaCambio | null>(null)
const cargando = ref(false)
const error = ref<string | null>(null)
const guardadoEn = ref<number | null>(null)

let peticionEnCurso: Promise<void> | null = null

function esTasaValida(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isFinite(valor) && valor > 0
}

/** Valida la respuesta del API antes de dejarla entrar al estado de la app. */
function interpretarRespuesta(datos: unknown): TasaCambio {
  if (typeof datos !== 'object' || datos === null) {
    throw new Error('El servicio devolvió una respuesta con un formato inesperado')
  }

  const cuerpo = datos as Record<string, unknown>

  if (cuerpo.result !== 'success') {
    throw new Error('El servicio de tasas rechazó la consulta')
  }

  const rates = cuerpo.rates
  if (typeof rates !== 'object' || rates === null) {
    throw new Error('La respuesta no incluye el listado de monedas')
  }

  const valor = (rates as Record<string, unknown>)[MONEDA]
  if (!esTasaValida(valor)) {
    throw new Error(`El servicio no publicó una tasa válida para ${MONEDA}`)
  }

  const publicado = cuerpo.time_last_update_utc
  const actualizado =
    typeof publicado === 'string' && !Number.isNaN(Date.parse(publicado))
      ? new Date(publicado).toISOString()
      : new Date().toISOString()

  const proveedor =
    typeof cuerpo.provider === 'string' && cuerpo.provider.trim()
      ? cuerpo.provider
      : 'exchangerate-api.com'

  return { valor, actualizado, proveedor }
}

function leerCache(): { tasa: TasaCambio; guardadoEn: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Record<string, unknown>
    const guardado = parsed.guardadoEn
    const cruda = parsed.tasa as Record<string, unknown> | undefined

    if (typeof guardado !== 'number' || !cruda) return null
    if (!esTasaValida(cruda.valor)) return null
    if (typeof cruda.actualizado !== 'string') return null

    return {
      guardadoEn: guardado,
      tasa: {
        valor: cruda.valor,
        actualizado: cruda.actualizado,
        proveedor: typeof cruda.proveedor === 'string' ? cruda.proveedor : 'caché local',
      },
    }
  } catch {
    return null
  }
}

function escribirCache(valor: TasaCambio, momento: number) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ tasa: valor, guardadoEn: momento }))
  } catch {
    /* localStorage lleno o bloqueado: la tasa igual funciona en memoria */
  }
}

function mensajeDeError(e: unknown): string {
  if (e instanceof DOMException && e.name === 'AbortError') {
    return `La consulta tardó más de ${TIMEOUT_MS / 1000} segundos. Intenta de nuevo.`
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'Sin conexión a internet. No se pudo actualizar la tasa.'
  }
  if (e instanceof TypeError) {
    return 'No se pudo contactar el servicio de tasas. Revisa tu conexión.'
  }
  return e instanceof Error ? e.message : 'Ocurrió un error inesperado al consultar la tasa'
}

async function consultarApi(): Promise<void> {
  const controlador = new AbortController()
  const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_MS)

  cargando.value = true
  error.value = null

  try {
    const respuesta = await fetch(API_URL, {
      signal: controlador.signal,
      headers: { Accept: 'application/json' },
    })

    if (!respuesta.ok) {
      throw new Error(`El servicio respondió con error ${respuesta.status}`)
    }

    const nueva = interpretarRespuesta(await respuesta.json())
    const momento = Date.now()

    tasa.value = nueva
    guardadoEn.value = momento
    escribirCache(nueva, momento)
  } catch (e) {
    error.value = mensajeDeError(e)
    // Si ya habia una tasa (del cache o de una consulta previa) se conserva
    // para que la interfaz siga mostrando montos en bolivares.
  } finally {
    clearTimeout(temporizador)
    cargando.value = false
  }
}

export function useTasaCambio() {
  const disponible = computed(() => tasa.value !== null)

  // Funcion y no computed: un computed cachearia el Date.now() de la primera
  // lectura y la tasa nunca se daria por vencida.
  function estaVencida(): boolean {
    if (guardadoEn.value === null) return true
    return Date.now() - guardadoEn.value > CACHE_TTL_MS
  }

  /** True cuando se muestra una tasa vieja porque la última consulta falló. */
  const usandoRespaldo = computed(() => error.value !== null && tasa.value !== null)

  const actualizadoTexto = computed(() => {
    if (!tasa.value) return ''
    return new Date(tasa.value.actualizado).toLocaleDateString('es-VE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  })

  /**
   * Trae la tasa del API. Reutiliza el caché mientras siga vigente y evita
   * lanzar dos peticiones simultáneas si varios componentes la piden a la vez.
   */
  async function cargarTasa(forzar = false): Promise<void> {
    if (peticionEnCurso) return peticionEnCurso

    if (!forzar) {
      if (tasa.value && !estaVencida()) return

      const cache = leerCache()
      if (cache) {
        tasa.value = cache.tasa
        guardadoEn.value = cache.guardadoEn
        if (Date.now() - cache.guardadoEn <= CACHE_TTL_MS) return
      }
    }

    peticionEnCurso = consultarApi().finally(() => {
      peticionEnCurso = null
    })

    return peticionEnCurso
  }

  function reintentar(): Promise<void> {
    return cargarTasa(true)
  }

  /** Convierte un monto en USD a bolívares. Null si aún no hay tasa. */
  function aBolivares(montoUsd: number): number | null {
    if (!tasa.value || !Number.isFinite(montoUsd)) return null
    return montoUsd * tasa.value.valor
  }

  function formatearBolivares(montoUsd: number): string | null {
    const convertido = aBolivares(montoUsd)
    if (convertido === null) return null
    return `Bs ${convertido.toLocaleString('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  return {
    tasa,
    cargando,
    error,
    disponible,
    estaVencida,
    usandoRespaldo,
    actualizadoTexto,
    cargarTasa,
    reintentar,
    aBolivares,
    formatearBolivares,
  }
}
