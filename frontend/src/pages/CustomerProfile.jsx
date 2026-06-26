import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { customersAPI } from '../api/customers'
import { SegmentBadge, CategoryBadge, PaymentBadge } from '../components/ui/Badge'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { ArrowLeft, Phone, Mail, MapPin, Star, ShoppingBag, FileText } from 'lucide-react'
import { format } from 'date-fns'

export default function CustomerProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    customersAPI.getById(id)
      .then(setCustomer)
      .catch(() => navigate('/customers'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <PageLoader />
  if (!customer) return null

  const purchases = customer.purchases || []
  const totalSpending = customer.total_spending || 0

  return (
    <div className="max-w-4xl space-y-5 animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate('/customers')} className="flex items-center gap-2 text-gray-400 hover:text-gray-200 text-sm transition-colors">
        <ArrowLeft size={16} /> Back to Customers
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Customer card */}
        <div className="glass-card p-6 md:col-span-1 space-y-5">
          {/* Avatar */}
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 flex items-center justify-center text-3xl font-bold text-white shadow-xl mb-3">
              {customer.name[0].toUpperCase()}
            </div>
            <h2 className="font-display font-bold text-white text-xl">{customer.name}</h2>
            <SegmentBadge segment={customer.segment} />
          </div>

          {/* Details */}
          <div className="space-y-3 pt-2 border-t border-dark-500">
            {customer.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Phone size={14} className="text-brand-500 flex-shrink-0" />
                {customer.phone}
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-2 text-sm text-gray-400 break-all">
                <Mail size={14} className="text-brand-500 flex-shrink-0" />
                {customer.email}
              </div>
            )}
            {customer.address && (
              <div className="flex items-start gap-2 text-sm text-gray-400">
                <MapPin size={14} className="text-brand-500 flex-shrink-0 mt-0.5" />
                {customer.address}
              </div>
            )}
            {customer.style_preferences && (
              <div className="flex items-start gap-2 text-sm text-gray-400">
                <Star size={14} className="text-gold-500 flex-shrink-0 mt-0.5" />
                {customer.style_preferences}
              </div>
            )}
            {customer.notes && (
              <div className="flex items-start gap-2 text-sm text-gray-400">
                <FileText size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                {customer.notes}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-dark-500">
            <div className="glass-card p-3 text-center stat-gradient-pink">
              <p className="text-xs text-gray-400 mb-1">Total Spent</p>
              <p className="font-display font-bold text-brand-400 text-lg">
                ₹{Number(totalSpending).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="glass-card p-3 text-center stat-gradient-blue">
              <p className="text-xs text-gray-400 mb-1">Purchases</p>
              <p className="font-display font-bold text-blue-400 text-lg">{purchases.length}</p>
            </div>
          </div>

          <p className="text-xs text-gray-600 text-center">
            Customer since {customer.created_at ? format(new Date(customer.created_at), 'MMM yyyy') : '—'}
          </p>
        </div>

        {/* Purchase history */}
        <div className="glass-card p-5 md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag size={18} className="text-brand-500" />
            <h3 className="font-display font-semibold text-white">Purchase History</h3>
            <span className="ml-auto text-xs text-gray-500">{purchases.length} records</span>
          </div>

          {purchases.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag size={36} className="text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No purchases yet</p>
            </div>
          ) : (
            <div className="relative pl-4">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-dark-500" />

              <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2">
                {purchases.map((p, i) => (
                  <div key={p.id} className="relative pl-6">
                    {/* Dot */}
                    <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-brand-600 border-2 border-dark-700 -translate-x-[5px]" />

                    <div className="glass-card p-3.5 hover:border-dark-400 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-gray-100 text-sm">{p.item_name}</p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {p.category && <CategoryBadge category={p.category} />}
                            {p.payment_method && <PaymentBadge method={p.payment_method} />}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-display font-bold text-gold-400">
                            ₹{Number(p.amount).toLocaleString('en-IN')}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {p.purchase_date ? format(new Date(p.purchase_date), 'd MMM yyyy') : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
