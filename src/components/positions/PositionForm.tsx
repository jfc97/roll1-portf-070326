import { useState, useEffect } from 'react'
import { useMaintenanceStore } from '../../store/useMaintenanceStore'
import { usePositionsStore } from '../../store/usePositionsStore'
import { getCurrentPrices } from '../../api/coingecko'
import type { Position } from '../../types'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { Select } from '../common/Select'

interface Props {
  editing?: Position
  onDone: () => void
}

export function PositionForm({ editing, onDone }: Props) {
  const { coins, platforms, locations } = useMaintenanceStore()
  const { addPosition, updatePosition } = usePositionsStore()

  const [coinId, setCoinId] = useState(editing?.coin_id ?? '')
  const [locationId, setLocationId] = useState(editing?.location_id ?? '')
  const [chainId, setChainId] = useState(editing?.chain_id ?? '')
  const [quantity, setQuantity] = useState(String(editing?.quantity ?? ''))
  const [unitPrice, setUnitPrice] = useState(String(editing?.unit_price_usd ?? ''))
  const [purchaseDate, setPurchaseDate] = useState(editing?.purchase_date ?? new Date().toISOString().split('T')[0])
  const [costCoin, setCostCoin] = useState(editing?.cost_coin ?? 'USDT')
  const [costUnits, setCostUnits] = useState(String(editing?.cost_units ?? ''))
  const [costPrice, setCostPrice] = useState(String(editing?.cost_price ?? '1'))
  const [notes, setNotes] = useState(editing?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [loadingPrice, setLoadingPrice] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { chains } = useMaintenanceStore()

  // Derive platform from selected location
  const selectedLocation = locations.find(l => l.id === locationId)
  const selectedPlatform = platforms.find(p => p.id === selectedLocation?.platform_id)
  const needsChain = selectedPlatform?.custody_type === 'DEX' || selectedPlatform?.custody_type === 'Wallet'

  // Filtered locations for selected coin's platform
  const filteredLocations = locations

  const coinOptions = coins.map(c => ({ value: c.id, label: `${c.name} (${c.symbol})` }))
  const locationOptions = filteredLocations.map(l => ({
    value: l.id,
    label: `${l.name} — ${l.platform?.name ?? ''} (${l.platform?.custody_type ?? ''})`,
  }))
  const chainOptions = chains.map(c => ({ value: c.id, label: c.name }))

  // Auto-fill unit price when coin changes
  useEffect(() => {
    if (!coinId || editing) return
    const coin = coins.find(c => c.id === coinId)
    if (!coin) return
    setLoadingPrice(true)
    getCurrentPrices([coin.coingecko_id])
      .then(prices => {
        const p = prices[coin.coingecko_id]?.usd
        if (p) { setUnitPrice(String(p)); recalcCostUnits(String(p), quantity) }
      })
      .finally(() => setLoadingPrice(false))
  }, [coinId])

  function recalcCostUnits(priceStr: string, qtyStr: string) {
    const p = parseFloat(priceStr), q = parseFloat(qtyStr)
    const cp = parseFloat(costPrice) || 1
    if (p > 0 && q > 0) setCostUnits(String((p * q) / cp))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!coinId) e.coinId = 'Required'
    if (!locationId) e.locationId = 'Required'
    if (!quantity || isNaN(parseFloat(quantity)) || parseFloat(quantity) <= 0) e.quantity = 'Must be > 0'
    if (!unitPrice || isNaN(parseFloat(unitPrice))) e.unitPrice = 'Required'
    if (!costUnits || isNaN(parseFloat(costUnits))) e.costUnits = 'Required'
    setErrors(e)
    return !Object.keys(e).length
  }

  async function submit() {
    if (!validate()) return
    setSaving(true)
    const costTotal = parseFloat(costUnits) * parseFloat(costPrice)
    const payload = {
      status: 'open' as const,
      coin_id: coinId,
      location_id: locationId,
      platform_id: selectedLocation?.platform_id ?? '',
      chain_id: needsChain && chainId ? chainId : null,
      quantity: parseFloat(quantity),
      unit_price_usd: parseFloat(unitPrice),
      purchase_date: purchaseDate,
      cost_coin: costCoin,
      cost_units: parseFloat(costUnits),
      cost_price: parseFloat(costPrice),
      cost_total_usd: costTotal,
      notes: notes || null,
    }
    if (editing) {
      await updatePosition(editing.id, payload)
    } else {
      await addPosition(payload)
    }
    setSaving(false)
    onDone()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Coin + Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select label="Coin *" value={coinId} onChange={e => setCoinId(e.target.value)}
          options={coinOptions} placeholder="Select coin" error={errors.coinId} />
        <Select label="Location *" value={locationId} onChange={e => setLocationId(e.target.value)}
          options={locationOptions} placeholder="Select location" error={errors.locationId} />
      </div>

      {/* Chain (conditional) */}
      {needsChain && (
        <Select label="Chain" value={chainId} onChange={e => setChainId(e.target.value)}
          options={chainOptions} placeholder="Select chain" />
      )}

      {/* Qty + Price + Date */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input label="Quantity *" type="number" min="0" step="any" value={quantity}
          onChange={e => { setQuantity(e.target.value); recalcCostUnits(unitPrice, e.target.value) }}
          placeholder="0.00" error={errors.quantity} />
        <div className="relative">
          <Input label={loadingPrice ? 'Unit Price (loading…)' : 'Unit Price USD *'}
            type="number" min="0" step="any" value={unitPrice}
            onChange={e => { setUnitPrice(e.target.value); recalcCostUnits(e.target.value, quantity) }}
            placeholder="0.00" error={errors.unitPrice} />
        </div>
        <Input label="Purchase Date *" type="date" value={purchaseDate}
          onChange={e => setPurchaseDate(e.target.value)} />
      </div>

      {/* Cost section */}
      <div className="border border-[var(--color-border)] rounded-lg p-3 flex flex-col gap-3">
        <p className="text-xs font-medium text-[var(--color-text-muted)]">Cost (what you paid)</p>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Cost Coin" value={costCoin} onChange={e => setCostCoin(e.target.value)} placeholder="USDT" />
          <Input label="Cost Units *" type="number" min="0" step="any" value={costUnits}
            onChange={e => setCostUnits(e.target.value)} placeholder="500" error={errors.costUnits} />
          <Input label="Cost Coin Price USD" type="number" min="0" step="any" value={costPrice}
            onChange={e => setCostPrice(e.target.value)} placeholder="1.00" />
        </div>
        {costUnits && costPrice && (
          <p className="text-xs text-[var(--color-text-muted)]">
            Total cost: <span className="text-[var(--color-text)] font-medium">
              ${(parseFloat(costUnits) * parseFloat(costPrice)).toFixed(2)}
            </span>
          </p>
        )}
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-[var(--color-text-muted)]">Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
          placeholder="Optional notes…"
          className="w-full bg-[var(--color-surface-3)] border border-[var(--color-border)] rounded-md px-3 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-blue-500 resize-none" />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" size="sm" onClick={onDone}>Cancel</Button>
        <Button size="sm" loading={saving} onClick={submit}>
          {editing ? 'Update' : 'Open Position'}
        </Button>
      </div>
    </div>
  )
}
