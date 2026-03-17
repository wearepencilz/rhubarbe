import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockFetch } from '../../test/testUtils'
import SettingsForm from '../SettingsForm'

describe('Data Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.alert = vi.fn()
  })

  it('preserves existing fields when updating settings', async () => {
    const user = userEvent.setup()
    
    const existingSettings = {
      email: 'test@example.com',
      companyName: 'Test Company',
      location: 'Montreal',
      logo: '/logo.svg',
      hamburgerIcon: '/hamburger.svg',
      buttonIcon: '/button.svg',
      services: [{ id: '1', name: 'Service 1', link: '/service1' }],
      aboutItems: [{ id: '2', name: 'About 1', link: '/about1' }],
      servicesDescription: 'Services desc',
      aboutDescription: 'About desc'
    }

    mockFetch(existingSettings)
    
    renderWithProviders(<SettingsForm />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
    })

    // Update only the email
    const emailInput = screen.getByLabelText(/contact email/i)
    await user.clear(emailInput)
    await user.type(emailInput, 'updated@example.com')

    // Capture the save request
    let savedPayload = null
    global.fetch = vi.fn((url, options) => {
      if (options?.method === 'PUT') {
        savedPayload = JSON.parse(options.body)
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ...existingSettings, email: 'updated@example.com' })
      })
    })

    // Submit form
    const saveButton = screen.getByRole('button', { name: /save settings/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(savedPayload).toBeTruthy()
      // Verify all existing fields are preserved
      expect(savedPayload.companyName).toBe('Test Company')
      expect(savedPayload.location).toBe('Montreal')
      expect(savedPayload.services).toHaveLength(1)
      expect(savedPayload.aboutItems).toHaveLength(1)
      expect(savedPayload.servicesDescription).toBe('Services desc')
      expect(savedPayload.aboutDescription).toBe('About desc')
    })
  })
})
