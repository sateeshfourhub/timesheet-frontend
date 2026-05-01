import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listUsers, listCompanies, createUser, updateUser, batchFutureAccess,
  listInviteTokens, generateInviteToken,
} from '../api/admin'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'

// ── Shared small components ──────────────────────────────────────────────────

function RoleBadge({ role }) {
  const styles = {
    admin: 'bg-purple-100 text-purple-700',
    employee: 'bg-blue-100 text-blue-700',
    manager: 'bg-amber-100 text-amber-700',
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${styles[role] || 'bg-gray-100 text-gray-600'}`}>
      {role}
    </span>
  )
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        checked ? 'bg-green-500' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-4' : 'translate-x-1'
      }`} />
    </button>
  )
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
        copied
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

function StatusBadge({ status }) {
  const styles = {
    active:  'bg-green-100 text-green-700',
    used:    'bg-gray-100 text-gray-500',
    expired: 'bg-red-100 text-red-600',
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

// ── Add user modal ───────────────────────────────────────────────────────────

function AddUserModal({ onClose, onSave, isSuperuser, companies = [] }) {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'employee', company_id: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSuperuser && !form.company_id) { setError('Please select a company'); return }
    setSaving(true)
    setError('')
    try {
      const payload = { ...form }
      if (!isSuperuser) delete payload.company_id
      await onSave(payload)
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create user')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Add Employee</h2>
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          {isSuperuser && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Company</label>
              <select value={form.company_id} onChange={set('company_id')} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Select company —</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          {[
            { k: 'full_name', label: 'Full Name',  type: 'text' },
            { k: 'email',     label: 'Email',      type: 'email' },
            { k: 'password',  label: 'Password',   type: 'password' },
          ].map(({ k, label, type }) => (
            <div key={k}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input type={type} value={form[k]} onChange={set(k)} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
            <select value={form.role} onChange={set('role')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Adding…' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Generate token modal ─────────────────────────────────────────────────────

function GenerateTokenModal({ onClose, onGenerated }) {
  const [companyName, setCompanyName] = useState('')
  const [result, setResult]     = useState(null)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const data = await generateInviteToken(companyName || undefined)
      setResult(data)
      onGenerated()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate token')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Generate Invite Token</h2>
        <p className="text-sm text-gray-500 mb-4">Share this token with the company admin so they can create their account.</p>

        {!result ? (
          <>
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Company Name <span className="text-gray-400">(optional — for your reference)</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Inc."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Generating…' : 'Generate Token'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-green-700 mb-2 uppercase tracking-wide">Token generated — share this once</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono text-gray-800 bg-white border border-green-200 rounded-lg px-3 py-2 break-all">
                  {result.token}
                </code>
                <CopyButton text={result.token} />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Expires: {new Date(result.expires_at).toLocaleString()} · Single use
              </p>
            </div>
            <button onClick={onClose}
              className="w-full py-2 rounded-lg bg-gray-100 text-sm font-semibold text-gray-700 hover:bg-gray-200">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Invite tokens panel ──────────────────────────────────────────────────────

function InviteTokensPanel() {
  const [showGenerate, setShowGenerate] = useState(false)
  const qc = useQueryClient()

  const { data: tokens = [], isLoading } = useQuery({
    queryKey: ['invite-tokens'],
    queryFn: listInviteTokens,
  })

  const refresh = () => qc.invalidateQueries({ queryKey: ['invite-tokens'] })

  if (isLoading) return <div className="text-center text-gray-400 py-12">Loading…</div>

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Invite Tokens</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Generate a token, share it with a company admin — they use it once to create their company account.
          </p>
        </div>
        <button
          onClick={() => setShowGenerate(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Generate Token
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {tokens.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-12">
            No tokens yet. Generate one to invite a new company admin.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Company (hint)</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Token</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Expires</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">Copy</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((t) => (
                <tr key={t.token} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                    {t.company_name || <span className="text-gray-400 italic">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {t.token.slice(0, 12)}…
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(t.expires_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {t.status === 'active' ? (
                      <CopyButton text={t.token} />
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showGenerate && (
        <GenerateTokenModal
          onClose={() => setShowGenerate(false)}
          onGenerated={refresh}
        />
      )}
    </>
  )
}

// ── Main admin dashboard ─────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [tab, setTab]           = useState('users')
  const [selected, setSelected] = useState(new Set())
  const [showAdd, setShowAdd]   = useState(false)
  const qc = useQueryClient()
  const { user: currentUser } = useAuth()
  const isSuperuser = currentUser?.is_superuser === true

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: listUsers,
  })
  const { data: companies = [] } = useQuery({
    queryKey: ['admin-companies'],
    queryFn: listCompanies,
    enabled: isSuperuser,
  })

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-users'] })

  const mutUpdate = useMutation({ mutationFn: ({ id, data }) => updateUser(id, data), onSuccess: refresh })
  const mutCreate = useMutation({ mutationFn: createUser, onSuccess: refresh })
  const mutBatch  = useMutation({
    mutationFn: ({ ids, enabled }) => batchFutureAccess(ids, enabled),
    onSuccess: () => { refresh(); setSelected(new Set()) },
  })

  const toggleSelect = (id) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
  const selectAll = () =>
    setSelected(users.length === selected.size ? new Set() : new Set(users.map(u => u.id)))

  if (isLoading) return <Layout><div className="text-center text-gray-400 py-20">Loading…</div></Layout>

  return (
    <Layout>
      {/* Page header + tabs */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="flex gap-1 mt-4 border-b border-gray-200">
          {[
            { id: 'users', label: 'Team Members' },
            ...(isSuperuser ? [{ id: 'tokens', label: 'Invite Tokens' }] : []),
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-2 text-sm font-semibold transition-colors"
              style={{
                color: tab === t.id ? '#1D4ED8' : '#6b7280',
                borderBottom: tab === t.id ? '2px solid #1D4ED8' : '2px solid transparent',
                background: 'none',
                marginBottom: '-1px',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Users tab ── */}
      {tab === 'users' && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">{users.length} team member{users.length !== 1 ? 's' : ''}</p>
            <button
              onClick={() => setShowAdd(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Add Employee
            </button>
          </div>

          {selected.size > 0 && (
            <div className="mb-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <span className="text-sm font-medium text-blue-700">{selected.size} selected</span>
              <button
                onClick={() => mutBatch.mutate({ ids: Array.from(selected), enabled: true })}
                className="px-3 py-1 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Grant Future Access
              </button>
              <button
                onClick={() => mutBatch.mutate({ ids: Array.from(selected), enabled: false })}
                className="px-3 py-1 text-xs font-semibold bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Revoke Future Access
              </button>
              <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-blue-500 hover:underline">
                Clear
              </button>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox" checked={users.length > 0 && selected.size === users.length} onChange={selectAll} className="rounded" />
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Name</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Email</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Company</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Role</th>
                  <th className="text-center text-xs font-semibold text-gray-500 px-4 py-3">Future Access</th>
                  <th className="text-center text-xs font-semibold text-gray-500 px-4 py-3">Active</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(user.id)} onChange={() => toggleSelect(user.id)} className="rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {user.full_name}
                          {user.is_superuser && (
                            <span className="ml-1.5 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">Super</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{user.company_name || '—'}</td>
                    <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                    <td className="px-4 py-3 text-center">
                      <Toggle
                        checked={user.future_time_log_enabled}
                        onChange={(val) => mutUpdate.mutate({ id: user.id, data: { future_time_log_enabled: val } })}
                        disabled={user.is_superuser || user.role === 'admin'}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Toggle
                        checked={user.is_active}
                        onChange={(val) => mutUpdate.mutate({ id: user.id, data: { is_active: val } })}
                        disabled={user.is_superuser}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!user.is_superuser && (
                        <button
                          onClick={() => mutUpdate.mutate({ id: user.id, data: { role: user.role === 'admin' ? 'employee' : 'admin' } })}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {user.role === 'admin' ? 'Make Employee' : 'Make Admin'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center text-gray-400 text-sm py-12">No team members yet</div>
            )}
          </div>

          {showAdd && (
            <AddUserModal
              onClose={() => setShowAdd(false)}
              onSave={(data) => mutCreate.mutateAsync(data)}
              isSuperuser={isSuperuser}
              companies={companies}
            />
          )}
        </>
      )}

      {/* ── Invite Tokens tab (superuser only) ── */}
      {tab === 'tokens' && isSuperuser && <InviteTokensPanel />}
    </Layout>
  )
}
