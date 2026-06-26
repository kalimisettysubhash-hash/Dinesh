import api from './axiosInstance'

export const analyticsAPI = {
  dashboard: async () => {
    const res = await api.get('/analytics/dashboard')
    return res.data
  },

  revenueTrend: async () => {
    const res = await api.get('/analytics/revenue-trend')
    return res.data
  },

  categories: async () => {
    const res = await api.get('/analytics/categories')
    return res.data
  },

  newVsReturning: async () => {
    const res = await api.get('/analytics/new-vs-returning')
    return res.data
  },

  topCustomers: async (limit = 10) => {
    const res = await api.get('/analytics/top-customers', { params: { limit } })
    return res.data
  },

  segments: async () => {
    const res = await api.get('/analytics/segments')
    return res.data
  },

  weeklyRevenueTrend: async () => {
    const res = await api.get('/analytics/weekly-revenue-trend')
    return res.data
  },

  recentActivity: async (limit = 10) => {
    const res = await api.get('/analytics/recent-activity', { params: { limit } })
    return res.data
  },

  exportCSV: (report = 'dashboard') => {
    window.location.href = `http://localhost:8000/api/analytics/export/csv?report=${report}`
  }
}
