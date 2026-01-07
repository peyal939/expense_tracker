import { useState, useEffect } from 'react'
import {
  Plus, Edit2, Trash2, Loader2, X, AlertCircle, Check,
  PiggyBank, Calendar, TrendingUp, TrendingDown, Wallet,
  DollarSign, Percent, ChevronDown, ChevronUp, Briefcase,
} from 'lucide-react'
import { budgetsAPI, categoriesAPI } from '../services/api'
import { useOnboarding } from '../context/OnboardingContext'

export default function Budgets() {
  const { markBudgetSet } = useOnboarding()
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [incomeSources, setIncomeSources] = useState([])
  const [incomes, setIncomes] = useState([])
  const [monthlyBudget, setMonthlyBudget] = useState(null)
  const [allocations, setAllocations] = useState([])
  const [budgetStatus, setBudgetStatus] = useState(null)
  
  // UI State
  const [showIncomeModal, setShowIncomeModal] = useState(false)
  const [showAllocationModal, setShowAllocationModal] = useState(false)
  const [editingIncome, setEditingIncome] = useState(null)
  const [editingAllocation, setEditingAllocation] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleteType, setDeleteType] = useState(null) // 'income' or 'allocation'
  const [expandedSection, setExpandedSection] = useState('income') // 'income', 'budget', 'allocations'
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  })

  useEffect(() => {
    fetchAll()
  }, [selectedMonth])

  const fetchAll = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchIncomeSources(),
        fetchIncomes(),
        fetchMonthlyBudget(),
        fetchAllocations(),
        fetchBudgetStatus(),
        fetchCategories(),
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.list()
      const data = response.data?.results ?? response.data
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchIncomeSources = async () => {
    try {
      const response = await budgetsAPI.incomeSources.list()
      const data = response.data?.results ?? response.data
      setIncomeSources(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching income sources:', error)
    }
  }

  const fetchIncomes = async () => {
    try {
      const response = await budgetsAPI.incomes.getTotal(selectedMonth)
      const data = response.data?.incomes ?? response.data
      setIncomes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching incomes:', error)
    }
  }

  const fetchMonthlyBudget = async () => {
    try {
      const response = await budgetsAPI.monthly.getCurrent(selectedMonth)
      setMonthlyBudget(response.data)
    } catch (error) {
      console.error('Error fetching monthly budget:', error)
    }
  }

  const fetchAllocations = async () => {
    try {
      const response = await budgetsAPI.allocations.list({ month: selectedMonth, scope: 'category' })
      const data = response.data?.results ?? response.data
      setAllocations(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching allocations:', error)
    }
  }

  const fetchBudgetStatus = async () => {
    try {
      const response = await budgetsAPI.getStatus(selectedMonth)
      setBudgetStatus(response.data)
    } catch (error) {
      console.error('Error fetching budget status:', error)
    }
  }

  const handleDeleteIncome = async (id) => {
    try {
      await budgetsAPI.incomes.delete(id)
      setDeleteConfirm(null)
      setDeleteType(null)
      fetchAll()
    } catch (error) {
      console.error('Error deleting income:', error)
    }
  }

  const handleDeleteAllocation = async (id) => {
    try {
      await budgetsAPI.allocations.delete(id)
      setDeleteConfirm(null)
      setDeleteType(null)
      fetchAll()
    } catch (error) {
      console.error('Error deleting allocation:', error)
    }
  }

  const totalIncome = incomes.reduce((sum, inc) => sum + parseFloat(inc.amount || 0), 0)
  const totalBudget = monthlyBudget?.total_budget ? parseFloat(monthlyBudget.total_budget) : totalIncome
  const allocatedAmount = monthlyBudget?.allocated_amount ? parseFloat(monthlyBudget.allocated_amount) : 0
  const unallocatedAmount = totalBudget - allocatedAmount

  const getCategoryById = (id) => categories.find(c => c.id === id)

  const getStatusColor = (status) => {
    switch (status) {
      case 'exceeded': return 'text-rose-400 bg-rose-500/10'
      case 'warn': return 'text-amber-400 bg-amber-500/10'
      case 'ok': return 'text-emerald-400 bg-emerald-500/10'
      default: return 'text-slate-400 bg-slate-500/10'
    }
  }

  const getProgressColor = (status) => {
    switch (status) {
      case 'exceeded': return 'bg-rose-500'
      case 'warn': return 'bg-amber-500'
      default: return 'bg-emerald-500'
    }
  }

  const formatMonth = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  // Get month options for selector
  const monthOptions = []
  const now = new Date()
  for (let i = -3; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    monthOptions.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`,
      label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    })
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Budget Planner</h1>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">Manage your income and allocate spending</p>
        </div>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-white focus:outline-none focus:border-violet-500 text-sm sm:text-base"
        >
          {monthOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Total Income Card */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative">
                <div className="flex items-center gap-2 text-white/80 mb-2">
                  <Wallet size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm font-medium">Total Income</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-white">৳{totalIncome.toLocaleString('en-BD')}</p>
                <p className="text-white/60 text-xs sm:text-sm mt-1">{incomes.length} source(s)</p>
              </div>
            </div>

            {/* Monthly Budget Card */}
            <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative">
                <div className="flex items-center gap-2 text-white/80 mb-2">
                  <PiggyBank size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm font-medium">Monthly Budget</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-white">৳{totalBudget.toLocaleString('en-BD')}</p>
                <p className="text-white/60 text-xs sm:text-sm mt-1">
                  {totalBudget === totalIncome ? 'Same as income' : 'Adjusted'}
                </p>
              </div>
            </div>

            {/* Unallocated Card */}
            <div className={`rounded-2xl p-4 sm:p-5 relative overflow-hidden ${
              unallocatedAmount < 0 
                ? 'bg-gradient-to-br from-rose-600 to-pink-600' 
                : 'bg-gradient-to-br from-amber-600 to-orange-600'
            }`}>
              <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative">
                <div className="flex items-center gap-2 text-white/80 mb-2">
                  <DollarSign size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm font-medium">Unallocated</span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-white">৳{Math.abs(unallocatedAmount).toLocaleString('en-BD')}</p>
                <p className="text-white/60 text-xs sm:text-sm mt-1">
                  {unallocatedAmount < 0 ? 'Over-allocated!' : `${((unallocatedAmount / totalBudget) * 100 || 0).toFixed(0)}% of budget`}
                </p>
              </div>
            </div>
          </div>

          {/* Income Section */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === 'income' ? '' : 'income')}
              className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                </div>
                <div className="text-left">
                  <h2 className="text-base sm:text-lg font-semibold text-white">Income Sources</h2>
                  <p className="text-xs sm:text-sm text-slate-400">Add your monthly earnings</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-emerald-400 font-semibold text-sm sm:text-base">৳{totalIncome.toLocaleString('en-BD')}</span>
                {expandedSection === 'income' ? (
                  <ChevronUp className="text-slate-400 w-5 h-5" />
                ) : (
                  <ChevronDown className="text-slate-400 w-5 h-5" />
                )}
              </div>
            </button>
            
            {expandedSection === 'income' && (
              <div className="border-t border-slate-800 p-4 sm:p-5">
                {incomes.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3 mb-4">
                    {incomes.map((income) => (
                      <div key={income.id} className="flex items-center justify-between p-3 sm:p-4 bg-slate-800/50 rounded-xl">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                            <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-white text-sm sm:text-base truncate">{income.source_name || 'Other Income'}</p>
                            {income.notes && <p className="text-xs sm:text-sm text-slate-500 truncate">{income.notes}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
                          <span className="text-base sm:text-lg font-semibold text-emerald-400">
                            ৳{parseFloat(income.amount).toLocaleString('en-BD')}
                          </span>
                          <button
                            onClick={() => setEditingIncome(income)}
                            className="p-1.5 sm:p-2 text-slate-400 hover:text-violet-400 hover:bg-slate-700 rounded-lg transition-colors"
                          >
                            <Edit2 size={14} className="sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => { setDeleteConfirm(income.id); setDeleteType('income'); }}
                            className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} className="sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 sm:py-6 text-slate-400 mb-4">
                    <Wallet className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm sm:text-base">No income added for {formatMonth(selectedMonth)}</p>
                  </div>
                )}
                <button
                  onClick={() => setShowIncomeModal(true)}
                  className="w-full py-3 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 hover:border-emerald-500 hover:text-emerald-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Add Income Source
                </button>
              </div>
            )}
          </div>

          {/* Budget Adjustment Section */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === 'budget' ? '' : 'budget')}
              className="w-full flex items-center justify-between p-5 hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <PiggyBank className="w-5 h-5 text-violet-400" />
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-semibold text-white">Monthly Budget</h2>
                  <p className="text-sm text-slate-400">Adjust your spending limit</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-violet-400 font-semibold">৳{totalBudget.toLocaleString('en-BD')}</span>
                {expandedSection === 'budget' ? (
                  <ChevronUp className="text-slate-400" />
                ) : (
                  <ChevronDown className="text-slate-400" />
                )}
              </div>
            </button>
            
            {expandedSection === 'budget' && (
              <div className="border-t border-slate-800 p-5">
                <BudgetAdjuster
                  totalIncome={totalIncome}
                  currentBudget={totalBudget}
                  selectedMonth={selectedMonth}
                  onUpdate={() => {
                    fetchAll()
                    markBudgetSet()
                  }}
                />
              </div>
            )}
          </div>

          {/* Category Allocations Section */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === 'allocations' ? '' : 'allocations')}
              className="w-full flex items-center justify-between p-5 hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 flex items-center justify-center">
                  <Percent className="w-5 h-5 text-fuchsia-400" />
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-semibold text-white">Category Allocations</h2>
                  <p className="text-sm text-slate-400">Allocate budget to spending categories</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-fuchsia-400 font-semibold">
                  {allocations.length} categories • {((allocatedAmount / totalBudget) * 100 || 0).toFixed(0)}%
                </span>
                {expandedSection === 'allocations' ? (
                  <ChevronUp className="text-slate-400" />
                ) : (
                  <ChevronDown className="text-slate-400" />
                )}
              </div>
            </button>
            
            {expandedSection === 'allocations' && (
              <div className="border-t border-slate-800 p-5">
                {/* Allocation Progress */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Budget Allocation</span>
                    <span className="text-sm font-medium text-white">
                      ৳{allocatedAmount.toLocaleString('en-BD')} / ৳{totalBudget.toLocaleString('en-BD')}
                    </span>
                  </div>
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        allocatedAmount > totalBudget ? 'bg-rose-500' : 'bg-fuchsia-500'
                      }`}
                      style={{ width: `${Math.min((allocatedAmount / totalBudget) * 100 || 0, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-sm ${unallocatedAmount < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                      {unallocatedAmount < 0 ? 'Over by' : 'Remaining'}: ৳{Math.abs(unallocatedAmount).toLocaleString('en-BD')}
                    </span>
                    <span className="text-sm text-slate-400">
                      {((allocatedAmount / totalBudget) * 100 || 0).toFixed(1)}% allocated
                    </span>
                  </div>
                </div>

                {/* Allocations List */}
                {allocations.length > 0 ? (
                  <div className="space-y-3 mb-4">
                    {allocations.map((alloc) => {
                      const category = getCategoryById(alloc.category)
                      const statusData = budgetStatus?.categories?.find(c => c.budget_id === alloc.id)
                      const percentOfBudget = (parseFloat(alloc.amount) / totalBudget) * 100
                      
                      return (
                        <div key={alloc.id} className="p-4 bg-slate-800/50 rounded-xl">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: category?.color_token || '#8b5cf6' }}
                              ></span>
                              <span className="font-medium text-white">{category?.name || 'Unknown'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {statusData && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(statusData.status)}`}>
                                  {statusData.status === 'exceeded' ? 'Over' : statusData.status === 'warn' ? 'Warning' : 'OK'}
                                </span>
                              )}
                              <button
                                onClick={() => setEditingAllocation(alloc)}
                                className="p-1.5 text-slate-400 hover:text-violet-400 hover:bg-slate-700 rounded-lg transition-colors"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => { setDeleteConfirm(alloc.id); setDeleteType('allocation'); }}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-lg transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-baseline justify-between mb-2">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-bold text-white">
                                ৳{parseFloat(alloc.amount).toLocaleString('en-BD')}
                              </span>
                              <span className="text-sm text-slate-500">
                                ({percentOfBudget.toFixed(1)}%)
                              </span>
                            </div>
                            {statusData && (
                              <span className="text-sm text-slate-400">
                                Spent: ৳{parseFloat(statusData.spent).toLocaleString('en-BD')}
                              </span>
                            )}
                          </div>
                          
                          {statusData && (
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${getProgressColor(statusData.status)}`}
                                style={{ width: `${Math.min(parseFloat(statusData.percent_used) * 100, 100)}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 mb-4">
                    <Percent className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No allocations set. Add categories to track spending.</p>
                  </div>
                )}
                
                <button
                  onClick={() => setShowAllocationModal(true)}
                  className="w-full py-3 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 hover:border-fuchsia-500 hover:text-fuchsia-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Add Category Allocation
                </button>
              </div>
            )}
          </div>

          {/* Overall Budget Status */}
          {budgetStatus?.overall?.budget_amount && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Spending Overview</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-slate-400 text-sm">Budget</p>
                  <p className="text-xl font-bold text-white">
                    ৳{parseFloat(budgetStatus.overall.budget_amount).toLocaleString('en-BD')}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Spent</p>
                  <p className="text-xl font-bold text-white">
                    ৳{parseFloat(budgetStatus.overall.spent).toLocaleString('en-BD')}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Remaining</p>
                  <p className={`text-xl font-bold ${parseFloat(budgetStatus.overall.remaining) < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    ৳{parseFloat(budgetStatus.overall.remaining).toLocaleString('en-BD')}
                  </p>
                </div>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getProgressColor(budgetStatus.overall.status)}`}
                  style={{ width: `${Math.min(parseFloat(budgetStatus.overall.percent_used) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-slate-400 text-sm mt-2 text-right">
                {(parseFloat(budgetStatus.overall.percent_used) * 100).toFixed(0)}% of budget used
              </p>
            </div>
          )}
        </>
      )}

      {/* Income Modal */}
      {(showIncomeModal || editingIncome) && (
        <IncomeModal
          income={editingIncome}
          incomeSources={incomeSources}
          selectedMonth={selectedMonth}
          onClose={() => { setShowIncomeModal(false); setEditingIncome(null); }}
          onSuccess={() => { setShowIncomeModal(false); setEditingIncome(null); fetchAll(); }}
        />
      )}

      {/* Allocation Modal */}
      {(showAllocationModal || editingAllocation) && (
        <AllocationModal
          allocation={editingAllocation}
          categories={categories}
          allocations={allocations}
          totalBudget={totalBudget}
          selectedMonth={selectedMonth}
          onClose={() => { setShowAllocationModal(false); setEditingAllocation(null); }}
          onSuccess={() => { setShowAllocationModal(false); setEditingAllocation(null); fetchAll(); }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl w-full max-w-sm border border-slate-800 p-6 animate-slide-up">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={24} className="text-rose-400" />
            </div>
            <h3 className="text-lg font-semibold text-white text-center mb-2">
              Delete {deleteType === 'income' ? 'Income' : 'Allocation'}?
            </h3>
            <p className="text-slate-400 text-center mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteConfirm(null); setDeleteType(null); }}
                className="flex-1 py-2.5 bg-slate-800 rounded-xl font-medium text-white hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteType === 'income' ? handleDeleteIncome(deleteConfirm) : handleDeleteAllocation(deleteConfirm)}
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

// Budget Adjuster Component
function BudgetAdjuster({ totalIncome, currentBudget, selectedMonth, onUpdate }) {
  const [budget, setBudget] = useState(currentBudget)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setBudget(currentBudget)
  }, [currentBudget])

  const handleSave = async () => {
    setLoading(true)
    try {
      await budgetsAPI.monthly.create({
        month: selectedMonth,
        total_budget: budget,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      onUpdate()
    } catch (error) {
      console.error('Error saving budget:', error)
    } finally {
      setLoading(false)
    }
  }

  const percentOfIncome = totalIncome > 0 ? ((budget / totalIncome) * 100).toFixed(0) : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">Based on income</span>
        <button
          onClick={() => setBudget(totalIncome)}
          className="text-sm text-violet-400 hover:text-violet-300"
        >
          Reset to income
        </button>
      </div>
      
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">৳</span>
        <input
          type="number"
          value={budget}
          onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-xl font-semibold text-white focus:outline-none focus:border-violet-500 transition-colors"
        />
      </div>

      <input
        type="range"
        min={0}
        max={totalIncome * 1.5 || 100000}
        step={100}
        value={budget}
        onChange={(e) => setBudget(parseFloat(e.target.value))}
        className="w-full accent-violet-500"
      />
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">{percentOfIncome}% of income</span>
        <span className={budget > totalIncome ? 'text-rose-400' : 'text-slate-400'}>
          {budget > totalIncome && '+'}৳{(budget - totalIncome).toLocaleString('en-BD')}
        </span>
      </div>

      <button
        onClick={handleSave}
        disabled={loading || budget === currentBudget}
        className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : saved ? (
          <>
            <Check size={20} />
            Saved!
          </>
        ) : (
          'Save Budget'
        )}
      </button>
    </div>
  )
}

// Income Modal Component
function IncomeModal({ income, incomeSources, selectedMonth, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    month: income?.month || selectedMonth,
    source: income?.source || '',
    source_name: income?.source_name || '',
    amount: income?.amount || '',
    notes: income?.notes || '',
  })
  const [customSource, setCustomSource] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const data = {
        month: formData.month,
        amount: parseFloat(formData.amount),
        notes: formData.notes,
      }
      
      if (customSource) {
        data.source_name = formData.source_name
      } else if (formData.source) {
        data.source = parseInt(formData.source)
      }

      if (income) {
        await budgetsAPI.incomes.update(income.id, data)
      } else {
        await budgetsAPI.incomes.create(data)
      }
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.amount?.[0] || 'Failed to save income')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-800 overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-white">
            {income ? 'Edit Income' : 'Add Income'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg transition-colors">
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
              <label className="block text-sm text-slate-400 mb-2">Source</label>
              <div className="space-y-2">
                {!customSource ? (
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="">Select Source</option>
                    {incomeSources.map(src => (
                      <option key={src.id} value={src.id}>{src.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.source_name}
                    onChange={(e) => setFormData({ ...formData, source_name: e.target.value })}
                    placeholder="Enter custom source name"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setCustomSource(!customSource)}
                  className="text-sm text-violet-400 hover:text-violet-300"
                >
                  {customSource ? 'Choose from list' : 'Enter custom source'}
                </button>
              </div>
            </div>

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
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Notes (optional)</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any notes about this income"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="p-5 border-t border-slate-800">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Saving...
                </>
              ) : income ? 'Save Changes' : 'Add Income'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Allocation Modal Component
function AllocationModal({ allocation, categories, allocations, totalBudget, selectedMonth, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    month: allocation?.month || selectedMonth,
    category: allocation?.category || '',
    amount: allocation?.amount || '',
    warn_threshold: allocation?.warn_threshold || '0.8',
  })
  const [inputMode, setInputMode] = useState('amount') // 'amount' or 'percent'
  const [percentInput, setPercentInput] = useState('') // Separate state for percentage input
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Initialize percentage input when allocation data loads
  useEffect(() => {
    if (allocation && totalBudget > 0) {
      const percent = (parseFloat(allocation.amount) / totalBudget) * 100
      setPercentInput(percent.toFixed(2))
    }
  }, [allocation, totalBudget])

  // Filter out already allocated categories (except current one being edited)
  const availableCategories = categories.filter(cat => {
    if (allocation && allocation.category === cat.id) return true
    return !allocations.some(a => a.category === cat.id)
  })

  const handlePercentChange = (e) => {
    const value = e.target.value
    setPercentInput(value)
    
    if (value === '' || value === '.') {
      setFormData({ ...formData, amount: '0' })
      return
    }
    
    const percent = parseFloat(value)
    if (!isNaN(percent) && totalBudget > 0) {
      const amount = (totalBudget * percent / 100).toFixed(2)
      setFormData({ ...formData, amount })
    }
  }

  const handleAmountChange = (e) => {
    const amount = e.target.value
    setFormData({ ...formData, amount })
    
    // Update percentage input when amount changes
    if (amount && totalBudget > 0) {
      const percent = (parseFloat(amount) / totalBudget) * 100
      setPercentInput(percent.toFixed(2))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const data = {
        month: formData.month,
        scope: 'category',
        category: parseInt(formData.category),
        amount: parseFloat(formData.amount),
        warn_threshold: parseFloat(formData.warn_threshold),
      }

      if (allocation) {
        await budgetsAPI.allocations.update(allocation.id, data)
      } else {
        await budgetsAPI.allocations.create(data)
      }
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.category?.[0] || 'Failed to save allocation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-800 overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-white">
            {allocation ? 'Edit Allocation' : 'Add Category Allocation'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg transition-colors">
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
              <label className="block text-sm text-slate-400 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500"
                required
              >
                <option value="">Select Category</option>
                {availableCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Input Mode Toggle */}
            <div className="flex rounded-xl bg-slate-800 p-1">
              <button
                type="button"
                onClick={() => setInputMode('amount')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  inputMode === 'amount' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <DollarSign size={16} className="inline mr-1" />
                Amount (৳)
              </button>
              <button
                type="button"
                onClick={() => setInputMode('percent')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  inputMode === 'percent' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Percent size={16} className="inline mr-1" />
                Percentage
              </button>
            </div>

            {/* Amount/Percent Input */}
            {inputMode === 'amount' ? (
              <div>
                <label className="block text-sm text-slate-400 mb-2">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">৳</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={handleAmountChange}
                    placeholder="0.00"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                    required
                  />
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  = {percentInput ? parseFloat(percentInput).toFixed(1) : '0.0'}% of budget
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm text-slate-400 mb-2">Percentage of Budget</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={percentInput}
                    onChange={handlePercentChange}
                    placeholder="0.00"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-4 pr-10 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                </div>
                <p className="text-sm text-slate-500 mt-1">= ৳{parseFloat(formData.amount || 0).toLocaleString('en-BD')}</p>
              </div>
            )}

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Warning at {(parseFloat(formData.warn_threshold) * 100).toFixed(0)}%
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
              ) : allocation ? 'Save Changes' : 'Add Allocation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
