import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const COLORS = ['#db2777', '#f59e0b', '#2563eb', '#059669', '#7c3aed', '#dc2626', '#0891b2', '#ca8a04']

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    const d = payload[0].payload
    return (
      <div className="glass-card px-3 py-2 text-sm shadow-xl">
        <p className="text-gray-300 font-medium">{d.category}</p>
        <p className="text-gray-400">{d.count} purchases</p>
      </div>
    )
  }
  return null
}

export default function CategoryChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="count"
          nameKey="category"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(v) => <span className="text-xs text-gray-400">{v}</span>}
          iconType="circle"
          iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
