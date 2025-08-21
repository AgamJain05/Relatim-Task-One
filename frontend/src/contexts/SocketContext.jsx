import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useQueryClient } from 'react-query'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const { token, user } = useAuthStore()
  const queryClient = useQueryClient()

  useEffect(() => {
    // Reset state when user changes
    setSocket(null)
    setIsConnected(false)
    setOnlineUsers(new Set())
    
    // Clear React Query cache to ensure fresh data for new user
    queryClient.clear()
    
    if (token && user) {
      // Initialize socket connection
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
      console.log('Connecting to Socket.io server:', socketUrl)
      
      const socketInstance = io(socketUrl, {
        auth: { token },
        transports: ['websocket'], // Only use WebSocket for faster connection
        timeout: 10000, // Reduced timeout
        forceNew: false, // Don't force new connection
        reconnection: true,
        reconnectionAttempts: 3, // Reduced attempts
        reconnectionDelay: 500, // Faster reconnection
        reconnectionDelayMax: 2000, // Max delay
      })

      socketInstance.on('connect', () => {
        console.log('Connected to server')
        setIsConnected(true)
        setSocket(socketInstance)
        // Add current user to online users when connected
        setOnlineUsers(prev => new Set([...prev, user.id]))
        
        // Immediately fetch fresh conversations for the new user
        queryClient.invalidateQueries(['conversations'])
      })

      socketInstance.on('disconnect', (reason) => {
        console.log('Disconnected from server:', reason)
        setIsConnected(false)
        // Remove current user from online users when disconnected
        setOnlineUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(user.id)
          return newSet
        })
        
        // If disconnection was not intentional, try to reconnect
        if (reason === 'io server disconnect' || reason === 'io client disconnect') {
          console.log('Attempting to reconnect...')
          socketInstance.connect()
        }
      })

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        setIsConnected(false)
        
        // Show specific error messages
        if (error.message === 'User not found') {
          console.error('Authentication failed - user not found in database')
        } else if (error.message === 'Authentication error') {
          console.error('JWT token validation failed')
        } else {
          console.error('Connection failed:', error.message)
        }
      })

      socketInstance.on('user_online', (data) => {
        setOnlineUsers(prev => new Set([...prev, data.userId]))
      })

      socketInstance.on('user_offline', (data) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(data.userId)
          return newSet
        })
      })

      return () => {
        socketInstance.disconnect()
        setSocket(null)
        setIsConnected(false)
      }
    }
  }, [token, user])

  const sendMessage = (messageData) => {
    if (socket && isConnected) {
      socket.emit('send_message', messageData)
    }
  }

  const markAsRead = (messageId) => {
    if (socket && isConnected) {
      socket.emit('mark_as_read', { messageId })
    }
  }

  const emitTyping = (receiverId, isTyping) => {
    if (socket && isConnected) {
      socket.emit('typing', { receiverId, isTyping })
    }
  }

  const value = {
    socket,
    isConnected,
    onlineUsers,
    sendMessage,
    markAsRead,
    emitTyping,
    isLoading: !socket && token && user, // Show loading while connecting
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}
