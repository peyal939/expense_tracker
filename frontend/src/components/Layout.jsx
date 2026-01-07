import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  Receipt,
  Tags,
  PiggyBank,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Users,
  ChevronDown,
  Wallet,
} from 'lucide-react'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/expenses', icon: Receipt, label: 'Expenses' },
  { path: '/categories', icon: Tags, label: 'Categories' },
  { path: '/budgets', icon: PiggyBank, label: 'Budgets' },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
]

const adminItems = [
  { path: '/admin', icon: Shield, label: 'Admin Dashboard' },
  { path: '/admin/users', icon: Users, label: 'User Management' },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [adminMenuOpen, setAdminMenuOpen] = useState(false)
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const NavItem = ({ item, onClick }) => (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
          isActive
            ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`
      }
    >
      <item.icon size={20} />
      <span className="font-medium">{item.label}</span>
    </NavLink>
  )

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
              <Wallet size={20} />
            </div>
            <span className="font-bold text-lg">ExpenseTracker</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
                <Wallet size={20} />
              </div>
              <span className="font-bold text-lg">ExpenseTracker</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <NavItem key={item.path} item={item} onClick={() => setSidebarOpen(false)} />
            ))}

            {/* Admin Section */}
            {isAdmin() && (
              <div className="pt-4 mt-4 border-t border-slate-800">
                <button
                  onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                  className="flex items-center justify-between w-full px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Shield size={20} />
                    <span className="font-medium">Admin</span>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`transform transition-transform ${adminMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {adminMenuOpen && (
                  <div className="mt-2 ml-4 space-y-1">
                    {adminItems.map((item) => (
                      <NavItem key={item.path} item={item} onClick={() => setSidebarOpen(false)} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-slate-800">
            <NavLink
              to="/settings"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-2 ${
                  isActive
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Settings size={20} />
              <span className="font-medium">Settings</span>
            </NavLink>

            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center font-semibold">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user?.username}</p>
                <p className="text-sm text-slate-500 truncate">
                  {user?.roles?.[0] || 'User'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
