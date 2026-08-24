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

export const EVENT_STATUS = {
  UPCOMING: 'UPCOMING',
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  COMPLETED: 'COMPLETED',
}

export const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
}

export const SUPER_ADMIN_EMAIL =
  import.meta.env.VITE_SUPER_ADMIN_EMAIL || '[Insert Your Email Here]'

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
