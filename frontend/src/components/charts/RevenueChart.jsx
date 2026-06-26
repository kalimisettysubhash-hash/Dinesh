import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card px-3 py-2 text-sm shadow-xl">
        <p className="text-gray-400 mb-1">{label}</p>
        <p className="text-brand-400 font-semibold">
          ₹{Number(payload[0].value).toLocaleString('en-IN')}
        </p>
      </div>
    )
  }
  return null
}

export default function RevenueChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#db2777" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#db2777" stopOpacity={0} />
          </linearGradient>
        </defs>
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
          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3d3d5c' }} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#db2777"
          strokeWidth={2.5}
          fill="url(#revenueGrad)"
          dot={false}
          activeDot={{ r: 5, fill: '#db2777', stroke: '#0b0b14', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
