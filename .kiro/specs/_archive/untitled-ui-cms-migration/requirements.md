# Requirements Document

## Introduction

The Janine CMS admin interface currently uses a mixed approach with custom Tailwind components, hardcoded color values (e.g., `bg-blue-600`, `text-blue-700`), and inconsistent design patterns across different pages. This creates maintenance challenges, accessibility gaps, and visual inconsistencies. This feature will migrate the entire CMS to use Untitled UI React components consistently, establishing a proper design system foundation.

The migration will standardize all UI components (buttons, inputs, modals, tables, selects, date pickers) across 14 admin sections, implement centralized theming through design tokens, and ensure WCAG accessibility compliance throughout the interface.

## Glossary

- **Untitled_UI_React**: Open-source React component library built with React Aria for accessibility, using copy-paste architecture
- **Design_Token**: Centralized configuration value (color, spacing, typography) used consistently across the design system
- **CMS_Admin**: The administrative interface at `/admin/*` for managing launches, products, ingredients, modifiers, formats, taxonomies, news, and settings
- **Component_Library**: The collection of reusable UI components in `app/admin/components/ui/`
- **Hardcoded_Color**: Direct color class usage (e.g., `bg-blue-600`) instead of semantic design tokens
- **Migration_Phase**: A logical grouping of components to be migrated together
- **Semantic_Token**: Design token with meaningful name (e.g., `primary-action`) rather than literal value (e.g., `blue-600`)

## Requirements

### Requirement 1: Untitled UI React Component Library Setup

**User Story:** As a developer, I want Untitled UI React properly configured in the project, so that I can use consistent, accessible components throughout the CMS.

#### Acceptance Criteria

1. THE CMS_Admin SHALL use Untitled UI React components from the official library
2. WHEN a developer needs a new component, THE Component_Library SHALL provide it via the Untitled UI CLI (`npx untitledui@latest add [component-name]`)
3. THE Component_Library SHALL store all Untitled UI components in `app/admin/components/ui/` directory
4. THE CMS_Admin SHALL configure PostCSS and Tailwind to support Untitled UI styling requirements
5. THE Component_Library SHALL include TypeScript definitions for all components
6. THE CMS_Admin SHALL document the component addition process in project documentation

### Requirement 2: Design Token System

**User Story:** As a developer, I want centralized design tokens for colors, spacing, and typography, so that I can maintain visual consistency and easily update the design system.

#### Acceptance Criteria

1. THE CMS_Admin SHALL define all color values as semantic design tokens in Tailwind configuration
2. THE Design_Token system SHALL replace all Hardcoded_Color instances with semantic token references
3. THE Design_Token system SHALL provide tokens for primary actions, secondary actions, success states, error states, warning states, and info states
4. THE Design_Token system SHALL define spacing scale tokens for consistent layout
5. THE Design_Token system SHALL define typography tokens for headings, body text, and labels
6. THE Design_Token system SHALL define border radius tokens for consistent corner rounding
7. WHEN a design token is updated, THE CMS_Admin SHALL reflect the change across all components without code modifications

### Requirement 3: Component Inventory and Migration Plan

**User Story:** As a project manager, I want a complete inventory of components requiring migration, so that I can track progress and allocate resources effectively.

#### Acceptance Criteria

1. THE Migration_Phase plan SHALL identify all custom components requiring migration to Untitled UI equivalents
2. THE Migration_Phase plan SHALL categorize components by priority (critical, high, medium, low)
3. THE Migration_Phase plan SHALL identify components in the following admin sections: launches, products, ingredients, modifiers, formats, taxonomies, news, settings, batches, flavours, games, sprites, pages
4. THE Migration_Phase plan SHALL document which Untitled UI components replace which custom components
5. THE Migration_Phase plan SHALL estimate effort for each Migration_Phase
6. THE Migration_Phase plan SHALL define success criteria for each phase completion

### Requirement 4: Button Component Migration

**User Story:** As a user, I want all buttons to have consistent styling, sizing, and behavior, so that the interface feels cohesive and predictable.

#### Acceptance Criteria

1. THE CMS_Admin SHALL use Untitled UI Button component for all button elements
2. THE Button component SHALL support variants: primary, secondary, tertiary, danger, ghost
3. THE Button component SHALL support sizes: small, medium, large
4. THE Button component SHALL support loading states with spinner indicators
5. THE Button component SHALL support disabled states with appropriate visual feedback
6. THE Button component SHALL support icon-only, text-only, and icon-with-text configurations
7. WHEN a button is in loading state, THE Button component SHALL disable user interaction
8. THE CMS_Admin SHALL replace all hardcoded button classes (e.g., `bg-blue-600 hover:bg-blue-700`) with Button component usage

### Requirement 5: Form Input Component Migration

**User Story:** As a user, I want all form inputs to have consistent styling and validation feedback, so that I can efficiently enter data without confusion.

#### Acceptance Criteria

1. THE CMS_Admin SHALL use Untitled UI Input component for all text input fields
2. THE Input component SHALL support validation states: default, error, success, warning
3. THE Input component SHALL display helper text and error messages
4. THE Input component SHALL support required field indicators
5. THE Input component SHALL support disabled and readonly states
6. THE Input component SHALL support prefix and suffix icons
7. THE CMS_Admin SHALL use Untitled UI Textarea component for all multi-line text inputs
8. THE CMS_Admin SHALL use Untitled UI Select component for all dropdown selections
9. WHEN an input has validation errors, THE Input component SHALL display error styling and message

### Requirement 6: Date Picker Component Migration

**User Story:** As a user, I want intuitive date selection with calendar UI, so that I can easily set dates for launches, batches, and news articles.

#### Acceptance Criteria

1. THE CMS_Admin SHALL use Untitled UI DatePicker component for all single date inputs
2. THE CMS_Admin SHALL use Untitled UI DateRangePicker component for all date range inputs
3. THE DatePicker component SHALL display a calendar popup for date selection
4. THE DateRangePicker component SHALL allow selection of start and end dates
5. THE DatePicker component SHALL support keyboard navigation for accessibility
6. THE DatePicker component SHALL validate date formats and ranges
7. THE CMS_Admin SHALL replace native HTML date inputs in launches, batches, news, and availability scheduler
8. WHEN a user selects a date, THE DatePicker component SHALL format it consistently (ISO 8601)

### Requirement 7: Modal Component Migration

**User Story:** As a user, I want consistent modal dialogs for confirmations and selections, so that I can complete actions without confusion.

#### Acceptance Criteria

1. THE CMS_Admin SHALL use Untitled UI Modal component for all dialog interactions
2. THE Modal component SHALL support sizes: small, medium, large, full
3. THE Modal component SHALL trap focus within the modal when open
4. THE Modal component SHALL close on ESC key press
5. THE Modal component SHALL close on backdrop click (configurable)
6. THE Modal component SHALL support header, body, and footer sections
7. THE CMS_Admin SHALL migrate FormatSelectionModal, ConfirmModal, and DeleteModal to use Untitled UI Modal
8. WHEN a modal is open, THE Modal component SHALL prevent body scroll

### Requirement 8: Table Component Migration

**User Story:** As a user, I want consistent data tables across all list pages, so that I can efficiently browse and manage content.

#### Acceptance Criteria

1. THE CMS_Admin SHALL use Untitled UI Table component for all data tables
2. THE Table component SHALL support sortable columns
3. THE Table component SHALL support row selection with checkboxes
4. THE Table component SHALL support pagination
5. THE Table component SHALL support empty states with helpful messages
6. THE Table component SHALL support loading states with skeleton loaders
7. THE Table component SHALL support row actions (edit, delete, view)
8. THE CMS_Admin SHALL migrate DataTable component to use Untitled UI Table
9. THE CMS_Admin SHALL apply Table component to launches, products, ingredients, modifiers, formats, taxonomies, news, batches, flavours, games, sprites pages

### Requirement 9: Select and Multi-Select Component Migration

**User Story:** As a user, I want consistent dropdown and multi-select components, so that I can efficiently select options from lists.

#### Acceptance Criteria

1. THE CMS_Admin SHALL use Untitled UI Select component for all single-selection dropdowns
2. THE CMS_Admin SHALL use Untitled UI MultiSelect component for all multi-selection inputs
3. THE Select component SHALL support search/filter functionality
4. THE MultiSelect component SHALL display selected items as removable tags
5. THE Select component SHALL support option groups and dividers
6. THE Select component SHALL support custom option rendering
7. THE CMS_Admin SHALL migrate TaxonomySelect, TaxonomyMultiSelect, and TaxonomyTagSelect to use Untitled UI components
8. THE CMS_Admin SHALL migrate FormatSelector and FlavourSelector to use Untitled UI components
9. WHEN a user searches in Select, THE Select component SHALL filter options in real-time

### Requirement 10: Badge and Tag Component Migration

**User Story:** As a user, I want consistent badges and tags for status indicators and categories, so that I can quickly identify item states.

#### Acceptance Criteria

1. THE CMS_Admin SHALL use Untitled UI Badge component for all status indicators
2. THE Badge component SHALL support variants: default, success, warning, error, info
3. THE Badge component SHALL support sizes: small, medium, large
4. THE Badge component SHALL support icon prefixes
5. THE CMS_Admin SHALL replace all hardcoded badge classes (e.g., `bg-blue-100 text-blue-800`) with Badge component usage
6. THE CMS_Admin SHALL use Badge component for taxonomy tags, status indicators, and category labels

### Requirement 11: Toast Notification Migration

**User Story:** As a user, I want consistent toast notifications for feedback on actions, so that I know when operations succeed or fail.

#### Acceptance Criteria

1. THE CMS_Admin SHALL use Untitled UI Toast component for all notifications
2. THE Toast component SHALL support variants: success, error, warning, info
3. THE Toast component SHALL auto-dismiss after configurable duration
4. THE Toast component SHALL support manual dismissal
5. THE Toast component SHALL stack multiple toasts vertically
6. THE Toast component SHALL animate in and out smoothly
7. THE CMS_Admin SHALL migrate existing Toast component to use Untitled UI Toast
8. WHEN an API operation completes, THE CMS_Admin SHALL display appropriate Toast notification

### Requirement 12: Accessibility Compliance

**User Story:** As a user with disabilities, I want the CMS to be fully accessible, so that I can use assistive technologies to manage content.

#### Acceptance Criteria

1. THE CMS_Admin SHALL meet WCAG 2.1 Level AA accessibility standards
2. THE CMS_Admin SHALL support keyboard navigation for all interactive elements
3. THE CMS_Admin SHALL provide appropriate ARIA labels and roles
4. THE CMS_Admin SHALL maintain focus management in modals and dropdowns
5. THE CMS_Admin SHALL provide sufficient color contrast ratios (4.5:1 for text)
6. THE CMS_Admin SHALL support screen reader announcements for dynamic content
7. WHEN a user navigates with keyboard, THE CMS_Admin SHALL show visible focus indicators
8. WHEN a user uses a screen reader, THE CMS_Admin SHALL announce state changes and errors

### Requirement 13: Dark Mode Support (Optional)

**User Story:** As a user, I want optional dark mode support, so that I can reduce eye strain during extended CMS usage.

#### Acceptance Criteria

1. WHERE dark mode is enabled, THE CMS_Admin SHALL apply dark color scheme to all components
2. WHERE dark mode is enabled, THE Design_Token system SHALL provide dark mode color variants
3. WHERE dark mode is enabled, THE CMS_Admin SHALL persist user preference in local storage
4. WHERE dark mode is enabled, THE CMS_Admin SHALL provide a toggle in settings or navigation
5. WHERE dark mode is enabled, THE CMS_Admin SHALL maintain WCAG contrast requirements

### Requirement 14: Migration Testing and Validation

**User Story:** As a developer, I want comprehensive testing for migrated components, so that I can ensure no regressions or broken functionality.

#### Acceptance Criteria

1. THE CMS_Admin SHALL include visual regression tests for all migrated components
2. THE CMS_Admin SHALL include accessibility tests using axe-core or similar tool
3. THE CMS_Admin SHALL include unit tests for component behavior
4. THE CMS_Admin SHALL include integration tests for form submissions and data operations
5. WHEN a component is migrated, THE CMS_Admin SHALL verify all existing functionality works identically
6. WHEN a component is migrated, THE CMS_Admin SHALL verify keyboard navigation works correctly
7. WHEN a component is migrated, THE CMS_Admin SHALL verify screen reader compatibility

### Requirement 15: Documentation and Developer Guide

**User Story:** As a developer, I want clear documentation on using Untitled UI components, so that I can maintain consistency in future development.

#### Acceptance Criteria

1. THE CMS_Admin SHALL provide component usage documentation with code examples
2. THE CMS_Admin SHALL document the design token system and how to use tokens
3. THE CMS_Admin SHALL document the component addition process via Untitled UI CLI
4. THE CMS_Admin SHALL document common patterns for forms, tables, and modals
5. THE CMS_Admin SHALL document accessibility best practices for component usage
6. THE CMS_Admin SHALL provide migration guide for converting custom components to Untitled UI
7. THE CMS_Admin SHALL document theming and customization options

### Requirement 16: Performance Optimization

**User Story:** As a user, I want the CMS to load quickly and respond smoothly, so that I can work efficiently without delays.

#### Acceptance Criteria

1. THE CMS_Admin SHALL lazy-load Untitled UI components where appropriate
2. THE CMS_Admin SHALL minimize bundle size by importing only used components
3. THE CMS_Admin SHALL optimize re-renders using React memoization
4. THE CMS_Admin SHALL measure and maintain page load times under 2 seconds
5. THE CMS_Admin SHALL measure and maintain interaction response times under 100ms
6. WHEN a page loads, THE CMS_Admin SHALL prioritize above-the-fold content rendering

### Requirement 17: Incremental Migration Strategy

**User Story:** As a project manager, I want to migrate components incrementally, so that we can deliver value continuously without blocking development.

#### Acceptance Criteria

1. THE Migration_Phase plan SHALL allow old and new components to coexist during migration
2. THE Migration_Phase plan SHALL prioritize high-traffic pages for early migration
3. THE Migration_Phase plan SHALL complete migration in phases: buttons/inputs, date pickers, modals, tables, selects
4. THE Migration_Phase plan SHALL include rollback strategy for each phase
5. THE Migration_Phase plan SHALL track migration progress with metrics (% components migrated)
6. WHEN a Migration_Phase completes, THE CMS_Admin SHALL remove deprecated custom components
7. WHEN a Migration_Phase completes, THE CMS_Admin SHALL update documentation to reflect changes
