import { useState } from 'react'
import { Wallet, ArrowRight, Sparkles, Target, TrendingUp, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useOnboarding } from '../context/OnboardingContext'

export default function WelcomeModal({ onClose, onStartSetup }) {
  const { user } = useAuth()
  const { markWelcomeSeen } = useOnboarding()

  const firstName = user?.first_name || user?.username?.split('@')[0] || 'there'

  const handleGetStarted = () => {
    markWelcomeSeen()
    onClose()
  }

  const handleQuickSetup = () => {
    markWelcomeSeen()
    onStartSetup()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-3xl w-full max-w-lg border border-slate-800 overflow-hidden animate-slide-up">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-violet-600 to-fuchsia-600 p-8 text-center">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50"></div>
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-4 shadow-2xl">
              <Wallet size={40} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Welcome, {firstName}! 👋
            </h1>
            <p className="text-white/80">
              Let's set up your expense tracking in under 2 minutes
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Value props */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle size={20} className="text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-white">Track where your money goes</p>
                <p className="text-sm text-slate-400">Log expenses in seconds, anytime</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                <Target size={20} className="text-violet-400" />
              </div>
              <div>
                <p className="font-medium text-white">Stay within budget</p>
                <p className="text-sm text-slate-400">Set limits and get alerts before overspending</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp size={20} className="text-fuchsia-400" />
              </div>
              <div>
                <p className="font-medium text-white">See spending insights</p>
                <p className="text-sm text-slate-400">Understand your habits with visual reports</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={handleGetStarted}
              className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-semibold text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25"
            >
              <Sparkles size={18} />
              Start Tracking
              <ArrowRight size={18} />
            </button>
            <button
              onClick={handleQuickSetup}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium text-slate-300 transition-colors"
            >
              Set Up Budget First
            </button>
          </div>

          <p className="text-center text-slate-500 text-sm mt-4">
            You can always set up your budget later in Settings
          </p>
        </div>
      </div>
    </div>
  )
}
