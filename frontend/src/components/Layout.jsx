import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { 
  MessageCircle, 
  Users, 
  LayoutDashboard, 
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const sidebarItems = [
    { 
      id: 'chat', 
      label: 'Chat', 
      icon: MessageCircle, 
      path: '/chat' 
    },
    { 
      id: 'contacts', 
      label: 'Contacts', 
      icon: Users, 
      path: '/contacts' 
    },
  ]

  const topBarItems = [
    { 
      id: 'message', 
      label: 'Message', 
      path: '/chat' 
    },
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      path: '/dashboard' 
    },
  ]

  const handleNavigation = (path) => {
    navigate(path)
    setSidebarOpen(false)
  }

  const handleLogout = async () => {
    await logout()
  }

  const isActivePath = (path) => location.pathname === path

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-whatsapp-500 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <span className="ml-2 text-lg font-semibold text-gray-900">
              WhatsApp Clone
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-8 px-4">
          <div className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive = isActivePath(item.path)
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`
                    w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-whatsapp-50 text-whatsapp-700 border-r-2 border-whatsapp-500' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-whatsapp-600' : 'text-gray-400'}`} />
                  {item.label}
                </button>
              )
            })}
          </div>
        </nav>

        {/* User info and logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <nav className="hidden lg:flex space-x-8 ml-4">
                {topBarItems.map((item) => {
                  const isActive = isActivePath(item.path)
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.path)}
                      className={`
                        px-3 py-2 text-sm font-medium rounded-md transition-colors
                        ${isActive 
                          ? 'bg-primary-50 text-primary-700' 
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </nav>
            </div>

            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center">
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {user?.name}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-hidden bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout

