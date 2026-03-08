import { useState } from 'react'
import { usePositionsStore } from '../../store/usePositionsStore'
import type { Position } from '../../types'
import { Modal } from '../common/Modal'
import { Input } from '../common/Input'
import { Button } from '../common/Button'
import { fmtUsd, fmtPct, calcPnlPct } from '../../utils/calculations'

interface Props {
  position: Position
  onClose: () => void
}

export function ClosePositionModal({ position, onClose }: Props) {
  const { closePosition, currentPrices } = usePositionsStore()
  const currentPrice = position.coin ? currentPrices[position.coin.coingecko_id] : undefined
  const [closePrice, setClosePrice] = useState(String(currentPrice ?? position.unit_price_usd))
  const [saving, setSaving] = useState(false)

  const closePriceNum = parseFloat(closePrice) || 0
  const closeValue = position.quantity * closePriceNum
  const pnlUsd = closeValue - position.cost_total_usd
  const pnlPct = calcPnlPct(position.cost_total_usd, closeValue)
  const isProfit = pnlUsd >= 0

  async function confirm() {
    if (!closePriceNum) return
    setSaving(true)
    await closePosition(position.id, closePriceNum)
    setSaving(false)
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="Close Position">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 p-3 bg-[var(--color-surface-3)] rounded-lg">
          {position.coin?.logo_url && <img src={position.coin.logo_url} className="w-8 h-8 rounded-full" />}
          <div>
            <p className="font-medium">{position.coin?.name}</p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {position.quantity} {position.coin?.symbol} · Cost {fmtUsd(position.cost_total_usd)}
            </p>
          </div>
        </div>

        <Input label="Close Price USD" type="number" min="0" step="any"
          value={closePrice} onChange={e => setClosePrice(e.target.value)} />

        {closePriceNum > 0 && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-[var(--color-surface-3)] rounded-lg p-3">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">Close Value</p>
              <p className="font-semibold text-sm">{fmtUsd(closeValue)}</p>
            </div>
            <div className={`rounded-lg p-3 ${isProfit ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              <p className="text-xs text-[var(--color-text-muted)] mb-1">PnL USD</p>
              <p className={`font-semibold text-sm ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                {isProfit ? '+' : ''}{fmtUsd(pnlUsd)}
              </p>
            </div>
            <div className={`rounded-lg p-3 ${isProfit ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              <p className="text-xs text-[var(--color-text-muted)] mb-1">PnL %</p>
              <p className={`font-semibold text-sm ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                {fmtPct(pnlPct)}
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={confirm}
            className={isProfit ? '' : 'bg-red-500 hover:bg-red-600'}>
            Confirm Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
