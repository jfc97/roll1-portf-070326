import { useEffect, useState } from 'react'
import { useLPStore } from '../../store/useLPStore'
import type { LPFeeEntry, LPPosition } from '../../types'
import { LPChart } from '../charts/LPChart'
import { FeeEntryForm } from './FeeEntryForm'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'
import { fmtUsd, fmtPct, fmtDate, calcPnlPct, calcHoldValue } from '../../utils/calculations'

interface Props {
  lp: LPPosition
  onEdit: () => void
  onDelete: () => void
}

export function LPDetail({ lp, onEdit, onDelete }: Props) {
  const { fees, snapshots, fetchFees, fetchSnapshots, deleteFee, deletePosition, closePosition, currentPrices } = useLPStore()
  const [showFeeForm, setShowFeeForm] = useState(false)
  const [editingFee, setEditingFee] = useState<LPFeeEntry | null>(null)

  const lpFees = fees[lp.id] ?? []
  const lpSnaps = snapshots[lp.id] ?? []

  useEffect(() => {
    if (!fees[lp.id]) fetchFees(lp.id)
    if (!snapshots[lp.id]) fetchSnapshots(lp.id)
  }, [lp.id])

  // Current prices
  const p1 = lp.coin1 ? (currentPrices[lp.coin1.coingecko_id] ?? lp.price1) : lp.price1
  const p2 = lp.coin2 ? (currentPrices[lp.coin2.coingecko_id] ?? lp.price2) : lp.price2
  const currentValue = calcHoldValue(lp.qty1, p1, lp.qty2, p2)
  const holdValue = calcHoldValue(lp.qty1, p1, lp.qty2, p2)

  const pnlUsd = currentValue - lp.initial_value_usd
  const pnlPct = calcPnlPct(lp.initial_value_usd, currentValue)
  const vsHoldUsd = currentValue - holdValue
  const isProfit = pnlUsd >= 0

  // Fee totals
  const totalFee1 = lpFees.reduce((s, f) => s + Number(f.fee_coin1), 0)
  const totalFee2 = lpFees.reduce((s, f) => s + Number(f.fee_coin2), 0)
  const totalFeeUsd = lpFees.reduce((s, f) => s + Number(f.fee_usd_total), 0)

  const sym1 = lp.coin1?.symbol ?? '?'
  const sym2 = lp.coin2?.symbol ?? '?'

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {lp.coin1?.logo_url && <img src={lp.coin1.logo_url} className="w-9 h-9 rounded-full border-2 border-[var(--color-surface-2)]" />}
            {lp.coin2?.logo_url && <img src={lp.coin2.logo_url} className="w-9 h-9 rounded-full border-2 border-[var(--color-surface-2)]" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{sym1} / {sym2}</h3>
              <Badge label={lp.status} variant={lp.status === 'open' ? 'green' : 'gray'} />
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              {lp.platform?.name} / {lp.location?.name}
              {lp.chain && ` · ${lp.chain.name}`}
            </p>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          {lp.status === 'open' && (
            <>
              <Button size="sm" variant="secondary" onClick={onEdit}>Edit</Button>
              <Button size="sm" variant="secondary" onClick={() => closePosition(lp.id)}>Close</Button>
            </>
          )}
          <Button size="sm" variant="ghost" onClick={async () => { await deletePosition(lp.id); onDelete() }}
            className="text-red-400">Del</Button>
        </div>
      </div>

      {/* Entry info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI label={`Entry ${sym1}`} value={`${lp.qty1} @ ${fmtUsd(lp.price1)}`} />
        <KPI label={`Entry ${sym2}`} value={`${lp.qty2} @ ${fmtUsd(lp.price2)}`} />
        <KPI label="Initial Value" value={fmtUsd(lp.initial_value_usd)} />
        <KPI label="Current Value" value={fmtUsd(currentValue)}
          sub={fmtDate(new Date().toISOString().split('T')[0])} />
        <KPI label="Unrealized PnL" value={`${isProfit ? '+' : ''}${fmtUsd(pnlUsd)}`}
          sub={fmtPct(pnlPct)} valueColor={isProfit ? 'text-green-400' : 'text-red-400'} />
        <KPI label="vs Hold" value={`${vsHoldUsd >= 0 ? '+' : ''}${fmtUsd(vsHoldUsd)}`}
          valueColor={vsHoldUsd >= 0 ? 'text-green-400' : 'text-red-400'} />
        <KPI label="Current price 1" value={fmtUsd(p1)} sub={sym1} />
        <KPI label="Current price 2" value={fmtUsd(p2)} sub={sym2} />
      </div>

      {/* LP vs Hold chart */}
      {lpSnaps.length > 0 && (
        <div>
          <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">LP Value vs Hold</p>
          <LPChart snapshots={lpSnaps} height={180} />
        </div>
      )}

      {/* Fees section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-[var(--color-text-muted)]">
            Fee History · {lpFees.length} entries
          </p>
          {lp.status === 'open' && (
            <Button size="sm" onClick={() => { setEditingFee(null); setShowFeeForm(true) }}>+ Add Fee</Button>
          )}
        </div>

        {/* Fee totals */}
        {lpFees.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-[var(--color-surface-3)] rounded-lg p-2.5 text-center">
              <p className="text-xs text-[var(--color-text-muted)]">Total {sym1}</p>
              <p className="font-semibold text-sm">{totalFee1.toFixed(6)}</p>
            </div>
            <div className="bg-[var(--color-surface-3)] rounded-lg p-2.5 text-center">
              <p className="text-xs text-[var(--color-text-muted)]">Total {sym2}</p>
              <p className="font-semibold text-sm">{totalFee2.toFixed(6)}</p>
            </div>
            <div className="bg-green-500/10 rounded-lg p-2.5 text-center">
              <p className="text-xs text-[var(--color-text-muted)]">Total USD</p>
              <p className="font-semibold text-sm text-green-400">{fmtUsd(totalFeeUsd)}</p>
            </div>
          </div>
        )}

        {showFeeForm && !editingFee && (
          <div className="mb-3">
            <FeeEntryForm lp={lp} onDone={() => setShowFeeForm(false)} />
          </div>
        )}

        {lpFees.length > 0 && (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                <th className="text-left py-1.5 font-medium">Date</th>
                <th className="text-right py-1.5 font-medium">{sym1}</th>
                <th className="text-right py-1.5 font-medium">{sym2}</th>
                <th className="text-right py-1.5 font-medium">USD</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lpFees.map(f => (
                <tr key={f.id}>
                  {editingFee?.id === f.id ? (
                    <td colSpan={5} className="py-1">
                      <FeeEntryForm lp={lp} editing={f} onDone={() => setEditingFee(null)} />
                    </td>
                  ) : (
                    <>
                      <td className="py-1.5 text-[var(--color-text-muted)]">{fmtDate(f.date)}</td>
                      <td className="py-1.5 text-right">{Number(f.fee_coin1).toFixed(6)}</td>
                      <td className="py-1.5 text-right">{Number(f.fee_coin2).toFixed(6)}</td>
                      <td className="py-1.5 text-right text-green-400">{fmtUsd(Number(f.fee_usd_total))}</td>
                      <td className="py-1.5 text-right">
                        <button onClick={() => setEditingFee(f)}
                          className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] mr-1">✎</button>
                        <button onClick={() => deleteFee(f.id, lp.id)}
                          className="text-red-400/60 hover:text-red-400">✕</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {lpFees.length === 0 && !showFeeForm && (
          <p className="text-xs text-[var(--color-text-muted)]">No fees recorded yet.</p>
        )}
      </div>

      {/* Notes */}
      {lp.notes && (
        <div className="bg-[var(--color-surface-3)] rounded-lg px-3 py-2">
          <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Notes</p>
          <p className="text-sm">{lp.notes}</p>
        </div>
      )}
    </div>
  )
}

function KPI({ label, value, sub, valueColor = 'text-[var(--color-text)]' }: {
  label: string; value: string; sub?: string; valueColor?: string
}) {
  return (
    <div className="bg-[var(--color-surface-3)] rounded-lg p-3">
      <p className="text-xs text-[var(--color-text-muted)] mb-1">{label}</p>
      <p className={`font-semibold text-sm ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{sub}</p>}
    </div>
  )
}
