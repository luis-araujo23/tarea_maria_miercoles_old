<script setup lang="ts">
import { computed } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useAppStore } from '../composables/useAppStore'
import { calcularBalances, simplificarDeudas } from '../utils/balances'
import { getAvatarColor, getInitials } from '../utils/avatars'

const { usuario } = useAuth()
const { gastos, pagos, companeros, nombreCompanero } = useAppStore()

const balances = computed(() =>
  calcularBalances(gastos.value, pagos.value, companeros.value)
)

const deudasSimplificadas = computed(() => simplificarDeudas(balances.value))

const miCompanero = computed(() => {
  if (!usuario.value) return null
  return companeros.value.find(
    (c) => c.nombre.toLowerCase() === usuario.value!.nombre.toLowerCase()
  )
})

const miBalance = computed(() => {
  if (!miCompanero.value) return null
  return balances.value.find((b) => b.companeroId === miCompanero.value!.id)
})

const leDebo = computed(() => {
  if (!miCompanero.value) return []
  return deudasSimplificadas.value.filter((d) => d.deId === miCompanero.value!.id)
})

const meDeben = computed(() => {
  if (!miCompanero.value) return []
  return deudasSimplificadas.value.filter((d) => d.paraId === miCompanero.value!.id)
})

const totalLeDebo = computed(() =>
  leDebo.value.reduce((acc, d) => acc + d.monto, 0)
)

const totalMeDeben = computed(() =>
  meDeben.value.reduce((acc, d) => acc + d.monto, 0)
)

const neto = computed(() => totalMeDeben.value - totalLeDebo.value)
</script>

<template>
  <div class="vista-balance">
    <div class="intro">
      <h2>Mi balance</h2>
      <p>Resumen de tus deudas y créditos en el grupo.</p>
    </div>

    <div v-if="!miCompanero" class="empty">
      <p>No se encontró tu perfil de compañero. Asegúrate de que tu nombre coincida con un compañero del grupo.</p>
    </div>

    <template v-else>
      <div class="mi-profile">
        <span
          class="avatar-lg"
          :style="{ backgroundColor: getAvatarColor(miCompanero.nombre) }"
        >
          {{ getInitials(miCompanero.nombre) }}
        </span>
        <div class="profile-info">
          <h3>{{ miCompanero.nombre }}</h3>
          <span v-if="miBalance" class="profile-paid">Pagó ${{ miBalance.pagado.toFixed(2) }}</span>
        </div>
        <span
          v-if="miBalance"
          class="balance-badge"
          :class="miBalance.balance >= 0 ? 'positive' : 'negative'"
        >
          {{ miBalance.balance >= 0 ? '+' : '' }}${{ miBalance.balance.toFixed(2) }}
        </span>
      </div>

      <div class="summary-cards">
        <div class="summary-card red">
          <span class="summary-label">Le debo</span>
          <span class="summary-amount">${{ totalLeDebo.toFixed(2) }}</span>
          <span class="summary-meta">{{ leDebo.length }} {{ leDebo.length === 1 ? 'deuda' : 'deudas' }}</span>
        </div>
        <div class="summary-card green">
          <span class="summary-label">Me deben</span>
          <span class="summary-amount">${{ totalMeDeben.toFixed(2) }}</span>
          <span class="summary-meta">{{ meDeben.length }} {{ meDeben.length === 1 ? 'deuda' : 'deudas' }}</span>
        </div>
        <div class="summary-card" :class="neto >= 0 ? 'green' : 'red'">
          <span class="summary-label">Neto</span>
          <span class="summary-amount">{{ neto >= 0 ? '+' : '' }}${{ neto.toFixed(2) }}</span>
          <span class="summary-meta">{{ neto >= 0 ? 'A tu favor' : 'Debes' }}</span>
        </div>
      </div>

      <div v-if="leDebo.length > 0" class="section">
        <h3 class="section-title">A quiénes les debo</h3>
        <ul class="debt-list">
          <li v-for="(deuda, i) in leDebo" :key="i" class="debt-item negative">
            <div class="debt-person">
              <span
                class="avatar"
                :style="{ backgroundColor: getAvatarColor(nombreCompanero(deuda.paraId)) }"
              >
                {{ getInitials(nombreCompanero(deuda.paraId)) }}
              </span>
              <span class="debt-name">{{ nombreCompanero(deuda.paraId) }}</span>
            </div>
            <span class="debt-amount">-${{ deuda.monto.toFixed(2) }}</span>
          </li>
        </ul>
      </div>

      <div v-if="meDeben.length > 0" class="section">
        <h3 class="section-title">Quiénes me deben</h3>
        <ul class="debt-list">
          <li v-for="(deuda, i) in meDeben" :key="i" class="debt-item positive">
            <div class="debt-person">
              <span
                class="avatar"
                :style="{ backgroundColor: getAvatarColor(nombreCompanero(deuda.deId)) }"
              >
                {{ getInitials(nombreCompanero(deuda.deId)) }}
              </span>
              <span class="debt-name">{{ nombreCompanero(deuda.deId) }}</span>
            </div>
            <span class="debt-amount">+${{ deuda.monto.toFixed(2) }}</span>
          </li>
        </ul>
      </div>

      <div v-if="leDebo.length === 0 && meDeben.length === 0 && gastos.length > 0" class="settled">
        <span>✓</span> ¡Estás a mano con todos!
      </div>

      <div v-if="gastos.length === 0" class="empty">
        <p>No hay gastos registrados aún. Registra gastos para ver tu balance.</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.vista-balance {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  padding: 1.5rem;
}

.intro h2 {
  margin: 0 0 0.35rem;
  font-size: 1.25rem;
  color: var(--color-heading);
}

.intro p {
  margin: 0 0 1.25rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.mi-profile {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, var(--ujap-blue) 0%, var(--ujap-blue-light) 100%);
  border-radius: var(--radius-md);
  color: white;
  margin-bottom: 1.25rem;
}

.avatar-lg {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.profile-info {
  flex: 1;
}

.profile-info h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
}

.profile-paid {
  font-size: 0.8rem;
  opacity: 0.85;
}

.balance-badge {
  font-size: 1.5rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.summary-card {
  padding: 1rem;
  background: var(--color-bg-muted);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
  text-align: center;
}

.summary-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  margin-bottom: 0.35rem;
}

.summary-amount {
  display: block;
  font-size: 1.35rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.summary-card.red .summary-amount {
  color: var(--color-danger);
}

.summary-card.green .summary-amount {
  color: var(--color-positive);
}

.summary-meta {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.72rem;
  color: var(--color-text-light);
}

.section {
  margin-bottom: 1.5rem;
}

.section-title {
  margin: 0 0 0.75rem;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.debt-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.debt-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: var(--color-bg-muted);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-light);
}

.debt-person {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.debt-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-heading);
}

.debt-amount {
  font-size: 0.95rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.debt-item.negative .debt-amount {
  color: var(--color-danger);
}

.debt-item.positive .debt-amount {
  color: var(--color-positive);
}

.settled {
  padding: 1.5rem;
  text-align: center;
  color: var(--color-positive);
  font-weight: 600;
  font-size: 0.95rem;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  background: var(--color-bg-muted);
}

.empty {
  text-align: center;
  padding: 2.5rem 1rem;
  color: var(--color-text-muted);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
}

@media (max-width: 600px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }
}
</style>
