import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Input from '../Input'

describe('Input', () => {
  it('renders without crashing', () => {
    render(<Input />)
  })

  it('renders with label', () => {
    render(<Input label="Test Label" />)
    expect(screen.getByText('Test Label')).toBeInTheDocument()
  })

  it('displays error message', () => {
    render(<Input error="Error message" />)
    expect(screen.getByText('Error message')).toBeInTheDocument()
  })

  it('displays helper text', () => {
    render(<Input helperText="Helper text" />)
    expect(screen.getByText('Helper text')).toBeInTheDocument()
  })
})
