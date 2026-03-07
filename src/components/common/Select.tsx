import type { SelectHTMLAttributes } from 'react'

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export function Select({ label, error, options, placeholder, className = '', ...props }: Props) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-[var(--color-text-muted)]">{label}</label>}
      <select
        {...props}
        className={`w-full bg-[var(--color-surface-3)] border ${error ? 'border-red-500' : 'border-[var(--color-border)]'} rounded-md px-3 py-1.5 text-sm text-[var(--color-text)] focus:outline-none focus:border-blue-500 transition-colors ${className}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
