import { useState } from 'react'
import { 
  ChevronRight, CheckCircle, Circle, Wallet, PiggyBank, 
  BarChart3, Target, X, Sparkles 
} from 'lucide-react'
import { useOnboarding } from '../context/OnboardingContext'
import { Link } from 'react-router-dom'

const steps = [
  {
    id: 'expense',
    title: 'Add your first expense',
    description: 'Start tracking by adding any recent purchase',
    icon: Wallet,
    action: { label: 'Add Expense', onClick: 'addExpense' },
    color: 'violet'
  },
  {
    id: 'budget',
    title: 'Set your monthly budget',
    description: 'Define how much you want to spend each month',
    icon: PiggyBank,
    action: { label: 'Set Budget', to: '/budgets' },
    color: 'emerald'
  },
  {
    id: 'categories',
    title: 'Allocate budget to categories',
    description: 'Distribute your budget across spending categories',
    icon: Target,
    action: { label: 'Manage Allocations', to: '/budgets' },
    color: 'fuchsia'
  },
  {
    id: 'reports',
    title: 'Check your reports',
    description: 'See spending trends and insights after a few days',
    icon: BarChart3,
    action: { label: 'View Reports', to: '/reports' },
    color: 'amber'
  }
]

export default function GettingStartedChecklist({ onAddExpense, onDismiss, className = '' }) {
  const { hasAddedFirstExpense, hasSetBudget, hasViewedReports, expenseCount } = useOnboarding()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const completedSteps = {
    expense: hasAddedFirstExpense,
    budget: hasSetBudget,
    categories: hasSetBudget, // Same trigger for now
    reports: hasViewedReports || expenseCount >= 5
  }

  const completedCount = Object.values(completedSteps).filter(Boolean).length
  const progress = (completedCount / steps.length) * 100

  // Hide if all steps completed
  if (completedCount === steps.length) return null

  const handleDismiss = () => {
    setDismissed(true)
    if (onDismiss) onDismiss()
  }

  const colorClasses = {
    violet: { bg: 'bg-violet-500/10', icon: 'text-violet-400', border: 'border-violet-500/20' },
    emerald: { bg: 'bg-emerald-500/10', icon: 'text-emerald-400', border: 'border-emerald-500/20' },
    fuchsia: { bg: 'bg-fuchsia-500/10', icon: 'text-fuchsia-400', border: 'border-fuchsia-500/20' },
    amber: { bg: 'bg-amber-500/10', icon: 'text-amber-400', border: 'border-amber-500/20' }
  }

  return (
    <div className={`bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="text-violet-400" size={20} />
            <h3 className="font-semibold text-white">Getting Started</h3>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        
        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm text-slate-400">{completedCount}/{steps.length}</span>
        </div>
      </div>

      {/* Steps */}
      <div className="divide-y divide-slate-800">
        {steps.map((step) => {
          const isCompleted = completedSteps[step.id]
          const colors = colorClasses[step.color]
          const Icon = step.icon

          return (
            <div 
              key={step.id}
              className={`p-4 ${isCompleted ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isCompleted ? 'bg-emerald-500/10' : colors.bg
                }`}>
                  {isCompleted ? (
                    <CheckCircle size={20} className="text-emerald-400" />
                  ) : (
                    <Icon size={20} className={colors.icon} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium ${isCompleted ? 'text-slate-400 line-through' : 'text-white'}`}>
                      {step.title}
                    </p>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{step.description}</p>
                </div>
                {!isCompleted && (
                  <div className="flex-shrink-0">
                    {step.action.to ? (
                      <Link
                        to={step.action.to}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${colors.bg} ${colors.icon} hover:opacity-80`}
                      >
                        {step.action.label}
                        <ChevronRight size={14} />
                      </Link>
                    ) : (
                      <button
                        onClick={onAddExpense}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${colors.bg} ${colors.icon} hover:opacity-80`}
                      >
                        {step.action.label}
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
