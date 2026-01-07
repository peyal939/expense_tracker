import { useState, useEffect } from 'react'
import {
  Users, Receipt, Tags, TrendingUp,
  Loader2, Crown, DollarSign, Activity, Calendar,
  ArrowUpRight, ArrowDownRight, Zap, PieChart, BarChart3,
  RefreshCw, AlertCircle, CheckCircle2, Wallet,
} from 'lucide-react'
import { adminPanelAPI } from '../services/api'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [health, setHealth] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, healthRes] = await Promise.all([
        adminPanelAPI.getDashboardStats(),
        adminPanelAPI.getSystemHealth()
      ])
      setStats(statsRes.data)
      setHealth(healthRes.data)
    } catch (error) {
      console.error('Error fetching admin stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    )
  }

  const overview = stats?.overview || {}
  const topSpenders = Array.isArray(stats?.top_spenders) ? stats.top_spenders : []
  const topCategories = Array.isArray(stats?.top_categories) ? stats.top_categories : []
  const monthlyTrends = Array.isArray(stats?.monthly_trends) ? stats.monthly_trends : []
  const roleDistribution = Array.isArray(stats?.role_distribution) ? stats.role_distribution : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">System overview and real-time analytics</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-white transition-colors text-sm"
        >
          <RefreshCw size={16} className={`sm:w-[18px] sm:h-[18px] ${refreshing ? 'animate-spin' : ''}`} />
          <span className="sm:inline">Refresh</span>
        </button>
      </div>

      {/* System Health Banner */}
      <div className={`rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3 ${
        health?.status === 'healthy' 
          ? 'bg-emerald-500/10 border border-emerald-500/20' 
          : 'bg-rose-500/10 border border-rose-500/20'
      }`}>
        {health?.status === 'healthy' ? (
          <CheckCircle2 className="text-emerald-400 w-5 h-5 sm:w-6 sm:h-6" />
        ) : (
          <AlertCircle className="text-rose-400 w-5 h-5 sm:w-6 sm:h-6" />
        )}
        <div className="min-w-0 flex-1">
          <p className={`font-medium text-sm sm:text-base ${health?.status === 'healthy' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {health?.status === 'healthy' ? 'All Systems Operational' : 'Issues Detected'}
          </p>
          <p className="text-xs sm:text-sm text-slate-400 truncate">
            Last checked: {new Date(health?.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Revenue/Expenses */}
        <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl p-4 sm:p-5 relative overflow-hidden col-span-2 sm:col-span-1">
          <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative">
            <DollarSign size={20} className="text-white/80 mb-2 sm:w-6 sm:h-6" />
            <p className="text-white/80 text-xs sm:text-sm">Total Expenses</p>
            <p className="text-xl sm:text-2xl font-bold text-white mt-1">
              ৳{parseFloat(overview.total_expenses_amount || 0).toLocaleString('en-BD')}
            </p>
            <p className="text-xs sm:text-sm text-white/70 mt-2">
              {overview.total_expenses_count?.toLocaleString()} transactions
            </p>
          </div>
        </div>

        {/* This Month */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <Calendar size={20} className="text-blue-400 sm:w-6 sm:h-6" />
            {overview.expense_growth_percent !== 0 && (
              <span className={`flex items-center gap-1 text-xs sm:text-sm ${
                overview.expense_growth_percent > 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {overview.expense_growth_percent > 0 ? (
                  <ArrowUpRight size={14} className="sm:w-4 sm:h-4" />
                ) : (
                  <ArrowDownRight size={14} className="sm:w-4 sm:h-4" />
                )}
                {Math.abs(overview.expense_growth_percent)}%
              </span>
            )}
          </div>
          <p className="text-slate-400 text-xs sm:text-sm">This Month</p>
          <p className="text-xl sm:text-2xl font-bold text-white mt-1">
            ৳{parseFloat(overview.this_month_expenses || 0).toLocaleString('en-BD')}
          </p>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            {overview.this_month_count?.toLocaleString()} expenses
          </p>
        </div>

        {/* Total Users */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <Users size={20} className="text-emerald-400 sm:w-6 sm:h-6" />
            {overview.user_growth_percent !== 0 && (
              <span className={`flex items-center gap-1 text-xs sm:text-sm ${
                overview.user_growth_percent > 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {overview.user_growth_percent > 0 ? (
                  <ArrowUpRight size={14} className="sm:w-4 sm:h-4" />
                ) : (
                  <ArrowDownRight size={14} className="sm:w-4 sm:h-4" />
                )}
                {Math.abs(overview.user_growth_percent)}%
              </span>
            )}
          </div>
          <p className="text-slate-400 text-xs sm:text-sm">Total Users</p>
          <p className="text-xl sm:text-2xl font-bold text-white mt-1">
            {overview.total_users || 0}
          </p>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            +{overview.new_users_this_month || 0} this month
          </p>
        </div>

        {/* Categories & Sources */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 sm:p-5">
          <Tags size={20} className="text-amber-400 mb-2 sm:w-6 sm:h-6" />
          <p className="text-slate-400 text-xs sm:text-sm">Categories</p>
          <p className="text-xl sm:text-2xl font-bold text-white mt-1">
            {overview.total_categories || 0}
          </p>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            {overview.system_categories || 0} system categories
          </p>
        </div>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
              <Wallet size={16} className="text-violet-400 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-white">{overview.income_sources || 0}</p>
              <p className="text-xs sm:text-sm text-slate-500 truncate">Income Sources</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-pink-500/10 flex items-center justify-center flex-shrink-0">
              <PieChart size={16} className="text-pink-400 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-white">{overview.active_budgets || 0}</p>
              <p className="text-xs sm:text-sm text-slate-500 truncate">Active Budgets</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
              <Zap size={16} className="text-cyan-400 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-white">{health?.recent_activity?.expenses_last_hour || 0}</p>
              <p className="text-xs sm:text-sm text-slate-500 truncate">Last Hour</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <Activity size={16} className="text-emerald-400 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-2xl font-bold text-white">{health?.recent_activity?.logins_today || 0}</p>
              <p className="text-xs sm:text-sm text-slate-500 truncate">Logins Today</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Spenders */}
        <div className="bg-slate-900 rounded-xl border border-slate-800">
          <div className="p-4 sm:p-5 border-b border-slate-800">
            <h3 className="font-semibold text-white flex items-center gap-2 text-sm sm:text-base">
              <Crown size={16} className="text-amber-400 sm:w-[18px] sm:h-[18px]" />
              Top Spenders
            </h3>
          </div>
          <div className="divide-y divide-slate-800">
            {topSpenders.slice(0, 5).map((user, index) => (
              <div key={user.id} className="flex items-center justify-between p-3 sm:p-4 hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm flex-shrink-0 ${
                    index === 0 ? 'bg-amber-500/20 text-amber-400' :
                    index === 1 ? 'bg-slate-400/20 text-slate-300' :
                    index === 2 ? 'bg-orange-500/20 text-orange-400' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-white text-sm sm:text-base truncate">{user.username}</p>
                    <p className="text-xs sm:text-sm text-slate-500">{user.expense_count} expenses</p>
                  </div>
                </div>
                <span className="font-semibold text-white text-sm sm:text-base flex-shrink-0 ml-2">
                  ৳{parseFloat(user.total_spent || 0).toLocaleString('en-BD')}
                </span>
              </div>
            ))}
            {topSpenders.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                No spending data yet
              </div>
            )}
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-slate-900 rounded-xl border border-slate-800">
          <div className="p-5 border-b border-slate-800">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-400" />
              Top Categories
            </h3>
          </div>
          <div className="divide-y divide-slate-800">
            {topCategories.slice(0, 5).map((cat, index) => {
              const maxTotal = topCategories[0]?.total || 1
              const percentage = ((cat.total || 0) / maxTotal) * 100
              return (
                <div key={index} className="p-4 hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                        <Tags size={16} className="text-violet-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{cat.category__name || 'Uncategorized'}</p>
                        <p className="text-sm text-slate-500">{cat.count} expenses</p>
                      </div>
                    </div>
                    <span className="font-semibold text-white">
                      ৳{parseFloat(cat.total || 0).toLocaleString('en-BD')}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {topCategories.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                No category data yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-slate-900 rounded-xl border border-slate-800">
        <div className="p-5 border-b border-slate-800">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <BarChart3 size={18} className="text-blue-400" />
            Monthly Trends (Last 6 Months)
          </h3>
        </div>
        <div className="p-5">
          {monthlyTrends.length > 0 ? (
            <div className="space-y-4">
              {monthlyTrends.map((month, index) => {
                const maxTotal = Math.max(...monthlyTrends.map(m => m.total || 0))
                const percentage = maxTotal > 0 ? ((month.total || 0) / maxTotal) * 100 : 0
                const date = new Date(month.month)
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">
                        {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </span>
                      <div className="text-right">
                        <span className="font-medium text-white">
                          ৳{parseFloat(month.total || 0).toLocaleString('en-BD')}
                        </span>
                        <span className="text-sm text-slate-500 ml-2">
                          ({month.count} expenses by {month.unique_users} users)
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center text-slate-500 py-8">
              No monthly data available
            </div>
          )}
        </div>
      </div>

      {/* Role Distribution */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
        <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
          <Users size={18} className="text-pink-400" />
          User Role Distribution
        </h3>
        <div className="flex flex-wrap gap-4">
          {roleDistribution.map((role, index) => (
            <div 
              key={index}
              className={`px-5 py-3 rounded-xl ${
                role.role === 'Admin' 
                  ? 'bg-amber-500/10 border border-amber-500/20' 
                  : 'bg-violet-500/10 border border-violet-500/20'
              }`}
            >
              <p className={`text-2xl font-bold ${
                role.role === 'Admin' ? 'text-amber-400' : 'text-violet-400'
              }`}>
                {role.count}
              </p>
              <p className="text-sm text-slate-400">{role.role}s</p>
            </div>
          ))}
        </div>
      </div>

      {/* Database Stats */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
        <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
          <Activity size={18} className="text-cyan-400" />
          Database Statistics
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {health?.database && Object.entries(health.database).map(([key, value]) => (
            <div key={key} className="text-center">
              <p className="text-2xl font-bold text-white">{value?.toLocaleString()}</p>
              <p className="text-sm text-slate-500 capitalize">{key}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
