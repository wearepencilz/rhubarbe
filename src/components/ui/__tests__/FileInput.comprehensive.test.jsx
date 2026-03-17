import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/react'
import FileInput from '../FileInput'

describe('FileInput - Comprehensive Tests', () => {
  const mockOnUpload = vi.fn()
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    global.alert = vi.fn()
  })

  describe('Rendering', () => {
    it('renders with label', () => {
      render(
        <FileInput
          label="Upload Image"
          onUpload={mockOnUpload}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText('Upload Image')).toBeInTheDocument()
    })

    it('renders dropzone when no value', () => {
      render(
        <FileInput
          onUpload={mockOnUpload}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText(/click to upload/i)).toBeInTheDocument()
      expect(screen.getByText(/or drag and drop/i)).toBeInTheDocument()
    })

    it('renders preview when value is provided', () => {
      render(
        <FileInput
          value="/uploads/test.jpg"
          onUpload={mockOnUpload}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByAltText('Preview')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /change image/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    })

    it('renders with helper text', () => {
      render(
        <FileInput
          onUpload={mockOnUpload}
          onChange={mockOnChange}
          helperText="Max 10MB"
        />
      )

      expect(screen.getByText('Max 10MB')).toBeInTheDocument()
    })

    it('renders with error message', () => {
      render(
        <FileInput
          onUpload={mockOnUpload}
          onChange={mockOnChange}
          error="File is required"
        />
      )

      expect(screen.getByText('File is required')).toBeInTheDocument()
    })

    it('shows correct file type hint for images', () => {
      render(
        <FileInput
          accept="image/*"
          onUpload={mockOnUpload}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText(/png, jpg, gif, svg/i)).toBeInTheDocument()
    })

    it('shows SVG-only hint for SVG accept', () => {
      render(
        <FileInput
          accept="image/svg+xml,.svg"
          onUpload={mockOnUpload}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText(/svg only/i)).toBeInTheDocument()
    })
  })

  describe('File Selection', () => {
    it('uploads file when selected via input', async () => {
      const user = userEvent.setup()
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      mockOnUpload.mockResolvedValue('/uploads/test.jpg')

      render(
        <FileInput
          onUpload={mockOnUpload}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByLabelText(/upload image/i, { selector: 'input[type="file"]' })
      await user.upload(input, file)

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith(file)
      })
    })

    it('calls onChange with uploaded URL', async () => {
      const user = userEvent.setup()
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      mockOnUpload.mockResolvedValue('/uploads/test.jpg')

      render(
        <FileInput
          onUpload={mockOnUpload}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByLabelText(/upload image/i, { selector: 'input[type="file"]' })
      await user.upload(input, file)

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('/uploads/test.jpg')
      })
    })

    it('shows uploading state during upload', async () => {
      const user = userEvent.setup()
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      let resolveUpload
      mockOnUpload.mockReturnValue(new Promise(resolve => { resolveUpload = resolve }))

      render(
        <FileInput
          onUpload={mockOnUpload}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByLabelText(/upload image/i, { selector: 'input[type="file"]' })
      await user.upload(input, file)

      await waitFor(() => {
        expect(screen.getByText(/uploading/i)).toBeInTheDocument()
      })

      resolveUpload('/uploads/test.jpg')
    })

    it('handles upload errors', async () => {
      const user = userEvent.setup()
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      mockOnUpload.mockRejectedValue(new Error('Upload failed'))

      render(
        <FileInput
          onUpload={mockOnUpload}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByLabelText(/upload image/i, { selector: 'input[type="file"]' })
      await user.upload(input, file)

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Failed to upload'))
      })
    })

    it('clears file input after upload', async () => {
      const user = userEvent.setup()
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      mockOnUpload.mockResolvedValue('/uploads/test.jpg')

      render(
        <FileInput
          onUpload={mockOnUpload}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByLabelText(/upload image/i, { selector: 'input[type="file"]' })
      await user.upload(input, file)

      await waitFor(() => {
        expect(input.value).toBe('')
      })
    })
  })

  describe('Drag and Drop', () => {
    it('highlights dropzone on drag over', async () => {
      render(
        <FileInput
          onUpload={mockOnUpload}
          onChange={mockOnChange}
        />
      )

      const dropzone = screen.getByText(/click to upload/i).closest('div')
      
      const dragEvent = new Event('dragover', { bubbles: true })
      Object.defineProperty(dragEvent, 'dataTransfer', {
        value: { files: [] }
      })
      
      dropzone.dispatchEvent(dragEvent)

      await waitFor(() => {
        expect(dropzone).toHaveClass('border-blue-500')
      })
    })

    it('removes highlight on drag leave', async () => {
      render(
        <FileInput
          onUpload={mockOnUpload}
          onChange={mockOnChange}
        />
      )

      const dropzone = screen.getByText(/click to upload/i).closest('div')
      
      const dragOverEvent = new Event('dragover', { bubbles: true })
      Object.defineProperty(dragOverEvent, 'dataTransfer', {
        value: { files: [] }
      })
      dropzone.dispatchEvent(dragOverEvent)

      const dragLeaveEvent = new Event('dragleave', { bubbles: true })
      dropzone.dispatchEvent(dragLeaveEvent)

      await waitFor(() => {
        expect(dropzone).not.toHaveClass('border-blue-500')
      })
    })

    it('uploads file on drop', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      mockOnUpload.mockResolvedValue('/uploads/test.jpg')

      render(
        <FileInput
          onUpload={mockOnUpload}
          onChange={mockOnChange}
        />
      )

      const dropzone = screen.getByText(/click to upload/i).closest('div')
      
      const dropEvent = new Event('drop', { bubbles: true })
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [file] }
      })
      
      dropzone.dispatchEvent(dropEvent)

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith(file)
      })
    })
  })

  describe('File Management', () => {
    it('deletes file when clicking delete button', async () => {
      const user = userEvent.setup()

      render(
        <FileInput
          value="/uploads/test.jpg"
          onUpload={mockOnUpload}
          onChange={mockOnChange}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      expect(mockOnChange).toHaveBeenCalledWith('')
    })

    it('allows changing existing file', async () => {
      const user = userEvent.setup()
      const newFile = new File(['new'], 'new.jpg', { type: 'image/jpeg' })
      mockOnUpload.mockResolvedValue('/uploads/new.jpg')

      render(
        <FileInput
          value="/uploads/old.jpg"
          onUpload={mockOnUpload}
          onChange={mockOnChange}
        />
      )

      const changeButton = screen.getByRole('button', { name: /change image/i })
      await user.click(changeButton)

      const input = screen.getByLabelText(/upload image/i, { selector: 'input[type="file"]' })
      await user.upload(input, newFile)

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith(newFile)
        expect(mockOnChange).toHaveBeenCalledWith('/uploads/new.jpg')
      })
    })
  })

  describe('Disabled State', () => {
    it('disables upload when disabled prop is true', () => {
      render(
        <FileInput
          disabled
          onUpload={mockOnUpload}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByLabelText(/upload image/i, { selector: 'input[type="file"]' })
      expect(input).toBeDisabled()
    })

    it('shows disabled styling', () => {
      render(
        <FileInput
          disabled
          onUpload={mockOnUpload}
          onChange={mockOnChange}
        />
      )

      const dropzone = screen.getByText(/click to upload/i).closest('div')
      expect(dropzone).toHaveClass('opacity-50')
      expect(dropzone).toHaveClass('cursor-not-allowed')
    })

    it('disables buttons in preview mode when disabled', () => {
      render(
        <FileInput
          value="/uploads/test.jpg"
          disabled
          onUpload={mockOnUpload}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByRole('button', { name: /change image/i })).toBeDisabled()
      expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled()
    })

    it('prevents drag and drop when disabled', () => {
      render(
        <FileInput
          disabled
          onUpload={mockOnUpload}
          onChange={mockOnChange}
        />
      )

      const dropzone = screen.getByText(/click to upload/i).closest('div')
      
      const dragEvent = new Event('dragover', { bubbles: true })
      dropzone.dispatchEvent(dragEvent)

      expect(dropzone).not.toHaveClass('border-blue-500')
    })
  })

  describe('Image Preview', () => {
    it('displays image preview with correct src', () => {
      render(
        <FileInput
          value="/uploads/test.jpg"
          onUpload={mockOnUpload}
          onChange={mockOnChange}
        />
      )

      const img = screen.getByAltText('Preview')
      expect(img).toHaveAttribute('src', expect.stringContaining('test.jpg'))
    })

    it('handles image load errors', async () => {
      render(
        <FileInput
          value="/uploads/broken.jpg"
          onUpload={mockOnUpload}
          onChange={mockOnChange}
        />
      )

      const img = screen.getByAltText('Preview')
      
      // Simulate image load error
      const errorEvent = new Event('error')
      img.dispatchEvent(errorEvent)

      await waitFor(() => {
        expect(img).toHaveStyle({ display: 'none' })
      })
    })

    it('shows error placeholder on image load failure', async () => {
      render(
        <FileInput
          value="/uploads/broken.jpg"
          onUpload={mockOnUpload}
          onChange={mockOnChange}
        />
      )

      const img = screen.getByAltText('Preview')
      const errorEvent = new Event('error')
      img.dispatchEvent(errorEvent)

      await waitFor(() => {
        expect(screen.getByText(/failed to load image/i)).toBeInTheDocument()
      })
    })
  })

  describe('Click Behavior', () => {
    it('opens file dialog when clicking dropzone', async () => {
      const user = userEvent.setup()
      const clickSpy = vi.fn()

      render(
        <FileInput
          onUpload={mockOnUpload}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByLabelText(/upload image/i, { selector: 'input[type="file"]' })
      input.click = clickSpy

      const dropzone = screen.getByText(/click to upload/i).closest('div')
      await user.click(dropzone)

      expect(clickSpy).toHaveBeenCalled()
    })

    it('does not open file dialog when disabled', async () => {
      const user = userEvent.setup()
      const clickSpy = vi.fn()

      render(
        <FileInput
          disabled
          onUpload={mockOnUpload}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByLabelText(/upload image/i, { selector: 'input[type="file"]' })
      input.click = clickSpy

      const dropzone = screen.getByText(/click to upload/i).closest('div')
      await user.click(dropzone)

      expect(clickSpy).not.toHaveBeenCalled()
    })

    it('does not open file dialog during upload', async () => {
      const user = userEvent.setup()
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      let resolveUpload
      mockOnUpload.mockReturnValue(new Promise(resolve => { resolveUpload = resolve }))

      render(
        <FileInput
          onUpload={mockOnUpload}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByLabelText(/upload image/i, { selector: 'input[type="file"]' })
      await user.upload(input, file)

      await waitFor(() => {
        expect(screen.getByText(/uploading/i)).toBeInTheDocument()
      })

      const clickSpy = vi.fn()
      input.click = clickSpy

      const dropzone = screen.getByText(/uploading/i).closest('div')
      await user.click(dropzone)

      expect(clickSpy).not.toHaveBeenCalled()

      resolveUpload('/uploads/test.jpg')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty file selection', async () => {
      const user = userEvent.setup()

      render(
        <FileInput
          onUpload={mockOnUpload}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByLabelText(/upload image/i, { selector: 'input[type="file"]' })
      
      // Simulate selecting no file (cancel dialog)
      const changeEvent = new Event('change', { bubbles: true })
      Object.defineProperty(input, 'files', { value: [] })
      input.dispatchEvent(changeEvent)

      expect(mockOnUpload).not.toHaveBeenCalled()
    })

    it('handles missing onUpload handler', async () => {
      const user = userEvent.setup()
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })

      render(
        <FileInput
          onChange={mockOnChange}
        />
      )

      const input = screen.getByLabelText(/upload image/i, { selector: 'input[type="file"]' })
      await user.upload(input, file)

      // Should not crash
      expect(mockOnChange).not.toHaveBeenCalled()
    })

    it('ignores empty or whitespace-only values', () => {
      const { rerender } = render(
        <FileInput
          value=""
          onUpload={mockOnUpload}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText(/click to upload/i)).toBeInTheDocument()

      rerender(
        <FileInput
          value="   "
          onUpload={mockOnUpload}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText(/click to upload/i)).toBeInTheDocument()
    })

    it('ignores "Preview" as a value', () => {
      render(
        <FileInput
          value="Preview"
          onUpload={mockOnUpload}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByText(/click to upload/i)).toBeInTheDocument()
    })
  })
})
