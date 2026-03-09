import { useEffect, useState } from 'react'
import { useLPStore } from '../store/useLPStore'
import { useMaintenanceStore } from '../store/useMaintenanceStore'
import type { LPPosition } from '../types'
import { Button } from '../components/common/Button'
import { Badge } from '../components/common/Badge'
import { Modal } from '../components/common/Modal'
import { Spinner } from '../components/common/Spinner'
import { LPForm } from '../components/lp/LPForm'
import { LPDetail } from '../components/lp/LPDetail'
import { fmtUsd, fmtPct, calcPnlPct, calcHoldValue } from '../utils/calculations'

export default function LiquidityPools() {
  const { positions, loading, error, fetchPositions, generateAllPendingSnapshots, currentPrices } = useLPStore()
  const { fetchAll, coins } = useMaintenanceStore()

  const [showClosed, setShowClosed] = useState(false)
  const [formModal, setFormModal] = useState<{ open: boolean; editing: LPPosition | null }>({ open: false, editing: null })
  const [detailLP, setDetailLP] = useState<LPPosition | null>(null)

  useEffect(() => {
    fetchAll()
    fetchPositions().then(() => generateAllPendingSnapshots())
  }, [])

  const filtered = positions.filter(p => showClosed ? p.status !== 'open' : p.status === 'open')

  if (!coins.length && !loading) {
    return (
      <div className="max-w-xl">
        <h1 className="text-xl font-semibold mb-4">Liquidity Pools</h1>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5 text-sm text-yellow-300">
          <p className="font-medium mb-1">No coins configured</p>
          <p>Go to Settings → Coins and add coins before creating LP positions.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Liquidity Pools</h1>
        <Button onClick={() => setFormModal({ open: true, editing: null })}>+ New LP</Button>
      </div>

      {/* Toggle open/closed */}
      <div className="flex gap-1 border-b border-[var(--color-border)] mb-5">
        {[{ id: false, label: 'Active' }, { id: true, label: 'Closed / Cancelled' }].map(t => (
          <button key={String(t.id)} onClick={() => setShowClosed(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px cursor-pointer ${
              showClosed === t.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}>
            {t.label}
            <span className="ml-1 text-xs opacity-60">
              {t.id ? positions.filter(p => p.status !== 'open').length : positions.filter(p => p.status === 'open').length}
            </span>
          </button>
        ))}
      </div>

      {loading && <div className="flex justify-center py-12"><Spinner size="lg" /></div>}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!loading && filtered.length === 0 && (
        <p className="text-sm text-[var(--color-text-muted)] py-8 text-center">
          No {showClosed ? 'closed' : 'active'} LP positions.
          {!showClosed && (
            <button onClick={() => setFormModal({ open: true, editing: null })}
              className="ml-1 text-blue-400 hover:underline cursor-pointer">Create one</button>
          )}
        </p>
      )}

      {!loading && filtered.length > 0 && (
        <div className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-[var(--color-text-muted)] border-b border-[var(--color-border)] bg-[var(--color-surface-3)]/50">
                <th className="text-left px-4 py-3 font-medium">Pair</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Platform</th>
                <th className="text-right px-4 py-3 font-medium">Initial</th>
                <th className="text-right px-4 py-3 font-medium">Current</th>
                <th className="text-right px-4 py-3 font-medium">PnL</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(lp => {
                const p1 = lp.coin1 ? (currentPrices[lp.coin1.coingecko_id] ?? lp.price1) : lp.price1
                const p2 = lp.coin2 ? (currentPrices[lp.coin2.coingecko_id] ?? lp.price2) : lp.price2
                const current = calcHoldValue(lp.qty1, p1, lp.qty2, p2)
                const pnlUsd = current - lp.initial_value_usd
                const pnlPct = calcPnlPct(lp.initial_value_usd, current)
                const isPos = pnlUsd >= 0

                return (
                  <tr key={lp.id} onClick={() => setDetailLP(lp)}
                    className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-3)]/40 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-1.5">
                          {lp.coin1?.logo_url && <img src={lp.coin1.logo_url} className="w-5 h-5 rounded-full border border-[var(--color-surface-2)]" />}
                          {lp.coin2?.logo_url && <img src={lp.coin2.logo_url} className="w-5 h-5 rounded-full border border-[var(--color-surface-2)]" />}
                        </div>
                        <span className="font-medium">{lp.coin1?.symbol}/{lp.coin2?.symbol}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-[var(--color-text-muted)] text-xs">
                      {lp.platform?.name}
                    </td>
                    <td className="px-4 py-3 text-right">{fmtUsd(lp.initial_value_usd)}</td>
                    <td className="px-4 py-3 text-right">{fmtUsd(current)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${isPos ? 'text-green-400' : 'text-red-400'}`}>
                      {isPos ? '+' : ''}{fmtUsd(pnlUsd)}
                      <span className="block text-xs opacity-80">{fmtPct(pnlPct)}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <Badge label={lp.status} variant={lp.status === 'open' ? 'green' : 'gray'} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={formModal.open} onClose={() => setFormModal({ open: false, editing: null })}
        title={formModal.editing ? 'Edit LP Position' : 'Open New LP Position'} width="max-w-2xl">
        <LPForm editing={formModal.editing ?? undefined}
          onDone={() => setFormModal({ open: false, editing: null })} />
      </Modal>

      {detailLP && (
        <Modal open onClose={() => setDetailLP(null)} title="LP Position Detail" width="max-w-2xl">
          <LPDetail lp={detailLP}
            onEdit={() => { setDetailLP(null); setFormModal({ open: true, editing: detailLP }) }}
            onDelete={() => setDetailLP(null)} />
        </Modal>
      )}
    </div>
  )
}
