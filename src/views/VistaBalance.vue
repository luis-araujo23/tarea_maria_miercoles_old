<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useAppStore } from '../composables/useAppStore'
import EstadoDatos from '../components/EstadoDatos.vue'
import ToastNotificacion from '../components/ToastNotificacion.vue'
import { calcularCuota, cuotaPendienteDeGasto, participantesGasto } from '../utils/balances'
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
        g.pagadoPorId === yo.value!.id ||
        participantesGasto(g, companeros.value).some((d) => d.companeroId === yo.value!.id),
    )
    .map((gasto) => {
      const producto = productos.value.find((p) => p.id === gasto.productoId)
      const miCuota = calcularCuota(gasto, yo.value!.id, companeros.value)
      const yoOrganice = gasto.pagadoPorId === yo.value!.id
      const leDebo = cuotaPendienteDeGasto(gasto, yo.value!.id, pagos.value, companeros.value)
      const yaPague = yoOrganice
        ? miCuota
        : pagos.value
            .filter((p) => p.gastoId === gasto.id && p.deId === yo.value!.id)
            .reduce((acc, p) => acc + p.monto, 0)
      const miPorcentaje = miCuota > 0 ? Math.min(100, (yaPague / miCuota) * 100) : 100

      // Estado de todos los participantes de esta misma compra
      const participantes = participantesGasto(gasto, companeros.value).map((d) => {
        const cuota = calcularCuota(gasto, d.companeroId, companeros.value)
        const esComprador = gasto.pagadoPorId === d.companeroId
        const abonos = pagos.value
          .filter((p) => p.gastoId === gasto.id && p.deId === d.companeroId)
          .reduce((acc, p) => acc + p.monto, 0)
        const pagado = esComprador ? cuota : Math.round(abonos * 100) / 100
        const pendiente = cuotaPendienteDeGasto(
          gasto,
          d.companeroId,
          pagos.value,
          companeros.value,
        )
        const esYo = d.companeroId === yo.value!.id
        return {
          id: d.companeroId,
          nombre: nombreCompanero(d.companeroId),
          cuota,
          pagado,
          pendiente,
          porcentaje: cuota > 0 ? Math.min(100, (pagado / cuota) * 100) : 100,
          esYo,
          esComprador,
          saldado: pendiente <= 0.009,
        }
      })

      const otrosParticipantes = participantes.filter((p) => !p.esYo)
      const totalPendienteOtros = otrosParticipantes.reduce((sum, p) => sum + p.pendiente, 0)
      const compraTotalmenteSaldada = participantes.every((p) => p.saldado)

      const misAbonos = pagos.value
        .filter((p) => p.gastoId === gasto.id && p.deId === yo.value!.id)
        .sort((a, b) => b.id - a.id)

      return {
        gasto,
        nombre: producto?.nombre ?? gasto.descripcion,
        icono: producto?.icono ?? '🧾',
        yoOrganice,
        miCuota,
        leDebo,
        yaPague,
        miPorcentaje,
        participantes,
        otrosParticipantes,
        totalPendienteOtros,
        compraTotalmenteSaldada,
        misAbonos,
      }
    })
})

const totalDebo = computed(() =>
  detalle.value.reduce((acc, item) => acc + item.leDebo, 0)
)

const totalMeDeben = computed(() =>
  detalle.value
    .filter((item) => item.yoOrganice)
    .reduce((acc, item) => acc + item.totalPendienteOtros, 0)
)

const montos = reactive<Record<number, number | ''>>({})
const erroresPago = reactive<Record<number, string>>({})
const toast = ref({ visible: false, mensaje: '', tipo: 'success' as 'success' | 'error' })

async function registrarMiPago(gastoId: number, paraId: string, pendiente: number) {
  if (!yo.value) return

  const crudo = montos[gastoId]
  const monto = typeof crudo === 'number' ? crudo : (crudo ? Number(crudo) : pendiente)
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
    nota: 'Abono de cuota personal',
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
        : '¡Pago registrado! Tu parte de esta compra quedó saldada',
    tipo: 'success',
  }
  setTimeout(() => {
    toast.value.visible = false
  }, 3000)
}

async function aprobarPagoDeCompanero(gastoId: number, deId: string, monto: number) {
  if (!yo.value) return

  const fallo = await agregarPago({
    deId,
    paraId: yo.value.id,
    monto,
    gastoId,
    nota: 'Pago aprobado y recibido',
  })
  if (fallo) {
    toast.value = { visible: true, mensaje: fallo, tipo: 'error' }
    setTimeout(() => { toast.value.visible = false }, 3000)
    return
  }

  toast.value = {
    visible: true,
    mensaje: `Pago de $${monto.toFixed(2)} aprobado para ${nombreCompanero(deId)}`,
    tipo: 'success',
  }
  setTimeout(() => { toast.value.visible = false }, 3000)
}

const historialPagosAprobados = computed(() => {
  if (!yo.value) return []
  return pagos.value
    .filter((p) => p.deId === yo.value!.id || p.paraId === yo.value!.id)
    .slice()
    .sort((a, b) => b.id - a.id)
})
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
          <h2>Mis deudas y compras compartidas</h2>
          <p>Consulta cuánto debes por tu cuota y cuánto deben los demás compañeros en cada compra.</p>
        </div>
      </header>

      <div v-if="!yo" class="empty">
        <p>No encontramos tu perfil de compañero. Pídele al admin que te agregue al grupo.</p>
      </div>

      <template v-else>
        <section class="resumen">
          <article class="kpi" :class="totalDebo > 0.009 ? 'debe' : 'haber'">
            <span>Debo pagar (Mi saldo pendiente)</span>
            <strong>${{ totalDebo.toFixed(2) }}</strong>
            <small class="kpi-sub">{{ totalDebo > 0.009 ? 'Tienes cuotas pendientes' : '✓ ¡Estás al día!' }}</small>
          </article>
          <article class="kpi haber">
            <span>Pendiente por cobrar a otros</span>
            <strong>${{ totalMeDeben.toFixed(2) }}</strong>
            <small class="kpi-sub">Deudas de compras que tú registraste</small>
          </article>
        </section>

        <section class="bloque">
          <div class="bloque-header">
            <h3>Compras donde participo ({{ detalle.length }})</h3>
            <span class="bloque-desc">En cada compra se detalla tu cuota y la de los demás participantes para que todos paguen su parte.</span>
          </div>

          <div v-if="detalle.length === 0" class="empty suave">
            No estás registrado en ninguna compra o gasto universitario todavía.
          </div>

          <article v-for="item in detalle" :key="item.gasto.id" class="card">
            <!-- CABECERA DE LA COMPRA -->
            <div class="card-top">
              <span class="icono">{{ item.icono }}</span>
              <div class="card-info">
                <h4>{{ item.nombre }}</h4>
                <p>
                  Costo total: ${{ item.gasto.monto.toFixed(2) }} ·
                  {{ item.yoOrganice ? 'Registrada por ti' : `Registrada por ${nombreCompanero(item.gasto.pagadoPorId)}` }}
                  · {{ item.gasto.fecha }}
                </p>
              </div>
              <span
                class="estado"
                :class="item.compraTotalmenteSaldada ? 'saldado' : (item.leDebo > 0.009 ? 'pendiente' : 'saldado')"
              >
                {{ item.compraTotalmenteSaldada ? '✓ 100% Saldada' : (item.leDebo > 0.009 ? `Debes $${item.leDebo.toFixed(2)}` : '✓ Tu cuota saldada') }}
              </span>
            </div>

            <!-- BLOQUE 1: TU PARTE EN ESTA COMPRA -->
            <div class="seccion-mi-cuota">
              <div class="mi-cuota-header">
                <span class="subtitulo-cuota">Tu parte en esta compra</span>
                <span class="monto-cuota-tag" :class="{ ok: item.leDebo <= 0.009 }">
                  {{ item.yoOrganice ? '✓ Comprador (Pagado al contado)' : (item.leDebo <= 0.009 ? '✓ Has saldado tu cuota' : `Pendiente por pagar: $${item.leDebo.toFixed(2)}`) }}
                </span>
              </div>

              <div class="barra">
                <div class="barra-lleno" :style="{ width: `${item.miPorcentaje}%` }" />
              </div>
              <p class="progreso">
                {{ item.yoOrganice ? `Pagaste la compra completa ($${item.gasto.monto.toFixed(2)}). Tu cuota de $${item.miCuota.toFixed(2)} está 100% cubierta.` : `Has abonado $${item.yaPague.toFixed(2)} de tu cuota de $${item.miCuota.toFixed(2)}` }}
              </p>

              <!-- Formulario de pago de tu propia parte -->
              <form
                v-if="item.leDebo > 0.009"
                class="abono"
                @submit.prevent="registrarMiPago(item.gasto.id, item.gasto.pagadoPorId, item.leDebo)"
              >
                <label>
                  Monto a pagar ($)
                  <input
                    v-model.number="montos[item.gasto.id]"
                    type="number"
                    min="0.01"
                    :max="item.leDebo"
                    step="0.01"
                    :placeholder="`Total: $${item.leDebo.toFixed(2)}`"
                    :disabled="guardando"
                  />
                </label>
                <button type="submit" class="btn" :disabled="guardando">
                  {{ guardando ? 'Guardando…' : `Pagar mi parte ($${item.leDebo.toFixed(2)})` }}
                </button>
              </form>
              <p v-if="erroresPago[item.gasto.id]" class="error">{{ erroresPago[item.gasto.id] }}</p>

              <ul v-if="item.misAbonos.length" class="historial">
                <li v-for="pago in item.misAbonos" :key="pago.id">
                  <span>Has abonado ${{ pago.monto.toFixed(2) }}</span>
                  <time>{{ pago.fecha }}</time>
                </li>
              </ul>
            </div>

            <!-- BLOQUE 2: COMPAÑEROS EN ESTA MISMA COMPRA -->
            <div class="seccion-companeros">
              <div class="companeros-header">
                <span class="subtitulo-cuota">Compañeros en esta misma compra</span>
                <span class="resumen-otros-tag">
                  {{ item.otrosParticipantes.length ? (item.totalPendienteOtros > 0.009 ? `Pendiente por pagar: $${item.totalPendienteOtros.toFixed(2)}` : '✓ Todos han saldado') : 'Solo tú participas' }}
                </span>
              </div>

              <div v-if="item.otrosParticipantes.length === 0" class="empty-pequeno">
                Eres la única persona participante en esta compra.
              </div>

              <ul v-else class="deudores">
                <li v-for="persona in item.otrosParticipantes" :key="persona.id">
                  <span
                    class="avatar"
                    :style="{ backgroundColor: getAvatarColor(persona.nombre) }"
                  >
                    {{ getInitials(persona.nombre) }}
                  </span>
                  <div class="avance">
                    <div class="avance-top">
                      <span class="nombre">{{ persona.nombre }}</span>
                      <span class="monto" :class="{ ok: persona.saldado }">
                        {{ persona.esComprador ? `✓ Comprador ($${persona.cuota.toFixed(2)})` : (persona.saldado ? `✓ Pagó su parte ($${persona.cuota.toFixed(2)})` : `Debe $${persona.pendiente.toFixed(2)} de $${persona.cuota.toFixed(2)}`) }}
                      </span>
                    </div>
                    <div class="barra">
                      <div class="barra-lleno" :style="{ width: `${persona.porcentaje}%` }" />
                    </div>
                    <p class="progreso">
                      {{ persona.esComprador ? 'Cubrió su parte al registrar la compra' : `Ha abonado $${persona.pagado.toFixed(2)} de $${persona.cuota.toFixed(2)}` }}
                    </p>
                    <div v-if="item.yoOrganice && !persona.saldado" class="accion-aprobar">
                      <button
                        type="button"
                        class="btn-aprobar-recibido"
                        :disabled="guardando"
                        title="Confirmar que recibiste este pago y marcarlo como aprobado"
                        @click="aprobarPagoDeCompanero(item.gasto.id, persona.id, persona.pendiente)"
                      >
                        ✓ Aprobar pago recibido de {{ persona.nombre }} (${{ persona.pendiente.toFixed(2) }})
                      </button>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </article>
        </section>

        <!-- BLOQUE 3: HISTORIAL GENERAL DE PAGOS APROBADOS -->
        <section class="bloque">
          <h3>Historial de pagos aprobados</h3>
          <p class="nota">Abonos y pagos registrados en tiempo real vinculados a tu cuenta.</p>

          <div v-if="historialPagosAprobados.length === 0" class="empty suave">
            Aún no se han registrado pagos para tu cuenta.
          </div>

          <ul v-else class="historial-aprobados">
            <li v-for="p in historialPagosAprobados" :key="p.id" class="item-pago">
              <div class="pago-flujo">
                <span
                  class="avatar-xs"
                  :style="{ backgroundColor: getAvatarColor(nombreCompanero(p.deId)) }"
                >
                  {{ getInitials(nombreCompanero(p.deId)) }}
                </span>
                <span class="pago-actor">{{ nombreCompanero(p.deId) }}</span>
                <span class="pago-flecha">→</span>
                <span
                  class="avatar-xs"
                  :style="{ backgroundColor: getAvatarColor(nombreCompanero(p.paraId)) }"
                >
                  {{ getInitials(nombreCompanero(p.paraId)) }}
                </span>
                <span class="pago-actor">{{ nombreCompanero(p.paraId) }}</span>
              </div>
              <div class="pago-meta">
                <span class="pago-monto">${{ p.monto.toFixed(2) }}</span>
                <span class="badge-aprobado">✓ Aprobado</span>
                <time class="pago-fecha">{{ p.fecha }}</time>
              </div>
            </li>
          </ul>
        </section>
      </template>

      <ToastNotificacion :visible="toast.visible" :mensaje="toast.mensaje" :tipo="toast.tipo" />
    </div>
  </EstadoDatos>
</template>

<style scoped>
.vista {
  max-width: 780px;
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

.kpi-sub {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.72rem;
  color: var(--color-text-muted);
}

.kpi.debe strong {
  color: var(--color-danger);
}

.kpi.haber strong {
  color: var(--color-positive);
}

.bloque {
  margin-bottom: 2rem;
}

.bloque-header {
  margin-bottom: 0.85rem;
}

.bloque h3 {
  margin: 0 0 0.25rem;
  font-size: 1.05rem;
  color: var(--color-heading);
}

.bloque-desc {
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.nota {
  margin-bottom: 0.85rem;
}

.card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  padding: 1.15rem;
  margin-bottom: 1rem;
  box-shadow: var(--shadow-sm);
}

.card-top {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid var(--color-border-light);
}

.icono {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  background: var(--color-bg-muted);
  border-radius: var(--radius-sm);
  font-size: 1.35rem;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-info h4 {
  margin: 0;
  font-size: 1.05rem;
  color: var(--color-heading);
}

.card-info p {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.estado {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
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

/* SECCIÓN TU CUOTA */
.seccion-mi-cuota {
  background: var(--color-bg-muted);
  border-radius: var(--radius-sm);
  padding: 0.95rem 1rem;
  margin-top: 0.85rem;
  border: 1px solid var(--color-border-light);
}

.mi-cuota-header,
.companeros-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.35rem;
}

.subtitulo-cuota {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-heading);
}

.monto-cuota-tag {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--color-danger);
}

.monto-cuota-tag.ok {
  color: var(--color-positive);
}

.resumen-otros-tag {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.barra {
  height: 7px;
  margin: 0.5rem 0 0.35rem;
  background: var(--color-border-light);
  border-radius: 999px;
  overflow: hidden;
}

.barra-lleno {
  height: 100%;
  background: var(--ujap-blue);
  transition: width 0.3s ease;
}

.abono {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.6rem;
  align-items: end;
  margin-top: 0.85rem;
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
  background: white;
}

.btn {
  padding: 0.58rem 1rem;
  background: var(--ujap-blue);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.2s;
}

.btn:hover {
  opacity: 0.95;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  margin: 0.45rem 0 0;
  color: var(--color-danger);
  font-size: 0.8rem;
}

.historial {
  list-style: none;
  margin: 0.75rem 0 0;
  padding: 0.6rem 0 0;
  border-top: 1px solid var(--color-border-light);
}

.historial li {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

/* SECCIÓN COMPAÑEROS */
.seccion-companeros {
  margin-top: 1rem;
  padding-top: 0.95rem;
  border-top: 1px dashed var(--color-border-light);
}

.deudores {
  list-style: none;
  margin: 0.75rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.deudores li {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  background: var(--color-bg-muted);
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-light);
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
  font-size: 0.88rem;
}

.monto {
  font-weight: 700;
  color: var(--ujap-blue);
  font-size: 0.82rem;
}

.monto.ok {
  color: var(--color-positive);
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
  padding: 1.25rem;
  font-size: 0.88rem;
}

.empty-pequeno {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-style: italic;
  padding: 0.4rem 0;
}

.accion-aprobar {
  margin-top: 0.45rem;
}

.btn-aprobar-recibido {
  background: #f59e0b;
  color: #0f172a;
  border: none;
  font-size: 0.74rem;
  font-weight: 700;
  padding: 0.35rem 0.65rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-aprobar-recibido:hover {
  opacity: 0.9;
}

.btn-aprobar-recibido:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.historial-aprobados {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item-pago {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  padding: 0.65rem 0.9rem;
  gap: 0.75rem;
  font-size: 0.85rem;
}

.pago-flujo {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
}

.pago-actor {
  font-weight: 600;
}

.pago-flecha {
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.avatar-xs {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: white;
  font-size: 0.62rem;
  font-weight: 700;
  flex-shrink: 0;
}

.pago-meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
}

.pago-monto {
  font-weight: 700;
  color: var(--ujap-blue);
}

.badge-aprobado {
  background: #dcfce7;
  color: #15803d;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
}

.pago-fecha {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

@media (max-width: 580px) {
  .resumen,
  .abono {
    grid-template-columns: 1fr;
  }

  .card-top,
  .item-pago {
    flex-wrap: wrap;
  }
}
</style>
