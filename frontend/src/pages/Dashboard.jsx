import { useState, useEffect } from 'react'
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip,
  BarChart, Bar,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Wallet, CreditCard,
  Plus, ChevronRight, Loader2, Calendar, AlertTriangle,
  Utensils, ShoppingBag, Car, Home, Zap, Coffee,
  Briefcase, Heart, Gamepad2, GraduationCap, Plane, Gift,
  Target, PiggyBank, CheckCircle2, XCircle,
} from 'lucide-react'
import { expensesAPI, reportsAPI, budgetsAPI, categoriesAPI } from '../services/api'
import AddExpenseModal from '../components/AddExpenseModal'
import WelcomeModal from '../components/WelcomeModal'
import EmptyDashboardState from '../components/EmptyDashboardState'
import FirstExpenseSuccess from '../components/FirstExpenseSuccess'
import GettingStartedChecklist from '../components/GettingStartedChecklist'
import { InlineFeatureTip } from '../components/FeatureTip'
import { useOnboarding } from '../context/OnboardingContext'
import { Link, useNavigate } from 'react-router-dom'

// Icon mapping for categories
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

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [summary, setSummary] = useState(null)
  const [budgetStatus, setBudgetStatus] = useState(null)
  const [timeseries, setTimeseries] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [monthlyBudgetData, setMonthlyBudgetData] = useState(null)
  const [incomeData, setIncomeData] = useState(null)
  
  // Onboarding states
  const [showWelcome, setShowWelcome] = useState(false)
  const [showFirstExpenseSuccess, setShowFirstExpenseSuccess] = useState(false)
  const [lastAddedExpense, setLastAddedExpense] = useState(null)
  
  const navigate = useNavigate()
  const {
    isFirstLogin,
    hasSeenWelcome,
    hasAddedFirstExpense,
    markFirstExpenseAdded,
    incrementExpenseCount,
    expenseCount
  } = useOnboarding()

  // Get current month dates
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  // Get last 7 days
  const weekStart = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const weekEnd = now.toISOString().split('T')[0]

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Show welcome modal for first-time users
  useEffect(() => {
    if (!loading && isFirstLogin && !hasSeenWelcome && expenses.length === 0) {
      setShowWelcome(true)
    }
  }, [loading, isFirstLogin, hasSeenWelcome, expenses.length])

  const fetchDashboardData = async () => {
    try {
      const [expensesRes, categoriesRes, summaryRes, budgetRes, timeseriesRes] = await Promise.all([
        expensesAPI.list({ ordering: '-date', limit: 10 }),
        categoriesAPI.list(),
        reportsAPI.getSummary(monthStart, monthEnd),
        budgetsAPI.getStatus(currentMonth),
        reportsAPI.getTimeseries(weekStart, weekEnd, 'daily'),
      ])

      setExpenses(expensesRes.data.results || expensesRes.data)
      setCategories(categoriesRes.data.results || categoriesRes.data)
      setSummary(summaryRes.data)
      setBudgetStatus(budgetRes.data)
      setTimeseries(timeseriesRes.data.series || [])

      // Fetch monthly budget and income data
      try {
        const [monthlyRes, incomeRes] = await Promise.all([
          budgetsAPI.monthly.getCurrent(currentMonth),
          budgetsAPI.incomes.getTotal(currentMonth),
        ])
        setMonthlyBudgetData(monthlyRes.data)
        setIncomeData(incomeRes.data)
      } catch (err) {
        // These are optional - may not exist yet
        console.log('Budget/income data not set yet')
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExpenseAdded = (expenseData) => {
    const wasFirstExpense = !hasAddedFirstExpense && expenses.length === 0
    
    fetchDashboardData()
    setShowAddModal(false)
    incrementExpenseCount()
    
    if (wasFirstExpense) {
      markFirstExpenseAdded()
      setLastAddedExpense(expenseData)
      setShowFirstExpenseSuccess(true)
    }
  }

  const handleFirstExpenseSuccessClose = () => {
    setShowFirstExpenseSuccess(false)
    setLastAddedExpense(null)
  }

  const getCategoryById = (id) => categories.find(c => c.id === id)

  // Calculate totals
  const totalSpent = summary?.total ? parseFloat(summary.total) : 0
  const monthlyBudget = monthlyBudgetData?.total_budget ? parseFloat(monthlyBudgetData.total_budget) : 
                        (budgetStatus?.overall?.budget_amount ? parseFloat(budgetStatus.overall.budget_amount) : 0)
  const remainingBudget = monthlyBudget - totalSpent
  const budgetPercentage = monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0

  // Prepare pie chart data
  const pieData = summary?.by_category?.map(cat => ({
    name: cat.category_name,
    value: parseFloat(cat.total),
    color: getCategoryById(cat.category_id)?.color_token || '#8b5cf6',
  })) || []

  // Prepare weekly data for area chart
  const weeklyData = timeseries.map(item => ({
    day: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
    amount: parseFloat(item.total),
  }))

  // Days remaining in month
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysRemaining = daysInMonth - now.getDate()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Modal for First-time Users */}
      {showWelcome && (
        <WelcomeModal
          onClose={() => setShowWelcome(false)}
          onStartSetup={() => {
            setShowWelcome(false)
            navigate('/budgets')
          }}
        />
      )}

      {/* First Expense Success Celebration */}
      {showFirstExpenseSuccess && (
        <FirstExpenseSuccess
          expenseData={lastAddedExpense}
          onClose={handleFirstExpenseSuccessClose}
          onViewDashboard={handleFirstExpenseSuccessClose}
          onAddAnother={() => {
            handleFirstExpenseSuccessClose()
            setShowAddModal(true)
          }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 flex items-center gap-2 mt-1">
            <Calendar size={16} />
            {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-medium text-white hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/30"
        >
          <Plus size={20} />
          Add Expense
        </button>
      </div>

      {/* Empty State for New Users */}
      {expenses.length === 0 && !loading && (
        <EmptyDashboardState
          onAddExpense={() => setShowAddModal(true)}
          onSetupBudget={() => navigate('/budgets')}
        />
      )}

      {/* Feature Tips - shown after a few expenses */}
      {expenseCount >= 3 && expenseCount < 10 && !budgetStatus?.categories?.length && (
        <InlineFeatureTip
          tipId="budget"
          onAction={() => navigate('/budgets')}
        />
      )}

      {expenseCount >= 5 && expenseCount < 15 && (
        <InlineFeatureTip
          tipId="reports"
          onAction={() => navigate('/reports')}
        />
      )}

      {/* Getting Started Checklist - Show for new users with some data */}
      {expenses.length > 0 && expenseCount < 10 && (
        <GettingStartedChecklist
          onAddExpense={() => setShowAddModal(true)}
        />
      )}

      {/* Stats Cards - Only show when there's data */}
      {(expenses.length > 0 || monthlyBudget > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Spent Card */}
        <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative">
            <div className="flex items-center gap-2 text-white/80 mb-1">
              <Wallet size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="text-xs sm:text-sm font-medium">Total Spent</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold">
              ৳{totalSpent.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-1 mt-2 text-xs sm:text-sm">
              <TrendingUp size={14} className="sm:w-4 sm:h-4" />
              <span>This month</span>
            </div>
          </div>
        </div>

        {/* Budget Card */}
        <div className="bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <CreditCard size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="text-xs sm:text-sm font-medium">Monthly Budget</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white">
            {monthlyBudget > 0 ? `৳${monthlyBudget.toLocaleString('en-BD')}` : 'Not set'}
          </p>
          {monthlyBudget > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Used</span>
                <span className={budgetPercentage > 80 ? 'text-rose-400' : 'text-emerald-400'}>
                  {budgetPercentage.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    budgetPercentage > 80 ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Remaining Card */}
        <div className="bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-800 sm:col-span-1 col-span-1">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <TrendingDown size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="text-xs sm:text-sm font-medium">Remaining</span>
          </div>
          <p className={`text-2xl sm:text-3xl font-bold ${
            monthlyBudget === 0 ? 'text-slate-500' : remainingBudget < 0 ? 'text-rose-400' : 'text-emerald-400'
          }`}>
            {monthlyBudget > 0
              ? `৳${remainingBudget.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`
              : '—'}
          </p>
          <p className="text-slate-500 text-xs sm:text-sm mt-2">{daysRemaining} days left</p>
        </div>
      </div>
      )}

      {/* Charts Section - Only show when there's data */}
      {expenses.length > 0 && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Weekly Spending Chart */}
        <div className="bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="font-semibold text-white text-sm sm:text-base">Weekly Spending</h3>
          </div>
          <div className="h-40 sm:h-48 min-h-[160px] sm:min-h-[192px]">
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                    formatter={(value) => [`৳${value.toFixed(2)}`, 'Spent']}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fill="url(#colorAmount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                No data for this week
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="font-semibold text-white text-sm sm:text-base">By Category</h3>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="w-32 h-32 sm:w-36 sm:h-36 min-w-[128px] sm:min-w-[144px] min-h-[128px] sm:min-h-[144px] flex-shrink-0">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
                  No expenses
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2 w-full">
              {pieData.slice(0, 4).map((cat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    ></div>
                    <span className="text-sm text-slate-300">{cat.name}</span>
                  </div>
                  <span className="text-sm font-medium text-white">৳{cat.value.toFixed(0)}</span>
                </div>
              ))}
              {pieData.length === 0 && (
                <p className="text-slate-500 text-sm">Add expenses to see breakdown</p>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Budget Allocations Overview */}
      {budgetStatus?.categories && budgetStatus.categories.length > 0 && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Target size={18} className="text-violet-400" />
              Budget Allocations
            </h3>
            <Link
              to="/budgets"
              className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              Manage <ChevronRight size={16} />
            </Link>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
            <div className="bg-slate-800/50 rounded-xl p-2 sm:p-3">
              <p className="text-slate-400 text-[10px] sm:text-xs">Total Income</p>
              <p className="text-sm sm:text-lg font-bold text-emerald-400">
                ৳{incomeData?.total?.toLocaleString('en-BD') || '0'}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-2 sm:p-3">
              <p className="text-slate-400 text-[10px] sm:text-xs">Monthly Budget</p>
              <p className="text-sm sm:text-lg font-bold text-violet-400">
                ৳{monthlyBudgetData?.total_budget?.toLocaleString('en-BD') || monthlyBudget?.toLocaleString('en-BD') || '0'}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-2 sm:p-3">
              <p className="text-slate-400 text-[10px] sm:text-xs">Allocated</p>
              <p className="text-sm sm:text-lg font-bold text-white">
                {budgetStatus.categories.length} categories
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-2 sm:p-3">
              <p className="text-slate-400 text-[10px] sm:text-xs">At Risk</p>
              <p className="text-sm sm:text-lg font-bold text-amber-400">
                {budgetStatus.categories.filter(c => c.status === 'warn' || c.status === 'exceeded').length}
              </p>
            </div>
          </div>

          {/* Category Allocations */}
          <div className="space-y-3">
            {budgetStatus.categories.slice(0, 5).map((cat, index) => {
              const category = getCategoryById(cat.category_id)
              const color = category?.color_token || '#8b5cf6'
              const percentUsed = cat.percent_used ? parseFloat(cat.percent_used) * 100 : 0
              
              return (
                <div key={index} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm text-slate-300">{cat.category_name}</span>
                      {cat.status === 'exceeded' && (
                        <XCircle size={14} className="text-rose-400" />
                      )}
                      {cat.status === 'warn' && (
                        <AlertTriangle size={14} className="text-amber-400" />
                      )}
                      {cat.status === 'ok' && (
                        <CheckCircle2 size={14} className="text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-slate-500">
                        ৳{parseFloat(cat.spent).toFixed(0)} / ৳{parseFloat(cat.budget_amount).toFixed(0)}
                      </span>
                      <span className={`font-medium ${
                        cat.status === 'exceeded' ? 'text-rose-400' :
                        cat.status === 'warn' ? 'text-amber-400' :
                        'text-emerald-400'
                      }`}>
                        {percentUsed.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        cat.status === 'exceeded' ? 'bg-rose-500' :
                        cat.status === 'warn' ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(percentUsed, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {budgetStatus.categories.length > 5 && (
              <p className="text-xs text-slate-500 text-center pt-2">
                +{budgetStatus.categories.length - 5} more categories
              </p>
            )}
          </div>
        </div>
      )}

      {/* Setup Budget CTA - Only show if no budget data */}
      {!budgetStatus?.categories?.length && !monthlyBudgetData && (
        <div className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 rounded-2xl border border-violet-500/20 p-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center">
              <PiggyBank size={32} className="text-violet-400" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-semibold text-white mb-1">Set Up Your Budget</h3>
              <p className="text-slate-400 text-sm">
                Track your income, set a monthly budget, and allocate spending limits to different categories.
              </p>
            </div>
            <Link
              to="/budgets"
              className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-medium text-white hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800">
          <h3 className="font-semibold text-white text-sm sm:text-base">Recent Transactions</h3>
          <a
            href="/expenses"
            className="flex items-center gap-1 text-xs sm:text-sm text-violet-400 hover:text-violet-300 transition-colors"
          >
            See All <ChevronRight size={14} className="sm:w-4 sm:h-4" />
          </a>
        </div>
        <div className="divide-y divide-slate-800">
          {expenses.slice(0, 6).map((expense) => {
            const category = getCategoryById(expense.category)
            const IconComponent = category ? getIcon(category.icon) : Wallet
            const color = category?.color_token || '#8b5cf6'
            
            return (
              <div
                key={expense.id}
                className="flex items-center justify-between p-3 sm:p-4 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <IconComponent size={18} className="sm:w-[22px] sm:h-[22px]" style={{ color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white text-sm sm:text-base truncate">{expense.description}</p>
                    <p className="text-xs sm:text-sm text-slate-500 truncate">
                      {category?.name || 'Uncategorized'}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="font-semibold text-white text-sm sm:text-base">
                    -৳{parseFloat(expense.amount).toFixed(2)}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-500">{expense.date}</p>
                </div>
              </div>
            )
          })}
          {expenses.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No expenses yet. Add your first expense to get started!
            </div>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <AddExpenseModal
          categories={categories}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleExpenseAdded}
        />
      )}
    </div>
  )
}
