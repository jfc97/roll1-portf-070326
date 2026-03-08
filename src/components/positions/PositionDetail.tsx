import { useEffect, useState } from 'react'
import { usePositionsStore } from '../../store/usePositionsStore'
import type { Position } from '../../types'
import { EquityCurve } from '../charts/EquityCurve'
import { Badge } from '../common/Badge'
import { Button } from '../common/Button'
import { ClosePositionModal } from './ClosePositionModal'
import { fmtUsd, fmtPct, fmtDate, calcPnlPct } from '../../utils/calculations'

interface Props {
  position: Position
  onEdit: () => void
  onDelete: () => void
}

const statusColor: Record<string, 'green' | 'gray' | 'yellow'> = {
  open: 'green', closed: 'gray', cancelled: 'yellow',
}

export function PositionDetail({ position, onEdit, onDelete }: Props) {
  const { snapshots, fetchSnapshots, currentPrices, deletePosition } = usePositionsStore()
  const [showClose, setShowClose] = useState(false)
  const snaps = snapshots[position.id] ?? []

  useEffect(() => {
    if (!snapshots[position.id]) fetchSnapshots(position.id)
  }, [position.id])

  const currentPrice = position.coin ? currentPrices[position.coin.coingecko_id] : null
  const currentValue = currentPrice != null ? position.quantity * currentPrice : null
  const unrealizedPnlPct = currentValue != null ? calcPnlPct(position.cost_total_usd, currentValue) : null
  const unrealizedPnlUsd = currentValue != null ? currentValue - position.cost_total_usd : null

  const lastSnap = snaps[snaps.length - 1]

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {position.coin?.logo_url && (
            <img src={position.coin.logo_url} alt={position.coin.name} className="w-10 h-10 rounded-full" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base">{position.coin?.name}</h3>
              <Badge label={position.status} variant={statusColor[position.status]} />
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              {position.quantity} {position.coin?.symbol} · {position.platform?.name} / {position.location?.name}
              {position.chain && ` · ${position.chain.name}`}
            </p>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          {position.status === 'open' && (
            <>
              <Button size="sm" variant="secondary" onClick={onEdit}>Edit</Button>
              <Button size="sm" onClick={() => setShowClose(true)}>Close</Button>
            </>
          )}
          <Button size="sm" variant="ghost" onClick={async () => { await deletePosition(position.id); onDelete() }}
            className="text-red-400 hover:text-red-300">Del</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI label="Cost" value={fmtUsd(position.cost_total_usd)} sub={`${position.cost_units} ${position.cost_coin}`} />
        {currentValue != null && (
          <KPI label="Current Value" value={fmtUsd(currentValue)} />
        )}
        {position.status === 'closed' && position.realized_pnl_usd != null && (
          <KPI label="Realized PnL"
            value={fmtUsd(position.realized_pnl_usd)}
            valueColor={position.realized_pnl_usd >= 0 ? 'text-green-400' : 'text-red-400'} />
        )}
        {unrealizedPnlUsd != null && position.status === 'open' && (
          <KPI label="Unrealized PnL"
            value={fmtUsd(unrealizedPnlUsd)}
            sub={unrealizedPnlPct != null ? fmtPct(unrealizedPnlPct) : undefined}
            valueColor={unrealizedPnlUsd >= 0 ? 'text-green-400' : 'text-red-400'} />
        )}
        {lastSnap && (
          <>
            <KPI label="Max Drawdown" value={fmtPct(-lastSnap.max_drawdown)} valueColor="text-red-400" />
            <KPI label="Max Profit" value={fmtPct(lastSnap.max_profit)} valueColor="text-green-400" />
          </>
        )}
        <KPI label="Entry Price" value={fmtUsd(position.unit_price_usd)} sub={fmtDate(position.purchase_date)} />
      </div>

      {/* Equity Curve */}
      {snaps.length > 0 && (
        <div>
          <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">Equity Curve</p>
          <EquityCurve snapshots={snaps} costTotalUsd={position.cost_total_usd} height={180} />
        </div>
      )}

      {/* Notes */}
      {position.notes && (
        <div className="bg-[var(--color-surface-3)] rounded-lg px-3 py-2">
          <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Notes</p>
          <p className="text-sm">{position.notes}</p>
        </div>
      )}

      {showClose && <ClosePositionModal position={position} onClose={() => setShowClose(false)} />}
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
