import { authClient } from './authClient'
import { SUPER_ADMIN_EMAIL } from '../utils/constants'

let cachedToken = null

export const signInWithGoogle = async () => {
  try {
    const data = await authClient.signIn.social({
      provider: 'google',
      callbackURL: window.location.origin,
    })
    return data
  } catch (error) {
    console.error('Google sign-in error:', error)
    throw error
  }
}

export const logOut = async () => {
  try {
    cachedToken = null
    await authClient.signOut()
  } catch (error) {
    console.error('Sign out error:', error)
    throw error
  }
}

export const getAuthToken = async () => {
  try {
    if (cachedToken) return cachedToken
    if (typeof authClient.token === 'function') {
      const result = await authClient.token()
      if (result?.data?.token) {
        cachedToken = result.data.token
        return result.data.token
      }
    }
  } catch (e) {
    console.warn('Could not retrieve raw JWT token from Neon Auth client:', e)
  }
  return cachedToken
}

export const setAuthToken = (token) => {
  cachedToken = token
}

export const getUserRole = (email) => {
  if (!email) return 'organizer'
  return email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
    ? 'super-admin'
    : 'organizer'
}

export const onAuthChange = (callback) => {
  let isMounted = true

  const checkSession = async () => {
    try {
      const session = await authClient.getSession()
      if (!isMounted) return

      if (session?.data?.user) {
        const rawUser = session.data.user
        const role = getUserRole(rawUser.email)
        const user = {
          uid: rawUser.id || rawUser.sub,
          id: rawUser.id || rawUser.sub,
          email: rawUser.email,
          displayName: rawUser.name || rawUser.displayName,
          photoURL: rawUser.image || rawUser.photoUrl,
          role,
        }
        callback(user)
      } else {
        callback(null)
      }
    } catch (err) {
      if (isMounted) callback(null)
    }
  }

  checkSession()

  return () => {
    isMounted = false
  }
}
