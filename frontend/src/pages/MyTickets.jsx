import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { motion } from 'framer-motion'
import {
  IoTicketOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoDownloadOutline,
} from 'react-icons/io5'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import useAuthStore from '../store/authStore'
import useEventStore from '../store/eventStore'
import { fetchUserRegistrations } from '../services/eventService'
import { formatDateTime } from '../utils/helpers'
import toast from 'react-hot-toast'

export default function MyTickets() {
  const { user, isAuthenticated } = useAuthStore()
  const { events } = useEventStore()
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) {
        setLoading(false)
        return
      }
      try {
        const regs = await fetchUserRegistrations(user.uid)
        setRegistrations(regs)
      } catch (error) {
        console.error('Failed to load tickets:', error)
        toast.error('Failed to load your tickets')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.uid])

  const getEventForReg = (reg) => events.find((e) => e.id === reg.eventId)

  const handleDownloadQR = (regId, eventTitle) => {
    const svg = document.getElementById(`qr-${regId}`)
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      const a = document.createElement('a')
      a.download = `ticket-${eventTitle.replace(/\s+/g, '-').toLowerCase()}.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <IoTicketOutline className="text-6xl text-dark-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-dark-900 mb-2">Sign in to view your tickets</h2>
        <p className="text-dark-500">Register for events and your QR tickets will appear here.</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-dark-900">My Tickets</h1>
        <p className="text-dark-500 mt-1">
          Show your QR code to the event organizer for attendance check-in
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <p className="text-dark-400">Loading your tickets...</p>
        </div>
      ) : registrations.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dark-200">
          <IoTicketOutline className="text-5xl text-dark-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-dark-900 mb-2">No tickets yet</h3>
          <p className="text-dark-400 mb-6">
            Register for events and your tickets will show up here
          </p>
          <Link to="/events">
            <Button>Browse Events</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {registrations.map((reg, index) => {
            const event = getEventForReg(reg)
            return (
              <motion.div
                key={reg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white border border-dark-200 rounded-2xl overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* QR Code Section */}
                  <div className="flex-shrink-0 p-6 sm:p-8 flex flex-col items-center justify-center bg-dark-50 border-b sm:border-b-0 sm:border-r border-dark-200">
                    <QRCodeSVG
                      id={`qr-${reg.id}`}
                      value={reg.id}
                      size={160}
                      level="H"
                      includeMargin={true}
                    />
                    <p className="text-[10px] text-dark-400 font-mono mt-2 break-all text-center max-w-[180px]">
                      {reg.id}
                    </p>
                    <button
                      onClick={() => handleDownloadQR(reg.id, event?.title || 'event')}
                      className="mt-3 flex items-center gap-1.5 text-xs text-primary-500 font-medium hover:text-primary-600"
                    >
                      <IoDownloadOutline /> Download QR
                    </button>
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 p-5 sm:p-6">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge>{reg.attended ? 'CHECKED IN' : 'REGISTERED'}</Badge>
                      {event && <Badge>{event.mode}</Badge>}
                    </div>
                    <h3 className="text-lg font-bold text-dark-900 mb-1">
                      {event?.title || 'Event'}
                    </h3>
                    <p className="text-sm text-dark-500 mb-4">
                      {event?.organizer || 'Organizer'}
                    </p>

                    <div className="space-y-2">
                      {event?.startDate && (
                        <div className="flex items-center gap-2 text-sm text-dark-500">
                          <IoCalendarOutline className="text-primary-500 flex-shrink-0" />
                          <span>{formatDateTime(event.startDate)}</span>
                        </div>
                      )}
                      {event?.venue && (
                        <div className="flex items-center gap-2 text-sm text-dark-500">
                          <IoLocationOutline className="text-primary-500 flex-shrink-0" />
                          <span>{event.venue}</span>
                        </div>
                      )}
                    </div>

                    {event && (
                      <Link
                        to={`/events/${event.id}`}
                        className="inline-block mt-4 text-sm text-primary-500 font-medium hover:underline"
                      >
                        View event details →
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
