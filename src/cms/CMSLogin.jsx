import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

const CMSLogin = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    // Simulate async login
    setTimeout(() => {
      if (login(username, password)) {
        navigate('/cms')
      } else {
        setError('Invalid credentials. Please try again.')
        setLoading(false)
      }
    }, 500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pencilz CMS</h1>
          <p className="text-sm text-gray-600">Sign in to manage your content</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
              autoFocus
            />
            
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              error={error}
            />
            
            <Button 
              type="submit" 
              variant="solid" 
              size="md"
              className="w-full"
              loading={loading}
            >
              Sign In
            </Button>
          </form>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-center text-gray-500">
              Default: <span className="font-medium">admin</span> / <span className="font-medium">admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CMSLogin
