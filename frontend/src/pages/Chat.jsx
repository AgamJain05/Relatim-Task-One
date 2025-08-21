import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Send, 
  Smile, 
  Paperclip, 
  Phone, 
  Video, 
  MoreVertical,
  Search,
  MessageCircle,
  Edit3,
  Trash2,
  X,
  Check
} from 'lucide-react'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { chatAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useSocket } from '../contexts/SocketContext'
import toast from 'react-hot-toast'

const Chat = () => {
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messageText, setMessageText] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [editingMessage, setEditingMessage] = useState(null)
  const [editText, setEditText] = useState('')
  const [showMessageMenu, setShowMessageMenu] = useState(null)
  const messagesEndRef = useRef(null)
  const { userId } = useParams() // Get userId from URL
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { socket, sendMessage, isConnected, onlineUsers } = useSocket()

  // Helper function to check if user is online
  const isUserOnline = (userId) => {
    return onlineUsers.has(userId) || userId === user.id // Current user is always considered online
  }

  // Fetch conversations
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery(
    'conversations',
    () => chatAPI.getConversations(),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  )

  // Check for selected conversation from URL or localStorage
  useEffect(() => {
    // First, check localStorage (coming from Contacts page)
    const savedConversation = localStorage.getItem('selectedConversation')
    if (savedConversation) {
      try {
        const conversation = JSON.parse(savedConversation)
        setSelectedConversation(conversation)
        localStorage.removeItem('selectedConversation') // Clean up
        return
      } catch (error) {
        console.error('Error parsing saved conversation:', error)
      }
    }
  }, [])

  // Set conversation from URL parameter and conversations list
  useEffect(() => {
    console.log('Chat useEffect - userId:', userId)
    console.log('Chat useEffect - conversationsData:', conversationsData)
    
    if (userId && conversationsData?.data?.data?.conversations) {
      const conversation = conversationsData.data.data.conversations.find(
        conv => conv.user.id === userId
      )
      console.log('Chat useEffect - found conversation:', conversation)
      
      if (conversation) {
        setSelectedConversation(conversation)
        
        // Reset unread count when conversation is opened
        if (conversation.unreadCount > 0) {
          queryClient.setQueryData(['conversations'], (old) => {
            if (!old) return old
            
            const conversations = old.data.data?.conversations || []
            const updatedConversations = conversations.map(conv => {
              if (conv.user.id === userId) {
                return { ...conv, unreadCount: 0 }
              }
              return conv
            })
            
            return {
              ...old,
              data: {
                ...old.data,
                data: {
                  ...old.data.data,
                  conversations: updatedConversations
                }
              }
            }
          })
        }
      } else {
        // If no conversation exists, create a temporary one for the contact
        console.log('No existing conversation found, creating temporary one')
        
        // For self-chat, create a temporary conversation object
        if (userId === user.id) {
          const tempConversation = {
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              profilePicture: user.profilePicture,
              isOnline: true
            },
            lastMessage: null,
            unreadCount: 0
          }
          setSelectedConversation(tempConversation)
          console.log('Created temporary self-conversation:', tempConversation)
        }
      }
    }
  }, [userId, conversationsData, queryClient])

  // Fetch messages for selected conversation
  const { data: messagesData, isLoading: messagesLoading } = useQuery(
    ['messages', selectedConversation?.user?.id],
    () => selectedConversation ? chatAPI.getMessages(selectedConversation.user.id) : null,
    {
      enabled: !!selectedConversation,
      refetchInterval: 30000, // Refetch every 30 seconds (Socket.io handles real-time updates)
    }
  )

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (message) => {
      console.log('New message event received:', message)
      
      // Skip if this is a message from the current user (handled by handleMessageSent)
      if (message.senderId === user.id) {
        console.log('Skipping new message from current user (handled by message_sent)')
        return
      }
      
      // Add message to cache (prevent duplicates)
      queryClient.setQueryData(['messages', message.senderId], (old) => {
        if (!old) return old
        
        const existingMessages = old.data.data?.messages || []
        
        // Check if message already exists to prevent duplicates
        const messageExists = existingMessages.some(m => m.id === message.id)
        if (messageExists) {
          console.log('Message already exists, skipping duplicate')
          return old
        }
        
        // Also check for optimistic messages with same text to prevent duplicates
        const optimisticExists = existingMessages.some(m => 
          m.isOptimistic && m.messageText === message.messageText
        )
        if (optimisticExists) {
          console.log('Optimistic message with same text exists, skipping duplicate')
          return old
        }
        
        console.log('Adding new message to cache')
        
        return {
          ...old,
          data: {
            ...old.data,
            data: {
              ...old.data.data,
              messages: [...existingMessages, message]
            }
          }
        }
      })

      // Update conversations cache to reflect new message and increment unread count
      queryClient.setQueryData(['conversations'], (old) => {
        if (!old) return old
        
        const conversations = old.data.data?.conversations || []
        const updatedConversations = conversations.map(conv => {
          if (conv.user.id === message.senderId) {
            return {
              ...conv,
              lastMessage: message,
              unreadCount: conv.unreadCount + 1
            }
          }
          return conv
        })
        
        // If sender is not in conversations list, add them
        const senderExists = conversations.some(conv => conv.user.id === message.senderId)
        if (!senderExists) {
          // For new conversations, invalidate to fetch fresh data
          queryClient.invalidateQueries(['conversations'])
          return old
        }
        
        return {
          ...old,
          data: {
            ...old.data,
            data: {
              ...old.data.data,
              conversations: updatedConversations
            }
          }
        }
      })
      
      // Show notification if not from current user
      if (message.senderId !== user.id) {
        toast.success(`New message from ${message.sender.name}`)
      }
    }

    const handleMessageSent = (message) => {
      console.log('Message sent event received:', message)
      
      // Only handle messages sent by the current user
      if (message.senderId !== user.id) {
        console.log('Skipping message sent event - not from current user')
        return
      }
      
      // Add sent message to cache (prevent duplicates)
      queryClient.setQueryData(['messages', message.receiverId], (old) => {
        if (!old) return old
        
        const existingMessages = old.data.data?.messages || []
        
        // Remove any optimistic messages with the same text
        const filteredMessages = existingMessages.filter(m => 
          !m.isOptimistic || m.messageText !== message.messageText
        )
        
        // Check if this exact message already exists
        const messageExists = filteredMessages.some(m => m.id === message.id)
        if (messageExists) {
          console.log('Message already exists, skipping duplicate')
          return old
        }
        
        console.log('Adding sent message to cache, removing optimistic message')
        
        return {
          ...old,
          data: {
            ...old.data,
            data: {
              ...old.data.data,
              messages: [...filteredMessages, message]
            }
          }
        }
      })

      // Update conversations to reflect sent message
      queryClient.invalidateQueries(['conversations'])
    }

    const handleTyping = ({ userId, isTyping }) => {
      if (selectedConversation?.user?.id === userId) {
        setIsTyping(isTyping)
      }
    }

    socket.on('new_message', handleNewMessage)
    socket.on('message_sent', handleMessageSent)
    socket.on('user_typing', handleTyping)

    return () => {
      socket.off('new_message', handleNewMessage)
      socket.off('message_sent', handleMessageSent)
      socket.off('user_typing', handleTyping)
    }
  }, [socket, queryClient, user.id, selectedConversation])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messagesData])

  // Close message menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMessageMenu && !event.target.closest('.message-actions')) {
        setShowMessageMenu(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMessageMenu])

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return

    const messageData = {
      receiverId: selectedConversation.user.id,
      messageText: messageText.trim(),
      messageType: 'text'
    }

    // Optimistic update - immediately add message to UI
    const optimisticMessage = {
      id: Date.now().toString(), // Temporary ID
      senderId: user.id,
      receiverId: selectedConversation.user.id,
      messageText: messageData.messageText,
      messageType: 'text',
      timestamp: new Date().toISOString(),
      sender: user,
      isOptimistic: true // Flag to identify optimistic messages
    }

    // Add optimistic message to cache
    console.log('Adding optimistic message to cache:', optimisticMessage)
    queryClient.setQueryData(['messages', selectedConversation.user.id], (old) => {
      if (!old) return old
      return {
        ...old,
        data: {
          ...old.data,
          data: {
            ...old.data.data,
            messages: [...(old.data.data?.messages || []), optimisticMessage]
          }
        }
      }
    })

    // Clear input immediately
    setMessageText('')

    try {
      if (isConnected) {
        sendMessage(messageData)
      } else {
        // Fallback to API if socket not connected
        await chatAPI.sendMessage(messageData)
        queryClient.invalidateQueries(['messages', selectedConversation.user.id])
      }
    } catch (error) {
      // Remove optimistic message on error
      queryClient.setQueryData(['messages', selectedConversation.user.id], (old) => {
        if (!old) return old
        return {
          ...old,
          data: {
            ...old.data,
            data: {
              ...old.data.data,
              messages: old.data.data?.messages?.filter(msg => msg.id !== optimisticMessage.id) || []
            }
          }
        }
      })
      toast.error('Failed to send message')
      setMessageText(messageData.messageText) // Restore message text
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleEditMessage = (message) => {
    setEditingMessage(message)
    setEditText(message.messageText)
  }

  const handleSaveEdit = async () => {
    if (!editingMessage || !editText.trim() || editText === editingMessage.messageText) {
      setEditingMessage(null)
      setEditText('')
      return
    }

    try {
      // Update message in cache optimistically
      queryClient.setQueryData(['messages', selectedConversation.user.id], (old) => {
        if (!old) return old
        
        const existingMessages = old.data.data?.messages || []
        const updatedMessages = existingMessages.map(msg => 
          msg.id === editingMessage.id 
            ? { ...msg, messageText: editText.trim(), isEdited: true }
            : msg
        )
        
        return {
          ...old,
          data: {
            ...old.data,
            data: {
              ...old.data.data,
              messages: updatedMessages
            }
          }
        }
      })

      // TODO: Call API to update message
      // await chatAPI.updateMessage(editingMessage.id, { messageText: editText.trim() })
      
      setEditingMessage(null)
      setEditText('')
      toast.success('Message updated successfully!')
    } catch (error) {
      toast.error('Failed to update message')
      // Revert optimistic update on error
      queryClient.invalidateQueries(['messages', selectedConversation.user.id])
    }
  }

  const handleCancelEdit = () => {
    setEditingMessage(null)
    setEditText('')
  }

  const handleDeleteMessage = async (message) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return
    }

    try {
      // Update message in cache optimistically
      queryClient.setQueryData(['messages', selectedConversation.user.id], (old) => {
        if (!old) return old
        
        const existingMessages = old.data.data?.messages || []
        const updatedMessages = existingMessages.map(msg => 
          msg.id === message.id 
            ? { ...msg, messageText: 'This message was deleted', isDeleted: true }
            : msg
        )
        
        return {
          ...old,
          data: {
            ...old.data,
            data: {
              ...old.data.data,
              messages: updatedMessages
            }
          }
        }
      })

      // TODO: Call API to delete message
      // await chatAPI.deleteMessage(message.id)
      
      toast.success('Message deleted successfully!')
    } catch (error) {
      toast.error('Failed to delete message')
      // Revert optimistic update on error
      queryClient.invalidateQueries(['messages', selectedConversation.user.id])
    }
  }

  const toggleMessageMenu = (messageId) => {
    setShowMessageMenu(showMessageMenu === messageId ? null : messageId)
  }

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return 'Now'
    
    try {
      const date = parseISO(timestamp)
      if (isNaN(date.getTime())) return 'Now'
      
      if (isToday(date)) {
        return format(date, 'HH:mm')
      } else if (isYesterday(date)) {
        return 'Yesterday'
      } else {
        return format(date, 'MMM dd')
      }
    } catch (error) {
      console.warn('Invalid timestamp:', timestamp, error)
      return 'Now'
    }
  }

  const conversations = conversationsData?.data?.data?.conversations || []
  const messages = messagesData?.data?.data?.messages || []

  const filteredConversations = conversations.filter(conv =>
    conv.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="h-full flex">
      {/* Conversations List */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-500 focus:border-whatsapp-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {conversationsLoading ? (
            <div className="p-4 text-center text-gray-500">Loading conversations...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No conversations yet</p>
              <p className="text-sm">Start a new conversation from contacts</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.user.id}
                  onClick={() => navigate(`/chat/${conversation.user.id}`)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedConversation?.user?.id === conversation.user.id ? 'bg-whatsapp-50 border-r-2 border-whatsapp-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {conversation.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {isUserOnline(conversation.user.id) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conversation.user.id === user.id 
                            ? `${conversation.user.name} (You)` 
                            : conversation.user.name
                          }
                        </p>
                        <p className="text-xs text-gray-500">
                          {conversation.lastMessage && formatMessageTime(conversation.lastMessage.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage?.messageText || 'No messages yet'}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 text-xs font-bold text-white bg-green-500 rounded-full">
                            {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {selectedConversation.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {isUserOnline(selectedConversation.user.id) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {selectedConversation.user.id === user.id 
                      ? `${selectedConversation.user.name} (You)` 
                      : selectedConversation.user.name
                    }
                  </h3>
                  <p className="text-xs text-gray-500">
                    {isUserOnline(selectedConversation.user.id) ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <Video className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messagesLoading ? (
              <div className="text-center text-gray-500">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            ) : (
                             messages.map((message) => {
                 const isOwn = message.senderId === user.id
                 const canEdit = isOwn && !message.isDeleted && !message.isOptimistic
                 const canDelete = isOwn && !message.isOptimistic
                 
                 return (
                   <div
                     key={message.id}
                     className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group relative`}
                   >
                     <div
                       className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative ${
                         isOwn
                           ? 'bg-whatsapp-500 text-white'
                           : 'bg-white text-gray-900 border border-gray-200'
                       }`}
                     >
                       {/* Message Actions Menu */}
                       {canEdit || canDelete ? (
                         <button
                           onClick={() => toggleMessageMenu(message.id)}
                           className={`absolute top-1 right-1 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                             isOwn ? 'text-whatsapp-100 hover:bg-whatsapp-400' : 'text-gray-400 hover:bg-gray-100'
                           }`}
                         >
                           <MoreVertical className="w-3 h-3" />
                         </button>
                       ) : null}

                       {/* Message Actions Dropdown */}
                       {showMessageMenu === message.id && (
                         <div className={`absolute top-8 right-0 z-10 bg-white rounded-lg shadow-lg border border-gray-200 min-w-32 message-actions ${
                           isOwn ? 'right-0' : 'left-0'
                         }`}>
                           {canEdit && (
                             <button
                               onClick={() => handleEditMessage(message)}
                               className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                             >
                               <Edit3 className="w-4 h-4 mr-2" />
                               Edit
                             </button>
                           )}
                           {canDelete && (
                             <button
                               onClick={() => handleDeleteMessage(message)}
                               className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                             >
                               <Trash2 className="w-4 h-4 mr-2" />
                               Delete
                             </button>
                           )}
                         </div>
                       )}

                       {/* Message Content */}
                       {editingMessage?.id === message.id ? (
                         <div className="space-y-2">
                           <textarea
                             value={editText}
                             onChange={(e) => setEditText(e.target.value)}
                             onKeyDown={(e) => {
                               if (e.key === 'Enter' && !e.shiftKey) {
                                 e.preventDefault()
                                 handleSaveEdit()
                               } else if (e.key === 'Escape') {
                                 handleCancelEdit()
                               }
                             }}
                             className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-whatsapp-500 resize-none"
                             rows="2"
                             autoFocus
                           />
                           <div className="flex items-center space-x-2">
                             <button
                               onClick={handleSaveEdit}
                               className="p-1 text-whatsapp-600 hover:text-whatsapp-700 rounded"
                             >
                               <Check className="w-4 h-4" />
                             </button>
                             <button
                               onClick={handleCancelEdit}
                               className="p-1 text-gray-400 hover:text-gray-600 rounded"
                             >
                               <X className="w-4 h-4" />
                             </button>
                           </div>
                         </div>
                       ) : (
                         <>
                           <p className={`text-sm ${message.isDeleted ? 'italic text-gray-500' : ''}`}>
                             {message.isDeleted ? (
                               <span className="flex items-center">
                                 <span className="text-gray-400 mr-2">🗑️</span>
                                 {message.messageText}
                               </span>
                             ) : (
                               <>
                                 {message.messageText}
                                 {message.isEdited && (
                                   <span className="text-xs ml-2 opacity-70">(edited)</span>
                                 )}
                               </>
                             )}
                           </p>
                           <p
                             className={`text-xs mt-1 ${
                               isOwn ? 'text-whatsapp-100' : 'text-gray-500'
                             }`}
                           >
                             {formatMessageTime(message.createdAt)}
                           </p>
                         </>
                       )}
                     </div>
                   </div>
                 )
               })
            )}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-200"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-400"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Paperclip className="w-5 h-5" />
              </button>
              <div className="flex-1 relative">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-500 focus:border-whatsapp-500 resize-none"
                  rows="1"
                />
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Smile className="w-5 h-5" />
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
                className="p-2 bg-whatsapp-500 text-white rounded-lg hover:bg-whatsapp-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900">Select a conversation</h3>
            <p className="text-sm text-gray-500">Choose a conversation from the list to start messaging</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Chat
