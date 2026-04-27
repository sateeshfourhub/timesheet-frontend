export default function ClockDial({ netMinutes = 0, hasEntry, isToday }) {
  const radius = 36
  const strokeWidth = 6
  const r = radius - strokeWidth / 2
  const circumference = 2 * Math.PI * r
  const maxMinutes = 9 * 60
  const progress = Math.min(netMinutes / maxMinutes, 1)
  const dashOffset = circumference - progress * circumference

  const hours = Math.floor(netMinutes / 60)
  const mins = netMinutes % 60

  const color =
    netMinutes >= 8 * 60 ? '#22c55e'
    : netMinutes >= 4 * 60 ? '#f59e0b'
    : netMinutes > 0 ? '#3b82f6'
    : isToday ? '#e0e7ff'
    : '#e5e7eb'

  const textColor =
    netMinutes >= 8 * 60 ? '#16a34a'
    : netMinutes >= 4 * 60 ? '#d97706'
    : netMinutes > 0 ? '#2563eb'
    : '#9ca3af'

  return (
    <svg width="84" height="84" viewBox="0 0 84 84" className="drop-shadow-sm">
      {/* Track */}
      <circle cx="42" cy="42" r={r} fill="none" stroke="#f3f4f6" strokeWidth={strokeWidth} />
      {/* Progress arc */}
      {netMinutes > 0 && (
        <circle
          cx="42" cy="42" r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(-90 42 42)"
        />
      )}
      {/* Today highlight ring */}
      {isToday && netMinutes === 0 && (
        <circle cx="42" cy="42" r={r} fill="none" stroke="#c7d2fe" strokeWidth={strokeWidth} strokeDasharray="4 4" />
      )}
      {/* Center content */}
      {hasEntry ? (
        <>
          <text x="42" y="38" textAnchor="middle" fontSize="13" fontWeight="700" fill={textColor}>
            {hours}h{mins > 0 ? `${mins}m` : ''}
          </text>
          <text x="42" y="53" textAnchor="middle" fontSize="9" fill="#9ca3af">net</text>
        </>
      ) : (
        <>
          {/* Clock icon */}
          <circle cx="42" cy="42" r="10" fill="none" stroke="#d1d5db" strokeWidth="1.5" />
          <line x1="42" y1="42" x2="42" y2="35" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="42" y1="42" x2="47" y2="42" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" />
          <text x="42" y="60" textAnchor="middle" fontSize="9" fill="#9ca3af">tap</text>
        </>
      )}
    </svg>
  )
}
