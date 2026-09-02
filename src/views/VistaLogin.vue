<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import UjapLogo from '../components/UjapLogo.vue'

const router = useRouter()
const { login } = useAuth()

const email = ref('')
const password = ref('')
const error = ref('')
const cargando = ref(false)

function handleSubmit() {
  error.value = ''

  if (!email.value.trim()) {
    error.value = 'Ingresa tu correo electronico'
    return
  }
  if (!password.value) {
    error.value = 'Ingresa tu contrasena'
    return
  }

  cargando.value = true

  // Mock: simula latencia de API
  setTimeout(() => {
    login(email.value.trim(), password.value)
    cargando.value = false
    router.push({ name: 'gastos' })
  }, 400)
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-brand">
        <UjapLogo :size="56" />
        <h1>UJAP Split</h1>
        <p>Divide gastos con tus companeros</p>
      </div>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="field">
          <label for="email">Correo electronico</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="tu@ujap.edu.ve"
            autocomplete="email"
          />
        </div>

        <div class="field">
          <label for="password">Contrasena</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Tu contrasena"
            autocomplete="current-password"
          />
        </div>

        <p v-if="error" class="error">{{ error }}</p>

        <button type="submit" class="btn-primary" :disabled="cargando">
          {{ cargando ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <p class="auth-switch">
        No tienes cuenta?
        <router-link to="/signup">Registrate</router-link>
      </p>
    </div>

    <footer class="auth-footer">
      <UjapLogo :size="20" />
      <p>UJAP Split &middot; Proyecto Academico &middot; {{ new Date().getFullYear() }}</p>
    </footer>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  padding: 2rem 1rem;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-lg);
  padding: 2.5rem 2rem;
  text-align: center;
}

.auth-brand {
  margin-bottom: 2rem;
}

.auth-brand h1 {
  margin: 0.75rem 0 0.25rem;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--ujap-red);
}

.auth-brand p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.auth-form {
  text-align: left;
}

.field {
  margin-bottom: 1rem;
}

.field label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
  margin-bottom: 0.35rem;
}

.field input {
  width: 100%;
  padding: 0.7rem 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.9rem;
  transition: border-color var(--transition);
}

.field input:focus {
  outline: none;
  border-color: var(--ujap-blue);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.error {
  color: var(--ujap-red);
  font-size: 0.85rem;
  margin: 0 0 1rem;
}

.btn-primary {
  width: 100%;
  padding: 0.75rem;
  background: var(--ujap-blue);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background var(--transition);
}

.btn-primary:hover:not(:disabled) {
  background: var(--ujap-blue-dark);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-switch {
  margin: 1.5rem 0 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.auth-switch a {
  color: var(--ujap-blue);
  font-weight: 600;
}

.auth-footer {
  margin-top: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-light);
  font-size: 0.75rem;
}
</style>
