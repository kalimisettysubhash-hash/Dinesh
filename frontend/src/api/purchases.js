import api from './axiosInstance'

export const purchasesAPI = {
  list: async (params = {}) => {
    const res = await api.get('/purchases', { params })
    return res.data
  },

  getById: async (id) => {
    const res = await api.get(`/purchases/${id}`)
    return res.data
  },

  create: async (data) => {
    const res = await api.post('/purchases', data)
    return res.data
  },

  update: async (id, data) => {
    const res = await api.put(`/purchases/${id}`, data)
    return res.data
  },

  delete: async (id) => {
    await api.delete(`/purchases/${id}`)
  },
}
