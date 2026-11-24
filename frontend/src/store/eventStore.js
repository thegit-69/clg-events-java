import { create } from 'zustand'

const normalizeEvent = (event) => ({
  ...event,
  createdAt: event.createdAt?.toDate
    ? event.createdAt.toDate().toISOString()
    : event.createdAt,
  startDate: event.startDate?.toDate
    ? event.startDate.toDate().toISOString()
    : event.startDate,
  endDate: event.endDate?.toDate
    ? event.endDate.toDate().toISOString()
    : event.endDate,
  registrationDeadline: event.registrationDeadline?.toDate
    ? event.registrationDeadline.toDate().toISOString()
    : event.registrationDeadline,
  tags: Array.isArray(event.tags) ? event.tags : [],
})

// Apply the current search/filter state to a fresh list of events. Keeping
// this in one place prevents `filteredEvents` from going stale whenever the
// underlying `events` array is replaced.
const applyFilters = (events, searchQuery, activeFilter) => {
  const safeQuery = (searchQuery || '').toLowerCase()
  const safeFilter = (activeFilter || 'all').toLowerCase()

  return events.filter((event) => {
    const matchesFilter =
      safeFilter === 'all' || (event.type || '').toLowerCase() === safeFilter
    const matchesSearch =
      !safeQuery ||
      (event.title || '').toLowerCase().includes(safeQuery) ||
      (event.organizer || '').toLowerCase().includes(safeQuery) ||
      (event.tags || []).some((tag) => (tag || '').toLowerCase().includes(safeQuery))

    return matchesFilter && matchesSearch
  })
}

const useEventStore = create((set, get) => ({
  events: [],
  filteredEvents: [],
  selectedEvent: null,
  searchQuery: '',
  activeTab: 'all',
  activeFilter: 'all',

  setEvents: (events) => {
    const normalized = (Array.isArray(events) ? events : []).map(normalizeEvent)
    const { searchQuery, activeFilter } = get()
    set({
      events: normalized,
      filteredEvents: applyFilters(normalized, searchQuery, activeFilter),
    })
  },

  setSelectedEvent: (event) => set({ selectedEvent: event ? normalizeEvent(event) : null }),

  setSearchQuery: (query) => {
    const { events, activeFilter } = get()
    set({ searchQuery: query, filteredEvents: applyFilters(events, query, activeFilter) })
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setActiveFilter: (filter) => {
    const { events, searchQuery } = get()
    set({ activeFilter: filter, filteredEvents: applyFilters(events, searchQuery, filter) })
  },

  addEvent: (event) => {
    const normalized = normalizeEvent(event)
    set((state) => {
      const events = [normalized, ...state.events]
      return {
        events,
        filteredEvents: applyFilters(events, state.searchQuery, state.activeFilter),
      }
    })
  },

  updateEvent: (id, updates) =>
    set((state) => {
      const events = state.events.map((event) =>
        event.id === id ? { ...event, ...updates } : event
      )
      return {
        events,
        filteredEvents: applyFilters(events, state.searchQuery, state.activeFilter),
      }
    }),

  deleteEvent: (id) =>
    set((state) => {
      const events = state.events.filter((event) => event.id !== id)
      return {
        events,
        filteredEvents: applyFilters(events, state.searchQuery, state.activeFilter),
      }
    }),
}))

export default useEventStore
