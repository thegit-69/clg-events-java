const colorMap = {
  blue: 'bg-primary-50 text-primary-600 border-primary-200',
  green: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  red: 'bg-red-50 text-red-600 border-red-200',
  yellow: 'bg-amber-50 text-amber-600 border-amber-200',
  gray: 'bg-dark-100 text-dark-600 border-dark-200',
  purple: 'bg-purple-50 text-purple-600 border-purple-200',
  teal: 'bg-teal-50 text-teal-600 border-teal-200',
}

const statusColorMap = {
  OPEN: 'green',
  UPCOMING: 'blue',
  CLOSED: 'red',
  COMPLETED: 'gray',
  OFFLINE: 'gray',
  ONLINE: 'purple',
  HYBRID: 'teal',
}

export default function Badge({ children, color, variant = 'status', className = '' }) {
  const resolvedColor = color || statusColorMap[children] || 'gray'
  const colorClasses = colorMap[resolvedColor] || colorMap.gray

  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
        border tracking-wide uppercase
        ${colorClasses} ${className}
      `}
    >
      {children}
    </span>
  )
}
