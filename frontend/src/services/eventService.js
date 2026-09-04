import api from './api'
import { subscribeToEventAttendance } from './websocket'
import { getBannerForEventType } from '../utils/constants'
import useNotificationStore from '../store/notificationStore'

// Normalizes event objects so bannerUrl and banner are guaranteed to exist
export const normalizeEvent = (event) => {
  if (!event || typeof event !== 'object') return event
  const banner = event.bannerUrl || event.banner || getBannerForEventType(event.type)
  return {
    ...event,
    banner,
    bannerUrl: banner,
  }
}

// ==========================================
// 1. Events API
// ==========================================

export const fetchApprovedEvents = async (params = {}) => {
  try {
    const data = await api.get('/events', { params })
    // If backend returns Page<EventResponseDto>, extract content
    let list = []
    if (data && Array.isArray(data.content)) {
      list = data.content
    } else if (Array.isArray(data)) {
      list = data
    }
    return list.map(normalizeEvent)
  } catch (error) {
    console.error('Error fetching approved events:', error)
    throw error
  }
}

// Backward-compatible alias
export const fetchEvents = fetchApprovedEvents

export const fetchEventById = async (id) => {
  try {
    const data = await api.get(`/events/${id}`)
    return data ? normalizeEvent(data) : null
  } catch (error) {
    console.error(`Error fetching event ${id}:`, error)
    return null
  }
}

export const createEvent = async (eventData) => {
  try {
    const payload = {
      title: eventData.title,
      type: eventData.type,
      mode: eventData.mode || 'OFFLINE',
      description: eventData.description,
      venue: eventData.venue,
      banner: eventData.banner || eventData.bannerUrl,
      startDate: eventData.startDate ? new Date(eventData.startDate).toISOString() : new Date().toISOString(),
      endDate: eventData.endDate ? new Date(eventData.endDate).toISOString() : new Date().toISOString(),
      registrationDeadline: eventData.registrationDeadline ? new Date(eventData.registrationDeadline).toISOString() : null,
      maxParticipants: eventData.maxParticipants ? parseInt(eventData.maxParticipants, 10) : 100,
      tags: eventData.tags || [],
    }
    const created = await api.post('/events', payload)
    return created?.id || created
  } catch (error) {
    console.error('Error creating event:', error)
    throw error
  }
}

export const updateEvent = async (id, updates) => {
  try {
    const payload = {
      title: updates.title,
      type: updates.type,
      mode: updates.mode,
      description: updates.description,
      venue: updates.venue,
      banner: updates.banner || updates.bannerUrl,
      startDate: updates.startDate ? new Date(updates.startDate).toISOString() : undefined,
      endDate: updates.endDate ? new Date(updates.endDate).toISOString() : undefined,
      registrationDeadline: updates.registrationDeadline ? new Date(updates.registrationDeadline).toISOString() : undefined,
      maxParticipants: updates.maxParticipants ? parseInt(updates.maxParticipants, 10) : undefined,
      tags: updates.tags,
    }
    return await api.put(`/events/${id}`, payload)
  } catch (error) {
    console.error(`Error updating event ${id}:`, error)
    throw error
  }
}

export const deleteEvent = async (id) => {
  try {
    return await api.delete(`/events/${id}`)
  } catch (error) {
    console.error(`Error deleting event ${id}:`, error)
    throw error
  }
}

export const fetchMyProposals = async (uid) => {
  try {
    const data = await api.get('/events/my-proposals')
    return Array.isArray(data) ? data.map(normalizeEvent) : []
  } catch (error) {
    console.error('Error fetching proposals:', error)
    return []
  }
}

export const fetchDashboardStats = async () => {
  try {
    const data = await api.get('/events/dashboard-stats')
    return data || { totalEvents: 0, totalRegistrations: 0, pendingEvents: 0, approvedEvents: 0 }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return { totalEvents: 0, totalRegistrations: 0, pendingEvents: 0, approvedEvents: 0 }
  }
}

export const resubmitEventProposal = async (eventId) => {
  try {
    return await api.post(`/events/${eventId}/resubmit`)
  } catch (error) {
    console.error(`Error resubmitting event ${eventId}:`, error)
    throw error
  }
}

// ==========================================
// 2. Admin Review API
// ==========================================

export const fetchPendingEventsForAdmin = async () => {
  try {
    const data = await api.get('/admin/pending-events')
    return Array.isArray(data) ? data.map(normalizeEvent) : []
  } catch (error) {
    console.error('Error fetching pending admin events:', error)
    return []
  }
}

export const reviewEventProposal = async ({
  eventId,
  nextStatus,
  reviewerUid,
  rejectionReason,
}) => {
  try {
    const status = String(nextStatus).toUpperCase()
    return await api.put(`/admin/events/${eventId}/review`, {
      status,
      rejectionReason: status === 'REJECTED' ? rejectionReason : null,
    })
  } catch (error) {
    console.error(`Error reviewing event ${eventId}:`, error)
    throw error
  }
}

// ==========================================
// 3. Registrations & Attendance API
// ==========================================

export const registerForEvent = async (eventId, currentUser) => {
  try {
    const payload = {
      displayName: currentUser?.displayName || null,
      email: currentUser?.email || null,
    }
    const ticket = await api.post(`/events/${eventId}/register`, payload)
    // Instant success toast
    useNotificationStore.getState().addToast({
      title: 'Registration Successful!',
      message: 'You have been registered for the event. Check My Tickets for your QR code.',
      type: 'REGISTRATION',
    })
    return ticket?.id || ticket
  } catch (error) {
    console.error(`Error registering for event ${eventId}:`, error)
    throw error
  }
}

export const fetchUserRegistrations = async (uid) => {
  try {
    const data = await api.get('/registrations/my-tickets')
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error fetching user registrations:', error)
    return []
  }
}

export const fetchRegistrations = async (eventId) => {
  try {
    const data = await api.get(`/registrations/event/${eventId}/attendees`)
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error(`Error fetching attendees for event ${eventId}:`, error)
    return []
  }
}

export const checkUserAttendance = async (eventId, userId) => {
  try {
    const data = await api.get(`/events/${eventId}/attendance-status`)
    return Boolean(data?.attended)
  } catch (error) {
    console.error(`Error checking attendance for event ${eventId}:`, error)
    return false
  }
}

export const fetchUserEventRegistration = async (eventId, userId) => {
  try {
    const data = await api.get(`/events/${eventId}/attendance-status`)
    if (data && data.registered) {
      return {
        id: data.registrationId,
        attended: data.attended,
        attendedAt: data.attendedAt,
      }
    }
    return null
  } catch (error) {
    console.error(`Error checking user registration for event ${eventId}:`, error)
    return null
  }
}

export const markAttendance = async (registrationId) => {
  try {
    const result = await api.post('/attendance/mark', { registrationId })
    // Instant attendance toast
    useNotificationStore.getState().addToast({
      title: 'Attendance Marked!',
      message: 'Your attendance has been recorded successfully.',
      type: 'ATTENDANCE',
    })
    return result
  } catch (error) {
    console.error(`Error marking attendance for registration ${registrationId}:`, error)
    throw error
  }
}

/**
 * True real-time attendance subscription using WebSocket STOMP
 */
export const subscribeUserAttendance = (eventId, userId, onChange, onError) => {
  if (!eventId || !userId) {
    if (typeof onChange === 'function') onChange(false)
    return () => {}
  }

  // 1. Initial status fetch
  checkUserAttendance(eventId, userId)
    .then((attended) => {
      if (typeof onChange === 'function') onChange(attended)
    })
    .catch((err) => {
      if (typeof onError === 'function') onError(err)
    })

  // 2. Real-time WebSocket STOMP subscription
  const unsubscribeWs = subscribeToEventAttendance(
    eventId,
    (attendanceEvent) => {
      if (attendanceEvent?.userId === userId || !attendanceEvent?.userId) {
        if (typeof onChange === 'function') {
          onChange(attendanceEvent?.attended || true)
        }
      }
    },
    onError
  )

  return () => {
    unsubscribeWs()
  }
}

// ==========================================
// 4. Notifications API
// ==========================================

export const fetchNotifications = async () => {
  try {
    const data = await api.get('/notifications')
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
}

export const markAllNotificationsRead = async () => {
  try {
    return await api.patch('/notifications/mark-read')
  } catch (error) {
    console.error('Error marking all notifications read:', error)
    throw error
  }
}

export const markNotificationRead = async (id) => {
  try {
    return await api.patch(`/notifications/${id}/mark-read`)
  } catch (error) {
    console.error(`Error marking notification ${id} read:`, error)
    throw error
  }
}

export const deleteNotification = async (id) => {
  try {
    return await api.delete(`/notifications/${id}`)
  } catch (error) {
    console.error(`Error deleting notification ${id}:`, error)
    throw error
  }
}
