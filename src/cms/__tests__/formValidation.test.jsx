import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/testUtils'
import ProjectForm from '../ProjectForm'
import NewsForm from '../NewsForm'

describe('Form Validation', () => {
  const mockOnSave = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('prevents ProjectForm submission without required fields', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <ProjectForm 
        project={{}} 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    )

    // Try to submit without filling required fields
    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    // Form should not call onSave due to HTML5 validation
    expect(mockOnSave).not.toHaveBeenCalled()
  })

  it('prevents NewsForm submission without required fields', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <NewsForm 
        newsItem={{}} 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    )

    // Try to submit without filling required fields
    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    // Form should not call onSave due to HTML5 validation
    expect(mockOnSave).not.toHaveBeenCalled()
  })

  it('allows ProjectForm submission with all required fields', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(
      <ProjectForm 
        project={{}} 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    )

    // Fill required fields
    await user.type(screen.getByLabelText(/^title$/i), 'Test Project')
    await user.type(screen.getByLabelText(/description/i), 'Test Description')

    // Submit form
    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    // Form should call onSave
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled()
    })
  })
})
