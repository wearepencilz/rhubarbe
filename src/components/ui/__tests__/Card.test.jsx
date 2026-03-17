import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Card from '../Card'

describe('Card', () => {
  it('renders without crashing', () => {
    render(<Card>Card content</Card>)
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('renders children', () => {
    render(<Card><div>Test content</div></Card>)
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })
})
