import { useState, useEffect, useRef } from 'react'

const BREAK_PRESETS = [
  { label: 'No break', value: 0 },
  { label: '15 min',   value: 15 },
  { label: '30 min',   value: 30 },
  { label: '1 hr',     value: 60 },
]
const PRESET_VALUES = new Set(BREAK_PRESETS.map(p => p.value))

function toLocalTimeInput(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function buildDatetime(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}:00`).toISOString()
}

export default function TimeEntryModal({ day, entry, onSave, onDelete, onClose }) {
  const [startTime,  setStartTime]  = useState('09:00')
  const [endTime,    setEndTime]    = useState('17:00')
  const [breakMins,  setBreakMins]  = useState(30)
  const [isCustom,   setIsCustom]   = useState(false)
  const [customRaw,  setCustomRaw]  = useState('')
  const [notes,      setNotes]      = useState('')
  const [saving,     setSaving]     = useState(false)
  const customInputRef = useRef(null)

  useEffect(() => {
    if (entry) {
      setStartTime(toLocalTimeInput(entry.clock_in))
      setEndTime(entry.clock_out ? toLocalTimeInput(entry.clock_out) : '17:00')
      const mins = entry.break_minutes ?? 30
      setBreakMins(mins)
      const custom = !PRESET_VALUES.has(mins)
      setIsCustom(custom)
      setCustomRaw(custom ? String(mins) : '')
      setNotes(entry.notes ?? '')
    }
  }, [entry])

  // Focus the custom input as soon as it appears
  useEffect(() => {
    if (isCustom) customInputRef.current?.focus()
  }, [isCustom])

  const totalShiftMins = () => {
    if (!startTime || !endTime) return 0
    const start = new Date(`${day.date}T${startTime}`)
    const end   = new Date(`${day.date}T${endTime}`)
    return Math.max(0, (end - start) / 60000)
  }

  const calcNet = () => {
    const total = totalShiftMins()
    if (total <= 0) return null
    return Math.max(0, total - breakMins)
  }

  const netMins  = calcNet()
  const netHours = netMins !== null ? `${Math.floor(netMins / 60)}h ${netMins % 60}m` : '—'

  const selectPreset = (value) => {
    setIsCustom(false)
    setCustomRaw('')
    setBreakMins(value)
  }

  const selectCustom = () => {
    setIsCustom(true)
    // Seed the input with the current value if it's not already a preset
    setCustomRaw(PRESET_VALUES.has(breakMins) ? '' : String(breakMins))
  }

  const handleCustomChange = (e) => {
    const raw = e.target.value
    setCustomRaw(raw)
    const parsed = parseInt(raw, 10)
    if (!isNaN(parsed) && parsed >= 0) setBreakMins(parsed)
  }

  // Validation for the save button and error message
  const shift = totalShiftMins()
  const customInvalid = isCustom && (customRaw === '' || isNaN(parseInt(customRaw, 10)) || parseInt(customRaw, 10) < 0)
  const breakTooLong  = breakMins > 0 && shift > 0 && breakMins >= shift
  const canSave       = !saving && netMins !== null && netMins > 0 && !customInvalid

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      await onSave({
        clock_in:      buildDatetime(day.date, startTime),
        clock_out:     buildDatetime(day.date, endTime),
        break_minutes: breakMins,
        notes,
        entryId:       entry?.id,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!entry) return
    setSaving(true)
    try {
      await onDelete(entry.id)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{day.dayName}</p>
              <p className="text-lg font-bold text-gray-900">{day.displayDate}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Start time</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">End time</label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Break time */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Break time</label>
            <div className="flex gap-2 flex-wrap">
              {BREAK_PRESETS.map(p => (
                <button
                  key={p.value}
                  onClick={() => selectPreset(p.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    !isCustom && breakMins === p.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
              <button
                onClick={selectCustom}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  isCustom
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                }`}
              >
                Custom
              </button>
            </div>

            {/* Custom input — shown only when Custom is selected */}
            {isCustom && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  ref={customInputRef}
                  type="number"
                  min="1"
                  step="1"
                  value={customRaw}
                  onChange={handleCustomChange}
                  placeholder="e.g. 90"
                  className={`w-28 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    customInvalid || breakTooLong ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
                <span className="text-xs text-gray-500">minutes</span>
                {breakTooLong && (
                  <span className="text-xs text-red-500">exceeds shift duration</span>
                )}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              <span>{startTime}</span>
              <span className="mx-2 text-gray-300">→</span>
              <span>{endTime}</span>
              {breakMins > 0 && !customInvalid && (
                <span className="ml-2 text-gray-400">− {breakMins}m break</span>
              )}
            </div>
            <span className={`text-sm font-bold ${canSave && netMins > 0 ? 'text-green-600' : 'text-red-400'}`}>
              {customInvalid ? '—' : netHours}
            </span>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Client meeting, WFH..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-2">
          {entry && (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium text-red-500 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Delete
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : entry ? 'Update' : 'Save'}
          </button>
        </div>

      </div>
    </div>
  )
}
