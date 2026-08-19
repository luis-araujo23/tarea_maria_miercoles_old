<script setup lang="ts">
import type { Gasto } from '../types/Gasto';

defineProps<{ gasto: Gasto }>();
const emit = defineEmits(['seleccionar', 'eliminar']);
</script>

<template>
  <div class="gasto-card">
    <div class="gasto-avatar">
      {{ gasto.pagadoPor.charAt(0).toUpperCase() }}
    </div>
    <div class="gasto-info">
      <h3>{{ gasto.descripcion }}</h3>
      <p class="gasto-payer">Pagado por <strong>{{ gasto.pagadoPor }}</strong></p>
    </div>
    <div class="gasto-right">
      <span class="gasto-monto">${{ gasto.monto.toFixed(2) }}</span>
      <div class="gasto-actions">
        <button class="btn-icon btn-select" @click="emit('seleccionar', gasto.id)" title="Seleccionar">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
        </button>
        <button class="btn-icon btn-delete" @click="emit('eliminar', gasto.id)" title="Eliminar">
          <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gasto-card {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  background: var(--color-white);
  padding: 1rem 1.25rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s, border-color 0.2s;
}

.gasto-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-border-hover);
}

.gasto-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: var(--color-white);
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.gasto-info {
  flex: 1;
  min-width: 0;
}

.gasto-info h3 {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-heading);
  margin-bottom: 0.15rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gasto-payer {
  font-size: 0.8rem;
  color: var(--color-text-light);
}

.gasto-payer strong {
  color: var(--color-gray-700);
}

.gasto-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
  flex-shrink: 0;
}

.gasto-monto {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--color-primary);
}

.gasto-actions {
  display: flex;
  gap: 0.35rem;
}

.btn-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  transition: background-color 0.15s;
}

.btn-icon svg {
  width: 16px;
  height: 16px;
}

.btn-select {
  color: var(--color-gray-400);
}

.btn-select:hover {
  background: var(--color-green-light);
  color: var(--color-green);
}

.btn-delete {
  color: var(--color-gray-400);
}

.btn-delete:hover {
  background: var(--color-red-light);
  color: var(--color-red);
}
</style>
