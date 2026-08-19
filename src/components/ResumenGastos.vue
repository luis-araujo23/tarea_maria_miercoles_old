<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Companero, Gasto, Pago } from '../types'
import { getAvatarColor, getInitials } from '../utils/avatars'
import { calcularBalances, simplificarDeudas } from '../utils/balances'

const props = defineProps<{
  gastos: Gasto[]
  pagos: Pago[]
  companeros: Companero[]
}>()

const emit = defineEmits<{
  'registrar-pago': [payload: { deId: string; paraId: string; monto: number; nota?: string }]
}>()

const mostrarFormPago = ref(false)
const deId = ref('')
const paraId = ref('')
const montoPago = ref<number | ''>('')
const notaPago = ref('')
const errorPago = ref('')

const total = computed(() =>
  props.gastos.reduce((acc, gasto) => acc + gasto.monto, 0)
)

const balances = computed(() =>
  calcularBalances(props.gastos, props.pagos, props.companeros)
)

const deudasSimplificadas = computed(() => simplificarDeudas(balances.value))

const pagosOrdenados = computed(() =>
  [...props.pagos].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  )
)

function nombre(id: string): string {
  return props.companeros.find((c) => c.id === id)?.nombre ?? 'Desconocido'
}

function formatearFecha(fecha: string): string {
  const [y, m, d] = fecha.split('-')
  return `${d}/${m}/${y}`
}

function abrirFormPago(de?: string, para?: string, monto?: number) {
  deId.value = de ?? props.companeros[0]?.id ?? ''
  paraId.value = para ?? props.companeros[1]?.id ?? ''
  montoPago.value = monto ?? ''
  notaPago.value = ''
  errorPago.value = ''
  mostrarFormPago.value = true
}

function registrarPago() {
  errorPago.value = ''
  if (!deId.value || !paraId.value) {
    errorPago.value = 'Selecciona quién paga y quién recibe'
    return
  }
  if (deId.value === paraId.value) {
    errorPago.value = 'El pagador y receptor deben ser distintos'
    return
  }
  if (typeof montoPago.value !== 'number' || montoPago.value <= 0) {
    errorPago.value = 'Ingresa un monto válido'
    return
  }

  emit('registrar-pago', {
    deId: deId.value,
    paraId: paraId.value,
    monto: montoPago.value,
    nota: notaPago.value.trim() || undefined,
  })
  mostrarFormPago.value = false
}
</script>

<template>
  <div class="resumen">
    <div class="resumen-header">
      <h2>Balance del grupo</h2>
      <span class="resumen-badge">Compañeros</span>
    </div>

    <div class="total-card">
      <span class="total-label">Total del semestre</span>
      <span class="total-amount">${{ total.toFixed(2) }}</span>
      <span class="total-meta">
        {{ gastos.length }} {{ gastos.length === 1 ? 'movimiento' : 'movimientos' }}
        · {{ companeros.length }} {{ companeros.length === 1 ? 'persona' : 'personas' }}
      </span>
    </div>

    <div v-if="balances.length > 0 && gastos.length > 0" class="balances">
      <h3 class="section-title">Saldos individuales</h3>
      <ul class="balance-list">
        <li v-for="item in balances" :key="item.companeroId" class="balance-item">
          <div class="balance-person">
            <span
              class="avatar"
              :style="{ backgroundColor: getAvatarColor(nombre(item.companeroId)) }"
            >
              {{ getInitials(nombre(item.companeroId)) }}
            </span>
            <div class="balance-info">
              <span class="balance-name">{{ nombre(item.companeroId) }}</span>
              <span class="balance-paid">Pagó ${{ item.pagado.toFixed(2) }}</span>
            </div>
          </div>
          <span
            class="balance-value"
            :class="item.balance >= 0 ? 'positive' : 'negative'"
          >
            {{ item.balance >= 0 ? '+' : '' }}${{ item.balance.toFixed(2) }}
          </span>
        </li>
      </ul>
      <p class="balance-hint">
        Positivo = le deben dinero · Negativo = debe dinero
      </p>
    </div>

    <div v-if="deudasSimplificadas.length > 0" class="deudas">
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

    <div v-else-if="gastos.length > 0 && balances.length > 0" class="settled">
      <span>✓</span> ¡Todos están a mano!
    </div>

    <div class="settle-section">
      <button type="button" class="btn-settle-main" @click="abrirFormPago()">
        Registrar pago
      </button>

      <form v-if="mostrarFormPago" class="pago-form" @submit.prevent="registrarPago">
        <div class="field">
          <label>Quién paga</label>
          <select v-model="deId">
            <option v-for="c in companeros" :key="c.id" :value="c.id">{{ c.nombre }}</option>
          </select>
        </div>
        <div class="field">
          <label>Quién recibe</label>
          <select v-model="paraId">
            <option v-for="c in companeros" :key="c.id" :value="c.id">{{ c.nombre }}</option>
          </select>
        </div>
        <div class="field">
          <label>Monto ($)</label>
          <input v-model.number="montoPago" type="number" min="0.01" step="0.01" />
        </div>
        <div class="field">
          <label>Nota (opcional)</label>
          <input v-model="notaPago" type="text" placeholder="Ej: Transferencia" />
        </div>
        <p v-if="errorPago" class="error">{{ errorPago }}</p>
        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="mostrarFormPago = false">
            Cancelar
          </button>
          <button type="submit" class="btn-save">Confirmar pago</button>
        </div>
      </form>
    </div>

    <div v-if="pagosOrdenados.length > 0" class="historial">
      <h3 class="section-title">Historial de pagos</h3>
      <ul class="historial-list">
        <li v-for="pago in pagosOrdenados" :key="pago.id" class="historial-item">
          <div>
            <span class="historial-text">
              {{ nombre(pago.deId) }} pagó ${{ pago.monto.toFixed(2) }} a {{ nombre(pago.paraId) }}
            </span>
            <span v-if="pago.nota" class="historial-nota">{{ pago.nota }}</span>
          </div>
          <span class="historial-fecha">{{ formatearFecha(pago.fecha) }}</span>
        </li>
      </ul>
    </div>

    <div v-if="gastos.length === 0" class="empty-balance">
      <div class="empty-icon">📊</div>
      <p>Registra copias, lápices, videobeam u otros gastos para ver el balance.</p>
    </div>
  </div>
</template>

<style scoped>
.resumen {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.resumen-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(135deg, var(--ujap-blue) 0%, var(--ujap-blue-light) 100%);
  color: white;
}

.resumen-header h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
}

.resumen-badge {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  background: rgba(255, 255, 255, 0.15);
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-full);
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.total-card {
  padding: 1.5rem;
  text-align: center;
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-bg-muted);
}

.total-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
  margin-bottom: 0.35rem;
}

.total-amount {
  display: block;
  font-size: 2.25rem;
  font-weight: 800;
  color: var(--color-primary);
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.total-meta {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--color-text-light);
}

.balances,
.deudas,
.settle-section,
.historial {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border-light);
}

.section-title {
  margin: 0 0 0.85rem;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.balance-list,
.deuda-list,
.historial-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.balance-item,
.deuda-item,
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

.balance-person {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.balance-info {
  display: flex;
  flex-direction: column;
}

.balance-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-heading);
}

.balance-paid {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.balance-value {
  font-size: 0.95rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.balance-value.positive {
  color: var(--color-positive);
}

.balance-value.negative {
  color: var(--color-negative);
}

.balance-hint {
  margin: 0.75rem 0 0;
  font-size: 0.72rem;
  color: var(--color-text-light);
  text-align: center;
}

.deuda-item {
  flex-direction: column;
  align-items: stretch;
}

.deuda-text {
  font-size: 0.875rem;
  color: var(--color-text);
  line-height: 1.4;
}

.btn-settle {
  align-self: flex-start;
  margin-top: 0.5rem;
  padding: 0.4rem 0.75rem;
  background: var(--ujap-gold);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.settled {
  padding: 1rem 1.5rem;
  text-align: center;
  color: var(--color-positive);
  font-weight: 600;
  font-size: 0.9rem;
  border-bottom: 1px solid var(--color-border-light);
}

.btn-settle-main {
  width: 100%;
  padding: 0.75rem;
  background: var(--ujap-blue);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
}

.pago-form {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--color-bg-muted);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-light);
}

.field {
  margin-bottom: 0.75rem;
}

.field label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  margin-bottom: 0.25rem;
}

.field input,
.field select {
  width: 100%;
  padding: 0.5rem 0.65rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.875rem;
}

.error {
  color: var(--ujap-red);
  font-size: 0.8rem;
  margin: 0 0 0.5rem;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.btn-cancel,
.btn-save {
  padding: 0.5rem 0.85rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  border: none;
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

.historial-item {
  flex-direction: column;
  align-items: stretch;
}

.historial-text {
  font-size: 0.85rem;
  color: var(--color-heading);
  font-weight: 500;
}

.historial-nota {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 0.15rem;
}

.historial-fecha {
  font-size: 0.72rem;
  color: var(--color-text-light);
  margin-top: 0.25rem;
}

.empty-balance {
  padding: 2rem 1.5rem;
  text-align: center;
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.empty-balance p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}
</style>
