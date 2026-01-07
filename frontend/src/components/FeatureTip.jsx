import { useState, useEffect } from 'react'
import { X, Lightbulb, ArrowRight } from 'lucide-react'
import { useOnboarding } from '../context/OnboardingContext'

const featureTips = {
  budget: {
    title: 'Set a Budget',
    description: 'Define monthly spending limits to stay on track. Get alerts when you\'re close to your limit.',
    action: 'Set Budget',
    icon: '💰'
  },
  categories: {
    title: 'Organize by Category',
    description: 'Create custom categories to see exactly where your money goes each month.',
    action: 'Manage Categories',
    icon: '📁'
  },
  reports: {
    title: 'View Spending Reports',
    description: 'Check out your reports to see trends and insights about your spending habits.',
    action: 'View Reports',
    icon: '📊'
  },
  recurring: {
    title: 'Track Recurring Expenses',
    description: 'Mark expenses as recurring to automatically track subscriptions and bills.',
    action: 'Learn More',
    icon: '🔄'
  },
  export: {
    title: 'Export Your Data',
    description: 'Download your expense history as CSV or PDF for your records or tax purposes.',
    action: 'Export Data',
    icon: '📥'
  },
  ai: {
    title: 'AI-Powered Insights',
    description: 'Get smart suggestions and analysis of your spending patterns powered by AI.',
    action: 'Try AI Insights',
    icon: '🤖'
  }
}

export default function FeatureTip({ tipId, position = 'bottom', onAction, className = '' }) {
  const { isTipDismissed, dismissFeatureTip, showFeatureTips } = useOnboarding()
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const tip = featureTips[tipId]

  useEffect(() => {
    // Delay showing tip for smooth UX
    if (showFeatureTips && !isTipDismissed(tipId)) {
      const timer = setTimeout(() => {
        setIsAnimating(true)
        setTimeout(() => setIsVisible(true), 50)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [showFeatureTips, tipId, isTipDismissed])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => {
      setIsAnimating(false)
      dismissFeatureTip(tipId)
    }, 300)
  }

  const handleAction = () => {
    handleDismiss()
    if (onAction) onAction()
  }

  if (!tip || !showFeatureTips || isTipDismissed(tipId) || !isAnimating) {
    return null
  }

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2'
  }

  return (
    <div className={`absolute z-50 ${positionClasses[position]} ${className}`}>
      <div className={`bg-slate-800 rounded-xl border border-violet-500/30 shadow-xl shadow-violet-500/10 w-72 overflow-hidden transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
        {/* Header */}
        <div className="bg-violet-500/10 px-4 py-3 flex items-center justify-between border-b border-violet-500/20">
          <div className="flex items-center gap-2">
            <span className="text-lg">{tip.icon}</span>
            <span className="text-sm font-medium text-violet-300">Feature Tip</span>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <h4 className="font-semibold text-white mb-1">{tip.title}</h4>
          <p className="text-sm text-slate-400 mb-3">{tip.description}</p>
          
          {onAction && (
            <button
              onClick={handleAction}
              className="text-sm text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1 group"
            >
              {tip.action}
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>

        {/* Arrow pointer */}
        {position === 'bottom' && (
          <div className="absolute -top-2 left-6 w-4 h-4 bg-slate-800 border-l border-t border-violet-500/30 transform rotate-45"></div>
        )}
        {position === 'top' && (
          <div className="absolute -bottom-2 left-6 w-4 h-4 bg-slate-800 border-r border-b border-violet-500/30 transform rotate-45"></div>
        )}
      </div>
    </div>
  )
}

// Inline tip variant for simpler use cases
export function InlineFeatureTip({ tipId, onAction }) {
  const { isTipDismissed, dismissFeatureTip, showFeatureTips } = useOnboarding()
  const [isVisible, setIsVisible] = useState(true)
  
  const tip = featureTips[tipId]

  if (!tip || !showFeatureTips || isTipDismissed(tipId) || !isVisible) {
    return null
  }

  const handleDismiss = () => {
    setIsVisible(false)
    dismissFeatureTip(tipId)
  }

  return (
    <div className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 rounded-xl border border-violet-500/20 p-4 mb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
            <Lightbulb size={20} className="text-violet-400" />
          </div>
          <div>
            <h4 className="font-medium text-white flex items-center gap-2">
              {tip.icon} {tip.title}
            </h4>
            <p className="text-sm text-slate-400 mt-1">{tip.description}</p>
            {onAction && (
              <button
                onClick={() => {
                  handleDismiss()
                  onAction()
                }}
                className="text-sm text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1 mt-2 group"
              >
                {tip.action}
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex-shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
