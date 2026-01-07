import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Categories from './pages/Categories'
import Budgets from './pages/Budgets'
import Reports from './pages/Reports'
import AdminDashboard from './pages/AdminDashboard'
import UserManagement from './pages/UserManagement'
import AdminCategories from './pages/AdminCategories'
import AdminIncomeSources from './pages/AdminIncomeSources'
import AdminExpenses from './pages/AdminExpenses'
import AdminNotifications from './pages/AdminNotifications'
import Settings from './pages/Settings'
import { Loader2 } from 'lucide-react'

// Protected Route wrapper
function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/landing" replace />
  }

  if (adminOnly && !user.is_superuser && !user.roles?.includes('Admin')) {
    return <Navigate to="/" replace />
  }

  return children
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/landing" element={user ? <Navigate to="/" replace /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      
      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="categories" element={<Categories />} />
        <Route path="budgets" element={<Budgets />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        
        {/* Admin routes */}
        <Route path="admin" element={
          <ProtectedRoute adminOnly>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="admin/users" element={
          <ProtectedRoute adminOnly>
            <UserManagement />
          </ProtectedRoute>
        } />
        <Route path="admin/categories" element={
          <ProtectedRoute adminOnly>
            <AdminCategories />
          </ProtectedRoute>
        } />
        <Route path="admin/income-sources" element={
          <ProtectedRoute adminOnly>
            <AdminIncomeSources />
          </ProtectedRoute>
        } />
        <Route path="admin/expenses" element={
          <ProtectedRoute adminOnly>
            <AdminExpenses />
          </ProtectedRoute>
        } />
        <Route path="admin/notifications" element={
          <ProtectedRoute adminOnly>
            <AdminNotifications />
          </ProtectedRoute>
        } />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
