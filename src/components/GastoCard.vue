<script setup lang="ts">
import type { Gasto } from '../types/Gasto';

defineProps<{ gasto: Gasto }>();
const emit = defineEmits(['seleccionar', 'eliminar']);

</script>

<template>
  <div class="gasto-card">
    <div class="gasto-info">
      <h3>{{ gasto.descripcion }}</h3>
      <p>Pagado por: <strong>{{ gasto.pagadoPor }}</strong></p>
      <p class="monto">${{ gasto.monto.toFixed(2) }}</p>
    </div>
    <div class="gasto-actions">
      <button class="btn-select" @click="emit('seleccionar', gasto.id)">Seleccionar</button>
      <button class="btn-delete" @click="emit('eliminar', gasto.id)">Eliminar</button>
    </div>
  </div>
</template>

<style scoped>
.gasto-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  color: #334155;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.gasto-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.gasto-info h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.125rem;
  color: #0f172a;
}

.gasto-info p {
  margin: 0.25rem 0;
  font-size: 0.875rem;
  color: #64748b;
}

.monto {
  font-size: 1.25rem !important;
  font-weight: 700;
  color: #10b981 !important;
  margin-top: 0.5rem !important;
}

.gasto-actions {
  display: flex;
  gap: 0.5rem;
}

.gasto-actions button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.btn-select {
  background-color: #3b82f6;
  color: white;
}

.btn-select:hover {
  background-color: #2563eb;
}

.btn-delete {
  background-color: #ef4444;
  color: white;
}

.btn-delete:hover {
  background-color: #dc2626;
}
</style>
