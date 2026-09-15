<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Gasto } from '../types'
import { useAppStore } from '../composables/useAppStore'
import GastoCard from '../components/GastoCard.vue'
import ResumenGastos from '../components/ResumenGastos.vue'
import FormularioGasto from '../components/FormularioGasto.vue'
import ModalConfirmacion from '../components/ModalConfirmacion.vue'
import ToastNotificacion from '../components/ToastNotificacion.vue'
import EstadoDatos from '../components/EstadoDatos.vue'
import { validarGasto } from '../utils/validaciones'

const {
  companeros,
  gastos,
  pagos,
  cargando,
  guardando,
  error,
  listo,
  reintentar,
  nombreCompanero,
  agregarGasto,
  actualizarGasto,
  eliminarGasto,
  vaciarGastos,
  agregarPago,
} = useAppStore()

const formularioVisible = ref(false)
const gastoEditando = ref<Gasto | null>(null)

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

function mostrarToast(mensaje: string, tipo: 'success' | 'error' | 'info' = 'success') {
  toast.value = { visible: true, mensaje, tipo }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value.visible = false
  }, 2800)
}

function abrirFormulario(gasto?: Gasto) {
  if (!puedeAgregarGastos.value) {
    mostrarToast('Agrega al menos un companero antes de registrar gastos', 'error')
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

// Se valida antes de llamar al API para dar respuesta inmediata; el servidor
// vuelve a validar por su cuenta antes de guardar.
async function guardarGasto(payload: GastoPayload) {
  const err = validarGasto(payload, companeros.value)
  if (err) {
    mostrarToast(err, 'error')
    return
  }

  const editando = gastoEditando.value
  const fallo = editando
    ? await actualizarGasto(editando.id, payload)
    : await agregarGasto(payload)

  if (fallo) {
    mostrarToast(fallo, 'error')
    return
  }

  mostrarToast(editando ? 'Gasto actualizado correctamente' : 'Gasto agregado correctamente')
  cerrarFormulario()
}

function solicitarEliminarGasto(id: number) {
  const gasto = gastos.value.find((g) => g.id === id)
  confirmacion.value = {
    visible: true,
    titulo: 'Eliminar gasto',
    mensaje: `¿Eliminar "${gasto?.descripcion ?? 'este gasto'}"? Esta accion no se puede deshacer.`,
    confirmarTexto: 'Eliminar',
    onConfirmar: async () => {
      confirmacion.value.visible = false
      const fallo = await eliminarGasto(id)
      mostrarToast(fallo ?? 'Gasto eliminado', fallo ? 'error' : 'success')
    },
  }
}

function editarGasto(id: number) {
  const gasto = gastos.value.find((g) => g.id === id)
  if (gasto) abrirFormulario(gasto)
}

async function registrarPago(payload: {
  deId: string
  paraId: string
  monto: number
  nota?: string
}) {
  const fallo = await agregarPago(payload)
  if (fallo) {
    mostrarToast(fallo, 'error')
    return
  }

  mostrarToast(
    `Pago registrado: ${nombreCompanero(payload.deId)} → ${nombreCompanero(payload.paraId)}`
  )
}

function limpiarGastos() {
  confirmacion.value = {
    visible: true,
    titulo: 'Limpiar registros',
    mensaje: '¿Eliminar todos los gastos? Los pagos registrados se mantendran.',
    confirmarTexto: 'Limpiar todo',
    onConfirmar: async () => {
      confirmacion.value.visible = false
      const fallo = await vaciarGastos()
      mostrarToast(fallo ?? 'Todos los gastos fueron eliminados', fallo ? 'error' : 'success')
    },
  }
}
</script>

<template>
  <EstadoDatos
    :cargando="cargando"
    :error="error"
    :listo="listo"
    :filas="4"
    @reintentar="reintentar"
  >
    <div class="vista-gastos-layout">
      <section class="lista-gastos" aria-labelledby="gastos-title">
        <div class="section-header">
          <div class="section-title-group">
            <h1 id="gastos-title">Gastos del grupo</h1>
            <p class="section-subtitle">Calculo I — Semestre 2026</p>
          </div>
          <span class="badge-count">{{ gastos.length }}</span>
        </div>

        <div v-if="gastos.length === 0" class="empty-state">
          <div class="empty-illustration">📋</div>
          <h3>Sin gastos registrados</h3>
          <p>Agrega copias, lapices, videobeam u otros materiales universitarios.</p>
          <button
            type="button"
            class="btn-cta"
            :disabled="!puedeAgregarGastos || guardando"
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
          :disabled="guardando"
          @click="limpiarGastos"
        >
          {{ guardando ? 'Guardando…' : 'Limpiar todos los gastos' }}
        </button>

        <button
          v-if="puedeAgregarGastos"
          type="button"
          class="fab"
          aria-label="Agregar gasto"
          :disabled="guardando"
          @click="abrirFormulario()"
        >
          +
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
  </EstadoDatos>
</template>

<style scoped>
.vista-gastos-layout {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
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

.btn-cta:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cards-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.btn-clear-list:disabled,
.fab:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

@media (max-width: 768px) {
  .vista-gastos-layout {
    flex-direction: column;
  }

  .fab {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .sidebar {
    width: 100%;
    position: static;
  }
}
</style>
