<script setup lang="ts">
defineProps<{
  mensaje: string
  visible: boolean
  tipo?: 'success' | 'error' | 'info'
}>()
</script>

<template>
  <Transition name="toast">
    <div
      v-if="visible"
      class="toast"
      :class="tipo ?? 'success'"
      role="status"
      aria-live="polite"
    >
      {{ mensaje }}
    </div>
  </Transition>
</template>

<style scoped>
.toast {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  padding: 0.75rem 1.25rem;
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  font-weight: 600;
  box-shadow: var(--shadow-lg);
  max-width: min(90vw, 420px);
  text-align: center;
}

.toast.success {
  background: var(--ujap-blue);
  color: white;
}

.toast.error {
  background: var(--ujap-red);
  color: white;
}

.toast.info {
  background: var(--color-heading);
  color: white;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}
</style>
