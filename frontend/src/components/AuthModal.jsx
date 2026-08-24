import { useState } from 'react'
import { FcGoogle } from 'react-icons/fc'
import Modal from './ui/Modal'
import useAuthStore from '../store/authStore'
import { getUserRole, signInWithGoogle } from '../services/authService'
import toast from 'react-hot-toast'

export default function AuthModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false)
  const { setUser } = useAuthStore()

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      const user = await signInWithGoogle()
      setUser({
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        role: getUserRole(user.email),
      })
      toast.success('Signed in successfully!')
      onClose()
    } catch (error) {
      toast.error(error.message || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-3xl font-bold text-dark-900 mb-6 text-center">
        Sign in
      </h2>
      <div className="space-y-3">
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3
                     border-2 border-dark-200 rounded-xl text-dark-700 font-medium
                     hover:bg-dark-50 transition-colors duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FcGoogle size={20} />
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>
      </div>
      <p className="text-xs text-dark-400 text-center mt-6">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </Modal>
  )
}
