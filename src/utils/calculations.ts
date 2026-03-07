import type { PositionSnapshot } from '../types'

/** Calculate PnL % from cost and current value */
export function calcPnlPct(costTotalUsd: number, currentValueUsd: number): number {
  if (costTotalUsd === 0) return 0
  return ((currentValueUsd - costTotalUsd) / costTotalUsd) * 100
}

/** Calculate max drawdown from a series of snapshots */
export function calcMaxDrawdown(snapshots: Pick<PositionSnapshot, 'value_usd'>[]): number {
  if (snapshots.length < 2) return 0
  let peak = snapshots[0].value_usd
  let maxDD = 0
  for (const s of snapshots) {
    if (s.value_usd > peak) peak = s.value_usd
    const dd = peak > 0 ? ((peak - s.value_usd) / peak) * 100 : 0
    if (dd > maxDD) maxDD = dd
  }
  return maxDD
}

/** Calculate max profit reached (as %) */
export function calcMaxProfit(
  snapshots: Pick<PositionSnapshot, 'value_usd'>[],
  costTotalUsd: number,
): number {
  if (!snapshots.length || costTotalUsd === 0) return 0
  const maxVal = Math.max(...snapshots.map(s => s.value_usd))
  return calcPnlPct(costTotalUsd, maxVal)
}

/**
 * Calculate what the LP position would be worth if the user had just held
 * both tokens instead of providing liquidity.
 * holdValue = qty1 * currentPrice1 + qty2 * currentPrice2
 */
export function calcHoldValue(
  qty1: number, price1: number,
  qty2: number, price2: number,
): number {
  return qty1 * price1 + qty2 * price2
}

/** Format number as USD string */
export function fmtUsd(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/** Format number as percentage string */
export function fmtPct(value: number, decimals = 2): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}

/** Format ISO date string to locale date */
export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}
