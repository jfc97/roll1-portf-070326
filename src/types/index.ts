// ─── Enums ───────────────────────────────────────────────────────────────────

export type CustodyType = 'DEX' | 'CEX' | 'Wallet'
export type PositionStatus = 'open' | 'closed' | 'cancelled'

// ─── Core entities ───────────────────────────────────────────────────────────

export interface Platform {
  id: string
  name: string
  custody_type: CustodyType
  created_at: string
}

export interface Location {
  id: string
  name: string
  platform_id: string
  platform?: Platform
  created_at: string
}

export interface Chain {
  id: string
  name: string
  logo_url: string | null
  created_at: string
}

export interface Coin {
  id: string
  name: string
  symbol: string
  coingecko_id: string
  logo_url: string | null
  created_at: string
}

export interface CoinPrice {
  id: string
  coin_id: string
  date: string          // ISO date YYYY-MM-DD
  price_usd: number
}

// ─── Positions ────────────────────────────────────────────────────────────────

export interface Position {
  id: string
  status: PositionStatus
  coin_id: string
  coin?: Coin
  location_id: string
  location?: Location
  platform_id: string
  platform?: Platform
  chain_id: string | null
  chain?: Chain | null
  quantity: number
  unit_price_usd: number
  purchase_date: string    // ISO
  cost_coin: string        // e.g. 'USDT'
  cost_units: number
  cost_price: number
  cost_total_usd: number
  notes: string | null
  closed_at: string | null
  realized_pnl_usd: number | null
  created_at: string
  updated_at: string
}

export interface PositionSnapshot {
  id: string
  position_id: string
  date: string             // ISO date
  value_usd: number
  pnl_pct: number
  max_drawdown: number
  max_profit: number
}

// ─── Liquidity Pools ──────────────────────────────────────────────────────────

export interface LPPosition {
  id: string
  status: PositionStatus
  coin1_id: string
  coin1?: Coin
  qty1: number
  price1: number
  coin2_id: string
  coin2?: Coin
  qty2: number
  price2: number
  initial_value_usd: number
  location_id: string
  location?: Location
  platform_id: string
  platform?: Platform
  chain_id: string | null
  chain?: Chain | null
  notes: string | null
  closed_at: string | null
  realized_pnl_usd: number | null
  created_at: string
  updated_at: string
}

export interface LPFeeEntry {
  id: string
  lp_id: string
  date: string
  fee_coin1: number
  fee_coin2: number
  fee_usd_total: number
  created_at: string
}

export interface LPSnapshot {
  id: string
  lp_id: string
  date: string
  value_usd: number
  hold_value_usd: number
}

// ─── Transactions (audit log) ─────────────────────────────────────────────────

export type TransactionType =
  | 'position_create' | 'position_update' | 'position_close' | 'position_delete'
  | 'lp_create' | 'lp_update' | 'lp_close' | 'lp_delete'
  | 'lp_fee_add' | 'lp_fee_update' | 'lp_fee_delete'
  | 'coin_add' | 'coin_delete'
  | 'chain_add' | 'chain_update' | 'chain_delete'
  | 'platform_add' | 'platform_update' | 'platform_delete'
  | 'location_add' | 'location_update' | 'location_delete'

export interface Transaction {
  id: string
  type: TransactionType
  entity_id: string
  entity_type: string
  payload_before: Record<string, unknown> | null
  payload_after: Record<string, unknown> | null
  created_at: string
}

// ─── CoinGecko API shapes ─────────────────────────────────────────────────────

export interface CoinGeckoListItem {
  id: string
  symbol: string
  name: string
}

export interface CoinGeckoMarketData {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
}
