import { useEffect, useState } from 'react'
import { usePositionsStore } from '../store/usePositionsStore'
import { useMaintenanceStore } from '../store/useMaintenanceStore'
import type { Position, PositionStatus } from '../types'
import { Button } from '../components/common/Button'
import { Badge } from '../components/common/Badge'
import { Modal } from '../components/common/Modal'
import { Spinner } from '../components/common/Spinner'
import { PositionForm } from '../components/positions/PositionForm'
import { PositionDetail } from '../components/positions/PositionDetail'
import { fmtUsd, fmtPct, fmtDate, calcPnlPct } from '../utils/calculations'

type Tab = PositionStatus

const TABS: { id: Tab; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'closed', label: 'Closed' },
  { id: 'cancelled', label: 'Cancelled' },
]

const statusColor: Record<string, 'green' | 'gray' | 'yellow'> = {
  open: 'green', closed: 'gray', cancelled: 'yellow',
}

export default function Positions() {
  const { positions, loading, error, fetchPositions, generateAllPendingSnapshots, currentPrices } = usePositionsStore()
  const { fetchAll, coins } = useMaintenanceStore()
  const [tab, setTab] = useState<Tab>('open')
  const [formModal, setFormModal] = useState<{ open: boolean; editing: Position | null }>({ open: false, editing: null })
  const [detailPos, setDetailPos] = useState<Position | null>(null)

  useEffect(() => {
    fetchAll()
    fetchPositions().then(() => generateAllPendingSnapshots())
  }, [])

  const filtered = positions.filter(p => p.status === tab)

  function openAdd() { setFormModal({ open: true, editing: null }) }
  function openEdit(p: Position) { setDetailPos(null); setFormModal({ open: true, editing: p }) }

  if (!coins.length && !loading) {
    return (
      <div className="max-w-xl">
        <h1 className="text-xl font-semibold mb-4">Positions</h1>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5 text-sm text-yellow-300">
          <p className="font-medium mb-1">No coins configured</p>
          <p>Go to Settings → Coins and add at least one coin before creating positions.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Positions</h1>
        <Button onClick={openAdd}>+ New Position</Button>
      </div>
      <div className="flex gap-1 border-b border-[var(--color-border)] mb-5">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px cursor-pointer ${tab === t.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}>
            {t.label} <span className="ml-1 text-xs opacity-60">{positions.filter(p => p.status === t.id).length}</span>
          </button>
        ))}
      </div>
      {loading && <div className="flex justify-center py-12"><Spinner size="lg" /></div>}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {!loading && filtered.length === 0 && (
        <p className="text-sm text-[var(--color-text-muted)] py-8 text-center">
          No {tab} positions yet.
          {tab === 'open' && <button onClick={openAdd} className="ml-1 text-blue-400 hover:underline cursor-pointer">Create one</button>}
        </p>
      )}
      {!loading && filtered.length > 0 && (
        <div className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-[var(--color-text-muted)] border-b border-[var(--color-border)] bg-[var(--color-surface-3)]/50">
                <th className="text-left px-4 py-3 font-medium">Coin</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Platform / Location</th>
                <th className="text-right px-4 py-3 font-medium">Cost</th>
                <th className="text-right px-4 py-3 font-medium">Value</th>
                <th className="text-right px-4 py-3 font-medium">PnL</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Date</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(pos => {
                const price = pos.coin ? currentPrices[pos.coin.coingecko_id] : null
                const value = price != null ? pos.quantity * price : null
                const pnlUsd = value != null ? value - pos.cost_total_usd : pos.realized_pnl_usd
                const pnlPct = value != null ? calcPnlPct(pos.cost_total_usd, value) : pos.realized_pnl_usd != null ? calcPnlPct(pos.cost_total_usd, pos.cost_total_usd + pos.realized_pnl_usd) : null
                const isPos = (pnlUsd ?? 0) >= 0
                return (
                  <tr key={pos.id} onClick={() => setDetailPos(pos)}
                    className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-3)]/40 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {pos.coin?.logo_url && <img src={pos.coin.logo_url} className="w-6 h-6 rounded-full" />}
                        <div>
                          <p className="font-medium">{pos.coin?.symbol ?? '—'}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">{pos.quantity} units</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-[var(--color-text-muted)] text-xs">{pos.platform?.name}<br />{pos.location?.name}</td>
                    <td className="px-4 py-3 text-right">{fmtUsd(pos.cost_total_usd)}</td>
                    <td className="px-4 py-3 text-right">{value != null ? fmtUsd(value) : <span className="text-[var(--color-text-muted)]">—</span>}</td>
                    <td className={`px-4 py-3 text-right font-medium ${pnlUsd != null ? (isPos ? 'text-green-400' : 'text-red-400') : 'text-[var(--color-text-muted)]'}`}>
                      {pnlUsd != null ? <span>{isPos ? '+' : ''}{fmtUsd(pnlUsd)}{pnlPct != null && <span className="block text-xs opacity-80">{fmtPct(pnlPct)}</span>}</span> : '—'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs text-[var(--color-text-muted)]">{fmtDate(pos.purchase_date)}</td>
                    <td className="px-4 py-3 hidden lg:table-cell"><Badge label={pos.status} variant={statusColor[pos.status]} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={formModal.open} onClose={() => setFormModal({ open: false, editing: null })}
        title={formModal.editing ? 'Edit Position' : 'Open New Position'} width="max-w-2xl">
        <PositionForm editing={formModal.editing ?? undefined} onDone={() => setFormModal({ open: false, editing: null })} />
      </Modal>
      {detailPos && (
        <Modal open onClose={() => setDetailPos(null)} title="Position Detail" width="max-w-2xl">
          <PositionDetail position={detailPos} onEdit={() => openEdit(detailPos)} onDelete={() => setDetailPos(null)} />
        </Modal>
      )}
    </div>
  )
}
