import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FileInput from '../FileInput'

describe('FileInput', () => {
  let mockOnUpload
  let mockOnChange

  beforeEach(() => {
    mockOnUpload = vi.fn()
    mockOnChange = vi.fn()
  })

  it('renders upload area when no value provided', () => {
    render(<FileInput label="Test Upload" />)
    expect(screen.getByText(/click to upload/i)).toBeInTheDocument()
  })

  it('shows preview when value is provided', () => {
    render(
      <FileInput 
        label="Test Upload" 
        value="/test-image.jpg"
      />
    )
    const img = screen.getByAltText('Preview')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', '/test-image.jpg')
  })

  it('shows "Change Image" button when preview is displayed', () => {
    render(
      <FileInput 
        label="Test Upload" 
        value="/test-image.jpg"
      />
    )
    expect(screen.getByText('Change Image')).toBeInTheDocument()
  })

  it('updates preview when value prop changes', () => {
    const { rerender } = render(
      <FileInput 
        label="Test Upload" 
        value="/image1.jpg"
      />
    )
    
    let img = screen.getByAltText('Preview')
    expect(img).toHaveAttribute('src', '/image1.jpg')
    
    // Change the value prop
    rerender(
      <FileInput 
        label="Test Upload" 
        value="/image2.jpg"
      />
    )
    
    img = screen.getByAltText('Preview')
    expect(img).toHaveAttribute('src', '/image2.jpg')
  })

  it('calls onUpload when file is selected', async () => {
    mockOnUpload.mockResolvedValue('/uploaded-image.jpg')
    
    render(
      <FileInput 
        label="Test Upload"
        onUpload={mockOnUpload}
        onChange={mockOnChange}
      />
    )
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    // Ark UI uses a hidden input with aria-hidden
    const input = document.querySelector('input[type="file"]')
    
    fireEvent.change(input, { target: { files: [file] } })
    
    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith(file)
    })
  })

  it('calls onChange with uploaded URL', async () => {
    const uploadedUrl = '/uploaded-image.jpg'
    mockOnUpload.mockResolvedValue(uploadedUrl)
    
    render(
      <FileInput 
        label="Test Upload"
        onUpload={mockOnUpload}
        onChange={mockOnChange}
      />
    )
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const input = document.querySelector('input[type="file"]')
    
    fireEvent.change(input, { target: { files: [file] } })
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(uploadedUrl)
    })
  })

  it('shows uploading state during upload', async () => {
    let resolveUpload
    const uploadPromise = new Promise((resolve) => {
      resolveUpload = resolve
    })
    mockOnUpload.mockReturnValue(uploadPromise)
    
    render(
      <FileInput 
        label="Test Upload"
        onUpload={mockOnUpload}
        onChange={mockOnChange}
      />
    )
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const input = document.querySelector('input[type="file"]')
    
    fireEvent.change(input, { target: { files: [file] } })
    
    // Should show uploading state
    await waitFor(() => {
      expect(screen.getByText('Uploading...')).toBeInTheDocument()
    })
    
    // Resolve upload
    resolveUpload('/uploaded-image.jpg')
    
    // Should hide uploading state
    await waitFor(() => {
      expect(screen.queryByText('Uploading...')).not.toBeInTheDocument()
    })
  })

  it('allows changing image multiple times', async () => {
    mockOnUpload
      .mockResolvedValueOnce('/image1.jpg')
      .mockResolvedValueOnce('/image2.jpg')
    
    render(
      <FileInput 
        label="Test Upload"
        onUpload={mockOnUpload}
        onChange={mockOnChange}
      />
    )
    
    const input = document.querySelector('input[type="file"]')
    
    // First upload
    const file1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' })
    fireEvent.change(input, { target: { files: [file1] } })
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('/image1.jpg')
    })
    
    // Click "Change Image" button
    const changeButton = await screen.findByText('Change Image')
    fireEvent.click(changeButton)
    
    // Second upload
    const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })
    fireEvent.change(input, { target: { files: [file2] } })
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('/image2.jpg')
    })
    
    expect(mockOnUpload).toHaveBeenCalledTimes(2)
  })

  it('displays error message when provided', () => {
    render(
      <FileInput 
        label="Test Upload"
        error="File is required"
      />
    )
    expect(screen.getByText('File is required')).toBeInTheDocument()
  })

  it('displays helper text when provided', () => {
    render(
      <FileInput 
        label="Test Upload"
        helperText="Max size: 10MB"
      />
    )
    expect(screen.getByText('Max size: 10MB')).toBeInTheDocument()
  })

  it('disables input when disabled prop is true', () => {
    render(
      <FileInput 
        label="Test Upload"
        disabled
      />
    )
    const input = document.querySelector('input[type="file"]')
    expect(input).toBeDisabled()
  })
})
