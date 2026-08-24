import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  IoNotificationsOutline,
  IoCheckmarkCircle,
  IoTimeOutline,
  IoCalendarOutline,
  IoPersonOutline,
  IoCheckmarkDoneOutline,
} from 'react-icons/io5'
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/eventService'
import { formatDistanceToNow } from 'date-fns'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const data = await fetchNotifications()
      setNotifications(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const unreadCount = notifications.filter((n) => !n.read && !n.isRead).length

  const markAllRead = async () => {
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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Notifications</h1>
          <p className="text-dark-500 mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm font-medium text-primary-500 hover:text-primary-600"
          >
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white border border-dark-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white border border-dark-100 rounded-xl p-12 text-center text-dark-400">
          <IoNotificationsOutline className="text-4xl mx-auto mb-2 opacity-50" />
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification, index) => {
            const isRead = Boolean(notification.read || notification.isRead)
            const timeAgo = notification.createdAt
              ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
              : 'Just now'

            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => markAsRead(notification.id)}
                className={`bg-white border rounded-xl p-5 flex items-start gap-4 cursor-pointer
                            transition-colors duration-200 hover:bg-dark-50
                            ${isRead ? 'border-dark-200' : 'border-primary-200 bg-primary-50/30'}`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0
                    ${isRead ? 'bg-dark-100 text-dark-400' : 'bg-primary-100 text-primary-600'}`}
                >
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-dark-900">
                      {notification.title}
                    </h3>
                    {!isRead && (
                      <div className="w-2 h-2 bg-primary-500 rounded-full" />
                    )}
                  </div>
                  <p className="text-sm text-dark-500">{notification.message}</p>
                  <p className="text-xs text-dark-400 mt-1">{timeAgo}</p>
                </div>
                {isRead && (
                  <IoCheckmarkCircle className="text-dark-300 text-lg flex-shrink-0 mt-1" />
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
