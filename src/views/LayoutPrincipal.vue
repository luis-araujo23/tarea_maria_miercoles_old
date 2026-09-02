<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import UjapLogo from '../components/UjapLogo.vue'
import AppFooter from '../components/AppFooter.vue'

const router = useRouter()
const { usuario, logout } = useAuth()

function cerrarSesion() {
  logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div class="header-inner">
        <div class="brand">
          <UjapLogo :size="40" />
          <div class="brand-text">
            <span class="brand-ujap">UJAP Split</span>
            <span class="brand-sub">Gastos del Semestre</span>
          </div>
        </div>
        <nav class="header-nav" aria-label="Navegacion principal">
          <router-link to="/app/gastos" class="nav-item" active-class="active">
            Gastos
          </router-link>
          <router-link to="/app/companeros" class="nav-item" active-class="active">
            Companeros
          </router-link>
          <router-link to="/app/materiales" class="nav-item" active-class="active">
            Materiales
          </router-link>
          <router-link to="/app/pagos" class="nav-item" active-class="active">
            Pagos
          </router-link>
        </nav>
        <div class="header-right">
          <span v-if="usuario" class="user-name">{{ usuario.nombre }}</span>
          <button type="button" class="btn-logout" @click="cerrarSesion">
            Salir
          </button>
        </div>
      </div>
    </header>

    <main class="main-content">
      <router-view />
    </main>

    <AppFooter />
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

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
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.brand-ujap {
  font-family: var(--font-serif);
  font-size: 1rem;
  font-weight: 700;
  color: var(--ujap-red);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.brand-sub {
  font-size: 0.65rem;
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
  padding: 0.45rem 0.85rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-muted);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition), color var(--transition);
  border: none;
  background: transparent;
  font-family: inherit;
  text-decoration: none;
}

.nav-item.active {
  background: var(--color-primary-light);
  color: var(--ujap-blue);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.btn-logout {
  padding: 0.4rem 0.75rem;
  background: transparent;
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background var(--transition), color var(--transition);
}

.btn-logout:hover {
  background: var(--color-danger);
  color: white;
}

.main-content {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.25rem 1.5rem 2rem;
  flex: 1;
  width: 100%;
}

@media (max-width: 768px) {
  .header-right {
    display: none;
  }

  .main-content {
    padding: 1rem;
  }

  .header-nav {
    order: 3;
    width: 100%;
    justify-content: center;
  }
}
</style>
