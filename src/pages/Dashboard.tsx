import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { usePositionsStore } from '../store/usePositionsStore'
import { useLPStore } from '../store/useLPStore'
import { useMaintenanceStore } from '../store/useMaintenanceStore'
import { fmtUsd, fmtPct, calcPnlPct, calcHoldValue } from '../utils/calculations'
import { Spinner } from '../components/common/Spinner'
import { Badge } from '../components/common/Badge'

export default function Dashboard() {
  const { positions, loading: posLoading, fetchPositions, generateAllPendingSnapshots, currentPrices: posPrices } = usePositionsStore()
  const { positions: lps, loading: lpLoading, fetchPositions: fetchLPs, generateAllPendingSnapshots: genLPSnaps, currentPrices: lpPrices } = useLPStore()
  const { fetchAll } = useMaintenanceStore()

  useEffect(() => {
    fetchAll()
    fetchPositions().then(() => generateAllPendingSnapshots())
    fetchLPs().then(() => genLPSnaps())
  }, [])

  const loading = posLoading || lpLoading

  // ── KPI calculations ─────────────────────────────────────────
  const openPositions = positions.filter(p => p.status === 'open')
  const closedPositions = positions.filter(p => p.status === 'closed')
  const openLPs = lps.filter(l => l.status === 'open')

  // Unrealized: current value of open positions
  const unrealizedValue = openPositions.reduce((sum, p) => {
    const price = p.coin ? posPrices[p.coin.coingecko_id] : null
    return sum + (price != null ? p.quantity * price : p.cost_total_usd)
  }, 0)

  const unrealizedCost = openPositions.reduce((s, p) => s + p.cost_total_usd, 0)
  const unrealizedPnl = unrealizedValue - unrealizedCost

  // LP value
  const lpValue = openLPs.reduce((sum, lp) => {
    const p1 = lp.coin1 ? (lpPrices[lp.coin1.coingecko_id] ?? lp.price1) : lp.price1
    const p2 = lp.coin2 ? (lpPrices[lp.coin2.coingecko_id] ?? lp.price2) : lp.price2
    return sum + calcHoldValue(lp.qty1, p1, lp.qty2, p2)
  }, 0)

  const totalPortfolioValue = unrealizedValue + lpValue

  // Realized PnL from closed positions
  const realizedPnl = closedPositions.reduce((s, p) => s + (p.realized_pnl_usd ?? 0), 0)

  // Total deposited = cost of all positions (open + closed) + LP initial values
  const totalDeposited = positions.reduce((s, p) => s + p.cost_total_usd, 0) +
    lps.reduce((s, l) => s + l.initial_value_usd, 0)

  const totalPnl = unrealizedPnl + realizedPnl

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      {loading && <div className="flex justify-center py-12"><Spinner size="lg" /></div>}

      {!loading && (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <KPI label="Portfolio Value" value={fmtUsd(totalPortfolioValue)} highlight />
            <KPI label="Total PnL"
              value={(totalPnl >= 0 ? '+' : '') + fmtUsd(totalPnl)}
              sub={fmtPct(calcPnlPct(totalDeposited, totalDeposited + totalPnl))}
              positive={totalPnl >= 0} />
            <KPI label="Unrealized PnL"
              value={(unrealizedPnl >= 0 ? '+' : '') + fmtUsd(unrealizedPnl)}
              sub={fmtPct(calcPnlPct(unrealizedCost, unrealizedValue))}
              positive={unrealizedPnl >= 0} />
            <KPI label="Realized PnL"
              value={(realizedPnl >= 0 ? '+' : '') + fmtUsd(realizedPnl)}
              positive={realizedPnl >= 0} />
            <KPI label="Total Deposited" value={fmtUsd(totalDeposited)} />
          </div>

          {/* Open positions summary */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[var(--color-text-muted)]">
                Open Positions · {openPositions.length}
              </h2>
              <Link to="/positions" className="text-xs text-blue-400 hover:underline">View all →</Link>
            </div>

            {openPositions.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">No open positions.</p>
            ) : (
              <div className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-[var(--color-text-muted)] border-b border-[var(--color-border)] bg-[var(--color-surface-3)]/50">
                      <th className="text-left px-4 py-2.5 font-medium">Coin</th>
                      <th className="text-right px-4 py-2.5 font-medium hidden sm:table-cell">Cost</th>
                      <th className="text-right px-4 py-2.5 font-medium">Value</th>
                      <th className="text-right px-4 py-2.5 font-medium">PnL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openPositions.map(p => {
                      const price = p.coin ? posPrices[p.coin.coingecko_id] : null
                      const value = price != null ? p.quantity * price : null
                      const pnl = value != null ? value - p.cost_total_usd : null
                      const pct = value != null ? calcPnlPct(p.cost_total_usd, value) : null
                      const isPos = (pnl ?? 0) >= 0
                      return (
                        <tr key={p.id} className="border-b border-[var(--color-border)]/40 last:border-0">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              {p.coin?.logo_url && <img src={p.coin.logo_url} className="w-5 h-5 rounded-full" />}
                              <span className="font-medium">{p.coin?.symbol}</span>
                              <span className="text-xs text-[var(--color-text-muted)]">{p.quantity}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right hidden sm:table-cell text-[var(--color-text-muted)]">
                            {fmtUsd(p.cost_total_usd)}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {value != null ? fmtUsd(value) : '—'}
                          </td>
                          <td className={`px-4 py-2.5 text-right font-medium ${pnl != null ? (isPos ? 'text-green-400' : 'text-red-400') : 'text-[var(--color-text-muted)]'}`}>
                            {pnl != null ? (
                              <span>
                                {isPos ? '+' : ''}{fmtUsd(pnl)}
                                {pct != null && <span className="block text-xs opacity-80">{fmtPct(pct)}</span>}
                              </span>
                            ) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Active LPs */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[var(--color-text-muted)]">
                Active Liquidity Pools · {openLPs.length}
              </h2>
              <Link to="/lp" className="text-xs text-blue-400 hover:underline">View all →</Link>
            </div>

            {openLPs.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">No active LP positions.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {openLPs.map(lp => {
                  const p1 = lp.coin1 ? (lpPrices[lp.coin1.coingecko_id] ?? lp.price1) : lp.price1
                  const p2 = lp.coin2 ? (lpPrices[lp.coin2.coingecko_id] ?? lp.price2) : lp.price2
                  const current = calcHoldValue(lp.qty1, p1, lp.qty2, p2)
                  const pnl = current - lp.initial_value_usd
                  const pct = calcPnlPct(lp.initial_value_usd, current)
                  const isPos = pnl >= 0
                  return (
                    <div key={lp.id} className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex -space-x-1.5">
                          {lp.coin1?.logo_url && <img src={lp.coin1.logo_url} className="w-6 h-6 rounded-full border border-[var(--color-surface-2)]" />}
                          {lp.coin2?.logo_url && <img src={lp.coin2.logo_url} className="w-6 h-6 rounded-full border border-[var(--color-surface-2)]" />}
                        </div>
                        <span className="font-medium text-sm">{lp.coin1?.symbol}/{lp.coin2?.symbol}</span>
                        <Badge label={lp.platform?.name ?? ''} variant="blue" />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--color-text-muted)] text-xs">Value</span>
                        <span className="font-semibold">{fmtUsd(current)}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-[var(--color-text-muted)] text-xs">PnL</span>
                        <span className={`font-medium ${isPos ? 'text-green-400' : 'text-red-400'}`}>
                          {isPos ? '+' : ''}{fmtUsd(pnl)} ({fmtPct(pct)})
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function KPI({ label, value, sub, positive, highlight }: {
  label: string; value: string; sub?: string
  positive?: boolean; highlight?: boolean
}) {
  const valueColor = positive !== undefined
    ? (positive ? 'text-green-400' : 'text-red-400')
    : 'text-[var(--color-text)]'

  return (
    <div className={`rounded-xl p-4 border ${highlight
      ? 'bg-blue-500/10 border-blue-500/30'
      : 'bg-[var(--color-surface-2)] border-[var(--color-border)]'}`}>
      <p className="text-xs text-[var(--color-text-muted)] mb-1">{label}</p>
      <p className={`font-bold text-lg leading-tight ${valueColor}`}>{value}</p>
      {sub && <p className={`text-xs mt-0.5 ${positive !== undefined ? valueColor : 'text-[var(--color-text-muted)]'}`}>{sub}</p>}
    </div>
  )
}
