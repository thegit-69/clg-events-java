import { create } from 'zustand'

// Normalize Firestore Timestamp fields to ISO strings
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
})

const useEventStore = create((set, get) => ({
  events: [],
  filteredEvents: [],
  selectedEvent: null,
  searchQuery: '',
  activeTab: 'all',
  activeFilter: 'all',

  setEvents: (events) => {
    const normalized = events.map(normalizeEvent)
    set({ events: normalized, filteredEvents: normalized })
  },

  setSelectedEvent: (event) => set({ selectedEvent: event }),

  setSearchQuery: (query) => {
    const { events, activeFilter } = get()
    const filtered = events.filter((e) => {
      const matchesSearch =
        e.title.toLowerCase().includes(query.toLowerCase()) ||
        e.organizer.toLowerCase().includes(query.toLowerCase()) ||
        e.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
      const matchesFilter =
        activeFilter === 'all' ||
        e.type.toLowerCase() === activeFilter.toLowerCase()
      return matchesSearch && matchesFilter
    })
    set({ searchQuery: query, filteredEvents: filtered })
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setActiveFilter: (filter) => {
    const { events, searchQuery } = get()
    const filtered = events.filter((e) => {
      const matchesFilter =
        filter === 'all' || e.type.toLowerCase() === filter.toLowerCase()
      const matchesSearch =
        !searchQuery ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.organizer.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesFilter && matchesSearch
    })
    set({ activeFilter: filter, filteredEvents: filtered })
  },

  addEvent: (event) =>
    set((state) => ({
      events: [event, ...state.events],
      filteredEvents: [event, ...state.filteredEvents],
    })),

  updateEvent: (id, updates) =>
    set((state) => ({
      events: state.events.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
      filteredEvents: state.filteredEvents.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    })),

  deleteEvent: (id) =>
    set((state) => ({
      events: state.events.filter((e) => e.id !== id),
      filteredEvents: state.filteredEvents.filter((e) => e.id !== id),
    })),
}))

export default useEventStore
