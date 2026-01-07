import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  User, Mail, Shield, Download, Loader2, Check,
  Moon, Bell, Lock,
} from 'lucide-react'
import { exportAPI } from '../services/api'

export default function Settings() {
  const { user } = useAuth()
  const [exporting, setExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)

  const handleExportData = async () => {
    setExporting(true)
    try {
      const response = await exportAPI.getBackup()
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `expense_backup_${new Date().toISOString().split('T')[0]}.json`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      setExportSuccess(true)
      setTimeout(() => setExportSuccess(false), 3000)
    } catch (error) {
      console.error('Error exporting data:', error)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h2 className="font-semibold text-white">Profile</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-2xl font-bold text-white">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-lg font-semibold text-white">{user?.username}</p>
              <p className="text-slate-400">{user?.email || 'No email set'}</p>
            </div>
          </div>

          <div className="grid gap-4 pt-4">
            <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl">
              <User size={20} className="text-slate-400" />
              <div className="flex-1">
                <p className="text-sm text-slate-400">Username</p>
                <p className="text-white">{user?.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl">
              <Mail size={20} className="text-slate-400" />
              <div className="flex-1">
                <p className="text-sm text-slate-400">Email</p>
                <p className="text-white">{user?.email || 'Not set'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl">
              <Shield size={20} className="text-slate-400" />
              <div className="flex-1">
                <p className="text-sm text-slate-400">Role</p>
                <div className="flex items-center gap-2 mt-1">
                  {user?.roles?.map((role, i) => (
                    <span
                      key={i}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        role === 'Admin'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-violet-500/10 text-violet-400'
                      }`}
                    >
                      {role}
                    </span>
                  ))}
                  {user?.is_superuser && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400">
                      Superuser
                    </span>
                  )}
                  {(!user?.roles || user.roles.length === 0) && !user?.is_superuser && (
                    <span className="text-slate-500">Standard User</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h2 className="font-semibold text-white">Preferences</h2>
        </div>
        <div className="divide-y divide-slate-800">
          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                <Moon size={20} className="text-slate-400" />
              </div>
              <div>
                <p className="font-medium text-white">Dark Mode</p>
                <p className="text-sm text-slate-500">Always on</p>
              </div>
            </div>
            <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-sm rounded-full">
              Enabled
            </div>
          </div>

          <div className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                <Bell size={20} className="text-slate-400" />
              </div>
              <div>
                <p className="font-medium text-white">Budget Alerts</p>
                <p className="text-sm text-slate-500">Get notified when approaching limits</p>
              </div>
            </div>
            <div className="px-3 py-1 bg-slate-700 text-slate-400 text-sm rounded-full">
              Coming Soon
            </div>
          </div>
        </div>
      </div>

      {/* Data Section */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h2 className="font-semibold text-white">Data & Privacy</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Download size={20} className="text-slate-400" />
              <div>
                <p className="font-medium text-white">Export Your Data</p>
                <p className="text-sm text-slate-500">Download all your expenses and settings</p>
              </div>
            </div>
            <button
              onClick={handleExportData}
              disabled={exporting}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                exportSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-violet-600 text-white hover:bg-violet-500'
              } disabled:opacity-50`}
            >
              {exporting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Exporting...
                </>
              ) : exportSuccess ? (
                <>
                  <Check size={18} />
                  Downloaded!
                </>
              ) : (
                'Export'
              )}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
            <div className="flex items-center gap-3">
              <Lock size={20} className="text-slate-400" />
              <div>
                <p className="font-medium text-white">Change Password</p>
                <p className="text-sm text-slate-500">Update your account password</p>
              </div>
            </div>
            <div className="px-3 py-1 bg-slate-700 text-slate-400 text-sm rounded-full">
              Coming Soon
            </div>
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className="text-center text-slate-500 text-sm py-4">
        <p>ExpenseTracker v1.0.0</p>
        <p className="mt-1">© 2026 All rights reserved</p>
      </div>
    </div>
  )
}
