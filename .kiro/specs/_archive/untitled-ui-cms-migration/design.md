# Design Document: Untitled UI CMS Migration

## Overview

This design document outlines the technical approach for migrating the Janine CMS admin interface from custom Tailwind components to Untitled UI React components. The migration will establish a consistent design system foundation, improve accessibility compliance, and reduce maintenance overhead.

### Current State

The CMS currently uses:
- Custom components with hardcoded Tailwind classes (e.g., `bg-blue-600`, `hover:bg-blue-700`)
- Inconsistent styling patterns across 14 admin sections
- Mixed component approaches (some with design patterns, others ad-hoc)
- No centralized design token system
- Limited accessibility features

### Target State

After migration, the CMS will have:
- Untitled UI React components throughout the interface
- Centralized design token system in Tailwind configuration
- WCAG 2.1 Level AA accessibility compliance
- Consistent component patterns across all admin pages
- Reduced custom CSS and improved maintainability

### Migration Scope

The migration covers 14 admin sections:
1. Launches (`/admin/launches`)
2. Products (`/admin/products`)
3. Ingredients (`/admin/ingredients`)
4. Modifiers (`/admin/modifiers`)
5. Formats (`/admin/formats`)
6. Taxonomies (`/admin/settings/taxonomies`)
7. News (`/admin/news`)
8. Settings (`/admin/settings`)
9. Batches (`/admin/batches`)
10. Flavours (`/admin/flavours`)
11. Games (`/admin/games`)
12. Sprites (`/admin/sprites`)
13. Pages (`/admin/pages`)
14. Dashboard (`/admin`)

## Architecture

### Component Library Structure

```
app/admin/components/
├── ui/                          # Untitled UI components (via CLI)
│   ├── button.tsx              # Button component
│   ├── input.tsx               # Text input component
│   ├── textarea.tsx            # Multi-line text input
│   ├── select.tsx              # Dropdown select
│   ├── multi-select.tsx        # Multi-selection dropdown
│   ├── date-picker.tsx         # Single date picker
│   ├── date-range-picker.tsx   # Date range picker
│   ├── modal.tsx               # Dialog/modal component
│   ├── table.tsx               # Data table component
│   ├── badge.tsx               # Status badge component
│   ├── toast.tsx               # Toast notification
│   ├── checkbox.tsx            # Checkbox input
│   ├── radio.tsx               # Radio button input
│   ├── switch.tsx              # Toggle switch
│   ├── tabs.tsx                # Tab navigation
│   ├── dropdown-menu.tsx       # Dropdown menu
│   └── tooltip.tsx             # Tooltip component
├── [existing custom components] # To be migrated or removed
└── hooks/                       # Custom React hooks
    ├── useToast.ts             # Toast notification hook
    └── useModal.ts             # Modal state management hook
```

### Design Token System

Design tokens will be defined in `tailwind.config.ts` (to be created) using Tailwind's theme extension:

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Semantic color tokens
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',  // Primary action color
          600: '#2563eb',  // Primary hover
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
        },
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
        },
      },
      borderRadius: {
        'sm': '0.375rem',   // 6px
        'md': '0.5rem',     // 8px
        'lg': '0.75rem',    // 12px
        'xl': '1rem',       // 16px
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      },
      spacing: {
        // Additional spacing tokens if needed
      },
    },
  },
  plugins: [],
}

export default config
```

### Component Addition Workflow

Developers will add Untitled UI components using the CLI:

```bash
# Add a specific component
npx untitledui@latest add button

# When prompted, specify the target directory
# > Where should we install the component?
# > app/admin/components/ui

# The component will be added with all dependencies
```

### Migration Strategy

The migration will follow an incremental, phase-based approach:

**Phase 1: Foundation (Buttons & Inputs)**
- Create Tailwind config with design tokens
- Add Button, Input, Textarea components via CLI
- Migrate all button elements to use Button component
- Migrate all text inputs to use Input/Textarea components
- Update 2-3 high-traffic pages as proof of concept

**Phase 2: Form Components (Selects & Date Pickers)**
- Add Select, MultiSelect, DatePicker, DateRangePicker via CLI
- Migrate TaxonomySelect, TaxonomyMultiSelect, TaxonomyTagSelect
- Migrate FormatSelector, FlavourSelector
- Migrate LaunchDateRangePicker, AvailabilityScheduler
- Update all form pages

**Phase 3: Feedback Components (Modals & Toasts)**
- Add Modal, Toast components via CLI
- Migrate ConfirmModal, DeleteModal, FormatSelectionModal
- Migrate Toast, ToastContainer
- Update all pages using modals/toasts

**Phase 4: Data Display (Tables & Badges)**
- Add Table, Badge components via CLI
- Migrate DataTable component
- Migrate all status badges and tags
- Update all list pages

**Phase 5: Polish & Optimization**
- Remove deprecated custom components
- Optimize bundle size
- Add visual regression tests
- Update documentation

### Coexistence Strategy

During migration, old and new components will coexist:

1. **Namespace separation**: Untitled UI components in `app/admin/components/ui/`, custom components at root level
2. **Gradual replacement**: Pages migrated one at a time
3. **Feature flags**: Optional feature flag for testing new components
4. **Rollback capability**: Keep old components until migration is complete and tested

## Components and Interfaces

### Button Component

**Source**: Untitled UI React Button component

**Props Interface**:
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}
```

**Usage Example**:
```tsx
import { Button } from '@/app/admin/components/ui/button';

<Button variant="primary" size="md" loading={isSubmitting}>
  Save Changes
</Button>
```

**Migration Pattern**:
```tsx
// Before
<button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
  Save
</button>

// After
<Button variant="primary" size="md">
  Save
</Button>
```

### Input Component

**Source**: Untitled UI React Input component

**Props Interface**:
```typescript
interface InputProps {
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number' | 'url';
  placeholder?: string;
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}
```

**Usage Example**:
```tsx
import { Input } from '@/app/admin/components/ui/input';

<Input
  label="Launch Title"
  value={title}
  onChange={setTitle}
  error={errors.title}
  required
/>
```

### Select Component

**Source**: Untitled UI React Select component

**Props Interface**:
```typescript
interface SelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  searchable?: boolean;
  disabled?: boolean;
}
```

**Usage Example**:
```tsx
import { Select } from '@/app/admin/components/ui/select';

<Select
  label="Status"
  options={statusOptions}
  value={status}
  onChange={setStatus}
  searchable
/>
```

### DatePicker Component

**Source**: Untitled UI React DatePicker component

**Props Interface**:
```typescript
interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
}
```

**Usage Example**:
```tsx
import { DatePicker } from '@/app/admin/components/ui/date-picker';

<DatePicker
  label="Active Start Date"
  value={activeStart}
  onChange={setActiveStart}
  minDate={new Date()}
/>
```

### Modal Component

**Source**: Untitled UI React Modal component

**Props Interface**:
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}
```

**Usage Example**:
```tsx
import { Modal } from '@/app/admin/components/ui/modal';

<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Confirm Deletion"
  size="md"
  footer={
    <>
      <Button variant="secondary" onClick={onClose}>Cancel</Button>
      <Button variant="danger" onClick={onConfirm}>Delete</Button>
    </>
  }
>
  <p>Are you sure you want to delete this item?</p>
</Modal>
```

### Table Component

**Source**: Untitled UI React Table component

**Props Interface**:
```typescript
interface TableColumn<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  selectable?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  loading?: boolean;
  emptyMessage?: string;
}
```

**Usage Example**:
```tsx
import { Table } from '@/app/admin/components/ui/table';

<Table
  data={launches}
  columns={columns}
  keyExtractor={(launch) => launch.id}
  onRowClick={(launch) => router.push(`/admin/launches/${launch.id}`)}
  loading={loading}
/>
```

### Toast Component

**Source**: Untitled UI React Toast component

**Props Interface**:
```typescript
interface ToastProps {
  id: string;
  variant: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

// Hook interface
interface UseToastReturn {
  toast: (options: Omit<ToastProps, 'id' | 'onClose'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}
```

**Usage Example**:
```tsx
import { useToast } from '@/app/admin/components/hooks/useToast';

const { success, error } = useToast();

// Show success toast
success('Launch created', 'Your launch has been successfully created');

// Show error toast
error('Failed to save', 'Please check your input and try again');
```

### Badge Component

**Source**: Untitled UI React Badge component

**Props Interface**:
```typescript
interface BadgeProps {
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
}
```

**Usage Example**:
```tsx
import { Badge } from '@/app/admin/components/ui/badge';

<Badge variant="success">Active</Badge>
<Badge variant="error">Archived</Badge>
```

## Data Models

### Design Token Configuration

The design token system will be defined in `tailwind.config.ts`:

```typescript
interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

interface DesignTokens {
  colors: {
    primary: ColorScale;
    success: Partial<ColorScale>;
    error: Partial<ColorScale>;
    warning: Partial<ColorScale>;
    info: Partial<ColorScale>;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  fontSize: Record<string, [string, { lineHeight: string }]>;
  spacing: Record<string, string>;
}
```

### Component Inventory

```typescript
interface ComponentInventoryItem {
  name: string;
  currentPath: string;
  untitledUIEquivalent: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  usageCount: number;
  migrationPhase: 1 | 2 | 3 | 4 | 5;
  dependencies: string[];
  estimatedEffort: 'small' | 'medium' | 'large';
}

const componentInventory: ComponentInventoryItem[] = [
  {
    name: 'DataTable',
    currentPath: 'app/admin/components/DataTable.tsx',
    untitledUIEquivalent: 'table',
    priority: 'critical',
    usageCount: 14, // Used in all list pages
    migrationPhase: 4,
    dependencies: ['Button', 'Badge'],
    estimatedEffort: 'large',
  },
  {
    name: 'Toast',
    currentPath: 'app/admin/components/Toast.tsx',
    untitledUIEquivalent: 'toast',
    priority: 'high',
    usageCount: 50, // Used throughout app
    migrationPhase: 3,
    dependencies: [],
    estimatedEffort: 'medium',
  },
  {
    name: 'ConfirmModal',
    currentPath: 'app/admin/components/ConfirmModal.tsx',
    untitledUIEquivalent: 'modal',
    priority: 'high',
    usageCount: 20,
    migrationPhase: 3,
    dependencies: ['Button'],
    estimatedEffort: 'medium',
  },
  {
    name: 'DeleteModal',
    currentPath: 'app/admin/components/DeleteModal.tsx',
    untitledUIEquivalent: 'modal',
    priority: 'high',
    usageCount: 15,
    migrationPhase: 3,
    dependencies: ['Button'],
    estimatedEffort: 'small',
  },
  {
    name: 'FormatSelectionModal',
    currentPath: 'app/admin/components/FormatSelectionModal.tsx',
    untitledUIEquivalent: 'modal',
    priority: 'medium',
    usageCount: 2,
    migrationPhase: 3,
    dependencies: ['Button', 'Checkbox', 'Badge'],
    estimatedEffort: 'medium',
  },
  {
    name: 'TaxonomySelect',
    currentPath: 'app/admin/components/TaxonomySelect.tsx',
    untitledUIEquivalent: 'select',
    priority: 'high',
    usageCount: 30,
    migrationPhase: 2,
    dependencies: ['Input', 'Button'],
    estimatedEffort: 'large',
  },
  {
    name: 'TaxonomyMultiSelect',
    currentPath: 'app/admin/components/TaxonomyMultiSelect.tsx',
    untitledUIEquivalent: 'multi-select',
    priority: 'high',
    usageCount: 15,
    migrationPhase: 2,
    dependencies: ['Input', 'Badge'],
    estimatedEffort: 'large',
  },
  {
    name: 'TaxonomyTagSelect',
    currentPath: 'app/admin/components/TaxonomyTagSelect.tsx',
    untitledUIEquivalent: 'multi-select',
    priority: 'medium',
    usageCount: 10,
    migrationPhase: 2,
    dependencies: ['Input', 'Badge'],
    estimatedEffort: 'medium',
  },
  {
    name: 'LaunchDateRangePicker',
    currentPath: 'app/admin/components/LaunchDateRangePicker.tsx',
    untitledUIEquivalent: 'date-range-picker',
    priority: 'medium',
    usageCount: 3,
    migrationPhase: 2,
    dependencies: [],
    estimatedEffort: 'medium',
  },
  {
    name: 'ImageUploader',
    currentPath: 'app/admin/components/ImageUploader.tsx',
    untitledUIEquivalent: 'custom (keep)',
    priority: 'low',
    usageCount: 20,
    migrationPhase: 5,
    dependencies: ['Button', 'Input'],
    estimatedEffort: 'small', // Just update dependencies
  },
  // Hardcoded buttons throughout pages
  {
    name: 'Hardcoded Buttons',
    currentPath: 'various',
    untitledUIEquivalent: 'button',
    priority: 'critical',
    usageCount: 100,
    migrationPhase: 1,
    dependencies: [],
    estimatedEffort: 'large',
  },
  // Hardcoded inputs throughout forms
  {
    name: 'Hardcoded Inputs',
    currentPath: 'various',
    untitledUIEquivalent: 'input',
    priority: 'critical',
    usageCount: 80,
    migrationPhase: 1,
    dependencies: [],
    estimatedEffort: 'large',
  },
  // Status badges throughout pages
  {
    name: 'Hardcoded Badges',
    currentPath: 'various',
    untitledUIEquivalent: 'badge',
    priority: 'high',
    usageCount: 50,
    migrationPhase: 4,
    dependencies: [],
    estimatedEffort: 'medium',
  },
];
```

### Migration Progress Tracking

```typescript
interface MigrationMetrics {
  totalComponents: number;
  migratedComponents: number;
  percentComplete: number;
  componentsByPhase: Record<number, number>;
  componentsByPriority: Record<string, number>;
  estimatedRemainingEffort: string;
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Acceptance Criteria Testing Prework

Before defining correctness properties, I analyzed each acceptance criterion to determine testability:

**1.1** THE CMS_Admin SHALL use Untitled UI React components from the official library
  Thoughts: This is about the source of components, which is a structural requirement. We can verify this by checking imports and component sources, but it's not a runtime property.
  Testable: no

**1.2** WHEN a developer needs a new component, THE Component_Library SHALL provide it via the Untitled UI CLI
  Thoughts: This is about the development workflow, not a runtime behavior. It's a process requirement.
  Testable: no

**1.3** THE Component_Library SHALL store all Untitled UI components in `app/admin/components/ui/` directory
  Thoughts: This is a structural requirement about file organization. We can test this with a static analysis that checks all UI components are in the correct directory.
  Testable: yes - property

**1.4** THE CMS_Admin SHALL configure PostCSS and Tailwind to support Untitled UI styling requirements
  Thoughts: This is a configuration requirement. We can verify the config files exist and have required settings.
  Testable: yes - example

**1.5** THE Component_Library SHALL include TypeScript definitions for all components
  Thoughts: This is about type safety. We can verify all components have proper TypeScript types and no 'any' types are used.
  Testable: yes - property

**1.6** THE CMS_Admin SHALL document the component addition process in project documentation
  Thoughts: This is about documentation existence, not runtime behavior.
  Testable: no

**2.1** THE CMS_Admin SHALL define all color values as semantic design tokens in Tailwind configuration
  Thoughts: This is a structural requirement. We can verify all colors are defined in the config and no hardcoded hex values exist in components.
  Testable: yes - property

**2.2** THE Design_Token system SHALL replace all Hardcoded_Color instances with semantic token references
  Thoughts: This is about code quality. We can scan all component files and ensure no hardcoded color classes like 'bg-blue-600' exist.
  Testable: yes - property

**2.3** THE Design_Token system SHALL provide tokens for primary actions, secondary actions, success states, error states, warning states, and info states
  Thoughts: This is a structural requirement. We can verify the Tailwind config has all required semantic tokens defined.
  Testable: yes - example

**2.4-2.6** Design token definitions for spacing, typography, border radius
  Thoughts: Similar to 2.3, these are structural requirements about config completeness.
  Testable: yes - example

**2.7** WHEN a design token is updated, THE CMS_Admin SHALL reflect the change across all components without code modifications
  Thoughts: This is testing that components use tokens correctly. If we change a token value in config, all components using that token should reflect the change. This is inherent to how Tailwind works, not something we can property test.
  Testable: no

**4.1** THE CMS_Admin SHALL use Untitled UI Button component for all button elements
  Thoughts: This is about component usage consistency. We can scan all files and verify all button elements use the Button component.
  Testable: yes - property

**4.2-4.7** Button component features (variants, sizes, states, configurations)
  Thoughts: These are about the Button component API. We can test that the Button component accepts these props and renders correctly.
  Testable: yes - property

**4.8** THE CMS_Admin SHALL replace all hardcoded button classes with Button component usage
  Thoughts: This is the same as 4.1 - ensuring no hardcoded button classes exist.
  Testable: yes - property

**5.1-5.9** Form input component requirements
  Thoughts: Similar to buttons - we can verify all text inputs use Input component, all textareas use Textarea, all selects use Select, and that these components support required features.
  Testable: yes - property

**6.1-6.8** Date picker requirements
  Thoughts: We can verify DatePicker and DateRangePicker are used for all date inputs, and that they support required features.
  Testable: yes - property

**7.1-7.8** Modal component requirements
  Thoughts: We can verify all modals use the Modal component and support required features like focus trapping, ESC key, backdrop click.
  Testable: yes - property

**8.1-8.9** Table component requirements
  Thoughts: We can verify all data tables use the Table component and support required features.
  Testable: yes - property

**9.1-9.9** Select and multi-select requirements
  Thoughts: We can verify all dropdowns use Select/MultiSelect components and support required features.
  Testable: yes - property

**10.1-10.6** Badge component requirements
  Thoughts: We can verify all status indicators use Badge component.
  Testable: yes - property

**11.1-11.8** Toast notification requirements
  Thoughts: We can verify Toast component is used and supports required features.
  Testable: yes - property

**12.1-12.8** Accessibility requirements
  Thoughts: These are about WCAG compliance. We can use automated accessibility testing tools (axe-core) to verify keyboard navigation, ARIA labels, focus management, and color contrast.
  Testable: yes - property

**13.1-13.5** Dark mode support (optional)
  Thoughts: If implemented, we can verify dark mode tokens exist and components respond to dark mode.
  Testable: yes - property (if implemented)

**14.1-14.7** Migration testing requirements
  Thoughts: These are about the testing strategy itself, not properties to test.
  Testable: no

**15.1-15.7** Documentation requirements
  Thoughts: These are about documentation existence, not runtime behavior.
  Testable: no

**16.1-16.6** Performance requirements
  Thoughts: These are measurable performance metrics. We can test bundle size, load times, and interaction response times.
  Testable: yes - property

**17.1-17.7** Incremental migration strategy
  Thoughts: These are about the migration process, not runtime properties.
  Testable: no

### Property Reflection

After analyzing all acceptance criteria, I identified the following testable properties. Now I'll review for redundancy:

- **Component location property** (1.3): All UI components in correct directory
- **TypeScript definitions property** (1.5): All components have proper types
- **Design token definition property** (2.1, 2.3): All required tokens defined in config
- **No hardcoded colors property** (2.2): No hardcoded color classes in components
- **Button usage property** (4.1, 4.8): All buttons use Button component - REDUNDANT, combine into one
- **Button features property** (4.2-4.7): Button supports all required features
- **Input usage property** (5.1-5.9): All inputs use Input/Textarea/Select components
- **DatePicker usage property** (6.1-6.8): All date inputs use DatePicker components
- **Modal usage property** (7.1-7.8): All modals use Modal component
- **Table usage property** (8.1-8.9): All tables use Table component
- **Select usage property** (9.1-9.9): All selects use Select/MultiSelect components
- **Badge usage property** (10.1-10.6): All badges use Badge component
- **Toast usage property** (11.1-11.8): All toasts use Toast component
- **Accessibility property** (12.1-12.8): Components meet WCAG standards
- **Performance property** (16.1-16.6): Bundle size and performance metrics

After reflection, I'll combine redundant properties and focus on unique validation value.

### Property 1: Component Directory Structure

*For all* Untitled UI components in the codebase, they must be located in the `app/admin/components/ui/` directory and not scattered in other locations.

**Validates: Requirements 1.3**

### Property 2: TypeScript Type Safety

*For all* components in the UI library, they must have complete TypeScript type definitions with no usage of `any` types or missing prop types.

**Validates: Requirements 1.5**

### Property 3: Design Token Completeness

*For all* required semantic categories (primary, success, error, warning, info, spacing, typography, border radius), the Tailwind configuration must define corresponding design tokens.

**Validates: Requirements 2.1, 2.3, 2.4, 2.5, 2.6**

### Property 4: No Hardcoded Color Classes

*For all* component files in the admin interface, they must not contain hardcoded Tailwind color classes (e.g., `bg-blue-600`, `text-red-500`) and instead use semantic design tokens.

**Validates: Requirements 2.2, 4.8**

### Property 5: Button Component Consistency

*For all* button elements in the admin interface, they must use the Untitled UI Button component rather than native HTML button elements or custom button implementations.

**Validates: Requirements 4.1, 4.8**

### Property 6: Button Component Features

*For all* Button component instances, the component must support variants (primary, secondary, tertiary, danger, ghost), sizes (sm, md, lg), loading states, disabled states, and icon configurations.

**Validates: Requirements 4.2, 4.3, 4.4, 4.5, 4.6**

### Property 7: Form Input Component Consistency

*For all* text input, textarea, and select elements in forms, they must use the corresponding Untitled UI components (Input, Textarea, Select) rather than native HTML elements.

**Validates: Requirements 5.1, 5.7, 5.8**

### Property 8: Input Validation States

*For all* Input and Textarea components, they must support validation states (default, error, success, warning) and display appropriate error messages when validation fails.

**Validates: Requirements 5.2, 5.3, 5.9**

### Property 9: Date Picker Component Usage

*For all* date input fields in the admin interface, they must use DatePicker for single dates and DateRangePicker for date ranges, replacing native HTML date inputs.

**Validates: Requirements 6.1, 6.2, 6.7**

### Property 10: Date Picker Accessibility

*For all* DatePicker and DateRangePicker instances, they must support keyboard navigation and format dates consistently in ISO 8601 format.

**Validates: Requirements 6.5, 6.8**

### Property 11: Modal Component Consistency

*For all* dialog and modal interactions in the admin interface, they must use the Untitled UI Modal component with proper focus trapping, ESC key handling, and backdrop click behavior.

**Validates: Requirements 7.1, 7.3, 7.4, 7.5, 7.8**

### Property 12: Table Component Consistency

*For all* data list pages in the admin interface, they must use the Untitled UI Table component with support for sorting, pagination, row selection, and empty states.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**

### Property 13: Select Component Features

*For all* Select and MultiSelect components, they must support search/filter functionality, option groups, and custom option rendering.

**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.9**

### Property 14: Badge Component Consistency

*For all* status indicators and category labels, they must use the Untitled UI Badge component with appropriate variants (default, success, warning, error, info) rather than hardcoded badge classes.

**Validates: Requirements 10.1, 10.2, 10.5, 10.6**

### Property 15: Toast Notification Features

*For all* Toast notifications, they must support variants (success, error, warning, info), auto-dismiss with configurable duration, manual dismissal, and proper stacking of multiple toasts.

**Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6**

### Property 16: Keyboard Navigation Accessibility

*For all* interactive elements in the admin interface, they must be keyboard accessible with visible focus indicators and proper tab order.

**Validates: Requirements 12.2, 12.7**

### Property 17: ARIA Labels and Roles

*For all* components in the admin interface, they must have appropriate ARIA labels, roles, and screen reader announcements for dynamic content.

**Validates: Requirements 12.3, 12.6, 12.8**

### Property 18: Color Contrast Compliance

*For all* text elements in the admin interface, they must maintain a minimum color contrast ratio of 4.5:1 for normal text and 3:1 for large text to meet WCAG 2.1 Level AA standards.

**Validates: Requirements 12.1, 12.5**

### Property 19: Bundle Size Optimization

*For all* Untitled UI component imports, only the components actually used in the application should be included in the production bundle, with unused components tree-shaken.

**Validates: Requirements 16.2**

### Property 20: Page Load Performance

*For all* admin pages, the initial page load time must be under 2 seconds and interaction response times must be under 100ms.

**Validates: Requirements 16.4, 16.5**


## Error Handling

### Component Addition Errors

**Error**: Untitled UI CLI fails to add component

**Handling**:
1. Check network connectivity (CLI downloads from npm)
2. Verify target directory exists and is writable
3. Check for naming conflicts with existing files
4. Review CLI output for specific error messages
5. Fallback: Manually copy component from Untitled UI GitHub repository

**Prevention**:
- Document common CLI issues and solutions
- Provide pre-flight checklist before adding components
- Maintain list of successfully added components

### Design Token Configuration Errors

**Error**: Invalid Tailwind configuration syntax

**Handling**:
1. Validate `tailwind.config.ts` syntax with TypeScript compiler
2. Check for missing imports or type definitions
3. Verify color scale completeness (all required shades)
4. Test configuration by running `npm run build`

**Prevention**:
- Use TypeScript for config file (type checking)
- Provide config template with all required tokens
- Add pre-commit hook to validate config syntax

### Component Migration Errors

**Error**: Migrated component breaks existing functionality

**Handling**:
1. Identify breaking change through error logs or user reports
2. Compare old and new component props/behavior
3. Add compatibility layer if needed
4. Rollback to old component if critical
5. Fix and re-test before re-deploying

**Prevention**:
- Comprehensive testing before migration (unit + integration)
- Visual regression testing to catch UI changes
- Gradual rollout with feature flags
- Keep old components until migration is verified

### Accessibility Errors

**Error**: Component fails accessibility audit

**Handling**:
1. Run axe-core or similar tool to identify specific violations
2. Review WCAG guidelines for the violation type
3. Fix ARIA labels, roles, or keyboard navigation
4. Re-test with automated tools and manual testing
5. Test with actual screen readers (NVDA, JAWS, VoiceOver)

**Prevention**:
- Use Untitled UI components (built with React Aria for accessibility)
- Add accessibility tests to CI/CD pipeline
- Regular accessibility audits during development
- Accessibility checklist for each component

### Performance Errors

**Error**: Bundle size exceeds acceptable limits

**Handling**:
1. Analyze bundle with webpack-bundle-analyzer
2. Identify large dependencies or duplicate code
3. Implement code splitting and lazy loading
4. Remove unused component imports
5. Consider alternative lighter-weight components

**Prevention**:
- Monitor bundle size in CI/CD
- Set bundle size budgets and alerts
- Use dynamic imports for large components
- Regular bundle analysis during development

### Type Safety Errors

**Error**: TypeScript compilation errors after migration

**Handling**:
1. Review TypeScript error messages
2. Check component prop types match usage
3. Add missing type definitions
4. Fix type mismatches (e.g., string vs number)
5. Use type assertions only as last resort

**Prevention**:
- Enable strict TypeScript mode
- Use TypeScript for all component files
- Add type checking to pre-commit hooks
- Regular TypeScript version updates

## Testing Strategy

### Dual Testing Approach

The migration will use both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Both approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across many generated inputs.

### Unit Testing

**Framework**: Jest + React Testing Library

**Focus Areas**:
1. **Component rendering**: Verify components render with correct props
2. **User interactions**: Test clicks, keyboard input, form submissions
3. **Edge cases**: Empty states, loading states, error states
4. **Integration points**: Component composition and data flow

**Example Unit Tests**:

```typescript
// Button component
describe('Button', () => {
  it('renders with primary variant', () => {
    render(<Button variant="primary">Click me</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-primary-600');
  });

  it('shows loading spinner when loading prop is true', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

// Modal component
describe('Modal', () => {
  it('closes on ESC key press', () => {
    const handleClose = jest.fn();
    render(<Modal isOpen onClose={handleClose}>Content</Modal>);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalled();
  });

  it('traps focus within modal when open', () => {
    render(
      <Modal isOpen onClose={() => {}}>
        <button>First</button>
        <button>Last</button>
      </Modal>
    );
    const buttons = screen.getAllByRole('button');
    buttons[1].focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(buttons[0]).toHaveFocus();
  });
});
```

**Unit Test Guidelines**:
- Keep tests focused on single behaviors
- Use descriptive test names
- Avoid testing implementation details
- Test user-facing behavior, not internal state
- Aim for 80%+ code coverage on critical components

### Property-Based Testing

**Framework**: fast-check (JavaScript property-based testing library)

**Configuration**: Minimum 100 iterations per property test

**Focus Areas**:
1. **Component consistency**: All instances of a component type use the correct implementation
2. **Design token usage**: No hardcoded values in components
3. **Accessibility properties**: Keyboard navigation, ARIA labels, focus management
4. **Type safety**: All components have proper TypeScript types

**Example Property Tests**:

```typescript
import fc from 'fast-check';

/**
 * Feature: untitled-ui-cms-migration, Property 5: Button Component Consistency
 * 
 * For all button elements in the admin interface, they must use the Untitled UI 
 * Button component rather than native HTML button elements.
 */
describe('Property 5: Button Component Consistency', () => {
  it('all button elements use Button component', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...getAllAdminPagePaths()),
        async (pagePath) => {
          const fileContent = await fs.readFile(pagePath, 'utf-8');
          
          // Check for native button elements (not in Button component file)
          if (!pagePath.includes('components/ui/button')) {
            const nativeButtonRegex = /<button[^>]*>/g;
            const matches = fileContent.match(nativeButtonRegex) || [];
            
            // Allow button elements only if they're inside Button component usage
            const hasButtonComponent = fileContent.includes('from \'@/app/admin/components/ui/button\'');
            
            if (matches.length > 0 && !hasButtonComponent) {
              return false; // Found native button without Button import
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: untitled-ui-cms-migration, Property 4: No Hardcoded Color Classes
 * 
 * For all component files in the admin interface, they must not contain hardcoded 
 * Tailwind color classes and instead use semantic design tokens.
 */
describe('Property 4: No Hardcoded Color Classes', () => {
  it('no hardcoded color classes in components', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...getAllComponentPaths()),
        async (componentPath) => {
          const fileContent = await fs.readFile(componentPath, 'utf-8');
          
          // Regex for hardcoded color classes like bg-blue-600, text-red-500
          const hardcodedColorRegex = /(bg|text|border)-(?:blue|red|green|yellow|gray|purple|pink|indigo)-\d{2,3}/g;
          const matches = fileContent.match(hardcodedColorRegex) || [];
          
          // Allow in Tailwind config file
          if (componentPath.includes('tailwind.config')) {
            return true;
          }
          
          return matches.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: untitled-ui-cms-migration, Property 16: Keyboard Navigation Accessibility
 * 
 * For all interactive elements, they must be keyboard accessible with visible 
 * focus indicators.
 */
describe('Property 16: Keyboard Navigation Accessibility', () => {
  it('all interactive elements are keyboard accessible', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...getAllInteractiveComponents()),
        async (Component) => {
          const { container } = render(<Component />);
          const interactiveElements = container.querySelectorAll(
            'button, a, input, select, textarea, [tabindex]'
          );
          
          // All interactive elements should be focusable
          for (const element of interactiveElements) {
            const tabIndex = element.getAttribute('tabindex');
            if (tabIndex === '-1') continue; // Explicitly non-focusable
            
            element.focus();
            expect(document.activeElement).toBe(element);
            
            // Should have visible focus indicator
            const styles = window.getComputedStyle(element);
            const hasFocusRing = 
              styles.outline !== 'none' || 
              styles.boxShadow.includes('ring');
            
            expect(hasFocusRing).toBe(true);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: untitled-ui-cms-migration, Property 18: Color Contrast Compliance
 * 
 * For all text elements, they must maintain minimum color contrast ratio of 4.5:1 
 * for normal text to meet WCAG 2.1 Level AA standards.
 */
describe('Property 18: Color Contrast Compliance', () => {
  it('all text meets WCAG contrast requirements', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...getAllComponents()),
        async (Component) => {
          const { container } = render(<Component />);
          
          // Run axe accessibility audit
          const results = await axe(container);
          
          // Check for color contrast violations
          const contrastViolations = results.violations.filter(
            v => v.id === 'color-contrast'
          );
          
          return contrastViolations.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Property Test Guidelines**:
- Each property test must reference its design document property
- Use tag format: `Feature: untitled-ui-cms-migration, Property {number}: {property_text}`
- Run minimum 100 iterations per test
- Focus on universal properties, not specific examples
- Generate diverse test inputs to maximize coverage

### Visual Regression Testing

**Tool**: Percy or Chromatic

**Approach**:
1. Capture screenshots of all admin pages before migration
2. Capture screenshots after each component migration
3. Compare screenshots to detect unintended visual changes
4. Review and approve intentional changes
5. Fail CI/CD if unapproved changes detected

**Coverage**:
- All 14 admin sections
- All component states (default, hover, focus, disabled, loading, error)
- All viewport sizes (mobile, tablet, desktop)
- Light mode (dark mode if implemented)

### Accessibility Testing

**Tools**:
- axe-core (automated testing)
- NVDA, JAWS, VoiceOver (manual screen reader testing)
- Keyboard-only navigation testing

**Test Cases**:
1. **Keyboard navigation**: Tab through all interactive elements
2. **Screen reader**: Verify all content is announced correctly
3. **Focus management**: Focus moves logically, visible focus indicators
4. **ARIA labels**: All interactive elements have appropriate labels
5. **Color contrast**: All text meets WCAG 2.1 Level AA standards
6. **Form validation**: Error messages are announced to screen readers

### Integration Testing

**Framework**: Playwright or Cypress

**Test Scenarios**:
1. **Form submission**: Fill out form, submit, verify success
2. **Modal workflows**: Open modal, interact, close, verify state
3. **Table interactions**: Sort, filter, paginate, select rows
4. **Toast notifications**: Trigger action, verify toast appears and dismisses
5. **Navigation**: Navigate between pages, verify state persistence

### Performance Testing

**Tools**:
- Lighthouse (page load performance)
- webpack-bundle-analyzer (bundle size)
- React DevTools Profiler (component render performance)

**Metrics**:
- Bundle size: Track total size and per-component size
- Page load time: Measure time to interactive (TTI)
- Interaction response time: Measure time from click to UI update
- Memory usage: Monitor for memory leaks

**Thresholds**:
- Bundle size: < 500KB gzipped for admin bundle
- Page load time: < 2 seconds
- Interaction response time: < 100ms
- No memory leaks after 100 interactions

### Test Execution Strategy

**Development**:
- Run unit tests on file save (watch mode)
- Run property tests before committing
- Run accessibility tests on modified components

**CI/CD Pipeline**:
1. Lint and type check
2. Unit tests (all)
3. Property tests (all)
4. Integration tests (critical paths)
5. Visual regression tests (all pages)
6. Accessibility tests (automated)
7. Performance tests (bundle size, load time)
8. Build and deploy to preview environment

**Pre-Release**:
- Full test suite (all tests)
- Manual accessibility testing with screen readers
- Cross-browser testing (Chrome, Firefox, Safari, Edge)
- Performance audit with Lighthouse
- Security audit

### Rollback Strategy

**Trigger Conditions**:
- Critical bug discovered in production
- Accessibility regression detected
- Performance degradation > 20%
- User-reported issues > threshold

**Rollback Process**:
1. Identify problematic component or page
2. Revert to previous version via git
3. Deploy rollback to production
4. Investigate root cause
5. Fix issue in development
6. Re-test thoroughly
7. Re-deploy when ready

**Rollback Prevention**:
- Comprehensive testing before deployment
- Gradual rollout with feature flags
- Monitor error rates and performance metrics
- User acceptance testing (UAT) before production

