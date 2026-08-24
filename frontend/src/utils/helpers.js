import { format, formatDistanceToNow, isPast, isFuture } from 'date-fns'

export const formatDate = (date) => {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  return format(d, 'dd/MM/yy')
}

export const formatDateLong = (date) => {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  return format(d, 'MMMM dd, yyyy')
}

export const formatDateTime = (date) => {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  return format(d, 'MMM dd, yyyy • hh:mm a')
}

export const timeFromNow = (date) => {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  return formatDistanceToNow(d, { addSuffix: true })
}

export const getEventStatus = (startDate, endDate) => {
  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (isPast(end)) return 'COMPLETED'
  if (isPast(start) && isFuture(end)) return 'OPEN'
  if (isFuture(start)) return 'UPCOMING'
  return 'CLOSED'
}

export const generateId = () => {
  return Math.random().toString(36).substring(2, 15)
}

export const truncateText = (text, maxLength = 120) => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
