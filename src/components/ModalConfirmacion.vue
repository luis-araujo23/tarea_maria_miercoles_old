<script setup lang="ts">
defineProps<{
  visible: boolean
  titulo: string
  mensaje: string
  confirmarTexto?: string
  cancelarTexto?: string
}>()

const emit = defineEmits(['confirmar', 'cancelar'])
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="overlay" @click.self="emit('cancelar')">
        <div class="modal" role="dialog" aria-modal="true">
          <h3>{{ titulo }}</h3>
          <p>{{ mensaje }}</p>
          <div class="actions">
            <button class="btn-cancel" type="button" @click="emit('cancelar')">
              {{ cancelarTexto ?? 'Cancelar' }}
            </button>
            <button class="btn-confirm" type="button" @click="emit('confirmar')">
              {{ confirmarTexto ?? 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 900;
  padding: 1rem;
}

.modal {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  width: min(100%, 400px);
  box-shadow: var(--shadow-lg);
}

.modal h3 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  color: var(--color-heading);
}

.modal p {
  margin: 0 0 1.25rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  line-height: 1.5;
}

.actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn-cancel,
.btn-confirm {
  padding: 0.6rem 1rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  border: none;
}

.btn-cancel {
  background: var(--color-bg-muted);
  color: var(--color-text);
}

.btn-confirm {
  background: var(--ujap-red);
  color: white;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: scale(0.95);
}
</style>
