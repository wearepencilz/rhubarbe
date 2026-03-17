import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Button from '../Button'

describe('Button', () => {
  it('renders without crashing', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('renders with primary variant', () => {
    render(<Button variant="primary">Primary</Button>)
    expect(screen.getByText('Primary')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<Button loading>Loading</Button>)
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  it('can be disabled', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByText('Disabled')).toBeDisabled()
  })
})
