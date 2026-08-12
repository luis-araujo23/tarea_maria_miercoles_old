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
    <h2>Resumen de Gastos</h2>
    <div class="total-container">
      <p class="label">Total acumulado</p>
      <p class="amount">${{ total.toFixed(2) }}</p>
    </div>
    
    <div class="stats">
      <p>Total de movimientos: <strong>{{ gastos.length }}</strong></p>
    </div>

    <button class="btn-clear" v-if="gastos.length > 0" @click="emit('limpiar-gastos')">
      Limpiar Todos
    </button>
  </div>
</template>

<style scoped>
.resumen {
  background-color: #ffffff;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  text-align: center;
  color: #334155;
  border: 1px solid #e2e8f0;
}

.resumen h2 {
  margin-top: 0;
  color: #0f172a;
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.75rem;
}

.total-container {
  background-color: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.total-container .label {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.total-container .amount {
  margin: 0.5rem 0 0 0;
  font-size: 2rem;
  font-weight: 800;
  color: #10b981;
}

.stats {
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

.btn-clear {
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: #f59e0b;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-clear:hover {
  background-color: #d97706;
}
</style>
