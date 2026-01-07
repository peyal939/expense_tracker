import axios from 'axios'

const API_BASE = '/api/v1'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        const response = await axios.post(`${API_BASE}/auth/token/refresh/`, {
          refresh: refreshToken,
        })

        const { access } = response.data
        localStorage.setItem('access_token', access)

        originalRequest.headers.Authorization = `Bearer ${access}`
        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials) =>
    api.post('/auth/token/', credentials),
  
  register: (data) =>
    api.post('/auth/register/', data),
  
  refreshToken: (refresh) =>
    api.post('/auth/token/refresh/', { refresh }),
  
  getMe: () => api.get('/users/me/'),
}

// Users API (Admin)
export const usersAPI = {
  list: () => api.get('/users/manage/'),
  get: (id) => api.get(`/users/manage/${id}/`),
  create: (data) => api.post('/users/manage/', data),
  update: (id, data) => api.patch(`/users/manage/${id}/`, data),
  delete: (id) => api.delete(`/users/manage/${id}/`),
}

// Categories API
export const categoriesAPI = {
  list: (params) => api.get('/categories/', { params }),
  get: (id) => api.get(`/categories/${id}/`),
  create: (data) => api.post('/categories/', data),
  update: (id, data) => api.patch(`/categories/${id}/`, data),
  delete: (id) => api.delete(`/categories/${id}/`),
}

// Expenses API
export const expensesAPI = {
  list: (params) => api.get('/expenses/', { params }),
  get: (id) => api.get(`/expenses/${id}/`),
  create: (data) => api.post('/expenses/', data),
  update: (id, data) => api.patch(`/expenses/${id}/`, data),
  delete: (id) => api.delete(`/expenses/${id}/`),
}

// Budgets API
export const budgetsAPI = {
  // Legacy budget endpoints (for backward compatibility)
  list: (params) => api.get('/budgets/allocations/', { params }),
  get: (id) => api.get(`/budgets/allocations/${id}/`),
  create: (data) => api.post('/budgets/allocations/', data),
  update: (id, data) => api.patch(`/budgets/allocations/${id}/`, data),
  delete: (id) => api.delete(`/budgets/allocations/${id}/`),
  getStatus: (month) => api.get('/budgets/status/', { params: { month } }),
  
  // Category allocations
  allocations: {
    list: (params) => api.get('/budgets/allocations/', { params }),
    get: (id) => api.get(`/budgets/allocations/${id}/`),
    create: (data) => api.post('/budgets/allocations/', data),
    update: (id, data) => api.patch(`/budgets/allocations/${id}/`, data),
    delete: (id) => api.delete(`/budgets/allocations/${id}/`),
    getAllocatedCategories: (month) => 
      api.get('/budgets/allocations/allocated_categories/', { params: { month } }),
  },
  
  // Income sources
  incomeSources: {
    list: () => api.get('/budgets/income-sources/'),
    get: (id) => api.get(`/budgets/income-sources/${id}/`),
    create: (data) => api.post('/budgets/income-sources/', data),
    update: (id, data) => api.patch(`/budgets/income-sources/${id}/`, data),
    delete: (id) => api.delete(`/budgets/income-sources/${id}/`),
  },
  
  // Incomes
  incomes: {
    list: (params) => api.get('/budgets/incomes/', { params }),
    get: (id) => api.get(`/budgets/incomes/${id}/`),
    create: (data) => api.post('/budgets/incomes/', data),
    update: (id, data) => api.patch(`/budgets/incomes/${id}/`, data),
    delete: (id) => api.delete(`/budgets/incomes/${id}/`),
    getTotal: (month) => api.get('/budgets/incomes/total/', { params: { month } }),
  },
  
  // Monthly budget (adjustable total)
  monthly: {
    list: () => api.get('/budgets/monthly/'),
    get: (id) => api.get(`/budgets/monthly/${id}/`),
    create: (data) => api.post('/budgets/monthly/', data),
    update: (id, data) => api.patch(`/budgets/monthly/${id}/`, data),
    delete: (id) => api.delete(`/budgets/monthly/${id}/`),
    getCurrent: (month) => api.get('/budgets/monthly/current/', { params: { month } }),
  },
  
  // Warnings
  getWarnings: (month) => api.get('/budgets/warnings/', { params: { month } }),
}

// Reports API
export const reportsAPI = {
  getSummary: (start, end) =>
    api.get('/reports/summary/', { params: { start, end } }),
  
  getTrends: (month) =>
    api.get('/reports/trends/', { params: { month } }),
  
  getTimeseries: (start, end, bucket = 'daily') =>
    api.get('/reports/timeseries/', { params: { start, end, bucket } }),
  
  // New endpoints
  getSpendingTrends: (days = 30) =>
    api.get('/reports/spending-trends/', { params: { days } }),
  
  getMonthEndSummary: (month) =>
    api.get('/reports/month-end/', { params: { month } }),
}

// Notifications API
export const notificationsAPI = {
  list: () => api.get('/notifications/'),
  getUnread: () => api.get('/notifications/unread/'),
  getCount: () => api.get('/notifications/count/'),
  markRead: (notificationIds) => 
    api.post('/notifications/mark_read/', { notification_ids: notificationIds }),
  markSingleRead: (id) => api.post(`/notifications/${id}/read/`),
}

// Admin API (Legacy)
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard/'),
}

// Admin Panel API (New comprehensive admin endpoints)
export const adminPanelAPI = {
  // Dashboard & Analytics
  getDashboardStats: () => api.get('/admin-panel/dashboard/'),
  getSystemHealth: () => api.get('/admin-panel/health/'),
  
  // User Management
  users: {
    list: (params) => api.get('/admin-panel/users/', { params }),
    get: (id) => api.get(`/admin-panel/users/${id}/`),
    create: (data) => api.post('/admin-panel/users/', data),
    update: (id, data) => api.patch(`/admin-panel/users/${id}/`, data),
    delete: (id) => api.delete(`/admin-panel/users/${id}/`),
    toggleStatus: (id) => api.post(`/admin-panel/users/${id}/toggle_status/`),
    resetPassword: (id, newPassword) => 
      api.post(`/admin-panel/users/${id}/reset_password/`, { new_password: newPassword }),
    assignRole: (id, role) => 
      api.post(`/admin-panel/users/${id}/assign_role/`, { role }),
    removeRole: (id, role) => 
      api.post(`/admin-panel/users/${id}/remove_role/`, { role }),
    getActivity: (id) => api.get(`/admin-panel/users/${id}/activity/`),
  },
  
  // Category Management
  categories: {
    list: () => api.get('/admin-panel/categories/'),
    get: (id) => api.get(`/admin-panel/categories/${id}/`),
    create: (data) => api.post('/admin-panel/categories/', data),
    update: (id, data) => api.patch(`/admin-panel/categories/${id}/`, data),
    delete: (id) => api.delete(`/admin-panel/categories/${id}/`),
    getUsageStats: (id) => api.get(`/admin-panel/categories/${id}/usage_stats/`),
    bulkCreate: (categories) => 
      api.post('/admin-panel/categories/bulk_create/', { categories }),
  },
  
  // Income Source Management
  incomeSources: {
    list: () => api.get('/admin-panel/income-sources/'),
    get: (id) => api.get(`/admin-panel/income-sources/${id}/`),
    create: (data) => api.post('/admin-panel/income-sources/', data),
    update: (id, data) => api.patch(`/admin-panel/income-sources/${id}/`, data),
    delete: (id) => api.delete(`/admin-panel/income-sources/${id}/`),
    getUsageStats: (id) => api.get(`/admin-panel/income-sources/${id}/usage_stats/`),
  },
  
  // Expense Management (Admin View)
  expenses: {
    list: (params) => api.get('/admin-panel/expenses/', { params }),
    getSummary: (params) => api.get('/admin-panel/expenses/summary/', { params }),
  },
  
  // Notifications
  notifications: {
    broadcast: (title, message, userIds) => 
      api.post('/admin-panel/notifications/broadcast/', { title, message, user_ids: userIds }),
    getStats: () => api.get('/admin-panel/notifications/stats/'),
  },
  
  // Reports
  getReportsOverview: () => api.get('/admin-panel/reports/overview/'),
  
  // Exports
  exportUsers: () => api.get('/admin-panel/export/users/'),
  exportExpenses: (params) => api.get('/admin-panel/export/expenses/', { params }),
}

// Export API
export const exportAPI = {
  getCSV: (params) =>
    api.get('/export/csv/', { params, responseType: 'blob' }),
  
  getBackup: () =>
    api.get('/export/backup/', { responseType: 'blob' }),
}

// AI API
export const aiAPI = {
  categorize: (description, merchant) =>
    api.post('/ai/categorize/', { description, merchant }),
  
  getInsights: (month) =>
    api.get('/ai/insights/', { params: { month } }),
}

export default api
