import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { IoCalendarOutline, IoLocationOutline, IoPeopleOutline } from 'react-icons/io5'
import Badge from './Badge'
import Button from './Button'
import { formatDate } from '../../utils/helpers'

export default function EventCard({ event }) {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white border border-dark-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300"
      onClick={() => navigate(`/events/${event.id}`)}
    >
      {/* Banner */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={event.banner}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-lg font-bold text-dark-900 leading-tight">
              {event.title}
            </h3>
            <p className="text-sm text-dark-500 mt-0.5">{event.type}</p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 my-3">
          <span className="text-xs font-semibold text-dark-400 uppercase tracking-wider">
            Theme
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {event.tags.map((tag) => (
            <Badge key={tag} color="gray">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Participants */}
        <div className="flex items-center gap-2 mb-4">
          <IoPeopleOutline className="text-dark-400" />
          <span className="text-sm font-semibold text-emerald-600">
            +{event.registeredCount} participating
          </span>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 border-t border-dark-100 gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge>{event.mode}</Badge>
            <Badge>{event.status}</Badge>
            <span className="text-xs text-dark-500 flex items-center gap-1">
              <IoCalendarOutline />
              Starts {formatDate(event.startDate)}
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => navigate(`/events/${event.id}`)}
          >
            Apply now
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
