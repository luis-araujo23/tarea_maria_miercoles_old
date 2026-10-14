/**
 * Cliente HTTP de la aplicación (Entrega 3).
 *
 * Conecta el frontend con la API de Express (puerto 3000) usando las variables
 * de entorno de Vite (VITE_API_URL) y CORS, adaptándose para funcionar tanto
 * en localhost como al abrir la app desde otra PC o móvil en la misma red local.
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

const TIMEOUT_MS = 8000
const REINTENTOS = 1
const ESPERA_ENTRE_REINTENTOS_MS = 600
const LATENCIA_MS = 150

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function latenciaSimulada(factor = 1): Promise<void> {
  return esperar(Math.round(LATENCIA_MS * factor))
}

/**
 * Resuelve la URL base de la API.
 * 1. Si existe VITE_API_URL en .env (ej: http://localhost:3000):
 *    - Si se navega desde otra máquina en red (ej. 192.168.X.X:5173), reemplaza
 *      'localhost' por el host real de la máquina para que las peticiones lleguen
 *      al backend de Express en la misma máquina.
 * 2. Si no hay VITE_API_URL o falla, usa el proxy relativo '/api/' configurado en Vite.
 */
export function obtenerBaseApi(): string {
  // En el navegador, la ruta relativa '/api/' resuelve automáticamente al host y puerto
  // actuales (Vite dev server con middleware Express o Express directo), garantizando
  // funcionamiento perfecto tanto en localhost como desde cualquier otra PC/móvil en LAN.
  if (typeof window !== 'undefined') {
    return '/api/'
  }

  const envUrl = import.meta.env.VITE_API_URL as string | undefined
  if (envUrl) {
    const base = envUrl.endsWith('/') ? envUrl : `${envUrl}/`
    return base.endsWith('/api/') ? base : `${base}api/`
  }

  return '/api/'
}

function mensajeHttp(estado: number): string {
  if (estado === 404) return 'El recurso solicitado no existe en el servidor'
  if (estado === 401) return 'Credenciales incorrectas o sesión expirada'
  if (estado === 403) return 'No tienes permiso para consultar estos datos'
  if (estado === 422) return 'Los datos enviados no son válidos'
  if (estado >= 500) return 'El servidor tuvo un problema. Intenta de nuevo en un momento.'
  return `El servidor respondió con error ${estado}`
}

function esErrorTransitorio(e: unknown): boolean {
  return e instanceof TypeError
}

async function intentarPeticion<T>(
  recurso: string,
  opciones: RequestInit = {},
): Promise<T> {
  const controlador = new AbortController()
  const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_MS)
  const base = obtenerBaseApi()
  const urlFinal = `${base}${recurso.replace(/^\/+/, '')}`

  try {
    const respuesta = await fetch(urlFinal, {
      ...opciones,
      signal: controlador.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(opciones.headers || {}),
      },
    })

    if (!respuesta.ok) {
      let mensajeServidor = ''
      try {
        const errorJson = (await respuesta.json()) as { error?: string; message?: string }
        mensajeServidor = errorJson.error || errorJson.message || ''
      } catch {
        /* ignore */
      }
      throw new ErrorApi(
        'http',
        mensajeServidor || mensajeHttp(respuesta.status),
        respuesta.status,
      )
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
      throw new ErrorApi('offline', 'Sin conexión: no se pudieron cargar los datos')
    }

    throw new ErrorApi('red', 'No se pudo contactar el servidor de datos')
  } finally {
    clearTimeout(temporizador)
  }
}

/** Petición GET */
export async function obtenerJson<T>(recurso: string): Promise<T> {
  let ultimoError: unknown

  for (let intento = 0; intento <= REINTENTOS; intento++) {
    try {
      return await intentarPeticion<T>(recurso, { method: 'GET' })
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

/** Petición POST, PUT o DELETE */
export async function enviarJson<T>(
  recurso: string,
  metodo: 'POST' | 'PUT' | 'DELETE',
  cuerpo?: unknown,
): Promise<T> {
  return intentarPeticion<T>(recurso, {
    method: metodo,
    body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
  })
}

/** Traduce cualquier excepción en un mensaje presentable en la interfaz. */
export function mensajeDeError(e: unknown): string {
  if (e instanceof ErrorApi) return e.message
  if (e instanceof Error) return e.message
  return 'Ocurrió un error inesperado'
}
