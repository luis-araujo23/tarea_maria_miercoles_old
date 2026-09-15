<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useAppStore } from '../composables/useAppStore'
import { useTasaCambio } from '../composables/useTasaCambio'
import UjapLogo from '../components/UjapLogo.vue'
import ModalConfirmacion from '../components/ModalConfirmacion.vue'
import AppFooter from '../components/AppFooter.vue'
import { companeroDeUsuario } from '../utils/perfil'

const router = useRouter()
const { usuario, esAdmin, logout } = useAuth()
const {
  tasa,
  cargando,
  error,
  disponible,
  usandoRespaldo,
  actualizadoTexto,
  cargarTasa,
  reintentar,
} = useTasaCambio()

const {
  cargando: cargandoDatos,
  error: errorDatos,
  sincronizadoEn,
  cargarDatos,
  restaurarDesdeServidor,
  agregarCompanero,
  companeros,
} = useAppStore()

// Los gastos del grupo se piden en el setup del layout, antes de que se creen
// las vistas hijas, para que ninguna alcance a renderizarse con listas vacias.
cargarDatos().then(() => {
  if (esAdmin.value || !usuario.value) return
  if (companeroDeUsuario(usuario.value, companeros.value)) return
  agregarCompanero(usuario.value.nombre)
})

// La tasa se pide una sola vez al entrar al area privada y queda compartida
// por todas las vistas hijas.
onMounted(() => {
  cargarTasa()
})

const sincronizadoTexto = computed(() => {
  if (sincronizadoEn.value === null) return ''
  return new Date(sincronizadoEn.value).toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
  })
})

const restauracionVisible = ref(false)

function restaurar() {
  restauracionVisible.value = false
  restaurarDesdeServidor()
}

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
          <router-link v-if="esAdmin" to="/app/dashboard" class="nav-item" active-class="active">
            Dashboard
          </router-link>
          <router-link v-if="esAdmin" to="/app/gastos" class="nav-item" active-class="active">
            Gastos
          </router-link>
          <router-link to="/app/materiales" class="nav-item" active-class="active">
            Materiales
          </router-link>
          <router-link v-if="!esAdmin" to="/app/balance" class="nav-item" active-class="active">
            Mis deudas
          </router-link>
        </nav>
        <div class="header-right">
          <div class="tasa" :class="{ 'tasa-error': errorDatos !== null }">
            <template v-if="cargandoDatos">
              <span class="tasa-spinner" aria-hidden="true"></span>
              <span class="tasa-texto">Sincronizando…</span>
            </template>

            <template v-else>
              <span
                class="datos-punto"
                :class="errorDatos ? 'malo' : 'bueno'"
                aria-hidden="true"
              ></span>
              <span class="tasa-texto">
                {{ errorDatos ? 'Datos sin sincronizar' : `Datos ${sincronizadoTexto}` }}
              </span>
            </template>

            <button
              type="button"
              class="tasa-btn"
              :disabled="cargandoDatos"
              :title="errorDatos ?? 'Restaurar los datos originales del servidor'"
              @click="restauracionVisible = true"
            >
              ⟳
            </button>
          </div>

          <div class="tasa" :class="{ 'tasa-error': error && !disponible }">
            <template v-if="cargando && !disponible">
              <span class="tasa-spinner" aria-hidden="true"></span>
              <span class="tasa-texto">Cargando tasa…</span>
            </template>

            <template v-else-if="disponible && tasa">
              <span class="tasa-label">USD</span>
              <span class="tasa-valor">Bs {{ tasa.valor.toFixed(2) }}</span>
              <button
                type="button"
                class="tasa-btn"
                :disabled="cargando"
                :title="
                  usandoRespaldo
                    ? `${error} Mostrando la última tasa guardada.`
                    : `Tasa del ${actualizadoTexto}. Actualizar`
                "
                @click="reintentar"
              >
                {{ usandoRespaldo ? '⚠' : '⟳' }}
              </button>
            </template>

            <template v-else>
              <span class="tasa-texto">Tasa no disponible</span>
              <button
                type="button"
                class="tasa-btn"
                :disabled="cargando"
                :title="error ?? 'Reintentar'"
                @click="reintentar"
              >
                ⟳
              </button>
            </template>
          </div>

          <span v-if="usuario" class="user-name">
            {{ usuario.nombre }}
            <span v-if="esAdmin" class="user-rol">Admin</span>
          </span>
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

    <ModalConfirmacion
      :visible="restauracionVisible"
      titulo="Restaurar datos del servidor"
      mensaje="Se volveran a descargar los gastos, companeros y categorias originales. Los cambios que hiciste en este navegador se perderan."
      confirmar-texto="Restaurar"
      @confirmar="restaurar"
      @cancelar="restauracionVisible = false"
    />
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

.tasa {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.5rem;
  background: var(--color-bg-muted);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-full);
  font-size: 0.72rem;
}

.tasa-error {
  border-color: var(--color-danger);
}

.tasa-label {
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--color-text-light);
}

.tasa-valor {
  font-weight: 700;
  color: var(--ujap-blue);
  font-variant-numeric: tabular-nums;
}

.tasa-texto {
  color: var(--color-text-muted);
}

.datos-punto {
  width: 7px;
  height: 7px;
  border-radius: var(--radius-full);
}

.datos-punto.bueno {
  background: var(--color-positive);
}

.datos-punto.malo {
  background: var(--color-danger);
}

.tasa-btn {
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.8rem;
  line-height: 1;
  padding: 0;
  font-family: inherit;
}

.tasa-btn:hover:not(:disabled) {
  color: var(--ujap-blue);
}

.tasa-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tasa-spinner {
  width: 10px;
  height: 10px;
  border: 2px solid var(--color-border);
  border-top-color: var(--ujap-blue);
  border-radius: var(--radius-full);
  animation: tasa-giro 0.7s linear infinite;
}

@keyframes tasa-giro {
  to {
    transform: rotate(360deg);
  }
}

.user-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.user-rol {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ujap-red);
  background: color-mix(in srgb, var(--ujap-red) 12%, white);
  border-radius: 999px;
  padding: 0.12rem 0.45rem;
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
