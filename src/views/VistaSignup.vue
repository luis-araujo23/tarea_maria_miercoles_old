<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import UjapLogo from '../components/UjapLogo.vue'
import AppFooter from '../components/AppFooter.vue'

const router = useRouter()
const { signup } = useAuth()

const nombre = ref('')
const email = ref('')
const password = ref('')
const confirmarPassword = ref('')
const error = ref('')
const cargando = ref(false)

function handleSubmit() {
  error.value = ''

  if (!nombre.value.trim()) {
    error.value = 'Ingresa tu nombre completo'
    return
  }
  if (!email.value.trim()) {
    error.value = 'Ingresa tu correo electronico'
    return
  }
  if (password.value.length < 6) {
    error.value = 'La contrasena debe tener al menos 6 caracteres'
    return
  }
  if (password.value !== confirmarPassword.value) {
    error.value = 'Las contrasenas no coinciden'
    return
  }

  cargando.value = true

  // Mock: simula latencia de API
  setTimeout(() => {
    signup(nombre.value.trim(), email.value.trim(), password.value)
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
        <p>Crea tu cuenta para empezar</p>
      </div>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="field">
          <label for="nombre">Nombre completo</label>
          <input
            id="nombre"
            v-model="nombre"
            type="text"
            placeholder="Tu nombre"
            autocomplete="name"
          />
        </div>

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
            placeholder="Minimo 6 caracteres"
            autocomplete="new-password"
          />
        </div>

        <div class="field">
          <label for="confirmar">Confirmar contrasena</label>
          <input
            id="confirmar"
            v-model="confirmarPassword"
            type="password"
            placeholder="Repite tu contrasena"
            autocomplete="new-password"
          />
        </div>

        <p v-if="error" class="error">{{ error }}</p>

        <button type="submit" class="btn-primary" :disabled="cargando">
          {{ cargando ? 'Creando cuenta...' : 'Crear cuenta' }}
        </button>
      </form>

      <p class="auth-switch">
        Ya tienes cuenta?
        <router-link to="/login">Inicia sesion</router-link>
      </p>
    </div>

    <div class="auth-spacer"></div>
    <AppFooter />
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--color-bg);
  padding: 2rem 1rem;
}

.auth-spacer {
  flex: 1;
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
