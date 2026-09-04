import { useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/layout/Layout'
import DashboardLayout from './components/layout/DashboardLayout'
import Home from './pages/Home'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import Dashboard from './pages/Dashboard'
import ManageEvents from './pages/ManageEvents'
import CreateEvent from './pages/CreateEvent'
import Attendance from './pages/Attendance'
import Notifications from './pages/Notifications'
import MyTickets from './pages/MyTickets'
import NotFound from './pages/NotFound'
import AdminReview from './pages/AdminReview'
import NotificationToast from './components/ui/NotificationToast'
import useAuthStore from './store/authStore'
import useEventStore from './store/eventStore'
import useNotificationStore from './store/notificationStore'
import { getUserRole, onAuthChange } from './services/authService'
import { fetchApprovedEvents, fetchNotifications } from './services/eventService'
import { subscribeToUserNotifications } from './services/websocket'

function App() {
  const { setUser, setLoading, user, isAuthenticated } = useAuthStore()
  const { setEvents } = useEventStore()
  const { addToast } = useNotificationStore()

  // Track the most recently seen notification timestamp for polling dedup
  const lastNotifTimeRef = useRef(null)
  // Track WS unsubscribe fn
  const wsUnsubRef = useRef(null)

  // ── Auth state listener ────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthChange((authUser) => {
      if (authUser) {
        setUser({
          uid: authUser.uid,
          displayName: authUser.displayName,
          email: authUser.email,
          photoURL: authUser.photoURL,
          role: getUserRole(authUser.email),
        })
      } else {
        setUser(null)
      }
    })
    return () => unsubscribe()
  }, [setUser, setLoading])

  // ── Load approved events on mount ─────────────────────────────────────────
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const events = await fetchApprovedEvents()
        setEvents(events)
      } catch (error) {
        console.warn('Approved events fetch failed:', error.message)
        setEvents([])
      }
    }
    loadEvents()
  }, [setEvents])

  // ── Real-time notifications: WebSocket + polling fallback ─────────────────
  useEffect(() => {
    if (!isAuthenticated || !user?.uid) return

    const userId = user.uid

    // 1. Seed the last-seen timestamp from server so first poll doesn't re-toast old ones
    const seedLastSeen = async () => {
      try {
        const data = await fetchNotifications()
        if (Array.isArray(data) && data.length > 0) {
          const latest = data.reduce((max, n) => {
            const t = n.createdAt ? new Date(n.createdAt).getTime() : 0
            return t > max ? t : max
          }, 0)
          lastNotifTimeRef.current = latest
        } else {
          lastNotifTimeRef.current = Date.now()
        }
      } catch {
        lastNotifTimeRef.current = Date.now()
      }
    }

    seedLastSeen()

    // 2. WebSocket STOMP — real-time push
    try {
      const unsub = subscribeToUserNotifications(userId, (notification) => {
        addToast({
          title: notification.title || 'New Notification',
          message: notification.message || '',
          type: notification.type || 'DEFAULT',
        })
        // Advance the last-seen pointer so polling won't duplicate it
        const t = notification.createdAt ? new Date(notification.createdAt).getTime() : Date.now()
        if (!lastNotifTimeRef.current || t > lastNotifTimeRef.current) {
          lastNotifTimeRef.current = t
        }
      })
      wsUnsubRef.current = unsub
    } catch (err) {
      console.warn('[WS] Could not subscribe to notifications:', err)
    }

    // 3. Polling fallback every 30 seconds (catches cases where WS isn't available)
    const poll = async () => {
      try {
        const data = await fetchNotifications()
        if (!Array.isArray(data)) return

        const newOnes = data.filter((n) => {
          if (n.read || n.isRead) return false
          const t = n.createdAt ? new Date(n.createdAt).getTime() : 0
          return t > (lastNotifTimeRef.current || 0)
        })

        if (newOnes.length > 0) {
          // Advance pointer before showing toasts to avoid race with WS
          const maxT = newOnes.reduce((m, n) => {
            const t = n.createdAt ? new Date(n.createdAt).getTime() : 0
            return t > m ? t : m
          }, lastNotifTimeRef.current || 0)
          lastNotifTimeRef.current = maxT

          // Show at most 3 at once from polling to avoid flooding
          newOnes.slice(0, 3).forEach((n) =>
            addToast({
              title: n.title || 'New Notification',
              message: n.message || '',
              type: n.type || 'DEFAULT',
            })
          )
        }
      } catch {
        // Silently ignore poll errors
      }
    }

    const intervalId = setInterval(poll, 30_000)

    return () => {
      clearInterval(intervalId)
      if (wsUnsubRef.current) {
        try { wsUnsubRef.current() } catch {}
        wsUnsubRef.current = null
      }
    }
  }, [isAuthenticated, user?.uid, addToast])

  return (
    <BrowserRouter>
      {/* Global react-hot-toast (used elsewhere) */}
      <Toaster position="top-right" />

      {/* Real-time notification toasts */}
      <NotificationToast />

      <Routes>
        {/* Public routes with Navbar + Footer */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/my-tickets" element={<MyTickets />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Dashboard routes with Sidebar */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="events" element={<ManageEvents />} />
          <Route path="create" element={<CreateEvent />} />
          <Route path="events/:id/attendance" element={<Attendance />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="admin/review" element={<AdminReview />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
