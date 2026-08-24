import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  IoNotificationsOutline,
  IoCheckmarkCircle,
  IoTimeOutline,
  IoCalendarOutline,
  IoPersonOutline,
} from 'react-icons/io5'

const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    type: 'registration',
    title: 'New Registration',
    message: 'Alice Johnson registered for HackSRM 2026',
    time: '2 minutes ago',
    read: false,
    icon: <IoPersonOutline />,
  },
  {
    id: '2',
    type: 'reminder',
    title: 'Event Reminder',
    message: 'AI/ML Workshop starts in 2 hours',
    time: '1 hour ago',
    read: false,
    icon: <IoTimeOutline />,
  },
  {
    id: '3',
    type: 'event',
    title: 'Event Update',
    message: 'CyberSec CTF venue has been changed to Lab 201',
    time: '3 hours ago',
    read: true,
    icon: <IoCalendarOutline />,
  },
  {
    id: '4',
    type: 'registration',
    title: 'Registration Milestone',
    message: 'HackSRM 2026 has reached 300+ registrations!',
    time: '5 hours ago',
    read: true,
    icon: <IoNotificationsOutline />,
  },
  {
    id: '5',
    type: 'reminder',
    title: 'Deadline Approaching',
    message: 'Registration for Web3 Seminar closes tomorrow',
    time: '1 day ago',
    read: true,
    icon: <IoTimeOutline />,
  },
]

export default function Notifications() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
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

      <div className="space-y-3">
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => markAsRead(notification.id)}
            className={`bg-white border rounded-xl p-5 flex items-start gap-4 cursor-pointer
                        transition-colors duration-200 hover:bg-dark-50
                        ${notification.read ? 'border-dark-200' : 'border-primary-200 bg-primary-50/30'}`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0
                ${notification.read ? 'bg-dark-100 text-dark-400' : 'bg-primary-100 text-primary-600'}`}
            >
              {notification.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-dark-900">
                  {notification.title}
                </h3>
                {!notification.read && (
                  <div className="w-2 h-2 bg-primary-500 rounded-full" />
                )}
              </div>
              <p className="text-sm text-dark-500">{notification.message}</p>
              <p className="text-xs text-dark-400 mt-1">{notification.time}</p>
            </div>
            {notification.read && (
              <IoCheckmarkCircle className="text-dark-300 text-lg flex-shrink-0 mt-1" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
