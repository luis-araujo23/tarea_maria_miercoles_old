<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Producto } from '../types'
import { useAuth } from '../composables/useAuth'
import { useAppStore } from '../composables/useAppStore'
import EstadoDatos from '../components/EstadoDatos.vue'
import ToastNotificacion from '../components/ToastNotificacion.vue'
import type { UsuarioPublico } from '../composables/useAuth'
import { companeroDeUsuario, companeroPorNombre } from '../utils/perfil'
import { validarCompra, validarProducto } from '../utils/validaciones'

const { usuario, esAdmin, listarUsuarios } = useAuth()
const {
  companeros,
  categorias,
  productos,
  gastos,
  cargando,
  guardando,
  error,
  listo,
  reintentar,
  comprarProducto,
  agregarCompanero,
  guardarProducto,
  eliminarProducto,
} = useAppStore()

const toast = ref({ visible: false, mensaje: '', tipo: 'success' as 'success' | 'error' | 'info' })
let toastTimer: ReturnType<typeof setTimeout> | null = null

function mostrarToast(mensaje: string, tipo: 'success' | 'error' | 'info' = 'success') {
  toast.value = { visible: true, mensaje, tipo }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value.visible = false
  }, 2800)
}

const yo = computed(() => companeroDeUsuario(usuario.value, companeros.value))

const nombreCategoria = (id: string) =>
  categorias.value.find((c) => c.id === id)?.nombre ?? 'Otros materiales'

const comprasDelProducto = (id: string) =>
  gastos.value.filter((g) => g.productoId === id).length

const productoComprando = ref<Producto | null>(null)
const invitados = ref<UsuarioPublico[]>([])
const busqueda = ref('')
const errorCompra = ref('')

function abrirCompra(producto: Producto) {
  if (!yo.value) {
    mostrarToast('No encontramos tu perfil de compañero. El admin debe agregarte al grupo.', 'error')
    return
  }
  productoComprando.value = producto
  invitados.value = []
  busqueda.value = ''
  errorCompra.value = ''
}

function cerrarCompra() {
  productoComprando.value = null
  invitados.value = []
  busqueda.value = ''
  errorCompra.value = ''
}

function esElMismoUsuario(cuenta: UsuarioPublico): boolean {
  if (!usuario.value) return false
  return cuenta.email.toLowerCase() === usuario.value.email.toLowerCase()
}

const resultadosBusqueda = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  if (q.length < 1) return []

  return listarUsuarios().filter((cuenta) => {
    if (esElMismoUsuario(cuenta)) return false
    if (invitados.value.some((i) => i.email === cuenta.email)) return false
    return (
      cuenta.nombreVisible.toLowerCase().includes(q) ||
      cuenta.email.toLowerCase().includes(q) ||
      cuenta.nombre.toLowerCase().includes(q)
    )
  })
})

function agregarInvitado(cuenta: UsuarioPublico) {
  if (invitados.value.some((i) => i.email === cuenta.email)) return
  invitados.value = [...invitados.value, cuenta]
  busqueda.value = ''
  errorCompra.value = ''
}

function quitarInvitado(email: string) {
  invitados.value = invitados.value.filter((i) => i.email !== email)
}

const cuotaEstimada = computed(() => {
  const producto = productoComprando.value
  if (!producto) return 0
  return producto.precio / (invitados.value.length + 1)
})

async function idDeInvitado(cuenta: UsuarioPublico): Promise<string | null> {
  const existente = companeroPorNombre(cuenta.nombreVisible, companeros.value)
  if (existente) return existente.id

  const fallo = await agregarCompanero(cuenta.nombreVisible)
  if (fallo) {
    errorCompra.value = fallo
    return null
  }

  return companeroPorNombre(cuenta.nombreVisible, companeros.value)?.id ?? null
}

async function confirmarCompra() {
  const producto = productoComprando.value
  if (!producto || !yo.value) return

  if (invitados.value.length === 0) {
    errorCompra.value = 'Busca y agrega al menos un usuario registrado para dividir el gasto'
    return
  }

  const ids = [yo.value.id]
  for (const invitado of invitados.value) {
    const id = await idDeInvitado(invitado)
    if (!id) return
    ids.push(id)
  }

  const err = validarCompra(
    producto.id,
    yo.value.id,
    ids,
    productos.value,
    companeros.value,
  )
  if (err) {
    errorCompra.value = err
    return
  }

  const fallo = await comprarProducto({
    productoId: producto.id,
    pagadoPorId: yo.value.id,
    participanteIds: ids,
  })
  if (fallo) {
    errorCompra.value = fallo
    return
  }

  mostrarToast(
    `Compraste ${producto.nombre}. El pago se dividió entre ${ids.length} personas.`,
  )
  cerrarCompra()
}

const showForm = ref(false)
const editando = ref<Producto | null>(null)
const formNombre = ref('')
const formPrecio = ref<number | ''>('')
const formCategoria = ref('')
const formIcono = ref('📦')
const errorForm = ref('')

const ICONOS = ['📄', '✏️', '🖨️', '📓', '📚', '💾', '🔬', '📎', '🎒', '📦']

function abrirForm(producto?: Producto) {
  editando.value = producto ?? null
  formNombre.value = producto?.nombre ?? ''
  formPrecio.value = producto?.precio ?? ''
  formCategoria.value = producto?.categoriaId ?? categorias.value[0]?.id ?? ''
  formIcono.value = producto?.icono ?? '📦'
  errorForm.value = ''
  showForm.value = true
}

function cerrarForm() {
  showForm.value = false
  editando.value = null
}

async function guardarFormProducto() {
  const datos = {
    nombre: formNombre.value,
    precio: typeof formPrecio.value === 'number' ? formPrecio.value : NaN,
    categoriaId: formCategoria.value,
    icono: formIcono.value,
  }
  const err = validarProducto(datos, categorias.value, productos.value, editando.value?.id)
  if (err) {
    errorForm.value = err
    return
  }

  const fallo = await guardarProducto(datos, editando.value?.id)
  if (fallo) {
    errorForm.value = fallo
    return
  }

  mostrarToast(editando.value ? 'Producto actualizado' : 'Producto publicado')
  cerrarForm()
}

async function quitarProducto(id: string) {
  const fallo = await eliminarProducto(id)
  mostrarToast(fallo ?? 'Producto eliminado', fallo ? 'error' : 'success')
}
</script>

<template>
  <EstadoDatos
    :cargando="cargando"
    :error="error"
    :listo="listo"
    @reintentar="reintentar"
  >
    <div class="vista">
      <div class="intro">
        <div>
          <h2>Materiales a la venta</h2>
          <p>
            {{ esAdmin
              ? 'Administra el catálogo. Los usuarios compran y eligen con quién dividir.'
              : 'Elige un producto y con quién lo vas a pagar. El costo se divide en partes iguales.' }}
          </p>
        </div>
        <button v-if="esAdmin" type="button" class="btn-add" :disabled="guardando" @click="abrirForm()">
          + Nuevo producto
        </button>
      </div>

      <p v-if="!esAdmin && !yo" class="aviso">
        Tu cuenta aún no está ligada a un compañero del grupo. No podrás comprar hasta que te agreguen.
      </p>

      <div v-if="productos.length" class="grid">
        <article v-for="producto in productos" :key="producto.id" class="card">
          <div class="card-top">
            <span class="icono">{{ producto.icono }}</span>
            <div>
              <h3>{{ producto.nombre }}</h3>
              <span class="meta">{{ nombreCategoria(producto.categoriaId) }}</span>
            </div>
          </div>
          <div class="card-bottom">
            <span class="precio">${{ producto.precio.toFixed(2) }}</span>
            <span class="meta">{{ comprasDelProducto(producto.id) }} ventas</span>
          </div>
          <div class="acciones">
            <button
              v-if="!esAdmin"
              type="button"
              class="btn-save"
              :disabled="guardando || !yo"
              @click="abrirCompra(producto)"
            >
              Comprar
            </button>
            <template v-else>
              <button type="button" class="btn-cancel" :disabled="guardando" @click="abrirForm(producto)">
                Editar
              </button>
              <button type="button" class="btn-danger" :disabled="guardando" @click="quitarProducto(producto.id)">
                Quitar
              </button>
            </template>
          </div>
        </article>
      </div>

      <div v-else class="empty">
        <p>No hay productos publicados todavía.</p>
      </div>

      <div v-if="productoComprando" class="overlay" @click.self="cerrarCompra">
        <div class="modal">
          <h3>Comprar {{ productoComprando.nombre }}</h3>
          <p class="modal-sub">
            El producto cuesta ${{ productoComprando.precio.toFixed(2) }}. Busca usuarios para dividir y cada uno paga su parte.
          </p>

          <label class="field">
            Buscar usuario
            <input
              v-model="busqueda"
              type="search"
              placeholder="Nombre o correo"
              :disabled="guardando"
              autocomplete="off"
            />
          </label>

          <ul v-if="resultadosBusqueda.length" class="resultados">
            <li v-for="cuenta in resultadosBusqueda" :key="cuenta.email">
              <button type="button" class="resultado" :disabled="guardando" @click="agregarInvitado(cuenta)">
                <span>
                  <strong>{{ cuenta.nombreVisible }}</strong>
                  <small>{{ cuenta.email }}</small>
                </span>
                <span>Agregar</span>
              </button>
            </li>
          </ul>
          <p v-else-if="busqueda.trim()" class="vacio-busqueda">
            No hay usuarios que coincidan con “{{ busqueda.trim() }}”.
          </p>

          <div class="seleccion">
            <span class="chip yo">Tú</span>
            <span v-for="invitado in invitados" :key="invitado.email" class="chip">
              {{ invitado.nombreVisible }}
              <button type="button" class="chip-x" :disabled="guardando" @click="quitarInvitado(invitado.email)">
                ×
              </button>
            </span>
          </div>

          <p class="cuota">Cada uno paga ${{ cuotaEstimada.toFixed(2) }}</p>
          <p v-if="errorCompra" class="error">{{ errorCompra }}</p>
          <div class="form-actions">
            <button type="button" class="btn-cancel" :disabled="guardando" @click="cerrarCompra">Cancelar</button>
            <button type="button" class="btn-save" :disabled="guardando" @click="confirmarCompra">
              {{ guardando ? 'Comprando…' : 'Confirmar compra' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="showForm" class="overlay" @click.self="cerrarForm">
        <div class="modal">
          <h3>{{ editando ? 'Editar producto' : 'Nuevo producto' }}</h3>
          <form @submit.prevent="guardarFormProducto">
            <label class="field">
              Nombre
              <input v-model="formNombre" type="text" :disabled="guardando" />
            </label>
            <label class="field">
              Precio (USD)
              <input v-model.number="formPrecio" type="number" min="0.01" step="0.01" :disabled="guardando" />
            </label>
            <label class="field">
              Categoría
              <select v-model="formCategoria" :disabled="guardando">
                <option v-for="cat in categorias" :key="cat.id" :value="cat.id">{{ cat.nombre }}</option>
              </select>
            </label>
            <div class="field">
              Ícono
              <div class="icon-grid">
                <button
                  v-for="icon in ICONOS"
                  :key="icon"
                  type="button"
                  class="icon-btn"
                  :class="{ selected: formIcono === icon }"
                  @click="formIcono = icon"
                >
                  {{ icon }}
                </button>
              </div>
            </div>
            <p v-if="errorForm" class="error">{{ errorForm }}</p>
            <div class="form-actions">
              <button type="button" class="btn-cancel" :disabled="guardando" @click="cerrarForm">Cancelar</button>
              <button type="submit" class="btn-save" :disabled="guardando">
                {{ guardando ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ToastNotificacion :visible="toast.visible" :mensaje="toast.mensaje" :tipo="toast.tipo" />
    </div>
  </EstadoDatos>
</template>

<style scoped>
.vista {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  padding: 1.5rem;
}

.intro {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}

.intro h2 {
  margin: 0 0 0.3rem;
  font-size: 1.25rem;
}

.intro p,
.modal-sub,
.meta,
.cuota {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.88rem;
}

.aviso,
.error {
  color: var(--color-danger);
  font-size: 0.85rem;
}

.aviso {
  padding: 0.75rem;
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-sm);
  background: #fef2f2;
  margin-bottom: 1rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 1rem;
}

.card {
  padding: 1rem;
  background: var(--color-bg-muted);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
}

.card-top {
  display: flex;
  gap: 0.7rem;
  margin-bottom: 0.75rem;
}

.icono {
  font-size: 1.5rem;
}

.card-top h3 {
  margin: 0 0 0.15rem;
  font-size: 0.95rem;
}

.card-bottom {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.precio {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--ujap-blue);
}

.acciones {
  display: flex;
  gap: 0.4rem;
}

.btn-add,
.btn-save,
.btn-cancel,
.btn-danger {
  padding: 0.5rem 0.85rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.82rem;
  cursor: pointer;
  font-family: inherit;
}

.btn-add,
.btn-save {
  background: var(--ujap-blue);
  color: white;
  border: none;
}

.btn-cancel {
  background: white;
  border: 1px solid var(--color-border);
}

.btn-danger {
  background: transparent;
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty {
  text-align: center;
  padding: 2rem;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 1.4rem;
  width: 90%;
  max-width: 420px;
}

.modal h3 {
  margin: 0 0 0.4rem;
}

.resultados {
  list-style: none;
  margin: 0 0 0.75rem;
  max-height: 180px;
  overflow: auto;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
}

.resultado {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.7rem;
  border: none;
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-bg-muted);
  cursor: pointer;
  font-family: inherit;
  text-align: left;
}

.resultado:last-child {
  border-bottom: none;
}

.resultado small {
  display: block;
  color: var(--color-text-muted);
  font-size: 0.72rem;
}

.vacio-busqueda {
  margin: 0 0 0.75rem;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.seleccion {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--ujap-blue);
  background: var(--color-primary-light);
  border-radius: 999px;
  padding: 0.2rem 0.55rem;
}

.chip.yo {
  color: white;
  background: var(--ujap-blue);
}

.chip-x {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.95rem;
  line-height: 1;
  color: inherit;
}

.cuota {
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-bottom: 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.field input,
.field select {
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: inherit;
}

.icon-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.icon-btn {
  width: 34px;
  height: 34px;
  border: 2px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  background: var(--color-bg-muted);
  cursor: pointer;
}

.icon-btn.selected {
  border-color: var(--ujap-blue);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.75rem;
}
</style>
