import { useState, useEffect } from 'react'
import {
  Users, Receipt, Tags, PiggyBank, TrendingUp,
  Loader2, Crown, DollarSign,
} from 'lucide-react'
import { adminAPI } from '../services/api'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getDashboard()
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching admin stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400 mt-1">System overview and statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative">
            <DollarSign size={24} className="text-white/80 mb-2" />
            <p className="text-white/80 text-sm">Total Expenses</p>
            <p className="text-2xl font-bold text-white mt-1">
              ৳{parseFloat(stats?.total_expenses || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <Receipt size={24} className="text-blue-400 mb-2" />
          <p className="text-slate-400 text-sm">Total Transactions</p>
          <p className="text-2xl font-bold text-white mt-1">
            {stats?.total_count || 0}
          </p>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <Users size={24} className="text-emerald-400 mb-2" />
          <p className="text-slate-400 text-sm">Total Users</p>
          <p className="text-2xl font-bold text-white mt-1">
            {stats?.total_users || 0}
          </p>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <Tags size={24} className="text-amber-400 mb-2" />
          <p className="text-slate-400 text-sm">Categories</p>
          <p className="text-2xl font-bold text-white mt-1">
            {stats?.total_categories || 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Spenders */}
        <div className="bg-slate-900 rounded-xl border border-slate-800">
          <div className="p-5 border-b border-slate-800">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Crown size={18} className="text-amber-400" />
              Top Spenders
            </h3>
          </div>
          <div className="divide-y divide-slate-800">
            {stats?.top_spenders?.slice(0, 5).map((user, index) => (
              <div key={user.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                    index === 0 ? 'bg-amber-500/20 text-amber-400' :
                    index === 1 ? 'bg-slate-400/20 text-slate-300' :
                    index === 2 ? 'bg-orange-500/20 text-orange-400' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-white">{user.username}</p>
                    <p className="text-sm text-slate-500">{user.expense_count} expenses</p>
                  </div>
                </div>
                <span className="font-semibold text-white">
                  ৳{parseFloat(user.total_spent || 0).toFixed(2)}
                </span>
              </div>
            ))}
            {(!stats?.top_spenders || stats.top_spenders.length === 0) && (
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
            {stats?.top_categories?.slice(0, 5).map((cat, index) => (
              <div key={index} className="flex items-center justify-between p-4">
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
                  ৳{parseFloat(cat.total || 0).toFixed(2)}
                </span>
              </div>
            ))}
            {(!stats?.top_categories || stats.top_categories.length === 0) && (
              <div className="p-8 text-center text-slate-500">
                No category data yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Budgets */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
        <div className="flex items-center gap-2 mb-4">
          <PiggyBank size={18} className="text-pink-400" />
          <h3 className="font-semibold text-white">Active Budgets</h3>
        </div>
        <p className="text-3xl font-bold text-white">{stats?.active_budgets || 0}</p>
        <p className="text-slate-500 text-sm mt-1">budgets set across all users</p>
      </div>
    </div>
  )
}
