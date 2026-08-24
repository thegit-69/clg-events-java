import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { IoMenuOutline, IoCloseOutline, IoTicketOutline } from 'react-icons/io5'
import { HiOutlineAcademicCap } from 'react-icons/hi2'
import Button from '../ui/Button'
import useAuthStore from '../../store/authStore'
import AuthModal from '../AuthModal'
import { NAV_LINKS } from '../../utils/constants'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const [authModal, setAuthModal] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const location = useLocation()

  return (
    <>
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-dark-100">
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Mobile menu button */}
            <button
              className="md:hidden text-dark-600"
              onClick={() => setMobileMenu(!mobileMenu)}
              aria-label={mobileMenu ? 'Close menu' : 'Open menu'}
            >
              {mobileMenu ? (
                <IoCloseOutline size={24} />
              ) : (
                <IoMenuOutline size={24} />
              )}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <HiOutlineAcademicCap className="text-white text-lg" />
              </div>
              <span className="text-xl font-bold text-dark-900">
                CampusEvents
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors duration-200
                    ${location.pathname === link.path
                      ? 'text-primary-500'
                      : 'text-dark-500 hover:text-dark-900'
                    }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Link to="/my-tickets">
                    <Button variant="ghost" size="sm" icon={<IoTicketOutline />}>
                      My Tickets
                    </Button>
                  </Link>
                  <Link to="/dashboard">
                    <Button variant="outline" size="sm">
                      Dashboard
                    </Button>
                  </Link>
                  <div className="flex items-center gap-3 ml-2 pl-4 border-l border-dark-200">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-semibold text-dark-900 leading-tight">
                        {user?.displayName || 'User'}
                      </span>
                      <span className="text-xs text-dark-500 max-w-[120px] truncate leading-tight">
                        {user?.email}
                      </span>
                    </div>
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName}
                        className="w-9 h-9 rounded-full object-cover border border-primary-200"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm border border-primary-200">
                        {user?.displayName?.charAt(0) || 'U'}
                      </div>
                    )}
                    <button
                      onClick={logout}
                      className="text-sm font-medium text-dark-500 hover:text-red-600 transition-colors ml-2"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setAuthModal(true)}
                  >
                    Sign in
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Auth profile pic */}
            {!isAuthenticated ? (
              <Button
                className="md:hidden"
                variant="primary"
                size="sm"
                onClick={() => {
                  setAuthModal(true)
                  setMobileMenu(false)
                }}
              >
                Sign in
              </Button>
            ) : (
              <div className="md:hidden flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80" onClick={() => setMobileMenu(!mobileMenu)}>
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-8 h-8 rounded-full object-cover border border-primary-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm">
                    {user?.displayName?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu */}
          {mobileMenu && (
            <div className="md:hidden py-4 border-t border-dark-100 animate-fade-in">
              {/* User Info in Mobile Menu */}
              {isAuthenticated && (
                <div className="flex items-center gap-3 mb-6 p-3 bg-dark-50 rounded-xl">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-primary-200"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg">
                      {user?.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="font-semibold text-dark-900">{user?.displayName || 'User'}</span>
                    <span className="text-xs text-dark-500">{user?.email}</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-dark-700 hover:bg-dark-50 hover:text-dark-900 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}

                {isAuthenticated && (
                  <>
                    <div className="h-px bg-dark-100 my-2" />
                    <Link
                      to="/my-tickets"
                      onClick={() => setMobileMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-dark-700 hover:bg-dark-50 hover:text-dark-900 transition-colors"
                    >
                      <IoTicketOutline size={20} /> My Tickets
                    </Link>
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-primary-600 hover:bg-primary-50 transition-colors"
                    >
                      <HiOutlineAcademicCap size={20} /> Dashboard
                    </Link>
                    <div className="h-px bg-dark-100 my-2" />
                    <button
                      onClick={() => {
                        logout()
                        setMobileMenu(false)
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                    >
                      Sign out
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <AuthModal isOpen={authModal} onClose={() => setAuthModal(false)} />
    </>
  )
}
