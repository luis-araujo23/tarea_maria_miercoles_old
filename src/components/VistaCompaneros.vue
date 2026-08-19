<script setup lang="ts">
import type { Companero } from '../types'
import { getAvatarColor, getInitials } from '../utils/avatars'

defineProps<{
  companeros: Companero[]
}>()

const emit = defineEmits<{
  agregar: [nombre: string]
  eliminar: [id: string]
}>()

const nombreNuevo = defineModel<string>('nombreNuevo', { default: '' })

function agregar() {
  const nombre = nombreNuevo.value.trim()
  if (!nombre) return
  emit('agregar', nombre)
  nombreNuevo.value = ''
}
</script>

<template>
  <div class="vista-companeros">
    <div class="intro">
      <h2>Compañeros del grupo</h2>
      <p>Administra quién participa en Cálculo I — Semestre 2026.</p>
    </div>

    <form class="add-form" @submit.prevent="agregar">
      <input
        v-model="nombreNuevo"
        type="text"
        placeholder="Nombre del compañero"
        aria-label="Nombre del compañero"
      />
      <button type="submit" class="btn-add">Agregar</button>
    </form>

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
          title="Eliminar compañero"
          @click="emit('eliminar', c.id)"
        >
          Eliminar
        </button>
      </li>
    </ul>

    <div v-else class="empty">
      <p>No hay compañeros registrados. Agrega al menos uno para dividir gastos.</p>
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
</style>
