<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CategoriaMaterial } from '../types'
import { useAppStore } from '../composables/useAppStore'
import { getCategoriaId } from '../utils/categorias'
import ModalConfirmacion from '../components/ModalConfirmacion.vue'
import ToastNotificacion from '../components/ToastNotificacion.vue'

const { gastos, categorias, agregarCategoria, editarCategoria, eliminarCategoria } = useAppStore()

const showToast = ref(false)
const toastMsg = ref('')
const toastTipo = ref<'success' | 'error' | 'info'>('success')

function showSuccess(msg: string) {
  toastMsg.value = msg
  toastTipo.value = 'success'
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 2800)
}

function showError(msg: string) {
  toastMsg.value = msg
  toastTipo.value = 'error'
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 2800)
}

const resumen = computed(() => {
  const totales: Record<string, { total: number; count: number }> = {}

  categorias.value.forEach((cat) => {
    totales[cat.id] = { total: 0, count: 0 }
  })

  gastos.value.forEach((gasto) => {
    const catId = getCategoriaId(gasto.descripcion, categorias.value)
    if (!totales[catId]) {
      totales[catId] = { total: 0, count: 0 }
    }
    totales[catId]!.total += gasto.monto
    totales[catId]!.count += 1
  })

  return categorias.value.map((cat) => ({
    ...cat,
    total: totales[cat.id]?.total ?? 0,
    count: totales[cat.id]?.count ?? 0,
  }))
})

const totalGeneral = computed(() =>
  gastos.value.reduce((acc, g) => acc + g.monto, 0)
)

const showForm = ref(false)
const editando = ref<CategoriaMaterial | null>(null)
const formNombre = ref('')
const formIcono = ref('📎')
const formKeywords = ref('')

const ICONOS = ['📎', '🖨️', '📄', '✏️', '📓', '📚', '💾', '🔬', '🎒', '📐', '🧮', 'Calculator', '🎨', '🔧', '📦', '💡']

function abrirForm(cat?: CategoriaMaterial) {
  editando.value = cat ?? null
  formNombre.value = cat?.nombre ?? ''
  formIcono.value = cat?.icono ?? '📎'
  formKeywords.value = cat?.keywords.join(', ') ?? ''
  showForm.value = true
}

function cerrarForm() {
  showForm.value = false
  editando.value = null
  formNombre.value = ''
  formIcono.value = '📎'
  formKeywords.value = ''
}

function guardarCategoria() {
  const nombre = formNombre.value.trim()
  if (!nombre) {
    showError('Ingresa un nombre para la categoría')
    return
  }

  const keywords = formKeywords.value
    .split(',')
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k.length > 0)

  if (editando.value) {
    editarCategoria(editando.value.id, {
      nombre,
      icono: formIcono.value,
      keywords,
    })
    showSuccess('Categoría actualizada')
  } else {
    agregarCategoria({ nombre, icono: formIcono.value, keywords })
    showSuccess('Categoría creada')
  }
  cerrarForm()
}

const confirmacion = ref({
  visible: false,
  titulo: '',
  mensaje: '',
  onConfirmar: () => {},
})

function solicitarEliminar(cat: CategoriaMaterial) {
  const gastosAsociados = gastos.value.filter(
    (g) => getCategoriaId(g.descripcion, categorias.value) === cat.id
  ).length

  confirmacion.value = {
    visible: true,
    titulo: 'Eliminar categoría',
    mensaje: gastosAsociados > 0
      ? `¿Eliminar "${cat.nombre}"? Hay ${gastosAsociados} gasto(s) asociados. Pasarán a "Otros materiales".`
      : `¿Eliminar "${cat.nombre}"? Esta acción no se puede deshacer.`,
    onConfirmar: () => {
      eliminarCategoria(cat.id)
      showSuccess('Categoría eliminada')
      confirmacion.value.visible = false
    },
  }
}
</script>

<template>
  <div class="vista-materiales">
    <div class="intro">
      <h2>Resumen por material</h2>
      <p>Gastos universitarios agrupados por categoría.</p>
      <button type="button" class="btn-add" @click="abrirForm()">+ Nueva categoría</button>
    </div>

    <div v-if="resumen.length" class="grid">
      <article v-for="cat in resumen" :key="cat.id" class="card">
        <div class="card-top">
          <span class="icono">{{ cat.icono }}</span>
          <div>
            <h3>{{ cat.nombre }}</h3>
            <span class="count">{{ cat.count }} {{ cat.count === 1 ? 'gasto' : 'gastos' }}</span>
          </div>
          <div class="card-actions">
            <button type="button" class="btn-icon" title="Editar" @click="abrirForm(cat)">✏️</button>
            <button type="button" class="btn-icon btn-danger" title="Eliminar" @click="solicitarEliminar(cat)">🗑️</button>
          </div>
        </div>
        <div class="card-bottom">
          <span class="total">${{ cat.total.toFixed(2) }}</span>
          <span class="pct">
            {{ totalGeneral > 0 ? Math.round((cat.total / totalGeneral) * 100) : 0 }}% del total
          </span>
        </div>
        <div class="bar">
          <div
            class="bar-fill"
            :style="{ width: `${totalGeneral > 0 ? (cat.total / totalGeneral) * 100 : 0}%` }"
          />
        </div>
      </article>
    </div>

    <div v-else class="empty">
      <p>No hay categorías registradas aún. Agrega una para empezar.</p>
    </div>

    <div v-if="showForm" class="modal-overlay" @click.self="cerrarForm">
      <div class="modal-card">
        <h3>{{ editando ? 'Editar categoría' : 'Nueva categoría' }}</h3>
        <form @submit.prevent="guardarCategoria">
          <div class="field">
            <label for="cat-nombre">Nombre</label>
            <input id="cat-nombre" v-model="formNombre" type="text" placeholder="Ej: Impresiones" />
          </div>
          <div class="field">
            <label>Ícono</label>
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
          <div class="field">
            <label for="cat-keywords">Palabras clave (separadas por coma)</label>
            <input id="cat-keywords" v-model="formKeywords" type="text" placeholder="copia, impresión, xerox" />
          </div>
          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="cerrarForm">Cancelar</button>
            <button type="submit" class="btn-save">{{ editando ? 'Guardar' : 'Crear' }}</button>
          </div>
        </form>
      </div>
    </div>

    <ModalConfirmacion
      :visible="confirmacion.visible"
      :titulo="confirmacion.titulo"
      :mensaje="confirmacion.mensaje"
      confirmar-texto="Eliminar"
      @confirmar="confirmacion.onConfirmar()"
      @cancelar="confirmacion.visible = false"
    />

    <ToastNotificacion
      :visible="showToast"
      :mensaje="toastMsg"
      :tipo="toastTipo"
    />
  </div>
</template>

<style scoped>
.vista-materiales {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  padding: 1.5rem;
}

.intro {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.intro h2 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--color-heading);
}

.intro p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.btn-add {
  padding: 0.5rem 1rem;
  background: var(--ujap-blue);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  font-family: inherit;
}

.btn-add:hover {
  background: var(--ujap-blue-dark);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}

.card {
  padding: 1rem;
  background: var(--color-bg-muted);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
}

.card-top {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.icono {
  font-size: 1.5rem;
}

.card-top h3 {
  margin: 0 0 0.15rem;
  font-size: 0.95rem;
  color: var(--color-heading);
}

.count {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.card-actions {
  margin-left: auto;
  display: flex;
  gap: 0.25rem;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0.2rem;
  border-radius: var(--radius-sm);
  transition: background var(--transition);
}

.btn-icon:hover {
  background: var(--color-border-light);
}

.btn-icon.btn-danger:hover {
  background: rgba(210, 35, 42, 0.1);
}

.card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.5rem;
}

.total {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--ujap-blue);
}

.pct {
  font-size: 0.75rem;
  color: var(--color-text-light);
}

.bar {
  height: 4px;
  background: var(--color-border-light);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: var(--ujap-gold);
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

.empty {
  text-align: center;
  padding: 2.5rem 1rem;
  color: var(--color-text-muted);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  width: 90%;
  max-width: 420px;
  box-shadow: var(--shadow-lg);
}

.modal-card h3 {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  color: var(--color-heading);
}

.field {
  margin-bottom: 0.85rem;
}

.field label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
  margin-bottom: 0.3rem;
}

.field input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.9rem;
}

.field input:focus {
  outline: none;
  border-color: var(--ujap-blue);
}

.icon-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.icon-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  background: var(--color-bg-muted);
  cursor: pointer;
  font-size: 1rem;
}

.icon-btn.selected {
  border-color: var(--ujap-blue);
  background: var(--color-primary-light);
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.btn-cancel,
.btn-save {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  border: none;
  font-family: inherit;
}

.btn-cancel {
  background: white;
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-save {
  background: var(--ujap-blue);
  color: white;
}
</style>
