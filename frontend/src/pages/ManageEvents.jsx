import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  IoRefreshOutline,
  IoTrashOutline,
  IoCreateOutline,
  IoQrCodeOutline,
} from 'react-icons/io5'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import useAuthStore from '../store/authStore'
import { formatDate } from '../utils/helpers'
import {
  deleteEvent as deleteEventFromFirestore,
  fetchMyProposals,
  resubmitEventProposal,
} from '../services/eventService'
import { APPROVAL_STATUS } from '../utils/constants'
import toast from 'react-hot-toast'

export default function ManageEvents() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMyEvents = async () => {
      if (!user?.uid) {
        setLoading(false)
        setEvents([])
        return
      }

      setLoading(true)
      try {
        const myEvents = await fetchMyProposals(user.uid)
        setEvents(myEvents)
      } catch (error) {
        console.error('Failed to load your proposals:', error)
        toast.error('Failed to load your events')
      } finally {
        setLoading(false)
      }
    }

    loadMyEvents()
  }, [user?.uid])

  const handleDelete = async (id, title) => {
    if (window.confirm(`Delete "${title}"?`)) {
      try {
        await deleteEventFromFirestore(id)
        setEvents((prev) => prev.filter((event) => event.id !== id))
      } catch (e) {
        console.error('Delete event error:', e)
        toast.error('Failed to delete event')
        return
      }
      toast.success('Event deleted')
    }
  }

  const handleResubmit = async (eventId) => {
    try {
      await resubmitEventProposal(eventId)
      setEvents((prev) =>
        prev.map((event) =>
          event.id === eventId
            ? {
              ...event,
              approvalStatus: APPROVAL_STATUS.PENDING,
              rejectionReason: null,
            }
            : event
        )
      )
      toast.success('Proposal resubmitted for admin review')
    } catch (error) {
      console.error('Resubmit error:', error)
      toast.error('Failed to resubmit event')
    }
  }

  const getApprovalLabel = (status) =>
    (status || APPROVAL_STATUS.PENDING).toUpperCase()

  const getApprovalColor = (status) => {
    if (status === APPROVAL_STATUS.APPROVED) return 'green'
    if (status === APPROVAL_STATUS.REJECTED) return 'red'
    return 'yellow'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">My Events</h1>
          <p className="text-dark-500 mt-1">Manage all your created events</p>
        </div>
        <Button onClick={() => navigate('/dashboard/create')}>
          + Create Event
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dark-200">
          <p className="text-dark-400 text-lg">Loading your events...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border border-dark-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-4"
            >
              {/* Thumbnail */}
              <div className="w-full md:w-32 h-20 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={event.banner}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-dark-900 text-sm">{event.title}</h3>
                <p className="text-xs text-dark-400 mt-0.5">
                  {event.type} • {formatDate(event.startDate)}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge>{event.status}</Badge>
                  <Badge>{event.mode}</Badge>
                  <Badge color={getApprovalColor(event.approvalStatus)}>
                    {getApprovalLabel(event.approvalStatus)}
                  </Badge>
                  <span className="text-xs text-dark-400">
                    {event.registeredCount} registered
                  </span>
                </div>
                {event.approvalStatus === APPROVAL_STATUS.REJECTED && (
                  <p className="text-xs text-red-500 mt-2">
                    Rejection reason: {event.rejectionReason || 'No reason provided'}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<IoQrCodeOutline />}
                  disabled={event.approvalStatus !== APPROVAL_STATUS.APPROVED}
                  onClick={() => navigate(`/dashboard/events/${event.id}/attendance`)}
                >
                  QR
                </Button>
                {event.approvalStatus === APPROVAL_STATUS.REJECTED && (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<IoRefreshOutline />}
                    onClick={() => handleResubmit(event.id)}
                  >
                    Resubmit
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<IoCreateOutline />}
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  View
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<IoTrashOutline />}
                  className="text-red-500 hover:bg-red-50"
                  onClick={() => handleDelete(event.id, event.title)}
                />
              </div>
            </motion.div>
          ))}

          {events.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border border-dark-200">
              <p className="text-dark-400 text-lg mb-4">No events yet</p>
              <Button onClick={() => navigate('/dashboard/create')}>
                Create your first event
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
