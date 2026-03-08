import { create } from 'zustand'
import { supabase } from '../api/supabase'
import { getCurrentPrices } from '../api/coingecko'
import { logAndPush } from './useUndoStore'
import { calcPnlPct, calcMaxDrawdown, calcMaxProfit } from '../utils/calculations'
import type { Position, PositionSnapshot } from '../types'

interface PositionsStore {
  positions: Position[]
  snapshots: Record<string, PositionSnapshot[]>   // keyed by position_id
  currentPrices: Record<string, number>            // keyed by coingecko_id
  loading: boolean
  error: string | null

  fetchPositions: () => Promise<void>
  fetchSnapshots: (positionId: string) => Promise<void>
  refreshPrices: (coingeckoIds: string[]) => Promise<void>

  addPosition: (data: Omit<Position, 'id' | 'created_at' | 'updated_at' | 'closed_at' | 'realized_pnl_usd'>) => Promise<string | null>
  updatePosition: (id: string, data: Partial<Pick<Position, 'quantity' | 'unit_price_usd' | 'purchase_date' | 'cost_coin' | 'cost_units' | 'cost_price' | 'cost_total_usd' | 'notes' | 'chain_id'>>) => Promise<void>
  closePosition: (id: string, closePriceUsd: number) => Promise<void>
  cancelPosition: (id: string) => Promise<void>
  deletePosition: (id: string) => Promise<void>

  generateTodaySnapshot: (positionId: string) => Promise<void>
  generateAllPendingSnapshots: () => Promise<void>
}

export const usePositionsStore = create<PositionsStore>((set, get) => ({
  positions: [],
  snapshots: {},
  currentPrices: {},
  loading: false,
  error: null,

  async fetchPositions() {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('positions')
      .select('*, coin:coins(*), location:locations(*, platform:platforms(*)), platform:platforms(*), chain:chains(*)')
      .order('purchase_date', { ascending: false })
    if (error) { set({ error: error.message, loading: false }); return }
    set({ positions: data as Position[], loading: false })
  },

  async fetchSnapshots(positionId) {
    const { data } = await supabase
      .from('position_snapshots')
      .select('*')
      .eq('position_id', positionId)
      .order('date', { ascending: true })
    if (data) {
      set(s => ({ snapshots: { ...s.snapshots, [positionId]: data as PositionSnapshot[] } }))
    }
  },

  async refreshPrices(coingeckoIds) {
    if (!coingeckoIds.length) return
    try {
      const prices = await getCurrentPrices(coingeckoIds)
      const mapped: Record<string, number> = {}
      for (const [id, v] of Object.entries(prices)) mapped[id] = v.usd
      set(s => ({ currentPrices: { ...s.currentPrices, ...mapped } }))
    } catch {
      // best-effort
    }
  },

  async addPosition(data) {
    const { data: row, error } = await supabase
      .from('positions')
      .insert({ ...data, status: 'open' })
      .select('*, coin:coins(*), location:locations(*, platform:platforms(*)), platform:platforms(*), chain:chains(*)')
      .single()
    if (error || !row) return null
    const record = row as Position
    set(s => ({ positions: [record, ...s.positions] }))
    await logAndPush('position_create', record.id, 'position', null, record, async () => {
      await supabase.from('positions').delete().eq('id', record.id)
      set(s => ({ positions: s.positions.filter(p => p.id !== record.id) }))
    })
    // Generate opening snapshot
    await get().generateTodaySnapshot(record.id)
    return record.id
  },

  async updatePosition(id, data) {
    const before = get().positions.find(p => p.id === id)
    const { data: row, error } = await supabase
      .from('positions')
      .update(data)
      .eq('id', id)
      .select('*, coin:coins(*), location:locations(*, platform:platforms(*)), platform:platforms(*), chain:chains(*)')
      .single()
    if (error || !row) return
    const updated = row as Position
    set(s => ({ positions: s.positions.map(p => p.id === id ? updated : p) }))
    await logAndPush('position_update', id, 'position', before ?? null, updated, async () => {
      if (!before) return
      await supabase.from('positions').update({
        quantity: before.quantity, unit_price_usd: before.unit_price_usd,
        purchase_date: before.purchase_date, notes: before.notes, chain_id: before.chain_id,
        cost_coin: before.cost_coin, cost_units: before.cost_units,
        cost_price: before.cost_price, cost_total_usd: before.cost_total_usd,
      }).eq('id', id)
      set(s => ({ positions: s.positions.map(p => p.id === id ? before : p) }))
    })
  },

  async closePosition(id, closePriceUsd) {
    const pos = get().positions.find(p => p.id === id)
    if (!pos) return
    const realizedPnl = pos.quantity * closePriceUsd - pos.cost_total_usd
    const { data: row } = await supabase
      .from('positions')
      .update({ status: 'closed', closed_at: new Date().toISOString(), realized_pnl_usd: realizedPnl })
      .eq('id', id)
      .select('*, coin:coins(*), location:locations(*, platform:platforms(*)), platform:platforms(*), chain:chains(*)')
      .single()
    if (!row) return
    const updated = row as Position
    set(s => ({ positions: s.positions.map(p => p.id === id ? updated : p) }))
    await logAndPush('position_close', id, 'position', pos, updated, async () => {
      await supabase.from('positions').update({ status: 'open', closed_at: null, realized_pnl_usd: null }).eq('id', id)
      set(s => ({ positions: s.positions.map(p => p.id === id ? pos : p) }))
    })
  },

  async cancelPosition(id) {
    const pos = get().positions.find(p => p.id === id)
    if (!pos) return
    await supabase.from('positions').update({ status: 'cancelled' }).eq('id', id)
    set(s => ({ positions: s.positions.map(p => p.id === id ? { ...p, status: 'cancelled' } : p) }))
    await logAndPush('position_update', id, 'position', pos, { ...pos, status: 'cancelled' }, async () => {
      await supabase.from('positions').update({ status: pos.status }).eq('id', id)
      set(s => ({ positions: s.positions.map(p => p.id === id ? pos : p) }))
    })
  },

  async deletePosition(id) {
    const before = get().positions.find(p => p.id === id)
    await supabase.from('positions').delete().eq('id', id)
    set(s => ({ positions: s.positions.filter(p => p.id !== id) }))
    await logAndPush('position_delete', id, 'position', before ?? null, null, async () => {
      if (!before) return
      const { coin, location, platform, chain, ...rest } = before as Position & Record<string, unknown>
      void coin; void location; void platform; void chain
      await supabase.from('positions').insert(rest)
      set(s => ({ positions: [before, ...s.positions] }))
    })
  },

  async generateTodaySnapshot(positionId) {
    const pos = get().positions.find(p => p.id === positionId)
    if (!pos || pos.status !== 'open' || !pos.coin) return
    const today = new Date().toISOString().split('T')[0]
    // Check if snapshot already exists for today
    const { data: existing } = await supabase
      .from('position_snapshots').select('id').eq('position_id', positionId).eq('date', today).single()
    if (existing) return

    // Get current price
    let price = get().currentPrices[pos.coin.coingecko_id]
    if (!price) {
      const prices = await getCurrentPrices([pos.coin.coingecko_id])
      price = prices[pos.coin.coingecko_id]?.usd ?? pos.unit_price_usd
      set(s => ({ currentPrices: { ...s.currentPrices, [pos.coin!.coingecko_id]: price } }))
    }

    const valueUsd = pos.quantity * price
    const pnlPct = calcPnlPct(pos.cost_total_usd, valueUsd)

    // Get existing snapshots for drawdown/maxProfit calculation
    const existingSnaps = get().snapshots[positionId] ?? []
    const allSnaps = [...existingSnaps, { value_usd: valueUsd } as PositionSnapshot]
    const maxDrawdown = calcMaxDrawdown(allSnaps)
    const maxProfit = calcMaxProfit(allSnaps, pos.cost_total_usd)

    const { data: snap } = await supabase
      .from('position_snapshots')
      .insert({ position_id: positionId, date: today, value_usd: valueUsd, pnl_pct: pnlPct, max_drawdown: maxDrawdown, max_profit: maxProfit })
      .select().single()

    if (snap) {
      set(s => ({
        snapshots: {
          ...s.snapshots,
          [positionId]: [...(s.snapshots[positionId] ?? []), snap as PositionSnapshot],
        },
      }))
    }
  },

  async generateAllPendingSnapshots() {
    const { positions } = get()
    const open = positions.filter(p => p.status === 'open' && p.coin)
    if (!open.length) return
    // Refresh prices for all open positions
    const ids = [...new Set(open.map(p => p.coin!.coingecko_id))]
    await get().refreshPrices(ids)
    // Generate snapshots in parallel
    await Promise.all(open.map(p => get().generateTodaySnapshot(p.id)))
  },
}))
