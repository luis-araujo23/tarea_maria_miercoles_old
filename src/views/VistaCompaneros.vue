<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '../composables/useAppStore'
import { getAvatarColor, getInitials } from '../utils/avatars'
import { validarNombreCompanero } from '../utils/validaciones'

const { companeros, nextCompaneroId } = useAppStore()

const nombreNuevo = ref('')
const errorNombre = ref('')

const toast = ref({ visible: false, mensaje: '', tipo: 'success' as 'success' | 'error' | 'info' })
let toastTimer: ReturnType<typeof setTimeout> | null = null

function mostrarToast(mensaje: string, tipo: 'success' | 'error' | 'info' = 'success') {
  toast.value = { visible: true, mensaje, tipo }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value.visible = false
  }, 2800)
}

function agregar() {
  errorNombre.value = ''
  const err = validarNombreCompanero(nombreNuevo.value)
  if (err) {
    errorNombre.value = err
    return
  }
  if (companeros.value.some((c) => c.nombre.toLowerCase() === nombreNuevo.value.trim().toLowerCase())) {
    errorNombre.value = 'Ese companero ya existe'
    return
  }
  const id = `c${nextCompaneroId.value++}`
  companeros.value.push({ id, nombre: nombreNuevo.value.trim() })
  mostrarToast(`${nombreNuevo.value.trim()} agregado al grupo`)
  nombreNuevo.value = ''
}

function eliminar(id: string) {
  const nombre = companeros.value.find((c) => c.id === id)?.nombre ?? ''

  if (companeros.value.length <= 1) {
    mostrarToast('Debe quedar al menos un companero en el grupo', 'error')
    return
  }

  companeros.value = companeros.value.filter((c) => c.id !== id)
  mostrarToast(`${nombre} eliminado del grupo`)
}
</script>

<template>
  <div class="vista-companeros">
    <div class="intro">
      <h2>Companeros del grupo</h2>
      <p>Administra quien participa en Calculo I — Semestre 2026.</p>
    </div>

    <form class="add-form" @submit.prevent="agregar">
      <input
        v-model="nombreNuevo"
        type="text"
        placeholder="Nombre del companero"
        aria-label="Nombre del companero"
      />
      <button type="submit" class="btn-add">Agregar</button>
    </form>
    <p v-if="errorNombre" class="error-nombre">{{ errorNombre }}</p>

    <ul v-if="companeros.length" class="lista">
      <li v-for="c in companeros" :key="c.id" class="item">
        <div class="person">
          <span
            class="avatar"
            :style="{ backgroundColor: getAvatarColor(c.nombre) }"
          >
            {{ getInitials(c.nombre) }}
          </span>
          <span class="nombre">{{ c.nombre }}</span>
        </div>
        <button
          type="button"
          class="btn-remove"
          title="Eliminar companero"
          @click="eliminar(c.id)"
        >
          Eliminar
        </button>
      </li>
    </ul>

    <div v-else class="empty">
      <p>No hay companeros registrados. Agrega al menos uno para dividir gastos.</p>
    </div>

    <div v-if="toast.visible" class="toast" :class="toast.tipo">
      {{ toast.mensaje }}
    </div>
  </div>
</template>

<style scoped>
.vista-companeros {
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

.add-form {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.add-form input {
  flex: 1;
  padding: 0.65rem 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.9rem;
}

.btn-add {
  padding: 0.65rem 1.1rem;
  background: var(--ujap-blue);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
}

.error-nombre {
  margin: -0.5rem 0 1rem;
  color: var(--ujap-red);
  font-size: 0.85rem;
}

.lista {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  background: var(--color-bg-muted);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-light);
}

.person {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
}

.nombre {
  font-weight: 600;
  color: var(--color-heading);
}

.btn-remove {
  padding: 0.4rem 0.75rem;
  background: transparent;
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-remove:hover {
  background: var(--color-danger);
  color: white;
}

.empty {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--color-text-muted);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
}

.toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.85rem;
  color: white;
  z-index: 200;
}

.toast.success {
  background: var(--ujap-blue);
}

.toast.error {
  background: var(--ujap-red);
}
</style>
