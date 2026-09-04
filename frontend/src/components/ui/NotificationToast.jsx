import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  IoCloseOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoCalendarOutline,
  IoPersonAddOutline,
  IoCheckmarkDoneOutline,
  IoNotificationsOutline,
} from 'react-icons/io5'
import useNotificationStore from '../../store/notificationStore'

// ─── type config ──────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  REGISTRATION: {
    icon: <IoPersonAddOutline />,
    gradient: 'from-emerald-500 to-teal-500',
    ring: 'ring-emerald-200',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    bar: 'bg-emerald-400',
    label: 'Registration',
  },
  APPROVAL: {
    icon: <IoCheckmarkDoneOutline />,
    gradient: 'from-blue-500 to-indigo-500',
    ring: 'ring-blue-200',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    bar: 'bg-blue-400',
    label: 'Approved',
  },
  REJECTED: {
    icon: <IoCloseCircleOutline />,
    gradient: 'from-red-500 to-rose-500',
    ring: 'ring-red-200',
    bg: 'bg-red-50',
    text: 'text-red-700',
    bar: 'bg-red-400',
    label: 'Rejected',
  },
  ATTENDANCE: {
    icon: <IoCheckmarkCircleOutline />,
    gradient: 'from-violet-500 to-purple-500',
    ring: 'ring-violet-200',
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    bar: 'bg-violet-400',
    label: 'Attendance',
  },
  REMINDER: {
    icon: <IoCalendarOutline />,
    gradient: 'from-amber-500 to-orange-500',
    ring: 'ring-amber-200',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    bar: 'bg-amber-400',
    label: 'Reminder',
  },
  DEFAULT: {
    icon: <IoNotificationsOutline />,
    gradient: 'from-primary-500 to-primary-600',
    ring: 'ring-primary-200',
    bg: 'bg-primary-50',
    text: 'text-primary-700',
    bar: 'bg-primary-400',
    label: 'Notification',
  },
}

const DURATION_MS = 5000

// ─── Single Toast Item ─────────────────────────────────────────────────────────
function ToastItem({ toast }) {
  const { removeToast } = useNotificationStore()
  const [progress, setProgress] = useState(100)
  const [paused, setPaused] = useState(false)
  const startTimeRef = useRef(Date.now())
  const remainingRef = useRef(DURATION_MS)
  const rafRef = useRef(null)

  const config = TYPE_CONFIG[toast.type] || TYPE_CONFIG.DEFAULT

  // Animate progress bar
  useEffect(() => {
    const tick = () => {
      if (!paused) {
        const elapsed = Date.now() - startTimeRef.current
        const pct = Math.max(0, 100 - (elapsed / remainingRef.current) * 100)
        setProgress(pct)
        if (pct > 0) {
          rafRef.current = requestAnimationFrame(tick)
        }
      } else {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [paused])

  const handleClose = () => removeToast(toast.id)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.88, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      onMouseEnter={() => {
        setPaused(true)
      }}
      onMouseLeave={() => {
        startTimeRef.current = Date.now()
        remainingRef.current = (progress / 100) * DURATION_MS
        setPaused(false)
      }}
      className={`relative w-80 rounded-2xl shadow-xl overflow-hidden bg-white ring-1 ${config.ring} select-none`}
    >
      {/* Top gradient accent bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${config.gradient}`} />

      <div className="p-4 flex items-start gap-3">
        {/* Icon */}
        <div
          className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-gradient-to-br ${config.gradient} text-white shadow-sm`}
        >
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className={`text-[10px] font-bold uppercase tracking-widest ${config.text} ${config.bg} px-1.5 py-0.5 rounded-md`}
            >
              {config.label}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-900 leading-snug">{toast.title}</p>
          {toast.message && (
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
              {toast.message}
            </p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Dismiss notification"
        >
          <IoCloseOutline size={14} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 w-full bg-gray-100">
        <div
          className={`h-full ${config.bar} transition-none`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  )
}

// ─── Toast Container ──────────────────────────────────────────────────────────
export default function NotificationToast() {
  const { toasts } = useNotificationStore()

  return (
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence mode="sync">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
