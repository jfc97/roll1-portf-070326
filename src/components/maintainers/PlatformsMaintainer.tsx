import { useState } from 'react'
import { useMaintenanceStore } from '../../store/useMaintenanceStore'
import type { Platform } from '../../types'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { Select } from '../common/Select'
import { Modal } from '../common/Modal'
import { Badge } from '../common/Badge'

const CUSTODY_OPTIONS = [
  { value: 'CEX', label: 'CEX' },
  { value: 'DEX', label: 'DEX' },
  { value: 'Wallet', label: 'Wallet' },
]

const custodyColor: Record<string, 'blue' | 'green' | 'yellow'> = {
  CEX: 'blue', DEX: 'green', Wallet: 'yellow',
}

export function PlatformsMaintainer() {
  const { platforms, addPlatform, updatePlatform, deletePlatform } = useMaintenanceStore()
  const [modal, setModal] = useState<{ open: boolean; editing: Platform | null }>({ open: false, editing: null })
  const [name, setName] = useState('')
  const [custodyType, setCustodyType] = useState<Platform['custody_type']>('CEX')
  const [saving, setSaving] = useState(false)

  function openAdd() {
    setName(''); setCustodyType('CEX')
    setModal({ open: true, editing: null })
  }

  function openEdit(p: Platform) {
    setName(p.name); setCustodyType(p.custody_type)
    setModal({ open: true, editing: p })
  }

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    if (modal.editing) {
      await updatePlatform(modal.editing.id, name.trim(), custodyType)
    } else {
      await addPlatform(name.trim(), custodyType)
    }
    setSaving(false)
    setModal({ open: false, editing: null })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-sm text-[var(--color-text-muted)]">Platforms · {platforms.length}</h3>
        <Button size="sm" onClick={openAdd}>+ Add</Button>
      </div>

      {platforms.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">No platforms yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
              <th className="text-left py-2 font-medium">Name</th>
              <th className="text-left py-2 font-medium">Custody</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {platforms.map(p => (
              <tr key={p.id} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-3)]/30">
                <td className="py-2.5 pr-4">{p.name}</td>
                <td className="py-2.5 pr-4">
                  <Badge label={p.custody_type} variant={custodyColor[p.custody_type]} />
                </td>
                <td className="py-2.5 text-right">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => deletePlatform(p.id)} className="text-red-400 hover:text-red-300 ml-1">Del</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal open={modal.open} onClose={() => setModal({ open: false, editing: null })}
        title={modal.editing ? 'Edit Platform' : 'Add Platform'}>
        <div className="flex flex-col gap-3">
          <Input label="Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Binance" />
          <Select label="Custody Type" value={custodyType}
            onChange={e => setCustodyType(e.target.value as Platform['custody_type'])}
            options={CUSTODY_OPTIONS} />
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="secondary" size="sm" onClick={() => setModal({ open: false, editing: null })}>Cancel</Button>
            <Button size="sm" loading={saving} onClick={save}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
