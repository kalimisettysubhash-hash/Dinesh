import api from './axiosInstance'

export const customersAPI = {
  list: async (params = {}) => {
    const res = await api.get('/customers', { params })
    return res.data
  },

  getById: async (id) => {
    const res = await api.get(`/customers/${id}`)
    return res.data
  },

  create: async (data) => {
    const res = await api.post('/customers', data)
    return res.data
  },

  update: async (id, data) => {
    const res = await api.put(`/customers/${id}`, data)
    return res.data
  },

  delete: async (id) => {
    await api.delete(`/customers/${id}`)
  },

  exportCSV: (params = {}) => {
    const token = localStorage.getItem('tanvi_token')
    const query = new URLSearchParams(params).toString()
    const url = `/api/customers/export/csv${query ? `?${query}` : ''}`
    const a = document.createElement('a')
    a.href = url
    a.download = 'tanvi_customers.csv'
    // Must add auth header via fetch since <a> doesn't support headers
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob)
        a.href = blobUrl
        a.click()
        URL.revokeObjectURL(blobUrl)
      })
  },
}
