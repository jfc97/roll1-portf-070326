import type { CoinGeckoListItem, CoinGeckoMarketData } from '../types'

const BASE = 'https://api.coingecko.com/api/v3'

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`CoinGecko error ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

/** Search coins by query string (filters from full list) */
export async function searchCoins(query: string): Promise<CoinGeckoListItem[]> {
  const list = await get<CoinGeckoListItem[]>('/coins/list')
  const q = query.toLowerCase()
  return list
    .filter(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q) || c.id.includes(q))
    .slice(0, 50)
}

/** Get current price in USD for one or more coingecko IDs */
export async function getCurrentPrices(ids: string[]): Promise<Record<string, { usd: number }>> {
  if (!ids.length) return {}
  return get<Record<string, { usd: number }>>('/simple/price', {
    ids: ids.join(','),
    vs_currencies: 'usd',
  })
}

/** Get daily historical prices for a coin (returns [timestamp_ms, price_usd] pairs) */
export async function getDailyHistory(
  id: string,
  days: number | 'max' = 'max',
): Promise<Array<[number, number]>> {
  const data = await get<{ prices: Array<[number, number]> }>(`/coins/${id}/market_chart`, {
    vs_currency: 'usd',
    interval: 'daily',
    days: String(days),
  })
  return data.prices
}

/** Get coin market info (includes image logo) */
export async function getCoinMarketData(ids: string[]): Promise<CoinGeckoMarketData[]> {
  if (!ids.length) return []
  return get<CoinGeckoMarketData[]>('/coins/markets', {
    vs_currency: 'usd',
    ids: ids.join(','),
    per_page: '250',
    page: '1',
  })
}

/** Get single coin info (for logo etc.) */
export async function getCoinInfo(id: string): Promise<{ image: { small: string; large: string } }> {
  return get(`/coins/${id}`, { localization: 'false', market_data: 'false' })
}
