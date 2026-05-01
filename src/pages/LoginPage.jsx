import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { login as loginApi } from '../api/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { access_token } = await loginApi(email, password)
      await login(access_token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 50%, #BFDBFE 100%)' }}
    >
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">

        {/* Branded header */}
        <div
          className="px-8 py-8 flex flex-col items-center"
          style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' }}
        >
          <img src="/logo-192.png" alt="TimekeepingHub" className="h-16 w-auto mb-3 drop-shadow-lg" />
          <h1 className="text-2xl font-bold text-white tracking-tight">TimekeepingHub</h1>
          <p className="text-blue-200 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Form */}
        <div className="px-8 py-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1E3A8A' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="w-full border border-blue-200 rounded-lg px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none transition-all"
                style={{ '--tw-ring-color': '#2563EB' }}
                onFocus={e => e.target.style.borderColor = '#2563EB'}
                onBlur={e => e.target.style.borderColor = '#BFDBFE'}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1E3A8A' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full border border-blue-200 rounded-lg px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none transition-all"
                onFocus={e => e.target.style.borderColor = '#2563EB'}
                onBlur={e => e.target.style.borderColor = '#BFDBFE'}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-2.5 rounded-lg font-semibold transition-opacity disabled:opacity-50 mt-2"
              style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-2 text-sm text-center">
            <p className="text-gray-500">
              Are you an employee?{' '}
              <Link to="/register" className="font-semibold hover:underline" style={{ color: '#2563EB' }}>
                Create account
              </Link>
            </p>
            <p className="text-gray-400">
              Are you an admin?{' '}
              <Link to="/new-company" className="font-semibold hover:underline" style={{ color: '#6b7280' }}>
                Create a company
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
