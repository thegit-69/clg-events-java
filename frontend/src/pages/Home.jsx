import { useState } from 'react'
import { motion } from 'framer-motion'
import { IoArrowForward } from 'react-icons/io5'
import { useNavigate, Link } from 'react-router-dom'
import SearchBar from '../components/ui/SearchBar'
import TabBar from '../components/ui/TabBar'
import EventCard from '../components/ui/EventCard'
import useEventStore from '../store/eventStore'

const TABS = [
  { label: 'DISCOVER', value: 'all' },
  { label: 'HACKATHONS', value: 'hackathon' },
  { label: 'WORKSHOPS', value: 'workshop' },
  { label: 'FESTS', value: 'fest' },
]

export default function Home() {
  const navigate = useNavigate()
  const { filteredEvents, searchQuery, setSearchQuery, activeFilter, setActiveFilter } =
    useEventStore()

  // Featured event (first one)
  const featured = filteredEvents[0]

  return (
    <div className="min-h-screen">
      {/* Tabs */}
      <div className="py-6">
        <TabBar tabs={TABS} activeTab={activeFilter} onTabChange={setActiveFilter} />
      </div>

      {/* Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* Featured Event */}
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
                src={featured.banner}
                alt={featured.title}
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
                {featured.tags.map((tag) => (
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

      {/* Open Events Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-dark-900">Open</h2>
          <Link
            to="/events"
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-white
                       rounded-lg font-semibold text-sm hover:bg-primary-600 transition-colors"
          >
            All open events <IoArrowForward />
          </Link>
        </div>

        {/* Event Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-20">
            <p className="text-dark-400 text-lg">No events found</p>
            <p className="text-dark-300 text-sm mt-2">
              Try a different search or filter
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
