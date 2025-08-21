import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Initialize auth state from localStorage
      initializeAuth: () => {
        const token = localStorage.getItem('token')
        const user = localStorage.getItem('user')
        
        if (token && user) {
          try {
            set({
              token,
              user: JSON.parse(user),
              isAuthenticated: true,
            })
          } catch (error) {
            console.error('Error parsing stored user data:', error)
            get().logout()
          }
        }
      },

      // Login action
      login: async (credentials) => {
        set({ isLoading: true })
        try {
          const response = await authAPI.login(credentials)
          const { user, token } = response.data.data

          // Store in localStorage
          localStorage.setItem('token', token)
          localStorage.setItem('user', JSON.stringify(user))

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          })

          toast.success('Login successful!')
          return { success: true, data: response.data }
        } catch (error) {
          set({ isLoading: false })
          const message = error.response?.data?.message || 'Login failed'
          toast.error(message)
          return { success: false, error: message }
        }
      },

      // Register action
      register: async (userData) => {
        set({ isLoading: true })
        try {
          const response = await authAPI.register(userData)
          const { user, token } = response.data.data

          // Store in localStorage
          localStorage.setItem('token', token)
          localStorage.setItem('user', JSON.stringify(user))

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          })

          toast.success('Registration successful!')
          return { success: true, data: response.data }
        } catch (error) {
          set({ isLoading: false })
          const message = error.response?.data?.message || 'Registration failed'
          toast.error(message)
          return { success: false, error: message }
        }
      },

      // Logout action
      logout: async () => {
        try {
          if (get().token) {
            await authAPI.logout()
          }
        } catch (error) {
          console.error('Logout API error:', error)
        } finally {
          // Clear localStorage
          localStorage.removeItem('token')
          localStorage.removeItem('user')

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          })

          toast.success('Logged out successfully')
          
          // Trigger a page reload to completely reset the app state
          setTimeout(() => {
            window.location.reload()
          }, 500)
        }
      },

      // Update profile action
      updateProfile: async (profileData) => {
        set({ isLoading: true })
        try {
          const response = await authAPI.updateProfile(profileData)
          const { user } = response.data.data

          // Update localStorage
          localStorage.setItem('user', JSON.stringify(user))

          set({
            user,
            isLoading: false,
          })

          toast.success('Profile updated successfully!')
          return { success: true, data: response.data }
        } catch (error) {
          set({ isLoading: false })
          const message = error.response?.data?.message || 'Profile update failed'
          toast.error(message)
          return { success: false, error: message }
        }
      },

      // Get auth headers for API calls
      getAuthHeaders: () => {
        const token = get().token
        return token ? { Authorization: `Bearer ${token}` } : {}
      },

      // Check if token is expired (basic check)
      isTokenExpired: () => {
        const token = get().token
        if (!token) return true
        
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          return payload.exp * 1000 < Date.now()
        } catch {
          return true
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
