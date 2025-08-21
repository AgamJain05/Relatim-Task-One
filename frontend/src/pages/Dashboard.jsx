import { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { 
  MessageCircle, 
  Users, 
  BarChart3, 
  TrendingUp, 
  Plus,
  Clock,
  UserPlus,
  Settings,
  Activity
} from 'lucide-react'
import { chatAPI, contactAPI } from '../services/api'
import { format, isToday, isYesterday, parseISO } from 'date-fns'

const Dashboard = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Fetch conversations with optimized settings
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery(
    'conversations',
    () => chatAPI.getConversations(),
    {
      refetchInterval: 60000, // Reduced to 1 minute
      staleTime: 30000, // Data considered fresh for 30 seconds
      cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
      retry: 1, // Only retry once
      retryDelay: 1000, // Wait 1 second before retry
    }
  )

  // Fetch contacts with optimized settings
  const { data: contactsData, isLoading: contactsLoading } = useQuery(
    'contacts',
    () => contactAPI.getContacts(),
    {
      refetchInterval: 120000, // Reduced to 2 minutes
      staleTime: 60000, // Data considered fresh for 1 minute
      cacheTime: 10 * 60 * 1000, // Cache for 10 minutes
      retry: 1, // Only retry once
      retryDelay: 1000, // Wait 1 second before retry
    }
  )

  // Calculate real-time stats
  const calculateStats = () => {
    const conversations = conversationsData?.data?.data?.conversations || []
    const contacts = contactsData?.data?.data?.contacts || []
    
    // Count total messages (approximate based on conversations)
    const totalMessages = conversations.reduce((sum, conv) => {
      return sum + (conv.lastMessage ? 1 : 0)
    }, 0)

    // Count active chats (conversations with recent activity)
    const activeChats = conversations.filter(conv => {
      if (!conv.lastMessage) return false
      const lastMessageTime = new Date(conv.lastMessage.createdAt)
      const hoursSinceLastMessage = (currentTime - lastMessageTime) / (1000 * 60 * 60)
      return hoursSinceLastMessage < 24 // Active if message within 24 hours
    }).length

    // Count total contacts
    const totalContacts = contacts.length

    // Calculate response rate (messages sent vs received)
    const messagesSent = conversations.filter(conv => conv.lastMessage?.senderId === user?.id).length
    const responseRate = totalMessages > 0 ? Math.round((messagesSent / totalMessages) * 100) : 0

    return {
      totalMessages,
      activeChats,
      totalContacts,
      responseRate
    }
  }

  // Get recent conversations for activity feed
  const getRecentActivity = () => {
    const conversations = conversationsData?.data?.data?.conversations || []
    const contacts = contactsData?.data?.data?.contacts || []
    
    const activities = []

    // Add recent conversations
    conversations.slice(0, 5).forEach(conv => {
      if (conv.lastMessage) {
        const messageTime = new Date(conv.lastMessage.createdAt)
        const timeAgo = getTimeAgo(messageTime)
        
        activities.push({
          id: `conv-${conv.user.id}`,
          content: `Last message with ${conv.user.name}`,
          time: timeAgo,
          type: 'message',
          timestamp: messageTime,
          action: () => navigate(`/chat/${conv.user.id}`)
        })
      }
    })

    // Add recent contacts
    contacts.slice(0, 3).forEach(contact => {
      const contactTime = new Date(contact.createdAt)
      const timeAgo = getTimeAgo(contactTime)
      
      activities.push({
        id: `contact-${contact.id}`,
        content: `Added ${contact.contactName} to contacts`,
        time: timeAgo,
        type: 'contact',
        timestamp: contactTime,
        action: () => navigate(`/chat/${contact.contactUserId}`)
      })
    })

    // Sort by timestamp (most recent first)
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 6)
  }

  // Helper function to format time ago
  const getTimeAgo = (date) => {
    const now = currentTime
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`
    return format(date, 'MMM d')
  }

  // Get stats
  const stats = calculateStats()
  
  // Get recent activity
  const recentActivity = getRecentActivity()

  // Show skeleton loading for better UX
  const renderSkeleton = () => (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mb-2 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-md"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions Skeleton */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Recent Activity Skeleton */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  // Show loading state with skeleton
  if (conversationsLoading || contactsLoading) {
    return renderSkeleton()
  }

  const statsData = [
    {
      name: 'Total Messages',
      value: stats.totalMessages.toString(),
      change: conversationsData?.data?.data?.conversations?.length > 0 ? 'Active' : 'No messages yet',
      changeType: conversationsData?.data?.data?.conversations?.length > 0 ? 'increase' : 'neutral',
      icon: MessageCircle,
      color: 'whatsapp',
    },
    {
      name: 'Active Chats',
      value: stats.activeChats.toString(),
      change: stats.activeChats > 0 ? `+${stats.activeChats} active` : 'No active chats',
      changeType: stats.activeChats > 0 ? 'increase' : 'neutral',
      icon: Users,
      color: 'primary',
    },
    {
      name: 'Contacts',
      value: stats.totalContacts.toString(),
      change: stats.totalContacts > 0 ? `+${stats.totalContacts} total` : 'No contacts yet',
      changeType: stats.totalContacts > 0 ? 'increase' : 'neutral',
      icon: BarChart3,
      color: 'blue',
    },
    {
      name: 'Response Rate',
      value: `${stats.responseRate}%`,
      change: stats.responseRate > 0 ? 'Active' : 'No responses yet',
      changeType: stats.responseRate > 0 ? 'increase' : 'neutral',
      icon: TrendingUp,
      color: 'green',
    },
  ]

  const getColorClasses = (color) => {
    const colorMap = {
      whatsapp: 'bg-whatsapp-500',
      primary: 'bg-primary-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500'
    }
    return colorMap[color] || 'bg-gray-500'
  }

  const getChangeColor = (changeType) => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600'
      case 'decrease':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Here's what's happening with your conversations today.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Last updated: {format(currentTime, 'MMM d, yyyy h:mm a')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {statsData.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.name}
                className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <dt>
                  <div className={`absolute ${getColorClasses(item.color)} rounded-md p-3`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                    {item.name}
                  </p>
                </dt>
                <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                  <p className="text-2xl font-semibold text-gray-900">
                    {item.value}
                  </p>
                  <p className={`ml-2 flex items-baseline text-sm font-semibold ${getChangeColor(item.changeType)}`}>
                    {item.change}
                  </p>
                  <div className="absolute bottom-0 inset-x-0 bg-gray-50 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <span className="font-medium text-gray-600">
                        {item.changeType === 'neutral' ? 'No data' : 'Active'}
                      </span>
                    </div>
                  </div>
                </dd>
              </div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Quick Actions
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Get started with these common tasks.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <button 
                onClick={() => navigate('/chat')}
                className="bg-whatsapp-50 hover:bg-whatsapp-100 p-4 rounded-lg border border-whatsapp-200 transition-colors text-left group"
              >
                <div className="flex items-center">
                  <MessageCircle className="w-6 h-6 text-whatsapp-600 mr-3 group-hover:scale-110 transition-transform" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      Start New Chat
                    </h4>
                    <p className="text-xs text-gray-600">
                      Begin a conversation with a contact
                    </p>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => navigate('/contacts')}
                className="bg-primary-50 hover:bg-primary-100 p-4 rounded-lg border border-primary-200 transition-colors text-left group"
              >
                <div className="flex items-center">
                  <Users className="w-6 h-6 text-primary-600 mr-3 group-hover:scale-110 transition-transform" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      Manage Contacts
                    </h4>
                    <p className="text-xs text-gray-600">
                      Add and organize your contacts
                    </p>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => navigate('/chat')}
                className="bg-gray-50 hover:bg-gray-100 p-4 rounded-lg border border-gray-200 transition-colors text-left group"
              >
                <div className="flex items-center">
                  <Activity className="w-6 h-6 text-gray-600 mr-3 group-hover:scale-110 transition-transform" />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      View Conversations
                    </h4>
                    <p className="text-xs text-gray-600">
                      See all your active chats
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Activity
              </h3>
              <span className="text-sm text-gray-500">
                {recentActivity.length} activities
              </span>
            </div>
            
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No recent activity</p>
                <p className="text-sm text-gray-400">Start messaging to see activity here</p>
              </div>
            ) : (
              <div className="flow-root">
                <ul className="-mb-8">
                  {recentActivity.map((item, idx, array) => (
                    <li key={item.id}>
                      <div className="relative pb-8">
                        {idx !== array.length - 1 && (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span 
                              className={`h-8 w-8 rounded-full ${getColorClasses(item.type === 'message' ? 'whatsapp' : 'primary')} flex items-center justify-center ring-8 ring-white cursor-pointer hover:scale-110 transition-transform`}
                              onClick={item.action}
                            >
                              {item.type === 'message' ? (
                                <MessageCircle className="w-4 h-4 text-white" />
                              ) : (
                                <UserPlus className="w-4 h-4 text-white" />
                              )}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p 
                                className="text-sm text-gray-600 cursor-pointer hover:text-gray-900 transition-colors"
                                onClick={item.action}
                              >
                                {item.content}
                              </p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              {item.time}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Data Summary */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Conversations */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Conversations
              </h3>
              {conversationsData?.data?.data?.conversations?.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No conversations yet</p>
              ) : (
                <div className="space-y-3">
                  {conversationsData?.data?.data?.conversations?.slice(0, 5).map((conv) => (
                    <div 
                      key={conv.user.id}
                      onClick={() => navigate(`/chat/${conv.user.id}`)}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {conv.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conv.user.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {conv.lastMessage ? conv.lastMessage.messageText : 'No messages yet'}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 text-xs font-bold text-white bg-green-500 rounded-full">
                          {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Contacts */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Contacts
              </h3>
              {contactsData?.data?.data?.contacts?.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No contacts yet</p>
              ) : (
                <div className="space-y-3">
                  {contactsData?.data?.data?.contacts?.slice(0, 5).map((contact) => (
                    <div 
                      key={contact.id}
                      onClick={() => navigate(`/chat/${contact.contactUserId}`)}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="w-10 h-10 bg-whatsapp-500 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {contact.contactName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {contact.contactName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {contact.contactUser?.email || contact.contactNumber || 'No contact info'}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400">
                        {format(new Date(contact.createdAt), 'MMM d')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

