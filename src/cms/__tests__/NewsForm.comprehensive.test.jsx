import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/testUtils'
import NewsForm from '../NewsForm'

describe('NewsForm - Comprehensive Tests', () => {
  const mockOnSave = vi.fn()
  const mockOnCancel = vi.fn()

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
        <NewsForm 
          newsItem={{}} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      expect(screen.getByLabelText(/^title$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/excerpt/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^content$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/upload image/i)).toBeInTheDocument()
    })

    it('sets default date to today', () => {
      renderWithProviders(
        <NewsForm 
          newsItem={{}} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      const dateInput = screen.getByLabelText(/date/i)
      const today = new Date().toISOString().split('T')[0]
      expect(dateInput).toHaveValue(today)
    })

    it('accepts text input in all fields', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <NewsForm 
          newsItem={{}} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      await user.type(screen.getByLabelText(/^title$/i), 'Breaking News')
      await user.type(screen.getByLabelText(/category/i), 'Insights')
      await user.type(screen.getByLabelText(/excerpt/i), 'Short summary')
      await user.type(screen.getByLabelText(/^content$/i), 'Full article content')

      expect(screen.getByLabelText(/^title$/i)).toHaveValue('Breaking News')
      expect(screen.getByLabelText(/category/i)).toHaveValue('Insights')
      expect(screen.getByLabelText(/excerpt/i)).toHaveValue('Short summary')
      expect(screen.getByLabelText(/^content$/i)).toHaveValue('Full article content')
    })

    it('validates required fields on submit', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <NewsForm 
          newsItem={{}} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      const saveButton = screen.getByRole('button', { name: /create article/i })
      await user.click(saveButton)

      // Form should not submit without required fields
      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it('loads existing news data into form fields', () => {
      const existingNews = {
        id: '1',
        title: 'Existing Article',
        category: 'Updates',
        date: '2024-01-15',
        excerpt: 'Existing excerpt',
        content: 'Existing content',
        image: '/test.jpg'
      }

      renderWithProviders(
        <NewsForm 
          newsItem={existingNews} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      expect(screen.getByDisplayValue('Existing Article')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Updates')).toBeInTheDocument()
      expect(screen.getByDisplayValue('2024-01-15')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Existing excerpt')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Existing content')).toBeInTheDocument()
    })

    it('accepts date selection', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <NewsForm 
          newsItem={{}} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      const dateInput = screen.getByLabelText(/date/i)
      await user.clear(dateInput)
      await user.type(dateInput, '2024-12-25')

      expect(dateInput).toHaveValue('2024-12-25')
    })

    it('handles multiline content in textarea', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <NewsForm 
          newsItem={{}} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      const contentInput = screen.getByLabelText(/^content$/i)
      const multilineText = 'Line 1\nLine 2\nLine 3'
      await user.type(contentInput, multilineText)

      expect(contentInput).toHaveValue(multilineText)
    })
  })

  describe('File Upload', () => {
    beforeEach(() => {
      global.fetch = vi.fn((url) => {
        if (url.includes('/api/upload')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ url: '/uploads/news-image.jpg' })
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })
    })

    it('uploads image file', async () => {
      const user = userEvent.setup()
      const file = new File(['image'], 'news.jpg', { type: 'image/jpeg' })
      
      renderWithProviders(
        <NewsForm 
          newsItem={{}} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      const fileInput = screen.getByLabelText(/upload image/i).closest('div').querySelector('input[type="file"]')
      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/upload'),
          expect.objectContaining({ method: 'POST' })
        )
      })
    })

    it('displays image preview after upload', async () => {
      const user = userEvent.setup()
      const file = new File(['image'], 'news.jpg', { type: 'image/jpeg' })
      
      renderWithProviders(
        <NewsForm 
          newsItem={{}} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      const fileInput = screen.getByLabelText(/upload image/i).closest('div').querySelector('input[type="file"]')
      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(screen.getByAltText(/preview/i)).toBeInTheDocument()
      })
    })

    it('shows existing image preview', () => {
      renderWithProviders(
        <NewsForm 
          newsItem={{ image: '/uploads/existing-news.jpg' }} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      expect(screen.getByAltText(/preview/i)).toBeInTheDocument()
    })

    it('handles upload errors gracefully', async () => {
      const user = userEvent.setup()
      const file = new File(['image'], 'news.jpg', { type: 'image/jpeg' })
      
      global.fetch = vi.fn(() => Promise.resolve({
        ok: false,
        text: () => Promise.resolve('Server error')
      }))

      renderWithProviders(
        <NewsForm 
          newsItem={{}} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      const fileInput = screen.getByLabelText(/upload image/i).closest('div').querySelector('input[type="file"]')
      await user.upload(fileInput, file)

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Error uploading image'))
      })
    })

    it('allows deleting uploaded image', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <NewsForm 
          newsItem={{ image: '/uploads/news.jpg' }} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.queryByAltText(/preview/i)).not.toBeInTheDocument()
      })
    })

    it('requires image for new articles', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <NewsForm 
          newsItem={{}} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      await user.type(screen.getByLabelText(/^title$/i), 'Test')
      await user.type(screen.getByLabelText(/category/i), 'News')
      await user.type(screen.getByLabelText(/excerpt/i), 'Test')
      await user.type(screen.getByLabelText(/^content$/i), 'Test')

      const saveButton = screen.getByRole('button', { name: /create article/i })
      await user.click(saveButton)

      // Should show validation error for missing image
      await waitFor(() => {
        expect(screen.getByText(/featured image is required/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Actions', () => {
    it('submits form with all data', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <NewsForm 
          newsItem={{}} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      await user.type(screen.getByLabelText(/^title$/i), 'Test Article')
      await user.type(screen.getByLabelText(/category/i), 'Insights')
      await user.type(screen.getByLabelText(/excerpt/i), 'Test excerpt')
      await user.type(screen.getByLabelText(/^content$/i), 'Test content')

      const saveButton = screen.getByRole('button', { name: /create article/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Article',
            category: 'Insights',
            excerpt: 'Test excerpt',
            content: 'Test content'
          })
        )
      })
    })

    it('calls onCancel when cancel button clicked', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <NewsForm 
          newsItem={{}} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('shows correct button text for create vs edit', () => {
      const { rerender } = renderWithProviders(
        <NewsForm 
          newsItem={{}} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      expect(screen.getByRole('button', { name: /create article/i })).toBeInTheDocument()

      rerender(
        <NewsForm 
          newsItem={{ id: '1', title: 'Existing' }} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
    })

    it('preserves form data when switching between fields', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <NewsForm 
          newsItem={{}} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      await user.type(screen.getByLabelText(/^title$/i), 'Title')
      await user.type(screen.getByLabelText(/category/i), 'Category')
      await user.type(screen.getByLabelText(/excerpt/i), 'Excerpt')

      // Switch focus
      screen.getByLabelText(/^content$/i).focus()

      // Data should still be there
      expect(screen.getByLabelText(/^title$/i)).toHaveValue('Title')
      expect(screen.getByLabelText(/category/i)).toHaveValue('Category')
      expect(screen.getByLabelText(/excerpt/i)).toHaveValue('Excerpt')
    })

    it('includes date in submission', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <NewsForm 
          newsItem={{}} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      await user.type(screen.getByLabelText(/^title$/i), 'Test')
      await user.type(screen.getByLabelText(/category/i), 'News')
      await user.type(screen.getByLabelText(/excerpt/i), 'Test')
      await user.type(screen.getByLabelText(/^content$/i), 'Test')

      const dateInput = screen.getByLabelText(/date/i)
      await user.clear(dateInput)
      await user.type(dateInput, '2024-06-15')

      const saveButton = screen.getByRole('button', { name: /create article/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            date: '2024-06-15'
          })
        )
      })
    })
  })

  describe('Form Validation', () => {
    it('shows validation errors for empty required fields', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <NewsForm 
          newsItem={{}} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      const saveButton = screen.getByRole('button', { name: /create article/i })
      await user.click(saveButton)

      // HTML5 validation should prevent submission
      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it('allows submission with all required fields filled', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <NewsForm 
          newsItem={{ image: '/test.jpg' }} 
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      )

      await user.type(screen.getByLabelText(/^title$/i), 'Complete Article')
      await user.type(screen.getByLabelText(/category/i), 'News')
      await user.type(screen.getByLabelText(/excerpt/i), 'Summary')
      await user.type(screen.getByLabelText(/^content$/i), 'Full content')

      const saveButton = screen.getByRole('button', { name: /create article/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled()
      })
    })
  })
})
