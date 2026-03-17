import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'

// Import all major components to ensure they don't have syntax errors
import App from '../App'
import Home from '../pages/Home'
import News from '../pages/News'
import About from '../pages/About'
import Services from '../pages/Services'
import CMSLogin from '../cms/CMSLogin'
import CMSDashboard from '../cms/CMSDashboard'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'
import Button from '../components/Button'
import ProjectCard from '../components/ProjectCard'

// Utility imports
import { getImageUrl } from '../utils/imageUrl'

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('Smoke Tests - Build Validation', () => {
  describe('Component Imports', () => {
    it('should import all page components without errors', () => {
      expect(Home).toBeDefined()
      expect(News).toBeDefined()
      expect(About).toBeDefined()
      expect(Services).toBeDefined()
    })

    it('should import all CMS components without errors', () => {
      expect(CMSLogin).toBeDefined()
      expect(CMSDashboard).toBeDefined()
    })

    it('should import all shared components without errors', () => {
      expect(Navigation).toBeDefined()
      expect(Footer).toBeDefined()
      expect(Button).toBeDefined()
      expect(ProjectCard).toBeDefined()
    })
  })

  describe('Utility Functions', () => {
    it('should handle image URLs correctly in development', () => {
      const result = getImageUrl('/uploads/test.jpg')
      expect(result).toContain('/uploads/test.jpg')
    })

    it('should handle full URLs without modification', () => {
      const fullUrl = 'https://example.com/image.jpg'
      const result = getImageUrl(fullUrl)
      expect(result).toBe(fullUrl)
    })

    it('should handle empty values', () => {
      expect(getImageUrl('')).toBe('')
      expect(getImageUrl(null)).toBe('')
      expect(getImageUrl(undefined)).toBe('')
    })
  })

  describe('Component Rendering', () => {
    it('should render App component without crashing', () => {
      // App already includes BrowserRouter, so render it directly
      expect(() => render(<App />)).not.toThrow()
    })

    it('should render Navigation component', () => {
      expect(() => renderWithRouter(<Navigation />)).not.toThrow()
    })

    it('should render Footer component', () => {
      expect(() => renderWithRouter(<Footer />)).not.toThrow()
    })

    it('should render Button component', () => {
      expect(() => render(<Button>Test Button</Button>)).not.toThrow()
    })

    it('should render CMSLogin component', () => {
      expect(() => renderWithRouter(<CMSLogin />)).not.toThrow()
    })
  })

  describe('Critical Paths', () => {
    it('should have valid API_URL configuration', async () => {
      const { API_URL } = await import('../config')
      expect(API_URL).toBeDefined()
      // In test environment, should be either empty or a valid URL
      if (API_URL) {
        expect(API_URL).toMatch(/^https?:\/\//)
      }
    })

    it('should have AuthContext available', () => {
      expect(AuthProvider).toBeDefined()
    })
  })
})
