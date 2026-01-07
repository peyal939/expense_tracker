import { useState, useEffect } from 'react'
import {
  Plus, Edit2, Trash2, Loader2, X, Search,
  BarChart3, Users, DollarSign, Tag,
} from 'lucide-react'
import { adminPanelAPI } from '../services/api'

const colorOptions = [
  '#f97316', '#ef4444', '#ec4899', '#a855f7',
  '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9',
  '#14b8a6', '#22c55e', '#84cc16', '#eab308',
]

const iconOptions = [
  '🍔', '🚗', '🛒', '🎬', '💡', '🏥', '📚', '✈️',
  '🥬', '💇', '🏠', '🎁', '🛡️', '📱', '🏋️', '💰',
  '🎮', '☕', '💼', '❤️', '🎓', '🎯', '💳', '🔧',
]

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [search, setSearch] = useState('')
  const [usageStats, setUsageStats] = useState(null)
  const [showStatsModal, setShowStatsModal] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    icon: '🏷️',
    color_token: '#8b5cf6',
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await adminPanelAPI.categories.list()
      const data = response.data?.results ?? response.data
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        await adminPanelAPI.categories.update(editingCategory.id, formData)
      } else {
        await adminPanelAPI.categories.create(formData)
      }
      setShowModal(false)
      setEditingCategory(null)
      setFormData({ name: '', icon: '🏷️', color_token: '#8b5cf6' })
      fetchCategories()
    } catch (error) {
      console.error('Error saving category:', error)
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      icon: category.icon || '🏷️',
      color_token: category.color_token || '#8b5cf6',
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    try {
      await adminPanelAPI.categories.delete(id)
      setDeleteConfirm(null)
      fetchCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Cannot delete category that is in use')
    }
  }

  const handleViewStats = async (category) => {
    try {
      const response = await adminPanelAPI.categories.getUsageStats(category.id)
      setUsageStats({ ...response.data, category })
      setShowStatsModal(true)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Category Management</h1>
          <p className="text-slate-400 mt-1">Manage system-wide expense categories</p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null)
            setFormData({ name: '', icon: '🏷️', color_token: '#8b5cf6' })
            setShowModal(true)
          }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-medium text-white hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/30"
        >
          <Plus size={20} />
          Add Category
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
        />
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Tag size={20} className="text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{categories.length}</p>
              <p className="text-sm text-slate-500">Total Categories</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <DollarSign size={20} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                ৳{categories.reduce((sum, c) => sum + parseFloat(c.total_amount || 0), 0).toLocaleString('en-BD')}
              </p>
              <p className="text-sm text-slate-500">Total Expenses</p>
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
                {categories.reduce((sum, c) => sum + (c.usage_count || 0), 0).toLocaleString()}
              </p>
              <p className="text-sm text-slate-500">Total Usage</p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="bg-slate-900 rounded-xl border border-slate-800 p-5 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${category.color_token || '#8b5cf6'}20` }}
                  >
                    {category.icon || '🏷️'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{category.name}</h3>
                    <p className="text-sm text-slate-500">{category.usage_count || 0} expenses</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleViewStats(category)}
                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="View Stats"
                  >
                    <BarChart3 size={16} />
                  </button>
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 text-slate-400 hover:text-violet-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(category.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Total Amount</span>
                  <span className="font-medium text-white">
                    ৳{parseFloat(category.total_amount || 0).toLocaleString('en-BD')}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {filteredCategories.length === 0 && (
            <div className="col-span-full bg-slate-900 rounded-xl border border-slate-800 p-8 text-center">
              <Tag size={48} className="text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No categories found</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">
                {editingCategory ? 'Edit Category' : 'Add Category'}
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
                  Category Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  placeholder="Enter category name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Icon
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                        formData.icon === icon
                          ? 'bg-violet-600 ring-2 ring-violet-400'
                          : 'bg-slate-800 hover:bg-slate-700'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Color
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color_token: color })}
                      className={`w-10 h-10 rounded-lg transition-all ${
                        formData.color_token === color
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                          : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="pt-4 border-t border-slate-800">
                <p className="text-sm text-slate-400 mb-2">Preview</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${formData.color_token}20` }}
                  >
                    {formData.icon}
                  </div>
                  <span className="font-medium text-white">{formData.name || 'Category Name'}</span>
                </div>
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
                  {editingCategory ? 'Update' : 'Create'}
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
            <h3 className="text-lg font-semibold text-white mb-2">Delete Category?</h3>
            <p className="text-slate-400 mb-6">
              This action cannot be undone. Categories with expenses cannot be deleted.
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
          <div className="bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-2xl">{usageStats.category?.icon}</span>
                {usageStats.category_name} Statistics
              </h3>
              <button
                onClick={() => setShowStatsModal(false)}
                className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800 rounded-xl p-4">
                  <p className="text-sm text-slate-400">Total Amount</p>
                  <p className="text-xl font-bold text-white mt-1">
                    ৳{parseFloat(usageStats.total_amount || 0).toLocaleString('en-BD')}
                  </p>
                </div>
                <div className="bg-slate-800 rounded-xl p-4">
                  <p className="text-sm text-slate-400">Total Expenses</p>
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
              
              {Array.isArray(usageStats?.monthly_usage) && usageStats.monthly_usage.length > 0 && (
                <div>
                  <h4 className="font-medium text-white mb-3">Monthly Usage</h4>
                  <div className="space-y-2">
                    {usageStats.monthly_usage.map((month, index) => {
                      const maxTotal = Math.max(...usageStats.monthly_usage.map(m => m.total || 0))
                      const percentage = maxTotal > 0 ? ((month.total || 0) / maxTotal) * 100 : 0
                      return (
                        <div key={index}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-slate-400">
                              {new Date(month.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-white">৳{parseFloat(month.total || 0).toLocaleString('en-BD')}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
