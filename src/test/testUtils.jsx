import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'

export const renderWithProviders = (ui, options = {}) => {
  const Wrapper = ({ children }) => (
    <BrowserRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </BrowserRouter>
  )

  return render(ui, { wrapper: Wrapper, ...options })
}

export const mockFetch = (data, ok = true) => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data))
    })
  )
}

export const mockFetchError = (message = 'Network error') => {
  global.fetch = vi.fn(() => Promise.reject(new Error(message)))
}
