import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getWeekEntries, createEntry, updateEntry, deleteEntry, submitWeek, getSubmissionStatus } from '../api/timeEntries'
import { useAuth } from '../context/AuthContext'
import ClockDial from './ClockDial'
import TimeEntryModal from './TimeEntryModal'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getWeekDays(monday) {
  return DAY_NAMES.map((name, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    const date = d.toISOString().split('T')[0]
    const displayDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    const todayStr = new Date().toISOString().split('T')[0]
    return { dayName: name, date, displayDate, isToday: date === todayStr, isWeekend: i >= 5 }
  })
}

function getMonday(offset = 0) {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function formatHours(minutes) {
  if (!minutes) return '0h'
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export default function WeeklyTimesheetView() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDay, setSelectedDay] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const FUTURE_WEEKS_LIMIT = 4

  const isAdmin = user?.role === 'admin' || user?.is_superuser
  const canGoBack = isAdmin || weekOffset > -1
  const canGoForward = isAdmin
    || weekOffset < 0
    || (user?.future_time_log_enabled && weekOffset < FUTURE_WEEKS_LIMIT)
  const isWeekLocked = !isAdmin && (
    weekOffset < -1
    || (weekOffset > 0 && !user?.future_time_log_enabled)
    || (weekOffset > FUTURE_WEEKS_LIMIT)
  )

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 5000)
  }

  const handleSubmitWeek = async () => {
    if (isSubmitted) {
      showToast('You have already submitted your timesheet for this week.', 'error')
      return
    }
    if (completedDays === 0) {
      showToast('No completed entries this week. Log your hours first.', 'error')
      return
    }
    setSubmitting(true)
    try {
      const result = await submitWeek(startDate, endDate)
      showToast(`Your week timesheet has been successfully submitted! ${result.days_logged} day${result.days_logged !== 1 ? 's' : ''} · ${result.net_hours} net worked.`)
      queryClient.invalidateQueries({ queryKey: ['submission-status', startDate] })
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Submission failed'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const monday = getMonday(weekOffset)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const startDate = monday.toISOString().split('T')[0]
  const endDate = sunday.toISOString().split('T')[0]

  const { data: entries = [] } = useQuery({
    queryKey: ['week-entries', startDate],
    queryFn: () => getWeekEntries(startDate, endDate),
  })

  const { data: submissionStatus } = useQuery({
    queryKey: ['submission-status', startDate],
    queryFn: () => getSubmissionStatus(startDate),
  })

  const isSubmitted = submissionStatus?.submitted === true
  const isDayLocked = isWeekLocked || (!isAdmin && isSubmitted)

  const days = getWeekDays(monday)

  // Map date → entry (most recent per day)
  const entryByDate = {}
  entries.forEach(e => {
    const d = new Date(e.clock_in).toISOString().split('T')[0]
    if (!entryByDate[d] || new Date(e.clock_in) > new Date(entryByDate[d].clock_in)) {
      entryByDate[d] = e
    }
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['week-entries', startDate] })

  const handleSave = async ({ clock_in, clock_out, break_minutes, notes, entryId }) => {
    if (entryId) {
      await updateEntry(entryId, { clock_in, clock_out, break_minutes, notes })
    } else {
      await createEntry({ clock_in, clock_out, break_minutes, notes })
    }
    invalidate()
  }

  const handleDelete = async (id) => {
    await deleteEntry(id)
    invalidate()
  }

  // Totals
  const totalNet = entries.reduce((s, e) => s + (e.net_work_minutes || 0), 0)
  const totalBreak = entries.reduce((s, e) => s + (e.break_minutes || 0), 0)
  const totalGross = entries.reduce((s, e) => s + (e.duration_minutes || 0), 0)

  const weekLabel = `${monday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`

  const completedDays = entries.filter(e => e.clock_out).length

  return (
    <div>
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm px-5 py-4 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
        }`}>
          {toast.type === 'success' ? '✓ ' : '✕ '}{toast.msg}
        </div>
      )}

      {/* Week navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => canGoBack && setWeekOffset(w => w - 1)}
          disabled={!canGoBack}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ‹ Prev
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900">{weekLabel}</p>
          {isSubmitted && !isAdmin && (
            <p className="text-xs text-green-700 mt-0.5">
              Submitted — contact your admin to make changes
            </p>
          )}
          {isWeekLocked && !isSubmitted && (
            <p className="text-xs text-amber-600 mt-0.5">
              {weekOffset > FUTURE_WEEKS_LIMIT
                ? `Locked — max ${FUTURE_WEEKS_LIMIT} weeks ahead allowed`
                : 'Locked — contact admin to edit'}
            </p>
          )}
          {weekOffset !== 0 && !isWeekLocked && (
            <button onClick={() => setWeekOffset(0)} className="text-xs text-blue-500 hover:underline mt-0.5">
              Back to this week
            </button>
          )}
        </div>
        <button
          onClick={() => canGoForward && setWeekOffset(w => w + 1)}
          disabled={!canGoForward}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next ›
        </button>
      </div>

      {/* Day dials grid */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {days.map(day => {
          const entry = entryByDate[day.date]
          const netMins = entry?.net_work_minutes || 0
          return (
            <button
              key={day.date}
              onClick={() => !isDayLocked && setSelectedDay(day)}
              disabled={isDayLocked}
              className={`flex flex-col items-center gap-1 py-3 px-1 rounded-xl border transition-all ${isDayLocked ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md active:scale-95'} ${
                day.isToday
                  ? 'border-blue-200 bg-blue-50'
                  : day.isWeekend
                  ? 'border-gray-100 bg-gray-50'
                  : 'border-gray-100 bg-white hover:border-blue-200'
              }`}
            >
              <span className={`text-xs font-semibold ${day.isToday ? 'text-blue-600' : 'text-gray-400'}`}>
                {day.dayName}
              </span>
              <span className={`text-xs ${day.isToday ? 'text-blue-500' : 'text-gray-300'}`}>
                {new Date(day.date + 'T12:00:00').getDate()}
              </span>
              <ClockDial netMinutes={netMins} hasEntry={!!entry} isToday={day.isToday} />
              {entry ? (
                <span className="text-xs text-gray-500">
                  {new Date(entry.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {' – '}
                  {entry.clock_out
                    ? new Date(entry.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '?'}
                </span>
              ) : (
                <span className="text-xs text-gray-300">—</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Submit button */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-400">
          {completedDays} day{completedDays !== 1 ? 's' : ''} logged this week
        </p>
        {isSubmitted ? (
          <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-green-50 text-green-700 border border-green-200">
            ✓ Submitted
          </span>
        ) : (
          <button
            onClick={handleSubmitWeek}
            disabled={submitting || completedDays === 0}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {submitting ? 'Submitting…' : 'Submit Week →'}
          </button>
        )}
      </div>

      {/* Weekly summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total logged', value: formatHours(totalGross), color: 'text-gray-700' },
          { label: 'Break time', value: formatHours(totalBreak), color: 'text-amber-600' },
          { label: 'Net worked', value: formatHours(totalNet), color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 px-4 py-3 text-center">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedDay && (
        <TimeEntryModal
          day={selectedDay}
          entry={entryByDate[selectedDay.date]}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  )
}
