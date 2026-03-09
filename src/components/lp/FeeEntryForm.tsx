import { useState } from 'react'
import { useLPStore } from '../../store/useLPStore'
import type { LPFeeEntry, LPPosition } from '../../types'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { getCurrentPrices } from '../../api/coingecko'

interface Props {
  lp: LPPosition
  editing?: LPFeeEntry
  onDone: () => void
}

export function FeeEntryForm({ lp, editing, onDone }: Props) {
  const { addFee, updateFee } = useLPStore()
  const [date, setDate] = useState(editing?.date ?? new Date().toISOString().split('T')[0])
  const [fee1, setFee1] = useState(String(editing?.fee_coin1 ?? ''))
  const [fee2, setFee2] = useState(String(editing?.fee_coin2 ?? ''))
  const [feeUsd, setFeeUsd] = useState(String(editing?.fee_usd_total ?? ''))
  const [saving, setSaving] = useState(false)
  const [calcLoading, setCalcLoading] = useState(false)

  async function autoCalcUsd() {
    if (!lp.coin1?.coingecko_id || !lp.coin2?.coingecko_id) return
    setCalcLoading(true)
    try {
      const prices = await getCurrentPrices([lp.coin1.coingecko_id, lp.coin2.coingecko_id])
      const p1 = prices[lp.coin1.coingecko_id]?.usd ?? 0
      const p2 = prices[lp.coin2.coingecko_id]?.usd ?? 0
      const usd = (parseFloat(fee1) || 0) * p1 + (parseFloat(fee2) || 0) * p2
      setFeeUsd(String(usd.toFixed(4)))
    } finally {
      setCalcLoading(false)
    }
  }

  async function submit() {
    const f1 = parseFloat(fee1) || 0
    const f2 = parseFloat(fee2) || 0
    const usd = parseFloat(feeUsd) || 0
    if (!date) return
    setSaving(true)
    if (editing) {
      await updateFee(editing.id, lp.id, date, f1, f2, usd)
    } else {
      await addFee(lp.id, date, f1, f2, usd)
    }
    setSaving(false)
    onDone()
  }

  const sym1 = lp.coin1?.symbol ?? 'C1'
  const sym2 = lp.coin2?.symbol ?? 'C2'

  return (
    <div className="flex flex-col gap-3 p-3 bg-[var(--color-surface-3)] rounded-lg border border-[var(--color-border)]">
      <p className="text-xs font-medium text-[var(--color-text-muted)]">
        {editing ? 'Edit Fee Entry' : 'Add Fee Entry'}
      </p>
      <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
      <div className="grid grid-cols-3 gap-2">
        <Input label={`Fee ${sym1}`} type="number" min="0" step="any"
          value={fee1} onChange={e => setFee1(e.target.value)} placeholder="0" />
        <Input label={`Fee ${sym2}`} type="number" min="0" step="any"
          value={fee2} onChange={e => setFee2(e.target.value)} placeholder="0" />
        <div className="flex flex-col gap-1">
          <Input label="Total USD" type="number" min="0" step="any"
            value={feeUsd} onChange={e => setFeeUsd(e.target.value)} placeholder="0.00" />
        </div>
      </div>
      <div className="flex gap-2 items-center">
        <Button size="sm" variant="ghost" loading={calcLoading} onClick={autoCalcUsd}
          className="text-xs text-blue-400">
          ↻ Calc USD
        </Button>
        <div className="flex gap-1 ml-auto">
          <Button variant="secondary" size="sm" onClick={onDone}>Cancel</Button>
          <Button size="sm" loading={saving} onClick={submit}>Save</Button>
        </div>
      </div>
    </div>
  )
}
