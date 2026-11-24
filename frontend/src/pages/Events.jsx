import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { IoChevronBackOutline, IoChevronForwardOutline, IoCloseOutline } from 'react-icons/io5'
import SearchBar from '../components/ui/SearchBar'
import EventCard from '../components/ui/EventCard'
import { fetchApprovedEventsPage } from '../services/eventService'
import { EVENT_TYPES } from '../utils/constants'

const PAGE_SIZE = 9

const EMPTY_META = { totalElements: 0, totalPages: 1, page: 0 }

export default function Events() {
  const [searchParams, setSearchParams] = useSearchParams()

  const query = searchParams.get('search') || ''
  const type = (searchParams.get('type') || 'all').toLowerCase()
  const tag = searchParams.get('tag') || ''
  const page = Math.max(parseInt(searchParams.get('page') || '0', 10) || 0, 0)

  const [searchInput, setSearchInput] = useState(query)
  const [events, setEvents] = useState([])
  const [meta, setMeta] = useState(EMPTY_META)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const updateParams = useCallback(
    (updates) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === undefined || value === '' || value === 'all') {
              next.delete(key)
            } else {
              next.set(key, String(value))
            }
          })
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  // Keep the input in sync when the URL changes (back/forward, tag links)
  useEffect(() => {
    setSearchInput(query)
  }, [query])

  // Debounce the search box into the URL so the server is not hit per keystroke
  useEffect(() => {
    if (searchInput === query) return undefined

    const timeoutId = setTimeout(() => {
      updateParams({ search: searchInput.trim() || null, page: null })
    }, 400)

    return () => clearTimeout(timeoutId)
  }, [searchInput, query, updateParams])

  // Server-side fetch whenever a filter changes
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const result = await fetchApprovedEventsPage({
          search: query || undefined,
          type: type !== 'all' ? type : undefined,
          tag: tag || undefined,
          page,
          size: PAGE_SIZE,
          sort: 'startDate,asc',
        })

        if (cancelled) return
        setEvents(result.content)
        setMeta({
          totalElements: result.totalElements,
          totalPages: Math.max(result.totalPages, 1),
          page: result.page,
        })
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load events:', err)
        setEvents([])
        setMeta(EMPTY_META)
        setError('Could not load events. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [query, type, tag, page])

  const filterOptions = useMemo(
    () => ['all', ...EVENT_TYPES.map((eventType) => eventType.toLowerCase())],
    []
  )

  const pageNumbers = useMemo(() => {
    const total = meta.totalPages
    if (total <= 1) return []
    const start = Math.max(0, Math.min(page - 2, total - 5))
    const end = Math.min(total, start + 5)
    return Array.from({ length: end - start }, (_, index) => start + index)
  }, [meta.totalPages, page])

  const handleTypeChange = (nextType) => {
    updateParams({ type: nextType === 'all' ? null : nextType, page: null })
  }

  const handleClear = () => {
    setSearchInput('')
    setSearchParams({}, { replace: true })
  }

  const goToPage = (nextPage) => {
    updateParams({ page: nextPage === 0 ? null : nextPage })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const from = meta.totalElements === 0 ? 0 : Math.min(page, meta.totalPages - 1) * PAGE_SIZE + 1
  const to = Math.min(from + PAGE_SIZE - 1, meta.totalElements)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-900 mb-2">Browse Events</h1>
        <p className="text-dark-500">Discover and register for events happening at your college</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <SearchBar value={searchInput} onChange={setSearchInput} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {filterOptions.map((filter) => (
          <button
            key={filter}
            onClick={() => handleTypeChange(filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 capitalize
              ${type === filter
                ? 'bg-primary-500 text-white'
                : 'bg-dark-100 text-dark-600 hover:bg-dark-200'
              }`}
          >
            {filter === 'all' ? 'All Events' : filter}
          </button>
        ))}
      </div>

      {/* Active tag */}
      {tag && (
        <div className="mb-6 flex items-center gap-2">
          <span className="text-sm text-dark-400">Tag:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-600 text-sm font-medium border border-primary-100">
            {tag}
            <button
              type="button"
              onClick={() => updateParams({ tag: null, page: null })}
              className="text-primary-500 hover:text-primary-700"
              aria-label={`Remove ${tag} filter`}
            >
              <IoCloseOutline size={14} />
            </button>
          </span>
        </div>
      )}

      {/* Results count */}
      {!loading && !error && (
        <p className="text-sm text-dark-400 mb-6">
          {meta.totalElements === 0
            ? 'No events found'
            : `Showing ${from}–${to} of ${meta.totalElements} event${meta.totalElements !== 1 ? 's' : ''}`}
        </p>
      )}

      {/* Event grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-72 bg-white border border-dark-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-red-500 text-lg mb-2">{error}</p>
          <button
            onClick={() => updateParams({ page: null })}
            className="text-primary-500 text-sm font-medium mt-2 hover:underline"
          >
            Retry
          </button>
        </div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-dark-400 text-lg">No events match your filters</p>
          <button
            onClick={handleClear}
            className="text-primary-500 text-sm font-medium mt-2 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 0}
            className="p-2 rounded-lg border border-dark-200 text-dark-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-dark-50 transition-colors"
            aria-label="Previous page"
          >
            <IoChevronBackOutline />
          </button>

          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => goToPage(pageNumber)}
              className={`min-w-[38px] px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pageNumber === page
                  ? 'bg-primary-500 text-white'
                  : 'border border-dark-200 text-dark-600 hover:bg-dark-50'
              }`}
            >
              {pageNumber + 1}
            </button>
          ))}

          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={page >= meta.totalPages - 1}
            className="p-2 rounded-lg border border-dark-200 text-dark-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-dark-50 transition-colors"
            aria-label="Next page"
          >
            <IoChevronForwardOutline />
          </button>
        </div>
      )}
    </div>
  )
}
