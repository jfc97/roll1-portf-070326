import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts'
import type { PositionSnapshot } from '../../types'
import { fmtUsd, fmtDate } from '../../utils/calculations'

interface Props {
  snapshots: PositionSnapshot[]
  costTotalUsd: number
  height?: number
}

interface TooltipPayload {
  payload: { date: string; value_usd: number; pnl_pct: number }
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const isPos = d.pnl_pct >= 0
  return (
    <div className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg p-3 text-xs shadow-xl">
      <p className="text-[var(--color-text-muted)] mb-1">{fmtDate(d.date)}</p>
      <p className="font-semibold text-[var(--color-text)]">{fmtUsd(d.value_usd)}</p>
      <p className={isPos ? 'text-green-400' : 'text-red-400'}>
        {d.pnl_pct >= 0 ? '+' : ''}{d.pnl_pct.toFixed(2)}%
      </p>
    </div>
  )
}

export function EquityCurve({ snapshots, costTotalUsd, height = 200 }: Props) {
  if (!snapshots.length) {
    return <p className="text-xs text-[var(--color-text-muted)] py-4 text-center">No data yet</p>
  }

  const isProfit = snapshots[snapshots.length - 1]?.value_usd >= costTotalUsd
  const strokeColor = isProfit ? '#22c55e' : '#ef4444'
  const fillColor = isProfit ? '#22c55e' : '#ef4444'

  const chartData = snapshots.map(s => ({
    date: s.date,
    value_usd: Number(s.value_usd),
    pnl_pct: Number(s.pnl_pct),
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={fillColor} stopOpacity={0.2} />
            <stop offset="95%" stopColor={fillColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickFormatter={v => v.slice(5)} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickFormatter={v => `$${(v / 1000).toFixed(1)}k`} width={52} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={costTotalUsd} stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={1} />
        <Area type="monotone" dataKey="value_usd" stroke={strokeColor} strokeWidth={2}
          fill="url(#curveGrad)" dot={false} activeDot={{ r: 4, fill: strokeColor }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
