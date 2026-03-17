# Implementation Plan: Untitled UI CMS Migration

## Overview

Incrementally migrate the Janine CMS admin interface from custom Tailwind components to Untitled UI React components across 5 phases. Each phase builds on the previous, starting with foundation (design tokens + buttons/inputs), then form components, feedback components, data display, and finally polish/optimization. All work targets TypeScript components in `app/admin/`.

## Tasks

- [ ] 1. Foundation Setup - Design Tokens and Tailwind Configuration
  - [ ] 1.1 Create `tailwind.config.ts` with semantic design token system
    - Define semantic color tokens (primary, success, error, warning, info) with full scales
    - Define typography tokens (fontSize with lineHeight)
    - Define border radius tokens (sm, md, lg, xl)
    - Define spacing scale tokens
    - Ensure PostCSS config references the new Tailwind config correctly
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 1.2 Write property test for design token completeness
    - **Property 3: Design Token Completeness**
    - Verify all required semantic categories exist in Tailwind config
    - **Validates: Requirements 2.1, 2.3, 2.4, 2.5, 2.6**

  - [ ] 1.3 Add Untitled UI Button component via CLI and create wrapper
    - Run `npx untitledui@latest add button` targeting `app/admin/components/ui/`
    - Verify or create Button wrapper supporting variants (primary, secondary, tertiary, danger, ghost), sizes (sm, md, lg), loading, disabled, icon configurations
    - Ensure Button uses semantic design tokens instead of hardcoded colors
    - Export from `app/admin/components/ui/button.tsx`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 1.4 Write property test for Button component features
    - **Property 6: Button Component Features**
    - Verify Button supports all required variants, sizes, loading/disabled states, and icon configs
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.5, 4.6**

  - [ ] 1.5 Add Untitled UI Input and Textarea components via CLI
    - Run `npx untitledui@latest add input` and `npx untitledui@latest add textarea`
    - Verify or create Input wrapper supporting validation states (default, error, success, warning), helper text, error messages, required indicators, disabled/readonly, prefix/suffix icons
    - Verify or create Textarea wrapper with same validation support
    - Export from `app/admin/components/ui/input.tsx` and `app/admin/components/ui/textarea.tsx`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]* 1.6 Write property test for Input validation states
    - **Property 8: Input Validation States**
    - Verify Input and Textarea support all validation states and display error messages
    - **Validates: Requirements 5.2, 5.3, 5.9**

- [ ] 2. Phase 1 Migration - Replace Buttons and Inputs in High-Traffic Pages
  - [ ] 2.1 Migrate buttons in Launches pages (`/admin/launches`, `/admin/launches/[id]`, `/admin/launches/new`)
    - Replace all hardcoded `<button className="bg-blue-600...">` with `<Button variant="primary">` etc.
    - Replace all hardcoded button classes with appropriate Button variants
    - Import Button from `@/app/admin/components/ui/button`
    - _Requirements: 4.1, 4.8, 2.2_

  - [ ] 2.2 Migrate buttons and inputs in Products pages (`/admin/products`, `/admin/products/[id]`)
    - Replace hardcoded buttons with Button component
    - Replace hardcoded `<input>` elements with Input component
    - Replace hardcoded `<textarea>` elements with Textarea component
    - _Requirements: 4.1, 4.8, 5.1, 5.7, 2.2_

  - [ ] 2.3 Migrate buttons and inputs in Ingredients pages (`/admin/ingredients`, `/admin/ingredients/[id]`)
    - Replace all hardcoded buttons and form inputs with Untitled UI components
    - _Requirements: 4.1, 4.8, 5.1, 5.7, 2.2_

  - [ ] 2.4 Migrate buttons and inputs in remaining admin pages
    - Modifiers (`/admin/modifiers`, `/admin/modifiers/[id]`, `/admin/modifiers/new`)
    - Formats (`/admin/formats`, `/admin/formats/[id]`)
    - Taxonomies (`/admin/settings/taxonomies`)
    - News (`/admin/news`)
    - Settings (`/admin/settings`)
    - Batches, Flavours, Games, Sprites, Pages, Dashboard
    - _Requirements: 4.1, 4.8, 5.1, 5.7, 2.2_

  - [ ]* 2.5 Write property test for button component consistency
    - **Property 5: Button Component Consistency**
    - Scan all admin page files to verify no native `<button>` elements with hardcoded classes remain
    - **Validates: Requirements 4.1, 4.8**

  - [ ]* 2.6 Write property test for no hardcoded color classes
    - **Property 4: No Hardcoded Color Classes**
    - Scan all migrated component files for hardcoded Tailwind color classes (e.g., `bg-blue-600`, `text-red-500`)
    - **Validates: Requirements 2.2, 4.8**

- [ ] 3. Checkpoint - Phase 1 Complete
  - Ensure all tests pass, ask the user if questions arise.
  - Verify buttons and inputs are consistent across all migrated pages
  - Run `npm run build` to confirm no compilation errors

- [ ] 4. Phase 2 - Select and Date Picker Components
  - [ ] 4.1 Add Untitled UI Select and MultiSelect components via CLI
    - Run `npx untitledui@latest add select` and `npx untitledui@latest add multi-select`
    - Verify or create Select wrapper supporting search/filter, option groups, custom option rendering
    - Verify or create MultiSelect wrapper supporting removable tags, search, option groups
    - Export from `app/admin/components/ui/select.tsx` and `app/admin/components/ui/multi-select.tsx`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ]* 4.2 Write property test for Select component features
    - **Property 13: Select Component Features**
    - Verify Select and MultiSelect support search/filter, option groups, and custom rendering
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.9**

  - [ ] 4.3 Migrate TaxonomySelect to use Untitled UI Select
    - Refactor `app/admin/components/TaxonomySelect.tsx` to wrap Untitled UI Select
    - Preserve existing API (props interface) for backward compatibility
    - Add search/filter functionality
    - _Requirements: 9.1, 9.7_

  - [ ] 4.4 Migrate TaxonomyMultiSelect and TaxonomyTagSelect to use Untitled UI MultiSelect
    - Refactor `app/admin/components/TaxonomyMultiSelect.tsx` to wrap Untitled UI MultiSelect
    - Refactor `app/admin/components/TaxonomyTagSelect.tsx` to wrap Untitled UI MultiSelect
    - Display selected items as removable tags
    - _Requirements: 9.2, 9.4, 9.7, 9.8_

  - [ ] 4.5 Migrate FormatSelector and FlavourSelector to use Untitled UI Select/MultiSelect
    - Refactor `app/admin/components/FormatSelector.tsx` to use Untitled UI Select
    - Refactor `app/admin/components/FlavourSelector.tsx` to use Untitled UI Select
    - _Requirements: 9.8_

  - [ ] 4.6 Verify and configure Untitled UI DatePicker and DateRangePicker
    - Components already exist in `app/admin/components/ui/date-picker/`
    - Verify DatePicker supports keyboard navigation, ISO 8601 formatting, min/max date constraints
    - Verify DateRangePicker supports start/end date selection
    - Create wrapper exports if needed at `app/admin/components/ui/date-picker.tsx` and `app/admin/components/ui/date-range-picker.tsx`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.8_

  - [ ]* 4.7 Write property test for DatePicker accessibility
    - **Property 10: Date Picker Accessibility**
    - Verify keyboard navigation and ISO 8601 date formatting
    - **Validates: Requirements 6.5, 6.8**

  - [ ] 4.8 Migrate date inputs across admin pages
    - Replace native HTML date inputs in Launches pages with DatePicker/DateRangePicker
    - Migrate `app/admin/components/LaunchDateRangePicker.tsx` to use Untitled UI DateRangePicker
    - Migrate `app/admin/components/AvailabilityScheduler.tsx` date inputs
    - Replace date inputs in Batches, News pages
    - _Requirements: 6.1, 6.2, 6.7_

  - [ ] 4.9 Update all form pages to use migrated Select/DatePicker components
    - Update Launches forms (new, edit) to use new Select and DatePicker components
    - Update Products forms to use new Select components
    - Update Ingredients, Modifiers, Formats forms
    - _Requirements: 9.7, 9.8, 6.7_

- [ ] 5. Checkpoint - Phase 2 Complete
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all selects, multi-selects, and date pickers are migrated
  - Run `npm run build` to confirm no compilation errors

- [ ] 6. Phase 3 - Modal and Toast Components
  - [ ] 6.1 Add Untitled UI Modal component via CLI
    - Run `npx untitledui@latest add modal`
    - Verify or create Modal wrapper supporting sizes (sm, md, lg, xl, full), focus trapping, ESC key close, backdrop click close (configurable), header/body/footer sections, body scroll prevention
    - Export from `app/admin/components/ui/modal.tsx`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.8_

  - [ ]* 6.2 Write property test for Modal component consistency
    - **Property 11: Modal Component Consistency**
    - Verify focus trapping, ESC key handling, backdrop click behavior, body scroll prevention
    - **Validates: Requirements 7.1, 7.3, 7.4, 7.5, 7.8**

  - [ ] 6.3 Migrate ConfirmModal and DeleteModal to use Untitled UI Modal
    - Refactor `app/admin/components/ConfirmModal.tsx` to use Untitled UI Modal
    - Refactor `app/admin/components/DeleteModal.tsx` to use Untitled UI Modal
    - Preserve existing props API for backward compatibility
    - _Requirements: 7.7_

  - [ ] 6.4 Migrate FormatSelectionModal to use Untitled UI Modal
    - Refactor `app/admin/components/FormatSelectionModal.tsx` to use Untitled UI Modal
    - Update internal components (checkboxes, badges) to use Untitled UI equivalents
    - _Requirements: 7.7_

  - [ ] 6.5 Add Untitled UI Toast component and create useToast hook
    - Run `npx untitledui@latest add toast` (or create custom Toast using Untitled UI patterns)
    - Create `app/admin/components/hooks/useToast.ts` hook with `success`, `error`, `warning`, `info` methods
    - Support auto-dismiss with configurable duration, manual dismissal, vertical stacking, smooth animations
    - Export Toast from `app/admin/components/ui/toast.tsx`
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [ ]* 6.6 Write property test for Toast notification features
    - **Property 15: Toast Notification Features**
    - Verify toast variants, auto-dismiss, manual dismissal, and stacking behavior
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6**

  - [ ] 6.7 Migrate existing Toast and ToastContainer to use Untitled UI Toast
    - Replace `app/admin/components/Toast.tsx` with Untitled UI Toast
    - Replace `app/admin/components/ToastContainer.tsx` with new toast system
    - Update all pages that use toast notifications to use the new `useToast` hook
    - _Requirements: 11.7, 11.8_

- [ ] 7. Checkpoint - Phase 3 Complete
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all modals and toasts are migrated
  - Run `npm run build` to confirm no compilation errors

- [ ] 8. Phase 4 - Table and Badge Components
  - [ ] 8.1 Add Untitled UI Table component via CLI
    - Run `npx untitledui@latest add table`
    - Verify or create Table wrapper supporting sortable columns, row selection with checkboxes, pagination, empty states, loading states with skeleton loaders, row actions (edit, delete, view)
    - Export from `app/admin/components/ui/table.tsx`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ]* 8.2 Write property test for Table component consistency
    - **Property 12: Table Component Consistency**
    - Verify Table supports sorting, pagination, row selection, and empty/loading states
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**

  - [ ] 8.3 Migrate DataTable component to use Untitled UI Table
    - Refactor `app/admin/components/DataTable.tsx` to wrap Untitled UI Table
    - Preserve existing DataTable props API for backward compatibility
    - Migrate `app/admin/components/TableFilters.tsx` to work with new Table
    - _Requirements: 8.8_

  - [ ] 8.4 Apply migrated Table to all list pages
    - Update Launches list page (`/admin/launches`)
    - Update Products list page (`/admin/products`)
    - Update Ingredients list page (`/admin/ingredients`)
    - Update Modifiers list page (`/admin/modifiers`)
    - Update Formats list page (`/admin/formats`)
    - Update Taxonomies list page (`/admin/settings/taxonomies`)
    - Update News list page (`/admin/news`)
    - Update Batches, Flavours, Games, Sprites pages
    - _Requirements: 8.9_

  - [ ] 8.5 Add Untitled UI Badge component via CLI
    - Run `npx untitledui@latest add badge`
    - Verify or create Badge wrapper supporting variants (default, success, warning, error, info), sizes (sm, md, lg), icon prefixes
    - Export from `app/admin/components/ui/badge.tsx`
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ]* 8.6 Write property test for Badge component consistency
    - **Property 14: Badge Component Consistency**
    - Verify all status indicators use Badge component with appropriate variants
    - **Validates: Requirements 10.1, 10.2, 10.5, 10.6**

  - [ ] 8.7 Replace all hardcoded badge classes with Badge component
    - Replace `bg-blue-100 text-blue-800` and similar badge patterns across all admin pages
    - Use Badge for taxonomy tags, status indicators, and category labels
    - Update Launches (status badges), Products (sync status), Ingredients (availability), Modifiers (type badges), Formats (status)
    - _Requirements: 10.5, 10.6_

- [ ] 9. Checkpoint - Phase 4 Complete
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all tables and badges are migrated
  - Run `npm run build` to confirm no compilation errors

- [ ] 10. Phase 5 - Accessibility, Performance, and Polish
  - [ ] 10.1 Add keyboard navigation and ARIA labels across all components
    - Audit all migrated components for keyboard accessibility
    - Add missing ARIA labels and roles to interactive elements
    - Ensure visible focus indicators on all focusable elements
    - Ensure proper tab order across all admin pages
    - _Requirements: 12.1, 12.2, 12.3, 12.7_

  - [ ]* 10.2 Write property test for keyboard navigation accessibility
    - **Property 16: Keyboard Navigation Accessibility**
    - Verify all interactive elements are keyboard accessible with visible focus indicators
    - **Validates: Requirements 12.2, 12.7**

  - [ ]* 10.3 Write property test for ARIA labels and roles
    - **Property 17: ARIA Labels and Roles**
    - Verify all components have appropriate ARIA labels, roles, and screen reader announcements
    - **Validates: Requirements 12.3, 12.6, 12.8**

  - [ ]* 10.4 Write accessibility tests using axe-core
    - **Property 18: Color Contrast Compliance**
    - Set up axe-core integration for automated accessibility testing
    - Verify color contrast ratios meet WCAG 2.1 Level AA (4.5:1 for text, 3:1 for large text)
    - Run axe-core against all migrated components
    - **Validates: Requirements 12.1, 12.5**

  - [ ] 10.5 Optimize bundle size and performance
    - Implement lazy loading for heavy components (Table, DatePicker, Modal)
    - Ensure tree-shaking works for unused Untitled UI components
    - Add React.memo to frequently re-rendered components
    - Verify page load times under 2 seconds and interaction response under 100ms
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

  - [ ]* 10.6 Write property test for bundle size optimization
    - **Property 19: Bundle Size Optimization**
    - Verify only used components are included in production bundle
    - **Validates: Requirements 16.2**

  - [ ] 10.7 Remove deprecated custom components and clean up
    - Remove old custom components that have been fully replaced (only after verifying no remaining imports)
    - Remove hardcoded color classes from any remaining files
    - Update `app/admin/components/` directory structure to reflect final state
    - _Requirements: 17.6_

  - [ ]* 10.8 Write property test for component directory structure
    - **Property 1: Component Directory Structure**
    - Verify all Untitled UI components are in `app/admin/components/ui/` directory
    - **Validates: Requirements 1.3**

  - [ ]* 10.9 Write property test for TypeScript type safety
    - **Property 2: TypeScript Type Safety**
    - Verify all UI components have complete TypeScript type definitions with no `any` types
    - **Validates: Requirements 1.5**

  - [ ] 10.10 Update ImageUploader to use migrated Button and Input dependencies
    - Update `app/admin/components/ImageUploader.tsx` to import Button and Input from Untitled UI wrappers
    - Replace any remaining hardcoded styles
    - _Requirements: 4.1, 5.1_

- [ ] 11. Documentation
  - [ ] 11.1 Create component usage documentation
    - Document each Untitled UI component with usage examples in `app/admin/components/ui/README.md`
    - Document design token system and how to use semantic tokens
    - Document component addition process via `npx untitledui@latest add [component-name]`
    - Document common patterns for forms, tables, and modals
    - Document accessibility best practices
    - Provide migration guide for converting remaining custom components
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 1.6_

- [ ] 12. Final Checkpoint - Migration Complete
  - Ensure all tests pass, ask the user if questions arise.
  - Run full test suite: unit tests, property tests, accessibility tests
  - Run `npm run build` to confirm clean production build
  - Verify all 14 admin sections use Untitled UI components consistently
  - _Requirements: 14.5, 14.6, 17.5_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation after each migration phase
- Property tests validate universal correctness properties from the design document
- Untitled UI components are added via CLI: `npx untitledui@latest add [component-name]`
- Some Untitled UI components already exist (button in `ui/buttons/`, date-picker in `ui/date-picker/`) — tasks account for verifying/wrapping these
- Old and new components coexist during migration; deprecated components are removed only in Phase 5 after full verification
- All code is TypeScript targeting `app/admin/` directory
