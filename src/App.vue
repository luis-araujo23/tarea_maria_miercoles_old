<template>
  <ToastGlobal />
  <button
    type="button"
    class="btn-tema"
    :title="esOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
    @click="esOscuro ? setTema('claro') : setTema('oscuro')"
    aria-label="Alternar tema claro/oscuro"
  >
    <span aria-hidden="true">{{ esOscuro ? '☀️' : '🌙' }}</span>
  </button>
  <router-view />
</template>

<script setup lang="ts">
import ToastGlobal from './components/ToastGlobal.vue'
import { useTema } from './composables/useTema'

const t = useTema()
const tema = t.tema
const esOscuro = t.esOscuro
const setTema = t.setTema
</script>

<style scoped>
.btn-tema {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  color: var(--color-text);
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition);
}

.btn-tema:hover {
  background: var(--color-bg-muted);
  border-color: var(--color-border-light);
}
</style>
