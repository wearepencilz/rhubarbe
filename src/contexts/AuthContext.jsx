import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Initialize from localStorage immediately
    return localStorage.getItem('cms_auth') === 'true'
  })
  const [isLoading, setIsLoading] = useState(false)

  const login = (username, password) => {
    // Simple auth - replace with your actual credentials
    if (username === 'admin' && password === 'admin123') {
      setIsAuthenticated(true)
      localStorage.setItem('cms_auth', 'true')
      return true
    }
    return false
  }

  const logout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('cms_auth')
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
