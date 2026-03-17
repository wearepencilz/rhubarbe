import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockFetch } from '../../test/testUtils'
import HomePageForm from '../HomePageForm'

describe('HomePageForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.alert = vi.fn()
    
    // Mock initial home page fetch
    mockFetch({
      heroImage: '/hero.jpg',
      heroText: 'Test Hero Text',
      metaTitle: 'Test Title',
      metaDescription: 'Test Description',
      metaKeywords: 'test, keywords',
      ogImage: '/og.jpg',
      heroButtons: []
    })
  })

  it('loads and displays existing home page data', async () => {
    renderWithProviders(<HomePageForm />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Hero Text')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Title')).toBeInTheDocument()
    })
  })

  it('submits updated home page settings', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<HomePageForm />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Hero Text')).toBeInTheDocument()
    })

    // Update hero text
    const heroTextInput = screen.getByLabelText(/hero text/i)
    await user.clear(heroTextInput)
    await user.type(heroTextInput, 'Updated Hero Text')

    // Mock save response
    mockFetch({
      heroImage: '/hero.jpg',
      heroText: 'Updated Hero Text',
      metaTitle: 'Test Title',
      heroButtons: []
    })

    // Submit form
    const saveButton = screen.getByRole('button', { name: /save home page settings/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Home page settings saved successfully!')
    })
  })
})
