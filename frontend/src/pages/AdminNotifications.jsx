import { useState, useEffect } from 'react'
import {
  Bell, Send, Loader2, X, Users, CheckCircle2,
  AlertCircle, Info, MessageSquare,
} from 'lucide-react'
import { adminPanelAPI, usersAPI } from '../services/api'

export default function AdminNotifications() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)
  const [sending, setSending] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
  })
  const [result, setResult] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        adminPanelAPI.notifications.getStats(),
        usersAPI.list()
      ])
      setStats(statsRes.data)
      setUsers(usersRes.data.results || usersRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBroadcast = async (e) => {
    e.preventDefault()
    setSending(true)
    try {
      const response = await adminPanelAPI.notifications.broadcast(
        broadcastForm.title,
        broadcastForm.message,
        selectedUsers.length > 0 ? selectedUsers : undefined
      )
      setResult({
        success: true,
        message: response.data.message
      })
      setBroadcastForm({ title: '', message: '' })
      setSelectedUsers([])
      fetchData()
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to send notification'
      })
    } finally {
      setSending(false)
    }
  }

  const toggleUserSelection = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId))
    } else {
      setSelectedUsers([...selectedUsers, userId])
    }
  }

  const selectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map(u => u.id))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Notification Management</h1>
          <p className="text-slate-400 mt-1">View stats and broadcast notifications</p>
        </div>
        <button
          onClick={() => setShowBroadcastModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-medium text-white hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/30"
        >
          <Send size={20} />
          Broadcast Notification
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Bell size={24} className="text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.total || 0}</p>
              <p className="text-sm text-slate-500">Total Notifications</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <AlertCircle size={24} className="text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.unread || 0}</p>
              <p className="text-sm text-slate-500">Unread</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 size={24} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.read || 0}</p>
              <p className="text-sm text-slate-500">Read</p>
            </div>
          </div>
        </div>
      </div>

      {/* By Type */}
      <div className="bg-slate-900 rounded-xl border border-slate-800">
        <div className="p-5 border-b border-slate-800">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <MessageSquare size={18} className="text-blue-400" />
            Notifications by Type
          </h3>
        </div>
        <div className="p-5">
          {stats?.by_type && stats.by_type.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.by_type.map((type, index) => (
                <div key={index} className="bg-slate-800 rounded-xl p-4">
                  <p className="text-2xl font-bold text-white">{type.count}</p>
                  <p className="text-sm text-slate-400 capitalize">
                    {type.notification_type.replace(/_/g, ' ')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">No notification data</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
        <h3 className="font-semibold text-white mb-4">Quick Broadcast Templates</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => {
              setBroadcastForm({
                title: 'System Maintenance',
                message: 'We will be performing scheduled maintenance. The system may be temporarily unavailable.'
              })
              setShowBroadcastModal(true)
            }}
            className="p-4 bg-slate-800 rounded-xl text-left hover:bg-slate-700 transition-colors"
          >
            <Info size={20} className="text-blue-400 mb-2" />
            <p className="font-medium text-white">System Maintenance</p>
            <p className="text-sm text-slate-500">Notify about scheduled maintenance</p>
          </button>
          <button
            onClick={() => {
              setBroadcastForm({
                title: 'New Feature Available',
                message: 'We\'ve added exciting new features! Check out the latest updates in your dashboard.'
              })
              setShowBroadcastModal(true)
            }}
            className="p-4 bg-slate-800 rounded-xl text-left hover:bg-slate-700 transition-colors"
          >
            <CheckCircle2 size={20} className="text-emerald-400 mb-2" />
            <p className="font-medium text-white">New Feature</p>
            <p className="text-sm text-slate-500">Announce new features</p>
          </button>
          <button
            onClick={() => {
              setBroadcastForm({
                title: 'Monthly Reminder',
                message: 'Don\'t forget to review your expenses and update your budget for this month!'
              })
              setShowBroadcastModal(true)
            }}
            className="p-4 bg-slate-800 rounded-xl text-left hover:bg-slate-700 transition-colors"
          >
            <Bell size={20} className="text-amber-400 mb-2" />
            <p className="font-medium text-white">Monthly Reminder</p>
            <p className="text-sm text-slate-500">Budget review reminder</p>
          </button>
        </div>
      </div>

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl w-full max-w-2xl border border-slate-800 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900">
              <h3 className="text-lg font-semibold text-white">Broadcast Notification</h3>
              <button
                onClick={() => {
                  setShowBroadcastModal(false)
                  setResult(null)
                }}
                className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {result ? (
              <div className="p-5">
                <div className={`p-4 rounded-xl ${
                  result.success 
                    ? 'bg-emerald-500/10 border border-emerald-500/20' 
                    : 'bg-rose-500/10 border border-rose-500/20'
                }`}>
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle2 className="text-emerald-400" size={24} />
                    ) : (
                      <AlertCircle className="text-rose-400" size={24} />
                    )}
                    <p className={result.success ? 'text-emerald-400' : 'text-rose-400'}>
                      {result.message}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowBroadcastModal(false)
                    setResult(null)
                  }}
                  className="w-full mt-4 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleBroadcast} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={broadcastForm.title}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                    placeholder="Notification title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Message
                  </label>
                  <textarea
                    value={broadcastForm.message}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                    required
                    rows={4}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
                    placeholder="Notification message"
                  />
                </div>
                
                {/* User Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-300">
                      Recipients ({selectedUsers.length === 0 ? 'All Users' : `${selectedUsers.length} selected`})
                    </label>
                    <button
                      type="button"
                      onClick={selectAllUsers}
                      className="text-sm text-violet-400 hover:text-violet-300"
                    >
                      {selectedUsers.length === users.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="bg-slate-800 rounded-xl p-3 max-h-48 overflow-y-auto">
                    <p className="text-xs text-slate-500 mb-2">Leave empty to send to all users</p>
                    <div className="space-y-2">
                      {users.map((user) => (
                        <label
                          key={user.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="w-4 h-4 rounded border-slate-600 text-violet-600 focus:ring-violet-500 bg-slate-700"
                          />
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-semibold text-white">
                              {user.username[0].toUpperCase()}
                            </div>
                            <span className="text-white">{user.username}</span>
                            <span className="text-slate-500 text-sm">({user.email})</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowBroadcastModal(false)}
                    className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Send Notification
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
