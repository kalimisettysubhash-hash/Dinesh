import axios from 'axios'

import api from './axiosInstance'

const apiBaseUrl = import.meta.env.VITE_API_URL || ''

// Use form-urlencoded for OAuth2 login
const loginClient = axios.create({ baseURL: `${apiBaseUrl}/api` })

export const authAPI = {
  login: async (username, password) => {
    const form = new URLSearchParams()
    form.append('username', username)
    form.append('password', password)
    const res = await loginClient.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    return res.data
  },

  register: async (data) => {
    const res = await api.post('/auth/register', data)
    return res.data
  },

  getMe: async () => {
    const token = localStorage.getItem('tanvi_token')
    const res = await loginClient.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data
  },
}
