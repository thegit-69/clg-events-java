import { authClient } from './authClient'
import { SUPER_ADMIN_EMAIL } from '../utils/constants'

const NEON_AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL || 'https://ep-billowing-bread-azc1ckap.neonauth.c-3.ap-southeast-1.aws.neon.tech/neondb/auth'

// ── In-memory JWT cache ───────────────────────────────────────────────────────
// We store the JWT in module memory, NOT localStorage.
// - No localStorage = no ghost sessions after logout
// - On refresh: re-fetched from Neon Auth's /token endpoint using the HttpOnly session cookie
// - On logout: cachedToken is nulled → api.js sends no Authorization header → 401 from backend
let cachedToken = null
let cachedTokenExpiry = 0

// ── Google Sign-In ────────────────────────────────────────────────────────────
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

// ── Logout ────────────────────────────────────────────────────────────────────
export const logOut = async () => {
  try {
    // 1. Clear cached JWT immediately — api.js will stop sending Authorization headers
    cachedToken = null
    cachedTokenExpiry = 0
    // 2. Mark intentional logout to skip localStorage fallback on next load
    sessionStorage.setItem('campusevents_logged_out', '1')
    // 3. Remove any persisted user from localStorage
    localStorage.removeItem('campusevents_user')
    // 4. Invalidate the Neon Auth session (clears HttpOnly cookie on Neon's domain)
    await authClient.signOut()
  } catch (error) {
    console.error('Sign out error:', error)
    // Ensure local state is cleared even if Neon Auth signOut fails
    localStorage.removeItem('campusevents_user')
    sessionStorage.setItem('campusevents_logged_out', '1')
  }
}

// ── JWT Token Retrieval ───────────────────────────────────────────────────────
// Neon Auth (Better Auth) issues a signed JWT via its /token endpoint.
// The request uses `credentials: 'include'` to send the HttpOnly session cookie
// that Neon Auth set after Google OAuth. No JWT secret needed on our end —
// Spring Boot verifies the JWT's EdDSA signature using Neon Auth's public JWKS keys.
export const getAuthToken = async () => {
  try {
    // Skip if user intentionally signed out
    if (sessionStorage.getItem('campusevents_logged_out')) {
      return null
    }

    // Return cached token if still valid (>30s remaining)
    if (cachedToken && Date.now() < cachedTokenExpiry - 30_000) {
      return cachedToken
    }

    let jwt = null

    // Method 1: Try authClient.token() — available in some Better Auth versions
    if (typeof authClient.token === 'function') {
      try {
        const result = await authClient.token()
        jwt = result?.data?.token || result?.token
      } catch (_) {}
    }

    // Method 2: Direct fetch to Better-Auth /token endpoint using session cookie
    if (!jwt) {
      const res = await fetch(`${NEON_AUTH_URL}/token`, {
        method: 'GET',
        credentials: 'include', // Sends Neon Auth HttpOnly session cookie
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

  return null // Don't return stale token if fetch failed
}

export const getUserRole = (email) => {
  if (!email) return 'STUDENT'
  return email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
    ? 'super-admin'
    : 'organizer'
}

// ── Auth State Listener ───────────────────────────────────────────────────────
// Checks Neon Auth session on app load.
// Uses Neon Auth's getSession() which reads the HttpOnly cookie on their domain.
// On success: pre-warms the JWT cache so first API request is instant.
export const onAuthChange = (callback) => {
  let isMounted = true

  const checkSession = async () => {
    try {
      // 1. Handle Neon Auth OAuth redirect verifier (present after Google callback)
      const urlParams = new URLSearchParams(window.location.search)
      const verifier = urlParams.get('neon_auth_session_verifier')

      let session = null

      if (verifier) {
        try {
          const res = await fetch(`${NEON_AUTH_URL}/get-session?neon_auth_session_verifier=${encodeURIComponent(verifier)}`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          })
          if (res.ok) {
            const data = await res.json()
            session = { data }
          }
        } catch (verErr) {
          console.warn('Verifier get-session attempt failed:', verErr)
        }

        // Clean verifier from URL bar
        urlParams.delete('neon_auth_session_verifier')
        const remainingQuery = urlParams.toString()
        const newUrl = window.location.pathname + (remainingQuery ? `?${remainingQuery}` : '') + window.location.hash
        window.history.replaceState({}, document.title, newUrl)
      }

      // 2. Standard getSession — reads Neon Auth HttpOnly session cookie
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
        // Keep localStorage only as a display cache (not for auth headers anymore)
        localStorage.setItem('campusevents_user', JSON.stringify(user))
        // Pre-warm the JWT cache so the first API call doesn't wait
        getAuthToken().catch(() => {})
        callback(user)
        return
      }

      // 3. If user explicitly logged out, respect that — don't fall back to localStorage
      if (sessionStorage.getItem('campusevents_logged_out')) {
        localStorage.removeItem('campusevents_user')
        callback(null)
        return
      }

      // 4. No active Neon Auth session — check localStorage display cache (cold start only)
      const savedUserStr = localStorage.getItem('campusevents_user')
      if (savedUserStr) {
        try {
          const parsed = JSON.parse(savedUserStr)
          if (parsed && parsed.email) {
            // Show cached display info while we verify the session
            // But we do NOT pre-warm token here — token fetch will confirm if session is real
            callback(parsed)
            return
          }
        } catch (e) {
          localStorage.removeItem('campusevents_user')
        }
      }

      callback(null)
    } catch (err) {
      if (isMounted) {
        if (!sessionStorage.getItem('campusevents_logged_out')) {
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
