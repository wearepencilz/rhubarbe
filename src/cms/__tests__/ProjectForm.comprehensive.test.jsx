import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/testUtils'
import ProjectForm from '../ProjectForm'

describe('ProjectForm - Comprehensive Tests', () => {
  const mockOnSave = vi.fn()
  const mockOnCancel = vi.fn()
  const mockOnFormChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    global.alert = vi.fn()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Input Fields', () => {
    it('renders all required input fields', () => {
      renderWithProviders(
        <ProjectForm 
          project={{}} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      expect(screen.getByLabelText(/^project title$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/project link/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^description$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/services provided/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/featured image/i)).toBeInTheDocument()
    })

    it('renders optional SEO fields in collapsible section', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <ProjectForm 
          project={{}} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      // SEO section should be collapsed by default
      expect(screen.queryByLabelText(/meta title/i)).not.toBeInTheDocument()

      // Expand SEO section
      const seoButton = screen.getByText(/seo & metadata/i)
      await user.click(seoButton)

      // SEO fields should now be visible
      await waitFor(() => {
        expect(screen.getByLabelText(/meta title/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/meta description/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/keywords/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/social share image/i)).toBeInTheDocument()
      })
    })

    it('accepts text input in all text fields', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <ProjectForm 
          project={{}} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      const titleInput = screen.getByLabelText(/^project title$/i)
      const linkInput = screen.getByLabelText(/project link/i)
      const descriptionInput = screen.getByLabelText(/^description$/i)

      await user.type(titleInput, 'Test Project')
      await user.type(linkInput, 'https://example.com')
      await user.type(descriptionInput, 'Test description')

      expect(titleInput).toHaveValue('Test Project')
      expect(linkInput).toHaveValue('https://example.com')
      expect(descriptionInput).toHaveValue('Test description')
    })

    it('validates required fields on submit', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <ProjectForm 
          project={{}} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      const saveButton = screen.getByRole('button', { name: /create project/i })
      await user.click(saveButton)

      // Form should not submit without required fields
      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it('loads existing project data into form fields', () => {
      const existingProject = {
        id: '1',
        title: 'Existing Project',
        description: 'Existing Description',
        link: 'https://existing.com',
        category: 'Design',
        services: ['Development', 'Branding'],
        image: '/test.jpg',
        metaTitle: 'Meta Title',
        metaDescription: 'Meta Description'
      }

      renderWithProviders(
        <ProjectForm 
          project={existingProject} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      expect(screen.getByDisplayValue('Existing Project')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Existing Description')).toBeInTheDocument()
      expect(screen.getByDisplayValue('https://existing.com')).toBeInTheDocument()
    })
  })

  describe('Tag Input', () => {
    beforeEach(() => {
      global.fetch = vi.fn((url) => {
        if (url.includes('/api/settings')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              taxonomy: [
                { id: 'tag1', name: 'Design', link: '', type: 'general' },
                { id: 'tag2', name: 'Development', link: '', type: 'general' },
                { id: 'tag3', name: 'Branding', link: '', type: 'general' }
              ]
            })
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })
    })

    it('displays available tags when clicking tag input', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <ProjectForm 
          project={{}} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/settings'))
      })

      const servicesInput = screen.getByPlaceholderText(/select or create services/i)
      await user.click(servicesInput)

      await waitFor(() => {
        expect(screen.getByText('Design')).toBeInTheDocument()
        expect(screen.getByText('Development')).toBeInTheDocument()
        expect(screen.getByText('Branding')).toBeInTheDocument()
      })
    })

    it('adds tag when clicking on suggestion', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <ProjectForm 
          project={{}} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const servicesInput = screen.getByPlaceholderText(/select or create services/i)
      await user.click(servicesInput)

      const designTag = await screen.findByText('Design')
      await user.click(designTag)

      // Tag should appear as a chip
      expect(screen.getByText('Design')).toBeInTheDocument()
    })

    it('removes tag when clicking X button', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <ProjectForm 
          project={{ services: ['Design'] }} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Design')).toBeInTheDocument()
      })

      const removeButton = screen.getByRole('button', { name: '×' })
      await user.click(removeButton)

      await waitFor(() => {
        expect(screen.queryByText('Design')).not.toBeInTheDocument()
      })
    })

    it('filters tags based on input text', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <ProjectForm 
          project={{}} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const servicesInput = screen.getByPlaceholderText(/select or create services/i)
      await user.type(servicesInput, 'dev')

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument()
        expect(screen.queryByText('Branding')).not.toBeInTheDocument()
      })
    })

    it('creates new tag when typing and pressing Enter', async () => {
      const user = userEvent.setup()
      
      global.fetch = vi.fn((url, options) => {
        if (url.includes('/api/settings')) {
          if (options?.method === 'PUT') {
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
          }
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ taxonomy: [] })
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      renderWithProviders(
        <ProjectForm 
          project={{}} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      const servicesInput = screen.getByPlaceholderText(/select or create services/i)
      await user.type(servicesInput, 'New Service{Enter}')

      await waitFor(() => {
        expect(screen.getByText('New Service')).toBeInTheDocument()
      })
    })

    it('limits category to single selection', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <ProjectForm 
          project={{}} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const categoryInput = screen.getByPlaceholderText(/select or create category/i)
      await user.click(categoryInput)

      const designTag = await screen.findByText('Design')
      await user.click(designTag)

      // Try to add another category
      await user.click(categoryInput)
      const devTag = await screen.findByText('Development')
      await user.click(devTag)

      // Should only have one category
      const categoryContainer = categoryInput.closest('div')
      const tags = within(categoryContainer).queryAllByText(/design|development/i)
      expect(tags.length).toBe(1)
    })
  })

  describe('File Upload', () => {
    beforeEach(() => {
      global.fetch = vi.fn((url, options) => {
        if (url.includes('/api/upload')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ url: '/uploads/test-image.jpg' })
          })
        }
        if (url.includes('/api/settings')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ taxonomy: [] })
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })
    })

    it('uploads file when selected', async () => {
      const user = userEvent.setup()
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      renderWithProviders(
        <ProjectForm 
          project={{}} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      const fileInput = screen.getByLabelText(/featured image/i).closest('div').querySelector('input[type="file"]')
      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/upload'),
          expect.objectContaining({ method: 'POST' })
        )
      })
    })

    it('displays preview after successful upload', async () => {
      const user = userEvent.setup()
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      renderWithProviders(
        <ProjectForm 
          project={{}} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      const fileInput = screen.getByLabelText(/featured image/i).closest('div').querySelector('input[type="file"]')
      await user.upload(fileInput, file)

      await waitFor(() => {
        const preview = screen.getByAltText(/preview/i)
        expect(preview).toBeInTheDocument()
      })
    })

    it('shows error message on upload failure', async () => {
      const user = userEvent.setup()
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      global.fetch = vi.fn((url) => {
        if (url.includes('/api/upload')) {
          return Promise.resolve({
            ok: false,
            text: () => Promise.resolve('Upload failed')
          })
        }
        if (url.includes('/api/settings')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ taxonomy: [] })
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      renderWithProviders(
        <ProjectForm 
          project={{}} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      const fileInput = screen.getByLabelText(/featured image/i).closest('div').querySelector('input[type="file"]')
      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Error uploading image'))
      })
    })

    it('allows deleting uploaded image', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <ProjectForm 
          project={{ image: '/uploads/existing.jpg' }} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      await waitFor(() => {
        expect(screen.getByAltText(/preview/i)).toBeInTheDocument()
      })

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.queryByAltText(/preview/i)).not.toBeInTheDocument()
      })
    })

    it('allows changing uploaded image', async () => {
      const user = userEvent.setup()
      const newFile = new File(['new'], 'new.jpg', { type: 'image/jpeg' })
      
      renderWithProviders(
        <ProjectForm 
          project={{ image: '/uploads/existing.jpg' }} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      await waitFor(() => {
        expect(screen.getByAltText(/preview/i)).toBeInTheDocument()
      })

      const changeButton = screen.getByRole('button', { name: /change image/i })
      await user.click(changeButton)

      const fileInput = screen.getByLabelText(/featured image/i).closest('div').querySelector('input[type="file"]')
      await user.upload(fileInput, newFile)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/upload'),
          expect.any(Object)
        )
      })
    })
  })

  describe('Form Actions', () => {
    beforeEach(() => {
      global.fetch = vi.fn((url) => {
        if (url.includes('/api/settings')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ taxonomy: [] })
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })
    })

    it('calls onSave with form data when submitting', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <ProjectForm 
          project={{}} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      await user.type(screen.getByLabelText(/^project title$/i), 'New Project')
      await user.type(screen.getByLabelText(/^description$/i), 'New Description')

      const saveButton = screen.getByRole('button', { name: /create project/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'New Project',
            description: 'New Description'
          })
        )
      })
    })

    it('calls onCancel when clicking cancel button', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <ProjectForm 
          project={{}} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('disables buttons during submission', async () => {
      const user = userEvent.setup()
      let resolveSubmit
      const slowOnSave = vi.fn(() => new Promise(resolve => { resolveSubmit = resolve }))
      
      renderWithProviders(
        <ProjectForm 
          project={{}} 
          onSave={slowOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      await user.type(screen.getByLabelText(/^project title$/i), 'Test')
      await user.type(screen.getByLabelText(/^description$/i), 'Test')

      const saveButton = screen.getByRole('button', { name: /create project/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(saveButton).toBeDisabled()
        expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled()
      })

      resolveSubmit()
    })

    it('notifies parent of form changes', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <ProjectForm 
          project={{}} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel}
          onFormChange={mockOnFormChange}
        />
      )

      await user.type(screen.getByLabelText(/^project title$/i), 'Test')

      await waitFor(() => {
        expect(mockOnFormChange).toHaveBeenCalled()
      })
    })

    it('shows correct button text for new vs edit mode', () => {
      const { rerender } = renderWithProviders(
        <ProjectForm 
          project={{}} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      expect(screen.getByRole('button', { name: /create project/i })).toBeInTheDocument()

      rerender(
        <ProjectForm 
          project={{ id: '1', title: 'Existing' }} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
    })
  })
})
