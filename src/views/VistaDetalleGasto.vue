<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAppStore } from '../composables/useAppStore'
import { useTasaCambio } from '../composables/useTasaCambio'
import EstadoDatos from '../components/EstadoDatos.vue'
import { calcularCuota, etiquetaDivision, participantesGasto } from '../utils/balances'
import { getCategoryIcon } from '../utils/categorias'
import { getAvatarColor, getInitials } from '../utils/avatars'

const props = defineProps<{ id: string }>()

const {
  gastos,
  companeros,
  categorias,
  cargando: cargandoDatos,
  error: errorDatos,
  listo: datosListos,
  reintentar: recargarDatos,
  nombreCompanero,
} = useAppStore()
const {
  cargando,
  error,
  disponible,
  usandoRespaldo,
  actualizadoTexto,
  tasa,
  cargarTasa,
  reintentar,
  formatearBolivares,
} = useTasaCambio()

onMounted(() => {
  cargarTasa()
})

/** El parámetro viene de la URL, así que puede ser cualquier cosa. */
const idValido = computed(() => /^\d+$/.test(props.id))

const gasto = computed(() => {
  if (!idValido.value) return null
  return gastos.value.find((g) => g.id === Number(props.id)) ?? null
})

const ordenados = computed(() =>
  [...gastos.value].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
)

const posicion = computed(() =>
  gasto.value ? ordenados.value.findIndex((g) => g.id === gasto.value!.id) : -1
)

const anterior = computed(() =>
  posicion.value > 0 ? ordenados.value[posicion.value - 1] : null
)

const siguiente = computed(() =>
  posicion.value >= 0 && posicion.value < ordenados.value.length - 1
    ? ordenados.value[posicion.value + 1]
    : null
)

const fechaLarga = computed(() => {
  if (!gasto.value) return ''
  const [y, m, d] = gasto.value.fecha.split('-').map(Number)
  if (!y || !m || !d) return gasto.value.fecha
  return new Date(y, m - 1, d).toLocaleDateString('es-VE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

const desglose = computed(() => {
  if (!gasto.value) return []
  return participantesGasto(gasto.value, companeros.value).map((p) => {
    const cuota = calcularCuota(gasto.value!, p.companeroId, companeros.value)
    return {
      companeroId: p.companeroId,
      nombre: nombreCompanero(p.companeroId),
      cuota,
      porcentaje: gasto.value!.monto > 0 ? (cuota / gasto.value!.monto) * 100 : 0,
      esPagador: p.companeroId === gasto.value!.pagadoPorId,
    }
  })
})

/** La suma de las cuotas debe cuadrar con el monto del gasto. */
const descuadre = computed(() => {
  if (!gasto.value) return 0
  const suma = desglose.value.reduce((acc, d) => acc + d.cuota, 0)
  return suma - gasto.value.monto
})
</script>

<template>
  <div class="detalle">
    <router-link :to="{ name: 'gastos' }" class="volver">← Volver a gastos</router-link>

    <EstadoDatos
      :cargando="cargandoDatos"
      :error="errorDatos"
      :listo="datosListos"
      :filas="2"
      @reintentar="recargarDatos"
    >
      <div v-if="!idValido" class="estado-vacio">
        <div class="estado-icono">⚠️</div>
        <h1>Identificador inválido</h1>
        <p>
          <code>{{ id }}</code> no es un número de gasto válido. Revisa el enlace e intenta
          de nuevo.
        </p>
      </div>

      <div v-else-if="!gasto" class="estado-vacio">
        <div class="estado-icono">🔍</div>
        <h1>Gasto no encontrado</h1>
        <p>
          El gasto #{{ id }} no existe o fue eliminado del grupo.
        </p>
      </div>

      <template v-else>
        <article class="tarjeta">
          <header class="cabecera">
            <div class="cabecera-icono" aria-hidden="true">
              {{ getCategoryIcon(gasto.descripcion, categorias) }}
            </div>
            <div class="cabecera-texto">
              <span class="cabecera-id">Gasto #{{ gasto.id }}</span>
              <h1>{{ gasto.descripcion }}</h1>
              <p class="cabecera-fecha">{{ fechaLarga }}</p>
            </div>
          </header>

          <div class="montos">
            <div class="monto-principal">
              <span class="monto-label">Monto total</span>
              <span class="monto-usd">${{ gasto.monto.toFixed(2) }}</span>
            </div>

            <div class="monto-bs">
              <span class="monto-label">Equivalente en bolívares</span>

              <span v-if="cargando && !disponible" class="monto-cargando">
                Consultando tasa del día…
              </span>
              <span v-else-if="disponible" class="monto-valor">
                {{ formatearBolivares(gasto.monto) }}
              </span>
              <span v-else class="monto-nd">No disponible</span>

              <span v-if="disponible && tasa" class="monto-nota">
                Tasa BCV referencial: Bs {{ tasa.valor.toFixed(2) }} por USD · {{ actualizadoTexto }}
              </span>
            </div>
          </div>

          <p v-if="error" class="aviso-error" role="alert">
            <span>
              {{ error }}
              <template v-if="usandoRespaldo">
                Se muestra la última tasa guardada.
              </template>
            </span>
            <button type="button" class="btn-reintentar" :disabled="cargando" @click="reintentar">
              {{ cargando ? 'Reintentando…' : 'Reintentar' }}
            </button>
          </p>

          <section class="bloque">
            <h2 class="bloque-titulo">Quién pagó</h2>
            <div class="pagador">
              <span
                class="avatar"
                :style="{ backgroundColor: getAvatarColor(nombreCompanero(gasto.pagadoPorId)) }"
              >
                {{ getInitials(nombreCompanero(gasto.pagadoPorId)) }}
              </span>
              <div>
                <strong>{{ nombreCompanero(gasto.pagadoPorId) }}</strong>
                <span class="pagador-nota">
                  adelantó ${{ gasto.monto.toFixed(2) }} por el grupo
                </span>
              </div>
            </div>
          </section>

          <section class="bloque">
            <h2 class="bloque-titulo">Reparto entre participantes</h2>
            <p class="bloque-sub">
              {{ etiquetaDivision(gasto.tipoDivision, gasto.divisiones, companeros) }}
            </p>

            <ul class="desglose">
              <li v-for="fila in desglose" :key="fila.companeroId" class="fila">
                <div class="fila-persona">
                  <span class="avatar" :style="{ backgroundColor: getAvatarColor(fila.nombre) }">
                    {{ getInitials(fila.nombre) }}
                  </span>
                  <div class="fila-datos">
                    <span class="fila-nombre">
                      {{ fila.nombre }}
                      <span v-if="fila.esPagador" class="chip">pagó</span>
                    </span>
                    <span class="fila-porcentaje">{{ fila.porcentaje.toFixed(1) }}% del gasto</span>
                  </div>
                </div>
                <div class="fila-montos">
                  <span class="fila-usd">${{ fila.cuota.toFixed(2) }}</span>
                  <span v-if="disponible" class="fila-bs">{{ formatearBolivares(fila.cuota) }}</span>
                </div>
              </li>
            </ul>

            <p v-if="Math.abs(descuadre) > 0.01" class="aviso-descuadre" role="alert">
              Las cuotas suman ${{ (gasto.monto + descuadre).toFixed(2) }} y no coinciden con el
              total de ${{ gasto.monto.toFixed(2) }}. Edita el gasto para corregir la división.
            </p>
          </section>
        </article>

        <nav class="paginacion" aria-label="Navegar entre gastos">
          <router-link
            v-if="anterior"
            :to="{ name: 'gasto-detalle', params: { id: String(anterior.id) } }"
            class="paginacion-link"
          >
            <span class="paginacion-dir">← Más reciente</span>
            <span class="paginacion-nombre">{{ anterior.descripcion }}</span>
          </router-link>
          <span v-else class="paginacion-link vacio"></span>

          <router-link
            v-if="siguiente"
            :to="{ name: 'gasto-detalle', params: { id: String(siguiente.id) } }"
            class="paginacion-link derecha"
          >
            <span class="paginacion-dir">Más antiguo →</span>
            <span class="paginacion-nombre">{{ siguiente.descripcion }}</span>
          </router-link>
          <span v-else class="paginacion-link vacio"></span>
        </nav>
      </template>
    </EstadoDatos>
  </div>
</template>

<style scoped>
.detalle {
  max-width: 760px;
  margin: 0 auto;
}

.volver {
  display: inline-block;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ujap-blue);
  text-decoration: none;
}

.volver:hover {
  text-decoration: underline;
}

.estado-vacio {
  background: var(--color-bg-card);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  padding: 3rem 2rem;
  text-align: center;
}

.estado-icono {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}

.estado-vacio h1 {
  margin: 0 0 0.5rem;
  font-size: 1.2rem;
  color: var(--color-heading);
}

.estado-vacio p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.estado-vacio code {
  background: var(--color-bg-muted);
  padding: 0.1rem 0.35rem;
  border-radius: var(--radius-sm);
}

.tarjeta {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.cabecera {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border-light);
}

.cabecera-icono {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-light);
  border-radius: var(--radius-md);
  font-size: 1.6rem;
}

.cabecera-id {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-light);
}

.cabecera-texto h1 {
  margin: 0.2rem 0 0.3rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-heading);
}

.cabecera-fecha {
  margin: 0;
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.cabecera-fecha::first-letter {
  text-transform: uppercase;
}

.montos {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  background: var(--color-bg-muted);
  border-bottom: 1px solid var(--color-border-light);
}

.monto-principal,
.monto-bs {
  flex: 1;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.monto-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
}

.monto-usd {
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-primary);
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.monto-valor {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--color-heading);
  font-variant-numeric: tabular-nums;
}

.monto-cargando,
.monto-nd {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-light);
}

.monto-nota {
  font-size: 0.7rem;
  color: var(--color-text-light);
}

.aviso-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin: 0;
  padding: 0.75rem 1.5rem;
  background: #fef2f2;
  border-bottom: 1px solid var(--color-border-light);
  font-size: 0.8rem;
  color: var(--color-danger);
}

.btn-reintentar {
  padding: 0.35rem 0.8rem;
  background: transparent;
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.btn-reintentar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.bloque {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border-light);
}

.bloque:last-child {
  border-bottom: none;
}

.bloque-titulo {
  margin: 0 0 0.75rem;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.bloque-sub {
  margin: -0.4rem 0 0.85rem;
  font-size: 0.78rem;
  color: var(--ujap-blue);
  font-weight: 500;
}

.pagador {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.pagador strong {
  display: block;
  font-size: 0.95rem;
  color: var(--color-heading);
}

.pagador-nota {
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
  color: white;
}

.desglose {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.7rem 0.85rem;
  background: var(--color-bg-muted);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);
}

.fila-persona {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 0;
}

.fila-datos {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.fila-nombre {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-heading);
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.chip {
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ujap-blue);
  background: var(--color-primary-light);
  border-radius: var(--radius-full);
  padding: 0.1rem 0.4rem;
}

.fila-porcentaje {
  font-size: 0.72rem;
  color: var(--color-text-muted);
}

.fila-montos {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}

.fila-usd {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-negative);
  font-variant-numeric: tabular-nums;
}

.fila-bs {
  font-size: 0.7rem;
  color: var(--color-text-light);
  font-variant-numeric: tabular-nums;
}

.aviso-descuadre {
  margin: 0.85rem 0 0;
  padding: 0.6rem 0.75rem;
  background: #fef2f2;
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  color: var(--color-danger);
}

.paginacion {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.paginacion-link {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.75rem 1rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  text-decoration: none;
}

.paginacion-link.vacio {
  visibility: hidden;
}

.paginacion-link.derecha {
  text-align: right;
}

.paginacion-link:hover {
  border-color: var(--ujap-blue);
}

.paginacion-dir {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ujap-blue);
}

.paginacion-nombre {
  font-size: 0.82rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 640px) {
  .cabecera {
    flex-direction: column;
  }

  .paginacion {
    flex-direction: column;
  }

  .paginacion-link.vacio {
    display: none;
  }
}
</style>
