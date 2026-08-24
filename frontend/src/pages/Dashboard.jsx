import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  IoCalendarOutline,
  IoPeopleOutline,
  IoHourglassOutline,
  IoCheckmarkCircleOutline,
} from 'react-icons/io5'
import StatsCard from '../components/ui/StatsCard'
import useAuthStore from '../store/authStore'
import { fetchMyProposals } from '../services/eventService'
import { APPROVAL_STATUS } from '../utils/constants'
import { formatDate } from '../utils/helpers'
import toast from 'react-hot-toast'

export default function Dashboard() {
  const { user } = useAuthStore()
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
        setEvents(myEvents)
      } catch (error) {
        console.error('Failed to load dashboard events:', error)
        toast.error('Failed to load your dashboard data')
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

  const getApprovalBadgeStyles = (status) => {
    if (status === APPROVAL_STATUS.APPROVED) return 'bg-emerald-50 text-emerald-600'
    if (status === APPROVAL_STATUS.REJECTED) return 'bg-red-50 text-red-600'
    return 'bg-amber-50 text-amber-600'
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark-900">Dashboard Overview</h1>
        <p className="text-dark-500 mt-1">
          Track your event proposals and approval status.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          icon={<IoCalendarOutline />}
          label="Total Events"
          value={totalEvents}
          color="primary"
        />
        <StatsCard
          icon={<IoPeopleOutline />}
          label="Total Registrations"
          value={totalRegistrations}
          color="green"
        />
        <StatsCard
          icon={<IoHourglassOutline />}
          label="Pending Approval"
          value={pendingEvents}
          color="purple"
        />
        <StatsCard
          icon={<IoCheckmarkCircleOutline />}
          label="Approved"
          value={approvedEvents}
          color="orange"
        />
      </div>

      {/* Recent Proposals Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-dark-200 overflow-hidden"
      >
        <div className="p-6 border-b border-dark-100">
          <h2 className="text-lg font-bold text-dark-900">Recent Proposals</h2>
        </div>
        {loading ? (
          <div className="p-10 text-center">
            <p className="text-dark-400 text-sm">Loading your proposals...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-dark-400 text-sm">No proposals yet</p>
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
                    Event Status
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
                      <p className="text-xs text-dark-400">{event.organizer}</p>
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
