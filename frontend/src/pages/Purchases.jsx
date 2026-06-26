import { useEffect, useState, useCallback } from 'react'
import { purchasesAPI } from '../api/purchases'
import { customersAPI } from '../api/customers'
import { CategoryBadge, PaymentBadge } from '../components/ui/Badge'
import Pagination from '../components/ui/Pagination'
import Modal from '../components/ui/Modal'
import { PageLoader, EmptyState } from '../components/ui/LoadingSpinner'
import { Plus, Pencil, Trash2, ShoppingBag, Filter } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const CATEGORIES = ['Sarees', 'Lehengas', 'Kurtis', 'Blouses', 'Jewellery', 'Accessories', 'Suits', 'Other']
const PAYMENT_METHODS = ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Net Banking']

const EMPTY_FORM = {
  customer_id: '', purchase_date: '', item_name: '', category: '', amount: '', payment_method: ''
}

export default function Purchases() {
  const [data, setData] = useState({ data: [], total: 0, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [amountMin, setAmtMin] = useState('')
  const [amountMax, setAmtMax] = useState('')
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [customers, setCustomers] = useState([])

  useEffect(() => {
    customersAPI.list({ page_size: 100 })
      .then((r) => setCustomers(r.data))
      .catch(() => toast.error('Failed to load customers list'))
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, page_size: 15 }
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
      if (amountMin) params.amount_min = amountMin
      if (amountMax) params.amount_max = amountMax
      const res = await purchasesAPI.list(params)
      setData(res)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to load purchases')
    } finally {
      setLoading(false)
    }
  }, [page, dateFrom, dateTo, amountMin, amountMax])

  useEffect(() => { fetchData() }, [fetchData])

  const openAdd = () => {
    setForm({ ...EMPTY_FORM, purchase_date: format(new Date(), 'yyyy-MM-dd') })
    setSelected(null); setModal('add')
  }
  const openEdit = (p) => {
    setForm({
      customer_id: p.customer_id, purchase_date: p.purchase_date,
      item_name: p.item_name, category: p.category || '',
      amount: String(p.amount), payment_method: p.payment_method || ''
    })
    setSelected(p); setModal('edit')
  }
  const openDelete = (p) => { setSelected(p); setModal('delete') }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.customer_id) { toast.error('Select a customer'); return }
    if (!form.item_name) { toast.error('Item name is required'); return }
    if (!form.amount) { toast.error('Amount is required'); return }
    setSaving(true)
    try {
      const payload = { ...form, amount: parseFloat(form.amount) }
      if (modal === 'add') {
        await purchasesAPI.create(payload)
        toast.success('Purchase added!')
      } else {
        await purchasesAPI.update(selected.id, payload)
        toast.success('Purchase updated')
      }
      setModal(null); fetchData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error saving purchase')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await purchasesAPI.delete(selected.id)
      toast.success('Purchase deleted')
      setModal(null);
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete')
    }
    finally { setSaving(false) }
  }

  const Field = ({ label, id, ...props }) => (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {props.as === 'select' ? (
        <select id={id} className="input-field" value={props.value} onChange={props.onChange}>
          {props.children}
        </select>
      ) : (
        <input id={id} className="input-field" {...props} />
      )}
    </div>
  )

  return (
    <div className="space-y-5 max-w-screen-xl">
      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3 text-gray-400">
          <Filter size={15} /> <span className="text-sm font-medium">Filters</span>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="label">From Date</label>
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} className="input-field py-2 text-sm" />
          </div>
          <div>
            <label className="label">To Date</label>
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} className="input-field py-2 text-sm" />
          </div>
          <div>
            <label className="label">Min Amount (₹)</label>
            <input type="number" value={amountMin} onChange={(e) => { setAmtMin(e.target.value); setPage(1) }} placeholder="0" className="input-field py-2 text-sm w-32" />
          </div>
          <div>
            <label className="label">Max Amount (₹)</label>
            <input type="number" value={amountMax} onChange={(e) => { setAmtMax(e.target.value); setPage(1) }} placeholder="∞" className="input-field py-2 text-sm w-32" />
          </div>
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); setAmtMin(''); setAmtMax(''); setPage(1) }}
            className="btn-secondary text-sm py-2"
          >Clear</button>
          <button onClick={openAdd} className="btn-primary text-sm py-2 ml-auto">
            <Plus size={15} /> Add Purchase
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? <PageLoader /> : data.data.length === 0 ? (
            <EmptyState message="No purchases found" icon={ShoppingBag} />
          ) : (
            <table className="w-full">
              <thead className="border-b border-dark-500 bg-dark-800/50">
                <tr>
                  <th className="th">Customer</th>
                  <th className="th">Item</th>
                  <th className="th hidden sm:table-cell">Category</th>
                  <th className="th">Amount</th>
                  <th className="th hidden md:table-cell">Payment</th>
                  <th className="th hidden lg:table-cell">Date</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((p) => (
                  <tr key={p.id} className="table-row">
                    <td className="td font-medium text-gray-200">{p.customer_name || '—'}</td>
                    <td className="td text-gray-300">{p.item_name}</td>
                    <td className="td hidden sm:table-cell">
                      {p.category ? <CategoryBadge category={p.category} /> : '—'}
                    </td>
                    <td className="td text-gold-400 font-semibold">
                      ₹{Number(p.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="td hidden md:table-cell">
                      {p.payment_method ? <PaymentBadge method={p.payment_method} /> : '—'}
                    </td>
                    <td className="td hidden lg:table-cell text-gray-400 text-xs">
                      {p.purchase_date ? format(new Date(p.purchase_date), 'd MMM yyyy') : '—'}
                    </td>
                    <td className="td">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-dark-500 text-gray-400 hover:text-brand-400 transition-colors"><Pencil size={15} /></button>
                        <button onClick={() => openDelete(p)} className="p-1.5 rounded-lg hover:bg-red-600/20 text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!loading && data.pages > 1 && (
          <div className="px-4 py-3 border-t border-dark-500 flex items-center justify-between">
            <p className="text-xs text-gray-500">{data.total} purchases total</p>
            <Pagination page={page} pages={data.pages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal isOpen={modal === 'add' || modal === 'edit'} onClose={() => setModal(null)} title={modal === 'add' ? 'Add Purchase' : 'Edit Purchase'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Customer *</label>
            <select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} className="input-field">
              <option value="">— Select customer —</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <Field label="Item Name *" id="p-item" value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} placeholder="Banarasi Silk Saree" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
                <option value="">— None —</option>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <Field label="Amount (₹) *" id="p-amount" type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="5000" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" id="p-date" type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} />
            <div>
              <label className="label">Payment Method</label>
              <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="input-field">
                <option value="">— None —</option>
                {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? 'Saving…' : modal === 'add' ? 'Add Purchase' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={modal === 'delete'} onClose={() => setModal(null)} title="Delete Purchase" size="sm">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-600/20 flex items-center justify-center mx-auto">
            <Trash2 size={24} className="text-red-400" />
          </div>
          <p className="text-gray-300">Delete purchase <strong className="text-white">{selected?.item_name}</strong>?</p>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={handleDelete} disabled={saving} className="btn-danger flex-1 justify-center">
              {saving ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
