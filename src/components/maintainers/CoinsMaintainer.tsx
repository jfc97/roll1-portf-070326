import { useState } from 'react'
import { useMaintenanceStore } from '../../store/useMaintenanceStore'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'
import { CoinSearch } from './CoinSearch'
import { Spinner } from '../common/Spinner'

export function CoinsMaintainer() {
  const { coins, addCoin, deleteCoin, syncCoinPrices } = useMaintenanceStore()
  const [modal, setModal] = useState(false)
  const [selected, setSelected] = useState<{ name: string; symbol: string; coingecko_id: string; logo_url: string | null } | null>(null)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)

  async function save() {
    if (!selected) return
    setSaving(true)
    await addCoin(selected)
    setSaving(false)
    setModal(false)
    setSelected(null)
  }

  async function handleSync(coinId: string, coingeckoId: string) {
    setSyncing(coinId)
    await syncCoinPrices(coinId, coingeckoId)
    setSyncing(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-sm text-[var(--color-text-muted)]">Coins · {coins.length}</h3>
        <Button size="sm" onClick={() => { setSelected(null); setModal(true) }}>+ Add</Button>
      </div>

      {coins.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">No coins yet. Add coins to start tracking positions.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
              <th className="text-left py-2 font-medium w-8" />
              <th className="text-left py-2 font-medium">Name</th>
              <th className="text-left py-2 font-medium">Symbol</th>
              <th className="text-left py-2 font-medium">CoinGecko ID</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {coins.map(c => (
              <tr key={c.id} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-3)]/30">
                <td className="py-2.5 pr-2">
                  {c.logo_url
                    ? <img src={c.logo_url} alt={c.name} className="w-6 h-6 rounded-full object-cover" />
                    : <span className="w-6 h-6 rounded-full bg-[var(--color-surface-3)] flex items-center justify-center text-xs">🪙</span>
                  }
                </td>
                <td className="py-2.5 pr-4 font-medium">{c.name}</td>
                <td className="py-2.5 pr-4 text-[var(--color-text-muted)] uppercase">{c.symbol}</td>
                <td className="py-2.5 pr-4 text-[var(--color-text-muted)] text-xs font-mono">{c.coingecko_id}</td>
                <td className="py-2.5 text-right flex items-center gap-1 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => handleSync(c.id, c.coingecko_id)}
                    disabled={syncing === c.id}>
                    {syncing === c.id ? <Spinner size="sm" /> : '↻ Sync'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteCoin(c.id)}
                    className="text-red-400 hover:text-red-300">Del</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Add Coin">
        <div className="flex flex-col gap-4">
          <p className="text-xs text-[var(--color-text-muted)]">
            Search for a coin from CoinGecko. Price history will be synced automatically.
          </p>
          <CoinSearch onSelect={setSelected} />

          {selected && (
            <div className="flex items-center gap-3 p-3 bg-[var(--color-surface-3)] rounded-lg">
              {selected.logo_url && <img src={selected.logo_url} className="w-8 h-8 rounded-full" />}
              <div>
                <p className="font-medium text-sm">{selected.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{selected.symbol} · {selected.coingecko_id}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={() => setModal(false)}>Cancel</Button>
            <Button size="sm" loading={saving} disabled={!selected} onClick={save}>Add Coin</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
