import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  IoScanOutline,
  IoCheckmarkCircle,
  IoVideocamOutline,
  IoVideocamOffOutline,
  IoSearchOutline,
} from 'react-icons/io5'
import Button from '../components/ui/Button'
import useAuthStore from '../store/authStore'
import {
  fetchEventById,
  fetchRegistrations,
  markAttendance as markAttendanceInFirestore,
} from '../services/eventService'
import { APPROVAL_STATUS } from '../utils/constants'
import toast from 'react-hot-toast'

const SCAN_COOLDOWN_MS = 3000

export default function Attendance() {
  const { id } = useParams()
  const { user, isSuperAdmin } = useAuthStore()
  const [event, setEvent] = useState(null)
  const [attendees, setAttendees] = useState([])
  const [loading, setLoading] = useState(true)
  const [canManageAttendance, setCanManageAttendance] = useState(false)
  const [eventError, setEventError] = useState('')
  const [scanning, setScanning] = useState(false)
  const [manualId, setManualId] = useState('')
  const [lastScanned, setLastScanned] = useState(null)
  const scannerRef = useRef(null)
  const html5QrCodeRef = useRef(null)
  const attendeesRef = useRef([])
  const scannerStartingRef = useRef(false)
  const lastScannedCodeRef = useRef(null)
  const lastScannedTimeRef = useRef(0)

  const attendedCount = attendees.filter((a) => a.attended).length

  useEffect(() => {
    attendeesRef.current = attendees
  }, [attendees])

  // Resolve event and load registrations only for authorized organizer/admin
  useEffect(() => {
    const loadAttendanceData = async () => {
      setLoading(true)
      try {
        const eventDoc = await fetchEventById(id)
        if (!eventDoc) {
          setEventError('Event not found.')
          setCanManageAttendance(false)
          return
        }

        setEvent(eventDoc)

        const ownerUid = eventDoc.createdBy || eventDoc.organizerId
        const isOwner = ownerUid === user?.uid
        const isApproved = eventDoc.approvalStatus === APPROVAL_STATUS.APPROVED
        const canManage = (isOwner || isSuperAdmin) && isApproved

        if (!canManage) {
          setCanManageAttendance(false)
          setEventError('Only the approved event organizer can mark attendance.')
          return
        }

        setCanManageAttendance(true)
        setEventError('')

        const regs = await fetchRegistrations(id)
        const mapped = regs.map((r) => ({
          id: r.id,
          name: r.displayName || r.name || 'Unknown',
          email: r.email || '',
          uid: r.uid || '',
          attended: r.attended || false,
          time: r.attendedAt?.toDate
            ? r.attendedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : r.attended ? 'Marked' : null,
        }))
        setAttendees(mapped)
      } catch (error) {
        console.error('Failed to load registrations:', error)
        toast.error('Failed to load attendees')
      } finally {
        setLoading(false)
      }
    }
    loadAttendanceData()
  }, [id, user?.uid, isSuperAdmin])

  // Mark a registration as attended — uses functional state to avoid stale closures
  const handleMarkAttendance = useCallback(async (registrationId) => {
    if (!canManageAttendance) {
      toast.error('You are not allowed to mark attendance for this event')
      return
    }

    const attendee = attendeesRef.current.find((a) => a.id === registrationId)

    if (!attendee) {
      toast.error('Participant not found')
      return
    }
    if (attendee.attended) {
      toast('Already checked in', { icon: 'ℹ️' })
      return
    }

    try {
      await markAttendanceInFirestore(registrationId)
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      setAttendees((prev) =>
        prev.map((a) =>
          a.id === registrationId ? { ...a, attended: true, time: now } : a
        )
      )
      setLastScanned({ name: attendee.name, time: now })
      toast.success(`✓ ${attendee.name} checked in!`)
    } catch (error) {
      console.error('Mark attendance error:', error)
      toast.error('Failed to mark attendance')
    }
  }, [canManageAttendance])

  // Ref-based callback so the scanner always invokes the latest version
  const handleMarkAttendanceRef = useRef(handleMarkAttendance)
  useEffect(() => {
    handleMarkAttendanceRef.current = handleMarkAttendance
  }, [handleMarkAttendance])

  // Process a scanned QR value (stable — uses ref)
  const processQrResult = useCallback((decodedText) => {
    if (typeof decodedText !== 'string') return

    let regId = decodedText.trim()
    if (!regId) return

    if (regId.includes('reg/')) {
      regId = regId.split('reg/').pop()
    }
    if (regId.includes('registration/')) {
      regId = regId.split('registration/').pop()
    }

    handleMarkAttendanceRef.current(regId)
  }, [])

  // Start camera scanner — dynamically imports html5-qrcode to prevent page crash
  const startScanner = async () => {
    if (!canManageAttendance) {
      toast.error('Attendance access denied')
      return
    }

    if (!scannerRef.current || scanning || scannerStartingRef.current) return
    scannerStartingRef.current = true

    try {
      const { Html5Qrcode } = await import('html5-qrcode')

      if (html5QrCodeRef.current) {
        await stopScanner()
      }

      const html5QrCode = new Html5Qrcode('qr-reader')
      html5QrCodeRef.current = html5QrCode

      const qrConfig = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      }

      const onSuccess = (decodedText) => {
        const now = Date.now()
        if (typeof decodedText !== 'string') return

        if (
          decodedText === lastScannedCodeRef.current &&
          now - lastScannedTimeRef.current < SCAN_COOLDOWN_MS
        ) {
          return
        }
        lastScannedCodeRef.current = decodedText
        lastScannedTimeRef.current = now
        processQrResult(decodedText)
      }

      const onFailure = () => { }

      // Try environment camera (mobile back), then user camera, then first available
      let started = false
      for (const config of [
        { facingMode: 'environment' },
        { facingMode: 'user' },
      ]) {
        try {
          await html5QrCode.start(config, qrConfig, onSuccess, onFailure)
          started = true
          break
        } catch {
          // try next config
        }
      }

      if (!started) {
        const cameras = await Html5Qrcode.getCameras()
        if (cameras && cameras.length > 0) {
          await html5QrCode.start(cameras[0].id, qrConfig, onSuccess, onFailure)
        } else {
          throw new Error('No cameras found')
        }
      }

      setScanning(true)
    } catch (error) {
      console.error('Scanner start error:', error)
      toast.error('Could not access camera. Check permissions or use manual entry.')
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.clear()
        } catch {
          // ignore
        }
        html5QrCodeRef.current = null
      }
    } finally {
      scannerStartingRef.current = false
    }
  }

  // Stop camera scanner
  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop()
        await html5QrCodeRef.current.clear()
      } catch (e) {
        // ignore
      }
      html5QrCodeRef.current = null
    }
    setScanning(false)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => { })
      }
    }
  }, [])

  // Manual entry handler
  const handleManualEntry = () => {
    if (!canManageAttendance) {
      toast.error('Attendance access denied')
      return
    }

    const trimmed = manualId.trim()
    if (!trimmed) return

    // Try matching by registration ID, email, or name
    const match = attendees.find(
      (a) =>
        a.id === trimmed ||
        a.email.toLowerCase() === trimmed.toLowerCase() ||
        a.uid === trimmed
    )

    if (match) {
      handleMarkAttendance(match.id)
    } else {
      // Try as raw Firestore registration ID
      handleMarkAttendance(trimmed)
    }
    setManualId('')
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark-900">Attendance Tracking</h1>
        <p className="text-dark-500 mt-1">
          {event?.title || 'Event'} — {attendedCount}/{attendees.length} attended
        </p>
      </div>

      {!loading && !canManageAttendance && (
        <div className="bg-white rounded-2xl border border-dark-200 p-8 text-center">
          <p className="text-dark-600">{eventError || 'Attendance access denied.'}</p>
        </div>
      )}

      {canManageAttendance && (

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scanner Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-dark-200 p-6"
          >
            <h3 className="text-lg font-bold text-dark-900 mb-2">Scan QR Code</h3>
            <p className="text-sm text-dark-500 mb-6">
              Point the camera at a participant's QR code to mark attendance
            </p>

            {/* Camera viewport */}
            <div
              ref={scannerRef}
              className="relative w-full max-w-sm mx-auto mb-6"
              style={{ minHeight: '280px' }}
            >
              <div id="qr-reader" className="w-full rounded-xl overflow-hidden" />

              {!scanning && (
                <div className="absolute inset-0 w-full h-full bg-dark-100 rounded-xl flex items-center justify-center border-2 border-dashed border-dark-300">
                  <div className="text-center">
                    <IoVideocamOutline className="text-4xl text-dark-400 mx-auto mb-2" />
                    <p className="text-sm text-dark-400">Camera is off</p>
                    <p className="text-xs text-dark-300 mt-1">
                      Click "Start Scanner" to begin
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Scanner controls */}
            <div className="flex justify-center gap-3 mb-6">
              {!scanning ? (
                <Button
                  icon={<IoVideocamOutline />}
                  onClick={startScanner}
                >
                  Start Scanner
                </Button>
              ) : (
                <Button
                  variant="danger"
                  icon={<IoVideocamOffOutline />}
                  onClick={stopScanner}
                >
                  Stop Scanner
                </Button>
              )}
            </div>

            {/* Last scanned feedback */}
            {lastScanned && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 text-center">
                <IoCheckmarkCircle className="text-emerald-500 text-2xl mx-auto mb-1" />
                <p className="text-sm font-semibold text-emerald-700">
                  {lastScanned.name}
                </p>
                <p className="text-xs text-emerald-600">
                  Checked in at {lastScanned.time}
                </p>
              </div>
            )}

            {/* Manual entry */}
            <div className="border-t border-dark-100 pt-6">
              <p className="text-sm font-semibold text-dark-700 mb-3">
                Manual Check-in
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                  <input
                    type="text"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualEntry()}
                    placeholder="Registration ID or email"
                    className="w-full pl-10 pr-4 py-3 border-2 border-dark-200 rounded-xl text-sm
                             focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
                <Button size="md" onClick={handleManualEntry}>
                  Mark
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Attendee List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-dark-200 overflow-hidden"
          >
            <div className="p-6 border-b border-dark-100">
              <h3 className="text-lg font-bold text-dark-900">Attendees</h3>
              <p className="text-sm text-dark-400">
                {attendedCount} of {attendees.length} checked in
              </p>
              {/* Progress bar */}
              {attendees.length > 0 && (
                <div className="w-full bg-dark-100 rounded-full h-2 mt-3">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(attendedCount / attendees.length) * 100}%` }}
                  />
                </div>
              )}
            </div>

            {loading ? (
              <div className="p-10 text-center">
                <p className="text-dark-400 text-sm">Loading attendees...</p>
              </div>
            ) : attendees.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-dark-400 text-sm">No registrations yet</p>
              </div>
            ) : (
              <div className="divide-y divide-dark-100 max-h-[500px] overflow-y-auto">
                {attendees.map((attendee) => (
                  <div
                    key={attendee.id}
                    className="px-6 py-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                        ${attendee.attended
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-dark-100 text-dark-400'
                          }`}
                      >
                        {attendee.attended ? (
                          <IoCheckmarkCircle />
                        ) : (
                          attendee.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-dark-900">
                          {attendee.name}
                        </p>
                        <p className="text-xs text-dark-400">{attendee.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {attendee.attended ? (
                        <span className="text-xs text-emerald-600 font-medium">
                          ✓ {attendee.time}
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAttendance(attendee.id)}
                        >
                          Mark
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}
