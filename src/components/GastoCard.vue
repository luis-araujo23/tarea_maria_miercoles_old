<script setup lang="ts">
import type { Gasto } from '../types/Gasto';

defineProps<{ gasto: Gasto }>();
const emit = defineEmits(['seleccionar', 'eliminar']);

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

function getCategoryIcon(descripcion: string): string {
  const desc = descripcion.toLowerCase();
  if (desc.includes('videobeam') || desc.includes('proyector') || desc.includes('data show')) return '📽️';
  if (desc.includes('copia') || desc.includes('impres') || desc.includes('xerox')) return '🖨️';
  if (desc.includes('hoja') || desc.includes('resma') || desc.includes('papel')) return '📄';
  if (desc.includes('cuaderno') || desc.includes('libreta') || desc.includes('apunte')) return '📓';
  if (desc.includes('libro') || desc.includes('manual') || desc.includes('texto')) return '📚';
  if (desc.includes('lapic') || desc.includes('bolígrafo') || desc.includes('marcador')) return '✏️';
  if (desc.includes('usb') || desc.includes('memoria') || desc.includes('calculadora')) return '💾';
  if (desc.includes('laboratorio') || desc.includes('práctica') || desc.includes('practica')) return '🔬';
  return '📎';
}
</script>

<template>
  <article class="gasto-card">
    <div class="gasto-left">
      <div class="category-icon" aria-hidden="true">
        {{ getCategoryIcon(gasto.descripcion) }}
      </div>
      <div class="gasto-details">
        <h3 class="gasto-title">{{ gasto.descripcion }}</h3>
        <div class="gasto-meta">
          <span
            class="avatar"
            :style="{ backgroundColor: getAvatarColor(gasto.pagadoPor) }"
            :title="gasto.pagadoPor"
          >
            {{ getInitials(gasto.pagadoPor) }}
          </span>
          <span class="payer">
            Pagado por <strong>{{ gasto.pagadoPor }}</strong>
          </span>
        </div>
      </div>
    </div>

    <div class="gasto-right">
      <span class="monto">${{ gasto.monto.toFixed(2) }}</span>
      <div class="gasto-actions">
        <button
          class="btn btn-ghost"
          title="Ver detalle"
          @click="emit('seleccionar', gasto.id)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
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
  align-items: center;
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
  margin: 0 0 0.35rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-heading);
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
  letter-spacing: -0.02em;
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
