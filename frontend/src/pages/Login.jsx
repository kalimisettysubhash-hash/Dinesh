import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Sparkles, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading]  = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) { toast.error('Please fill in all fields'); return }
    setLoading(true)
    try {
      await login(username, password)
      toast.success('Welcome back! 🌸')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand-700/10 rounded-full filter blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold-500/10 rounded-full filter blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="w-full max-w-md animate-slide-up">
        {/* Card */}
        <div className="glass-card p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 flex items-center justify-center shadow-xl shadow-brand-900/50 mb-4">
              <Sparkles size={26} className="text-white" />
            </div>
            <h1 className="font-display font-bold text-2xl text-white">TanviCRM</h1>
            <p className="text-gray-400 text-sm mt-1">Sign in to Tanvi Boutique dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="label">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="input-field"
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                '✨ Sign In'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-600 mt-6">
            Default: 
            <button
              type="button"
              onClick={() => { setUsername('admin'); setPassword('admin123'); }}
              className="text-gray-400 hover:text-gray-200 ml-1 mr-1 transition-colors"
            >
              admin
            </button>
            /
            <button
              type="button"
              onClick={() => { setUsername('admin'); setPassword('admin123'); }}
              className="text-gray-400 hover:text-gray-200 ml-1 transition-colors"
            >
              admin123
            </button>
          </p>
          <p className="text-center text-xs text-gray-600 mt-3">
            <Link to="/register" className="text-gray-400 hover:text-gray-200">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
