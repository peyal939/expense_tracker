import { useEffect, useState } from 'react'
import { CheckCircle, Sparkles, ArrowRight, X } from 'lucide-react'
import confetti from 'canvas-confetti'

export default function FirstExpenseSuccess({ expenseData, onClose, onViewDashboard, onAddAnother }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Animate in
    setTimeout(() => setShow(true), 100)

    // Trigger confetti
    const duration = 1500
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ['#8b5cf6', '#d946ef', '#f472b6', '#818cf8']
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ['#8b5cf6', '#d946ef', '#f472b6', '#818cf8']
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()
  }, [])

  const handleClose = () => {
    setShow(false)
    setTimeout(onClose, 300)
  }

  return (
    <div className={`fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`bg-slate-900 rounded-3xl w-full max-w-md border border-slate-800 overflow-hidden transition-all duration-500 ${show ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>

        {/* Success animation area */}
        <div className="relative bg-gradient-to-br from-emerald-600 to-teal-600 p-10 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]"></div>
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-4 animate-bounce-slow">
              <CheckCircle size={48} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Great Start! 🎉
            </h1>
            <p className="text-white/80">
              You just logged your first expense
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Expense summary */}
          {expenseData && (
            <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">Amount</span>
                <span className="text-xl font-bold text-white">${parseFloat(expenseData.amount).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Category</span>
                <span className="text-slate-200">{expenseData.category_name || expenseData.category}</span>
              </div>
              {expenseData.description && (
                <div className="flex items-center justify-between mt-2">
                  <span className="text-slate-400">Note</span>
                  <span className="text-slate-200 truncate ml-4">{expenseData.description}</span>
                </div>
              )}
            </div>
          )}

          {/* Next steps */}
          <div className="bg-violet-500/10 rounded-xl p-4 mb-6 border border-violet-500/20">
            <div className="flex items-start gap-3">
              <Sparkles size={18} className="text-violet-400 mt-0.5" />
              <div>
                <p className="text-sm text-violet-200 font-medium">Keep it up!</p>
                <p className="text-sm text-slate-400 mt-1">
                  Add a few more expenses to see your spending patterns and get personalized insights.
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={onAddAnother}
              className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-semibold text-white hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              Add Another Expense
            </button>
            <button
              onClick={onViewDashboard}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium text-slate-300 transition-colors flex items-center justify-center gap-2"
            >
              View Dashboard
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
