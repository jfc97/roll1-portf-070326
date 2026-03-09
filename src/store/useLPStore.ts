import { create } from 'zustand'
import { supabase } from '../api/supabase'
import { getCurrentPrices } from '../api/coingecko'
import { logAndPush } from './useUndoStore'
import { calcHoldValue } from '../utils/calculations'
import type { LPPosition, LPFeeEntry, LPSnapshot } from '../types'

interface LPStore {
  positions: LPPosition[]
  fees: Record<string, LPFeeEntry[]>
  snapshots: Record<string, LPSnapshot[]>
  currentPrices: Record<string, number>
  loading: boolean
  error: string | null

  fetchPositions: () => Promise<void>
  fetchFees: (lpId: string) => Promise<void>
  fetchSnapshots: (lpId: string) => Promise<void>
  refreshPrices: (coingeckoIds: string[]) => Promise<void>

  addPosition: (data: Omit<LPPosition, 'id' | 'created_at' | 'updated_at' | 'closed_at' | 'realized_pnl_usd'>) => Promise<string | null>
  updatePosition: (id: string, data: Partial<Pick<LPPosition, 'qty1' | 'price1' | 'qty2' | 'price2' | 'initial_value_usd' | 'notes' | 'chain_id'>>) => Promise<void>
  closePosition: (id: string) => Promise<void>
  deletePosition: (id: string) => Promise<void>

  addFee: (lpId: string, date: string, feeCoin1: number, feeCoin2: number, feeUsdTotal: number) => Promise<void>
  updateFee: (id: string, lpId: string, date: string, feeCoin1: number, feeCoin2: number, feeUsdTotal: number) => Promise<void>
  deleteFee: (id: string, lpId: string) => Promise<void>

  generateTodaySnapshot: (lpId: string) => Promise<void>
  generateAllPendingSnapshots: () => Promise<void>
}

export const useLPStore = create<LPStore>((set, get) => ({
  positions: [],
  fees: {},
  snapshots: {},
  currentPrices: {},
  loading: false,
  error: null,

  async fetchPositions() {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('lp_positions')
      .select('*, coin1:coins!lp_positions_coin1_id_fkey(*), coin2:coins!lp_positions_coin2_id_fkey(*), location:locations(*, platform:platforms(*)), platform:platforms(*), chain:chains(*)')
      .order('created_at', { ascending: false })
    if (error) { set({ error: error.message, loading: false }); return }
    set({ positions: data as LPPosition[], loading: false })
  },

  async fetchFees(lpId) {
    const { data } = await supabase
      .from('lp_fee_entries').select('*').eq('lp_id', lpId).order('date', { ascending: true })
    if (data) set(s => ({ fees: { ...s.fees, [lpId]: data as LPFeeEntry[] } }))
  },

  async fetchSnapshots(lpId) {
    const { data } = await supabase
      .from('lp_snapshots').select('*').eq('lp_id', lpId).order('date', { ascending: true })
    if (data) set(s => ({ snapshots: { ...s.snapshots, [lpId]: data as LPSnapshot[] } }))
  },

  async refreshPrices(coingeckoIds) {
    if (!coingeckoIds.length) return
    try {
      const prices = await getCurrentPrices(coingeckoIds)
      const mapped: Record<string, number> = {}
      for (const [id, v] of Object.entries(prices)) mapped[id] = v.usd
      set(s => ({ currentPrices: { ...s.currentPrices, ...mapped } }))
    } catch { /* best-effort */ }
  },

  async addPosition(data) {
    const { data: row, error } = await supabase
      .from('lp_positions')
      .insert({ ...data, status: 'open' })
      .select('*, coin1:coins!lp_positions_coin1_id_fkey(*), coin2:coins!lp_positions_coin2_id_fkey(*), location:locations(*, platform:platforms(*)), platform:platforms(*), chain:chains(*)')
      .single()
    if (error || !row) return null
    const record = row as LPPosition
    set(s => ({ positions: [record, ...s.positions] }))
    await logAndPush('lp_create', record.id, 'lp_position', null, record, async () => {
      await supabase.from('lp_positions').delete().eq('id', record.id)
      set(s => ({ positions: s.positions.filter(p => p.id !== record.id) }))
    })
    await get().generateTodaySnapshot(record.id)
    return record.id
  },

  async updatePosition(id, data) {
    const before = get().positions.find(p => p.id === id)
    const { data: row, error } = await supabase
      .from('lp_positions').update(data).eq('id', id)
      .select('*, coin1:coins!lp_positions_coin1_id_fkey(*), coin2:coins!lp_positions_coin2_id_fkey(*), location:locations(*, platform:platforms(*)), platform:platforms(*), chain:chains(*)')
      .single()
    if (error || !row) return
    const updated = row as LPPosition
    set(s => ({ positions: s.positions.map(p => p.id === id ? updated : p) }))
    await logAndPush('lp_update', id, 'lp_position', before ?? null, updated, async () => {
      if (!before) return
      await supabase.from('lp_positions').update({ qty1: before.qty1, price1: before.price1, qty2: before.qty2, price2: before.price2, notes: before.notes, chain_id: before.chain_id }).eq('id', id)
      set(s => ({ positions: s.positions.map(p => p.id === id ? before : p) }))
    })
  },

  async closePosition(id) {
    const pos = get().positions.find(p => p.id === id)
    if (!pos) return
    const { data: row } = await supabase
      .from('lp_positions').update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, coin1:coins!lp_positions_coin1_id_fkey(*), coin2:coins!lp_positions_coin2_id_fkey(*), location:locations(*, platform:platforms(*)), platform:platforms(*), chain:chains(*)')
      .single()
    if (!row) return
    const updated = row as LPPosition
    set(s => ({ positions: s.positions.map(p => p.id === id ? updated : p) }))
    await logAndPush('lp_close', id, 'lp_position', pos, updated, async () => {
      await supabase.from('lp_positions').update({ status: 'open', closed_at: null }).eq('id', id)
      set(s => ({ positions: s.positions.map(p => p.id === id ? pos : p) }))
    })
  },

  async deletePosition(id) {
    const before = get().positions.find(p => p.id === id)
    await supabase.from('lp_positions').delete().eq('id', id)
    set(s => ({ positions: s.positions.filter(p => p.id !== id) }))
    await logAndPush('lp_delete', id, 'lp_position', before ?? null, null, async () => {
      if (!before) return
      const { coin1, coin2, location, platform, chain, ...rest } = before as LPPosition & Record<string, unknown>
      void coin1; void coin2; void location; void platform; void chain
      await supabase.from('lp_positions').insert(rest)
      set(s => ({ positions: [before, ...s.positions] }))
    })
  },

  // ─── Fees ────────────────────────────────────────────────────

  async addFee(lpId, date, feeCoin1, feeCoin2, feeUsdTotal) {
    const { data, error } = await supabase
      .from('lp_fee_entries')
      .insert({ lp_id: lpId, date, fee_coin1: feeCoin1, fee_coin2: feeCoin2, fee_usd_total: feeUsdTotal })
      .select().single()
    if (error || !data) return
    const record = data as LPFeeEntry
    set(s => ({ fees: { ...s.fees, [lpId]: [...(s.fees[lpId] ?? []), record].sort((a, b) => a.date.localeCompare(b.date)) } }))
    await logAndPush('lp_fee_add', record.id, 'lp_fee', null, record, async () => {
      await supabase.from('lp_fee_entries').delete().eq('id', record.id)
      set(s => ({ fees: { ...s.fees, [lpId]: (s.fees[lpId] ?? []).filter(f => f.id !== record.id) } }))
    })
  },

  async updateFee(id, lpId, date, feeCoin1, feeCoin2, feeUsdTotal) {
    const before = (get().fees[lpId] ?? []).find(f => f.id === id)
    const { data, error } = await supabase
      .from('lp_fee_entries').update({ date, fee_coin1: feeCoin1, fee_coin2: feeCoin2, fee_usd_total: feeUsdTotal })
      .eq('id', id).select().single()
    if (error || !data) return
    const updated = data as LPFeeEntry
    set(s => ({ fees: { ...s.fees, [lpId]: (s.fees[lpId] ?? []).map(f => f.id === id ? updated : f) } }))
    await logAndPush('lp_fee_update', id, 'lp_fee', before ?? null, updated, async () => {
      if (!before) return
      await supabase.from('lp_fee_entries').update({ date: before.date, fee_coin1: before.fee_coin1, fee_coin2: before.fee_coin2, fee_usd_total: before.fee_usd_total }).eq('id', id)
      set(s => ({ fees: { ...s.fees, [lpId]: (s.fees[lpId] ?? []).map(f => f.id === id ? before : f) } }))
    })
  },

  async deleteFee(id, lpId) {
    const before = (get().fees[lpId] ?? []).find(f => f.id === id)
    await supabase.from('lp_fee_entries').delete().eq('id', id)
    set(s => ({ fees: { ...s.fees, [lpId]: (s.fees[lpId] ?? []).filter(f => f.id !== id) } }))
    await logAndPush('lp_fee_delete', id, 'lp_fee', before ?? null, null, async () => {
      if (!before) return
      await supabase.from('lp_fee_entries').insert({ id: before.id, lp_id: lpId, date: before.date, fee_coin1: before.fee_coin1, fee_coin2: before.fee_coin2, fee_usd_total: before.fee_usd_total })
      set(s => ({ fees: { ...s.fees, [lpId]: [...(s.fees[lpId] ?? []), before].sort((a, b) => a.date.localeCompare(b.date)) } }))
    })
  },

  // ─── Snapshots ───────────────────────────────────────────────

  async generateTodaySnapshot(lpId) {
    const lp = get().positions.find(p => p.id === lpId)
    if (!lp || lp.status !== 'open' || !lp.coin1 || !lp.coin2) return
    const today = new Date().toISOString().split('T')[0]
    const { data: existing } = await supabase
      .from('lp_snapshots').select('id').eq('lp_id', lpId).eq('date', today).single()
    if (existing) return

    const ids = [lp.coin1.coingecko_id, lp.coin2.coingecko_id]
    let prices = get().currentPrices
    if (!prices[ids[0]] || !prices[ids[1]]) {
      const fetched = await getCurrentPrices(ids)
      const mapped: Record<string, number> = {}
      for (const [id, v] of Object.entries(fetched)) mapped[id] = v.usd
      prices = { ...prices, ...mapped }
      set(s => ({ currentPrices: { ...s.currentPrices, ...mapped } }))
    }

    const p1 = prices[lp.coin1.coingecko_id] ?? lp.price1
    const p2 = prices[lp.coin2.coingecko_id] ?? lp.price2
    const valueUsd = calcHoldValue(lp.qty1, p1, lp.qty2, p2)
    const holdValueUsd = calcHoldValue(lp.qty1, p1, lp.qty2, p2)

    const { data: snap } = await supabase
      .from('lp_snapshots')
      .insert({ lp_id: lpId, date: today, value_usd: valueUsd, hold_value_usd: holdValueUsd })
      .select().single()

    if (snap) {
      set(s => ({
        snapshots: { ...s.snapshots, [lpId]: [...(s.snapshots[lpId] ?? []), snap as LPSnapshot] },
      }))
    }
  },

  async generateAllPendingSnapshots() {
    const open = get().positions.filter(p => p.status === 'open' && p.coin1 && p.coin2)
    if (!open.length) return
    const ids = [...new Set(open.flatMap(p => [p.coin1!.coingecko_id, p.coin2!.coingecko_id]))]
    await get().refreshPrices(ids)
    await Promise.all(open.map(p => get().generateTodaySnapshot(p.id)))
  },
}))
