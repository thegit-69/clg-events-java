import { useState } from 'react'
import SearchBar from '../components/ui/SearchBar'
import EventCard from '../components/ui/EventCard'
import useEventStore from '../store/eventStore'
import { EVENT_TYPES } from '../utils/constants'

export default function Events() {
  const { filteredEvents, searchQuery, setSearchQuery, activeFilter, setActiveFilter } =
    useEventStore()
  const [viewMode, setViewMode] = useState('grid')

  const filterOptions = ['all', ...EVENT_TYPES.map((t) => t.toLowerCase())]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-900 mb-2">Browse Events</h1>
        <p className="text-dark-500">Discover and register for events happening at your college</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {filterOptions.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 capitalize
              ${activeFilter === filter
                ? 'bg-primary-500 text-white'
                : 'bg-dark-100 text-dark-600 hover:bg-dark-200'
              }`}
          >
            {filter === 'all' ? 'All Events' : filter}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <p className="text-sm text-dark-400 mb-6">
        Showing {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
      </p>

      {/* Event Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-20">
          <p className="text-dark-400 text-lg">No events match your filters</p>
          <button
            onClick={() => {
              setSearchQuery('')
              setActiveFilter('all')
            }}
            className="text-primary-500 text-sm font-medium mt-2 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
