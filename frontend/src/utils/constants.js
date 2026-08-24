export const EVENT_TYPES = [
  'Hackathon',
  'Workshop',
  'Seminar',
  'Cultural',
  'Sports',
  'Technical',
  'Conference',
  'Fest',
]

export const CATEGORY_PHOTOS = {
  Hackathon: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=400&fit=crop',
  Cultural: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=400&fit=crop',
  Fest: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=400&fit=crop',
  Sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=400&fit=crop',
  Technical: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=400&fit=crop',
  Workshop: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=400&fit=crop',
  Seminar: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=400&fit=crop',
  Conference: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
}

export const getBannerForEventType = (type) => {
  if (!type) return 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop'
  const matchedKey = Object.keys(CATEGORY_PHOTOS).find(
    (k) => k.toLowerCase() === type.trim().toLowerCase()
  )
  return matchedKey
    ? CATEGORY_PHOTOS[matchedKey]
    : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop'
}

export const EVENT_STATUS = {
  UPCOMING: 'UPCOMING',
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
}

export const APPROVAL_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
}

export const SUPER_ADMIN_EMAIL =
  import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'cdasarath2006@gmail.com'

export const EVENT_MODE = {
  OFFLINE: 'OFFLINE',
  ONLINE: 'ONLINE',
  HYBRID: 'HYBRID',
}

export const THEME_TAGS = [
  'AI/ML',
  'Web Dev',
  'Blockchain',
  'IoT/Hardware',
  'Cybersecurity',
  'Cloud',
  'Data Science',
  'Mobile Dev',
  'DevOps',
  'Open Source',
  'HealthTech',
  'FinTech',
  'No Restrictions',
  'Music',
  'Dance',
  'Art & Design',
  'Photography',
  'Theatre',
  'Literature',
  'Fashion'
]

export const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Events', path: '/events' },
]

export const DASHBOARD_LINKS = [
  { label: 'Overview', path: '/dashboard' },
  { label: 'My Events', path: '/dashboard/events' },
  { label: 'Create Event', path: '/dashboard/create' },
  { label: 'Notifications', path: '/dashboard/notifications' },
]
