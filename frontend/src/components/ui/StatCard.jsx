export default function StatCard({ title, value, icon: Icon, trend, gradient = 'stat-gradient-pink', suffix = '', prefix = '' }) {
  return (
    <div className={`glass-card p-5 ${gradient} animate-slide-up`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{title}</p>
          <p className="text-2xl font-display font-bold text-white mt-1">
            {prefix}{typeof value === 'number' ? value.toLocaleString('en-IN') : value}{suffix}
          </p>
          {trend !== undefined && (
            <p className={`text-xs mt-1.5 font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-white/5">
            <Icon size={22} className="text-gray-300" />
          </div>
        )}
      </div>
    </div>
  )
}
