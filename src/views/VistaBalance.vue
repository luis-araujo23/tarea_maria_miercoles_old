<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useAppStore } from '../composables/useAppStore'
import EstadoDatos from '../components/EstadoDatos.vue'
import ToastNotificacion from '../components/ToastNotificacion.vue'
import { calcularCuota, cuotaPendienteDeGasto } from '../utils/balances'
import { companeroDeUsuario } from '../utils/perfil'
import { getAvatarColor, getInitials } from '../utils/avatars'
import { validarPagoDeCompra } from '../utils/validaciones'

const { usuario } = useAuth()
const {
  gastos,
  pagos,
  companeros,
  productos,
  cargando,
  guardando,
  error,
  listo,
  reintentar,
  nombreCompanero,
  agregarPago,
} = useAppStore()

const yo = computed(() => companeroDeUsuario(usuario.value, companeros.value))

const detalle = computed(() => {
  if (!yo.value) return []

  return gastos.value
    .filter(
      (g) =>
        g.productoId &&
        (g.pagadoPorId === yo.value!.id ||
          g.divisiones.some((d) => d.companeroId === yo.value!.id)),
    )
    .map((gasto) => {
      const producto = productos.value.find((p) => p.id === gasto.productoId)
      const miCuota = calcularCuota(gasto, yo.value!.id, companeros.value)
      const yoOrganice = gasto.pagadoPorId === yo.value!.id
      const leDebo = cuotaPendienteDeGasto(gasto, yo.value!.id, pagos.value, companeros.value)
      const yaPague = pagos.value
        .filter((p) => p.gastoId === gasto.id && p.deId === yo.value!.id)
        .reduce((acc, p) => acc + p.monto, 0)
      const avanceOtros = gasto.divisiones
        .filter((d) => d.companeroId !== yo.value!.id)
        .map((d) => {
          const cuota = calcularCuota(gasto, d.companeroId, companeros.value)
          const pagado = pagos.value
            .filter((p) => p.gastoId === gasto.id && p.deId === d.companeroId)
            .reduce((acc, p) => acc + p.monto, 0)
          const pendiente = cuotaPendienteDeGasto(
            gasto,
            d.companeroId,
            pagos.value,
            companeros.value,
          )
          return {
            id: d.companeroId,
            cuota,
            pagado: Math.round(pagado * 100) / 100,
            pendiente,
            porcentaje: cuota > 0 ? Math.min(100, (pagado / cuota) * 100) : 0,
          }
        })
      const pendientesOtros = avanceOtros.filter((d) => d.pendiente > 0.009)
      const misAbonos = pagos.value
        .filter((p) => p.gastoId === gasto.id && p.deId === yo.value!.id)
        .sort((a, b) => b.id - a.id)

      return {
        gasto,
        nombre: producto?.nombre ?? gasto.descripcion,
        icono: producto?.icono ?? '📦',
        yoOrganice,
        miCuota,
        leDebo,
        yaPague,
        avanceOtros,
        pendientesOtros,
        misAbonos,
      }
    })
})

const debo = computed(() => detalle.value.filter((item) => item.leDebo > 0.009))
const pendientesCompaneros = computed(() =>
  detalle.value.filter((item) => item.avanceOtros.length > 0)
)

const totalDebo = computed(() => debo.value.reduce((acc, item) => acc + item.leDebo, 0))
const totalMeDeben = computed(() =>
  pendientesCompaneros.value.reduce(
    (acc, item) => acc + item.pendientesOtros.reduce((suma, d) => suma + d.pendiente, 0),
    0,
  )
)

const montos = reactive<Record<number, number | ''>>({})
const erroresPago = reactive<Record<number, string>>({})
const toast = ref({ visible: false, mensaje: '', tipo: 'success' as 'success' | 'error' })

async function registrarMiPago(gastoId: number, paraId: string, pendiente: number) {
  if (!yo.value) return

  const crudo = montos[gastoId]
  const monto = typeof crudo === 'number' ? crudo : Number(crudo)
  const err = validarPagoDeCompra(yo.value.id, paraId, monto, pendiente, companeros.value)
  if (err) {
    erroresPago[gastoId] = err
    return
  }

  const fallo = await agregarPago({
    deId: yo.value.id,
    paraId,
    monto,
    gastoId,
    nota: 'Abono de producto',
  })
  if (fallo) {
    erroresPago[gastoId] = fallo
    return
  }

  montos[gastoId] = ''
  erroresPago[gastoId] = ''
  const resto = Math.max(0, pendiente - monto)
  toast.value = {
    visible: true,
    mensaje:
      resto > 0.009
        ? `Abono registrado. Te quedan $${resto.toFixed(2)}`
        : 'Pago registrado. Esta deuda quedó saldada',
    tipo: 'success',
  }
  setTimeout(() => {
    toast.value.visible = false
  }, 2800)
}
</script>

<template>
  <EstadoDatos
    :cargando="cargando"
    :error="error"
    :listo="listo"
    @reintentar="reintentar"
  >
    <div class="vista">
      <header class="intro">
        <div>
          <h2>Mis deudas</h2>
          <p>Solo tú puedes registrar los pagos de tu cuenta.</p>
        </div>
      </header>

      <div v-if="!yo" class="empty">
        <p>No encontramos tu perfil. Pídele al admin que te agregue al grupo.</p>
      </div>

      <template v-else>
        <section class="resumen">
          <article class="kpi debe">
            <span>Debo</span>
            <strong>${{ totalDebo.toFixed(2) }}</strong>
          </article>
          <article class="kpi haber">
            <span>Pendiente de otros</span>
            <strong>${{ totalMeDeben.toFixed(2) }}</strong>
          </article>
        </section>

        <section class="bloque">
          <h3>Lo que debo pagar</h3>

          <div v-if="debo.length === 0" class="empty suave">
            No tienes deudas pendientes de productos.
          </div>

          <article v-for="item in debo" :key="item.gasto.id" class="card">
            <div class="card-top">
              <span class="icono">{{ item.icono }}</span>
              <div class="card-info">
                <h4>{{ item.nombre }}</h4>
                <p>
                  {{ item.yoOrganice ? 'Tú registraste la compra' : `La registró ${nombreCompanero(item.gasto.pagadoPorId)}` }}
                  · tu parte ${{ item.miCuota.toFixed(2) }}
                </p>
              </div>
              <span class="estado" :class="item.leDebo > 0 ? 'pendiente' : 'saldado'">
                {{ item.leDebo > 0 ? `Pendiente $${item.leDebo.toFixed(2)}` : 'Saldado' }}
              </span>
            </div>

            <div class="barra">
              <div
                class="barra-lleno"
                :style="{ width: `${item.miCuota > 0 ? Math.min(100, (item.yaPague / item.miCuota) * 100) : 0}%` }"
              />
            </div>
            <p class="progreso">
              Abonado ${{ item.yaPague.toFixed(2) }} de ${{ item.miCuota.toFixed(2) }}
            </p>

            <form
              v-if="item.leDebo > 0"
              class="abono"
              @submit.prevent="registrarMiPago(item.gasto.id, yo!.id, item.leDebo)"
            >
              <label>
                Monto a abonar
                <input
                  v-model.number="montos[item.gasto.id]"
                  type="number"
                  min="0.01"
                  :max="item.leDebo"
                  step="0.01"
                  :placeholder="item.leDebo.toFixed(2)"
                  :disabled="guardando"
                />
              </label>
              <button type="submit" class="btn" :disabled="guardando">
                {{ guardando ? 'Guardando…' : 'Registrar mi pago' }}
              </button>
            </form>
            <p v-if="erroresPago[item.gasto.id]" class="error">{{ erroresPago[item.gasto.id] }}</p>

            <ul v-if="item.misAbonos.length" class="historial">
              <li v-for="pago in item.misAbonos" :key="pago.id">
                Tú abonaste ${{ pago.monto.toFixed(2) }}
                <time>{{ pago.fecha }}</time>
              </li>
            </ul>
          </article>
        </section>

        <section class="bloque">
          <h3>Pendiente por parte de tus compañeros</h3>
          <p class="nota">Cada uno paga su parte desde su propia cuenta. Aquí solo ves lo que les falta.</p>

          <div v-if="pendientesCompaneros.length === 0" class="empty suave">
            Aún no hay otras personas en tus compras.
          </div>

          <article v-for="item in pendientesCompaneros" :key="item.gasto.id" class="card">
            <div class="card-top">
              <span class="icono">{{ item.icono }}</span>
              <div class="card-info">
                <h4>{{ item.nombre }}</h4>
                <p>Total ${{ item.gasto.monto.toFixed(2) }} · tu parte ya {{ item.leDebo > 0.009 ? 'está pendiente' : 'está pagada' }}</p>
              </div>
            </div>

            <ul class="deudores">
              <li v-for="persona in item.avanceOtros" :key="persona.id">
                <span
                  class="avatar"
                  :style="{ backgroundColor: getAvatarColor(nombreCompanero(persona.id)) }"
                >
                  {{ getInitials(nombreCompanero(persona.id)) }}
                </span>
                <div class="avance">
                  <div class="avance-top">
                    <span class="nombre">{{ nombreCompanero(persona.id) }}</span>
                    <span class="monto" :class="{ ok: persona.pendiente <= 0.009 }">
                      {{ persona.pendiente <= 0.009 ? 'Pagó su parte' : `Pendiente $${persona.pendiente.toFixed(2)}` }}
                    </span>
                  </div>
                  <div class="barra">
                    <div class="barra-lleno" :style="{ width: `${persona.porcentaje}%` }" />
                  </div>
                  <p class="progreso">
                    Ha pagado ${{ persona.pagado.toFixed(2) }} de ${{ persona.cuota.toFixed(2) }}
                  </p>
                </div>
              </li>
            </ul>
          </article>
        </section>
      </template>

      <ToastNotificacion :visible="toast.visible" :mensaje="toast.mensaje" :tipo="toast.tipo" />
    </div>
  </EstadoDatos>
</template>

<style scoped>
.vista {
  max-width: 760px;
}

.intro {
  margin-bottom: 1.25rem;
}

.intro h2 {
  margin: 0 0 0.3rem;
  font-size: 1.4rem;
  color: var(--color-heading);
}

.intro p,
.nota,
.progreso {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.88rem;
}

.resumen {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.kpi {
  padding: 1rem 1.1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
  background: var(--color-bg-card);
}

.kpi span {
  display: block;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
}

.kpi strong {
  display: block;
  margin-top: 0.25rem;
  font-size: 1.55rem;
}

.kpi.debe strong {
  color: var(--color-danger);
}

.kpi.haber strong {
  color: var(--color-positive);
}

.bloque {
  margin-bottom: 1.75rem;
}

.bloque h3 {
  margin: 0 0 0.35rem;
  font-size: 1.05rem;
  color: var(--color-heading);
}

.nota {
  margin-bottom: 0.85rem;
}

.card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  padding: 1rem 1.1rem;
  margin-bottom: 0.75rem;
}

.card-top {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.icono {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  background: var(--color-bg-muted);
  border-radius: var(--radius-sm);
  font-size: 1.25rem;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-info h4 {
  margin: 0;
  font-size: 1rem;
}

.card-info p {
  margin: 0.15rem 0 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.estado {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  white-space: nowrap;
}

.estado.pendiente {
  color: var(--color-danger);
  background: #fef2f2;
}

.estado.saldado {
  color: var(--color-positive);
  background: #ecfdf3;
}

.barra {
  height: 6px;
  margin: 0.85rem 0 0.35rem;
  background: var(--color-border-light);
  border-radius: 999px;
  overflow: hidden;
}

.barra-lleno {
  height: 100%;
  background: var(--ujap-blue);
}

.abono {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.6rem;
  align-items: end;
  margin-top: 0.9rem;
}

.abono label {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.abono input {
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 0.95rem;
}

.btn {
  padding: 0.58rem 0.95rem;
  background: var(--ujap-blue);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.btn:disabled {
  opacity: 0.5;
}

.error {
  margin: 0.45rem 0 0;
  color: var(--color-danger);
  font-size: 0.8rem;
}

.historial {
  list-style: none;
  margin: 0.85rem 0 0;
  padding-top: 0.7rem;
  border-top: 1px solid var(--color-border-light);
}

.historial li {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

.deudores {
  list-style: none;
  margin: 0.85rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.deudores li {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
}

.avance {
  flex: 1;
  min-width: 0;
}

.avance-top {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: baseline;
}

.avance .barra {
  margin: 0.4rem 0 0.25rem;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: white;
  font-size: 0.68rem;
  font-weight: 700;
  flex-shrink: 0;
}

.nombre {
  font-weight: 600;
}

.monto {
  font-weight: 700;
  color: var(--ujap-blue);
  font-size: 0.82rem;
}

.monto.ok {
  color: var(--color-positive);
}

.ok {
  color: var(--color-positive);
  font-weight: 600;
}

.empty {
  padding: 2rem 1rem;
  text-align: center;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  background: var(--color-bg-card);
}

.empty.suave {
  padding: 1rem;
  font-size: 0.88rem;
}

@media (max-width: 560px) {
  .resumen,
  .abono {
    grid-template-columns: 1fr;
  }

  .card-top {
    flex-wrap: wrap;
  }
}
</style>
