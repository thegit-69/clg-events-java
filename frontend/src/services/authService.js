import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from './firebase'
import { SUPER_ADMIN_EMAIL } from '../utils/constants'

const googleProvider = new GoogleAuthProvider()

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    return result.user
  } catch (error) {
    console.error('Google sign-in error:', error)
    throw error
  }
}

export const logOut = async () => {
  try {
    await signOut(auth)
  } catch (error) {
    console.error('Sign out error:', error)
    throw error
  }
}

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback)
}

export const getUserRole = (email) => {
  if (!email) return 'organizer'
  return email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
    ? 'super-admin'
    : 'organizer'
}
