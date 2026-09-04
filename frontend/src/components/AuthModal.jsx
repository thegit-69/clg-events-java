import { useState } from 'react'
import { FcGoogle } from 'react-icons/fc'
import Modal from './ui/Modal'
import useAuthStore from '../store/authStore'
import { signInWithGoogle } from '../services/authService'
import toast from 'react-hot-toast'

export default function AuthModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false)
  const { setUser } = useAuthStore()

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      toast.loading('Connecting to Google sign-in...', { id: 'auth-redirect' })
      const res = await signInWithGoogle()
      if (res?.redirecting) {
        toast.success('Redirecting to Google...', { id: 'auth-redirect' })
        // Browser is navigating to Google OAuth
        return
      }
      if (res?.data?.user) {
        const rawUser = res.data.user
        const role = rawUser.email === 'cdasarath2006@gmail.com' ? 'super-admin' : 'user'
        const user = {
          uid: rawUser.id || rawUser.sub,
          displayName: rawUser.name || rawUser.displayName || rawUser.email.split('@')[0],
          email: rawUser.email,
          photoURL: rawUser.image || rawUser.photoUrl,
          role,
        }
        setUser(user)
        toast.success(`Welcome back, ${user.displayName}!`, { id: 'auth-redirect' })
        onClose()
      }
    } catch (error) {
      toast.error(error.message || 'Google sign in failed', { id: 'auth-redirect' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-dark-900">
          Sign In to CampusEvents
        </h2>
        <p className="text-sm text-dark-500 mt-1">
          Access registrations, create events, and manage attendees
        </p>
      </div>

      <div className="space-y-4">
        {/* Google OAuth Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3
                     border-2 border-dark-200 rounded-xl text-dark-800 font-semibold
                     hover:bg-dark-50 hover:border-dark-300 transition-all duration-200
                     shadow-sm active:scale-[0.99] disabled:opacity-50"
        >
          <FcGoogle size={22} />
          {loading ? 'Connecting...' : 'Continue with Google'}
        </button>
      </div>

      <p className="text-xs text-dark-400 text-center mt-6">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </Modal>
  )
}
