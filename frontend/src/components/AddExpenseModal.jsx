import { useState, useEffect } from 'react'
import { 
  X, Loader2, Utensils, ShoppingBag, Car, Home, Zap, Coffee, Briefcase, Heart, 
  Gamepad2, GraduationCap, Plane, Gift, Wallet, AlertCircle, Hospital, Shield, 
  Smartphone, Dumbbell, Trees, Sparkles, Tag 
} from 'lucide-react'
import { expensesAPI, budgetsAPI } from '../services/api'

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
  hospital: Hospital,
  shield: Shield,
  smartphone: Smartphone,
  dumbbell: Dumbbell,
  trees: Trees,
  sparkles: Sparkles,
}

// Map category names to contextual icons
const getCategoryIcon = (category) => {
  const name = category.name.toLowerCase()
  if (name.includes('food') || name.includes('dining')) return Utensils
  if (name.includes('transport')) return Car
  if (name.includes('shop')) return ShoppingBag
  if (name.includes('entertain') || name.includes('game')) return Gamepad2
  if (name.includes('bill') || name.includes('utilit')) return Zap
  if (name.includes('health') || name.includes('medical')) return Hospital
  if (name.includes('educat') || name.includes('school')) return GraduationCap
  if (name.includes('travel') || name.includes('flight')) return Plane
  if (name.includes('grocer')) return Trees
  if (name.includes('personal') || name.includes('care')) return Sparkles
  if (name.includes('home') || name.includes('garden')) return Home
  if (name.includes('gift') || name.includes('donat')) return Gift
  if (name.includes('insurance')) return Shield
  if (name.includes('subscription')) return Smartphone
  if (name.includes('fitness') || name.includes('gym')) return Dumbbell
  
  // Fallback to icon field if present
  if (category.icon && iconMap[category.icon]) return iconMap[category.icon]
  return Wallet
}

export default function AddExpenseModal({ categories, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    merchant: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [allocatedCategoryIds, setAllocatedCategoryIds] = useState(null)
  const [loadingAllocations, setLoadingAllocations] = useState(true)

  // Fetch allocated categories on mount
  useEffect(() => {
    fetchAllocatedCategories()
  }, [])

  const fetchAllocatedCategories = async () => {
    try {
      const now = new Date()
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      const response = await budgetsAPI.allocations.getAllocatedCategories(month)
      setAllocatedCategoryIds(response.data.category_ids || [])
    } catch (error) {
      console.error('Error fetching allocated categories:', error)
      // On error, allow all categories
      setAllocatedCategoryIds(null)
    } finally {
      setLoadingAllocations(false)
    }
  }

  // Filter categories to only show allocated ones (if allocations exist)
  const displayCategories = allocatedCategoryIds && allocatedCategoryIds.length > 0
    ? categories.filter(cat => allocatedCategoryIds.includes(cat.id))
    : categories

  // Set default category when allocations are loaded
  useEffect(() => {
    if (!loadingAllocations && displayCategories.length > 0 && !formData.category) {
      setFormData(prev => ({ ...prev, category: displayCategories[0].id }))
    }
  }, [loadingAllocations, displayCategories])

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
      
      const response = await expensesAPI.create(payload)
      
      // Pass the created expense data back, including category name
      const categoryName = categories.find(c => c.id === formData.category)?.name
      onSuccess({
        ...response.data,
        category_name: categoryName,
      })
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 z-50">
      <div className="bg-slate-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md border border-slate-800 overflow-hidden animate-slide-up max-h-[90vh] sm:max-h-[85vh]">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <h3 className="text-base sm:text-lg font-semibold text-white">Add Expense</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm text-slate-400 mb-1.5 sm:mb-2">Description *</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What did you spend on?"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors text-base"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5 sm:mb-2">Amount *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">৳</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors text-base"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1.5 sm:mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors text-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5 sm:mb-2">Category</label>
              {loadingAllocations ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 size={20} className="animate-spin text-violet-500" />
                </div>
              ) : displayCategories.length === 0 ? (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <div className="flex items-center gap-2 text-amber-400 mb-2">
                    <AlertCircle size={16} />
                    <span className="text-sm font-medium">No allocated categories</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Please set up budget allocations first to track expenses against your budget.
                  </p>
                </div>
              ) : (
                <>
                  {allocatedCategoryIds && allocatedCategoryIds.length > 0 && (
                    <p className="text-xs text-slate-500 mb-2">
                      Showing categories with budget allocations only
                    </p>
                  )}
                  <div className="grid grid-cols-3 gap-2 max-h-32 sm:max-h-40 overflow-y-auto">
                    {displayCategories.map((cat) => {
                      const IconComponent = getCategoryIcon(cat)
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: cat.id })}
                          className={`flex flex-col items-center gap-1 p-2 sm:p-3 rounded-xl border transition-all ${
                            formData.category === cat.id
                              ? 'border-violet-500 bg-violet-500/10'
                              : 'border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          <IconComponent size={18} className="sm:w-5 sm:h-5" style={{ color: cat.color_token || '#8b5cf6' }} />
                          <span className="text-[10px] sm:text-xs text-slate-300 truncate w-full text-center">
                            {cat.name.split(' ')[0]}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5 sm:mb-2">Merchant (optional)</label>
              <input
                type="text"
                value={formData.merchant}
                onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                placeholder="Store or vendor name"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors text-base"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5 sm:mb-2">Notes (optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional details..."
                rows={2}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors resize-none text-base"
              />
            </div>
          </div>

          <div className="p-4 sm:p-5 border-t border-slate-800 sticky bottom-0 bg-slate-900">
            <button
              type="submit"
              disabled={loading || displayCategories.length === 0}
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
