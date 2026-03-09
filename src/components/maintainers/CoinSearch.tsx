import { useState } from 'react'
import { getCoinMarketData } from '../../api/coingecko'
import { Spinner } from '../common/Spinner'

interface Props {
  onSelect: (coin: { name: string; symbol: string; coingecko_id: string; logo_url: string | null }) => void
}

export function CoinSearch({ onSelect }: Props) {
  const [inputId, setInputId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(val: string) {
    setInputId(val)
    setError(null)
  }

  async function handleFetch() {
    const id = inputId.trim().toLowerCase()
    if (!id) return
    setError(null)
    setLoading(true)
    try {
      const market = await getCoinMarketData([id])
      if (market.length > 0) {
        const coin = market[0]
        onSelect({
          name: coin.name,
          symbol: coin.symbol.toUpperCase(),
          coingecko_id: coin.id,
          logo_url: coin.image ?? null,
        })
      } else {
        setError(`ID '${id}' not found on CoinGecko`)
      }
    } catch {
      setError('Error connecting to CoinGecko. Try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleFetch()
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-[var(--color-surface-3)] border border-[var(--color-border)] rounded-md px-3 py-1.5">
          <input
            value={inputId}
            onChange={e => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="CoinGecko ID (e.g. bitcoin, shiba-inu)"
            className="flex-1 bg-transparent text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none font-mono"
          />
          {loading && <Spinner size="sm" />}
        </div>
        <button
          onClick={handleFetch}
          disabled={loading || !inputId.trim()}
          className="px-3 py-1.5 rounded-md text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
        >
          Fetch
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <span>✗</span> {error}
        </p>
      )}
    </div>
  )
}
