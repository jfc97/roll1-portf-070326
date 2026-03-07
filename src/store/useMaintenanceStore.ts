import { create } from 'zustand'
import { supabase } from '../api/supabase'
import { getDailyHistory } from '../api/coingecko'
import { logAndPush } from './useUndoStore'
import type { Platform, Location, Chain, Coin, CoinPrice } from '../types'

interface MaintenanceStore {
  platforms: Platform[]
  locations: Location[]
  chains: Chain[]
  coins: Coin[]
  loading: boolean
  error: string | null

  fetchAll: () => Promise<void>

  // Platforms
  addPlatform: (name: string, custodyType: Platform['custody_type']) => Promise<void>
  updatePlatform: (id: string, name: string, custodyType: Platform['custody_type']) => Promise<void>
  deletePlatform: (id: string) => Promise<void>

  // Locations
  addLocation: (name: string, platformId: string) => Promise<void>
  updateLocation: (id: string, name: string, platformId: string) => Promise<void>
  deleteLocation: (id: string) => Promise<void>

  // Chains
  addChain: (name: string, logoUrl: string | null) => Promise<void>
  updateChain: (id: string, name: string, logoUrl: string | null) => Promise<void>
  deleteChain: (id: string) => Promise<void>

  // Coins
  addCoin: (coin: Omit<Coin, 'id' | 'created_at'>) => Promise<void>
  deleteCoin: (id: string) => Promise<void>
  syncCoinPrices: (coinId: string, coingeckoId: string) => Promise<void>
  getLatestPrice: (coinId: string) => number | null
  _prices: Record<string, CoinPrice[]>
}

export const useMaintenanceStore = create<MaintenanceStore>((set, get) => ({
  platforms: [],
  locations: [],
  chains: [],
  coins: [],
  loading: false,
  error: null,
  _prices: {},

  async fetchAll() {
    set({ loading: true, error: null })
    const [p, l, ch, co] = await Promise.all([
      supabase.from('platforms').select('*').order('name'),
      supabase.from('locations').select('*, platform:platforms(*)').order('name'),
      supabase.from('chains').select('*').order('name'),
      supabase.from('coins').select('*').order('name'),
    ])
    if (p.error || l.error || ch.error || co.error) {
      set({ error: 'Failed to load data', loading: false })
      return
    }
    set({
      platforms: p.data as Platform[],
      locations: l.data as Location[],
      chains: ch.data as Chain[],
      coins: co.data as Coin[],
      loading: false,
    })
  },

  // ─── Platforms ───────────────────────────────────────────────

  async addPlatform(name, custodyType) {
    const { data, error } = await supabase
      .from('platforms').insert({ name, custody_type: custodyType }).select().single()
    if (error || !data) return
    const record = data as Platform
    set(s => ({ platforms: [...s.platforms, record].sort((a, b) => a.name.localeCompare(b.name)) }))
    await logAndPush('platform_add', record.id, 'platform', null, record, async () => {
      await supabase.from('platforms').delete().eq('id', record.id)
      set(s => ({ platforms: s.platforms.filter(x => x.id !== record.id) }))
    })
  },

  async updatePlatform(id, name, custodyType) {
    const before = get().platforms.find(p => p.id === id)
    const { data, error } = await supabase
      .from('platforms').update({ name, custody_type: custodyType }).eq('id', id).select().single()
    if (error || !data) return
    const updated = data as Platform
    set(s => ({ platforms: s.platforms.map(p => p.id === id ? updated : p) }))
    await logAndPush('platform_update', id, 'platform', before ?? null, updated, async () => {
      if (!before) return
      await supabase.from('platforms').update({ name: before.name, custody_type: before.custody_type }).eq('id', id)
      set(s => ({ platforms: s.platforms.map(p => p.id === id ? before : p) }))
    })
  },

  async deletePlatform(id) {
    const before = get().platforms.find(p => p.id === id)
    await supabase.from('platforms').delete().eq('id', id)
    set(s => ({ platforms: s.platforms.filter(p => p.id !== id) }))
    await logAndPush('platform_delete', id, 'platform', before ?? null, null, async () => {
      if (!before) return
      await supabase.from('platforms').insert({ id: before.id, name: before.name, custody_type: before.custody_type, created_at: before.created_at })
      set(s => ({ platforms: [...s.platforms, before].sort((a, b) => a.name.localeCompare(b.name)) }))
    })
  },

  // ─── Locations ───────────────────────────────────────────────

  async addLocation(name, platformId) {
    const { data, error } = await supabase
      .from('locations').insert({ name, platform_id: platformId }).select('*, platform:platforms(*)').single()
    if (error || !data) return
    const record = data as Location
    set(s => ({ locations: [...s.locations, record].sort((a, b) => a.name.localeCompare(b.name)) }))
    await logAndPush('location_add', record.id, 'location', null, record, async () => {
      await supabase.from('locations').delete().eq('id', record.id)
      set(s => ({ locations: s.locations.filter(x => x.id !== record.id) }))
    })
  },

  async updateLocation(id, name, platformId) {
    const before = get().locations.find(l => l.id === id)
    const { data, error } = await supabase
      .from('locations').update({ name, platform_id: platformId }).eq('id', id).select('*, platform:platforms(*)').single()
    if (error || !data) return
    const updated = data as Location
    set(s => ({ locations: s.locations.map(l => l.id === id ? updated : l) }))
    await logAndPush('location_update', id, 'location', before ?? null, updated, async () => {
      if (!before) return
      await supabase.from('locations').update({ name: before.name, platform_id: before.platform_id }).eq('id', id)
      set(s => ({ locations: s.locations.map(l => l.id === id ? before : l) }))
    })
  },

  async deleteLocation(id) {
    const before = get().locations.find(l => l.id === id)
    await supabase.from('locations').delete().eq('id', id)
    set(s => ({ locations: s.locations.filter(l => l.id !== id) }))
    await logAndPush('location_delete', id, 'location', before ?? null, null, async () => {
      if (!before) return
      await supabase.from('locations').insert({ id: before.id, name: before.name, platform_id: before.platform_id, created_at: before.created_at })
      set(s => ({ locations: [...s.locations, before].sort((a, b) => a.name.localeCompare(b.name)) }))
    })
  },

  // ─── Chains ──────────────────────────────────────────────────

  async addChain(name, logoUrl) {
    const { data, error } = await supabase
      .from('chains').insert({ name, logo_url: logoUrl }).select().single()
    if (error || !data) return
    const record = data as Chain
    set(s => ({ chains: [...s.chains, record].sort((a, b) => a.name.localeCompare(b.name)) }))
    await logAndPush('chain_add', record.id, 'chain', null, record, async () => {
      await supabase.from('chains').delete().eq('id', record.id)
      set(s => ({ chains: s.chains.filter(x => x.id !== record.id) }))
    })
  },

  async updateChain(id, name, logoUrl) {
    const before = get().chains.find(c => c.id === id)
    const { data, error } = await supabase
      .from('chains').update({ name, logo_url: logoUrl }).eq('id', id).select().single()
    if (error || !data) return
    const updated = data as Chain
    set(s => ({ chains: s.chains.map(c => c.id === id ? updated : c) }))
    await logAndPush('chain_update', id, 'chain', before ?? null, updated, async () => {
      if (!before) return
      await supabase.from('chains').update({ name: before.name, logo_url: before.logo_url }).eq('id', id)
      set(s => ({ chains: s.chains.map(c => c.id === id ? before : c) }))
    })
  },

  async deleteChain(id) {
    const before = get().chains.find(c => c.id === id)
    await supabase.from('chains').delete().eq('id', id)
    set(s => ({ chains: s.chains.filter(c => c.id !== id) }))
    await logAndPush('chain_delete', id, 'chain', before ?? null, null, async () => {
      if (!before) return
      await supabase.from('chains').insert({ id: before.id, name: before.name, logo_url: before.logo_url, created_at: before.created_at })
      set(s => ({ chains: [...s.chains, before].sort((a, b) => a.name.localeCompare(b.name)) }))
    })
  },

  // ─── Coins ───────────────────────────────────────────────────

  async addCoin(coin) {
    const { data, error } = await supabase.from('coins').insert(coin).select().single()
    if (error || !data) return
    const record = data as Coin
    set(s => ({ coins: [...s.coins, record].sort((a, b) => a.name.localeCompare(b.name)) }))
    await logAndPush('coin_add', record.id, 'coin', null, record, async () => {
      await supabase.from('coins').delete().eq('id', record.id)
      set(s => ({ coins: s.coins.filter(x => x.id !== record.id) }))
    })
    // Auto-sync prices after adding
    await get().syncCoinPrices(record.id, record.coingecko_id)
  },

  async deleteCoin(id) {
    const before = get().coins.find(c => c.id === id)
    await supabase.from('coins').delete().eq('id', id)
    set(s => ({ coins: s.coins.filter(c => c.id !== id) }))
    await logAndPush('coin_delete', id, 'coin', before ?? null, null, async () => {
      if (!before) return
      await supabase.from('coins').insert({ id: before.id, name: before.name, symbol: before.symbol, coingecko_id: before.coingecko_id, logo_url: before.logo_url, created_at: before.created_at })
      set(s => ({ coins: [...s.coins, before].sort((a, b) => a.name.localeCompare(b.name)) }))
    })
  },

  async syncCoinPrices(coinId, coingeckoId) {
    try {
      const history = await getDailyHistory(coingeckoId, 'max')
      if (!history.length) return
      const rows = history.map(([ts, price]) => ({
        coin_id: coinId,
        date: new Date(ts).toISOString().split('T')[0],
        price_usd: price,
      }))
      // Upsert in chunks to avoid request size limits
      const chunkSize = 500
      for (let i = 0; i < rows.length; i += chunkSize) {
        await supabase.from('coin_prices').upsert(rows.slice(i, i + chunkSize), { onConflict: 'coin_id,date' })
      }
      // Cache locally
      const prices: CoinPrice[] = rows.map((r, idx) => ({ id: String(idx), ...r }))
      set(s => ({ _prices: { ...s._prices, [coinId]: prices } }))
    } catch {
      // Price sync is best-effort
    }
  },

  getLatestPrice(coinId) {
    const prices = get()._prices[coinId]
    if (!prices?.length) return null
    return prices[prices.length - 1].price_usd
  },
}))
