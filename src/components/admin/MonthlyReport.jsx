import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getMonthlyReport } from '../../api/reports'

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

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function MonthlyReport() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (isCurrentMonth) return
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ['monthly-report', year, month],
    queryFn: () => getMonthlyReport(year, month),
    retry: 1,
  })

  const employees = data?.employees ?? []
  const weeks = data?.weeks ?? []
  const companyWeekMins = data?.company_week_minutes ?? []
  const companyTotal = data?.company_total_minutes ?? 0
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`

  const exportCSV = () => {
    const headers = ['Employee', ...weeks.map(w => w.label), 'Total Hours']
    const rows = employees.map(e => [
      e.name,
      ...e.week_minutes.map(fmt),
      fmt(e.total_minutes),
    ])
    rows.push(['Company Total', ...companyWeekMins.map(fmt), fmt(companyTotal)])
    const csv = [headers, ...rows].map(r => r.map(escapeCSV).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `monthly-report-${year}-${String(month).padStart(2, '0')}.csv`
    a.click()
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(14)
    doc.text('Monthly Timesheet Report', 14, 16)
    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text(`Month: ${monthLabel}`, 14, 23)
    autoTable(doc, {
      startY: 28,
      head: [['Employee', ...weeks.map(w => w.label), 'Total']],
      body: [
        ...employees.map(e => [e.name, ...e.week_minutes.map(fmt), fmt(e.total_minutes)]),
        ['Company Total', ...companyWeekMins.map(fmt), fmt(companyTotal)],
      ],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: (hookData) => {
        const lastRow = hookData.table.body.length - 1
        if (hookData.row.index === lastRow) {
          hookData.cell.styles.fontStyle = 'bold'
          hookData.cell.styles.fillColor = [239, 246, 255]
        }
      },
    })
    doc.save(`monthly-report-${year}-${String(month).padStart(2, '0')}.pdf`)
  }

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Monthly Report</h2>
          <p className="text-sm text-gray-500 mt-0.5">Total hours per employee broken down by week</p>
        </div>
        <div className="flex gap-2">
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
        </div>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={prevMonth}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          ‹ Prev
        </button>
        <span className="text-sm font-semibold text-gray-900 w-40 text-center">{monthLabel}</span>
        <button
          onClick={nextMonth}
          disabled={isCurrentMonth}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-colors"
        >
          Next ›
        </button>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-400 py-16 text-sm">Loading…</div>
      ) : isError ? (
        <div className="text-center py-16">
          <p className="text-sm text-red-500">Could not load report. Make sure the backend reporting endpoints are deployed.</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="text-center text-gray-400 text-sm py-16">No data for this month.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Employee</th>
                {weeks.map(w => (
                  <th key={w.label} className="text-center text-xs font-semibold text-gray-500 px-4 py-3">
                    <span>{w.label}</span>
                    <span className="block text-gray-400 font-normal mt-0.5">
                      {new Date(w.week_start + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </th>
                ))}
                <th className="text-center text-xs font-semibold text-gray-500 px-4 py-3">Total</th>
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
                      <span className="text-sm font-medium text-gray-900">{emp.name}</span>
                    </div>
                  </td>
                  {emp.week_minutes.map((mins, i) => (
                    <td key={i} className="px-4 py-3 text-center text-sm text-gray-600">
                      {fmt(mins)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-semibold text-gray-900">{fmt(emp.total_minutes)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-blue-50/60">
                <td className="px-4 py-3 text-sm font-bold text-gray-900">Company Total</td>
                {companyWeekMins.map((mins, i) => (
                  <td key={i} className="px-4 py-3 text-center text-sm font-bold text-gray-900">
                    {fmt(mins)}
                  </td>
                ))}
                <td className="px-4 py-3 text-center">
                  <span className="text-sm font-bold text-blue-700">{fmt(companyTotal)}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
