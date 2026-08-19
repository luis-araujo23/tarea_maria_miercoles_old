import type {
  BalancePersona,
  Companero,
  DeudaSimplificada,
  DivisionParticipante,
  Gasto,
  Pago,
  TipoDivision,
} from '../types'

export function divisionIgual(companeroIds: string[]): DivisionParticipante[] {
  return companeroIds.map((companeroId) => ({ companeroId, valor: 0 }))
}

export function participantesGasto(
  gasto: Gasto,
  companeros: Companero[]
): DivisionParticipante[] {
  if (gasto.divisiones.length > 0) return gasto.divisiones
  return divisionIgual(companeros.map((c) => c.id))
}

export function calcularCuota(
  gasto: Gasto,
  companeroId: string,
  companeros: Companero[]
): number {
  const participantes = participantesGasto(gasto, companeros)
  if (participantes.length === 0) return 0

  switch (gasto.tipoDivision) {
    case 'igual':
      return gasto.monto / participantes.length
    case 'porcentaje': {
      const div = participantes.find((d) => d.companeroId === companeroId)
      return div ? gasto.monto * (div.valor / 100) : 0
    }
    case 'exacto': {
      const div = participantes.find((d) => d.companeroId === companeroId)
      return div?.valor ?? 0
    }
    default:
      return 0
  }
}

export function calcularBalances(
  gastos: Gasto[],
  pagos: Pago[],
  companeros: Companero[]
): BalancePersona[] {
  const balances: Record<string, number> = {}
  const pagado: Record<string, number> = {}
  const debe: Record<string, number> = {}

  companeros.forEach((c) => {
    balances[c.id] = 0
    pagado[c.id] = 0
    debe[c.id] = 0
  })

  gastos.forEach((gasto) => {
    pagado[gasto.pagadoPorId] = (pagado[gasto.pagadoPorId] ?? 0) + gasto.monto
    balances[gasto.pagadoPorId] = (balances[gasto.pagadoPorId] ?? 0) + gasto.monto

    const participantes = participantesGasto(gasto, companeros)
    participantes.forEach((p) => {
      const cuota = calcularCuota(gasto, p.companeroId, companeros)
      debe[p.companeroId] = (debe[p.companeroId] ?? 0) + cuota
      balances[p.companeroId] = (balances[p.companeroId] ?? 0) - cuota
    })
  })

  pagos.forEach((pago) => {
    balances[pago.deId] = (balances[pago.deId] ?? 0) + pago.monto
    balances[pago.paraId] = (balances[pago.paraId] ?? 0) - pago.monto
  })

  return companeros.map((c) => ({
    companeroId: c.id,
    pagado: pagado[c.id] ?? 0,
    debe: debe[c.id] ?? 0,
    balance: balances[c.id] ?? 0,
  }))
}

export function simplificarDeudas(balances: BalancePersona[]): DeudaSimplificada[] {
  const creditors = balances
    .filter((b) => b.balance > 0.009)
    .map((b) => ({ id: b.companeroId, amount: b.balance }))
    .sort((a, b) => b.amount - a.amount)

  const debtors = balances
    .filter((b) => b.balance < -0.009)
    .map((b) => ({ id: b.companeroId, amount: -b.balance }))
    .sort((a, b) => b.amount - a.amount)

  const transacciones: DeudaSimplificada[] = []
  let i = 0
  let j = 0

  while (i < debtors.length && j < creditors.length) {
    const monto = Math.min(debtors[i]!.amount, creditors[j]!.amount)
    transacciones.push({
      deId: debtors[i]!.id,
      paraId: creditors[j]!.id,
      monto: Math.round(monto * 100) / 100,
    })
    debtors[i]!.amount -= monto
    creditors[j]!.amount -= monto
    if (debtors[i]!.amount < 0.009) i++
    if (creditors[j]!.amount < 0.009) j++
  }

  return transacciones
}

export function etiquetaDivision(
  tipo: TipoDivision,
  divisiones: DivisionParticipante[],
  companeros: Companero[]
): string {
  const nombre = (id: string) =>
    companeros.find((c) => c.id === id)?.nombre ?? 'Desconocido'

  switch (tipo) {
    case 'igual':
      return `Dividido igual (${divisiones.length} personas)`
    case 'porcentaje':
      return divisiones
        .map((d) => `${nombre(d.companeroId)} ${d.valor}%`)
        .join(' · ')
    case 'exacto':
      return divisiones
        .map((d) => `${nombre(d.companeroId)} $${d.valor.toFixed(2)}`)
        .join(' · ')
    default:
      return ''
  }
}

export function validarDivision(
  monto: number,
  tipo: TipoDivision,
  divisiones: DivisionParticipante[]
): string | null {
  if (divisiones.length === 0) return 'Selecciona al menos un participante'

  for (const division of divisiones) {
    if (Number.isNaN(division.valor) || division.valor < 0) {
      return 'Los valores de la división no pueden ser negativos'
    }
  }

  if (tipo === 'porcentaje') {
    const total = divisiones.reduce((acc, d) => acc + d.valor, 0)
    if (Math.abs(total - 100) > 0.01) {
      return `Los porcentajes deben sumar 100% (actual: ${total.toFixed(1)}%)`
    }
  }

  if (tipo === 'exacto') {
    const total = divisiones.reduce((acc, d) => acc + d.valor, 0)
    if (Math.abs(total - monto) > 0.01) {
      return `Los montos deben sumar $${monto.toFixed(2)} (actual: $${total.toFixed(2)})`
    }
  }

  return null
}
