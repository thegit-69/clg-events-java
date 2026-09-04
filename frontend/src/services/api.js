import axios from 'axios'
import { getAuthToken } from './authService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // No withCredentials needed — we use Authorization header, not cookies
})

// Request Interceptor: Attach Neon Auth JWT as Bearer token
// Spring Boot verifies this cryptographically via the JWKS endpoint.
// No X-User-* headers — those were spoofable by anyone.
api.interceptors.request.use(
  async (config) => {
    try {
      // Skip if user just logged out
      if (sessionStorage.getItem('campusevents_logged_out')) {
        return config
      }

      const token = await getAuthToken()
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
      }
    } catch (e) {
      console.error('Error attaching Authorization header:', e)
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
