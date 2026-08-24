import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import Button from '../components/ui/Button'
import useAuthStore from '../store/authStore'
import {
  APPROVAL_STATUS,
  EVENT_STATUS,
  EVENT_MODE,
  EVENT_TYPES,
  THEME_TAGS,
  getBannerForEventType,
} from '../utils/constants'
import { createEvent as createEventApi } from '../services/eventService'
import toast from 'react-hot-toast'

export default function CreateEvent() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [selectedTags, setSelectedTags] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm()

  const selectedType = watch('type')

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      const eventData = {
        ...data,
        tags: selectedTags,
        status: EVENT_STATUS.UPCOMING,
        approvalStatus: APPROVAL_STATUS.PENDING,
        createdBy: user?.uid || 'anonymous',
        registeredCount: 0,
        participantAvatars: [],
        banner: getBannerForEventType(data.type),
        organizer: user?.displayName || 'My Organization',
        organizerId: user?.uid || 'anonymous',
        rejectionReason: null,
        reviewedBy: null,
        reviewedAt: null,
        mode: data.mode || EVENT_MODE.OFFLINE,
        maxParticipants: data.maxParticipants || 100,
      }

      await createEventApi(eventData)
      toast.success('Event submitted for approval!')
      navigate('/dashboard/events')
    } catch (error) {
      console.error('Create event error:', error)
      toast.error(error.message || 'Failed to create event. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full px-4 py-3 border-2 border-dark-200 rounded-xl text-dark-700 placeholder-dark-400 focus:outline-none focus:border-primary-500 transition-colors duration-200'

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark-900">Create New Event</h1>
        <p className="text-dark-500 mt-1">Fill in the details to create your event</p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-2xl border border-dark-200 p-8 max-w-3xl"
      >
        {/* Title */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-dark-700 mb-2">
            Event Title *
          </label>
          <input
            {...register('title', { required: 'Title is required' })}
            placeholder="e.g., HackSRM 2026"
            className={inputClass}
          />
          {errors.title && (
            <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Type + Mode */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-2">
              Event Type *
            </label>
            <select
              {...register('type', { required: 'Type is required' })}
              className={inputClass}
            >
              <option value="">Select type</option>
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>
            )}
            {selectedType && (
              <div className="mt-2.5 relative rounded-xl overflow-hidden h-28 border border-dark-200 shadow-sm">
                <img
                  src={getBannerForEventType(selectedType)}
                  alt={selectedType}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-2.5">
                  <span className="text-white text-xs font-semibold px-2 py-0.5 bg-black/40 backdrop-blur-md rounded-md">
                    📸 Category Photo: {selectedType}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-2">
              Mode *
            </label>
            <select
              {...register('mode', { required: 'Mode is required' })}
              className={inputClass}
            >
              <option value="">Select mode</option>
              {Object.values(EVENT_MODE).map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
            {errors.mode && (
              <p className="text-red-500 text-xs mt-1">{errors.mode.message}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-dark-700 mb-2">
            Description *
          </label>
          <textarea
            {...register('description', { required: 'Description is required' })}
            placeholder="Describe your event..."
            rows={4}
            className={inputClass}
          />
          {errors.description && (
            <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Venue */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-dark-700 mb-2">
            Venue
          </label>
          <input
            {...register('venue')}
            placeholder="e.g., Main Auditorium, SRM University"
            className={inputClass}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-2">
              Start Date *
            </label>
            <input
              type="datetime-local"
              {...register('startDate', { required: 'Start date is required' })}
              className={inputClass}
            />
            {errors.startDate && (
              <p className="text-red-500 text-xs mt-1">{errors.startDate.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-2">
              End Date *
            </label>
            <input
              type="datetime-local"
              {...register('endDate', { required: 'End date is required' })}
              className={inputClass}
            />
            {errors.endDate && (
              <p className="text-red-500 text-xs mt-1">{errors.endDate.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-2">
              Registration Deadline
            </label>
            <input
              type="datetime-local"
              {...register('registrationDeadline')}
              className={inputClass}
            />
          </div>
        </div>

        {/* Max Participants */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-dark-700 mb-2">
            Max Participants
          </label>
          <input
            type="number"
            {...register('maxParticipants', { valueAsNumber: true })}
            placeholder="e.g., 500"
            className={inputClass}
          />
        </div>

        {/* Tags */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-dark-700 mb-3">
            Themes / Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {THEME_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                  ${selectedTags.includes(tag)
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-100 text-dark-600 hover:bg-dark-200'
                  }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Event'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
        </div>
      </motion.form>
    </div>
  )
}
