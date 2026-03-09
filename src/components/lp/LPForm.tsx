import { useState, useEffect } from 'react'
import { useMaintenanceStore } from '../../store/useMaintenanceStore'
import { useLPStore } from '../../store/useLPStore'
import { getCurrentPrices } from '../../api/coingecko'
import type { LPPosition } from '../../types'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { Select } from '../common/Select'

interface Props {
  editing?: LPPosition
  onDone: () => void
}

export function LPForm({ editing, onDone }: Props) {
  const { coins, locations, platforms, chains } = useMaintenanceStore()
  const { addPosition, updatePosition } = useLPStore()

  const [coin1Id, setCoin1Id] = useState(editing?.coin1_id ?? '')
  const [qty1, setQty1] = useState(String(editing?.qty1 ?? ''))
  const [price1, setPrice1] = useState(String(editing?.price1 ?? ''))
  const [coin2Id, setCoin2Id] = useState(editing?.coin2_id ?? '')
  const [qty2, setQty2] = useState(String(editing?.qty2 ?? ''))
  const [price2, setPrice2] = useState(String(editing?.price2 ?? ''))
  const [locationId, setLocationId] = useState(editing?.location_id ?? '')
  const [chainId, setChainId] = useState(editing?.chain_id ?? '')
  const [notes, setNotes] = useState(editing?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const selectedLocation = locations.find(l => l.id === locationId)
  const selectedPlatform = platforms.find(p => p.id === selectedLocation?.platform_id)
  const needsChain = selectedPlatform?.custody_type === 'DEX' || selectedPlatform?.custody_type === 'Wallet'

  const coinOptions = coins.map(c => ({ value: c.id, label: `${c.name} (${c.symbol})` }))
  const locationOptions = locations.map(l => ({
    value: l.id,
    label: `${l.name} — ${l.platform?.name ?? ''} (${l.platform?.custody_type ?? ''})`,
  }))
  const chainOptions = chains.map(c => ({ value: c.id, label: c.name }))

  async function fetchPrice(coinId: string, setter: (v: string) => void) {
    const coin = coins.find(c => c.id === coinId)
    if (!coin) return
    const prices = await getCurrentPrices([coin.coingecko_id])
    const p = prices[coin.coingecko_id]?.usd
    if (p) setter(String(p))
  }

  useEffect(() => { if (coin1Id && !editing) fetchPrice(coin1Id, setPrice1) }, [coin1Id])
  useEffect(() => { if (coin2Id && !editing) fetchPrice(coin2Id, setPrice2) }, [coin2Id])

  const initialValue = (parseFloat(qty1) || 0) * (parseFloat(price1) || 0) +
    (parseFloat(qty2) || 0) * (parseFloat(price2) || 0)

  function validate() {
    const e: Record<string, string> = {}
    if (!coin1Id) e.coin1Id = 'Required'
    if (!coin2Id) e.coin2Id = 'Required'
    if (coin1Id === coin2Id) e.coin2Id = 'Must be different from Coin 1'
    if (!qty1 || parseFloat(qty1) <= 0) e.qty1 = 'Must be > 0'
    if (!qty2 || parseFloat(qty2) <= 0) e.qty2 = 'Must be > 0'
    if (!price1 || parseFloat(price1) <= 0) e.price1 = 'Required'
    if (!price2 || parseFloat(price2) <= 0) e.price2 = 'Required'
    if (!locationId) e.locationId = 'Required'
    setErrors(e)
    return !Object.keys(e).length
  }

  async function submit() {
    if (!validate()) return
    setSaving(true)
    const payload = {
      status: 'open' as const,
      coin1_id: coin1Id,
      qty1: parseFloat(qty1),
      price1: parseFloat(price1),
      coin2_id: coin2Id,
      qty2: parseFloat(qty2),
      price2: parseFloat(price2),
      initial_value_usd: initialValue,
      location_id: locationId,
      platform_id: selectedLocation?.platform_id ?? '',
      chain_id: needsChain && chainId ? chainId : null,
      notes: notes || null,
    }
    if (editing) {
      await updatePosition(editing.id, { qty1: payload.qty1, price1: payload.price1, qty2: payload.qty2, price2: payload.price2, initial_value_usd: payload.initial_value_usd, notes: payload.notes, chain_id: payload.chain_id })
    } else {
      await addPosition(payload)
    }
    setSaving(false)
    onDone()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Token pair */}
      <div className="border border-[var(--color-border)] rounded-lg p-4 flex flex-col gap-3">
        <p className="text-xs font-medium text-[var(--color-text-muted)]">Token Pair</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select label="Coin 1 *" value={coin1Id} onChange={e => setCoin1Id(e.target.value)}
            options={coinOptions} placeholder="Select coin" error={errors.coin1Id} />
          <Input label="Quantity 1 *" type="number" min="0" step="any" value={qty1}
            onChange={e => setQty1(e.target.value)} placeholder="0.00" error={errors.qty1} />
          <Input label="Entry Price 1 (USD) *" type="number" min="0" step="any" value={price1}
            onChange={e => setPrice1(e.target.value)} placeholder="0.00" error={errors.price1} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select label="Coin 2 *" value={coin2Id} onChange={e => setCoin2Id(e.target.value)}
            options={coinOptions} placeholder="Select coin" error={errors.coin2Id} />
          <Input label="Quantity 2 *" type="number" min="0" step="any" value={qty2}
            onChange={e => setQty2(e.target.value)} placeholder="0.00" error={errors.qty2} />
          <Input label="Entry Price 2 (USD) *" type="number" min="0" step="any" value={price2}
            onChange={e => setPrice2(e.target.value)} placeholder="0.00" error={errors.price2} />
        </div>
        {initialValue > 0 && (
          <p className="text-xs text-[var(--color-text-muted)]">
            Initial pool value: <span className="text-[var(--color-text)] font-medium">${initialValue.toFixed(2)}</span>
          </p>
        )}
      </div>

      {/* Location + Chain */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select label="Location *" value={locationId} onChange={e => setLocationId(e.target.value)}
          options={locationOptions} placeholder="Select location" error={errors.locationId} />
        {needsChain && (
          <Select label="Chain" value={chainId} onChange={e => setChainId(e.target.value)}
            options={chainOptions} placeholder="Select chain" />
        )}
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-[var(--color-text-muted)]">Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
          placeholder="Optional notes…"
          className="w-full bg-[var(--color-surface-3)] border border-[var(--color-border)] rounded-md px-3 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-blue-500 resize-none" />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onDone}>Cancel</Button>
        <Button size="sm" loading={saving} onClick={submit}>
          {editing ? 'Update' : 'Open LP Position'}
        </Button>
      </div>
    </div>
  )
}
