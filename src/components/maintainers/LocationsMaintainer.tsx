import { useState } from 'react'
import { useMaintenanceStore } from '../../store/useMaintenanceStore'
import type { Location } from '../../types'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { Select } from '../common/Select'
import { Modal } from '../common/Modal'

export function LocationsMaintainer() {
  const { locations, platforms, addLocation, updateLocation, deleteLocation } = useMaintenanceStore()
  const [modal, setModal] = useState<{ open: boolean; editing: Location | null }>({ open: false, editing: null })
  const [name, setName] = useState('')
  const [platformId, setPlatformId] = useState('')
  const [saving, setSaving] = useState(false)

  const platformOptions = platforms.map(p => ({ value: p.id, label: `${p.name} (${p.custody_type})` }))

  function openAdd() {
    setName(''); setPlatformId(platforms[0]?.id ?? '')
    setModal({ open: true, editing: null })
  }

  function openEdit(l: Location) {
    setName(l.name); setPlatformId(l.platform_id)
    setModal({ open: true, editing: l })
  }

  async function save() {
    if (!name.trim() || !platformId) return
    setSaving(true)
    if (modal.editing) {
      await updateLocation(modal.editing.id, name.trim(), platformId)
    } else {
      await addLocation(name.trim(), platformId)
    }
    setSaving(false)
    setModal({ open: false, editing: null })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-sm text-[var(--color-text-muted)]">Locations · {locations.length}</h3>
        <Button size="sm" onClick={openAdd} disabled={!platforms.length}>+ Add</Button>
      </div>
      {!platforms.length && (
        <p className="text-sm text-yellow-400/80">Add at least one Platform first.</p>
      )}

      {locations.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
              <th className="text-left py-2 font-medium">Name</th>
              <th className="text-left py-2 font-medium">Platform</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {locations.map(l => (
              <tr key={l.id} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-3)]/30">
                <td className="py-2.5 pr-4">{l.name}</td>
                <td className="py-2.5 pr-4 text-[var(--color-text-muted)]">{l.platform?.name ?? '—'}</td>
                <td className="py-2.5 text-right">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(l)}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteLocation(l.id)} className="text-red-400 hover:text-red-300 ml-1">Del</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal open={modal.open} onClose={() => setModal({ open: false, editing: null })}
        title={modal.editing ? 'Edit Location' : 'Add Location'}>
        <div className="flex flex-col gap-3">
          <Input label="Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Spot Account" />
          <Select label="Platform" value={platformId} onChange={e => setPlatformId(e.target.value)} options={platformOptions} />
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="secondary" size="sm" onClick={() => setModal({ open: false, editing: null })}>Cancel</Button>
            <Button size="sm" loading={saving} onClick={save}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
