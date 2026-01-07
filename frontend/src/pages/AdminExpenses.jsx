import { useState, useEffect } from 'react'
import {
  Loader2, Search, Filter, Download, Calendar,
  DollarSign, Users, Receipt, ChevronLeft, ChevronRight,
  Eye, X, Tag,
} from 'lucide-react'
import { adminPanelAPI } from '../services/api'

export default function AdminExpenses() {
  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState(null)
  
  const [filters, setFilters] = useState({
    search: '',
    start: '',
    end: '',
    min_amount: '',
    max_amount: '',
    user_id: '',
    category_id: '',
  })

  useEffect(() => {
    fetchExpenses()
    fetchSummary()
  }, [page])

  const fetchExpenses = async () => {
    setLoading(true)
    try {
      const params = { page, ...filters }
      // Remove empty params
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key]
      })
      
      const response = await adminPanelAPI.expenses.list(params)
      setExpenses(response.data.results || response.data)
      if (response.data.count) {
        setTotalPages(Math.ceil(response.data.count / 20))
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async () => {
    try {
      const response = await adminPanelAPI.expenses.getSummary(filters)
      setSummary(response.data)
    } catch (error) {
      console.error('Error fetching summary:', error)
    }
  }

  const handleFilter = () => {
    setPage(1)
    fetchExpenses()
    fetchSummary()
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      start: '',
      end: '',
      min_amount: '',
      max_amount: '',
      user_id: '',
      category_id: '',
    })
    setPage(1)
    fetchExpenses()
    fetchSummary()
  }

  const handleExport = async () => {
    try {
      const response = await adminPanelAPI.exportExpenses(filters)
      // Create downloadable JSON
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `expenses_export_${new Date().toISOString().split('T')[0]}.json`
      a.click()
    } catch (error) {
      console.error('Error exporting:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">All Expenses</h1>
          <p className="text-slate-400 mt-1">View all expenses across all users</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
              showFilters 
                ? 'bg-violet-600 text-white' 
                : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
          >
            <Filter size={18} />
            Filters
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-white transition-colors"
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl p-5">
          <DollarSign size={24} className="text-white/80 mb-2" />
          <p className="text-white/80 text-sm">Total Amount</p>
          <p className="text-2xl font-bold text-white mt-1">
            ৳{parseFloat(summary?.total || 0).toLocaleString('en-BD')}
          </p>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <Receipt size={24} className="text-blue-400 mb-2" />
          <p className="text-slate-400 text-sm">Total Transactions</p>
          <p className="text-2xl font-bold text-white mt-1">
            {summary?.count || 0}
          </p>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <DollarSign size={24} className="text-emerald-400 mb-2" />
          <p className="text-slate-400 text-sm">Average Amount</p>
          <p className="text-2xl font-bold text-white mt-1">
            ৳{parseFloat(summary?.average || 0).toLocaleString('en-BD')}
          </p>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Start Date</label>
              <input
                type="date"
                value={filters.start}
                onChange={(e) => setFilters({ ...filters, start: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">End Date</label>
              <input
                type="date"
                value={filters.end}
                onChange={(e) => setFilters({ ...filters, end: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Min Amount</label>
              <input
                type="number"
                value={filters.min_amount}
                onChange={(e) => setFilters({ ...filters, min_amount: e.target.value })}
                placeholder="0"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Max Amount</label>
              <input
                type="number"
                value={filters.max_amount}
                onChange={(e) => setFilters({ ...filters, max_amount: e.target.value })}
                placeholder="100000"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleFilter}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Expenses Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        </div>
      ) : (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Date</th>
                  <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">User</th>
                  <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Description</th>
                  <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Category</th>
                  <th className="text-right text-sm font-medium text-slate-400 px-6 py-4">Amount</th>
                  <th className="text-right text-sm font-medium text-slate-400 px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-slate-500" />
                        <span className="text-white">{new Date(expense.date).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-semibold text-white">
                          {expense.user_username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-white font-medium">{expense.user_username}</p>
                          <p className="text-xs text-slate-500">{expense.user_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white truncate max-w-[200px]">{expense.description}</p>
                      {expense.merchant && (
                        <p className="text-xs text-slate-500">{expense.merchant}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-violet-500/10 text-violet-400 rounded-lg text-sm">
                        {expense.category_name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-white">
                        ৳{parseFloat(expense.amount).toLocaleString('en-BD')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedExpense(expense)}
                        className="p-2 text-slate-400 hover:text-violet-400 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                      No expenses found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
            <p className="text-sm text-slate-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* By User Summary */}
      {summary?.by_user && summary.by_user.length > 0 && (
        <div className="bg-slate-900 rounded-xl border border-slate-800">
          <div className="p-5 border-b border-slate-800">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Users size={18} className="text-blue-400" />
              Expenses by User
            </h3>
          </div>
          <div className="divide-y divide-slate-800">
            {summary.by_user.slice(0, 5).map((user, index) => (
              <div key={index} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-semibold text-white">
                    {user.created_by__username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-medium text-white">{user.created_by__username}</p>
                    <p className="text-sm text-slate-500">{user.count} expenses</p>
                  </div>
                </div>
                <span className="font-semibold text-white">
                  ৳{parseFloat(user.total || 0).toLocaleString('en-BD')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expense Detail Modal */}
      {selectedExpense && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">Expense Details</h3>
              <button
                onClick={() => setSelectedExpense(null)}
                className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Tag size={24} className="text-violet-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    ৳{parseFloat(selectedExpense.amount).toLocaleString('en-BD')}
                  </p>
                  <p className="text-sm text-slate-500">{selectedExpense.currency}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Date</span>
                  <span className="text-white">{new Date(selectedExpense.date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">User</span>
                  <span className="text-white">{selectedExpense.user_username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Category</span>
                  <span className="text-white">{selectedExpense.category_name || 'Uncategorized'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Method</span>
                  <span className="text-white">{selectedExpense.payment_method || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Merchant</span>
                  <span className="text-white">{selectedExpense.merchant || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Description</span>
                  <p className="text-white">{selectedExpense.description}</p>
                </div>
                {selectedExpense.notes && (
                  <div>
                    <span className="text-slate-400 block mb-1">Notes</span>
                    <p className="text-white">{selectedExpense.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
