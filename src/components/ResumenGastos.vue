<script setup lang="ts">
import { computed } from 'vue';
import type { Gasto } from '../types/Gasto';

const props = defineProps<{ gastos: Gasto[] }>();
const emit = defineEmits(['limpiar-gastos']);

const total = computed(() => {
  return props.gastos.reduce((acc, gasto) => acc + gasto.monto, 0);
});
</script>

<template>
  <div class="resumen">
    <h2>Resumen</h2>
    <div class="total-box">
      <span class="total-label">Total acumulado</span>
      <span class="total-amount">${{ total.toFixed(2) }}</span>
    </div>

    <div class="stats">
      <div class="stat-row">
        <span>Movimientos</span>
        <strong>{{ gastos.length }}</strong>
      </div>
    </div>

    <button
      v-if="gastos.length > 0"
      class="btn-clear"
      @click="emit('limpiar-gastos')"
    >
      Limpiar Todo
    </button>
  </div>
</template>

<style scoped>
.resumen {
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 5rem;
}

.resumen h2 {
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.total-box {
  background: var(--color-gold-light);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  text-align: center;
  margin-bottom: 1.25rem;
}

.total-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-gold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.25rem;
}

.total-amount {
  display: block;
  font-family: var(--font-heading);
  font-weight: 800;
  font-size: 1.75rem;
  color: var(--color-gold);
}

.stats {
  margin-bottom: 1.25rem;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: var(--color-text-light);
}

.stat-row strong {
  color: var(--color-heading);
  font-weight: 700;
}

.btn-clear {
  width: 100%;
  padding: 0.7rem 1rem;
  font-family: var(--font-heading);
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-white);
  background: var(--color-primary);
  border: none;
  border-radius: var(--radius-sm);
  transition: background-color 0.2s;
}

.btn-clear:hover {
  background: var(--color-primary-hover);
}
</style>
