import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockFetch } from '../../test/testUtils'
import ProjectForm from '../ProjectForm'

describe('ProjectForm', () => {
  const mockOnSave = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    global.alert = vi.fn()
  })

  it('submits form with project data', async () => {
    const user = userEvent.setup()
    const existingProject = {
      id: '1',
      title: 'Test Project',
      description: 'Test Description',
      image: '/test.jpg',
      link: 'https://test.com'
    }

    renderWithProviders(
      <ProjectForm 
        project={existingProject} 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    )

    // Verify form loads with existing data
    expect(screen.getByDisplayValue('Test Project')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument()

    // Update title
    const titleInput = screen.getByLabelText(/title/i)
    await user.clear(titleInput)
    await user.type(titleInput, 'Updated Project')

    // Submit form
    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    // Verify onSave was called
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled()
    })
  })
})
