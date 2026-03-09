import { useEffect, useState } from 'react'
import { supabase } from '../api/supabase'
import { useUndoStore } from '../store/useUndoStore'
import type { Transaction } from '../types'
import { Spinner } from '../components/common/Spinner'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { fmtDate } from '../utils/calculations'

const TYPE_LABELS: Record<string, string> = {
  position_create: 'Position opened',
  position_update: 'Position edited',
  position_close: 'Position closed',
  position_delete: 'Position deleted',
  lp_create: 'LP opened',
  lp_update: 'LP edited',
  lp_close: 'LP closed',
  lp_delete: 'LP deleted',
  lp_fee_add: 'LP fee added',
  lp_fee_update: 'LP fee edited',
  lp_fee_delete: 'LP fee deleted',
  coin_add: 'Coin added',
  coin_delete: 'Coin removed',
  chain_add: 'Chain added',
  chain_update: 'Chain edited',
  chain_delete: 'Chain removed',
  platform_add: 'Platform added',
  platform_update: 'Platform edited',
  platform_delete: 'Platform removed',
  location_add: 'Location added',
  location_update: 'Location edited',
  location_delete: 'Location removed',
}

const TYPE_COLOR: Record<string, 'green' | 'red' | 'blue' | 'yellow' | 'gray'> = {
  position_create: 'green', position_close: 'gray', position_delete: 'red', position_update: 'blue',
  lp_create: 'green', lp_close: 'gray', lp_delete: 'red', lp_update: 'blue',
  lp_fee_add: 'green', lp_fee_update: 'blue', lp_fee_delete: 'red',
  coin_add: 'green', coin_delete: 'red',
  chain_add: 'green', chain_update: 'blue', chain_delete: 'red',
  platform_add: 'green', platform_update: 'blue', platform_delete: 'red',
  location_add: 'green', location_update: 'blue', location_delete: 'red',
}

export default function Transactions() {
  const [txs, setTxs] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const { canUndo, undo, stack } = useUndoStore()

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    setTxs((data ?? []) as Transaction[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function toggle(id: string) {
    setExpanded(e => e === id ? null : id)
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Transactions</h1>
        <div className="flex items-center gap-2">
          {canUndo && (
            <Button variant="secondary" size="sm" onClick={async () => { await undo(); await load() }}>
              ↩ Undo last ({stack.length})
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={load}>↻ Refresh</Button>
        </div>
      </div>

      {loading && <div className="flex justify-center py-12"><Spinner size="lg" /></div>}

      {!loading && txs.length === 0 && (
        <p className="text-sm text-[var(--color-text-muted)] py-8 text-center">No transactions yet.</p>
      )}

      {!loading && txs.length > 0 && (
        <div className="flex flex-col gap-1">
          {txs.map(tx => (
            <div key={tx.id}
              className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg overflow-hidden">
              <button
                onClick={() => toggle(tx.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--color-surface-3)]/30 transition-colors cursor-pointer">
                <Badge
                  label={TYPE_LABELS[tx.type] ?? tx.type}
                  variant={TYPE_COLOR[tx.type] ?? 'gray'} />
                <span className="text-xs text-[var(--color-text-muted)] flex-1">
                  {tx.entity_type} · {tx.entity_id.slice(0, 8)}…
                </span>
                <span className="text-xs text-[var(--color-text-muted)] shrink-0">
                  {new Date(tx.created_at).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
                <span className="text-[var(--color-text-muted)] text-xs ml-1">
                  {expanded === tx.id ? '▲' : '▼'}
                </span>
              </button>

              {expanded === tx.id && (
                <div className="px-4 pb-3 border-t border-[var(--color-border)]/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    {tx.payload_before && (
                      <div>
                        <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1">Before</p>
                        <pre className="text-xs bg-[var(--color-surface-3)] rounded p-2 overflow-auto max-h-40 text-[var(--color-text)]">
                          {JSON.stringify(tx.payload_before, null, 2)}
                        </pre>
                      </div>
                    )}
                    {tx.payload_after && (
                      <div>
                        <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1">After</p>
                        <pre className="text-xs bg-[var(--color-surface-3)] rounded p-2 overflow-auto max-h-40 text-[var(--color-text)]">
                          {JSON.stringify(tx.payload_after, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-2">
                    {fmtDate(tx.created_at)} · ID: <span className="font-mono">{tx.id}</span>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
