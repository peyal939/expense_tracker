import { useState, useEffect } from 'react'
import {
  Plus, Edit2, Trash2, Loader2, X, AlertCircle,
  Utensils, ShoppingBag, Car, Home, Zap, Coffee, Briefcase, Heart, Gamepad2, GraduationCap, Plane, Gift, Wallet, Tag,
  DollarSign, Shield, Smartphone, Dumbbell, Hospital, Trees, Sparkles,
} from 'lucide-react'
import { categoriesAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

const iconOptions = [
  { id: 'utensils', icon: Utensils, label: 'Food' },
  { id: 'shopping-bag', icon: ShoppingBag, label: 'Shopping' },
  { id: 'car', icon: Car, label: 'Transport' },
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'zap', icon: Zap, label: 'Utilities' },
  { id: 'coffee', icon: Coffee, label: 'Coffee' },
  { id: 'briefcase', icon: Briefcase, label: 'Work' },
  { id: 'heart', icon: Heart, label: 'Health' },
  { id: 'gamepad', icon: Gamepad2, label: 'Gaming' },
  { id: 'graduation', icon: GraduationCap, label: 'Education' },
  { id: 'plane', icon: Plane, label: 'Travel' },
  { id: 'gift', icon: Gift, label: 'Gifts' },
  { id: 'hospital', icon: Hospital, label: 'Healthcare' },
  { id: 'shield', icon: Shield, label: 'Insurance' },
  { id: 'smartphone', icon: Smartphone, label: 'Subscriptions' },
  { id: 'dumbbell', icon: Dumbbell, label: 'Fitness' },
  { id: 'trees', icon: Trees, label: 'Groceries' },
  { id: 'sparkles', icon: Sparkles, label: 'Personal Care' },
]

const colorOptions = [
  '#f97316', '#ef4444', '#ec4899', '#a855f7',
  '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9',
  '#14b8a6', '#22c55e', '#84cc16', '#eab308',
]

const iconMap = {
  utensils: Utensils,
  'shopping-bag': ShoppingBag,
  car: Car,
  home: Home,
  zap: Zap,
  coffee: Coffee,
  briefcase: Briefcase,
  heart: Heart,
  gamepad: Gamepad2,
  graduation: GraduationCap,
  plane: Plane,
  gift: Gift,
  hospital: Hospital,
  shield: Shield,
  smartphone: Smartphone,
  dumbbell: Dumbbell,
  trees: Trees,
  sparkles: Sparkles,
}

// Map category names to contextual icons
const getCategoryIcon = (category) => {
  const name = category.name.toLowerCase()
  if (name.includes('food') || name.includes('dining')) return Utensils
  if (name.includes('transport')) return Car
  if (name.includes('shop')) return ShoppingBag
  if (name.includes('entertain') || name.includes('game')) return Gamepad2
  if (name.includes('bill') || name.includes('utilit')) return Zap
  if (name.includes('health') || name.includes('medical')) return Hospital
  if (name.includes('educat') || name.includes('school')) return GraduationCap
  if (name.includes('travel') || name.includes('flight')) return Plane
  if (name.includes('grocer')) return Trees
  if (name.includes('personal') || name.includes('care')) return Sparkles
  if (name.includes('home') || name.includes('garden')) return Home
  if (name.includes('gift') || name.includes('donat')) return Gift
  if (name.includes('insurance')) return Shield
  if (name.includes('subscription')) return Smartphone
  if (name.includes('fitness') || name.includes('gym')) return Dumbbell
  
  // Fallback to icon field if present
  if (category.icon && iconMap[category.icon]) return iconMap[category.icon]
  return Tag
}

export default function Categories() {
  const { isAdmin } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.list()
      setCategories(response.data.results || response.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await categoriesAPI.delete(id)
      setDeleteConfirm(null)
      fetchCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  const systemCategories = categories.filter(c => c.is_system)
  const customCategories = categories.filter(c => !c.is_system)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Categories</h1>
          <p className="text-slate-400 mt-1">Organize your expenses</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-medium text-white hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/30"
        >
          <Plus size={20} />
          Add Category
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Default Categories */}
          {systemCategories.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Default Categories</h2>
                <p className="text-sm text-slate-500">Pre-configured for common expenses</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {systemCategories.map((category) => {
                  const IconComponent = getCategoryIcon(category)
                  return (
                    <div
                      key={category.id}
                      className="bg-slate-900 rounded-xl border border-slate-800 p-4 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${category.color_token || '#8b5cf6'}20` }}
                          >
                            <IconComponent size={24} style={{ color: category.color_token || '#8b5cf6' }} />
                          </div>
                          <p className="font-medium text-white">{category.name}</p>
                        </div>
                        {isAdmin() && (
                          <button
                            onClick={() => setEditingCategory(category)}
                            className="p-2 text-slate-400 hover:text-violet-400 hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Custom Categories */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Your Categories</h2>
              <p className="text-sm text-slate-500">Personalized for your needs</p>
            </div>
            {customCategories.length === 0 ? (
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-8 text-center">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Tag size={32} className="text-slate-600" />
                </div>
                <p className="text-slate-400 mb-2">No custom categories yet</p>
                <p className="text-sm text-slate-500 mb-4">Create categories tailored to your spending habits</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 rounded-lg transition-colors"
                >
                  Create your first category
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {customCategories.map((category) => {
                  const IconComponent = getCategoryIcon(category)
                  return (
                    <div
                      key={category.id}
                      className="bg-slate-900 rounded-xl border border-slate-800 p-4 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${category.color_token || '#8b5cf6'}20` }}
                          >
                            <IconComponent size={24} style={{ color: category.color_token || '#8b5cf6' }} />
                          </div>
                          <p className="font-medium text-white">{category.name}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingCategory(category)}
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
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingCategory) && (
        <CategoryModal
          category={editingCategory}
          isAdmin={isAdmin()}
          onClose={() => {
            setShowAddModal(false)
            setEditingCategory(null)
          }}
          onSuccess={() => {
            setShowAddModal(false)
            setEditingCategory(null)
            fetchCategories()
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl w-full max-w-sm border border-slate-800 p-6 animate-slide-up">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={24} className="text-rose-400" />
            </div>
            <h3 className="text-lg font-semibold text-white text-center mb-2">Delete Category?</h3>
            <p className="text-slate-400 text-center mb-6">
              Categories with expenses cannot be deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 bg-slate-800 rounded-xl font-medium text-white hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 bg-rose-600 rounded-xl font-medium text-white hover:bg-rose-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CategoryModal({ category, isAdmin, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    icon: category?.icon || 'utensils',
    color_token: category?.color_token || '#8b5cf6',
    is_system: category?.is_system || false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (category) {
        await categoriesAPI.update(category.id, formData)
      } else {
        await categoriesAPI.create(formData)
      }
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.name?.[0] || 'Failed to save category')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-800 overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-white">
            {category ? 'Edit Category' : 'Add Category'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm text-slate-400 mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Category name"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Icon</label>
              <div className="grid grid-cols-6 gap-2">
                {iconOptions.map((opt) => {
                  const IconComponent = opt.icon
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: opt.id })}
                      className={`p-3 rounded-xl border transition-all ${
                        formData.icon === opt.id
                          ? 'border-violet-500 bg-violet-500/10'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                      title={opt.label}
                    >
                      <IconComponent size={20} className="text-slate-300 mx-auto" />
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Color</label>
              <div className="grid grid-cols-6 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color_token: color })}
                    className={`w-full aspect-square rounded-xl border-2 transition-all ${
                      formData.color_token === color
                        ? 'border-white scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {isAdmin && !category?.is_system && (
              <label className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_system}
                  onChange={(e) => setFormData({ ...formData, is_system: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-600 text-violet-600 focus:ring-violet-500 bg-slate-700"
                />
                <span className="text-slate-300">System category (visible to all users)</span>
              </label>
            )}
          </div>

          <div className="p-5 border-t border-slate-800">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Saving...
                </>
              ) : category ? (
                'Save Changes'
              ) : (
                'Create Category'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
