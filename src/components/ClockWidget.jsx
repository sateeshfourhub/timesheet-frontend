import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clockIn, clockOut, getClockStatus } from '../api/timeEntries'

function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0')
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

export default function ClockWidget() {
  const [elapsed, setElapsed] = useState(0)
  const queryClient = useQueryClient()

  const { data: status, isLoading } = useQuery({
    queryKey: ['clock-status'],
    queryFn: getClockStatus,
    refetchInterval: 30000,
  })

  useEffect(() => {
    if (!status?.is_clocked_in || !status?.clock_in_time) return
    const startTime = new Date(status.clock_in_time)
    const update = () => setElapsed(Math.floor((Date.now() - startTime) / 1000))
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [status])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['clock-status'] })
    queryClient.invalidateQueries({ queryKey: ['time-entries'] })
  }

  const clockInMutation = useMutation({ mutationFn: () => clockIn(), onSuccess: invalidate })
  const clockOutMutation = useMutation({ mutationFn: () => clockOut(), onSuccess: invalidate })

  if (isLoading) {
    return <div className="h-40 bg-white rounded-xl shadow-sm border border-gray-200 animate-pulse" />
  }

  const isClockedIn = status?.is_clocked_in
  const isPending = clockInMutation.isPending || clockOutMutation.isPending

  return (
    <div
      className={`rounded-xl shadow-sm p-6 text-center border ${
        isClockedIn ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
      }`}
    >
      <div className="text-sm font-medium text-gray-500 mb-2">
        {isClockedIn ? 'Currently Working' : 'Not Clocked In'}
      </div>

      {isClockedIn && (
        <div className="text-4xl font-mono font-bold text-green-700 mb-4">
          {formatElapsed(elapsed)}
        </div>
      )}

      <button
        onClick={() => (isClockedIn ? clockOutMutation.mutate() : clockInMutation.mutate())}
        disabled={isPending}
        className={`px-8 py-3 rounded-full font-semibold text-white transition-colors disabled:opacity-50 ${
          isClockedIn ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
        }`}
      >
        {isPending ? 'Processing...' : isClockedIn ? 'Clock Out' : 'Clock In'}
      </button>
    </div>
  )
}
