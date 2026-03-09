import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts'
import type { LPSnapshot } from '../../types'
import { fmtUsd, fmtDate } from '../../utils/calculations'

interface Props {
  snapshots: LPSnapshot[]
  height?: number
}

interface TooltipPayload {
  payload: { date: string; value_usd: number; hold_value_usd: number }
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const diff = d.value_usd - d.hold_value_usd
  return (
    <div className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg p-3 text-xs shadow-xl">
      <p className="text-[var(--color-text-muted)] mb-1">{fmtDate(d.date)}</p>
      <p className="text-blue-400">LP: {fmtUsd(d.value_usd)}</p>
      <p className="text-purple-400">Hold: {fmtUsd(d.hold_value_usd)}</p>
      <p className={`mt-1 font-medium ${diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        vs Hold: {diff >= 0 ? '+' : ''}{fmtUsd(diff)}
      </p>
    </div>
  )
}

export function LPChart({ snapshots, height = 200 }: Props) {
  if (snapshots.length < 2) {
    return <p className="text-xs text-[var(--color-text-muted)] py-4 text-center">Need at least 2 snapshots to display chart</p>
  }

  const data = snapshots.map(s => ({
    date: s.date,
    value_usd: Number(s.value_usd),
    hold_value_usd: Number(s.hold_value_usd),
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickFormatter={v => v.slice(5)} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickFormatter={v => `$${(v / 1000).toFixed(1)}k`} width={52} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="value_usd" name="LP Value" stroke="#3b82f6"
          strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        <Line type="monotone" dataKey="hold_value_usd" name="Hold Value" stroke="#a855f7"
          strokeWidth={2} dot={false} strokeDasharray="5 3" activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
