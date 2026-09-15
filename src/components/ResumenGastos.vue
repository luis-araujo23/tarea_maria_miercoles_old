<script setup lang="ts">
import { computed } from 'vue'
import type { Companero, Gasto, Pago } from '../types'
import { getAvatarColor, getInitials } from '../utils/avatars'
import { calcularBalances, simplificarDeudas } from '../utils/balances'
import { useTasaCambio } from '../composables/useTasaCambio'

const props = defineProps<{
  gastos: Gasto[]
  pagos: Pago[]
  companeros: Companero[]
}>()

const {
  cargando: cargandoTasa,
  error: errorTasa,
  disponible: tasaDisponible,
  usandoRespaldo,
  actualizadoTexto,
  reintentar,
  formatearBolivares,
} = useTasaCambio()

const total = computed(() =>
  props.gastos.reduce((acc, gasto) => acc + gasto.monto, 0)
)

const totalEnBolivares = computed(() => formatearBolivares(total.value))

const balances = computed(() =>
  calcularBalances(props.gastos, props.pagos, props.companeros)
)

const deudasSimplificadas = computed(() => simplificarDeudas(balances.value))

function nombre(id: string): string {
  return props.companeros.find((c) => c.id === id)?.nombre ?? 'Desconocido'
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

      <span v-if="cargandoTasa && !tasaDisponible" class="total-bs cargando">
        Consultando tasa del día…
      </span>
      <span v-else-if="tasaDisponible" class="total-bs">
        {{ totalEnBolivares }}
        <span class="total-bs-fecha">· tasa del {{ actualizadoTexto }}</span>
      </span>

      <span class="total-meta">
        {{ gastos.length }} {{ gastos.length === 1 ? 'movimiento' : 'movimientos' }}
        · {{ companeros.length }} {{ companeros.length === 1 ? 'persona' : 'personas' }}
      </span>

      <p v-if="errorTasa" class="tasa-error" role="alert">
        <span>
          {{ errorTasa }}
          <template v-if="usandoRespaldo">Se muestra la última tasa guardada.</template>
        </span>
        <button
          type="button"
          class="btn-reintentar"
          :disabled="cargandoTasa"
          @click="reintentar"
        >
          {{ cargandoTasa ? 'Reintentando…' : 'Reintentar' }}
        </button>
      </p>
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
            <span v-if="tasaDisponible" class="deuda-bs">
              {{ formatearBolivares(deuda.monto) }}
            </span>
          </span>
        </li>
      </ul>
    </div>

    <div v-else-if="gastos.length > 0 && balances.length > 0" class="settled">
      <span>✓</span> ¡Todos están a mano!
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

.total-bs {
  display: block;
  margin-top: 0.15rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.total-bs.cargando {
  font-weight: 500;
  opacity: 0.7;
}

.total-bs-fecha {
  font-weight: 500;
  font-size: 0.72rem;
  color: var(--color-text-light);
}

.total-meta {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--color-text-light);
}

.tasa-error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin: 0.75rem 0 0;
  padding: 0.5rem 0.6rem;
  background: #fef2f2;
  border-radius: var(--radius-sm);
  font-size: 0.72rem;
  line-height: 1.35;
  color: var(--color-danger);
  text-align: left;
}

.btn-reintentar {
  flex-shrink: 0;
  padding: 0.25rem 0.6rem;
  background: transparent;
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
  border-radius: var(--radius-sm);
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.btn-reintentar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.balances,
.deudas,
.settle-section {
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
.deuda-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.balance-item,
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

.deuda-text {
  font-size: 0.875rem;
  color: var(--color-text);
  line-height: 1.4;
}

.deuda-bs {
  display: block;
  margin-top: 0.15rem;
  font-size: 0.7rem;
  color: var(--color-text-light);
  font-variant-numeric: tabular-nums;
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
  font-family: inherit;
}

.btn-settle-main:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
