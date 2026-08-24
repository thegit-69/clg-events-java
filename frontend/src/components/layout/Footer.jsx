import { Link } from 'react-router-dom'
import { HiOutlineAcademicCap } from 'react-icons/hi2'
import { IoLogoGithub } from 'react-icons/io5'

export default function Footer() {
  return (
    <footer className="bg-dark-900 text-dark-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <HiOutlineAcademicCap className="text-white text-lg" />
              </div>
              <span className="text-xl font-bold text-white">
                CampusEvents
              </span>
            </Link>
            <p className="text-dark-400 text-sm max-w-md">
              Simplifying the management of academic and cultural events in
              colleges. Create, discover, and participate in events with ease.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/events" className="text-sm text-dark-400 hover:text-white transition-colors">
                  Browse Events
                </Link>
              </li>
              <li>
                <Link to="/dashboard/create" className="text-sm text-dark-400 hover:text-white transition-colors">
                  Create Event
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-sm text-dark-400 hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">
              Contact us
            </h4>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-dark-400">
                  <a href="mailto:cdasarath2006@gmail.com">cdasarath2006@gmail.com</a>
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-dark-700 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-dark-500">
            © 2026 Team Kalki 
          </p>
          <p className="text-xs text-dark-500">
            Made with ❤️ for college communities
          </p>
        </div>
      </div>
    </footer>
  )
}
