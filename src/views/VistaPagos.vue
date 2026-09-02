<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppStore } from '../composables/useAppStore'
import { calcularBalances, simplificarDeudas } from '../utils/balances'
import { obtenerDeudaEntre, validarPago } from '../utils/validaciones'
import ModalConfirmacion from '../components/ModalConfirmacion.vue'
import ToastNotificacion from '../components/ToastNotificacion.vue'

const { gastos, pagos, companeros, nextPagoId, nombreCompanero } = useAppStore()

const deId = ref('')
const paraId = ref('')
const montoPago = ref<number | ''>('')
const notaPago = ref('')
const errorPago = ref('')

const toast = ref({ visible: false, mensaje: '', tipo: 'success' as 'success' | 'error' | 'info' })
let toastTimer: ReturnType<typeof setTimeout> | null = null

function mostrarToast(mensaje: string, tipo: 'success' | 'error' | 'info' = 'success') {
  toast.value = { visible: true, mensaje, tipo }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value.visible = false }, 2800)
}

const balances = computed(() =>
  calcularBalances(gastos.value, pagos.value, companeros.value)
)

const deudasSimplificadas = computed(() => simplificarDeudas(balances.value))

const pagosOrdenados = computed(() =>
  [...pagos.value].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  )
)

function nombre(id: string): string {
  return nombreCompanero(id)
}

function formatearFecha(fecha: string): string {
  const [y, m, d] = fecha.split('-')
  return `${d}/${m}/${y}`
}

function abrirFormPago(de?: string, para?: string, monto?: number) {
  if (companeros.value.length < 2) {
    mostrarToast('Se necesitan al menos 2 compañeros para registrar un pago', 'error')
    return
  }
  deId.value = de ?? companeros.value[0]?.id ?? ''
  paraId.value = para ?? companeros.value[1]?.id ?? ''
  montoPago.value = monto ?? ''
  notaPago.value = ''
  errorPago.value = ''
}

const deudaActual = computed(() =>
  obtenerDeudaEntre(deId.value, paraId.value, deudasSimplificadas.value)
)

const formularioVisible = computed(() => deId.value !== '' || paraId.value !== '' || montoPago.value !== '')

function cancelarForm() {
  deId.value = ''
  paraId.value = ''
  montoPago.value = ''
  notaPago.value = ''
  errorPago.value = ''
}

const confirmacion = ref({
  visible: false,
  titulo: '',
  mensaje: '',
  confirmarTexto: 'Confirmar',
  onConfirmar: () => {},
})

function registrarPago() {
  errorPago.value = ''
  const monto = montoPago.value

  const err = validarPago(
    deId.value,
    paraId.value,
    typeof monto === 'number' ? monto : NaN,
    companeros.value,
    deudasSimplificadas.value
  )
  if (err) {
    errorPago.value = err
    return
  }

  pagos.value.unshift({
    id: nextPagoId.value++,
    deId: deId.value,
    paraId: paraId.value,
    monto: monto as number,
    fecha: new Date().toISOString().slice(0, 10),
    nota: notaPago.value.trim() || undefined,
  })
  mostrarToast(
    `Pago registrado: ${nombre(deId.value)} → ${nombre(paraId.value)}`
  )
  cancelarForm()
}

function solicitarEliminarPago(id: number) {
  const pago = pagos.value.find((p) => p.id === id)
  confirmacion.value = {
    visible: true,
    titulo: 'Eliminar pago',
    mensaje: `¿Eliminar el pago de $${pago?.monto.toFixed(2)} de ${nombre(pago?.deId ?? '')} a ${nombre(pago?.paraId ?? '')}?`,
    confirmarTexto: 'Eliminar',
    onConfirmar: () => {
      pagos.value = pagos.value.filter((p) => p.id !== id)
      mostrarToast('Pago eliminado')
      confirmacion.value.visible = false
    },
  }
}
</script>

<template>
  <div class="vista-pagos">
    <div class="section-header">
      <div>
        <h2>Pagos del grupo</h2>
        <p class="section-subtitle">Registra y consulta los pagos entre compañeros</p>
      </div>
      <button
        v-if="companeros.length >= 2 && deudasSimplificadas.length > 0"
        type="button"
        class="btn-add"
        @click="abrirFormPago()"
      >
        + Registrar pago
      </button>
    </div>

    <div v-if="companeros.length < 2" class="empty">
      <p>Necesitas al menos 2 compañeros para registrar pagos.</p>
    </div>

    <template v-else>
      <div v-if="formularioVisible" class="form-card">
        <h3>{{ deudaActual > 0 ? `Deuda pendiente: $${deudaActual.toFixed(2)}` : 'Nuevo pago' }}</h3>
        <form @submit.prevent="registrarPago">
          <div class="form-grid">
            <div class="field">
              <label for="de">Quién paga</label>
              <select id="de" v-model="deId">
                <option v-for="c in companeros" :key="c.id" :value="c.id">{{ c.nombre }}</option>
              </select>
            </div>
            <div class="field">
              <label for="para">Quién recibe</label>
              <select id="para" v-model="paraId">
                <option v-for="c in companeros" :key="c.id" :value="c.id">{{ c.nombre }}</option>
              </select>
            </div>
            <div class="field">
              <label for="monto">Monto ($)</label>
              <input
                id="monto"
                v-model.number="montoPago"
                type="number"
                min="0.01"
                :max="deudaActual > 0 ? deudaActual : undefined"
                step="0.01"
              />
              <span v-if="deudaActual > 0" class="deuda-hint">
                Deuda pendiente: ${{ deudaActual.toFixed(2) }}
              </span>
            </div>
            <div class="field">
              <label for="nota">Nota (opcional)</label>
              <input id="nota" v-model="notaPago" type="text" placeholder="Ej: Transferencia" />
            </div>
          </div>
          <p v-if="errorPago" class="error">{{ errorPago }}</p>
          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="cancelarForm">Cancelar</button>
            <button type="submit" class="btn-save" :disabled="deudaActual <= 0">Confirmar pago</button>
          </div>
        </form>
      </div>

      <div v-if="deudasSimplificadas.length > 0" class="deudas-section">
        <h3 class="section-title">Quién le debe a quién</h3>
        <ul class="deuda-list">
          <li v-for="(deuda, i) in deudasSimplificadas" :key="i" class="deuda-item">
            <span class="deuda-text">
              <strong>{{ nombre(deuda.deId) }}</strong> le debe
              <strong>${{ deuda.monto.toFixed(2) }}</strong> a
              <strong>{{ nombre(deuda.paraId) }}</strong>
            </span>
            <button
              type="button"
              class="btn-settle"
              @click="abrirFormPago(deuda.deId, deuda.paraId, deuda.monto)"
            >
              Registrar pago
            </button>
          </li>
        </ul>
      </div>

      <div v-else-if="gastos.length > 0" class="settled">
        <span>✓</span> ¡Todos están a mano!
      </div>

      <div v-if="pagosOrdenados.length > 0" class="historial-section">
        <h3 class="section-title">Historial de pagos</h3>
        <ul class="historial-list">
          <li v-for="pago in pagosOrdenados" :key="pago.id" class="historial-item">
            <div class="historial-info">
              <span class="historial-text">
                {{ nombre(pago.deId) }} pagó ${{ pago.monto.toFixed(2) }} a {{ nombre(pago.paraId) }}
              </span>
              <span v-if="pago.nota" class="historial-nota">{{ pago.nota }}</span>
            </div>
            <div class="historial-right">
              <span class="historial-fecha">{{ formatearFecha(pago.fecha) }}</span>
              <button type="button" class="btn-icon btn-danger" title="Eliminar" @click="solicitarEliminarPago(pago.id)">🗑️</button>
            </div>
          </li>
        </ul>
      </div>

      <div v-else-if="gastos.length === 0" class="empty">
        <p>Registra gastos primero para poder registrar pagos.</p>
      </div>
    </template>

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
.vista-pagos {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  padding: 1.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.section-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--color-heading);
}

.section-subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: var(--color-text-muted);
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

.form-card {
  background: var(--color-bg-muted);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.form-card h3 {
  margin: 0 0 1rem;
  font-size: 1rem;
  color: var(--color-heading);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}

@media (max-width: 600px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.field {
  display: flex;
  flex-direction: column;
}

.field label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
  margin-bottom: 0.3rem;
}

.field input,
.field select {
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.9rem;
}

.field input:focus,
.field select:focus {
  outline: none;
  border-color: var(--ujap-blue);
}

.deuda-hint {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--ujap-blue);
}

.error {
  color: var(--ujap-red);
  font-size: 0.8rem;
  margin: 0.75rem 0 0;
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

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.section-title {
  margin: 0 0 0.85rem;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.deudas-section,
.historial-section {
  margin-bottom: 1.5rem;
}

.deuda-list,
.historial-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.deuda-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--color-bg-muted);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-light);
}

.deuda-text {
  font-size: 0.875rem;
  color: var(--color-text);
}

.btn-settle {
  padding: 0.4rem 0.75rem;
  background: var(--ujap-gold);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.settled {
  padding: 1rem;
  text-align: center;
  color: var(--color-positive);
  font-weight: 600;
  font-size: 0.9rem;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  background: var(--color-bg-muted);
  margin-bottom: 1.5rem;
}

.historial-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--color-bg-muted);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-light);
}

.historial-info {
  display: flex;
  flex-direction: column;
}

.historial-text {
  font-size: 0.85rem;
  color: var(--color-heading);
  font-weight: 500;
}

.historial-nota {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 0.15rem;
}

.historial-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.historial-fecha {
  font-size: 0.72rem;
  color: var(--color-text-light);
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0.2rem;
  border-radius: var(--radius-sm);
}

.btn-icon.btn-danger:hover {
  background: rgba(210, 35, 42, 0.1);
}

.empty {
  text-align: center;
  padding: 2.5rem 1rem;
  color: var(--color-text-muted);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
}
</style>
