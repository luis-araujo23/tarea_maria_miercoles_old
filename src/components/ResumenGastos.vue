<script setup lang="ts">
import { computed } from 'vue';
import type { Gasto } from '../types/Gasto';

const props = defineProps<{ gastos: Gasto[] }>();
const emit = defineEmits(['limpiar-gastos']);

const total = computed(() =>
  props.gastos.reduce((acc, gasto) => acc + gasto.monto, 0)
);

const participantes = computed(() => {
  const nombres = new Set<string>();
  props.gastos.forEach((g) => nombres.add(g.pagadoPor));
  return Array.from(nombres);
});

const balances = computed(() => {
  if (props.gastos.length === 0 || participantes.value.length === 0) return [];

  const pagado: Record<string, number> = {};
  participantes.value.forEach((p) => (pagado[p] = 0));
  props.gastos.forEach((g) => {
    pagado[g.pagadoPor] = (pagado[g.pagadoPor] ?? 0) + g.monto;
  });

  const cuotaJusta = total.value / participantes.value.length;

  return participantes.value.map((nombre) => ({
    nombre,
    pagado: pagado[nombre] ?? 0,
    balance: (pagado[nombre] ?? 0) - cuotaJusta,
  }));
});

const avatarColors = [
  'var(--avatar-1)',
  'var(--avatar-2)',
  'var(--avatar-3)',
  'var(--avatar-4)',
  'var(--avatar-5)',
  'var(--avatar-6)',
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length] ?? 'var(--avatar-1)';
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
        · {{ participantes.length }} {{ participantes.length === 1 ? 'persona' : 'personas' }}
      </span>
    </div>

    <div v-if="balances.length > 0" class="balances">
      <h3 class="balances-title">Saldos individuales</h3>
      <ul class="balance-list">
        <li v-for="item in balances" :key="item.nombre" class="balance-item">
          <div class="balance-person">
            <span
              class="avatar"
              :style="{ backgroundColor: getAvatarColor(item.nombre) }"
            >
              {{ getInitials(item.nombre) }}
            </span>
            <div class="balance-info">
              <span class="balance-name">{{ item.nombre }}</span>
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

    <div v-else class="empty-balance">
      <div class="empty-icon">📊</div>
      <p>Registra copias, lápices, videobeam u otros gastos del semestre para ver el balance entre compañeros</p>
    </div>

    <button
      v-if="gastos.length > 0"
      class="btn-clear"
      @click="emit('limpiar-gastos')"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      </svg>
      Limpiar todos los registros
    </button>
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

.balances {
  padding: 1.25rem 1.5rem;
}

.balances-title {
  margin: 0 0 1rem;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.balance-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.balance-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.btn-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: calc(100% - 3rem);
  margin: 0 1.5rem 1.5rem;
  padding: 0.75rem 1rem;
  background: transparent;
  color: var(--color-danger);
  border: 1.5px solid var(--color-danger);
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background var(--transition), color var(--transition);
}

.btn-clear:hover {
  background: var(--color-danger);
  color: white;
}
</style>
