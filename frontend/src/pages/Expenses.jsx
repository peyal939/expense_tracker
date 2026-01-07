import { useState, useEffect } from 'react'
import {
  Plus, Search, Filter, Edit2, Trash2, Loader2, Calendar,
  ChevronLeft, ChevronRight, X, AlertCircle,
  Utensils, ShoppingBag, Car, Home, Zap, Coffee, Briefcase, Heart, Gamepad2, GraduationCap, Plane, Gift, Wallet,
} from 'lucide-react'
import { expensesAPI, categoriesAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useOnboarding } from '../context/OnboardingContext'
import AddExpenseModal from '../components/AddExpenseModal'

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

export default function Expenses() {
  const { isAdmin } = useAuth()
  const { incrementExpenseCount } = useOnboarding()
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    date_from: '',
    date_to: '',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, total: 0, pageSize: 20 })

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchExpenses()
  }, [filters, pagination.page])

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.list()
      const data = response.data?.results ?? response.data
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const params = {
        ordering: '-date',
        page: pagination.page,
        page_size: pagination.pageSize,
      }
      if (filters.search) params.search = filters.search
      if (filters.category) params.category = filters.category
      if (filters.date_from) params.date_from = filters.date_from
      if (filters.date_to) params.date_to = filters.date_to

      const response = await expensesAPI.list(params)
      const expensesData = response.data?.results ?? response.data
      setExpenses(Array.isArray(expensesData) ? expensesData : [])
      setPagination(prev => ({
        ...prev,
        total: response.data.count || response.data.length,
      }))
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await expensesAPI.delete(id)
      setDeleteConfirm(null)
      fetchExpenses()
    } catch (error) {
      console.error('Error deleting expense:', error)
    }
  }

  const getCategoryById = (id) => categories.find(c => c.id === id)

  const totalPages = Math.ceil(pagination.total / pagination.pageSize)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Expenses</h1>
          <p className="text-slate-400 mt-1">Manage your transactions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-medium text-white hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/30"
        >
          <Plus size={20} />
          Add Expense
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search expenses..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors ${
              showFilters ? 'bg-violet-600 border-violet-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Filter size={18} />
            Filters
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-violet-500"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">From Date</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">To Date</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Expenses List */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet size={32} className="text-slate-600" />
            </div>
            <p className="text-slate-400">No expenses found</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-4 py-2 text-violet-400 hover:text-violet-300 transition-colors"
            >
              Add your first expense
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Description</th>
                    <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Category</th>
                    <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Date</th>
                    <th className="text-right text-sm font-medium text-slate-400 px-6 py-4">Amount</th>
                    <th className="text-right text-sm font-medium text-slate-400 px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {expenses.map((expense) => {
                    const category = getCategoryById(expense.category)
                    const IconComponent = category ? getIcon(category.icon) : Wallet
                    const color = category?.color_token || '#8b5cf6'
                    
                    return (
                      <tr key={expense.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${color}20` }}
                            >
                              <IconComponent size={18} style={{ color }} />
                            </div>
                            <div>
                              <p className="font-medium text-white">{expense.description}</p>
                              {expense.merchant && (
                                <p className="text-sm text-slate-500">{expense.merchant}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-300">{category?.name || 'Uncategorized'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-400">{expense.date}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-semibold text-white">
                            ৳{parseFloat(expense.amount).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingExpense(expense)}
                              className="p-2 text-slate-400 hover:text-violet-400 hover:bg-slate-800 rounded-lg transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(expense.id)}
                              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile List */}
            <div className="md:hidden divide-y divide-slate-800">
              {expenses.map((expense) => {
                const category = getCategoryById(expense.category)
                const IconComponent = category ? getIcon(category.icon) : Wallet
                const color = category?.color_token || '#8b5cf6'
                
                return (
                  <div key={expense.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${color}20` }}
                        >
                          <IconComponent size={18} style={{ color }} />
                        </div>
                        <div>
                          <p className="font-medium text-white">{expense.description}</p>
                          <p className="text-sm text-slate-500">{category?.name || 'Uncategorized'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">
                          ৳{parseFloat(expense.amount).toFixed(2)}
                        </p>
                        <p className="text-sm text-slate-500">{expense.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-3">
                      <button
                        onClick={() => setEditingExpense(expense)}
                        className="px-3 py-1.5 text-sm text-violet-400 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(expense.id)}
                        className="px-3 py-1.5 text-sm text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-800">
            <p className="text-sm text-slate-400">
              Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-3 py-1 text-sm text-slate-300">
                {pagination.page} / {totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= totalPages}
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <AddExpenseModal
          categories={categories}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchExpenses()
            incrementExpenseCount()
          }}
        />
      )}

      {/* Edit Expense Modal */}
      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          categories={categories}
          onClose={() => setEditingExpense(null)}
          onSuccess={() => {
            setEditingExpense(null)
            fetchExpenses()
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl w-full max-w-sm border border-slate-800 p-6 animate-slide-up">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={24} className="text-rose-400" />
            </div>
            <h3 className="text-lg font-semibold text-white text-center mb-2">Delete Expense?</h3>
            <p className="text-slate-400 text-center mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 bg-slate-800 rounded-xl font-medium text-white hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 bg-rose-600 rounded-xl font-medium text-white hover:bg-rose-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Edit Expense Modal Component
function EditExpenseModal({ expense, categories, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    description: expense.description,
    amount: expense.amount,
    category: expense.category || '',
    date: expense.date,
    merchant: expense.merchant || '',
    notes: expense.notes || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        date: formData.date,
      }
      if (formData.category) {
        payload.category = formData.category
      }
      if (formData.merchant) {
        payload.merchant = formData.merchant
      }
      if (formData.notes) {
        payload.notes = formData.notes
      }
      
      await expensesAPI.update(expense.id, payload)
      onSuccess()
    } catch (err) {
      const data = err.response?.data
      if (data) {
        const errors = Object.entries(data)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join('; ')
        setError(errors || 'Failed to update expense')
      } else {
        setError('Failed to update expense')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-800 overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-white">Edit Expense</h3>
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
              <label className="block text-sm text-slate-400 mb-2">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">৳</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
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
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
              >
                <option value="">No Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Merchant</label>
              <input
                type="text"
                value={formData.merchant}
                onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors resize-none"
              />
            </div>
          </div>

          <div className="p-5 border-t border-slate-800">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
