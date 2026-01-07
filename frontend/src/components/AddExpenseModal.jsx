import { useState } from 'react'
import { X, Loader2, Utensils, ShoppingBag, Car, Home, Zap, Coffee, Briefcase, Heart, Gamepad2, GraduationCap, Plane, Gift, Wallet } from 'lucide-react'
import { expensesAPI } from '../services/api'

const iconMap = {
  utensils: Utensils,
  'shopping-bag': ShoppingBag,
  car: Car,
  home: Home,
  zap: Zap,
  coffee: Coffee,
  briefcase: Briefcase,
  heart: Heart,
  gamepad: Gamepad2,
  graduation: GraduationCap,
  plane: Plane,
  gift: Gift,
}

const getIcon = (iconName) => iconMap[iconName] || Wallet

export default function AddExpenseModal({ categories, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: categories[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    merchant: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.description || !formData.amount) return

    setLoading(true)
    setError('')

    try {
      const payload = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        date: formData.date,
      }
      // Only include category if selected
      if (formData.category) {
        payload.category = formData.category
      }
      if (formData.merchant) {
        payload.merchant = formData.merchant
      }
      if (formData.notes) {
        payload.notes = formData.notes
      }
      
      await expensesAPI.create(payload)
      onSuccess()
    } catch (err) {
      const data = err.response?.data
      if (data) {
        // Handle field-level errors
        const errors = Object.entries(data)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join('; ')
        setError(errors || 'Failed to add expense')
      } else {
        setError('Failed to add expense')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-800 overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-white">Add Expense</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm text-slate-400 mb-2">Description *</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What did you spend on?"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Amount *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">৳</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Category</label>
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {categories.map((cat) => {
                  const IconComponent = getIcon(cat.icon)
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat.id })}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                        formData.category === cat.id
                          ? 'border-violet-500 bg-violet-500/10'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <IconComponent size={20} style={{ color: cat.color_token || '#8b5cf6' }} />
                      <span className="text-xs text-slate-300 truncate w-full text-center">
                        {cat.name.split(' ')[0]}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Merchant (optional)</label>
              <input
                type="text"
                value={formData.merchant}
                onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                placeholder="Store or vendor name"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Notes (optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional details..."
                rows={2}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors resize-none"
              />
            </div>
          </div>

          <div className="p-5 border-t border-slate-800">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Expense'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
