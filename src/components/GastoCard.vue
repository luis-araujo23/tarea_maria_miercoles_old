<script setup lang="ts">
import { computed } from 'vue'
import type { Companero, Gasto } from '../types'
import { getAvatarColor, getInitials } from '../utils/avatars'
import { desgloseParticipantesGasto, etiquetaDivision } from '../utils/balances'
import { getCategoryIcon } from '../utils/categorias'
import { useAppStore } from '../composables/useAppStore'
import { useTasaCambio } from '../composables/useTasaCambio'

const { categorias, pagos } = useAppStore()
const { cargando, disponible, formatearBolivares } = useTasaCambio()

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

const montoEnBolivares = computed(() => formatearBolivares(props.gasto.monto))

const desglose = computed(() =>
  desgloseParticipantesGasto(props.gasto, pagos.value, props.companeros)
)

const totalCobrado = computed(() =>
  desglose.value.reduce((acc, p) => acc + p.pagado, 0)
)

const totalPendiente = computed(() =>
  Math.max(0, Math.round((props.gasto.monto - totalCobrado.value) * 100) / 100)
)

const porcentajeCobrado = computed(() =>
  props.gasto.monto > 0
    ? Math.min(100, Math.round((totalCobrado.value / props.gasto.monto) * 100))
    : 100
)

const todoSaldado = computed(() => totalPendiente.value <= 0.009)
</script>

<template>
  <article class="gasto-card">
    <div class="gasto-main-row">
      <div class="gasto-left">
        <div class="category-icon" aria-hidden="true">
          {{ getCategoryIcon(gasto.descripcion, categorias) }}
        </div>
        <div class="gasto-details">
          <h3 class="gasto-title">
            <router-link
              :to="{ name: 'gasto-detalle', params: { id: String(gasto.id) } }"
              class="gasto-link"
            >
              {{ gasto.descripcion }}
            </router-link>
          </h3>
          <p class="gasto-fecha">{{ fechaFormateada }} · <span class="gasto-division">{{ divisionTexto }}</span></p>
          <div class="gasto-meta">
            <span
              class="avatar"
              :style="{ backgroundColor: getAvatarColor(pagador) }"
              :title="pagador"
            >
              {{ getInitials(pagador) }}
            </span>
            <span class="payer">
              Comprado por <strong>{{ pagador }}</strong>
            </span>
          </div>
        </div>
      </div>

      <div class="gasto-right">
        <div class="monto-grupo">
          <span class="monto">${{ gasto.monto.toFixed(2) }}</span>
          <span v-if="disponible" class="monto-bs">{{ montoEnBolivares }}</span>
          <span v-else-if="cargando" class="monto-bs placeholder">Bs …</span>
        </div>
        <div class="gasto-actions">
          <router-link
            class="btn btn-ghost"
            title="Ver detalle del gasto"
            :to="{ name: 'gasto-detalle', params: { id: String(gasto.id) } }"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </router-link>
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
            :class="{ 'btn-bloqueado': !todoSaldado }"
            :title="todoSaldado ? 'Eliminar compra saldada' : 'No se puede eliminar: aún hay participantes que deben pagar su parte'"
            @click="emit('eliminar', gasto.id)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- SECCIÓN DE RECAUDACIÓN Y ESTADO DE PAGOS DE ESTA COMPRA -->
    <div class="gasto-recaudacion">
      <div class="recaudacion-top">
        <span class="recaudacion-label">
          Cobrado: <strong>${{ totalCobrado.toFixed(2) }}</strong> de ${{ gasto.monto.toFixed(2) }} ({{ porcentajeCobrado }}%)
        </span>
        <span class="badge-recaudacion" :class="{ ok: todoSaldado }">
          {{ todoSaldado ? '✓ 100% Cobrado' : `Pendiente: $${totalPendiente.toFixed(2)}` }}
        </span>
      </div>
      <div class="barra-progreso">
        <div
          class="barra-progreso-fill"
          :class="{ ok: todoSaldado }"
          :style="{ width: `${porcentajeCobrado}%` }"
        />
      </div>

      <div class="participantes-desglose">
        <span class="desglose-titulo">Participantes y cuánto pagó cada uno:</span>
        <div class="participantes-chips">
          <div
            v-for="p in desglose"
            :key="p.companeroId"
            class="chip-participante"
            :class="{ saldado: p.saldado, debe: !p.saldado }"
          >
            <span
              class="avatar-xs"
              :style="{ backgroundColor: getAvatarColor(p.nombre) }"
            >
              {{ getInitials(p.nombre) }}
            </span>
            <span class="chip-nombre">{{ p.nombre }}</span>
            <span class="chip-estado">
              <template v-if="p.esComprador">
                <span class="badge-rol">Comprador</span> Pagó ${{ p.pagado.toFixed(2) }}
              </template>
              <template v-else-if="p.saldado">
                <span class="texto-ok">✓ Pagó ${{ p.pagado.toFixed(2) }}</span>
              </template>
              <template v-else>
                <span v-if="p.pagado > 0.009" class="texto-abono">Abonó ${{ p.pagado.toFixed(2) }} · </span>
                <strong class="texto-debe">Debe ${{ p.pendiente.toFixed(2) }}</strong>
              </template>
            </span>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.gasto-card {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1.15rem 1.25rem;
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

.gasto-main-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
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
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-heading);
}

.gasto-link {
  color: inherit;
  text-decoration: none;
}

.gasto-link:hover {
  color: var(--ujap-blue);
  text-decoration: underline;
}

.gasto-fecha {
  margin: 0 0 0.35rem;
  font-size: 0.76rem;
  color: var(--color-text-light);
}

.gasto-division {
  color: var(--ujap-blue);
  font-weight: 600;
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

.monto-grupo {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 92px;
}

.monto {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--color-heading);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.monto-bs {
  font-size: 0.7rem;
  color: var(--color-text-light);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.monto-bs.placeholder {
  opacity: 0.6;
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
  text-decoration: none;
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

/* RECAUDACIÓN Y DESGLOSE */
.gasto-recaudacion {
  background: var(--color-bg-muted);
  border-radius: var(--radius-sm);
  padding: 0.75rem 0.95rem;
  border: 1px solid var(--color-border-light);
}

.recaudacion-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.78rem;
  margin-bottom: 0.35rem;
}

.recaudacion-label {
  color: var(--color-text-muted);
}

.recaudacion-label strong {
  color: var(--color-heading);
}

.badge-recaudacion {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: #fef3c7;
  color: #b45309;
}

.badge-recaudacion.ok {
  background: #ecfdf5;
  color: var(--color-positive);
}

.barra-progreso {
  height: 6px;
  background: var(--color-border-light);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 0.65rem;
}

.barra-progreso-fill {
  height: 100%;
  background: var(--ujap-blue);
  transition: width 0.3s ease;
}

.barra-progreso-fill.ok {
  background: var(--color-positive);
}

.participantes-desglose {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.desglose-titulo {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-light);
}

.participantes-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.chip-participante {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: white;
  border: 1px solid var(--color-border-light);
  padding: 0.25rem 0.55rem;
  border-radius: var(--radius-sm);
  font-size: 0.74rem;
}

.chip-participante.saldado {
  border-color: #a7f3d0;
  background: #f0fdf4;
}

.chip-participante.debe {
  border-color: #fed7aa;
  background: #fff7ed;
}

.avatar-xs {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 0.55rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.chip-nombre {
  font-weight: 700;
  color: var(--color-heading);
}

.chip-estado {
  color: var(--color-text-muted);
}

.badge-rol {
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  background: var(--color-primary-light);
  color: var(--ujap-blue);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
}

.texto-ok {
  color: var(--color-positive);
  font-weight: 600;
}

.texto-abono {
  color: var(--color-text-muted);
}

.texto-debe {
  color: var(--color-danger);
  font-weight: 700;
}

.btn-bloqueado {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-bloqueado:hover {
  background: transparent !important;
  color: inherit !important;
}

@media (max-width: 640px) {
  .gasto-main-row {
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
