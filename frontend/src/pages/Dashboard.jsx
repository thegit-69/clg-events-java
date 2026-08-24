import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  IoCalendarOutline,
  IoPeopleOutline,
  IoHourglassOutline,
  IoCheckmarkCircleOutline,
  IoAddCircleOutline,
  IoShieldCheckmarkOutline,
} from 'react-icons/io5'
import StatsCard from '../components/ui/StatsCard'
import Button from '../components/ui/Button'
import useAuthStore from '../store/authStore'
import { fetchMyProposals } from '../services/eventService'
import { APPROVAL_STATUS } from '../utils/constants'
import { formatDate } from '../utils/helpers'

export default function Dashboard() {
  const { user, isSuperAdmin } = useAuthStore()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMyEvents = async () => {
      if (!user?.uid) {
        setEvents([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const myEvents = await fetchMyProposals(user.uid)
        setEvents(Array.isArray(myEvents) ? myEvents : [])
      } catch (error) {
        console.error('Failed to load dashboard events:', error)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    loadMyEvents()
  }, [user?.uid])

  const totalEvents = events.length
  const totalRegistrations = useMemo(
    () => events.reduce((acc, e) => acc + (e.registeredCount || 0), 0),
    [events]
  )
  const pendingEvents = events.filter(
    (e) => e.approvalStatus === APPROVAL_STATUS.PENDING
  ).length
  const approvedEvents = events.filter(
    (e) => e.approvalStatus === APPROVAL_STATUS.APPROVED
  ).length

  // Role tag logic:
  // - Super Admin: "SUPER ADMIN"
  // - Has at least 1 approved event: "ORGANIZER"
  // - Else: "PARTICIPANT"
  const isOrganizer = approvedEvents > 0
  const displayRole = isSuperAdmin
    ? 'Super Admin'
    : isOrganizer
      ? 'Organizer'
      : 'Participant'

  const roleBadgeStyle = isSuperAdmin
    ? 'bg-purple-100 text-purple-700 border-purple-200'
    : isOrganizer
      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
      : 'bg-blue-100 text-blue-700 border-blue-200'

  const getApprovalBadgeStyles = (status) => {
    if (status === APPROVAL_STATUS.APPROVED) return 'bg-emerald-50 text-emerald-600 border border-emerald-200'
    if (status === APPROVAL_STATUS.REJECTED) return 'bg-red-50 text-red-600 border border-red-200'
    return 'bg-amber-50 text-amber-600 border border-amber-200'
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white border border-dark-200 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-primary-200 shadow-sm"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-2xl border-2 border-primary-200">
              {user?.displayName?.charAt(0) || 'U'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-dark-900">
                Welcome, {user?.displayName || 'User'}!
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${roleBadgeStyle}`}>
                {displayRole}
              </span>
            </div>
            <p className="text-dark-500 text-sm mt-1">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {isSuperAdmin && (
            <Link to="/dashboard/admin/review">
              <Button variant="outline" size="sm" icon={<IoShieldCheckmarkOutline />}>
                Review Proposals
              </Button>
            </Link>
          )}
          <Link to="/dashboard/create">
            <Button variant="primary" size="sm" icon={<IoAddCircleOutline />}>
              Create Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={<IoCalendarOutline />}
          label="Your Proposals"
          value={totalEvents}
          color="primary"
        />
        <StatsCard
          icon={<IoPeopleOutline />}
          label="Total Attendees"
          value={totalRegistrations}
          color="green"
        />
        <StatsCard
          icon={<IoHourglassOutline />}
          label="Pending Review"
          value={pendingEvents}
          color="purple"
        />
        <StatsCard
          icon={<IoCheckmarkCircleOutline />}
          label="Approved Live"
          value={approvedEvents}
          color="orange"
        />
      </div>

      {/* Recent Proposals Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-dark-200 overflow-hidden shadow-sm"
      >
        <div className="p-6 border-b border-dark-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-dark-900">Your Event Proposals</h2>
            <p className="text-xs text-dark-400 mt-0.5">Manage and track your submitted college events</p>
          </div>
          {events.length > 0 && (
            <Link to="/dashboard/create" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
              + New Proposal
            </Link>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-dark-400 text-sm">Loading your events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-dark-50 text-dark-400 flex items-center justify-center mx-auto mb-3 text-xl">
              <IoCalendarOutline />
            </div>
            <p className="text-dark-800 font-medium">No event proposals yet</p>
            <p className="text-dark-400 text-xs mt-1 mb-4">
              Submit your first college event proposal. Once approved by the administrator, you will receive the Organizer status.
            </p>
            <Link to="/dashboard/create">
              <Button variant="primary" size="sm" icon={<IoAddCircleOutline />}>
                Submit Proposal
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr className="bg-dark-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                    Approval
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-dark-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100">
                {events.slice(0, 6).map((event) => (
                  <tr key={event.id} className="hover:bg-dark-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-dark-900 text-sm">{event.title}</p>
                      <p className="text-xs text-dark-400">{event.venue || 'TBA'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-dark-600">{event.type}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getApprovalBadgeStyles(
                          event.approvalStatus
                        )}`}
                      >
                        {(event.approvalStatus || APPROVAL_STATUS.PENDING).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-dark-600">{event.status}</td>
                    <td className="px-6 py-4 text-sm text-dark-600">
                      {formatDate(event.startDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}
