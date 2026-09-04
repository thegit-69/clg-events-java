import { create } from 'zustand'

let toastIdCounter = 0

const useNotificationStore = create((set) => ({
  toasts: [],

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
