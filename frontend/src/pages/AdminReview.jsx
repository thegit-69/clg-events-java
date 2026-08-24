import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { IoCheckmarkCircleOutline, IoCloseCircleOutline } from 'react-icons/io5'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import useAuthStore from '../store/authStore'
import {
    fetchPendingEventsForAdmin,
    reviewEventProposal,
} from '../services/eventService'
import { APPROVAL_STATUS } from '../utils/constants'
import { formatDate } from '../utils/helpers'
import toast from 'react-hot-toast'

export default function AdminReview() {
    const { user, isSuperAdmin } = useAuthStore()
    const [pendingEvents, setPendingEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState(null)

    useEffect(() => {
        const loadPendingEvents = async () => {
            setLoading(true)
            try {
                const events = await fetchPendingEventsForAdmin()
                setPendingEvents(events)
            } catch (error) {
                console.error('Failed to load pending events:', error)
                toast.error('Failed to load pending events')
            } finally {
                setLoading(false)
            }
        }

        if (isSuperAdmin) {
            loadPendingEvents()
        } else {
            setLoading(false)
            setPendingEvents([])
        }
    }, [isSuperAdmin])

    const handleReview = async (eventId, nextStatus) => {
        if (!user?.uid) return

        let rejectionReason = ''
        if (nextStatus === APPROVAL_STATUS.REJECTED) {
            rejectionReason = window.prompt('Enter rejection reason:') || ''
            if (!rejectionReason.trim()) {
                toast.error('Rejection reason is required')
                return
            }
        }

        setProcessingId(eventId)
        try {
            await reviewEventProposal({
                eventId,
                nextStatus,
                reviewerUid: user.uid,
                rejectionReason,
            })
            setPendingEvents((prev) => prev.filter((event) => event.id !== eventId))
            toast.success(
                nextStatus === APPROVAL_STATUS.APPROVED
                    ? 'Event approved'
                    : 'Event rejected'
            )
        } catch (error) {
            console.error('Failed to review event:', error)
            toast.error('Failed to submit review action')
        } finally {
            setProcessingId(null)
        }
    }

    if (!isSuperAdmin) {
        return (
            <div className="text-center py-20 bg-white rounded-2xl border border-dark-200">
                <p className="text-dark-500">Only super admins can review event proposals.</p>
            </div>
        )
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-dark-900">Pending Event Approvals</h1>
                <p className="text-dark-500 mt-1">
                    Review pending event proposals and approve or reject them.
                </p>
            </div>

            {loading ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dark-200">
                    <p className="text-dark-400">Loading pending events...</p>
                </div>
            ) : pendingEvents.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dark-200">
                    <p className="text-dark-400">No pending proposals right now.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {pendingEvents.map((event, index) => (
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.04 }}
                            className="bg-white border border-dark-200 rounded-xl p-5"
                        >
                            <div className="flex flex-col lg:flex-row gap-5 lg:items-center">
                                <div className="w-full lg:w-36 h-24 rounded-lg overflow-hidden flex-shrink-0">
                                    <img
                                        src={event.banner}
                                        alt={event.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge>{event.type}</Badge>
                                        <Badge>{event.mode}</Badge>
                                        <Badge>{event.approvalStatus || APPROVAL_STATUS.PENDING}</Badge>
                                    </div>
                                    <h3 className="font-bold text-dark-900 text-base">{event.title}</h3>
                                    <p className="text-xs text-dark-500 mt-1">
                                        Proposed by {event.organizer || 'Unknown'}
                                    </p>
                                    <p className="text-xs text-dark-400 mt-1">
                                        Start: {formatDate(event.startDate)}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <Button
                                        size="sm"
                                        icon={<IoCheckmarkCircleOutline />}
                                        disabled={processingId === event.id}
                                        onClick={() => handleReview(event.id, APPROVAL_STATUS.APPROVED)}
                                    >
                                        Approve
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="danger"
                                        icon={<IoCloseCircleOutline />}
                                        disabled={processingId === event.id}
                                        onClick={() => handleReview(event.id, APPROVAL_STATUS.REJECTED)}
                                    >
                                        Reject
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
