import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { register as registerApi, employeeRegister } from '../api/auth'

const toSlug = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const COMPANY_FIELDS = [
  { field: 'full_name',    label: 'Your Full Name', type: 'text',     placeholder: 'John Smith' },
  { field: 'email',        label: 'Email',          type: 'email',    placeholder: 'you@company.com' },
  { field: 'password',     label: 'Password',       type: 'password', placeholder: '••••••••' },
  { field: 'company_name', label: 'Company Name',   type: 'text',     placeholder: 'Acme Inc.' },
]

const EMPLOYEE_FIELDS = [
  { field: 'full_name',    label: 'Your Full Name', type: 'text',     placeholder: 'John Smith' },
  { field: 'email',        label: 'Email',          type: 'email',    placeholder: 'you@company.com' },
  { field: 'password',     label: 'Password',       type: 'password', placeholder: '••••••••' },
  { field: 'company_slug', label: 'Company Code',   type: 'text',     placeholder: 'acme-inc  (ask your admin)' },
]

export default function RegisterPage() {
  const [tab, setTab] = useState('employee')

  const [companyForm, setCompanyForm] = useState({
    full_name: '', email: '', password: '', company_name: '', company_slug: '',
  })
  const [employeeForm, setEmployeeForm] = useState({
    full_name: '', email: '', password: '', company_slug: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const setCompany = (field) => (e) => {
    const value = e.target.value
    setCompanyForm((f) => {
      const updated = { ...f, [field]: value }
      if (field === 'company_name') updated.company_slug = toSlug(value)
      return updated
    })
  }

  const setEmployee = (field) => (e) =>
    setEmployeeForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { access_token } = tab === 'company'
        ? await registerApi(companyForm)
        : await employeeRegister(employeeForm)
      await login(access_token)
      navigate('/dashboard')
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(
        tab === 'employee' && err.response?.status === 404
          ? 'Company code not found. Double-check the code your admin gave you.'
          : detail || 'Registration failed'
      )
    } finally {
      setLoading(false)
    }
  }

  const fields  = tab === 'company' ? COMPANY_FIELDS  : EMPLOYEE_FIELDS
  const form    = tab === 'company' ? companyForm      : employeeForm
  const setField = tab === 'company' ? setCompany      : setEmployee

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 50%, #BFDBFE 100%)' }}
    >
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">

        {/* Header */}
        <div
          className="px-8 py-8 flex flex-col items-center"
          style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' }}
        >
          <img src="/logo-192.png" alt="TimekeepingHub" className="h-16 w-auto mb-3 drop-shadow-lg" />
          <h1 className="text-2xl font-bold text-white tracking-tight">TimekeepingHub</h1>
          <p className="text-blue-200 text-sm mt-1">Create your account</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-blue-100">
          <button
            onClick={() => { setTab('employee'); setError('') }}
            className="flex-1 py-3 text-sm font-semibold transition-colors"
            style={{
              color: tab === 'employee' ? '#1D4ED8' : '#6b7280',
              borderBottom: tab === 'employee' ? '2px solid #1D4ED8' : '2px solid transparent',
              background: 'none',
            }}
          >
            Join Company
          </button>
          <button
            onClick={() => { setTab('company'); setError('') }}
            className="flex-1 py-3 text-sm font-semibold transition-colors"
            style={{
              color: tab === 'company' ? '#1D4ED8' : '#6b7280',
              borderBottom: tab === 'company' ? '2px solid #1D4ED8' : '2px solid transparent',
              background: 'none',
            }}
          >
            New Company
          </button>
        </div>

        {/* Form */}
        <div className="px-8 py-8">

          {/* Context hint */}
          {tab === 'employee' ? (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-5 text-sm">
              Your admin will give you a <strong>Company Code</strong>. Enter it below to join your company's account.
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-5 text-sm">
              This sets up a <strong>new company</strong> account. If you're an employee, use the <strong>Join Company</strong> tab instead.
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ field, label, type, placeholder }) => (
              <div key={field}>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1E3A8A' }}>
                  {label}
                </label>
                <input
                  type={type}
                  value={form[field]}
                  onChange={setField(field)}
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
              {loading
                ? 'Creating account...'
                : tab === 'employee' ? 'Join Company' : 'Create Company Account'}
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
