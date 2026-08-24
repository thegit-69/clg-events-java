import { useState } from 'react'
import { motion } from 'framer-motion'
import { IoArrowForward, IoAddCircleOutline, IoCalendarOutline } from 'react-icons/io5'
import { useNavigate, Link } from 'react-router-dom'
import SearchBar from '../components/ui/SearchBar'
import TabBar from '../components/ui/TabBar'
import EventCard from '../components/ui/EventCard'
import Button from '../components/ui/Button'
import useEventStore from '../store/eventStore'
import useAuthStore from '../store/authStore'
import AuthModal from '../components/AuthModal'
import { getBannerForEventType } from '../utils/constants'

const TABS = [
  { label: 'DISCOVER', value: 'all' },
  { label: 'HACKATHONS', value: 'hackathon' },
  { label: 'WORKSHOPS', value: 'workshop' },
  { label: 'FESTS', value: 'fest' },
]

export default function Home() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { filteredEvents, searchQuery, setSearchQuery, activeFilter, setActiveFilter } =
    useEventStore()
  const [authModalOpen, setAuthModalOpen] = useState(false)

  // Featured event (first approved one)
  const featured = filteredEvents[0]
  const featuredBanner = featured
    ? featured.bannerUrl || featured.banner || getBannerForEventType(featured.type)
    : ''

  const handleCreateClick = () => {
    if (isAuthenticated) {
      navigate('/dashboard/create')
    } else {
      setAuthModalOpen(true)
    }
  }

  return (
    <div className="min-h-screen pb-16">
      {/* Tabs */}
      <div className="py-6">
        <TabBar tabs={TABS} activeTab={activeFilter} onTabChange={setActiveFilter} />
      </div>

      {/* Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* Featured Event (Only if events exist) */}
      {featured && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate(`/events/${featured.id}`)}
            className="grid grid-cols-1 lg:grid-cols-2 gap-0 bg-white border border-dark-200 rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
          >
            {/* Banner */}
            <div className="relative h-64 lg:h-auto">
              <img
                src={featuredBanner}
                alt={featured.title}
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = getBannerForEventType(featured.type)
                }}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Details */}
            <div className="p-6 md:p-8 flex flex-col justify-center">
              <h2 className="text-2xl md:text-3xl font-bold text-dark-900 mb-3">
                {featured.title}
              </h2>
              <p className="text-dark-500 mb-6 leading-relaxed line-clamp-3 md:line-clamp-none">
                {featured.description}
              </p>
              <div className="space-y-2">
                {(featured.tags || []).map((tag) => (
                  <Link
                    key={tag}
                    to={`/events?tag=${tag}`}
                    onClick={(e) => e.stopPropagation()}
                    className="block px-4 py-3 border border-dark-200 rounded-lg text-dark-700
                               font-medium text-center hover:bg-dark-50 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Events Grid / Empty State */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {filteredEvents.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-dark-900">Approved Events</h2>
              <Link
                to="/events"
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white
                           rounded-lg font-semibold text-sm hover:bg-primary-600 transition-colors"
              >
                All open events <IoArrowForward />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-white border border-dark-200 rounded-3xl p-8 sm:p-12 shadow-sm max-w-3xl mx-auto"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center text-3xl mx-auto mb-4 border border-primary-100">
              <IoCalendarOutline />
            </div>
            <h3 className="text-2xl font-bold text-dark-900 mb-2">No Live Events Yet</h3>
            <p className="text-dark-500 text-sm max-w-md mx-auto mb-6 leading-relaxed">
              Events will appear here once submitted and approved by the campus administrator. Start by submitting your event proposal!
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button
                variant="primary"
                onClick={handleCreateClick}
                icon={<IoAddCircleOutline size={20} />}
              >
                Create Event Proposal
              </Button>
              <Link to="/events">
                <Button variant="outline">
                  Browse All Events
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  )
}
