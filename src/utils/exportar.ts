/**
 * Utilidades para exportar datos de la app a archivos CSV.
 *
 * Genera el contenido de texto y ofrece una función para descargar el archivo
 * desde el navegador sin depender de ningún servidor.
 */

import type { Gasto } from '../types'
import type { BalancePersona } from '../types'

/** Escapa un valor para que pueda ir dentro de una celda CSV. */
function escaparCSV(valor: unknown): string {
  const texto = String(valor ?? '')
  if (/[",\n\r]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`
  }
  return texto
}

/** Convierte una lista de gastos a texto CSV. */
export function gastosACSV(
  gastos: Gasto[],
  nombres: Record<string, string>,
): string {
  const cabeceras = [
    'Fecha',
    'Descripcion',
    'Monto (USD)',
    'Pagado por',
    'Tipo de division',
    'Participantes',
  ]

  const filas = gastos.map((gasto) => [
    gasto.fecha,
    escaparCSV(gasto.descripcion),
    gasto.monto.toFixed(2),
    nombres[gasto.pagadoPorId] ?? gasto.pagadoPorId,
    gasto.tipoDivision,
    gasto.divisiones
      .map((d) => `${nombres[d.companeroId] ?? d.companeroId}`)
      .join('; '),
  ])

  return [cabeceras.join(','), ...filas.map((f) => f.join(','))].join('\n')
}

/** Convierte una lista de balances a texto CSV. */
export function balancesACSV(balances: BalancePersona[]): string {
  const cabeceras = ['Companero', 'Pagado (USD)', 'Debe (USD)', 'Balance (USD)']

  const filas = balances.map((b) => [
    b.companeroId,
    b.pagado.toFixed(2),
    b.debe.toFixed(2),
    b.balance.toFixed(2),
  ])

  return [cabeceras.join(','), ...filas.map((f) => f.join(','))].join('\n')
}

/**
 * Descarga un contenido de texto como archivo CSV en el navegador.
 * Crea un enlace temporal, lo "clickea" y lo limpia.
 */
export function descargarCSV(contenido: string, nombreArchivo: string): void {
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const enlace = document.createElement('a')
  enlace.setAttribute('href', url)
  enlace.setAttribute('download', nombreArchivo)
  enlace.style.visibility = 'hidden'

  document.body.appendChild(enlace)
  enlace.click()
  document.body.removeChild(enlace)

  URL.revokeObjectURL(url)
}
