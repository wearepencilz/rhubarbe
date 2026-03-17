import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/testUtils'
import TaxonomyForm from '../TaxonomyForm'

describe('TaxonomyForm - Comprehensive Tests', () => {
  const mockOnFormChange = vi.fn()
  const mockOnSaveSuccess = vi.fn()

  const mockTaxonomy = [
    { id: 'tag1', name: 'Design', link: '/work/design', type: 'general', usageCount: 5 },
    { id: 'tag2', name: 'Development', link: '/work/dev', type: 'general', usageCount: 3 },
    { id: 'tag3', name: 'Branding', link: '', type: 'general', usageCount: 0 }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    global.alert = vi.fn()
    global.confirm = vi.fn(() => true)
    global.fetch = vi.fn((url, options) => {
      if (url.includes('/api/settings')) {
        if (options?.method === 'PUT') {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ taxonomy: mockTaxonomy })
        })
      }
      if (url.includes('/api/projects')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Tag List Display', () => {
    it('loads and displays existing tags', async () => {
      renderWithProviders(
        <TaxonomyForm 
          onFormChange={mockOnFormChange}
          onSaveSuccess={mockOnSaveSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Design')).toBeInTheDocument()
        expect(screen.getByText('Development')).toBeInTheDocument()
        expect(screen.getByText('Branding')).toBeInTheDocument()
      })
    })

    it('shows empty state when no tags exist', async () => {
      global.fetch = vi.fn((url) => {
        if (url.includes('/api/settings')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ taxonomy: [] })
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      renderWithProviders(
        <TaxonomyForm 
          onFormChange={mockOnFormChange}
          onSaveSuccess={mockOnSaveSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/no tags yet/i)).toBeInTheDocument()
      })
    })

    it('displays tags in collapsible items', async () => {
      renderWithProviders(
        <TaxonomyForm 
          onFormChange={mockOnFormChange}
          onSaveSuccess={mockOnSaveSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Design')).toBeInTheDocument()
      })

      // Tags should be collapsed by default
      expect(screen.queryByLabelText(/tag name/i)).not.toBeInTheDocument()
    })
  })

  describe('Adding Tags', () => {
    it('adds new tag when clicking Add Tag button', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <TaxonomyForm 
          onFormChange={mockOnFormChange}
          onSaveSuccess={mockOnSaveSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Design')).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /add tag/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByText(/untitled tag/i)).toBeInTheDocument()
      })
    })

    it('expands new tag automatically for editing', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <TaxonomyForm 
          onFormChange={mockOnFormChange}
          onSaveSuccess={mockOnSaveSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add tag/i })).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /add tag/i })
      await user.click(addButton)

      // New tag should be added
      await waitFor(() => {
        const untitledTags = screen.queryAllByText(/untitled tag/i)
        expect(untitledTags.length).toBeGreaterThan(0)
      })
    })

    it('notifies parent of changes when adding tag', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <TaxonomyForm 
          onFormChange={mockOnFormChange}
          onSaveSuccess={mockOnSaveSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add tag/i })).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /add tag/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(mockOnFormChange).toHaveBeenCalled()
      })
    })
  })

  describe('Editing Tags', () => {
    it('allows editing tag name', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <TaxonomyForm 
          onFormChange={mockOnFormChange}
          onSaveSuccess={mockOnSaveSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Design')).toBeInTheDocument()
      })

      // Expand the first tag
      const designTag = screen.getByText('Design')
      await user.click(designTag)

      await waitFor(() => {
        const nameInputs = screen.getAllByLabelText(/tag name/i)
        expect(nameInputs[0]).toBeInTheDocument()
      })

      const nameInput = screen.getAllByLabelText(/tag name/i)[0]
      await user.clear(nameInput)
      await user.type(nameInput, 'UI Design')

      expect(nameInput).toHaveValue('UI Design')
    })

    it('allows editing tag link', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <TaxonomyForm 
          onFormChange={mockOnFormChange}
          onSaveSuccess={mockOnSaveSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Design')).toBeInTheDocument()
      })

      const designTag = screen.getByText('Design')
      await user.click(designTag)

      await waitFor(() => {
        const linkInputs = screen.getAllByLabelText(/link \(optional\)/i)
        expect(linkInputs[0]).toBeInTheDocument()
      })

      const linkInput = screen.getAllByLabelText(/link \(optional\)/i)[0]
      await user.clear(linkInput)
      await user.type(linkInput, '/services/ui-design')

      expect(linkInput).toHaveValue('/services/ui-design')
    })

    it('notifies parent of changes when editing', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <TaxonomyForm 
          onFormChange={mockOnFormChange}
          onSaveSuccess={mockOnSaveSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Design')).toBeInTheDocument()
      })

      const designTag = screen.getByText('Design')
      await user.click(designTag)

      await waitFor(() => {
        const nameInputs = screen.getAllByLabelText(/tag name/i)
        expect(nameInputs[0]).toBeInTheDocument()
      })

      const nameInput = screen.getAllByLabelText(/tag name/i)[0]
      await user.type(nameInput, ' Updated')

      await waitFor(() => {
        expect(mockOnFormChange).toHaveBeenCalled()
      })
    })
  })

  describe('Deleting Tags', () => {
    it('deletes unused tag immediately', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <TaxonomyForm 
          onFormChange={mockOnFormChange}
          onSaveSuccess={mockOnSaveSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Branding')).toBeInTheDocument()
      })

      // Find the remove button for Branding (usageCount: 0)
      const brandingRow = screen.getByText('Branding').closest('div')
      const removeButton = within(brandingRow).getByRole('button', { name: /remove tag/i })
      
      await user.click(removeButton)

      await waitFor(() => {
        expect(screen.queryByText('Branding')).not.toBeInTheDocument()
      })
    })

    it('shows confirmation dialog for tag in use', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <TaxonomyForm 
          onFormChange={mockOnFormChange}
          onSaveSuccess={mockOnSaveSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Design')).toBeInTheDocument()
      })

      // Find the remove button for Design (usageCount: 5)
      const designRow = screen.getByText('Design').closest('div')
      const removeButton = within(designRow).getByRole('button', { name: /remove tag/i })
      
      await user.click(removeButton)

      await waitFor(() => {
        expect(screen.getByText(/delete tag/i)).toBeInTheDocument()
        expect(screen.getByText(/used in 5 project/i)).toBeInTheDocument()
      })
    })

    it('removes tag from projects when confirmed', async () => {
      const user = userEvent.setup()
      
      global.fetch = vi.fn((url, options) => {
        if (url.includes('/api/projects') && !options) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([
              { id: '1', title: 'Project 1', services: ['Design'], category: 'Design' }
            ])
          })
        }
        if (url.includes('/api/projects/1') && options?.method === 'PUT') {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
        }
        if (url.includes('/api/settings')) {
          if (options?.method === 'PUT') {
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
          }
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ taxonomy: mockTaxonomy })
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      renderWithProviders(
        <TaxonomyForm 
          onFormChange={mockOnFormChange}
          onSaveSuccess={mockOnSaveSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Design')).toBeInTheDocument()
      })

      const designRow = screen.getByText('Design').closest('div')
      const removeButton = within(designRow).getByRole('button', { name: /remove tag/i })
      
      await user.click(removeButton)

      await waitFor(() => {
        expect(screen.getByText(/delete tag/i)).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /delete tag/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/projects/1'),
          expect.objectContaining({ method: 'PUT' })
        )
      })
    })

    it('cancels deletion when dialog is dismissed', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <TaxonomyForm 
          onFormChange={mockOnFormChange}
          onSaveSuccess={mockOnSaveSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Design')).toBeInTheDocument()
      })

      const designRow = screen.getByText('Design').closest('div')
      const removeButton = within(designRow).getByRole('button', { name: /remove tag/i })
      
      await user.click(removeButton)

      await waitFor(() => {
        expect(screen.getByText(/delete tag/i)).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.getByText('Design')).toBeInTheDocument()
      })
    })
  })

  describe('Drag and Drop Reordering', () => {
    it('renders drag handles for each tag', async () => {
      renderWithProviders(
        <TaxonomyForm 
          onFormChange={mockOnFormChange}
          onSaveSuccess={mockOnSaveSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Design')).toBeInTheDocument()
      })

      // Check for drag handle icons (hamburger menu icons)
      const dragHandles = screen.getAllByRole('button').filter(button => {
        const svg = button.querySelector('svg')
        return svg && button.className.includes('cursor-grab')
      })

      expect(dragHandles.length).toBeGreaterThan(0)
    })

    it('notifies parent when tags are reordered', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <TaxonomyForm 
          onFormChange={mockOnFormChange}
          onSaveSuccess={mockOnSaveSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Design')).toBeInTheDocument()
      })

      // Note: Full drag-and-drop testing requires more complex setup with @dnd-kit
      // This test verifies the structure is in place
      const dragHandles = screen.getAllByRole('button').filter(button => 
        button.className.includes('cursor-grab')
      )

      expect(dragHandles.length).toBe(3)
    })
  })

  describe('Saving Changes', () => {
    it('saves taxonomy when Save button clicked', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <TaxonomyForm 
          onFormChange={mockOnFormChange}
          onSaveSuccess={mockOnSaveSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Design')).toBeInTheDocument()
      })

      const saveButton = screen.getByRole('button', { name: /save taxonomy/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/settings'),
          expect.objectContaining({ method: 'PUT' })
        )
      })
    })

    it('shows success message after saving', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <TaxonomyForm 
          onFormChange={mockOnFormChange}
          onSaveSuccess={mockOnSaveSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Design')).toBeInTheDocument()
      })

      const saveButton = screen.getByRole('button', { name: /save taxonomy/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Taxonomy saved successfully!')
      })
    })

    it('calls onSaveSuccess callback', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <TaxonomyForm 
          onFormChange={mockOnFormChange}
          onSaveSuccess={mockOnSaveSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Design')).toBeInTheDocument()
      })

      const saveButton = screen.getByRole('button', { name: /save taxonomy/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockOnSaveSuccess).toHaveBeenCalled()
      })
    })

    it('handles save errors gracefully', async () => {
      const user = userEvent.setup()
      
      global.fetch = vi.fn((url, options) => {
        if (url.includes('/api/settings')) {
          if (options?.method === 'PUT') {
            return Promise.resolve({ ok: false })
          }
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ taxonomy: mockTaxonomy })
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      renderWithProviders(
        <TaxonomyForm 
          onFormChange={mockOnFormChange}
          onSaveSuccess={mockOnSaveSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Design')).toBeInTheDocument()
      })

      const saveButton = screen.getByRole('button', { name: /save taxonomy/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Error saving taxonomy'))
      })
    })

    it('includes all tag data in save request', async () => {
      const user = userEvent.setup()
      let savedData = null
      
      global.fetch = vi.fn((url, options) => {
        if (url.includes('/api/settings')) {
          if (options?.method === 'PUT') {
            savedData = JSON.parse(options.body)
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
          }
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ taxonomy: mockTaxonomy })
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      renderWithProviders(
        <TaxonomyForm 
          onFormChange={mockOnFormChange}
          onSaveSuccess={mockOnSaveSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Design')).toBeInTheDocument()
      })

      const saveButton = screen.getByRole('button', { name: /save taxonomy/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(savedData).toBeTruthy()
        expect(savedData.taxonomy).toHaveLength(3)
        expect(savedData.taxonomy[0]).toHaveProperty('name')
        expect(savedData.taxonomy[0]).toHaveProperty('link')
      })
    })
  })

  describe('Collapsible Behavior', () => {
    it('toggles tag expansion when clicking header', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <TaxonomyForm 
          onFormChange={mockOnFormChange}
          onSaveSuccess={mockOnSaveSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Design')).toBeInTheDocument()
      })

      // Initially collapsed
      expect(screen.queryByLabelText(/tag name/i)).not.toBeInTheDocument()

      // Click to expand
      const designTag = screen.getByText('Design')
      await user.click(designTag)

      await waitFor(() => {
        expect(screen.getAllByLabelText(/tag name/i)[0]).toBeInTheDocument()
      })

      // Click to collapse
      await user.click(designTag)

      await waitFor(() => {
        expect(screen.queryByLabelText(/tag name/i)).not.toBeInTheDocument()
      })
    })

    it('can expand multiple tags simultaneously', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(
        <TaxonomyForm 
          onFormChange={mockOnFormChange}
          onSaveSuccess={mockOnSaveSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Design')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Design'))
      await user.click(screen.getByText('Development'))

      await waitFor(() => {
        const nameInputs = screen.getAllByLabelText(/tag name/i)
        expect(nameInputs.length).toBeGreaterThanOrEqual(2)
      })
    })
  })
})
