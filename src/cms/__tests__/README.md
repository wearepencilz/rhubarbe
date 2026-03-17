# CMS Test Suite Documentation

This directory contains comprehensive test coverage for the Pencilz CMS components.

## Test Files Overview

### Form Tests

#### `ProjectForm.comprehensive.test.jsx`
Covers all aspects of project creation and editing:
- **Input Fields**: Text inputs, textareas, validation
- **Tag Input**: Category selection (single), services (multiple), filtering, creation
- **File Upload**: Image upload, preview, delete, change
- **Form Actions**: Save, cancel, validation, change tracking
- **SEO Fields**: Collapsible metadata section

#### `NewsForm.comprehensive.test.jsx`
Tests news article management:
- **Input Fields**: Title, category, date, excerpt, content
- **Date Handling**: Default date, date selection
- **File Upload**: Featured image upload and management
- **Form Validation**: Required fields, submission
- **Form Actions**: Create vs edit modes

#### `TaxonomyForm.comprehensive.test.jsx`
Tests tag and taxonomy management:
- **Tag List Display**: Loading, empty state, collapsible items
- **Adding Tags**: New tag creation, form change notifications
- **Editing Tags**: Name and link editing
- **Deleting Tags**: Unused tags, tags in use, confirmation dialogs
- **Drag and Drop**: Reordering tags
- **Saving**: Persistence, error handling

### Dashboard Tests

#### `CMSDashboard.comprehensive.test.jsx`
Tests the main CMS dashboard:
- **Navigation**: Tab switching, active state
- **Projects Section**: List display, empty state, navigation
- **News Section**: Article list, date formatting
- **Pages Section**: Static page management
- **Delete Operations**: Confirmation dialogs, API calls
- **Unsaved Changes**: Change tracking, warnings
- **Logout**: Authentication flow

### UI Component Tests

#### `TagInput.comprehensive.test.jsx`
Tests the reusable tag input component:
- **Rendering**: Labels, placeholders, helper text, errors
- **Tag Selection**: Suggestions, filtering, keyboard navigation
- **Tag Removal**: Click removal, backspace removal
- **Tag Creation**: New tag creation, validation
- **Dropdown Behavior**: Open/close, focus management
- **Accessibility**: ARIA labels, keyboard support
- **Edge Cases**: Empty arrays, duplicates, undefined values

#### `FileInput.comprehensive.test.jsx`
Tests the file upload component:
- **Rendering**: Dropzone, preview, labels, errors
- **File Selection**: Click upload, file input
- **Drag and Drop**: Drag over, drop, visual feedback
- **File Management**: Delete, change, preview
- **Disabled State**: All interactions disabled
- **Image Preview**: Display, error handling
- **Edge Cases**: Empty selection, missing handlers

## Running Tests

### Using Kiro Hooks (Recommended)

The easiest way to run tests is using the built-in Kiro hooks:

1. **Run CMS Tests** - Runs all CMS test suites
2. **Test UI Components** - Tests TagInput, FileInput, etc.
3. **Test Specific CMS Form** - Interactive selection of which form to test
4. **CMS Test Coverage** - Runs tests with coverage report
5. **Test CMS on Save** - Auto-runs tests when CMS files are edited (disabled by default)

Access hooks via:
- Command Palette: "Open Kiro Hook UI"
- Explorer View: "Agent Hooks" section
- Or manually trigger from `.kiro/hooks/` directory

### Using Command Line

#### Run all CMS tests
```bash
npm test src/cms/__tests__
```

#### Run specific test file
```bash
npm test src/cms/__tests__/ProjectForm.comprehensive.test.jsx
```

#### Run with coverage
```bash
npm test -- --coverage src/cms
```

#### Watch mode
```bash
npm test -- --watch src/cms/__tests__
```

#### Run in CI/CD (single run, no watch)
```bash
npm test src/cms/__tests__ -- --run
```

## Test Coverage Areas

### ✅ Inputs
- Text inputs (single line)
- Textareas (multiline)
- Date inputs
- URL inputs
- Number inputs with validation
- Character count displays

### ✅ Tags
- Tag selection from dropdown
- Tag filtering/search
- Tag creation (inline)
- Tag removal
- Single vs multiple selection
- Tag chips display
- Keyboard navigation (Enter, Backspace)

### ✅ Files
- File selection via click
- Drag and drop upload
- Image preview
- File deletion
- File replacement
- Upload progress
- Error handling
- Supported file types

### ✅ Actions
- **Create**: New projects, news, tags
- **Edit**: Update existing content
- **Delete**: With confirmation dialogs
- **Save**: Form submission, validation
- **Cancel**: Discard changes
- **Drag**: Reorder items (taxonomy)

### ✅ Validation
- Required fields
- Field-specific validation (URL, date)
- Form-level validation
- Error message display
- Submission prevention

### ✅ State Management
- Form change tracking
- Unsaved changes warnings
- Loading states
- Error states
- Success feedback

## Best Practices Demonstrated

1. **User-Centric Testing**: Tests simulate real user interactions
2. **Async Handling**: Proper use of `waitFor` for async operations
3. **Mock Management**: Clean setup/teardown of mocks
4. **Accessibility**: Testing ARIA labels and keyboard navigation
5. **Edge Cases**: Comprehensive coverage of error scenarios
6. **Isolation**: Each test is independent and can run in any order

## Common Patterns

### Testing Form Submission
```javascript
await user.type(screen.getByLabelText(/title/i), 'Test')
await user.click(screen.getByRole('button', { name: /save/i }))
await waitFor(() => {
  expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
    title: 'Test'
  }))
})
```

### Testing File Upload
```javascript
const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
const input = screen.getByLabelText(/upload/i, { selector: 'input[type="file"]' })
await user.upload(input, file)
await waitFor(() => {
  expect(mockOnUpload).toHaveBeenCalledWith(file)
})
```

### Testing Tag Selection
```javascript
const input = screen.getByPlaceholderText(/select tags/i)
await user.click(input)
const tag = await screen.findByText('Design')
await user.click(tag)
expect(mockOnChange).toHaveBeenCalledWith([expect.objectContaining({ name: 'Design' })])
```

### Testing Delete Operations
```javascript
const deleteButton = screen.getByRole('button', { name: /delete/i })
await user.click(deleteButton)
await waitFor(() => {
  expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
})
const confirmButton = screen.getByRole('button', { name: /confirm/i })
await user.click(confirmButton)
expect(mockDelete).toHaveBeenCalled()
```

## Extending Tests

When adding new features:

1. **Add test file** in appropriate directory
2. **Follow naming convention**: `ComponentName.comprehensive.test.jsx`
3. **Organize with describe blocks**: Group related tests
4. **Test user flows**: Not just individual functions
5. **Include edge cases**: Empty states, errors, loading
6. **Mock external dependencies**: API calls, file system
7. **Clean up**: Use beforeEach/afterEach for setup/teardown

## Dependencies

- **vitest**: Test runner
- **@testing-library/react**: React component testing
- **@testing-library/user-event**: User interaction simulation
- **@testing-library/jest-dom**: Additional matchers

## Notes

- Tests use `renderWithProviders` from `testUtils.jsx` for consistent setup
- All API calls are mocked to avoid external dependencies
- Tests focus on user behavior, not implementation details
- Accessibility is tested through proper use of semantic queries
