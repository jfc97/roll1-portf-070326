interface Props {
  label: string
  variant?: 'green' | 'red' | 'yellow' | 'blue' | 'gray'
}

const cls: Record<string, string> = {
  green: 'bg-green-500/15 text-green-400',
  red: 'bg-red-500/15 text-red-400',
  yellow: 'bg-yellow-500/15 text-yellow-400',
  blue: 'bg-blue-500/15 text-blue-400',
  gray: 'bg-slate-500/15 text-slate-400',
}

export function Badge({ label, variant = 'gray' }: Props) {
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${cls[variant]}`}>
      {label}
    </span>
  )
}
