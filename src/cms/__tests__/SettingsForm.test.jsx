import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, mockFetch } from '../../test/testUtils'
import SettingsForm from '../SettingsForm'

describe('SettingsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.alert = vi.fn()
    
    // Mock initial settings fetch
    mockFetch({
      email: 'test@example.com',
      companyName: 'Test Company',
      location: 'Test City',
      logo: '/logo.svg',
      hamburgerIcon: '/hamburger.svg',
      buttonIcon: '/button.svg',
      services: [],
      aboutItems: [],
      servicesDescription: '',
      aboutDescription: ''
    })
  })

  it('loads and displays existing settings', async () => {
    renderWithProviders(<SettingsForm />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument()
    })
  })

  it('submits updated settings', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<SettingsForm />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
    })

    // Update email
    const emailInput = screen.getByLabelText(/contact email/i)
    await user.clear(emailInput)
    await user.type(emailInput, 'updated@example.com')

    // Mock save response
    mockFetch({
      email: 'updated@example.com',
      companyName: 'Test Company',
      location: 'Test City',
      services: [],
      aboutItems: []
    })

    // Submit form
    const saveButton = screen.getByRole('button', { name: /save settings/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Settings saved successfully!')
    })
  })
})
