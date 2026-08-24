import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import {
  IoCalendarOutline,
  IoLocationOutline,
  IoPeopleOutline,
  IoTimeOutline,
  IoArrowBack,
  IoShareSocialOutline,
  IoTicketOutline,
} from 'react-icons/io5'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import CertificateDownload from '../components/ui/CertificateDownload'
import useEventStore from '../store/eventStore'
import useAuthStore from '../store/authStore'
import { formatDateLong, formatDateTime } from '../utils/helpers'
import {
  fetchEventById,
  fetchUserEventRegistration,
  registerForEvent,
  updateEvent as updateEventInFirestore,
} from '../services/eventService'
import { APPROVAL_STATUS } from '../utils/constants'
import toast from 'react-hot-toast'

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { events, updateEvent } = useEventStore()
  const { user, isAuthenticated, isSuperAdmin } = useAuthStore()
  const [event, setEvent] = useState(null)
  const [loadingEvent, setLoadingEvent] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [registrationId, setRegistrationId] = useState(null)
  const [isAttended, setIsAttended] = useState(false)
  const [loadingReg, setLoadingReg] = useState(true)

  useEffect(() => {
    const loadEvent = async () => {
      setLoadingEvent(true)
      try {
        const fromStore = events.find((e) => e.id === id)
        if (fromStore) {
          setEvent(fromStore)
        }

        const fromFirestore = await fetchEventById(id)
        setEvent(fromFirestore || fromStore || null)
      } catch (error) {
        console.error('Failed to load event:', error)
        setEvent(null)
      } finally {
        setLoadingEvent(false)
      }
    }

    loadEvent()
  }, [id, events])

  useEffect(() => {
    const checkRegistration = async () => {
      if (!isAuthenticated || !user?.uid || !id) {
        setLoadingReg(false)
        return
      }
      try {
        const reg = await fetchUserEventRegistration(id, user.uid)
        if (reg) {
          setRegistrationId(reg.id)
          setIsAttended(reg.attended || false)
        }
      } catch (error) {
        console.error('Failed to check registration:', error)
      } finally {
        setLoadingReg(false)
      }
    }
    checkRegistration()
  }, [id, user?.uid, isAuthenticated])

  const ownerUid = event?.createdBy || event?.organizerId
  const canViewUnapproved =
    isAuthenticated && (ownerUid === user?.uid || isSuperAdmin)
  const isApproved = event?.approvalStatus === APPROVAL_STATUS.APPROVED
  const canViewEvent = !!event && (isApproved || canViewUnapproved)
  const canRegisterForEvent = isApproved

  if (loadingEvent) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-dark-400">Loading event...</p>
      </div>
    )
  }

  if (!canViewEvent) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-dark-900 mb-4">Event not available</h2>
        <Button onClick={() => navigate('/events')}>Browse Events</Button>
      </div>
    )
  }

  const spotsLeft = event.maxParticipants - event.registeredCount
  const progress = (event.registeredCount / event.maxParticipants) * 100

  const handleRegister = async () => {
    if (!canRegisterForEvent) {
      toast.error('You can register only after this event is approved')
      return
    }

    if (!isAuthenticated) {
      toast.error('Please sign in to register')
      return
    }

    if (!user?.uid) {
      toast.error('Could not verify your account. Please sign in again.')
      return
    }

    setRegistering(true)
    try {
      // Re-validate against Firestore to match security rules exactly.
      const latestEvent = await fetchEventById(event.id)
      if (!latestEvent || latestEvent.approvalStatus !== APPROVAL_STATUS.APPROVED) {
        toast.error('This event is not approved for registration yet')
        return
      }

      const regId = await registerForEvent(event.id, user)
      setRegistrationId(regId)
      const newCount = (event.registeredCount || 0) + 1
      // Update in Firestore (best effort)
      try {
        await updateEventInFirestore(event.id, { registeredCount: newCount })
      } catch (e) { /* non-critical */ }
      updateEvent(event.id, { registeredCount: newCount })
      setEvent(prev => ({ ...prev, registeredCount: newCount }))
      toast.success(`Registered for ${event.title}!`)
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('Registration failed. Please try again.')
    } finally {
      setRegistering(false)
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied to clipboard!')
  }

  return (
    <div className="min-h-screen">
      {/* Banner */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        <img
          src={event.banner}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <IoArrowBack size={20} /> Back
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-dark-200 shadow-lg overflow-hidden"
        >
          <div className="p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge>{event.mode}</Badge>
                  <Badge>{event.status}</Badge>
                </div>
                <h1 className="text-3xl font-bold text-dark-900">{event.title}</h1>
                <p className="text-dark-500 mt-1">
                  Organized by <span className="font-semibold text-dark-700">{event.organizer}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" icon={<IoShareSocialOutline />} onClick={handleShare}>
                  Share
                </Button>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <IoCalendarOutline className="text-primary-500 text-xl mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-dark-700">Date</p>
                    <p className="text-sm text-dark-500">
                      {formatDateLong(event.startDate)} — {formatDateLong(event.endDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <IoTimeOutline className="text-primary-500 text-xl mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-dark-700">Time</p>
                    <p className="text-sm text-dark-500">{formatDateTime(event.startDate)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <IoLocationOutline className="text-primary-500 text-xl mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-dark-700">Venue</p>
                    <p className="text-sm text-dark-500">{event.venue}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start gap-3 mb-4">
                  <IoPeopleOutline className="text-primary-500 text-xl mt-0.5" />
                  <div className="w-full">
                    <p className="text-sm font-medium text-dark-700">Registrations</p>
                    <p className="text-sm text-dark-500 mb-2">
                      {event.registeredCount} / {event.maxParticipants} spots filled
                    </p>
                    <div className="w-full bg-dark-100 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-emerald-600 font-medium mt-1">
                      {spotsLeft} spots remaining
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-3">
                Themes
              </h3>
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <Badge key={tag} color="gray">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-dark-900 mb-3">About this event</h3>
              <p className="text-dark-600 leading-relaxed">{event.description}</p>
            </div>

            {/* Register CTA */}
            <div className="border-t border-dark-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm text-dark-500">
                  Registration deadline: <span className="font-semibold text-dark-700">{formatDateTime(event.registrationDeadline)}</span>
                </p>
                {!isApproved && canViewUnapproved && (
                  <p className="text-xs text-amber-600 mt-2">
                    This event is {event.approvalStatus}. Public registration is disabled.
                  </p>
                )}
              </div>
              {loadingReg ? (
                <Button size="lg" disabled>Loading...</Button>
              ) : registrationId ? (
                <div className="flex items-center gap-3">
                  <Badge color={isAttended ? 'green' : 'blue'}>
                    {isAttended ? 'Attendance Marked (Completed)' : 'Registered / Applied'}
                  </Badge>
                  <Link to="/my-tickets">
                    <Button size="lg" variant="secondary" icon={<IoTicketOutline />}>
                      View My Ticket
                    </Button>
                  </Link>
                </div>
              ) : (
                <Button size="lg" onClick={handleRegister} disabled={registering || !canRegisterForEvent}>
                  {registering ? 'Registering...' : 'Register Now'}
                </Button>
              )}
            </div>

            {/* QR Ticket — shown after registration */}
            {registrationId && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 border-t border-dark-100 pt-6"
              >
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
                  <IoTicketOutline className="text-3xl text-emerald-600 mx-auto mb-2" />
                  <h3 className="text-lg font-bold text-emerald-800 mb-1">
                    You're registered!
                  </h3>
                  <p className="text-sm text-emerald-600 mb-4">
                    Show this QR code to the organizer for attendance check-in
                  </p>
                  <div className="inline-block p-4 bg-white rounded-xl border border-emerald-200">
                    <QRCodeSVG
                      value={registrationId}
                      size={180}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <p className="text-[10px] text-dark-400 font-mono mt-2">{registrationId}</p>
                  <Link
                    to="/my-tickets"
                    className="inline-block mt-4 text-sm text-primary-500 font-medium hover:underline"
                  >
                    View all my tickets →
                  </Link>
                </div>
              </motion.div>
            )}

            {/* Certificate Section */}
            {isAuthenticated && (
              <div className="mt-8 pt-6 border-t border-dark-100">
                <CertificateDownload
                  studentName={user?.displayName || 'Student'}
                  eventName={event.title}
                  eventDate={event.startDate}
                  userId={user?.uid}
                  eventId={event.id}
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="h-20" />
    </div>
  )
}
