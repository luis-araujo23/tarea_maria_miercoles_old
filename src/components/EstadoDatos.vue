<script setup lang="ts">
/**
 * Envoltura para los tres estados de una vista conectada a la API:
 * cargando, error y datos listos. Cuando ya hay datos en pantalla el error
 * pasa a ser un aviso discreto en vez de reemplazar todo el contenido.
 */
defineProps<{
  cargando: boolean
  error: string | null
  /** True cuando ya se recibió una respuesta utilizable del servidor. */
  listo: boolean
  filas?: number
}>()

defineEmits<{ reintentar: [] }>()
</script>

<template>
  <div v-if="cargando && !listo" class="cargando" role="status" aria-live="polite">
    <span class="spinner" aria-hidden="true"></span>
    <p>Cargando datos del grupo…</p>
    <div class="esqueleto" aria-hidden="true">
      <div v-for="fila in filas ?? 3" :key="fila" class="esqueleto-fila"></div>
    </div>
  </div>

  <div v-else-if="error && !listo" class="fallo" role="alert">
    <div class="fallo-icono" aria-hidden="true">📡</div>
    <h3>No se pudieron cargar los datos</h3>
    <p>{{ error }}</p>
    <button type="button" class="btn-reintentar" :disabled="cargando" @click="$emit('reintentar')">
      {{ cargando ? 'Reintentando…' : 'Reintentar' }}
    </button>
  </div>

  <template v-else>
    <p v-if="error" class="aviso" role="alert">
      <span>{{ error }} Se muestran los últimos datos cargados.</span>
      <button
        type="button"
        class="btn-aviso"
        :disabled="cargando"
        @click="$emit('reintentar')"
      >
        {{ cargando ? 'Reintentando…' : 'Reintentar' }}
      </button>
    </p>
    <slot />
  </template>
</template>

<style scoped>
.cargando {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: 2rem 1.5rem;
  text-align: center;
}

.cargando p {
  margin: 0.75rem 0 1.25rem;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.spinner {
  display: inline-block;
  width: 22px;
  height: 22px;
  border: 3px solid var(--color-border);
  border-top-color: var(--ujap-blue);
  border-radius: var(--radius-full);
  animation: giro 0.7s linear infinite;
}

@keyframes giro {
  to {
    transform: rotate(360deg);
  }
}

.esqueleto {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.esqueleto-fila {
  height: 42px;
  border-radius: var(--radius-sm);
  background: linear-gradient(
    90deg,
    var(--color-bg-muted) 25%,
    var(--color-border-light) 50%,
    var(--color-bg-muted) 75%
  );
  background-size: 200% 100%;
  animation: brillo 1.2s ease-in-out infinite;
}

@keyframes brillo {
  to {
    background-position: -200% 0;
  }
}

.fallo {
  background: var(--color-bg-card);
  border: 2px dashed var(--color-danger);
  border-radius: var(--radius-lg);
  padding: 2.5rem 1.5rem;
  text-align: center;
}

.fallo-icono {
  font-size: 2.25rem;
  margin-bottom: 0.5rem;
}

.fallo h3 {
  margin: 0 0 0.4rem;
  font-size: 1.05rem;
  color: var(--color-heading);
}

.fallo p {
  margin: 0 0 1.25rem;
  font-size: 0.88rem;
  color: var(--color-text-muted);
}

.aviso {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 0 0 1rem;
  padding: 0.7rem 0.9rem;
  background: #fef2f2;
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  color: var(--color-danger);
}

.btn-reintentar,
.btn-aviso {
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
  background: transparent;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.btn-reintentar {
  padding: 0.6rem 1.4rem;
  font-size: 0.85rem;
}

.btn-aviso {
  padding: 0.3rem 0.7rem;
  font-size: 0.75rem;
}

.btn-reintentar:disabled,
.btn-aviso:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-reintentar:hover:not(:disabled),
.btn-aviso:hover:not(:disabled) {
  background: var(--color-danger);
  color: white;
}
</style>
