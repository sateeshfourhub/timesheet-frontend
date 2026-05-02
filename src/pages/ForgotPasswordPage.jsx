import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Something went wrong. Please try again.')
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
        <div
          className="px-8 py-8 flex flex-col items-center"
          style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' }}
        >
          <img src="/logo-192.png" alt="TimekeepingHub" className="h-16 w-auto mb-3 drop-shadow-lg" />
          <h1 className="text-2xl font-bold text-white tracking-tight">TimekeepingHub</h1>
          <p className="text-blue-200 text-sm mt-1">Reset your password</p>
        </div>

        <div className="px-8 py-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto text-3xl">
                ✉
              </div>
              <h2 className="text-lg font-bold text-gray-900">Check your email</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                If <span className="font-semibold text-gray-700">{email}</span> is registered,
                you'll receive a reset link shortly. Check your spam folder if it doesn't arrive
                within a few minutes.
              </p>
              <Link
                to="/login"
                className="block w-full text-center py-2.5 rounded-lg font-semibold text-white mt-2"
                style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' }}
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-5">
                Enter your email address and we'll send you a link to reset your password.
              </p>
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
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
              <p className="text-center text-sm text-gray-400 mt-6">
                <Link to="/login" className="font-semibold hover:underline" style={{ color: '#2563EB' }}>
                  Back to Sign In
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
