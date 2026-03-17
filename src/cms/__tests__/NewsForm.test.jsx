import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/testUtils'
import NewsForm from '../NewsForm'

describe('NewsForm', () => {
  const mockOnSave = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    global.alert = vi.fn()
  })

  it('submits form with news data', async () => {
    const user = userEvent.setup()
    const existingNews = {
      id: '1',
      title: 'Test News',
      category: 'Insights',
      excerpt: 'Test excerpt',
      content: 'Test content',
      image: '/test.jpg',
      date: '2024-01-01'
    }

    renderWithProviders(
      <NewsForm 
        newsItem={existingNews} 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    )

    // Verify form loads with existing data
    expect(screen.getByDisplayValue('Test News')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Insights')).toBeInTheDocument()

    // Update title
    const titleInput = screen.getByLabelText(/^title$/i)
    await user.clear(titleInput)
    await user.type(titleInput, 'Updated News')

    // Submit form
    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    // Verify onSave was called
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled()
    })
  })
})
