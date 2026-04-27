import { useQuery } from '@tanstack/react-query'
import { listEntries } from '../api/timeEntries'

function formatHours(minutes) {
  return `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m`
}

export default function TimesheetTable({ startDate, endDate }) {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['time-entries', startDate, endDate],
    queryFn: () => listEntries(startDate, endDate),
  })

  const totalMinutes = entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0)

  if (isLoading) {
    return <div className="h-48 bg-white rounded-xl shadow-sm border border-gray-200 animate-pulse" />
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">This Week</h2>
        {entries.length > 0 && (
          <span className="text-sm text-gray-500">
            Total: <strong>{formatHours(totalMinutes)}</strong>
          </span>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="px-6 py-12 text-center text-gray-400 text-sm">No entries this week</div>
      ) : (
        <div className="divide-y divide-gray-50">
          {entries.map((entry) => (
            <div key={entry.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {new Date(entry.clock_in).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                  {' · '}
                  {new Date(entry.clock_in).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {entry.clock_out &&
                    ` → ${new Date(entry.clock_out).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`}
                </div>
                {entry.notes && (
                  <div className="text-xs text-gray-400 mt-0.5">{entry.notes}</div>
                )}
              </div>
              <div className="text-right">
                {entry.duration_minutes ? (
                  <span className="text-sm font-semibold text-gray-700">
                    {formatHours(entry.duration_minutes)}
                  </span>
                ) : (
                  <span className="text-xs text-green-600 font-medium">In progress</span>
                )}
                <div className="text-xs text-gray-400 capitalize">{entry.entry_type}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
