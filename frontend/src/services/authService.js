import { authClient } from './authClient'
import { SUPER_ADMIN_EMAIL } from '../utils/constants'

const NEON_AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL || 'https://ep-billowing-bread-azc1ckap.neonauth.c-3.ap-southeast-1.aws.neon.tech/neondb/auth'
let cachedToken = null
let cachedTokenExpiry = 0

export const signInWithGoogle = async () => {
  try {
    const res = await authClient.signIn.social({
      provider: 'google',
      callbackURL: window.location.origin,
    })
    
    // Better Auth returns { data: { url: '...' }, error: null }
    if (res?.data?.url) {
      window.location.href = res.data.url
      return { redirecting: true, url: res.data.url }
    }
    
    if (res?.error) {
      throw new Error(res.error.message || 'Failed to initialize Google sign in')
    }

    return res
  } catch (error) {
    console.error('Google sign-in error:', error)
    throw error
  }
}

export const signInWithMockUser = (userData) => {
  const role = getUserRole(userData.email)
  const user = {
    uid: userData.uid || `usr_${Date.now()}`,
    id: userData.id || userData.uid || `usr_${Date.now()}`,
    email: userData.email,
    displayName: userData.displayName || userData.email.split('@')[0],
    photoURL: userData.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${userData.email}`,
    role,
  }
  localStorage.setItem('campusevents_user', JSON.stringify(user))
  return user
}

export const logOut = async () => {
  try {
    cachedToken = null
    cachedTokenExpiry = 0
    localStorage.removeItem('campusevents_user')
    // Mark intentional logout so the localStorage fallback is skipped on refresh
    sessionStorage.setItem('campusevents_logged_out', '1')
    await authClient.signOut()
  } catch (error) {
    console.error('Sign out error:', error)
    localStorage.removeItem('campusevents_user')
    sessionStorage.setItem('campusevents_logged_out', '1')
  }
}

export const getAuthToken = async () => {
  try {
    // Return cached token if still valid (>30s remaining)
    if (cachedToken && Date.now() < cachedTokenExpiry - 30_000) {
      return cachedToken
    }

    // better-auth exposes a /token endpoint that returns the JWT.
    // The client's $fetch proxy calls <baseURL>/token
    let jwt = null

    // Method 1: Try authClient.token() if it exists (some versions expose this)
    if (typeof authClient.token === 'function') {
      try {
        const result = await authClient.token()
        jwt = result?.data?.token || result?.token
      } catch (_) {}
    }

    // Method 2: Direct fetch to the better-auth /token endpoint (standard route)
    if (!jwt) {
      const res = await fetch(`${NEON_AUTH_URL}/token`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        const data = await res.json()
        jwt = data?.token || data?.access_token || data?.jwt
      } else {
        console.warn('[Auth] /token responded with status:', res.status)
      }
    }

    if (jwt) {
      cachedToken = jwt
      try {
        const payload = JSON.parse(atob(jwt.split('.')[1]))
        cachedTokenExpiry = (payload.exp || 0) * 1000
      } catch {
        cachedTokenExpiry = Date.now() + 55 * 60 * 1000
      }
      return jwt
    }
  } catch (e) {
    console.warn('[Auth] Could not retrieve JWT:', e)
  }
  return cachedToken
}

export const setAuthToken = (token) => {
  cachedToken = token
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      cachedTokenExpiry = (payload.exp || 0) * 1000
    } catch {
      cachedTokenExpiry = Date.now() + 55 * 60 * 1000
    }
  } else {
    cachedTokenExpiry = 0
  }
}

export const getUserRole = (email) => {
  if (!email) return 'STUDENT'
  return email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
    ? 'super-admin'
    : 'organizer'
}

export const onAuthChange = (callback) => {
  let isMounted = true

  const checkSession = async () => {
    try {
      // 1. Check for Neon Auth session verifier in URL parameters
      const urlParams = new URLSearchParams(window.location.search)
      const verifier = urlParams.get('neon_auth_session_verifier')

      let session = null

      if (verifier) {
        try {
          // Attempt session resolution with verifier query parameter
          const res = await fetch(`${NEON_AUTH_URL}/get-session?neon_auth_session_verifier=${encodeURIComponent(verifier)}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          })
          if (res.ok) {
            const data = await res.json()
            session = { data }
          }
        } catch (verErr) {
          console.warn('Verifier get-session attempt failed:', verErr)
        }

        // Clean query parameter from browser address bar
        urlParams.delete('neon_auth_session_verifier')
        const remainingQuery = urlParams.toString()
        const newUrl = window.location.pathname + (remainingQuery ? `?${remainingQuery}` : '') + window.location.hash
        window.history.replaceState({}, document.title, newUrl)
      }

      // 2. Fallback to standard client getSession
      if (!session?.data?.user) {
        try {
          session = await authClient.getSession()
        } catch (e) {}
      }

      if (!isMounted) return

      const rawUser = session?.data?.user || (session?.data?.email ? session.data : null)
      
      if (rawUser) {
        const role = getUserRole(rawUser.email)
        const user = {
          uid: rawUser.id || rawUser.sub || rawUser.uid,
          id: rawUser.id || rawUser.sub || rawUser.uid,
          email: rawUser.email,
          displayName: rawUser.name || rawUser.displayName || rawUser.email.split('@')[0],
          photoURL: rawUser.image || rawUser.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${rawUser.email}`,
          role,
        }
        // User signed in — clear any previous logout flag
        sessionStorage.removeItem('campusevents_logged_out')
        localStorage.setItem('campusevents_user', JSON.stringify(user))
        callback(user)
        return
      }

      // 3. Check saved localStorage session — but NOT if user explicitly signed out
      const wasLoggedOut = sessionStorage.getItem('campusevents_logged_out')
      if (!wasLoggedOut) {
        const savedUserStr = localStorage.getItem('campusevents_user')
        if (savedUserStr) {
          try {
            const parsed = JSON.parse(savedUserStr)
            if (parsed && parsed.email) {
              callback(parsed)
              return
            }
          } catch (e) {
            localStorage.removeItem('campusevents_user')
          }
        }
      }

      callback(null)
    } catch (err) {
      if (isMounted) {
        // Skip localStorage fallback if the user intentionally signed out
        const wasLoggedOut = sessionStorage.getItem('campusevents_logged_out')
        if (!wasLoggedOut) {
          const savedUserStr = localStorage.getItem('campusevents_user')
          if (savedUserStr) {
            try {
              const parsed = JSON.parse(savedUserStr)
              if (parsed && parsed.email) {
                callback(parsed)
                return
              }
            } catch (e) {}
          }
        }
        callback(null)
      }
    }
  }

  checkSession()

  return () => {
    isMounted = false
  }
}
