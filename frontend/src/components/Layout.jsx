import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { notificationsAPI, budgetsAPI } from '../services/api'
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
  Bell,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
} from 'lucide-react'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/expenses', icon: Receipt, label: 'Expenses' },
  { path: '/categories', icon: Tags, label: 'Categories' },
  { path: '/budgets', icon: PiggyBank, label: 'Budgets' },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
]

const adminItems = [
  { path: '/admin', icon: Shield, label: 'Dashboard' },
  { path: '/admin/users', icon: Users, label: 'Users' },
  { path: '/admin/categories', icon: Tags, label: 'Categories' },
  { path: '/admin/income-sources', icon: Wallet, label: 'Income Sources' },
  { path: '/admin/expenses', icon: Receipt, label: 'All Expenses' },
  { path: '/admin/notifications', icon: Bell, label: 'Notifications' },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [adminMenuOpen, setAdminMenuOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [warnings, setWarnings] = useState([])
  const [showWarningsModal, setShowWarningsModal] = useState(false)
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  // Fetch notifications and warnings on mount
  useEffect(() => {
    fetchNotifications()
    fetchWarnings()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await notificationsAPI.getUnread()
      const data = response.data?.notifications ?? response.data
      setNotifications(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const fetchWarnings = async () => {
    try {
      const now = new Date()
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      const response = await budgetsAPI.getWarnings(month)
      const warningData = response.data?.warnings ?? response.data
      const warningList = Array.isArray(warningData) ? warningData : []
      setWarnings(warningList)
      
      // Show modal if there are warnings (first login check)
      if (warningList.length > 0 && !sessionStorage.getItem('warnings_shown')) {
        setShowWarningsModal(true)
        sessionStorage.setItem('warnings_shown', 'true')
      }
    } catch (error) {
      console.error('Error fetching warnings:', error)
    }
  }

  const markNotificationRead = async (id) => {
    try {
      await notificationsAPI.markSingleRead(id)
      setNotifications(notifications.filter(n => n.id !== id))
    } catch (error) {
      console.error('Error marking notification read:', error)
    }
  }

  const markAllRead = async () => {
    try {
      await notificationsAPI.markRead()
      setNotifications([])
    } catch (error) {
      console.error('Error marking all read:', error)
    }
  }

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
          <div className="flex items-center gap-2">
            {/* Notification Bell - Mobile */}
            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="p-2 hover:bg-slate-800 rounded-xl transition-colors relative"
              >
                <Bell size={22} />
                {(notifications.length > 0 || warnings.length > 0) && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
                )}
              </button>
            </div>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>
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
        {/* Desktop Notification Bar */}
        <div className="hidden lg:flex items-center justify-end gap-4 px-8 py-4 border-b border-slate-800">
          {/* Notification Bell - Desktop */}
          <div className="relative">
            <button
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="p-2 hover:bg-slate-800 rounded-xl transition-colors relative"
            >
              <Bell size={22} className="text-slate-400" />
              {(notifications.length > 0 || warnings.length > 0) && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></span>
              )}
            </button>
          </div>
        </div>

        {/* Notification Dropdown */}
        {notificationOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setNotificationOpen(false)}
            />
            <div className="fixed right-4 top-16 lg:right-8 lg:top-14 z-50 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-slide-up">
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <h3 className="font-semibold text-white">Notifications</h3>
                {notifications.length > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-sm text-violet-400 hover:text-violet-300"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {/* Budget Warnings */}
                {warnings.map((warning, idx) => (
                  <div key={`warning-${idx}`} className="p-4 border-b border-slate-800 hover:bg-slate-800/50">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        warning.warning_type.includes('exceeded') 
                          ? 'bg-rose-500/10' 
                          : 'bg-amber-500/10'
                      }`}>
                        {warning.warning_type.includes('exceeded') ? (
                          <AlertCircle size={16} className="text-rose-400" />
                        ) : (
                          <AlertTriangle size={16} className="text-amber-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white text-sm">{warning.title}</p>
                        <p className="text-xs text-slate-400 mt-1">{warning.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Other Notifications */}
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-4 border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer"
                    onClick={() => markNotificationRead(notif.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center">
                        <TrendingUp size={16} className="text-violet-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white text-sm">{notif.title}</p>
                        <p className="text-xs text-slate-400 mt-1">{notif.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {notifications.length === 0 && warnings.length === 0 && (
                  <div className="p-8 text-center text-slate-500">
                    <Bell size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No notifications</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Warnings Modal (shown on login) */}
        {showWarningsModal && warnings.length > 0 && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-800 overflow-hidden animate-slide-up">
              <div className="flex items-center justify-between p-5 border-b border-slate-800">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className="text-amber-400" size={20} />
                  Budget Alerts
                </h3>
                <button
                  onClick={() => setShowWarningsModal(false)}
                  className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <div className="p-5 space-y-3 max-h-80 overflow-y-auto">
                {warnings.map((warning, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl ${
                      warning.warning_type.includes('exceeded')
                        ? 'bg-rose-500/10 border border-rose-500/20'
                        : 'bg-amber-500/10 border border-amber-500/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {warning.warning_type.includes('exceeded') ? (
                        <AlertCircle className="text-rose-400 mt-0.5" size={18} />
                      ) : (
                        <AlertTriangle className="text-amber-400 mt-0.5" size={18} />
                      )}
                      <div>
                        <p className={`font-medium ${
                          warning.warning_type.includes('exceeded') ? 'text-rose-400' : 'text-amber-400'
                        }`}>
                          {warning.title}
                        </p>
                        <p className="text-sm text-slate-300 mt-1">{warning.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-5 border-t border-slate-800">
                <button
                  onClick={() => setShowWarningsModal(false)}
                  className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
