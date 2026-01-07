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
  login: (username, password) =>
    api.post('/auth/token/', { username, password }),
  
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
  list: (params) => api.get('/budgets/', { params }),
  get: (id) => api.get(`/budgets/${id}/`),
  create: (data) => api.post('/budgets/', data),
  update: (id, data) => api.patch(`/budgets/${id}/`, data),
  delete: (id) => api.delete(`/budgets/${id}/`),
  getStatus: (month) => api.get('/budgets/status/', { params: { month } }),
}

// Reports API
export const reportsAPI = {
  getSummary: (start, end) =>
    api.get('/reports/summary/', { params: { start, end } }),
  
  getTrends: (month) =>
    api.get('/reports/trends/', { params: { month } }),
  
  getTimeseries: (start, end, bucket = 'daily') =>
    api.get('/reports/timeseries/', { params: { start, end, bucket } }),
}

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard/'),
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
