<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../composables/useAppStore'
import EstadoDatos from '../components/EstadoDatos.vue'
import { calcularBalances, deudasDeGasto, simplificarDeudas } from '../utils/balances'
import { getAvatarColor, getInitials } from '../utils/avatars'

const {
  gastos,
  pagos,
  companeros,
  productos,
  cargando,
  error,
  listo,
  reintentar,
  nombreCompanero,
} = useAppStore()

const compras = computed(() => gastos.value.filter((g) => g.productoId))

const ventas = computed(() =>
  compras.value.reduce((acc, g) => acc + g.monto, 0)
)

const cobrado = computed(() =>
  pagos.value.reduce((acc, p) => acc + p.monto, 0)
)

const deudasPorCompra = computed(() =>
  compras.value.flatMap((g) => deudasDeGasto(g, pagos.value, companeros.value))
)

const pendienteCompras = computed(() =>
  deudasPorCompra.value.reduce((acc, d) => acc + d.monto, 0)
)

const balances = computed(() =>
  calcularBalances(gastos.value, pagos.value, companeros.value)
)

const deudasGlobales = computed(() => simplificarDeudas(balances.value))

const pendienteGlobal = computed(() =>
  deudasGlobales.value.reduce((acc, d) => acc + d.monto, 0)
)

const ganancia = computed(() => cobrado.value)

const nombreProducto = (id?: string) =>
  productos.value.find((p) => p.id === id)?.nombre ?? 'Compra'
</script>

<template>
  <EstadoDatos
    :cargando="cargando"
    :error="error"
    :listo="listo"
    @reintentar="reintentar"
  >
    <div class="dashboard">
      <div class="intro">
        <h2>Dashboard de administración</h2>
        <p>Saldos pendientes del grupo y dinero ya generado por las compras.</p>
      </div>

      <div class="tarjetas">
        <article class="kpi">
          <span class="kpi-label">Ventas de productos</span>
          <span class="kpi-valor">${{ ventas.toFixed(2) }}</span>
          <span class="kpi-meta">{{ compras.length }} {{ compras.length === 1 ? 'compra' : 'compras' }}</span>
        </article>
        <article class="kpi verde">
          <span class="kpi-label">Ganancias cobradas</span>
          <span class="kpi-valor">${{ ganancia.toFixed(2) }}</span>
          <span class="kpi-meta">Pagos registrados entre compañeros</span>
        </article>
        <article class="kpi rojo">
          <span class="kpi-label">Saldos pendientes</span>
          <span class="kpi-valor">${{ pendienteCompras.toFixed(2) }}</span>
          <span class="kpi-meta">Deudas abiertas de compras</span>
        </article>
        <article class="kpi">
          <span class="kpi-label">Pendiente global</span>
          <span class="kpi-valor">${{ pendienteGlobal.toFixed(2) }}</span>
          <span class="kpi-meta">Incluye gastos del semestre</span>
        </article>
      </div>

      <section class="bloque">
        <h3>Saldos pendientes por compra</h3>
        <ul v-if="deudasPorCompra.length" class="lista">
          <li
            v-for="(deuda, i) in deudasPorCompra"
            :key="`${deuda.deId}-${deuda.paraId}-${i}`"
            class="item"
          >
            <span>
              <strong>{{ nombreCompanero(deuda.deId) }}</strong>
              le debe
              <strong>${{ deuda.monto.toFixed(2) }}</strong>
              a
              <strong>{{ nombreCompanero(deuda.paraId) }}</strong>
            </span>
          </li>
        </ul>
        <p v-else class="vacio">No hay deudas abiertas de productos.</p>
      </section>

      <section class="bloque">
        <h3>Quién le debe a quién (grupo completo)</h3>
        <ul v-if="deudasGlobales.length" class="lista">
          <li v-for="(deuda, i) in deudasGlobales" :key="i" class="item">
            <div class="persona">
              <span class="avatar" :style="{ backgroundColor: getAvatarColor(nombreCompanero(deuda.deId)) }">
                {{ getInitials(nombreCompanero(deuda.deId)) }}
              </span>
              <span>
                {{ nombreCompanero(deuda.deId) }} → {{ nombreCompanero(deuda.paraId) }}
              </span>
            </div>
            <strong>${{ deuda.monto.toFixed(2) }}</strong>
          </li>
        </ul>
        <p v-else class="vacio">El grupo está a mano.</p>
      </section>

      <section class="bloque">
        <h3>Compras recientes</h3>
        <ul v-if="compras.length" class="lista">
          <li v-for="compra in compras" :key="compra.id" class="item">
            <span>
              {{ nombreProducto(compra.productoId) }}
              · {{ nombreCompanero(compra.pagadoPorId) }}
            </span>
            <strong>${{ compra.monto.toFixed(2) }}</strong>
          </li>
        </ul>
        <p v-else class="vacio">Aún no hay compras de productos.</p>
      </section>
    </div>
  </EstadoDatos>
</template>

<style scoped>
.dashboard {
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

.tarjetas {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.kpi {
  padding: 1rem;
  background: var(--color-bg-muted);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
}

.kpi-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
}

.kpi-valor {
  display: block;
  margin: 0.35rem 0 0.2rem;
  font-size: 1.45rem;
  font-weight: 800;
  color: var(--ujap-blue);
}

.kpi.verde .kpi-valor {
  color: var(--color-positive);
}

.kpi.rojo .kpi-valor {
  color: var(--color-danger);
}

.kpi-meta {
  font-size: 0.72rem;
  color: var(--color-text-light);
}

.bloque {
  margin-bottom: 1.4rem;
}

.bloque h3 {
  margin: 0 0 0.7rem;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.lista {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--color-bg-muted);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  font-size: 0.88rem;
}

.persona {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 700;
  color: white;
}

.vacio {
  margin: 0;
  padding: 1.25rem;
  text-align: center;
  color: var(--color-text-muted);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
}
</style>
