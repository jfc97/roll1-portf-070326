import { useEffect, useState } from 'react'
import { useMaintenanceStore } from '../store/useMaintenanceStore'
import { PlatformsMaintainer } from '../components/maintainers/PlatformsMaintainer'
import { LocationsMaintainer } from '../components/maintainers/LocationsMaintainer'
import { ChainsMaintainer } from '../components/maintainers/ChainsMaintainer'
import { CoinsMaintainer } from '../components/maintainers/CoinsMaintainer'
import { Spinner } from '../components/common/Spinner'

type Tab = 'coins' | 'platforms' | 'locations' | 'chains'

const TABS: { id: Tab; label: string }[] = [
  { id: 'coins', label: 'Coins' },
  { id: 'platforms', label: 'Platforms' },
  { id: 'locations', label: 'Locations' },
  { id: 'chains', label: 'Chains' },
]

export default function Settings() {
  const { fetchAll, loading, error } = useMaintenanceStore()
  const [tab, setTab] = useState<Tab>('coins')

  useEffect(() => { fetchAll() }, [])

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold mb-6">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--color-border)] mb-6">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px cursor-pointer ${
              tab === t.id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 rounded-md px-4 py-3">{error}</p>
      )}

      {!loading && !error && (
        <div className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl p-5">
          {tab === 'coins' && <CoinsMaintainer />}
          {tab === 'platforms' && <PlatformsMaintainer />}
          {tab === 'locations' && <LocationsMaintainer />}
          {tab === 'chains' && <ChainsMaintainer />}
        </div>
      )}
    </div>
  )
}
