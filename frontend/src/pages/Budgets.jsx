import { useState, useEffect } from 'react'
import {
  Plus, Edit2, Trash2, Loader2, X, AlertCircle,
  PiggyBank, Calendar, TrendingUp, TrendingDown,
} from 'lucide-react'
import { budgetsAPI, categoriesAPI } from '../services/api'

export default function Budgets() {
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [budgetStatus, setBudgetStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchBudgets()
    fetchBudgetStatus()
  }, [selectedMonth])

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.list()
      setCategories(response.data.results || response.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchBudgets = async () => {
    try {
      const response = await budgetsAPI.list({ month: selectedMonth })
      setBudgets(response.data.results || response.data)
    } catch (error) {
      console.error('Error fetching budgets:', error)
    }
  }

  const fetchBudgetStatus = async () => {
    setLoading(true)
    try {
      const response = await budgetsAPI.getStatus(selectedMonth)
      setBudgetStatus(response.data)
    } catch (error) {
      console.error('Error fetching budget status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await budgetsAPI.delete(id)
      setDeleteConfirm(null)
      fetchBudgets()
      fetchBudgetStatus()
    } catch (error) {
      console.error('Error deleting budget:', error)
    }
  }

  const getCategoryById = (id) => categories.find(c => c.id === id)

  const getStatusColor = (status) => {
    switch (status) {
      case 'exceeded':
        return 'text-rose-400 bg-rose-500/10'
      case 'warn':
        return 'text-amber-400 bg-amber-500/10'
      case 'ok':
        return 'text-emerald-400 bg-emerald-500/10'
      default:
        return 'text-slate-400 bg-slate-500/10'
    }
  }

  const getProgressColor = (status) => {
    switch (status) {
      case 'exceeded':
        return 'bg-rose-500'
      case 'warn':
        return 'bg-amber-500'
      default:
        return 'bg-emerald-500'
    }
  }

  const formatMonth = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  // Get month options for selector
  const monthOptions = []
  const now = new Date()
  for (let i = -3; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    monthOptions.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`,
      label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Budgets</h1>
          <p className="text-slate-400 mt-1">Track your spending limits</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-violet-500"
          >
            {monthOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-medium text-white hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/30"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Add Budget</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Overall Budget Card */}
          {budgetStatus?.overall && (
            <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-white/80">
                    <PiggyBank size={20} />
                    <span className="font-medium">Overall Budget - {formatMonth(selectedMonth)}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(budgetStatus.overall.status)}`}>
                    {budgetStatus.overall.status === 'exceeded' ? 'Over Budget' :
                     budgetStatus.overall.status === 'warn' ? 'Warning' : 'On Track'}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-white/60 text-sm">Budget</p>
                    <p className="text-2xl font-bold text-white">
                      ৳{parseFloat(budgetStatus.overall.budget_amount).toLocaleString('en-BD')}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Spent</p>
                    <p className="text-2xl font-bold text-white">
                      ৳{parseFloat(budgetStatus.overall.spent).toLocaleString('en-BD')}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Remaining</p>
                    <p className={`text-2xl font-bold ${parseFloat(budgetStatus.overall.remaining) < 0 ? 'text-rose-300' : 'text-white'}`}>
                      ৳{parseFloat(budgetStatus.overall.remaining).toLocaleString('en-BD')}
                    </p>
                  </div>
                </div>

                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getProgressColor(budgetStatus.overall.status)}`}
                    style={{ width: `${Math.min(parseFloat(budgetStatus.overall.percent_used) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-white/60 text-sm mt-2 text-right">
                  {(parseFloat(budgetStatus.overall.percent_used) * 100).toFixed(0)}% used
                </p>
              </div>
            </div>
          )}

          {!budgetStatus?.overall && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <PiggyBank size={32} className="text-slate-600" />
              </div>
              <p className="text-slate-400 mb-2">No overall budget set for {formatMonth(selectedMonth)}</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-violet-400 hover:text-violet-300 transition-colors"
              >
                Set your monthly budget
              </button>
            </div>
          )}

          {/* Category Budgets */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Category Budgets</h2>
            
            {budgetStatus?.categories?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {budgetStatus.categories.map((cat) => {
                  const category = getCategoryById(cat.category_id)
                  const percentUsed = parseFloat(cat.percent_used) * 100
                  
                  return (
                    <div
                      key={cat.budget_id}
                      className="bg-slate-900 rounded-xl border border-slate-800 p-5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category?.color_token || '#8b5cf6' }}
                          ></span>
                          <span className="font-medium text-white">{cat.category_name}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cat.status)}`}>
                          {cat.status === 'exceeded' ? 'Over' : cat.status === 'warn' ? 'Warning' : 'OK'}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between mb-2">
                        <span className="text-2xl font-bold text-white">
                          ৳{parseFloat(cat.spent).toFixed(0)}
                        </span>
                        <span className="text-slate-400">
                          of ৳{parseFloat(cat.budget_amount).toFixed(0)}
                        </span>
                      </div>

                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${getProgressColor(cat.status)}`}
                          style={{ width: `${Math.min(percentUsed, 100)}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between mt-2 text-sm">
                        <span className="text-slate-500">{percentUsed.toFixed(0)}% used</span>
                        <span className={parseFloat(cat.remaining) < 0 ? 'text-rose-400' : 'text-slate-400'}>
                          ৳{parseFloat(cat.remaining).toFixed(0)} left
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 text-center">
                <p className="text-slate-400">No category budgets set</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-2 text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Add category budget
                </button>
              </div>
            )}
          </div>

          {/* All Budgets List */}
          {budgets.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Manage Budgets</h2>
              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <div className="divide-y divide-slate-800">
                  {budgets.map((budget) => {
                    const category = budget.category ? getCategoryById(budget.category) : null
                    return (
                      <div key={budget.id} className="flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors">
                        <div>
                          <p className="font-medium text-white">
                            {budget.scope === 'overall' ? 'Overall Budget' : category?.name || 'Unknown Category'}
                          </p>
                          <p className="text-sm text-slate-500">
                            ৳{parseFloat(budget.amount).toLocaleString('en-BD')} • {formatMonth(budget.month)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingBudget(budget)}
                            className="p-2 text-slate-400 hover:text-violet-400 hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(budget.id)}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingBudget) && (
        <BudgetModal
          budget={editingBudget}
          categories={categories}
          selectedMonth={selectedMonth}
          onClose={() => {
            setShowAddModal(false)
            setEditingBudget(null)
          }}
          onSuccess={() => {
            setShowAddModal(false)
            setEditingBudget(null)
            fetchBudgets()
            fetchBudgetStatus()
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
            <h3 className="text-lg font-semibold text-white text-center mb-2">Delete Budget?</h3>
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

function BudgetModal({ budget, categories, selectedMonth, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    month: budget?.month || selectedMonth,
    scope: budget?.scope || 'overall',
    category: budget?.category || '',
    amount: budget?.amount || '',
    warn_threshold: budget?.warn_threshold || '0.8',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const data = {
        month: formData.month,
        scope: formData.scope,
        amount: parseFloat(formData.amount),
        warn_threshold: parseFloat(formData.warn_threshold),
      }
      if (formData.scope === 'category') {
        data.category = parseInt(formData.category)
      }

      if (budget) {
        await budgetsAPI.update(budget.id, data)
      } else {
        await budgetsAPI.create(data)
      }
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Failed to save budget')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-800 overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-white">
            {budget ? 'Edit Budget' : 'Add Budget'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm text-slate-400 mb-2">Budget Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, scope: 'overall', category: '' })}
                  className={`p-3 rounded-xl border transition-all ${
                    formData.scope === 'overall'
                      ? 'border-violet-500 bg-violet-500/10 text-white'
                      : 'border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  Overall Budget
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, scope: 'category' })}
                  className={`p-3 rounded-xl border transition-all ${
                    formData.scope === 'category'
                      ? 'border-violet-500 bg-violet-500/10 text-white'
                      : 'border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  Category Budget
                </button>
              </div>
            </div>

            {formData.scope === 'category' && (
              <div>
                <label className="block text-sm text-slate-400 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            )}

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
                  placeholder="0.00"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Warning Threshold ({(parseFloat(formData.warn_threshold) * 100).toFixed(0)}%)
              </label>
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={formData.warn_threshold}
                onChange={(e) => setFormData({ ...formData, warn_threshold: e.target.value })}
                className="w-full accent-violet-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Get warned when spending reaches this percentage
              </p>
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
              ) : budget ? (
                'Save Changes'
              ) : (
                'Create Budget'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
