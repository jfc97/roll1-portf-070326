import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { fmtUsd } from '../../utils/calculations'

export interface Slice { name: string; value: number; color?: string }

interface Props {
  data: Slice[]
  title: string
  height?: number
}

const COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
]

interface TooltipPayload { name: string; value: number }

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: TooltipPayload }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg p-2.5 text-xs shadow-xl">
      <p className="font-medium mb-0.5">{d.name}</p>
      <p className="text-[var(--color-text-muted)]">{fmtUsd(d.value)}</p>
    </div>
  )
}

export function PortfolioPie({ data, title, height = 220 }: Props) {
  const colored = data.map((d, i) => ({ ...d, color: COLORS[i % COLORS.length] }))
  const total = data.reduce((s, d) => s + d.value, 0)

  if (!data.length || total === 0) {
    return (
      <div className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl p-5">
        <p className="text-xs font-medium text-[var(--color-text-muted)] mb-3">{title}</p>
        <p className="text-xs text-[var(--color-text-muted)]">No data</p>
      </div>
    )
  }

  return (
    <div className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl p-5">
      <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1">{title}</p>
      <p className="text-base font-semibold mb-3">{fmtUsd(total)}</p>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={colored} dataKey="value" nameKey="name" cx="50%" cy="50%"
            innerRadius={50} outerRadius={80} paddingAngle={2}>
            {colored.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value) => (
            <span className="text-[var(--color-text-muted)]">{value}</span>
          )} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
