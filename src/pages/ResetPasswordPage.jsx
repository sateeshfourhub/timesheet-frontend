import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { resetPassword } from '../api/auth'

function getTokenFromHash() {
  // HashRouter URLs look like: /#/reset-password?token=xxx
  // window.location.hash = "#/reset-password?token=xxx"
  const hash = window.location.hash
  const qIndex = hash.indexOf('?')
  if (qIndex === -1) return ''
  return new URLSearchParams(hash.slice(qIndex)).get('token') || ''
}

export default function ResetPasswordPage() {
  const token = getTokenFromHash()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [done, setDone]         = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) {
      navigate('/forgot-password', { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await resetPassword(token, password)
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid or expired link. Please request a new one.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full border border-blue-200 rounded-lg px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none transition-all"

  // While redirect is pending (no token), show the branded shell so there's no flash of white
  if (!token) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 50%, #BFDBFE 100%)' }}
      >
        <p className="text-gray-400 text-sm">Redirecting…</p>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 50%, #BFDBFE 100%)' }}
    >
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div
          className="px-8 py-8 flex flex-col items-center"
          style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' }}
        >
          <img src="/logo-192.png" alt="TimekeepingHub" className="h-16 w-auto mb-3 drop-shadow-lg" />
          <h1 className="text-2xl font-bold text-white tracking-tight">TimekeepingHub</h1>
          <p className="text-blue-200 text-sm mt-1">Set a new password</p>
        </div>

        <div className="px-8 py-8">
          {done ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto text-2xl font-bold text-green-600">
                ✓
              </div>
              <h2 className="text-lg font-bold text-gray-900">Password updated!</h2>
              <p className="text-sm text-gray-500">
                Your password has been reset successfully. Redirecting you to sign in…
              </p>
              <Link
                to="/login"
                className="block w-full text-center py-2.5 rounded-lg font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' }}
              >
                Sign In Now
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-5">
                Enter your new password below. Minimum 8 characters.
              </p>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-5 text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1E3A8A' }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Min. 8 characters"
                    className={inputClass}
                    onFocus={e => e.target.style.borderColor = '#2563EB'}
                    onBlur={e => e.target.style.borderColor = '#BFDBFE'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1E3A8A' }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    placeholder="Re-enter your password"
                    className={inputClass}
                    onFocus={e => e.target.style.borderColor = '#2563EB'}
                    onBlur={e => e.target.style.borderColor = '#BFDBFE'}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-white py-2.5 rounded-lg font-semibold transition-opacity disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' }}
                >
                  {loading ? 'Updating…' : 'Set New Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
