import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card px-3 py-2 text-sm shadow-xl">
        <p className="text-gray-400 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }} className="font-medium">
            {p.name === 'new' ? '🆕 New' : '⭐ Returning'}: {p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function NewVsReturningChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="#22223b" vertical={false} />
        <XAxis
          dataKey="period"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={30}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#22223b' }} />
        <Legend
          formatter={(v) => (
            <span className="text-xs text-gray-400">{v === 'new' ? 'New' : 'Returning'}</span>
          )}
        />
        <Bar dataKey="new"       fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={24} />
        <Bar dataKey="returning" fill="#db2777" radius={[4, 4, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  )
}
