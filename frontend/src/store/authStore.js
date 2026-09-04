import { create } from 'zustand'
import { logOut } from '../services/authService'

const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  isAuthenticated: false,
  isSuperAdmin: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isSuperAdmin: user?.role === 'super-admin' || user?.role === 'SUPER_ADMIN',
      loading: false,
    }),

  setLoading: (loading) => set({ loading }),

  logout: async () => {
    // Clear Zustand state IMMEDIATELY — this stops api.js from attaching headers
    // even before the async logOut() call finishes
    set({
      user: null,
      isAuthenticated: false,
      isSuperAdmin: false,
      loading: false,
    })
    try {
      await logOut()
    } catch (error) {
      console.error('Logout error:', error)
    }
  },
}))

export default useAuthStore
