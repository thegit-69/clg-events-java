import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  IoNotificationsOutline,
  IoCheckmarkDoneOutline,
  IoCalendarOutline,
  IoPersonOutline,
  IoTimeOutline,
} from 'react-icons/io5'
import { formatDistanceToNow } from 'date-fns'
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/eventService'
import useAuthStore from '../../store/authStore'

const getIcon = (type) => {
  switch (type) {
    case 'REGISTRATION':
      return <IoPersonOutline />
    case 'REMINDER':
      return <IoTimeOutline />
    case 'APPROVAL':
      return <IoCheckmarkDoneOutline />
    default:
      return <IoCalendarOutline />
  }
}

export default function NotificationBell({ align = 'right' }) {
  const { isAuthenticated } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const containerRef = useRef(null)

  const load = async () => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const data = await fetchNotifications()
      setNotifications(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadCount = notifications.filter((n) => !n.read && !n.isRead).length
  const recent = notifications.slice(0, 5)

  const toggleOpen = () => {
    const next = !open
    setOpen(next)
    if (next) load()
  }

  const markAllRead = async (event) => {
    event.stopPropagation()
    try {
      await markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })))
    } catch (err) {
      console.error('Failed to mark all notifications read:', err)
    }
  }

  const markAsRead = async (id) => {
    try {
      await markNotificationRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true, isRead: true } : n))
      )
    } catch (err) {
      console.error(`Failed to mark notification ${id} read:`, err)
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggleOpen}
        aria-label="Notifications"
        className="relative p-2 rounded-full text-dark-500 hover:text-dark-900 hover:bg-dark-50 transition-colors"
      >
        <IoNotificationsOutline size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white border border-dark-100 rounded-xl shadow-xl z-50 overflow-hidden`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-dark-100">
            <h3 className="text-sm font-semibold text-dark-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-primary-500 hover:text-primary-600"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-dark-50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <div className="px-4 py-10 text-center text-dark-400">
                <IoNotificationsOutline className="text-3xl mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications yet.</p>
              </div>
            ) : (
              recent.map((notification) => {
                const isRead = Boolean(notification.read || notification.isRead)
                const timeAgo = notification.createdAt
                  ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
                  : 'Just now'

                return (
                  <button
                    type="button"
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-dark-50 last:border-b-0 transition-colors hover:bg-dark-50 ${
                      isRead ? 'bg-white' : 'bg-primary-50/30'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isRead ? 'bg-dark-100 text-dark-400' : 'bg-primary-100 text-primary-600'
                      }`}
                    >
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-dark-900 truncate">
                          {notification.title}
                        </p>
                        {!isRead && (
                          <span className="w-1.5 h-1.5 bg-primary-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-dark-500 line-clamp-2">{notification.message}</p>
                      <p className="text-[11px] text-dark-400 mt-0.5">{timeAgo}</p>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          <Link
            to="/dashboard/notifications"
            onClick={() => setOpen(false)}
            className="block text-center text-sm font-medium text-primary-500 hover:bg-primary-50 py-3 border-t border-dark-100 transition-colors"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  )
}
