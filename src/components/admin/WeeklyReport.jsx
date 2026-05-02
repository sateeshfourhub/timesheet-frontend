import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getWeeklyReport, sendReminder } from '../../api/reports'

function getMonday(offset = 0) {
  const now = new Date()
  const day = now.getDay()
  const d = new Date(now)
  d.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7)
  d.setHours(0, 0, 0, 0)
  return d
}

const fmt = (mins) => {
  if (mins == null) return '—'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

const escapeCSV = (val) => {
  const s = String(val ?? '')
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

export default function WeeklyReport() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [remindedIds, setRemindedIds] = useState(new Set())
  const [reminderError, setReminderError] = useState('')

  const monday = getMonday(weekOffset)
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)
  const weekStart = monday.toISOString().split('T')[0]
  const weekLabel = `${monday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${friday.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`

  const { data, isLoading, isError } = useQuery({
    queryKey: ['weekly-report', weekStart],
    queryFn: () => getWeeklyReport(weekStart),
    retry: 1,
  })

  const mutRemind = useMutation({
    mutationFn: (payload) => sendReminder(payload.weekStart, payload.userIds),
    onSuccess: (_, payload) => {
      setRemindedIds(prev => new Set([...prev, ...payload.userIds]))
      setReminderError('')
    },
    onError: (err) => {
      setReminderError(err.response?.data?.detail || 'Failed to send reminder. Please try again.')
    },
  })

  const handleRemind = (userIds) => {
    setReminderError('')
    mutRemind.mutate({ weekStart, userIds })
  }

  const employees = data?.employees ?? []
  const pendingEmployees = employees.filter(e => !e.submitted && !remindedIds.has(e.id))

  const exportCSV = () => {
    const headers = ['Employee', 'Email', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Total Hours', 'Status']
    const rows = employees.map(e => [
      e.name, e.email,
      ...DAYS.map(d => fmt(e.days?.[d])),
      fmt(e.total_minutes),
      e.submitted ? 'Submitted' : 'Pending',
    ])
    const csv = [headers, ...rows].map(r => r.map(escapeCSV).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `weekly-report-${weekStart}.csv`
    a.click()
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(14)
    doc.text('Weekly Timesheet Report', 14, 16)
    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text(`Week: ${weekLabel}`, 14, 23)
    autoTable(doc, {
      startY: 28,
      head: [['Employee', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Total', 'Status']],
      body: employees.map(e => [
        e.name,
        ...DAYS.map(d => fmt(e.days?.[d])),
        fmt(e.total_minutes),
        e.submitted ? 'Submitted' : 'Pending',
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    })
    doc.save(`weekly-report-${weekStart}.pdf`)
  }

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Weekly Report</h2>
          <p className="text-sm text-gray-500 mt-0.5">Hours logged per employee for the selected week</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={exportCSV}
            disabled={!employees.length}
            className="px-3 py-1.5 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            Export CSV
          </button>
          <button
            onClick={exportPDF}
            disabled={!employees.length}
            className="px-3 py-1.5 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            Export PDF
          </button>
          {pendingEmployees.length > 0 && (
            <button
              onClick={() => handleRemind(pendingEmployees.map(e => e.id))}
              disabled={mutRemind.isPending}
              className="px-3 py-1.5 text-sm font-semibold bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
            >
              {mutRemind.isPending ? 'Sending…' : `Remind All Pending (${pendingEmployees.length})`}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => setWeekOffset(w => w - 1)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          ‹ Prev
        </button>
        <span className="text-sm font-semibold text-gray-900 w-52 text-center">{weekLabel}</span>
        <button
          onClick={() => setWeekOffset(w => w + 1)}
          disabled={weekOffset >= 0}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-colors"
        >
          Next ›
        </button>
        {weekOffset < 0 && (
          <button onClick={() => setWeekOffset(0)} className="text-xs text-blue-600 hover:underline">
            This week
          </button>
        )}
      </div>

      {reminderError && (
        <p className="mb-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{reminderError}</p>
      )}

      {isLoading ? (
        <div className="text-center text-gray-400 py-16 text-sm">Loading…</div>
      ) : isError ? (
        <div className="text-center py-16">
          <p className="text-sm text-red-500">Could not load report. Make sure the backend reporting endpoints are deployed.</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="text-center text-gray-400 text-sm py-16">No data for this week.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Employee</th>
                {DAY_LABELS.map(d => (
                  <th key={d} className="text-center text-xs font-semibold text-gray-500 px-3 py-3">{d}</th>
                ))}
                <th className="text-center text-xs font-semibold text-gray-500 px-4 py-3">Total</th>
                <th className="text-center text-xs font-semibold text-gray-500 px-4 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{emp.name}</p>
                        <p className="text-xs text-gray-400 truncate">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  {DAYS.map(d => (
                    <td key={d} className="px-3 py-3 text-center text-sm text-gray-600">
                      {fmt(emp.days?.[d])}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-semibold text-gray-900">{fmt(emp.total_minutes)}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      emp.submitted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {emp.submitted ? 'Submitted' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!emp.submitted && (
                      remindedIds.has(emp.id) ? (
                        <span className="text-xs text-green-600 font-medium">✓ Reminded</span>
                      ) : (
                        <button
                          onClick={() => handleRemind([emp.id])}
                          disabled={mutRemind.isPending}
                          className="text-xs font-medium text-amber-600 hover:underline disabled:opacity-50"
                        >
                          Send Reminder
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
