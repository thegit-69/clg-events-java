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
      let user = null
      const savedUserStr = localStorage.getItem('campusevents_user')
      if (savedUserStr) {
        try {
          user = JSON.parse(savedUserStr)
        } catch (e) {}
      }

      // Fallback to Zustand state if localStorage is empty or invalid
      if (!user || !user.email) {
        const storeState = useAuthStore.getState()
        if (storeState?.user) {
          user = storeState.user
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
