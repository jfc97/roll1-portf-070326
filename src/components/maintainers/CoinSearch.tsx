import { useState, useEffect, useRef } from 'react'
import { searchCoins, getCoinMarketData } from '../../api/coingecko'
import type { CoinGeckoListItem } from '../../types'
import { Spinner } from '../common/Spinner'

interface Props {
  onSelect: (coin: { name: string; symbol: string; coingecko_id: string; logo_url: string | null }) => void
}

export function CoinSearch({ onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CoinGeckoListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleInput(val: string) {
    setQuery(val)
    if (timer.current) clearTimeout(timer.current)
    if (!val.trim()) { setResults([]); setOpen(false); return }
    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await searchCoins(val)
        setResults(res.slice(0, 20))
        setOpen(true)
      } finally {
        setLoading(false)
      }
    }, 400)
  }

  async function pick(item: CoinGeckoListItem) {
    setOpen(false)
    setQuery(item.name)
    setLoading(true)
    try {
      const market = await getCoinMarketData([item.id])
      const logo = market[0]?.image ?? null
      onSelect({ name: item.name, symbol: item.symbol.toUpperCase(), coingecko_id: item.id, logo_url: logo })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2 bg-[var(--color-surface-3)] border border-[var(--color-border)] rounded-md px-3 py-1.5">
        <input
          value={query}
          onChange={e => handleInput(e.target.value)}
          placeholder="Search coin (e.g. Bitcoin, ETH…)"
          className="flex-1 bg-transparent text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none"
        />
        {loading && <Spinner size="sm" />}
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-md shadow-xl max-h-60 overflow-y-auto">
          {results.map(r => (
            <li
              key={r.id}
              onClick={() => pick(r)}
              className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-[var(--color-surface-3)] transition-colors"
            >
              <span className="text-[var(--color-text-muted)] w-12 shrink-0 text-xs uppercase">{r.symbol}</span>
              <span className="text-[var(--color-text)]">{r.name}</span>
              <span className="ml-auto text-[var(--color-text-muted)] text-xs">{r.id}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
