import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { register as registerApi } from '../api/auth'

const toSlug = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export default function NewCompanyPage() {
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', company_name: '', company_slug: '', super_admin_token: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const set = (field) => (e) => {
    const value = e.target.value
    setForm((f) => {
      const updated = { ...f, [field]: value }
      if (field === 'company_name') updated.company_slug = toSlug(value)
      return updated
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { access_token } = await registerApi(form)
      await login(access_token)
      navigate('/dashboard')
    } catch (err) {
      const status = err.response?.status
      setError(
        status === 403
          ? 'Invalid super admin token. Contact sateesh@fourhubtech.com to get a token.'
          : err.response?.data?.detail || 'Registration failed'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 50%, #BFDBFE 100%)' }}
    >
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">

        <div
          className="px-8 py-8 flex flex-col items-center"
          style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' }}
        >
          <img src="/logo-192.png" alt="TimekeepingHub" className="h-16 w-auto mb-3 drop-shadow-lg" />
          <h1 className="text-2xl font-bold text-white tracking-tight">TimekeepingHub</h1>
          <p className="text-blue-200 text-sm mt-1">Set up a new company</p>
        </div>

        <div className="px-8 py-8">
          <div className="bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded-lg mb-5 text-sm">
            <strong>Admin only.</strong> You need a super admin token to create a company account. Contact <strong>sateesh@fourhubtech.com</strong> to request one.
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Super admin token — first, so it acts as a gate */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1E3A8A' }}>
                Super Admin Token
              </label>
              <input
                type="password"
                value={form.super_admin_token}
                onChange={set('super_admin_token')}
                required
                placeholder="Token provided by TimekeepingHub"
                className="w-full border border-amber-300 rounded-lg px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none transition-all"
                onFocus={e => e.target.style.borderColor = '#d97706'}
                onBlur={e => e.target.style.borderColor = '#fcd34d'}
              />
            </div>

            <hr className="border-blue-100" />

            {[
              { field: 'full_name',    label: 'Your Full Name',  type: 'text',     placeholder: 'Jane Smith' },
              { field: 'email',        label: 'Email',           type: 'email',    placeholder: 'admin@company.com' },
              { field: 'password',     label: 'Password',        type: 'password', placeholder: '••••••••' },
              { field: 'company_name', label: 'Company Name',    type: 'text',     placeholder: 'Acme Inc.' },
            ].map(({ field, label, type, placeholder }) => (
              <div key={field}>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1E3A8A' }}>
                  {label}
                </label>
                <input
                  type={type}
                  value={form[field]}
                  onChange={set(field)}
                  required
                  placeholder={placeholder}
                  className="w-full border border-blue-200 rounded-lg px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none transition-all"
                  onFocus={e => e.target.style.borderColor = '#2563EB'}
                  onBlur={e => e.target.style.borderColor = '#BFDBFE'}
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-2.5 rounded-lg font-semibold transition-opacity disabled:opacity-50 mt-2"
              style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' }}
            >
              {loading ? 'Creating company...' : 'Create Company Account'}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-500 text-center">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: '#2563EB' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
