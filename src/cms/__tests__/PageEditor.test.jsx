import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockFetch } from '../../test/testUtils'
import PageEditor from '../PageEditor'

describe('PageEditor', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    global.alert = vi.fn()
    
    // Mock initial pages fetch
    mockFetch({
      about: {
        title: 'About Us',
        content: 'About content'
      }
    })
  })

  it('loads and displays existing page data', async () => {
    renderWithProviders(<PageEditor pageName="about" onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('About Us')).toBeInTheDocument()
      expect(screen.getByDisplayValue('About content')).toBeInTheDocument()
    })
  })

  it('submits updated page data', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<PageEditor pageName="about" onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('About Us')).toBeInTheDocument()
    })

    // Update title
    const titleInput = screen.getByLabelText(/page title/i)
    await user.clear(titleInput)
    await user.type(titleInput, 'Updated About')

    // Mock save response
    mockFetch({ success: true })

    // Submit form
    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Page saved successfully!')
      expect(mockOnClose).toHaveBeenCalled()
    })
  })
})
