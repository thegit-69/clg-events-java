import { NavLink, Link } from 'react-router-dom'
import {
  IoGridOutline,
  IoCalendarOutline,
  IoAddCircleOutline,
  IoNotificationsOutline,
  IoHomeOutline,
} from 'react-icons/io5'
import { HiOutlineAcademicCap } from 'react-icons/hi2'
import useAuthStore from '../../store/authStore'

const sidebarLinks = [
  { label: 'Overview', path: '/dashboard', icon: <IoGridOutline />, end: true },
  { label: 'My Events', path: '/dashboard/events', icon: <IoCalendarOutline /> },
  { label: 'Create Event', path: '/dashboard/create', icon: <IoAddCircleOutline /> },
  { label: 'Notifications', path: '/dashboard/notifications', icon: <IoNotificationsOutline /> },
]

export default function Sidebar({ isOpen, onClose }) {
  const { isSuperAdmin } = useAuthStore()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 min-h-screen bg-dark-900 text-white flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-dark-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <HiOutlineAcademicCap className="text-white text-lg" />
            </div>
            <span className="text-lg font-bold">CampusEvents</span>
          </div>
        </div>

        {/* Back to Home */}
        <div className="px-4 pt-4">
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                       text-dark-400 hover:text-white hover:bg-dark-800 transition-colors duration-200"
          >
            <span className="text-lg"><IoHomeOutline /></span>
            Back to Home
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <p className="text-xs font-semibold text-dark-500 uppercase tracking-wider px-4 mb-3">
            Dashboard
          </p>
          <ul className="space-y-1">
            {sidebarLinks.map((link) => (
              <li key={link.path}>
                <NavLink
                  to={link.path}
                  end={link.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${isActive
                      ? 'bg-primary-500 text-white'
                      : 'text-dark-400 hover:text-white hover:bg-dark-800'
                    }`
                  }
                >
                  <span className="text-lg">{link.icon}</span>
                  {link.label}
                </NavLink>
              </li>
            ))}
            {isSuperAdmin && (
              <li>
                <NavLink
                  to="/dashboard/admin/review"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${isActive
                      ? 'bg-primary-500 text-white'
                      : 'text-dark-400 hover:text-white hover:bg-dark-800'
                    }`
                  }
                >
                  <span className="text-lg"><IoNotificationsOutline /></span>
                  Admin Review
                </NavLink>
              </li>
            )}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-dark-700">
          <p className="text-xs text-dark-500 text-center">
            Organizer Dashboard
          </p>
        </div>
      </aside>
    </>
  )
}
