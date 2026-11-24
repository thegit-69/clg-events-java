import { create } from 'zustand'

let toastIdCounter = 0

const isUnread = (notification) => !notification?.read && !notification?.isRead
const countUnread = (items) => items.filter(isUnread).length

const useNotificationStore = create((set) => ({
  // Transient toast popups (max 5, auto-dismissed)
  toasts: [],

  // Persisted notifications shared by the bell, page, and toasts
  items: [],
  unreadCount: 0,

  setNotifications: (items) => {
    const list = Array.isArray(items) ? items : []
    set({ items: list, unreadCount: countUnread(list) })
  },

  // Merge a server snapshot with anything already in the store (e.g. a
  // notification that arrived over WebSocket while the request was in flight).
  mergeNotifications: (items) => {
    const incoming = Array.isArray(items) ? items : []
    let merged = []
    set((state) => {
      const incomingIds = new Set(incoming.map((item) => item.id))
      merged = [...incoming, ...state.items.filter((item) => !incomingIds.has(item.id))]
      return { items: merged, unreadCount: countUnread(merged) }
    })
    return merged
  },

  upsertNotification: (notification) => {
    if (!notification?.id) return
    set((state) => {
      const exists = state.items.some((item) => item.id === notification.id)
      const items = exists
        ? state.items.map((item) =>
            item.id === notification.id ? { ...item, ...notification } : item
          )
        : [notification, ...state.items]
      return { items, unreadCount: countUnread(items) }
    })
  },

  markNotificationRead: (id) => {
    if (!id) return
    set((state) => {
      const items = state.items.map((item) =>
        item.id === id ? { ...item, read: true, isRead: true } : item
      )
      return { items, unreadCount: countUnread(items) }
    })
  },

  markAllNotificationsRead: () => {
    set((state) => ({
      items: state.items.map((item) => ({ ...item, read: true, isRead: true })),
      unreadCount: 0,
    }))
  },

  /**
   * Add a toast notification popup.
   * @param {{ title: string, message: string, type?: string }} notification
   */
  addToast: (notification) => {
    const id = ++toastIdCounter
    const toast = {
      id,
      title: notification.title || 'Notification',
      message: notification.message || '',
      type: notification.type || 'DEFAULT',
      createdAt: new Date(),
    }

    set((state) => ({ toasts: [toast, ...state.toasts].slice(0, 5) }))

    // Auto-remove after 5.5 seconds
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 5500)
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },
}))

export default useNotificationStore
