import { useState, useEffect } from 'react'
import {
  Plus, Edit2, Trash2, Loader2, X, Search,
  BarChart3, Users, DollarSign, Wallet,
} from 'lucide-react'
import { adminPanelAPI } from '../services/api'

export default function AdminIncomeSources() {
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSource, setEditingSource] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [search, setSearch] = useState('')
  const [usageStats, setUsageStats] = useState(null)
  const [showStatsModal, setShowStatsModal] = useState(false)
  
  const [formData, setFormData] = useState({ name: '' })

  useEffect(() => {
    fetchSources()
  }, [])

  const fetchSources = async () => {
    try {
      const response = await adminPanelAPI.incomeSources.list()
      setSources(response.data.results || response.data)
    } catch (error) {
      console.error('Error fetching income sources:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingSource) {
        await adminPanelAPI.incomeSources.update(editingSource.id, formData)
      } else {
        await adminPanelAPI.incomeSources.create(formData)
      }
      setShowModal(false)
      setEditingSource(null)
      setFormData({ name: '' })
      fetchSources()
    } catch (error) {
      console.error('Error saving income source:', error)
    }
  }

  const handleEdit = (source) => {
    setEditingSource(source)
    setFormData({ name: source.name })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    try {
      await adminPanelAPI.incomeSources.delete(id)
      setDeleteConfirm(null)
      fetchSources()
    } catch (error) {
      console.error('Error deleting income source:', error)
      alert('Cannot delete income source that is in use')
    }
  }

  const handleViewStats = async (source) => {
    try {
      const response = await adminPanelAPI.incomeSources.getUsageStats(source.id)
      setUsageStats({ ...response.data, source })
      setShowStatsModal(true)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const filteredSources = sources.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Income Source Management</h1>
          <p className="text-slate-400 mt-1">Manage system-wide income sources</p>
        </div>
        <button
          onClick={() => {
            setEditingSource(null)
            setFormData({ name: '' })
            setShowModal(true)
          }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-medium text-white hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/30"
        >
          <Plus size={20} />
          Add Income Source
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search income sources..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
        />
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Wallet size={20} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{sources.length}</p>
              <p className="text-sm text-slate-500">Total Income Sources</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {sources.reduce((sum, s) => sum + (s.usage_count || 0), 0).toLocaleString()}
              </p>
              <p className="text-sm text-slate-500">Total Usage</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sources List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        </div>
      ) : (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Source Name</th>
                <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Usage Count</th>
                <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Created</th>
                <th className="text-right text-sm font-medium text-slate-400 px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredSources.map((source) => (
                <tr key={source.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Wallet size={18} className="text-emerald-400" />
                      </div>
                      <span className="font-medium text-white">{source.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-300">{source.usage_count || 0} incomes</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-400">
                      {new Date(source.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewStats(source)}
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="View Stats"
                      >
                        <BarChart3 size={16} />
                      </button>
                      <button
                        onClick={() => handleEdit(source)}
                        className="p-2 text-slate-400 hover:text-violet-400 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(source.id)}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSources.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                    No income sources found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">
                {editingSource ? 'Edit Income Source' : 'Add Income Source'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Source Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  placeholder="e.g., Salary, Freelance, Investments"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  {editingSource ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl w-full max-w-sm border border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Delete Income Source?</h3>
            <p className="text-slate-400 mb-6">
              This action cannot be undone. Sources with incomes cannot be deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStatsModal && usageStats && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">
                {usageStats.source_name} Statistics
              </h3>
              <button
                onClick={() => setShowStatsModal(false)}
                className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800 rounded-xl p-4">
                  <p className="text-sm text-slate-400">Total Amount</p>
                  <p className="text-xl font-bold text-white mt-1">
                    ৳{parseFloat(usageStats.total_amount || 0).toLocaleString('en-BD')}
                  </p>
                </div>
                <div className="bg-slate-800 rounded-xl p-4">
                  <p className="text-sm text-slate-400">Total Entries</p>
                  <p className="text-xl font-bold text-white mt-1">
                    {usageStats.total_count || 0}
                  </p>
                </div>
                <div className="bg-slate-800 rounded-xl p-4">
                  <p className="text-sm text-slate-400">Average Amount</p>
                  <p className="text-xl font-bold text-white mt-1">
                    ৳{parseFloat(usageStats.avg_amount || 0).toLocaleString('en-BD')}
                  </p>
                </div>
                <div className="bg-slate-800 rounded-xl p-4">
                  <p className="text-sm text-slate-400">Unique Users</p>
                  <p className="text-xl font-bold text-white mt-1">
                    {usageStats.unique_users || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
