import { useEffect } from 'react'
import { usePositionsStore } from '../store/usePositionsStore'
import { useLPStore } from '../store/useLPStore'
import { useMaintenanceStore } from '../store/useMaintenanceStore'
import { PortfolioPie } from '../components/charts/PortfolioPie'
import { Spinner } from '../components/common/Spinner'
import { calcHoldValue } from '../utils/calculations'

export default function Portfolio() {
  const { positions, currentPrices: posPrices, fetchPositions } = usePositionsStore()
  const { positions: lps, currentPrices: lpPrices, fetchPositions: fetchLPs } = useLPStore()
  const { fetchAll } = useMaintenanceStore()

  useEffect(() => {
    fetchAll()
    fetchPositions()
    fetchLPs()
  }, [])

  const loading = !positions.length && !lps.length

  // Only count open positions/LPs
  const openPos = positions.filter(p => p.status === 'open')
  const openLPs = lps.filter(l => l.status === 'open')

  // Value by coin (positions)
  const byCoin: Record<string, { name: string; value: number }> = {}
  for (const p of openPos) {
    const price = p.coin ? (posPrices[p.coin.coingecko_id] ?? p.unit_price_usd) : p.unit_price_usd
    const val = p.quantity * price
    const key = p.coin?.symbol ?? 'Unknown'
    byCoin[key] = { name: p.coin?.name ?? key, value: (byCoin[key]?.value ?? 0) + val }
  }
  // Add LP coins
  for (const lp of openLPs) {
    const p1 = lp.coin1 ? (lpPrices[lp.coin1.coingecko_id] ?? lp.price1) : lp.price1
    const p2 = lp.coin2 ? (lpPrices[lp.coin2.coingecko_id] ?? lp.price2) : lp.price2
    const k1 = lp.coin1?.symbol ?? 'C1'
    const k2 = lp.coin2?.symbol ?? 'C2'
    byCoin[k1] = { name: lp.coin1?.name ?? k1, value: (byCoin[k1]?.value ?? 0) + lp.qty1 * p1 }
    byCoin[k2] = { name: lp.coin2?.name ?? k2, value: (byCoin[k2]?.value ?? 0) + lp.qty2 * p2 }
  }
  const coinData = Object.entries(byCoin).map(([, v]) => ({ name: v.name, value: v.value }))

  // Value by platform
  const byPlatform: Record<string, number> = {}
  for (const p of openPos) {
    const price = p.coin ? (posPrices[p.coin.coingecko_id] ?? p.unit_price_usd) : p.unit_price_usd
    const val = p.quantity * price
    const key = p.platform?.name ?? 'Unknown'
    byPlatform[key] = (byPlatform[key] ?? 0) + val
  }
  for (const lp of openLPs) {
    const key = lp.platform?.name ?? 'Unknown'
    const p1 = lp.coin1 ? (lpPrices[lp.coin1.coingecko_id] ?? lp.price1) : lp.price1
    const p2 = lp.coin2 ? (lpPrices[lp.coin2.coingecko_id] ?? lp.price2) : lp.price2
    byPlatform[key] = (byPlatform[key] ?? 0) + calcHoldValue(lp.qty1, p1, lp.qty2, p2)
  }
  const platformData = Object.entries(byPlatform).map(([name, value]) => ({ name, value }))

  // Value by location
  const byLocation: Record<string, number> = {}
  for (const p of openPos) {
    const price = p.coin ? (posPrices[p.coin.coingecko_id] ?? p.unit_price_usd) : p.unit_price_usd
    const key = p.location?.name ?? 'Unknown'
    byLocation[key] = (byLocation[key] ?? 0) + p.quantity * price
  }
  for (const lp of openLPs) {
    const key = lp.location?.name ?? 'Unknown'
    const p1 = lp.coin1 ? (lpPrices[lp.coin1.coingecko_id] ?? lp.price1) : lp.price1
    const p2 = lp.coin2 ? (lpPrices[lp.coin2.coingecko_id] ?? lp.price2) : lp.price2
    byLocation[key] = (byLocation[key] ?? 0) + calcHoldValue(lp.qty1, p1, lp.qty2, p2)
  }
  const locationData = Object.entries(byLocation).map(([name, value]) => ({ name, value }))

  // Value by custody type
  const byCustody: Record<string, number> = {}
  for (const p of openPos) {
    const price = p.coin ? (posPrices[p.coin.coingecko_id] ?? p.unit_price_usd) : p.unit_price_usd
    const key = p.platform?.custody_type ?? 'Unknown'
    byCustody[key] = (byCustody[key] ?? 0) + p.quantity * price
  }
  for (const lp of openLPs) {
    const key = lp.platform?.custody_type ?? 'Unknown'
    const p1 = lp.coin1 ? (lpPrices[lp.coin1.coingecko_id] ?? lp.price1) : lp.price1
    const p2 = lp.coin2 ? (lpPrices[lp.coin2.coingecko_id] ?? lp.price2) : lp.price2
    byCustody[key] = (byCustody[key] ?? 0) + calcHoldValue(lp.qty1, p1, lp.qty2, p2)
  }
  const custodyData = Object.entries(byCustody).map(([name, value]) => ({ name, value }))

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Portfolio Breakdown</h1>

      {loading && (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PortfolioPie data={coinData} title="By Coin" />
          <PortfolioPie data={platformData} title="By Platform" />
          <PortfolioPie data={locationData} title="By Location" />
          <PortfolioPie data={custodyData} title="By Custody Type" />
        </div>
      )}
    </div>
  )
}
