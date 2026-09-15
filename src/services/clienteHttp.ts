/**
 * Cliente HTTP de la aplicación. Envuelve `fetch` para que el resto del código
 * trabaje siempre con promesas que resuelven datos válidos o fallan con un
 * ErrorApi que ya trae un mensaje listo para mostrarle al usuario.
 */

export type CodigoErrorApi =
  | 'offline'
  | 'timeout'
  | 'red'
  | 'http'
  | 'formato'
  | 'validacion'
  | 'no-encontrado'
  | 'almacenamiento'

export class ErrorApi extends Error {
  readonly codigo: CodigoErrorApi
  /** Código HTTP equivalente. 0 cuando la petición nunca llegó al servidor. */
  readonly estado: number

  constructor(codigo: CodigoErrorApi, mensaje: string, estado = 0) {
    super(mensaje)
    this.name = 'ErrorApi'
    this.codigo = codigo
    this.estado = estado
  }
}

/** Base de la API simulada: archivos JSON servidos por el propio sitio. */
const BASE_URL = `${import.meta.env.BASE_URL}api/`
const TIMEOUT_MS = 8000
const REINTENTOS = 1
const ESPERA_ENTRE_REINTENTOS_MS = 600

/**
 * Los JSON se sirven desde disco y responden en milisegundos. La latencia
 * artificial mantiene visibles los estados de carga, igual que contra un
 * backend real.
 */
const LATENCIA_MS = 400

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Retardo que simulan las operaciones de la API. */
export function latenciaSimulada(factor = 1): Promise<void> {
  return esperar(Math.round(LATENCIA_MS * factor))
}

function mensajeHttp(estado: number): string {
  if (estado === 404) return 'El recurso solicitado no existe en el servidor'
  if (estado === 403) return 'No tienes permiso para consultar estos datos'
  if (estado >= 500) return 'El servidor tuvo un problema. Intenta de nuevo en un momento.'
  return `El servidor respondió con error ${estado}`
}

function esErrorTransitorio(e: unknown): boolean {
  // Un TypeError de fetch casi siempre es un corte de red momentáneo.
  return e instanceof TypeError
}

async function intentarPeticion<T>(recurso: string): Promise<T> {
  const controlador = new AbortController()
  const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_MS)

  try {
    const respuesta = await fetch(`${BASE_URL}${recurso}`, {
      signal: controlador.signal,
      headers: { Accept: 'application/json' },
    })

    if (!respuesta.ok) {
      throw new ErrorApi('http', mensajeHttp(respuesta.status), respuesta.status)
    }

    try {
      return (await respuesta.json()) as T
    } catch {
      throw new ErrorApi('formato', `La respuesta de ${recurso} no es un JSON válido`, 502)
    }
  } catch (e) {
    if (e instanceof ErrorApi) throw e

    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new ErrorApi(
        'timeout',
        `El servidor tardó más de ${TIMEOUT_MS / 1000} segundos en responder`,
      )
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      throw new ErrorApi('offline', 'Sin conexión: no se pudieron cargar los datos del grupo')
    }

    throw new ErrorApi('red', 'No se pudo contactar el servidor de datos')
  } finally {
    clearTimeout(temporizador)
  }
}

/**
 * Pide un recurso de la API. Reintenta una vez ante fallos de red pasajeros,
 * pero no ante respuestas de error del servidor: esas no cambian al repetir.
 */
export async function obtenerJson<T>(recurso: string): Promise<T> {
  let ultimoError: unknown

  for (let intento = 0; intento <= REINTENTOS; intento++) {
    try {
      return await intentarPeticion<T>(recurso)
    } catch (e) {
      ultimoError = e
      const reintentable = e instanceof ErrorApi && (e.codigo === 'red' || e.codigo === 'timeout')
      if (!reintentable && !esErrorTransitorio(e)) break
      if (intento < REINTENTOS) await esperar(ESPERA_ENTRE_REINTENTOS_MS)
    }
  }

  throw ultimoError instanceof ErrorApi
    ? ultimoError
    : new ErrorApi('red', 'No se pudo contactar el servidor de datos')
}

/** Traduce cualquier excepción en un mensaje presentable en la interfaz. */
export function mensajeDeError(e: unknown): string {
  if (e instanceof ErrorApi) return e.message
  if (e instanceof Error) return e.message
  return 'Ocurrió un error inesperado'
}
