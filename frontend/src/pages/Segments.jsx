import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyticsAPI } from '../api/analytics'
import { customersAPI } from '../api/customers'
import { SegmentBadge } from '../components/ui/Badge'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { Crown, Star, Sparkles, Users, IndianRupee, Download } from 'lucide-react'
import toast from 'react-hot-toast'

const SEGMENT_CONFIG = {
  VIP:     { icon: Crown,    color: 'text-gold-400',  border: 'border-gold-500/30',  bg: 'bg-gold-500/10',  desc: 'Top 10% by spending' },
  Regular: { icon: Star,     color: 'text-brand-400', border: 'border-brand-500/30', bg: 'bg-brand-500/10', desc: '2 or more purchases' },
  New:     { icon: Sparkles, color: 'text-blue-400',  border: 'border-blue-500/30',  bg: 'bg-blue-500/10',  desc: 'First purchase only' },
}

export default function Segments() {
  const navigate = useNavigate()
  const [segmentStats, setSegmentStats] = useState([])
  const [customers, setCustomers]       = useState([])
  const [activeSegment, setActive]      = useState('VIP')
  const [loading, setLoading]           = useState(true)
  const [custLoading, setCustLoading]   = useState(false)

  useEffect(() => {
    analyticsAPI.segments().then(setSegmentStats).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setCustLoading(true)
    customersAPI.list({ segment: activeSegment, page_size: 50 })
      .then((r) => setCustomers(r.data))
      .finally(() => setCustLoading(false))
  }, [activeSegment])

  const handleExport = () => {
    customersAPI.exportCSV({ segment: activeSegment })
    toast.success(`Downloading ${activeSegment} customers CSV…`)
  }

  if (loading) return <PageLoader />

  const total = segmentStats.reduce((s, r) => s + r.count, 0) || 1

  return (
    <div className="space-y-6 max-w-screen-xl animate-fade-in">
      {/* Segment Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {segmentStats.map((s) => {
          const cfg = SEGMENT_CONFIG[s.segment] || {}
          const Icon = cfg.icon || Users
          const pct = Math.round((s.count / total) * 100)
          return (
            <button
              key={s.segment}
              onClick={() => setActive(s.segment)}
              className={`glass-card p-5 text-left transition-all duration-200 hover:scale-[1.02]
                ${activeSegment === s.segment ? `border-2 ${cfg.border}` : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center mb-3`}>
                <Icon size={20} className={cfg.color} />
              </div>
              <p className="font-display font-bold text-2xl text-white">{s.count}</p>
              <p className={`font-semibold text-sm ${cfg.color} mb-0.5`}>{s.segment} Customers</p>
              <p className="text-xs text-gray-500">{cfg.desc}</p>
              <div className="mt-3 h-1.5 bg-dark-500 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: s.segment === 'VIP' ? '#f59e0b' : s.segment === 'Regular' ? '#db2777' : '#2563eb'
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{pct}% of total customers</p>
              <p className="text-xs text-gold-400 mt-2 font-medium">
                Revenue: ₹{Number(s.revenue).toLocaleString('en-IN')}
              </p>
            </button>
          )
        })}
      </div>

      {/* Segment customer list */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-dark-500">
          <div className="flex items-center gap-2">
            <SegmentBadge segment={activeSegment} />
            <span className="text-gray-400 text-sm">Customers</span>
          </div>
          <button onClick={handleExport} className="btn-secondary text-sm py-1.5">
            <Download size={14} /> Export
          </button>
        </div>

        {custLoading ? (
          <PageLoader />
        ) : customers.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">No customers in this segment</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-dark-500 bg-dark-800/50">
                <tr>
                  <th className="th">Name</th>
                  <th className="th hidden sm:table-cell">Phone</th>
                  <th className="th hidden md:table-cell">Email</th>
                  <th className="th">Total Spent</th>
                  <th className="th hidden lg:table-cell">Purchases</th>
                  <th className="th text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="table-row cursor-pointer" onClick={() => navigate(`/customers/${c.id}`)}>
                    <td className="td">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {c.name[0].toUpperCase()}
                        </div>
                        <span className="font-medium">{c.name}</span>
                      </div>
                    </td>
                    <td className="td hidden sm:table-cell text-gray-400 text-sm">{c.phone || '—'}</td>
                    <td className="td hidden md:table-cell text-gray-400 text-xs">{c.email || '—'}</td>
                    <td className="td text-gold-400 font-semibold">
                      ₹{Number(c.total_spending || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="td hidden lg:table-cell text-gray-400">{c.purchase_count || 0}</td>
                    <td className="td text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/customers/${c.id}`) }}
                        className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
