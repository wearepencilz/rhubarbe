import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/testUtils'
import CMSDashboard from '../CMSDashboard'
import { MemoryRouter } from 'react-router-dom'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams(), vi.fn()]
  }
})

describe('CMSDashboard - Comprehensive Tests', () => {
  const mockProjects = [
    { id: '1', title: 'Project 1', description: 'Desc 1', category: 'Design', link: 'https://p1.com', image: '/img1.jpg' },
    { id: '2', title: 'Project 2', description: 'Desc 2', category: 'Dev', link: '', image: '' }
  ]

  const mockNews = [
    { id: '1', title: 'News 1', excerpt: 'Excerpt 1', category: 'Insights', date: '2024-01-15', image: '/news1.jpg' },
    { id: '2', title: 'News 2', excerpt: 'Excerpt 2', category: 'Updates', date: '2024-02-20', image: '' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    global.alert = vi.fn()
    global.confirm = vi.fn(() => true)
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/projects')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockProjects) })
      }
      if (url.includes('/api/news')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockNews) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Navigation', () => {
    it('renders all navigation tabs', async () => {
      renderWithProviders(
        <MemoryRouter>
          <CMSDashboard />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('📁')).toBeInTheDocument()
        expect(screen.getByText('Projects')).toBeInTheDocument()
        expect(screen.getByText('News')).toBeInTheDocument()
        expect(screen.getByText('Pages')).toBeInTheDocument()
        expect(screen.getByText('Home Page')).toBeInTheDocument()
        expect(screen.getByText('Tags & Taxonomy')).toBeInTheDocument()
        expect(screen.getByText('Settings')).toBeInTheDocument()
      })
    })

    it('switches sections when clicking navigation tabs', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MemoryRouter>
          <CMSDashboard />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Projects')).toBeInTheDocument()
      })

      const newsTab = screen.getByRole('button', { name: /📰 news/i })
      await user.click(newsTab)

      await waitFor(() => {
        expect(screen.getByText('News & Insights')).toBeInTheDocument()
      })
    })

    it('highlights active section', async () => {
      renderWithProviders(
        <MemoryRouter>
          <CMSDashboard />
        </MemoryRouter>
      )

      await waitFor(() => {
        const projectsTab = screen.getByRole('button', { name: /📁 projects/i })
        expect(projectsTab).toHaveClass('bg-gray-100')
      })
    })
  })

  describe('Projects Section', () => {
    it('displays projects list', async () => {
      renderWithProviders(
        <MemoryRouter>
          <CMSDashboard />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Project 1')).toBeInTheDocument()
        expect(screen.getByText('Project 2')).toBeInTheDocument()
      })
    })

    it('shows empty state when no projects', async () => {
      global.fetch = vi.fn((url) => {
        if (url.includes('/api/projects')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
        }
        if (url.includes('/api/news')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      renderWithProviders(
        <MemoryRouter>
          <CMSDashboard />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText(/no projects yet/i)).toBeInTheDocument()
      })
    })

    it('navigates to new project page when clicking New Project', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MemoryRouter>
          <CMSDashboard />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Project 1')).toBeInTheDocument()
      })

      const newButton = screen.getByRole('button', { name: /new project/i })
      await user.click(newButton)

      expect(mockNavigate).toHaveBeenCalledWith('/cms/projects/new')
    })

    it('navigates to edit page when clicking project row', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MemoryRouter>
          <CMSDashboard />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Project 1')).toBeInTheDocument()
      })

      const projectRow = screen.getByText('Project 1').closest('tr')
      await user.click(projectRow)

      expect(mockNavigate).toHaveBeenCalledWith('/cms/projects/1')
    })

    it('displays project images', async () => {
      renderWithProviders(
        <MemoryRouter>
          <CMSDashboard />
        </MemoryRouter>
      )

      await waitFor(() => {
        const images = screen.getAllByRole('img')
        expect(images.length).toBeGreaterThan(0)
      })
    })

    it('displays project categories', async () => {
      renderWithProviders(
        <MemoryRouter>
          <CMSDashboard />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Design')).toBeInTheDocument()
        expect(screen.getByText('Dev')).toBeInTheDocument()
      })
    })

    it('shows project links', async () => {
      renderWithProviders(
        <MemoryRouter>
          <CMSDashboard />
        </MemoryRouter>
      )

      await waitFor(() => {
        const links = screen.getAllByText('View')
        expect(links.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Delete Operations', () => {
    it('opens delete dialog when clicking delete in dropdown', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MemoryRouter>
          <CMSDashboard />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Project 1')).toBeInTheDocument()
      })

      // Find and click the dropdown menu button
      const dropdownButtons = screen.getAllByRole('button').filter(btn => 
        btn.querySelector('svg') && btn.className.includes('hover:bg-gray-100')
      )
      await user.click(dropdownButtons[0])

      // Click delete option
      const deleteButton = await screen.findByText('Delete')
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText(/delete item/i)).toBeInTheDocument()
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
      })
    })

    it('deletes project when confirmed', async () => {
      const user = userEvent.setup()
      
      global.fetch = vi.fn((url, options) => {
        if (url.includes('/api/projects') && !options) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockProjects) })
        }
        if (url.includes('/api/projects/1') && options?.method === 'DELETE') {
          return Promise.resolve({ ok: true })
        }
        if (url.includes('/api/news')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockNews) })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      renderWithProviders(
        <MemoryRouter>
          <CMSDashboard />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Project 1')).toBeInTheDocument()
      })

      const dropdownButtons = screen.getAllByRole('button').filter(btn => 
        btn.querySelector('svg') && btn.className.includes('hover:bg-gray-100')
      )
      await user.click(dropdownButtons[0])

      const deleteButton = await screen.findByText('Delete')
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /^delete$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/projects/1'),
          expect.objectContaining({ method: 'DELETE' })
        )
      })
    })

    it('cancels deletion when clicking cancel', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MemoryRouter>
          <CMSDashboard />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Project 1')).toBeInTheDocument()
      })

      const dropdownButtons = screen.getAllByRole('button').filter(btn => 
        btn.querySelector('svg') && btn.className.includes('hover:bg-gray-100')
      )
      await user.click(dropdownButtons[0])

      const deleteButton = await screen.findByText('Delete')
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByText(/delete item/i)).not.toBeInTheDocument()
      })
    })

    it('deletes news items', async () => {
      const user = userEvent.setup()
      
      global.fetch = vi.fn((url, options) => {
        if (url.includes('/api/projects')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockProjects) })
        }
        if (url.includes('/api/news') && !options) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockNews) })
        }
        if (url.includes('/api/news/1') && options?.method === 'DELETE') {
          return Promise.resolve({ ok: true })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      renderWithProviders(
        <MemoryRouter>
          <CMSDashboard />
        </MemoryRouter>
      )

      // Switch to news section
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /📰 news/i })).toBeInTheDocument()
      })

      const newsTab = screen.getByRole('button', { name: /📰 news/i })
      await user.click(newsTab)

      await waitFor(() => {
        expect(screen.getByText('News 1')).toBeInTheDocument()
      })

      const dropdownButtons = screen.getAllByRole('button').filter(btn => 
        btn.querySelector('svg') && btn.className.includes('hover:bg-gray-100')
      )
      await user.click(dropdownButtons[0])

      const deleteButton = await screen.findByText('Delete')
      await user.click(deleteButton)

      const confirmButton = await screen.findByRole('button', { name: /^delete$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/news/1'),
          expect.objectContaining({ method: 'DELETE' })
        )
      })
    })
  })

  describe('News Section', () => {
    it('displays news list when switching to news tab', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MemoryRouter>
          <CMSDashboard />
        </MemoryRouter>
      )

      const newsTab = screen.getByRole('button', { name: /📰 news/i })
      await user.click(newsTab)

      await waitFor(() => {
        expect(screen.getByText('News 1')).toBeInTheDocument()
        expect(screen.getByText('News 2')).toBeInTheDocument()
      })
    })

    it('formats dates correctly', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MemoryRouter>
          <CMSDashboard />
        </MemoryRouter>
      )

      const newsTab = screen.getByRole('button', { name: /📰 news/i })
      await user.click(newsTab)

      await waitFor(() => {
        expect(screen.getByText(/jan 15, 2024/i)).toBeInTheDocument()
        expect(screen.getByText(/feb 20, 2024/i)).toBeInTheDocument()
      })
    })

    it('navigates to new article page', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MemoryRouter>
          <CMSDashboard />
        </MemoryRouter>
      )

      const newsTab = screen.getByRole('button', { name: /📰 news/i })
      await user.click(newsTab)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new article/i })).toBeInTheDocument()
      })

      const newButton = screen.getByRole('button', { name: /new article/i })
      await user.click(newButton)

      expect(mockNavigate).toHaveBeenCalledWith('/cms/news/new')
    })
  })

  describe('Pages Section', () => {
    it('displays static pages list', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MemoryRouter>
          <CMSDashboard />
        </MemoryRouter>
      )

      const pagesTab = screen.getByRole('button', { name: /📄 pages/i })
      await user.click(pagesTab)

      await waitFor(() => {
        expect(screen.getByText('About')).toBeInTheDocument()
        expect(screen.getByText('Services')).toBeInTheDocument()
        expect(screen.getByText('FAQ')).toBeInTheDocument()
        expect(screen.getByText('Terms')).toBeInTheDocument()
        expect(screen.getByText('Privacy')).toBeInTheDocument()
      })
    })

    it('navigates to page editor', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MemoryRouter>
          <CMSDashboard />
        </MemoryRouter>
      )

      const pagesTab = screen.getByRole('button', { name: /📄 pages/i })
      await user.click(pagesTab)

      await waitFor(() => {
        expect(screen.getByText('About')).toBeInTheDocument()
      })

      const aboutRow = screen.getByText('About').closest('tr')
      await user.click(aboutRow)

      expect(mockNavigate).toHaveBeenCalledWith('/cms/pages/about')
    })
  })

  describe('Unsaved Changes', () => {
    it('shows save/cancel buttons when form has changes', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MemoryRouter>
          <CMSDashboard />
        </MemoryRouter>
      )

      const settingsTab = screen.getByRole('button', { name: /⚙️ settings/i })
      await user.click(settingsTab)

      // Note: This would require the form to trigger onFormChange
      // Full implementation would need the actual form component
    })
  })

  describe('Logout', () => {
    it('logs out when clicking sign out button', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <MemoryRouter>
          <CMSDashboard />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
      })

      const signOutButton = screen.getByRole('button', { name: /sign out/i })
      await user.click(signOutButton)

      expect(mockNavigate).toHaveBeenCalledWith('/cms/login')
    })
  })
})
