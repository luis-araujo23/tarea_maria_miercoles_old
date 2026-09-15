<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useAppStore } from '../composables/useAppStore'
import UjapLogo from '../components/UjapLogo.vue'
import AppFooter from '../components/AppFooter.vue'
import {
  validarApellido,
  validarConfirmacionContrasena,
  validarContrasena,
  validarEmail,
  validarNombrePersona,
} from '../utils/validaciones'

type Campo = 'nombre' | 'apellido' | 'email' | 'password' | 'confirmar'

const router = useRouter()
const { signup } = useAuth()
const { agregarCompanero } = useAppStore()

const nombre = ref('')
const apellido = ref('')
const email = ref('')
const password = ref('')
const confirmarPassword = ref('')
const cargando = ref(false)
const enviado = ref(false)

const errores = reactive<Record<Campo, string>>({
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  confirmar: '',
})

const tocado = reactive<Record<Campo, boolean>>({
  nombre: false,
  apellido: false,
  email: false,
  password: false,
  confirmar: false,
})

function validarCampo(campo: Campo): string {
  if (campo === 'nombre') return validarNombrePersona(nombre.value) ?? ''
  if (campo === 'apellido') return validarApellido(apellido.value) ?? ''
  if (campo === 'email') return validarEmail(email.value) ?? ''
  if (campo === 'password') return validarContrasena(password.value) ?? ''
  return validarConfirmacionContrasena(password.value, confirmarPassword.value) ?? ''
}

function mostrarError(campo: Campo) {
  if (enviado.value || tocado[campo]) {
    errores[campo] = validarCampo(campo)
  }
}

function alCambiarPassword() {
  mostrarError('password')
  mostrarError('confirmar')
}

function alSalir(campo: Campo) {
  tocado[campo] = true
  mostrarError(campo)
}

function formularioValido() {
  ;(Object.keys(errores) as Campo[]).forEach((campo) => {
    errores[campo] = validarCampo(campo)
  })
  return !(
    errores.nombre ||
    errores.apellido ||
    errores.email ||
    errores.password ||
    errores.confirmar
  )
}

async function handleSubmit() {
  enviado.value = true
  if (!formularioValido()) return

  cargando.value = true

  const resultado = signup(nombre.value, apellido.value, email.value, password.value)

  if (!resultado.ok) {
    cargando.value = false
    if (resultado.errores.nombre) errores.nombre = resultado.errores.nombre
    if (resultado.errores.apellido) errores.apellido = resultado.errores.apellido
    if (resultado.errores.email) errores.email = resultado.errores.email
    return
  }

  // El nuevo usuario se suma al grupo. Si el API lo rechaza (por ejemplo,
  // porque ese nombre ya estaba) la cuenta igual quedó creada.
  const nombreVisible = `${nombre.value.trim()} ${apellido.value.trim()}`.replace(/\s+/g, ' ')
  await agregarCompanero(nombreVisible)

  cargando.value = false
  router.push({ name: 'materiales' })
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

      <form class="auth-form" novalidate @submit.prevent="handleSubmit">
        <div class="field-row">
          <div class="field">
            <label for="nombre">Nombre</label>
            <input
              id="nombre"
              v-model="nombre"
              type="text"
              maxlength="30"
              placeholder="Tu nombre"
              autocomplete="given-name"
              :class="{ invalid: errores.nombre }"
              :aria-invalid="!!errores.nombre"
              aria-describedby="error-nombre"
              @blur="alSalir('nombre')"
              @input="mostrarError('nombre')"
            />
            <p v-if="errores.nombre" id="error-nombre" class="field-error">{{ errores.nombre }}</p>
          </div>

          <div class="field">
            <label for="apellido">Apellido</label>
            <input
              id="apellido"
              v-model="apellido"
              type="text"
              maxlength="30"
              placeholder="Tu apellido"
              autocomplete="family-name"
              :class="{ invalid: errores.apellido }"
              :aria-invalid="!!errores.apellido"
              aria-describedby="error-apellido"
              @blur="alSalir('apellido')"
              @input="mostrarError('apellido')"
            />
            <p v-if="errores.apellido" id="error-apellido" class="field-error">{{ errores.apellido }}</p>
          </div>
        </div>

        <div class="field">
          <label for="email">Correo electronico</label>
          <input
            id="email"
            v-model="email"
            type="email"
            maxlength="80"
            placeholder="tu@ujap.edu.ve"
            autocomplete="email"
            :class="{ invalid: errores.email }"
            :aria-invalid="!!errores.email"
            aria-describedby="error-email"
            @blur="alSalir('email')"
            @input="mostrarError('email')"
          />
          <p v-if="errores.email" id="error-email" class="field-error">{{ errores.email }}</p>
        </div>

        <div class="field">
          <label for="password">Contrasena</label>
          <input
            id="password"
            v-model="password"
            type="password"
            maxlength="64"
            placeholder="Minimo 8 caracteres"
            autocomplete="new-password"
            :class="{ invalid: errores.password }"
            :aria-invalid="!!errores.password"
            aria-describedby="error-password ayuda-password"
            @blur="alSalir('password')"
            @input="alCambiarPassword"
          />
          <p v-if="errores.password" id="error-password" class="field-error">
            {{ errores.password }}
          </p>
          <p v-else id="ayuda-password" class="field-hint">
            Debe tener al menos 8 caracteres, una letra y un numero.
          </p>
        </div>

        <div class="field">
          <label for="confirmar">Confirmar contrasena</label>
          <input
            id="confirmar"
            v-model="confirmarPassword"
            type="password"
            maxlength="64"
            placeholder="Repite tu contrasena"
            autocomplete="new-password"
            :class="{ invalid: errores.confirmar }"
            :aria-invalid="!!errores.confirmar"
            aria-describedby="error-confirmar"
            @blur="alSalir('confirmar')"
            @input="mostrarError('confirmar')"
          />
          <p v-if="errores.confirmar" id="error-confirmar" class="field-error">
            {{ errores.confirmar }}
          </p>
        </div>

        <button type="submit" class="btn-primary" :disabled="cargando">
          {{ cargando ? 'Creando cuenta...' : 'Crear cuenta' }}
        </button>
      </form>

      <p class="auth-switch">
        Ya tienes cuenta?
        <router-link to="/login">Inicia sesion</router-link>
      </p>
    </div>

    <AppFooter />
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: grid;
  grid-template-rows: 1fr auto;
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
  align-self: center;
  justify-self: center;
  margin-bottom: 3rem;
  margin-top: 3rem;
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

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
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

.field input.invalid {
  border-color: var(--color-danger);
}

.field input.invalid:focus {
  box-shadow: 0 0 0 3px rgba(210, 35, 42, 0.12);
}

.field-error {
  color: var(--color-danger);
  font-size: 0.75rem;
  margin: 0.35rem 0 0;
}

.field-hint {
  color: var(--color-text-light);
  font-size: 0.75rem;
  margin: 0.35rem 0 0;
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
  margin-top: 0.25rem;
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

@media (max-width: 480px) {
  .field-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
