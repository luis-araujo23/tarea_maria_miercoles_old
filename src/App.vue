<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Gasto, VistaApp } from './types'
import { useAppStore } from './composables/useAppStore'
import GastoCard from './components/GastoCard.vue'
import ResumenGastos from './components/ResumenGastos.vue'
import UjapLogo from './components/UjapLogo.vue'
import FormularioGasto from './components/FormularioGasto.vue'
import VistaCompaneros from './components/VistaCompaneros.vue'
import VistaMateriales from './components/VistaMateriales.vue'
import ToastNotificacion from './components/ToastNotificacion.vue'
import ModalConfirmacion from './components/ModalConfirmacion.vue'
import { validarGasto, validarNombreCompanero } from './utils/validaciones'

const {
  companeros,
  gastos,
  pagos,
  nextGastoId,
  nextPagoId,
  nextCompaneroId,
  nombreCompanero,
} = useAppStore()

const vistaActiva = ref<VistaApp>('gastos')
const formularioVisible = ref(false)
const gastoEditando = ref<Gasto | null>(null)
const nombreNuevoCompanero = ref('')

const toast = ref({ visible: false, mensaje: '', tipo: 'success' as 'success' | 'error' | 'info' })
let toastTimer: ReturnType<typeof setTimeout> | null = null

const confirmacion = ref({
  visible: false,
  titulo: '',
  mensaje: '',
  confirmarTexto: 'Confirmar',
  onConfirmar: () => {},
})

const puedeAgregarGastos = computed(() => companeros.value.length > 0)

const gastosOrdenados = computed(() =>
  [...gastos.value].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  )
)

const navItems: { id: VistaApp; label: string }[] = [
  { id: 'gastos', label: 'Gastos' },
  { id: 'companeros', label: 'Compañeros' },
  { id: 'materiales', label: 'Materiales' },
]

function mostrarToast(mensaje: string, tipo: 'success' | 'error' | 'info' = 'success') {
  toast.value = { visible: true, mensaje, tipo }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value.visible = false
  }, 2800)
}

function abrirFormulario(gasto?: Gasto) {
  if (!puedeAgregarGastos.value) {
    mostrarToast('Agrega al menos un compañero antes de registrar gastos', 'error')
    return
  }
  gastoEditando.value = gasto ?? null
  formularioVisible.value = true
}

function cerrarFormulario() {
  formularioVisible.value = false
  gastoEditando.value = null
}

type GastoPayload = Omit<Gasto, 'id'>

function guardarGasto(payload: GastoPayload) {
  const err = validarGasto(payload, companeros.value)
  if (err) {
    mostrarToast(err, 'error')
    return
  }

  if (gastoEditando.value) {
    const idx = gastos.value.findIndex((g) => g.id === gastoEditando.value!.id)
    if (idx >= 0) {
      gastos.value[idx] = { ...gastoEditando.value, ...payload }
    }
    mostrarToast('Gasto actualizado correctamente')
  } else {
    gastos.value.unshift({ id: nextGastoId.value++, ...payload })
    mostrarToast('Gasto agregado correctamente')
  }
  cerrarFormulario()
}

function solicitarEliminarGasto(id: number) {
  const gasto = gastos.value.find((g) => g.id === id)
  confirmacion.value = {
    visible: true,
    titulo: 'Eliminar gasto',
    mensaje: `¿Eliminar "${gasto?.descripcion ?? 'este gasto'}"? Esta acción no se puede deshacer.`,
    confirmarTexto: 'Eliminar',
    onConfirmar: () => {
      gastos.value = gastos.value.filter((g) => g.id !== id)
      mostrarToast('Gasto eliminado')
      confirmacion.value.visible = false
    },
  }
}

function editarGasto(id: number) {
  const gasto = gastos.value.find((g) => g.id === id)
  if (gasto) abrirFormulario(gasto)
}

function registrarPago(payload: {
  deId: string
  paraId: string
  monto: number
  nota?: string
}) {
  pagos.value.unshift({
    id: nextPagoId.value++,
    deId: payload.deId,
    paraId: payload.paraId,
    monto: payload.monto,
    fecha: new Date().toISOString().slice(0, 10),
    nota: payload.nota,
  })
  mostrarToast(
    `Pago registrado: ${nombreCompanero(payload.deId)} → ${nombreCompanero(payload.paraId)}`
  )
}

function agregarCompanero(nombre: string) {
  const err = validarNombreCompanero(nombre)
  if (err) {
    mostrarToast(err, 'error')
    return
  }
  if (companeros.value.some((c) => c.nombre.toLowerCase() === nombre.toLowerCase())) {
    mostrarToast('Ese compañero ya existe', 'error')
    return
  }
  const id = `c${nextCompaneroId.value++}`
  companeros.value.push({ id, nombre: nombre.trim() })
  mostrarToast(`${nombre.trim()} agregado al grupo`)
}

function solicitarEliminarCompanero(id: string) {
  const nombre = nombreCompanero(id)

  if (companeros.value.length <= 1) {
    mostrarToast('Debe quedar al menos un compañero en el grupo', 'error')
    return
  }

  const usadoEnGastos = gastos.value.some(
    (g) => g.pagadoPorId === id || g.divisiones.some((d) => d.companeroId === id)
  )
  const usadoEnPagos = pagos.value.some((p) => p.deId === id || p.paraId === id)

  if (usadoEnGastos) {
    mostrarToast('No puedes eliminar a alguien con gastos asociados', 'error')
    return
  }
  if (usadoEnPagos) {
    mostrarToast('No puedes eliminar a alguien con pagos registrados', 'error')
    return
  }

  confirmacion.value = {
    visible: true,
    titulo: 'Eliminar compañero',
    mensaje: `¿Eliminar a ${nombre} del grupo?`,
    confirmarTexto: 'Eliminar',
    onConfirmar: () => {
      companeros.value = companeros.value.filter((c) => c.id !== id)
      mostrarToast(`${nombre} eliminado del grupo`)
      confirmacion.value.visible = false
    },
  }
}

function limpiarGastos() {
  confirmacion.value = {
    visible: true,
    titulo: 'Limpiar registros',
    mensaje: '¿Eliminar todos los gastos? Los pagos registrados se mantendrán.',
    confirmarTexto: 'Limpiar todo',
    onConfirmar: () => {
      gastos.value = []
      mostrarToast('Todos los gastos fueron eliminados')
      confirmacion.value.visible = false
    },
  }
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div class="header-inner">
        <div class="brand">
          <UjapLogo :size="40" />
          <div class="brand-text">
            <span class="brand-ujap">UJAP Split</span>
            <span class="brand-sub">Gastos del Semestre</span>
          </div>
        </div>
        <nav class="header-nav" aria-label="Navegación principal">
          <button
            v-for="item in navItems"
            :key="item.id"
            type="button"
            class="nav-item"
            :class="{ active: vistaActiva === item.id }"
            @click="vistaActiva = item.id"
          >
            {{ item.label }}
          </button>
        </nav>
        <button
          v-if="vistaActiva === 'gastos'"
          type="button"
          class="btn-add-header"
          :disabled="!puedeAgregarGastos"
          @click="abrirFormulario()"
        >
          + Agregar gasto
        </button>
      </div>
    </header>

    <main class="main-content">
      <!-- Vista Gastos -->
      <template v-if="vistaActiva === 'gastos'">
        <section class="lista-gastos" aria-labelledby="gastos-title">
          <div class="section-header">
            <div class="section-title-group">
              <h1 id="gastos-title">Gastos del grupo</h1>
              <p class="section-subtitle">Cálculo I — Semestre 2026</p>
            </div>
            <span class="badge-count">{{ gastos.length }}</span>
          </div>

          <div v-if="gastos.length === 0" class="empty-state">
            <div class="empty-illustration">📋</div>
            <h3>Sin gastos registrados</h3>
            <p>Agrega copias, lápices, videobeam u otros materiales universitarios.</p>
            <button
              type="button"
              class="btn-cta"
              :disabled="!puedeAgregarGastos"
              @click="abrirFormulario()"
            >
              + Agregar primer gasto
            </button>
          </div>

          <div v-else class="cards-container">
            <GastoCard
              v-for="gasto in gastosOrdenados"
              :key="gasto.id"
              :gasto="gasto"
              :companeros="companeros"
              @editar="editarGasto"
              @eliminar="solicitarEliminarGasto"
            />
          </div>

          <button
            v-if="gastos.length > 0"
            type="button"
            class="btn-clear-list"
            @click="limpiarGastos"
          >
            Limpiar todos los gastos
          </button>
        </section>

        <aside class="sidebar">
          <ResumenGastos
            :gastos="gastos"
            :pagos="pagos"
            :companeros="companeros"
            @registrar-pago="registrarPago"
          />
        </aside>
      </template>

      <!-- Vista Compañeros -->
      <div v-else-if="vistaActiva === 'companeros'" class="vista-full">
        <VistaCompaneros
          v-model:nombre-nuevo="nombreNuevoCompanero"
          :companeros="companeros"
          @agregar="agregarCompanero"
          @eliminar="solicitarEliminarCompanero"
        />
      </div>

      <!-- Vista Materiales -->
      <div v-else-if="vistaActiva === 'materiales'" class="vista-full">
        <VistaMateriales :gastos="gastos" :companeros="companeros" />
      </div>
    </main>

    <button
      v-if="vistaActiva === 'gastos' && puedeAgregarGastos"
      type="button"
      class="fab"
      aria-label="Agregar gasto"
      @click="abrirFormulario()"
    >
      +
    </button>

    <footer class="app-footer">
      <div class="footer-inner">
        <UjapLogo :size="28" />
        <p class="footer-copy">
          UJAP · Proyecto académico · Ingeniería de Software · {{ new Date().getFullYear() }}
        </p>
      </div>
    </footer>

    <FormularioGasto
      :visible="formularioVisible"
      :companeros="companeros"
      :gasto-editar="gastoEditando"
      @cerrar="cerrarFormulario"
      @guardar="guardarGasto"
    />

    <ModalConfirmacion
      :visible="confirmacion.visible"
      :titulo="confirmacion.titulo"
      :mensaje="confirmacion.mensaje"
      :confirmar-texto="confirmacion.confirmarTexto"
      @confirmar="confirmacion.onConfirmar()"
      @cancelar="confirmacion.visible = false"
    />

    <ToastNotificacion
      :visible="toast.visible"
      :mensaje="toast.mensaje"
      :tipo="toast.tipo"
    />
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding-bottom: 4rem;
}

.app-header {
  background: var(--color-bg-card);
  border-bottom: 3px solid var(--ujap-red);
  box-shadow: var(--shadow-header);
  position: sticky;
  top: 0;
  z-index: 100;
}

.app-header::before {
  content: '';
  display: block;
  height: 4px;
  background: var(--ujap-gold);
}

.header-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.brand-ujap {
  font-family: var(--font-serif);
  font-size: 1rem;
  font-weight: 700;
  color: var(--ujap-red);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.brand-sub {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--ujap-blue);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.header-nav {
  display: flex;
  gap: 0.25rem;
}

.nav-item {
  padding: 0.45rem 0.85rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-muted);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition), color var(--transition);
  border: none;
  background: transparent;
  font-family: inherit;
}

.nav-item.active {
  background: var(--color-primary-light);
  color: var(--ujap-blue);
}

.btn-add-header {
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

.btn-add-header:disabled,
.btn-cta:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.main-content {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.25rem 1.5rem 2rem;
  display: flex;
  gap: 2rem;
  align-items: flex-start;
  flex: 1;
  width: 100%;
}

.vista-full {
  flex: 1;
  width: 100%;
}

.lista-gastos {
  flex: 2;
  min-width: 0;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.section-title-group h1 {
  margin: 0 0 0.25rem;
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--color-heading);
}

.section-subtitle {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-light);
}

.badge-count {
  background: var(--ujap-blue);
  color: white;
  min-width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0 0.5rem;
}

.empty-state {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 2.5rem 2rem;
  text-align: center;
  border: 2px dashed var(--color-border);
}

.empty-illustration {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}

.empty-state h3 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  color: var(--color-heading);
}

.empty-state p {
  margin: 0 0 1.25rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.btn-cta {
  padding: 0.75rem 1.5rem;
  background: var(--ujap-blue);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.cards-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.btn-clear-list {
  margin-top: 1rem;
  width: 100%;
  padding: 0.65rem;
  background: transparent;
  border: 1.5px solid var(--color-danger);
  color: var(--color-danger);
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  font-family: inherit;
}

.sidebar {
  flex: 1;
  min-width: 280px;
  position: sticky;
  top: 4.5rem;
}

.fab {
  display: none;
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  background: var(--ujap-blue);
  color: white;
  border: none;
  font-size: 1.75rem;
  font-weight: 300;
  cursor: pointer;
  box-shadow: var(--shadow-lg);
  z-index: 50;
  line-height: 1;
}

.app-footer {
  margin-top: auto;
  background: var(--ujap-blue-dark);
  color: rgba(255, 255, 255, 0.7);
  padding: 1rem 1.5rem;
}

.footer-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.footer-copy {
  margin: 0;
  font-size: 0.75rem;
}

@media (max-width: 768px) {
  .btn-add-header {
    display: none;
  }

  .fab {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .main-content {
    flex-direction: column;
    padding: 1rem;
  }

  .sidebar {
    width: 100%;
    position: static;
  }

  .header-nav {
    order: 3;
    width: 100%;
    justify-content: center;
  }
}
</style>
