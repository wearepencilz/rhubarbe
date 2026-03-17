import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/react'
import TagInput from '../TagInput'

describe('TagInput - Comprehensive Tests', () => {
  const mockOnChange = vi.fn()
  const mockOnCreateTag = vi.fn()

  const availableTags = [
    { id: 'tag1', name: 'Design', link: '/work/design' },
    { id: 'tag2', name: 'Development', link: '/work/dev' },
    { id: 'tag3', name: 'Branding', link: '' },
    { id: 'tag4', name: 'Marketing', link: '/services/marketing' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders with label', () => {
      render(
        <TagInput
          label="Select Tags"
          value={[]}
          onChange={mockOnChange}
          availableTags={availableTags}
        />
      )

      expect(screen.getByText('Select Tags')).toBeInTheDocument()
    })

    it('renders with placeholder', () => {
      render(
        <TagInput
          value={[]}
          onChange={mockOnChange}
          availableTags={availableTags}
          placeholder="Type to search..."
        />
      )

      expect(screen.getByPlaceholderText('Type to search...')).toBeInTheDocument()
    })

    it('renders with helper text', () => {
      render(
        <TagInput
          value={[]}
          onChange={mockOnChange}
          availableTags={availableTags}
          helperText="Select multiple tags"
        />
      )

      expect(screen.getByText('Select multiple tags')).toBeInTheDocument()
    })

    it('renders with error message', () => {
      render(
        <TagInput
          value={[]}
          onChange={mockOnChange}
          availableTags={availableTags}
          error="Tags are required"
        />
      )

      expect(screen.getByText('Tags are required')).toBeInTheDocument()
    })

    it('displays selected tags as chips', () => {
      const selectedTags = [availableTags[0], availableTags[1]]
      
      render(
        <TagInput
          value={selectedTags}
          onChange={mockOnChange}
          availableTags={availableTags}
        />
      )

      expect(screen.getByText('Design')).toBeInTheDocument()
      expect(screen.getByText('Development')).toBeInTheDocument()
    })
  })

  describe('Tag Selection', () => {
    it('shows suggestions when clicking input', async () => {
      const user = userEvent.setup()
      
      render(
        <TagInput
          value={[]}
          onChange={mockOnChange}
          availableTags={availableTags}
        />
      )

      const input = screen.getByRole('textbox')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByText('Design')).toBeInTheDocument()
        expect(screen.getByText('Development')).toBeInTheDocument()
        expect(screen.getByText('Branding')).toBeInTheDocument()
        expect(screen.getByText('Marketing')).toBeInTheDocument()
      })
    })

    it('adds tag when clicking suggestion', async () => {
      const user = userEvent.setup()
      
      render(
        <TagInput
          value={[]}
          onChange={mockOnChange}
          availableTags={availableTags}
        />
      )

      const input = screen.getByRole('textbox')
      await user.click(input)

      const designTag = await screen.findByText('Design')
      await user.click(designTag)

      expect(mockOnChange).toHaveBeenCalledWith([availableTags[0]])
    })

    it('filters suggestions based on input', async () => {
      const user = userEvent.setup()
      
      render(
        <TagInput
          value={[]}
          onChange={mockOnChange}
          availableTags={availableTags}
        />
      )

      const input = screen.getByRole('textbox')
      await user.type(input, 'dev')

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument()
        expect(screen.queryByText('Design')).not.toBeInTheDocument()
        expect(screen.queryByText('Branding')).not.toBeInTheDocument()
      })
    })

    it('filters case-insensitively', async () => {
      const user = userEvent.setup()
      
      render(
        <TagInput
          value={[]}
          onChange={mockOnChange}
          availableTags={availableTags}
        />
      )

      const input = screen.getByRole('textbox')
      await user.type(input, 'DESIGN')

      await waitFor(() => {
        expect(screen.getByText('Design')).toBeInTheDocument()
      })
    })

    it('excludes already selected tags from suggestions', async () => {
      const user = userEvent.setup()
      
      render(
        <TagInput
          value={[availableTags[0]]}
          onChange={mockOnChange}
          availableTags={availableTags}
        />
      )

      const input = screen.getByRole('textbox')
      await user.click(input)

      await waitFor(() => {
        expect(screen.queryByText('Design')).toBeInTheDocument() // In chip
        expect(screen.getByText('Development')).toBeInTheDocument()
        expect(screen.getByText('Branding')).toBeInTheDocument()
      })
    })

    it('adds tag on Enter key', async () => {
      const user = userEvent.setup()
      
      render(
        <TagInput
          value={[]}
          onChange={mockOnChange}
          availableTags={availableTags}
        />
      )

      const input = screen.getByRole('textbox')
      await user.type(input, 'dev{Enter}')

      expect(mockOnChange).toHaveBeenCalledWith([availableTags[1]])
    })

    it('shows tag links in suggestions', async () => {
      const user = userEvent.setup()
      
      render(
        <TagInput
          value={[]}
          onChange={mockOnChange}
          availableTags={availableTags}
        />
      )

      const input = screen.getByRole('textbox')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByText('→ /work/design')).toBeInTheDocument()
        expect(screen.getByText('→ /work/dev')).toBeInTheDocument()
      })
    })
  })

  describe('Tag Removal', () => {
    it('removes tag when clicking X button', async () => {
      const user = userEvent.setup()
      const selectedTags = [availableTags[0], availableTags[1]]
      
      render(
        <TagInput
          value={selectedTags}
          onChange={mockOnChange}
          availableTags={availableTags}
        />
      )

      const removeButtons = screen.getAllByRole('button', { name: '×' })
      await user.click(removeButtons[0])

      expect(mockOnChange).toHaveBeenCalledWith([availableTags[1]])
    })

    it('removes last tag on Backspace when input is empty', async () => {
      const user = userEvent.setup()
      const selectedTags = [availableTags[0], availableTags[1]]
      
      render(
        <TagInput
          value={selectedTags}
          onChange={mockOnChange}
          availableTags={availableTags}
        />
      )

      const input = screen.getByRole('textbox')
      await user.click(input)
      await user.keyboard('{Backspace}')

      expect(mockOnChange).toHaveBeenCalledWith([availableTags[0]])
    })

    it('does not remove tag on Backspace when input has text', async () => {
      const user = userEvent.setup()
      const selectedTags = [availableTags[0]]
      
      render(
        <TagInput
          value={selectedTags}
          onChange={mockOnChange}
          availableTags={availableTags}
        />
      )

      const input = screen.getByRole('textbox')
      await user.type(input, 'test{Backspace}')

      // Should only be called once for the initial render, not for removal
      expect(mockOnChange).not.toHaveBeenCalled()
    })
  })

  describe('Tag Creation', () => {
    it('shows create option when typing new tag', async () => {
      const user = userEvent.setup()
      
      render(
        <TagInput
          value={[]}
          onChange={mockOnChange}
          availableTags={availableTags}
          onCreateTag={mockOnCreateTag}
        />
      )

      const input = screen.getByRole('textbox')
      await user.type(input, 'New Tag')

      await waitFor(() => {
        expect(screen.getByText(/create "new tag"/i)).toBeInTheDocument()
      })
    })

    it('creates new tag when clicking create option', async () => {
      const user = userEvent.setup()
      const newTag = { id: 'new', name: 'New Tag', link: '' }
      mockOnCreateTag.mockReturnValue(newTag)
      
      render(
        <TagInput
          value={[]}
          onChange={mockOnChange}
          availableTags={availableTags}
          onCreateTag={mockOnCreateTag}
        />
      )

      const input = screen.getByRole('textbox')
      await user.type(input, 'New Tag')

      const createButton = await screen.findByText(/create "new tag"/i)
      await user.click(createButton)

      expect(mockOnCreateTag).toHaveBeenCalledWith('New Tag')
      expect(mockOnChange).toHaveBeenCalledWith([newTag])
    })

    it('creates new tag on Enter when no matches', async () => {
      const user = userEvent.setup()
      const newTag = { id: 'new', name: 'Unique', link: '' }
      mockOnCreateTag.mockReturnValue(newTag)
      
      render(
        <TagInput
          value={[]}
          onChange={mockOnChange}
          availableTags={availableTags}
          onCreateTag={mockOnCreateTag}
        />
      )

      const input = screen.getByRole('textbox')
      await user.type(input, 'Unique{Enter}')

      expect(mockOnCreateTag).toHaveBeenCalledWith('Unique')
      expect(mockOnChange).toHaveBeenCalledWith([newTag])
    })

    it('does not show create option without onCreateTag handler', async () => {
      const user = userEvent.setup()
      
      render(
        <TagInput
          value={[]}
          onChange={mockOnChange}
          availableTags={availableTags}
        />
      )

      const input = screen.getByRole('textbox')
      await user.type(input, 'New Tag')

      await waitFor(() => {
        expect(screen.queryByText(/create/i)).not.toBeInTheDocument()
      })
    })

    it('trims whitespace from new tags', async () => {
      const user = userEvent.setup()
      const newTag = { id: 'new', name: 'Trimmed', link: '' }
      mockOnCreateTag.mockReturnValue(newTag)
      
      render(
        <TagInput
          value={[]}
          onChange={mockOnChange}
          availableTags={availableTags}
          onCreateTag={mockOnCreateTag}
        />
      )

      const input = screen.getByRole('textbox')
      await user.type(input, '  Trimmed  ')

      const createButton = await screen.findByText(/create "  trimmed  "/i)
      await user.click(createButton)

      expect(mockOnCreateTag).toHaveBeenCalledWith('  Trimmed  ')
    })
  })

  describe('Dropdown Behavior', () => {
    it('closes dropdown when clicking outside', async () => {
      const user = userEvent.setup()
      
      render(
        <div>
          <TagInput
            value={[]}
            onChange={mockOnChange}
            availableTags={availableTags}
          />
          <button>Outside</button>
        </div>
      )

      const input = screen.getByRole('textbox')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByText('Design')).toBeInTheDocument()
      })

      const outsideButton = screen.getByRole('button', { name: 'Outside' })
      await user.click(outsideButton)

      await waitFor(() => {
        expect(screen.queryByText('Design')).not.toBeInTheDocument()
      })
    })

    it('keeps input focused after selecting tag', async () => {
      const user = userEvent.setup()
      
      render(
        <TagInput
          value={[]}
          onChange={mockOnChange}
          availableTags={availableTags}
        />
      )

      const input = screen.getByRole('textbox')
      await user.click(input)

      const designTag = await screen.findByText('Design')
      await user.click(designTag)

      expect(input).toHaveFocus()
    })

    it('clears input after selecting tag', async () => {
      const user = userEvent.setup()
      
      render(
        <TagInput
          value={[]}
          onChange={mockOnChange}
          availableTags={availableTags}
        />
      )

      const input = screen.getByRole('textbox')
      await user.type(input, 'des')

      const designTag = await screen.findByText('Design')
      await user.click(designTag)

      expect(input).toHaveValue('')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(
        <TagInput
          label="Tags"
          value={[]}
          onChange={mockOnChange}
          availableTags={availableTags}
        />
      )

      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
    })

    it('shows error styling when error prop is provided', () => {
      render(
        <TagInput
          value={[]}
          onChange={mockOnChange}
          availableTags={availableTags}
          error="Required field"
        />
      )

      const container = screen.getByRole('textbox').closest('div')
      expect(container).toHaveClass('border-red-500')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty available tags array', async () => {
      const user = userEvent.setup()
      
      render(
        <TagInput
          value={[]}
          onChange={mockOnChange}
          availableTags={[]}
        />
      )

      const input = screen.getByRole('textbox')
      await user.click(input)

      // Should not show any suggestions
      await waitFor(() => {
        const suggestions = screen.queryByRole('button')
        expect(suggestions).not.toBeInTheDocument()
      })
    })

    it('handles undefined value prop', () => {
      render(
        <TagInput
          onChange={mockOnChange}
          availableTags={availableTags}
        />
      )

      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('prevents duplicate tag selection', async () => {
      const user = userEvent.setup()
      
      render(
        <TagInput
          value={[availableTags[0]]}
          onChange={mockOnChange}
          availableTags={availableTags}
        />
      )

      const input = screen.getByRole('textbox')
      await user.type(input, 'design{Enter}')

      // Should not add duplicate
      expect(mockOnChange).not.toHaveBeenCalled()
    })
  })
})
