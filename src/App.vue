<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Gasto } from './types/Gasto';
import GastoCard from './components/GastoCard.vue';
import ResumenGastos from './components/ResumenGastos.vue';

const gastos = ref<Gasto[]>([]);

// Simular el ciclo de vida onMounted como se pidió en la imagen 4
onMounted(() => {
  console.log('El componente ya está en pantalla');
  // Aquí simulamos cargar datos de una API
  gastos.value = [
    { id: 1, descripcion: 'Cena en restaurante', monto: 45.50, pagadoPor: 'María' },
    { id: 2, descripcion: 'Boletos de cine', monto: 20.00, pagadoPor: 'Juan' },
    { id: 3, descripcion: 'Transporte y peajes', monto: 15.00, pagadoPor: 'María' },
  ];
});

// Manejadores de los emits
const manejarEliminar = (id: number) => {
  gastos.value = gastos.value.filter(g => g.id !== id);
};

const manejarSeleccionar = (id: number) => {
  alert(`Gasto #${id} seleccionado desde el componente hijo.`);
};

const limpiarGastos = () => {
  gastos.value = [];
};
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>Gestor de Gastos Compartidos</h1>
      <p>Administra los gastos del viaje fácilmente</p>
    </header>

    <main class="main-content">
      <section class="lista-gastos">
        <div class="section-header">
          <h2>Lista de Gastos</h2>
          <span class="badge">{{ gastos.length }}</span>
        </div>
        
        <div v-if="gastos.length === 0" class="empty-state">
          <p>No hay gastos registrados. ¡Todo al día!</p>
        </div>
        
        <div class="cards-container" v-else>
          <GastoCard
            v-for="gasto in gastos"
            :key="gasto.id"
            :gasto="gasto"
            @eliminar="manejarEliminar"
            @seleccionar="manejarSeleccionar"
          />
        </div>
      </section>

      <aside class="sidebar">
        <ResumenGastos 
          :gastos="gastos" 
          @limpiar-gastos="limpiarGastos" 
        />
      </aside>
    </main>
  </div>
</template>

<style>
/* Estilos globales básicos */
body {
  margin: 0;
  background-color: #f1f5f9;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}
</style>

<style scoped>
.app-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem;
}

.app-header {
  text-align: center;
  margin-bottom: 3rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2.25rem;
  font-weight: 800;
}

.app-header p {
  margin: 0;
  opacity: 0.9;
  font-size: 1.125rem;
}

.main-content {
  display: flex;
  gap: 2.5rem;
  align-items: flex-start;
}

.lista-gastos {
  flex: 2;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  margin: 0;
  color: #0f172a;
  font-size: 1.5rem;
}

.badge {
  background-color: #e2e8f0;
  color: #475569;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 700;
}

.empty-state {
  background-color: white;
  border-radius: 12px;
  padding: 3rem;
  text-align: center;
  color: #64748b;
  border: 2px dashed #cbd5e1;
}

.cards-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sidebar {
  flex: 1;
  position: sticky;
  top: 2rem;
}

@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    position: static;
  }
}
</style>
