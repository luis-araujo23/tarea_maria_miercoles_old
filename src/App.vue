<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Gasto } from './types/Gasto';
import GastoCard from './components/GastoCard.vue';
import ResumenGastos from './components/ResumenGastos.vue';

const gastos = ref<Gasto[]>([]);

const heroCategories = [
  { text: 'en viajes.', color: 'var(--color-primary)' },
  { text: 'con companeros.', color: 'var(--color-red)' },
  { text: 'con tu pareja.', color: 'var(--color-gold)' },
  { text: 'con todos.', color: 'var(--color-primary)' },
];
const currentCategory = ref(0);

onMounted(() => {
  console.log('El componente ya esta en pantalla');
  gastos.value = [
    { id: 1, descripcion: 'Cena en restaurante', monto: 45.50, pagadoPor: 'Maria' },
    { id: 2, descripcion: 'Boletos de cine', monto: 20.00, pagadoPor: 'Juan' },
    { id: 3, descripcion: 'Transporte y peajes', monto: 15.00, pagadoPor: 'Maria' },
  ];

  setInterval(() => {
    currentCategory.value = (currentCategory.value + 1) % heroCategories.length;
  }, 2500);
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
  <div class="app-wrapper">
    <header class="navbar">
      <div class="navbar-inner">
        <a href="/" class="logo">
          <svg class="logo-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="#1a56db"/>
            <path d="M8 16h16M16 8v16M10 10l12 12M22 10L10 22" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span class="logo-text">SplitUJAP</span>
        </a>
        <nav class="navbar-actions">
          <a href="#" class="btn-login">Iniciar sesion</a>
          <a href="#" class="btn-signup">Registrarse</a>
        </nav>
      </div>
    </header>

    <main class="main-content">
      <section class="hero">
        <h1 class="hero-title">
          Menos estres al dividir gastos
          <span class="hero-highlight" :style="{ color: heroCategories[currentCategory]?.color }">
            {{ heroCategories[currentCategory]?.text }}
          </span>
        </h1>
        <p class="hero-subtitle">
          Lleva el control de tus gastos compartidos con companeros de cuarto, viajes, grupos, amigos y familia.
        </p>
        <div class="hero-actions">
          <a href="#" class="btn-primary btn-lg">Registrarse</a>
          <p class="hero-free">Gratis para web, iPhone y Android.</p>
        </div>
      </section>

      <section class="content-section">
        <div class="container">
          <div class="content-grid">
            <section class="expense-list">
              <div class="section-header">
                <h2>Gastos</h2>
                <span class="badge">{{ gastos.length }}</span>
              </div>

              <div v-if="gastos.length === 0" class="empty-state">
                <div class="empty-icon">
                  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="24" cy="24" r="22" stroke="var(--color-gray-300)" stroke-width="2" stroke-dasharray="4 4"/>
                    <path d="M16 24h16M24 16v16" stroke="var(--color-gray-400)" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </div>
                <p>No hay gastos registrados.</p>
                <span>todos al dia!</span>
              </div>

              <div v-else class="cards-list">
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
          </div>
        </div>
      </section>

      <section class="features-section">
        <div class="container">
          <h2 class="features-title">Todo lo que necesitas</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon feature-icon--blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <h3>Rastrea saldos</h3>
              <p>Mantén registro de gastos compartidos, saldos y quien le debe a quien.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon feature-icon--red">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <h3>Organiza gastos</h3>
              <p>Divide gastos con cualquier grupo: viajes, companeros, amigos y familia.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon feature-icon--gold">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </div>
              <h3>Agrega facil</h3>
              <p>Agrega gastos rapidamente antes de que se te olvide quien pago.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon feature-icon--green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <h3>Paga de vuelta</h3>
              <p>Liquid con un amigo y registra cualquier pago en efectivo o en linea.</p>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer class="footer">
      <div class="container footer-inner">
        <div class="footer-brand">
          <span class="logo-text">SplitUJAP</span>
          <p>Herramienta para dividir gastos con amigos.</p>
        </div>
        <div class="footer-links">
          <div>
            <h4>SplitUJAP</h4>
            <a href="#">Acerca de</a>
            <a href="#">Blog</a>
            <a href="#">Empleo</a>
          </div>
          <div>
            <h4>Cuenta</h4>
            <a href="#">Iniciar sesion</a>
            <a href="#">Registrarse</a>
            <a href="#">Configuracion</a>
          </div>
          <div>
            <h4>Ayuda</h4>
            <a href="#">Contacto</a>
            <a href="#">FAQ</a>
            <a href="#">Terminos</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="container">
          <p>&copy; 2026 SplitUJAP. Hecho con amor en la UJAP.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ── Navbar ── */
.navbar {
  background: var(--color-white);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0.875rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
}

.logo-icon {
  width: 32px;
  height: 32px;
}

.logo-text {
  font-family: var(--font-heading);
  font-weight: 800;
  font-size: 1.25rem;
  color: var(--color-heading);
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-login {
  font-family: var(--font-heading);
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-primary);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  transition: background-color 0.2s;
}

.btn-login:hover {
  background-color: var(--color-primary-light);
}

.btn-signup {
  font-family: var(--font-heading);
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-white);
  background: var(--color-primary);
  padding: 0.5rem 1.25rem;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sm);
  transition: background-color 0.2s;
}

.btn-signup:hover {
  background: var(--color-primary-hover);
}

/* ── Hero ── */
.hero {
  text-align: center;
  padding: 4rem 2rem 3rem;
  background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-white) 50%, var(--color-gold-light) 100%);
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 1rem;
  color: var(--color-heading);
}

.hero-highlight {
  display: block;
  transition: color 0.4s ease;
}

.hero-subtitle {
  font-size: 1.125rem;
  color: var(--color-text-light);
  max-width: 520px;
  margin: 0 auto 1.75rem;
}

.hero-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.btn-primary {
  display: inline-block;
  font-family: var(--font-heading);
  font-weight: 700;
  color: var(--color-white);
  background: var(--color-primary);
  border: none;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
  transition: background-color 0.2s;
  text-decoration: none;
}

.btn-lg {
  padding: 0.875rem 2.5rem;
  font-size: 1rem;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}

.hero-free {
  font-size: 0.875rem;
  color: var(--color-text-light);
}

/* ── Content ── */
.content-section {
  flex: 1;
  padding: 3rem 2rem;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  align-items: start;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.section-header h2 {
  font-size: 1.375rem;
  font-weight: 700;
}

.badge {
  background: var(--color-gray-100);
  color: var(--color-gray-600);
  padding: 0.2rem 0.65rem;
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 700;
}

.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  background: var(--color-white);
  border: 2px dashed var(--color-gray-200);
  border-radius: var(--radius-lg);
}

.empty-icon svg {
  width: 48px;
  height: 48px;
  margin-bottom: 1rem;
}

.empty-state p {
  font-size: 1rem;
  color: var(--color-gray-600);
  margin-bottom: 0.25rem;
}

.empty-state span {
  font-size: 0.875rem;
  color: var(--color-gray-400);
}

.cards-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* ── Features ── */
.features-section {
  padding: 4rem 2rem;
  background: var(--color-gray-50);
}

.features-title {
  text-align: center;
  font-size: 1.75rem;
  font-weight: 800;
  margin-bottom: 2.5rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.feature-card {
  background: var(--color-white);
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  text-align: center;
}

.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.feature-icon svg {
  width: 24px;
  height: 24px;
}

.feature-icon--blue {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.feature-icon--red {
  background: var(--color-red-light);
  color: var(--color-red);
}

.feature-icon--gold {
  background: var(--color-gold-light);
  color: var(--color-gold);
}

.feature-icon--green {
  background: var(--color-green-light);
  color: var(--color-green);
}

.feature-card h3 {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.feature-card p {
  font-size: 0.85rem;
  color: var(--color-text-light);
  line-height: 1.5;
}

/* ── Footer ── */
.footer {
  background: var(--color-gray-900);
  color: var(--color-gray-300);
  margin-top: auto;
}

.footer-inner {
  display: flex;
  justify-content: space-between;
  padding: 3rem 2rem;
}

.footer-brand .logo-text {
  color: var(--color-white);
  font-size: 1.125rem;
  display: block;
  margin-bottom: 0.5rem;
}

.footer-brand p {
  font-size: 0.85rem;
  color: var(--color-gray-400);
}

.footer-links {
  display: flex;
  gap: 4rem;
}

.footer-links h4 {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--color-white);
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.footer-links a {
  display: block;
  font-size: 0.85rem;
  color: var(--color-gray-400);
  margin-bottom: 0.4rem;
  transition: color 0.2s;
}

.footer-links a:hover {
  color: var(--color-white);
}

.footer-bottom {
  border-top: 1px solid var(--color-gray-700);
  padding: 1.25rem 2rem;
}

.footer-bottom p {
  font-size: 0.8rem;
  color: var(--color-gray-500);
  text-align: center;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .hero-title {
    font-size: 1.75rem;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .footer-inner {
    flex-direction: column;
    gap: 2rem;
  }

  .footer-links {
    gap: 2rem;
    flex-wrap: wrap;
  }

  .navbar-inner {
    padding: 0.75rem 1rem;
  }
}
</style>
