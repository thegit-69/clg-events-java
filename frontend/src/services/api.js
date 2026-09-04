import axios from 'axios'
import useAuthStore from '../store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Request Interceptor: Attach User identity headers for authentication
api.interceptors.request.use(
  async (config) => {
    try {
      // Skip sending auth headers if the user has explicitly signed out
      // (prevents stale localStorage from re-authenticating on the backend)
      if (sessionStorage.getItem('campusevents_logged_out')) {
        return config
      }

      let user = null

      // Priority 1: In-memory Zustand store (always up-to-date, avoids stale localStorage)
      const storeState = useAuthStore.getState()
      if (storeState?.user?.email) {
        user = storeState.user
      }

      // Priority 2: localStorage fallback (for cases where Zustand hasn't hydrated yet)
      if (!user || !user.email) {
        const savedUserStr = localStorage.getItem('campusevents_user')
        if (savedUserStr) {
          try {
            user = JSON.parse(savedUserStr)
          } catch (e) {}
        }
      }

      if (user && user.email) {
        config.headers['X-User-Id'] = user.uid || user.id || `usr_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}`
        config.headers['X-User-Email'] = user.email
        config.headers['X-User-Name'] = user.displayName || user.name || user.email.split('@')[0]
      }
    } catch (e) {
      console.error('Error attaching identity headers:', e)
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: Unwrap ApiResponse<T> data
api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data.data
    }
    return response.data
  },
  (error) => {
    const errorMsg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred'
    return Promise.reject(new Error(errorMsg))
  }
)

export default api
