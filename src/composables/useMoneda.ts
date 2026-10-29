/**
 * Preferencia de moneda de la aplicacion (USD o VES).
 *
 * Estado compartido a nivel de modulo (singleton, como useAppStore), así
 * cualquier componente que llame a `useMoneda()` lee la misma preferencia.
 * Guarda la eleccion en localStorage y expone helpers para formatear montos
 * segun la moneda activa, reutilizando useTasaCambio para la conversion.
 */

import { computed, ref } from 'vue'
import { useTasaCambio } from './useTasaCambio'

const MONEDA_KEY = 'ujap-split-moneda'
type Moneda = 'usd' | 'ves'

const MONEDAS: Record<Moneda, { simbolo: string; nombre: string }> = {
  usd: { simbolo: '$', nombre: 'Dólares (USD)' },
  ves: { simbolo: 'Bs', nombre: 'Bolívares (VES)' },
}

function monedaGuardada(): Moneda {
  try {
    const raw = localStorage.getItem(MONEDA_KEY)
    if (!raw) return 'usd'
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (parsed.moneda === 'usd' || parsed.moneda === 'ves') {
      return parsed.moneda
    }
  } catch {
    /* ignorar */
  }
  return 'usd'
}

/** Estado compartido (singleton). */
const moneda = ref<Moneda>(monedaGuardada())
const { tasa, cargando, disponible, aBolivares } = useTasaCambio()

export function useMoneda() {
  function setMoneda(nueva: Moneda) {
    moneda.value = nueva
    try {
      localStorage.setItem(MONEDA_KEY, JSON.stringify({ moneda: nueva }))
    } catch {
      /* localStorage lleno o bloqueado */
    }
  }

  const simbolo = computed(() => MONEDAS[moneda.value].simbolo)
  const nombreMoneda = computed(() => MONEDAS[moneda.value].nombre)

  /**
   * Formatea un monto en USD segun la moneda activa.
   * Si esta en VES y hay tasa, convierte y muestra en bolivares.
   */
  function formatearMonto(montoUsd: number): string {
    if (!Number.isFinite(montoUsd)) return '-'

    if (moneda.value === 'ves') {
      const convertido = aBolivares(montoUsd)
      if (convertido === null) {
        // No hay tasa todavia: mostramos en USD
        return `${MONEDAS.usd.simbolo}${montoUsd.toFixed(2)}`
      }
      return `${convertido.toLocaleString('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    }

    return `${MONEDAS.usd.simbolo}${montoUsd.toFixed(2)}`
  }

  /**
   * Devuelve el monto numerico ya convertido segun la moneda activa.
   */
  function montoEnMonedaActiva(montoUsd: number): number | null {
    if (!Number.isFinite(montoUsd)) return null
    if (moneda.value === 'usd') return montoUsd
    return aBolivares(montoUsd)
  }

  return {
    moneda,
    setMoneda,
    simbolo,
    nombreMoneda,
    disponible,
    cargando,
    formatearMonto,
    montoEnMonedaActiva,
    MONEDAS,
  }
}
