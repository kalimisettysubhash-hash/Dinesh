import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_URL || ''

const api = axios.create({ baseURL: `${apiBaseUrl}/api` })

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tanvi_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('tanvi_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
