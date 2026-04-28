import { useAuth } from '../context/AuthContext'
import { useNavigate, Link, useLocation } from 'react-router-dom'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isAdmin = user?.role === 'admin' || user?.is_superuser

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="font-bold text-gray-900 text-lg">Fourhub Timesheet</h1>
            <div className="flex items-center gap-1">
              <Link
                to="/dashboard"
                className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  location.pathname === '/dashboard'
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                My Timesheet
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                    location.pathname === '/admin'
                      ? 'bg-purple-50 text-purple-700 font-medium'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.full_name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-semibold ${
              user?.is_superuser
                ? 'bg-yellow-100 text-yellow-700'
                : user?.role === 'admin'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {user?.is_superuser ? 'Super Admin' : user?.role}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto py-8 px-6">{children}</main>
    </div>
  )
}
