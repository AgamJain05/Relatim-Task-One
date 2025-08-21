import axios from 'axios'
import toast from 'react-hot-toast'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't auto-redirect on 401 - let components handle it
    if (error.response?.status === 403) {
      toast.error('Access forbidden')
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.')
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please try again.')
    } else if (!error.response) {
      toast.error('Network error. Please check your connection.')
    }
    
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
}

// Chat API
export const chatAPI = {
  sendMessage: (messageData) => api.post('/chat/messages', messageData),
  getConversations: (params = {}) => api.get('/chat/conversations', { params }),
  getMessages: (userId, params = {}) => api.get(`/chat/messages/${userId}`, { params }),
  deleteMessage: (messageId) => api.delete(`/chat/messages/${messageId}`),
}

// Contact API
export const contactAPI = {
  getContacts: (params = {}) => api.get('/contacts', { params }),
  addContact: (contactData) => api.post('/contacts', contactData),
  updateContact: (contactId, contactData) => api.put(`/contacts/${contactId}`, contactData),
  deleteContact: (contactId) => api.delete(`/contacts/${contactId}`),
  searchUsers: (query) => api.get('/contacts/search/users', { params: { query } }),
}

export default api

