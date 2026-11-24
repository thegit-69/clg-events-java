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
  const { addToast, mergeNotifications, upsertNotification } = useNotificationStore()

  // Notification IDs already delivered as toasts (dedupes WebSocket vs polling)
  const seenIdsRef = useRef(new Set())
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

  // ── Load approved events on mount & when auth state changes ───────────────
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const events = await fetchApprovedEvents()
        setEvents(events)
      } catch (error) {
        console.warn('Approved events fetch failed:', error.message)
      }
    }
    loadEvents()
  }, [setEvents, isAuthenticated])


  // ── Real-time notifications: WebSocket + polling fallback ─────────────────
  useEffect(() => {
    const seenIds = seenIdsRef.current
    seenIds.clear()
    useNotificationStore.getState().setNotifications([])

    if (!isAuthenticated || !user?.uid) return

    const userId = user.uid

    const ingest = (list) => {
      const safeList = Array.isArray(list) ? list : []
      return mergeNotifications(safeList)
    }

    // 1. Seed the shared store and treat existing notifications as already seen
    const seedNotifications = async () => {
      try {
        const list = ingest(await fetchNotifications())
        list.forEach((n) => {
          if (n?.id) seenIds.add(n.id)
        })
      } catch {
        // Ignore seed errors
      }
    }

    seedNotifications()

    // 2. WebSocket STOMP — real-time push
    try {
      const unsub = subscribeToUserNotifications(userId, (notification) => {
        if (!notification?.id) return
        upsertNotification(notification)
        if (!seenIds.has(notification.id)) {
          seenIds.add(notification.id)
          addToast({
            title: notification.title || 'New Notification',
            message: notification.message || '',
            type: notification.type || 'DEFAULT',
          })
        }
      })
      wsUnsubRef.current = unsub
    } catch (err) {
      console.warn('[WS] Could not subscribe to notifications:', err)
    }

    // 3. Polling fallback every 30 seconds (catches cases where WS isn't available)
    const poll = async () => {
      try {
        const list = ingest(await fetchNotifications())
        const newOnes = list.filter(
          (n) => n?.id && !n.read && !n.isRead && !seenIds.has(n.id)
        )

        // Show at most 3 at once from polling to avoid flooding
        newOnes.slice(0, 3).forEach((n) => {
          seenIds.add(n.id)
          addToast({
            title: n.title || 'New Notification',
            message: n.message || '',
            type: n.type || 'DEFAULT',
          })
        })
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
  }, [isAuthenticated, user?.uid, addToast, mergeNotifications, upsertNotification])

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
          <Route path="tickets" element={<MyTickets />} />
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
