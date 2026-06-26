import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('tanvi_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      authAPI.getMe()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('tanvi_token')
          setToken(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const login = async (username, password) => {
    const data = await authAPI.login(username, password)
    localStorage.setItem('tanvi_token', data.access_token)
    // The original code had a redundant localStorage.setItem call here.
    // The primary fix is to wrap the subsequent API call in a try-catch.
    try {
      setToken(data.access_token)
      const me = await authAPI.getMe()
      setUser(me)
      return me
    } catch (err) {
      // If getMe fails after a successful login (e.g., token is invalid or server error),
      // we should clear the token and reset the auth state to prevent a broken session.
      localStorage.removeItem('tanvi_token') // Clear token if getMe fails after login
      setToken(null)
      throw err // Re-throw to allow calling component (e.g., LoginPage) to handle
    }
  }

  const logout = () => {
    localStorage.removeItem('tanvi_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
