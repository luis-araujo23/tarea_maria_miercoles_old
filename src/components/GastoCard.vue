<script setup lang="ts">
import { computed } from 'vue'
import type { Companero, Gasto } from '../types'
import { getAvatarColor, getInitials } from '../utils/avatars'
import { etiquetaDivision } from '../utils/balances'
import { getCategoryIcon } from '../utils/categorias'
import { useAppStore } from '../composables/useAppStore'

const { categorias } = useAppStore()

const props = defineProps<{
  gasto: Gasto
  companeros: Companero[]
}>()

const emit = defineEmits(['editar', 'eliminar'])

const pagador = computed(
  () => props.companeros.find((c) => c.id === props.gasto.pagadoPorId)?.nombre ?? 'Desconocido'
)

const fechaFormateada = computed(() => {
  const [y, m, d] = props.gasto.fecha.split('-')
  return `${d}/${m}/${y}`
})

const divisionTexto = computed(() =>
  etiquetaDivision(props.gasto.tipoDivision, props.gasto.divisiones, props.companeros)
)
</script>

<template>
  <article class="gasto-card">
    <div class="gasto-left">
      <div class="category-icon" aria-hidden="true">
        {{ getCategoryIcon(gasto.descripcion, categorias) }}
      </div>
      <div class="gasto-details">
        <h3 class="gasto-title">{{ gasto.descripcion }}</h3>
        <p class="gasto-fecha">{{ fechaFormateada }}</p>
        <p class="gasto-division">{{ divisionTexto }}</p>
        <div class="gasto-meta">
          <span
            class="avatar"
            :style="{ backgroundColor: getAvatarColor(pagador) }"
            :title="pagador"
          >
            {{ getInitials(pagador) }}
          </span>
          <span class="payer">
            Pagado por <strong>{{ pagador }}</strong>
          </span>
        </div>
      </div>
    </div>

    <div class="gasto-right">
      <span class="monto">${{ gasto.monto.toFixed(2) }}</span>
      <div class="gasto-actions">
        <button
          class="btn btn-ghost"
          title="Editar gasto"
          @click="emit('editar', gasto.id)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button
          class="btn btn-danger-ghost"
          title="Eliminar gasto"
          @click="emit('eliminar', gasto.id)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.gasto-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition), transform var(--transition), border-color var(--transition);
}

.gasto-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-border);
  transform: translateY(-1px);
}

.gasto-left {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.category-icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-light);
  border-radius: var(--radius-sm);
  font-size: 1.25rem;
}

.gasto-details {
  min-width: 0;
}

.gasto-title {
  margin: 0 0 0.2rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-heading);
}

.gasto-fecha {
  margin: 0 0 0.2rem;
  font-size: 0.75rem;
  color: var(--color-text-light);
}

.gasto-division {
  margin: 0 0 0.35rem;
  font-size: 0.72rem;
  color: var(--ujap-blue);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gasto-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.avatar {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 700;
  color: white;
}

.payer {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.payer strong {
  color: var(--color-text);
  font-weight: 600;
}

.gasto-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.monto {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-positive);
  font-variant-numeric: tabular-nums;
  min-width: 72px;
  text-align: right;
}

.gasto-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity var(--transition);
}

.gasto-card:hover .gasto-actions {
  opacity: 1;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition), color var(--transition);
}

.btn-ghost {
  background: transparent;
  color: var(--color-text-muted);
}

.btn-ghost:hover {
  background: var(--color-bg-muted);
  color: var(--ujap-blue);
}

.btn-danger-ghost {
  background: transparent;
  color: var(--color-text-muted);
}

.btn-danger-ghost:hover {
  background: #fef2f2;
  color: var(--color-danger);
}

@media (max-width: 640px) {
  .gasto-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .gasto-right {
    width: 100%;
    justify-content: space-between;
    padding-top: 0.5rem;
    border-top: 1px solid var(--color-border-light);
  }

  .gasto-actions {
    opacity: 1;
  }
}
</style>
