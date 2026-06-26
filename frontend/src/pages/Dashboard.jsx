import { useEffect, useState } from 'react'
import { analyticsAPI } from '../api/analytics'
import StatCard from '../components/ui/StatCard'
import RevenueChart from '../components/charts/RevenueChart'
import NewVsReturningChart from '../components/charts/NewVsReturning'
import CategoryChart from '../components/charts/CategoryChart'
import { SegmentBadge } from '../components/ui/Badge'
import { PageLoader } from '../components/ui/LoadingSpinner'
import {
  IndianRupee, Users, ShoppingBag, TrendingUp, Crown, Sparkles, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const [stats, setStats]     = useState(null)
  const [trend, setTrend]     = useState([])
  const [nvr, setNvr]         = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      analyticsAPI.dashboard(),
      analyticsAPI.revenueTrend(),
      analyticsAPI.newVsReturning(),
    ]).then(([d, t, n]) => {
      setStats(d)
      setTrend(t)
      setNvr(n)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`

  return (
    <div className="space-y-6 max-w-screen-xl">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Repeat Customer Rate"
          value={`${stats?.repeat_customer_rate || 0}%`}
          icon={Users}
          gradient="stat-gradient-pink"
          trend={stats?.monthly_growth}
        />
        <StatCard
          title="Average Order Value"
          value={fmt(stats?.average_order_value || 0)}
          icon={IndianRupee}
          gradient="stat-gradient-gold"
          trend={stats?.monthly_growth}
        />
        <StatCard
          title="New Customers"
          value={stats?.new_customer_count || 0}
          icon={Sparkles}
          gradient="stat-gradient-blue"
        />
        <StatCard
          title="Returning Customers"
          value={stats?.returning_customer_count || 0}
          icon={Crown}
          gradient="stat-gradient-green"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="font-display font-semibold text-white mb-4">Revenue Trend</h3>
          {trend.length > 0 ? <RevenueChart data={trend} /> : (
            <p className="text-gray-500 text-sm text-center py-16">No revenue data yet</p>
          )}
        </div>
        <div className="glass-card p-5">
          <h3 className="font-display font-semibold text-white mb-4">New vs Returning Customers</h3>
          {nvr.length > 0 ? <NewVsReturningChart data={nvr} /> : (
            <p className="text-gray-500 text-sm text-center py-16">No data yet</p>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top customers */}
        <div className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Crown size={18} className="text-gold-400" />
            <h3 className="font-display font-semibold text-white">Top Customers</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-500">
                  <th className="th">Name</th>
                  <th className="th">Spending</th>
                  <th className="th hidden sm:table-cell">Purchases</th>
                  <th className="th">Segment</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.top_customers || []).map((c, i) => (
                  <tr
                    key={c.id}
                    className="table-row cursor-pointer"
                    onClick={() => navigate(`/customers/${c.id}`)}
                  >
                    <td className="td">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 text-xs w-4">{i + 1}</span>
                        <span className="font-medium text-gray-100">{c.name}</span>
                      </div>
                    </td>
                    <td className="td text-gold-400 font-semibold">
                      ₹{Number(c.total_spending).toLocaleString('en-IN')}
                    </td>
                    <td className="td hidden sm:table-cell text-gray-400">{c.purchase_count}</td>
                    <td className="td"><SegmentBadge segment={c.segment} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Categories + repeat rate */}
        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="font-display font-semibold text-white mb-1">Popular Categories</h3>
            <CategoryChart data={stats?.popular_categories || []} />
          </div>
          <div className="glass-card p-5 stat-gradient-gold">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Repeat Customer Rate</p>
            <p className="text-3xl font-display font-bold text-gold-400">
              {stats?.repeat_customer_rate || 0}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Customers with 2+ purchases</p>
          </div>
        </div>
      </div>
    </div>
  )
}
