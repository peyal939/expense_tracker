import { Link } from 'react-router-dom'
import { 
  TrendingUp, PiggyBank, BarChart3, Shield, CheckCircle, 
  ArrowRight, Sparkles, Target, Bell, Download 
} from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-900/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                <PiggyBank className="text-white" size={24} />
              </div>
              <span className="text-xl font-bold text-white">ExpenseTracker</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-lg font-medium text-white hover:opacity-90 transition-opacity"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-300 text-sm mb-4 sm:mb-6">
              <Sparkles size={14} />
              <span>Smart Financial Management</span>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              Take Control of Your
              <span className="block bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                Financial Future
              </span>
            </h1>
            <p className="text-base sm:text-xl text-slate-400 mb-6 sm:mb-8 leading-relaxed">
              Track expenses, set budgets, and gain insights into your spending habits with our intuitive expense tracking platform. Make informed financial decisions effortlessly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-start justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/30 text-sm sm:text-base"
              >
                Start Free Today
                <ArrowRight size={18} className="sm:w-5 sm:h-5" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold text-white transition-colors text-sm sm:text-base"
              >
                Learn More
              </a>
            </div>
          </div>
          
          {/* Hero Illustration - Hidden on very small screens */}
          <div className="relative hidden sm:block">
            <div className="absolute -inset-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-3xl opacity-20 blur-3xl"></div>
            <div className="relative bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-4 sm:p-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <TrendingUp className="text-emerald-400" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Monthly Budget</p>
                      <p className="text-lg font-bold text-white">$3,500</p>
                    </div>
                  </div>
                  <div className="text-emerald-400 text-sm font-medium">On Track</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-800/50 rounded-xl">
                    <p className="text-sm text-slate-400 mb-1">Spent</p>
                    <p className="text-2xl font-bold text-white">$2,240</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-xl">
                    <p className="text-sm text-slate-400 mb-1">Remaining</p>
                    <p className="text-2xl font-bold text-violet-400">$1,260</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 border-t border-slate-800/50">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
            Everything You Need to Manage Your Finances
          </h2>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto px-4">
            Powerful features designed to give you complete visibility and control over your spending
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Feature 1 */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-violet-500/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4">
              <Target className="text-violet-400" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Smart Budgeting</h3>
            <p className="text-slate-400">
              Set monthly budgets and allocate spending limits across categories. Get real-time alerts before overspending.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-fuchsia-500/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-fuchsia-500/10 flex items-center justify-center mb-4">
              <BarChart3 className="text-fuchsia-400" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Visual Reports</h3>
            <p className="text-slate-400">
              Understand your spending patterns with beautiful charts and detailed analytics. Make data-driven decisions.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <CheckCircle className="text-emerald-400" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Easy Tracking</h3>
            <p className="text-slate-400">
              Log expenses in seconds with our intuitive interface. Categorize automatically and track every transaction.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-amber-500/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
              <Bell className="text-amber-400" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Smart Alerts</h3>
            <p className="text-slate-400">
              Receive notifications when approaching budget limits. Stay informed about your financial health.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-cyan-500/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4">
              <Download className="text-cyan-400" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Export Reports</h3>
            <p className="text-slate-400">
              Download your financial data as CSV or PDF. Perfect for tax season or personal record keeping.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-rose-500/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center mb-4">
              <Shield className="text-rose-400" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Secure & Private</h3>
            <p className="text-slate-400">
              Your financial data is encrypted and secure. We prioritize your privacy and data protection.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
              Ready to Transform Your Financial Life?
            </h2>
            <p className="text-base sm:text-xl text-white/80 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Join thousands of users who are taking control of their finances with ExpenseTracker
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white text-violet-600 rounded-xl font-semibold hover:bg-slate-100 transition-colors shadow-xl text-sm sm:text-base"
            >
              Create Free Account
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                <PiggyBank className="text-white" size={18} />
              </div>
              <span className="font-semibold text-white">ExpenseTracker</span>
            </div>
            <p className="text-slate-500 text-sm">
              © 2026 ExpenseTracker. Built for smarter financial management.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
