import { Plus, ArrowRight, Wallet, TrendingUp, PiggyBank, Sparkles } from 'lucide-react'

export default function EmptyDashboardState({ onAddExpense, onSetupBudget }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Main CTA Card */}
      <div className="lg:col-span-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Wallet size={24} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Your Dashboard is Ready!</h2>
              <p className="text-slate-400">Let's add your first expense to get started</p>
            </div>
          </div>

          {/* Empty state metrics preview */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-dashed border-slate-700">
              <p className="text-sm text-slate-500 mb-1">Total Spent</p>
              <p className="text-2xl font-bold text-slate-600">$0.00</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-dashed border-slate-700">
              <p className="text-sm text-slate-500 mb-1">This Month</p>
              <p className="text-2xl font-bold text-slate-600">$0.00</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-dashed border-slate-700">
              <p className="text-sm text-slate-500 mb-1">Transactions</p>
              <p className="text-2xl font-bold text-slate-600">0</p>
            </div>
          </div>

          {/* Primary CTA */}
          <button
            onClick={onAddExpense}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-semibold text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 group"
          >
            <Plus size={20} />
            Add Your First Expense
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Tip banner */}
        <div className="bg-violet-500/10 border-t border-violet-500/20 px-8 py-4">
          <div className="flex items-center gap-2 text-violet-300">
            <Sparkles size={16} />
            <p className="text-sm">
              <span className="font-medium">Pro Tip:</span> Start by logging your most recent purchase to see how it works!
            </p>
          </div>
        </div>
      </div>

      {/* Quick Setup Cards */}
      <div className="space-y-4">
        {/* Budget Setup Card */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6 hover:border-emerald-500/50 transition-colors group cursor-pointer"
             onClick={onSetupBudget}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <PiggyBank size={20} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Set Your Budget</h3>
              <p className="text-sm text-slate-400">Define spending limits</p>
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-3">
            Setting a monthly budget helps you stay on track and avoid overspending.
          </p>
          <div className="flex items-center text-emerald-400 text-sm font-medium group-hover:gap-2 transition-all">
            <span>Set up now</span>
            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Reports Preview Card */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-500/20 flex items-center justify-center">
              <TrendingUp size={20} className="text-fuchsia-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Analytics & Reports</h3>
              <p className="text-sm text-slate-400">Coming with data</p>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            Once you add expenses, you'll see beautiful charts and insights about your spending patterns.
          </p>
        </div>
      </div>
    </div>
  )
}
