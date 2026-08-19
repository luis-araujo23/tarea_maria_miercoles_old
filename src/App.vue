<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Gasto } from './types/Gasto';
import GastoCard from './components/GastoCard.vue';
import ResumenGastos from './components/ResumenGastos.vue';
import UjapLogo from './components/UjapLogo.vue';

const gastos = ref<Gasto[]>([]);

onMounted(() => {
  console.log('El componente ya está en pantalla');
  gastos.value = [
    { id: 1, descripcion: 'Copias de apuntes — Cálculo I (80 hojas)', monto: 12.00, pagadoPor: 'María' },
    { id: 2, descripcion: 'Caja de lápices y bolígrafos para el grupo', monto: 6.50, pagadoPor: 'Juan' },
    { id: 3, descripcion: 'Alquiler de videobeam — exposición final', monto: 25.00, pagadoPor: 'Carlos' },
    { id: 4, descripcion: 'Resma de hojas tamaño carta', monto: 8.50, pagadoPor: 'Ana' },
    { id: 5, descripcion: 'Impresión de trabajos de laboratorio (x4)', monto: 10.00, pagadoPor: 'María' },
  ];
});

const manejarEliminar = (id: number) => {
  gastos.value = gastos.value.filter(g => g.id !== id);
};

const manejarSeleccionar = (id: number) => {
  alert(`Gasto #${id} seleccionado desde el componente hijo.`);
};

const limpiarGastos = () => {
  gastos.value = [];
};
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div class="header-inner">
        <div class="brand">
          <UjapLogo :size="44" />
          <div class="brand-text">
            <span class="brand-ujap">UJAP Split</span>
            <span class="brand-sub">Gastos del Semestre</span>
          </div>
        </div>
        <nav class="header-nav" aria-label="Navegación principal">
          <span class="nav-item active">Gastos</span>
          <span class="nav-item">Compañeros</span>
          <span class="nav-item">Materiales</span>
        </nav>
      </div>
    </header>

    <div class="hero">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-dot"></span>
          Proyecto Universitario — UJAP
        </div>
        <h1>Divide los gastos del semestre</h1>
        <p>Copias, lápices, videobeam, hojas e impresiones — reparte los gastos del semestre entre tus compañeros de forma justa y transparente.</p>
      </div>
      <div class="hero-accent" aria-hidden="true">
        <UjapLogo :size="100" />
      </div>
    </div>

    <main class="main-content">
      <section class="lista-gastos" aria-labelledby="gastos-title">
        <div class="section-header">
          <div class="section-title-group">
            <h2 id="gastos-title">Gastos del grupo</h2>
            <p class="section-subtitle">Cálculo I — Semestre 2026</p>
          </div>
          <span class="badge-count">{{ gastos.length }}</span>
        </div>

        <div v-if="gastos.length === 0" class="empty-state">
          <div class="empty-illustration">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="30" stroke="var(--color-border)" stroke-width="2" stroke-dasharray="6 4"/>
              <path d="M32 20v24M24 32h16" stroke="var(--color-primary)" stroke-width="3" stroke-linecap="round"/>
            </svg>
          </div>
          <h3>¡Sin gastos pendientes!</h3>
          <p>No hay gastos registrados. Cuando alguien pague copias, lápices, videobeam u otro material universitario, aparecerá aquí.</p>
        </div>

        <div v-else class="cards-container">
          <GastoCard
            v-for="gasto in gastos"
            :key="gasto.id"
            :gasto="gasto"
            @eliminar="manejarEliminar"
            @seleccionar="manejarSeleccionar"
          />
        </div>
      </section>

      <aside class="sidebar">
        <ResumenGastos
          :gastos="gastos"
          @limpiar-gastos="limpiarGastos"
        />
      </aside>
    </main>

    <footer class="app-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <UjapLogo :size="32" />
          <div>
            <strong>Universidad José Antonio Páez</strong>
            <span>Anima Mens et Vigor</span>
          </div>
        </div>
        <p class="footer-copy">
          Proyecto académico · Ingeniería de Software · {{ new Date().getFullYear() }}
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Header */
.app-header {
  background: var(--color-bg-card);
  border-bottom: 3px solid var(--ujap-red);
  box-shadow: var(--shadow-header);
  position: sticky;
  top: 0;
  z-index: 100;
}

.app-header::before {
  content: '';
  display: block;
  height: 4px;
  background: var(--ujap-gold);
}

.header-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0.875rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.brand-ujap {
  font-family: var(--font-serif);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--ujap-red);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.brand-sub {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--ujap-blue);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.header-nav {
  display: flex;
  gap: 0.25rem;
}

.nav-item {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-muted);
  border-radius: var(--radius-sm);
  cursor: default;
  transition: background var(--transition), color var(--transition);
}

.nav-item.active {
  background: var(--color-primary-light);
  color: var(--ujap-blue);
}

/* Hero */
.hero {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  position: relative;
}

.hero-content {
  flex: 1;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--ujap-red);
  background: rgba(210, 35, 42, 0.07);
  padding: 0.35rem 0.85rem;
  border-radius: var(--radius-full);
  margin-bottom: 1rem;
  border: 1px solid rgba(210, 35, 42, 0.15);
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ujap-gold);
}

.hero h1 {
  margin: 0 0 0.75rem;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  font-weight: 800;
  color: var(--color-heading);
  letter-spacing: -0.03em;
  line-height: 1.15;
}

.hero p {
  margin: 0;
  font-size: 1.05rem;
  color: var(--color-text-muted);
  max-width: 520px;
  line-height: 1.6;
}

.hero-accent {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 4px 12px rgba(46, 88, 166, 0.15));
}

/* Main */
.main-content {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 1.5rem 3rem;
  display: flex;
  gap: 2rem;
  align-items: flex-start;
  flex: 1;
}

.lista-gastos {
  flex: 2;
  min-width: 0;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.section-title-group h2 {
  margin: 0 0 0.25rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-heading);
}

.section-subtitle {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-light);
}

.badge-count {
  background: var(--ujap-blue);
  color: white;
  min-width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0 0.5rem;
}

.empty-state {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 3.5rem 2rem;
  text-align: center;
  border: 2px dashed var(--color-border);
}

.empty-illustration {
  margin-bottom: 1.25rem;
  opacity: 0.7;
}

.empty-state h3 {
  margin: 0 0 0.5rem;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--color-heading);
}

.empty-state p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.cards-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.sidebar {
  flex: 1;
  min-width: 280px;
  position: sticky;
  top: 5rem;
}

/* Footer */
.app-footer {
  margin-top: auto;
  background: var(--ujap-blue-dark);
  color: rgba(255, 255, 255, 0.85);
  padding: 1.75rem 1.5rem;
}

.footer-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.footer-brand strong {
  display: block;
  font-size: 0.9rem;
  color: white;
}

.footer-brand span {
  font-size: 0.75rem;
  color: var(--ujap-gold-light);
  font-style: italic;
}

.footer-copy {
  margin: 0;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

@media (max-width: 768px) {
  .header-nav {
    display: none;
  }

  .hero {
    padding: 1.5rem;
  }

  .hero-accent {
    display: none;
  }

  .main-content {
    flex-direction: column;
    padding: 0 1rem 2rem;
  }

  .sidebar {
    width: 100%;
    position: static;
  }

  .footer-inner {
    flex-direction: column;
    text-align: center;
  }
}
</style>
