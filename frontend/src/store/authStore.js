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
      isSuperAdmin: user?.role === 'super-admin',
      loading: false,
    }),

  setLoading: (loading) => set({ loading }),

  logout: async () => {
    try {
      await logOut()
    } catch (error) {
      console.error('Logout error:', error)
    }
    set({
      user: null,
      isAuthenticated: false,
      isSuperAdmin: false,
      loading: false,
    })
  },
}))

export default useAuthStore
