import { useState } from 'react'
import { useMaintenanceStore } from '../../store/useMaintenanceStore'
import type { Chain } from '../../types'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { Modal } from '../common/Modal'
import { CoinSearch } from './CoinSearch'

export function ChainsMaintainer() {
  const { chains, addChain, updateChain, deleteChain } = useMaintenanceStore()
  const [modal, setModal] = useState<{ open: boolean; editing: Chain | null }>({ open: false, editing: null })
  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoMode, setLogoMode] = useState<'url' | 'coingecko'>('url')
  const [saving, setSaving] = useState(false)

  function openAdd() {
    setName(''); setLogoUrl(''); setLogoMode('url')
    setModal({ open: true, editing: null })
  }

  function openEdit(c: Chain) {
    setName(c.name); setLogoUrl(c.logo_url ?? ''); setLogoMode('url')
    setModal({ open: true, editing: c })
  }

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    const url = logoUrl.trim() || null
    if (modal.editing) {
      await updateChain(modal.editing.id, name.trim(), url)
    } else {
      await addChain(name.trim(), url)
    }
    setSaving(false)
    setModal({ open: false, editing: null })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-sm text-[var(--color-text-muted)]">Chains · {chains.length}</h3>
        <Button size="sm" onClick={openAdd}>+ Add</Button>
      </div>

      {chains.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">No chains yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
              <th className="text-left py-2 font-medium w-8" />
              <th className="text-left py-2 font-medium">Name</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {chains.map(c => (
              <tr key={c.id} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-3)]/30">
                <td className="py-2.5 pr-2">
                  {c.logo_url
                    ? <img src={c.logo_url} alt={c.name} className="w-6 h-6 rounded-full object-cover" />
                    : <span className="w-6 h-6 rounded-full bg-[var(--color-surface-3)] flex items-center justify-center text-xs">⛓</span>
                  }
                </td>
                <td className="py-2.5 pr-4">{c.name}</td>
                <td className="py-2.5 text-right">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteChain(c.id)} className="text-red-400 hover:text-red-300 ml-1">Del</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal open={modal.open} onClose={() => setModal({ open: false, editing: null })}
        title={modal.editing ? 'Edit Chain' : 'Add Chain'}>
        <div className="flex flex-col gap-3">
          <Input label="Chain Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ethereum" />

          <div className="flex gap-2 text-xs">
            <button onClick={() => setLogoMode('url')}
              className={`px-2 py-1 rounded ${logoMode === 'url' ? 'bg-blue-500/20 text-blue-400' : 'text-[var(--color-text-muted)]'}`}>
              Logo URL
            </button>
            <button onClick={() => setLogoMode('coingecko')}
              className={`px-2 py-1 rounded ${logoMode === 'coingecko' ? 'bg-blue-500/20 text-blue-400' : 'text-[var(--color-text-muted)]'}`}>
              From CoinGecko
            </button>
          </div>

          {logoMode === 'url'
            ? <Input label="Logo URL" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." />
            : (
              <div>
                <p className="text-xs text-[var(--color-text-muted)] mb-1">Search coin to get logo</p>
                <CoinSearch onSelect={c => { setLogoUrl(c.logo_url ?? '') }} />
                {logoUrl && <img src={logoUrl} className="w-8 h-8 rounded-full mt-2" />}
              </div>
            )
          }

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="secondary" size="sm" onClick={() => setModal({ open: false, editing: null })}>Cancel</Button>
            <Button size="sm" loading={saving} onClick={save}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
