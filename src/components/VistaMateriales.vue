<script setup lang="ts">
import { computed } from 'vue'
import type { Companero, Gasto } from '../types'
import { CATEGORIAS, getCategoriaId } from '../utils/categorias'

const props = defineProps<{
  gastos: Gasto[]
  companeros: Companero[]
}>()

const resumen = computed(() => {
  const totales: Record<string, { total: number; count: number }> = {}

  CATEGORIAS.forEach((cat) => {
    totales[cat.id] = { total: 0, count: 0 }
  })

  props.gastos.forEach((gasto) => {
    const catId = getCategoriaId(gasto.descripcion)
    totales[catId]!.total += gasto.monto
    totales[catId]!.count += 1
  })

  return CATEGORIAS.map((cat) => ({
    ...cat,
    total: totales[cat.id]!.total,
    count: totales[cat.id]!.count,
  })).filter((cat) => cat.count > 0)
})

const totalGeneral = computed(() =>
  props.gastos.reduce((acc, g) => acc + g.monto, 0)
)
</script>

<template>
  <div class="vista-materiales">
    <div class="intro">
      <h2>Resumen por material</h2>
      <p>Gastos universitarios agrupados por categoría.</p>
    </div>

    <div v-if="resumen.length" class="grid">
      <article v-for="cat in resumen" :key="cat.id" class="card">
        <div class="card-top">
          <span class="icono">{{ cat.icono }}</span>
          <div>
            <h3>{{ cat.nombre }}</h3>
            <span class="count">{{ cat.count }} {{ cat.count === 1 ? 'gasto' : 'gastos' }}</span>
          </div>
        </div>
        <div class="card-bottom">
          <span class="total">${{ cat.total.toFixed(2) }}</span>
          <span class="pct">
            {{ totalGeneral > 0 ? Math.round((cat.total / totalGeneral) * 100) : 0 }}% del total
          </span>
        </div>
        <div class="bar">
          <div
            class="bar-fill"
            :style="{ width: `${totalGeneral > 0 ? (cat.total / totalGeneral) * 100 : 0}%` }"
          />
        </div>
      </article>
    </div>

    <div v-else class="empty">
      <p>No hay gastos registrados aún. Agrega copias, lápices o videobeam para ver el resumen.</p>
    </div>
  </div>
</template>

<style scoped>
.vista-materiales {
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

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}

.card {
  padding: 1rem;
  background: var(--color-bg-muted);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
}

.card-top {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.icono {
  font-size: 1.5rem;
}

.card-top h3 {
  margin: 0 0 0.15rem;
  font-size: 0.95rem;
  color: var(--color-heading);
}

.count {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.5rem;
}

.total {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--ujap-blue);
}

.pct {
  font-size: 0.75rem;
  color: var(--color-text-light);
}

.bar {
  height: 4px;
  background: var(--color-border-light);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: var(--ujap-gold);
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

.empty {
  text-align: center;
  padding: 2.5rem 1rem;
  color: var(--color-text-muted);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
}
</style>
