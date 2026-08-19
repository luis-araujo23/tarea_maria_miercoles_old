<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Companero, Gasto, TipoDivision } from '../types'
import { divisionIgual } from '../utils/balances'
import { validarGasto } from '../utils/validaciones'

const props = defineProps<{
  visible: boolean
  companeros: Companero[]
  gastoEditar?: Gasto | null
}>()

const emit = defineEmits(['cerrar', 'guardar'])

const descripcion = ref('')
const monto = ref<number | ''>('')
const pagadoPorId = ref('')
const fecha = ref('')
const tipoDivision = ref<TipoDivision>('igual')
const participantesSeleccionados = ref<string[]>([])
const valoresDivision = ref<Record<string, number>>({})
const error = ref('')

const esEdicion = computed(() => !!props.gastoEditar)
const titulo = computed(() => (esEdicion.value ? 'Editar gasto' : 'Agregar gasto'))

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function resetForm() {
  if (props.gastoEditar) {
    const g = props.gastoEditar
    descripcion.value = g.descripcion
    monto.value = g.monto
    pagadoPorId.value = g.pagadoPorId
    fecha.value = g.fecha
    tipoDivision.value = g.tipoDivision
    participantesSeleccionados.value = g.divisiones.map((d) => d.companeroId)
    valoresDivision.value = Object.fromEntries(
      g.divisiones.map((d) => [d.companeroId, d.valor])
    )
  } else {
    descripcion.value = ''
    monto.value = ''
    pagadoPorId.value = props.companeros[0]?.id ?? ''
    fecha.value = hoyISO()
    tipoDivision.value = 'igual'
    participantesSeleccionados.value = props.companeros.map((c) => c.id)
    valoresDivision.value = {}
  }
  error.value = ''
}

watch(
  () => [props.visible, props.gastoEditar] as const,
  ([visible]) => {
    if (visible) resetForm()
  }
)

watch(tipoDivision, (tipo) => {
  if (tipo === 'igual') return
  const m = typeof monto.value === 'number' ? monto.value : 0
  const count = participantesSeleccionados.value.length || 1
  participantesSeleccionados.value.forEach((id) => {
    if (tipo === 'porcentaje' && !valoresDivision.value[id]) {
      valoresDivision.value[id] = Math.round((100 / count) * 100) / 100
    }
    if (tipo === 'exacto' && !valoresDivision.value[id]) {
      valoresDivision.value[id] = Math.round((m / count) * 100) / 100
    }
  })
})

watch(pagadoPorId, (id) => {
  if (id && !participantesSeleccionados.value.includes(id)) {
    participantesSeleccionados.value.push(id)
  }
})

function toggleParticipante(id: string) {
  if (id === pagadoPorId.value) {
    error.value = 'El pagador debe permanecer entre los participantes'
    return
  }
  error.value = ''
  const idx = participantesSeleccionados.value.indexOf(id)
  if (idx >= 0) {
    participantesSeleccionados.value.splice(idx, 1)
    delete valoresDivision.value[id]
  } else {
    participantesSeleccionados.value.push(id)
    const count = participantesSeleccionados.value.length
    const m = typeof monto.value === 'number' ? monto.value : 0
    if (tipoDivision.value === 'porcentaje') {
      valoresDivision.value[id] = Math.round((100 / count) * 100) / 100
    } else if (tipoDivision.value === 'exacto') {
      valoresDivision.value[id] = Math.round((m / count) * 100) / 100
    }
  }
}

function guardar() {
  error.value = ''

  const divisiones =
    tipoDivision.value === 'igual'
      ? divisionIgual(participantesSeleccionados.value)
      : participantesSeleccionados.value.map((companeroId) => ({
          companeroId,
          valor: valoresDivision.value[companeroId] ?? 0,
        }))

  const payload = {
    descripcion: descripcion.value.trim(),
    monto: monto.value as number,
    pagadoPorId: pagadoPorId.value,
    fecha: fecha.value,
    tipoDivision: tipoDivision.value,
    divisiones,
  }

  const err = validarGasto(payload, props.companeros)
  if (err) {
    error.value = err
    return
  }

  emit('guardar', payload)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="overlay" @click.self="emit('cerrar')">
        <form class="modal" @submit.prevent="guardar">
          <div class="modal-header">
            <h3>{{ titulo }}</h3>
            <button type="button" class="btn-close" aria-label="Cerrar" @click="emit('cerrar')">
              ✕
            </button>
          </div>

          <div v-if="companeros.length === 0" class="sin-companeros">
            <p>Agrega compañeros al grupo antes de registrar un gasto.</p>
            <button type="button" class="btn-cancel" @click="emit('cerrar')">
              Cerrar
            </button>
          </div>

          <template v-else>
          <div class="field">
            <label for="descripcion">Descripción</label>
            <input
              id="descripcion"
              v-model="descripcion"
              type="text"
              placeholder="Ej: Copias de apuntes, videobeam..."
              required
            />
          </div>

          <div class="row">
            <div class="field">
              <label for="monto">Monto ($)</label>
              <input
                id="monto"
                v-model.number="monto"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>
            <div class="field">
              <label for="fecha">Fecha</label>
              <input id="fecha" v-model="fecha" type="date" required />
            </div>
          </div>

          <div class="field">
            <label for="pagado">Pagado por</label>
            <select id="pagado" v-model="pagadoPorId" required>
              <option v-for="c in companeros" :key="c.id" :value="c.id">
                {{ c.nombre }}
              </option>
            </select>
          </div>

          <div class="field">
            <label>Tipo de división</label>
            <div class="radio-group">
              <label class="radio">
                <input v-model="tipoDivision" type="radio" value="igual" />
                Igual
              </label>
              <label class="radio">
                <input v-model="tipoDivision" type="radio" value="porcentaje" />
                Porcentajes
              </label>
              <label class="radio">
                <input v-model="tipoDivision" type="radio" value="exacto" />
                Montos exactos
              </label>
            </div>
          </div>

          <div class="field">
            <label>Participantes</label>
            <div class="chips">
              <button
                v-for="c in companeros"
                :key="c.id"
                type="button"
                class="chip"
                :class="{ active: participantesSeleccionados.includes(c.id) }"
                @click="toggleParticipante(c.id)"
              >
                {{ c.nombre }}
              </button>
            </div>
          </div>

          <div v-if="tipoDivision !== 'igual'" class="divisiones">
            <div
              v-for="id in participantesSeleccionados"
              :key="id"
              class="field inline"
            >
              <label>
                {{ companeros.find((c) => c.id === id)?.nombre }}
                {{ tipoDivision === 'porcentaje' ? '(%)' : '($)' }}
              </label>
              <input
                v-model.number="valoresDivision[id]"
                type="number"
                min="0"
                :step="tipoDivision === 'porcentaje' ? '1' : '0.01'"
              />
            </div>
          </div>

          <p v-if="error" class="error">{{ error }}</p>

          <div class="actions">
            <button type="button" class="btn-cancel" @click="emit('cerrar')">
              Cancelar
            </button>
            <button type="submit" class="btn-save">
              {{ esEdicion ? 'Guardar cambios' : 'Agregar gasto' }}
            </button>
          </div>
          </template>
        </form>
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
  overflow-y: auto;
}

.modal {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  width: min(100%, 480px);
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.15rem;
  color: var(--color-heading);
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.1rem;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0.25rem;
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

.field input,
.field select {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-family: inherit;
  background: white;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.radio {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.875rem;
  cursor: pointer;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip {
  padding: 0.35rem 0.75rem;
  border-radius: var(--radius-full);
  border: 1.5px solid var(--color-border);
  background: white;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition);
}

.chip.active {
  background: var(--color-primary-light);
  border-color: var(--ujap-blue);
  color: var(--ujap-blue);
}

.divisiones {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.sin-companeros {
  padding: 1rem;
  background: var(--color-bg-muted);
  border-radius: var(--radius-sm);
  text-align: center;
}

.sin-companeros p {
  margin: 0 0 1rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.error {
  color: var(--ujap-red);
  font-size: 0.85rem;
  margin: 0 0 0.75rem;
}

.actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.btn-cancel,
.btn-save {
  padding: 0.65rem 1.1rem;
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

.btn-save {
  background: var(--ujap-blue);
  color: white;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@media (max-width: 480px) {
  .row,
  .divisiones {
    grid-template-columns: 1fr;
  }
}
</style>
