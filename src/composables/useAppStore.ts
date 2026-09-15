import { computed, ref } from 'vue'
import type { AppState, CategoriaMaterial, Companero, Gasto, Pago, Producto } from '../types'
import * as api from '../services/apiUjapSplit'
import type { DatosCompra, DatosGasto, DatosPago } from '../services/apiUjapSplit'
import { mensajeDeError } from '../services/clienteHttp'
import { useAuth } from './useAuth'
import { companeroDeUsuario } from '../utils/perfil'
import type { DatosCategoria, DatosProducto } from '../utils/validaciones'

/**
 * Estado compartido de la aplicación. El módulo se evalúa una sola vez, así
 * que todas las vistas leen los mismos datos y una sola petición los alimenta.
 *
 * Aquí no hay datos de ejemplo ni acceso a localStorage: todo llega desde la
 * API (`services/apiUjapSplit`) y todo cambio vuelve a pasar por ella.
 */

const companeros = ref<Companero[]>([])
const gastos = ref<Gasto[]>([])
const pagos = ref<Pago[]>([])
const categorias = ref<CategoriaMaterial[]>([])
const productos = ref<Producto[]>([])

const cargando = ref(false)
const guardando = ref(false)
const error = ref<string | null>(null)
const cargado = ref(false)
const sincronizadoEn = ref<number | null>(null)

/** Evita lanzar dos cargas simultáneas si varias vistas piden los datos. */
let peticionEnCurso: Promise<void> | null = null

function aplicarEstado(estado: AppState) {
  companeros.value = estado.companeros
  gastos.value = estado.gastos
  pagos.value = estado.pagos
  categorias.value = estado.categorias
  productos.value = estado.productos
}

async function pedirDatos(forzarServidor: boolean): Promise<void> {
  cargando.value = true
  error.value = null

  try {
    aplicarEstado(await api.obtenerEstado(forzarServidor))
    cargado.value = true
    sincronizadoEn.value = Date.now()
  } catch (e) {
    // Si ya había datos en pantalla se conservan: mejor mostrar algo viejo
    // junto al aviso de error que dejar la vista en blanco.
    error.value = mensajeDeError(e)
  } finally {
    cargando.value = false
  }
}

/**
 * Envuelve una escritura contra la API. Devuelve `null` si salió bien o el
 * mensaje de error para que la vista lo muestre en su toast o formulario.
 */
async function ejecutar(operacion: () => Promise<void>): Promise<string | null> {
  guardando.value = true

  try {
    await operacion()
    sincronizadoEn.value = Date.now()
    return null
  } catch (e) {
    return mensajeDeError(e)
  } finally {
    guardando.value = false
  }
}

export function useAppStore() {
  /** True cuando ya hay datos utilizables en pantalla. */
  const listo = computed(() => cargado.value)

  /**
   * Carga los datos del grupo. Solo consulta la API la primera vez; las
   * siguientes llamadas reutilizan lo que ya está en memoria.
   */
  function cargarDatos(forzarServidor = false): Promise<void> {
    if (peticionEnCurso) return peticionEnCurso
    if (cargado.value && !forzarServidor) return Promise.resolve()

    peticionEnCurso = pedirDatos(forzarServidor).finally(() => {
      peticionEnCurso = null
    })

    return peticionEnCurso
  }

  /** Vuelve a pedir el estado original al servidor y descarta los cambios locales. */
  function restaurarDesdeServidor(): Promise<void> {
    return cargarDatos(true)
  }

  /** Repite la carga tras un fallo, sin descartar datos ya cargados. */
  function reintentar(): Promise<void> {
    return cargarDatos(cargado.value)
  }

  function nombreCompanero(id: string): string {
    return companeros.value.find((c) => c.id === id)?.nombre ?? 'Desconocido'
  }

  function buscarGasto(id: number): Gasto | null {
    return gastos.value.find((g) => g.id === id) ?? null
  }

  function agregarGasto(datos: DatosGasto) {
    return ejecutar(async () => {
      gastos.value = await api.crearGasto(datos)
    })
  }

  function actualizarGasto(id: number, datos: DatosGasto) {
    return ejecutar(async () => {
      gastos.value = await api.actualizarGasto(id, datos)
    })
  }

  function eliminarGasto(id: number) {
    return ejecutar(async () => {
      gastos.value = await api.eliminarGasto(id)
    })
  }

  function vaciarGastos() {
    return ejecutar(async () => {
      gastos.value = await api.vaciarGastos()
    })
  }

  function agregarPago(datos: DatosPago) {
    return ejecutar(async () => {
      const { usuario, esAdmin } = useAuth()
      if (!esAdmin.value) {
        const titular = companeroDeUsuario(usuario.value, companeros.value)
        if (!titular || datos.deId !== titular.id) {
          throw new Error('Solo puedes registrar los pagos de tu propia cuenta')
        }
      }
      pagos.value = await api.crearPago(datos)
    })
  }

  function eliminarPago(id: number) {
    return ejecutar(async () => {
      pagos.value = await api.eliminarPago(id)
    })
  }

  function agregarCompanero(nombre: string) {
    return ejecutar(async () => {
      companeros.value = await api.crearCompanero(nombre)
    })
  }

  function eliminarCompanero(id: string) {
    return ejecutar(async () => {
      companeros.value = await api.eliminarCompanero(id)
    })
  }

  function guardarCategoria(datos: DatosCategoria, id?: string) {
    return ejecutar(async () => {
      categorias.value = await api.guardarCategoria(datos, id)
    })
  }

  function eliminarCategoria(id: string) {
    return ejecutar(async () => {
      categorias.value = await api.eliminarCategoria(id)
    })
  }

  function comprarProducto(datos: DatosCompra) {
    return ejecutar(async () => {
      gastos.value = await api.crearCompra(datos)
    })
  }

  function guardarProducto(datos: DatosProducto, id?: string) {
    return ejecutar(async () => {
      productos.value = await api.guardarProducto(datos, id)
    })
  }

  function eliminarProducto(id: string) {
    return ejecutar(async () => {
      productos.value = await api.eliminarProducto(id)
    })
  }

  return {
    companeros,
    gastos,
    pagos,
    categorias,
    productos,

    cargando,
    guardando,
    error,
    listo,
    sincronizadoEn,

    cargarDatos,
    restaurarDesdeServidor,
    reintentar,

    nombreCompanero,
    buscarGasto,

    agregarGasto,
    actualizarGasto,
    eliminarGasto,
    vaciarGastos,
    agregarPago,
    eliminarPago,
    agregarCompanero,
    eliminarCompanero,
    guardarCategoria,
    eliminarCategoria,
    comprarProducto,
    guardarProducto,
    eliminarProducto,
  }
}
