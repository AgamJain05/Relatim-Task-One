import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, token, isTokenExpired } = useAuthStore()
  const location = useLocation()

  // Check if user is authenticated and token is valid
  if (!isAuthenticated || !token || isTokenExpired()) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute

