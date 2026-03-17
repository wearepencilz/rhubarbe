# Untitled UI Components

All CMS UI components live here. They wrap or re-export [Untitled UI React](https://www.untitledui.com/react/application-ui) components with project-specific defaults.

## Adding New Components

```bash
npx untitledui@latest add [component-name]
# When prompted, target: app/admin/components/ui/
```

Then create a thin wrapper or re-export file at `app/admin/components/ui/[component].tsx`.

---

## Components

### Button

```tsx
import { Button } from '@/app/admin/components/ui/button';

<Button variant="primary" size="md" onClick={...}>Save</Button>
<Button variant="secondary" size="sm">Cancel</Button>
<Button variant="danger" isDisabled={loading}>Delete</Button>
<Button variant="ghost" size="lg">View</Button>
```

Variants: `primary` | `secondary` | `tertiary` | `danger` | `ghost`
Sizes: `sm` | `md` | `lg`
Props: `isDisabled`, `isLoading`, `iconLeading`, `iconTrailing`

---

### Input

```tsx
import { Input } from '@/app/admin/components/ui/input';

// onChange receives the value string directly (not an event)
<Input value={name} onChange={(val) => setName(val)} placeholder="Name" />
<Input type="password" value={pw} onChange={(val) => setPw(val)} />
```

> Note: `onChange` receives `string`, not `React.ChangeEvent`.

---

### Textarea

```tsx
import { Textarea } from '@/app/admin/components/ui/textarea';

<Textarea value={notes} onChange={(val) => setNotes(val)} rows={4} />
```

---

### Select

```tsx
import { Select } from '@/app/admin/components/ui/select';

// onChange receives the selected value string directly
<Select
  value={status}
  onChange={(val) => setStatus(val)}
  options={[
    { id: 'active', label: 'Active' },
    { id: 'archived', label: 'Archived' },
  ]}
  placeholder="Select status"
/>
```

Options use `id` (not `value`) as the key.

---

### MultiSelect

```tsx
import { MultiSelect } from '@/app/admin/components/ui/multi-select';

<MultiSelect
  value={selectedIds}
  onChange={(ids) => setSelectedIds(ids)}
  options={[{ id: 'tag-1', label: 'Tag 1' }]}
  placeholder="Select tags"
/>
```

---

### DatePicker

```tsx
import { DatePicker } from '@/app/admin/components/ui/date-picker';
import { parseDate } from '@internationalized/date';

<DatePicker
  value={date ? parseDate(date) : null}
  onChange={(val) => setDate(val?.toString() ?? '')}
/>
```

---

### DateRangePicker

```tsx
import { DateRangePicker } from '@/app/admin/components/ui/date-range-picker';
import { parseDate } from '@internationalized/date';

<DateRangePicker
  value={start && end ? { start: parseDate(start), end: parseDate(end) } : null}
  onChange={(range) => {
    setStart(range?.start.toString() ?? '');
    setEnd(range?.end.toString() ?? '');
  }}
/>
```

---

### Modal

```tsx
import { Modal } from '@/app/admin/components/ui/modal';

<Modal isOpen={open} onClose={() => setOpen(false)} title="Confirm" size="sm">
  <p>Are you sure?</p>
  <div className="flex gap-3 mt-4">
    <Button variant="danger" onClick={handleConfirm}>Yes</Button>
    <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
  </div>
</Modal>
```

Sizes: `sm` | `md` | `lg` | `xl` | `full`

---

### Toast

```tsx
import { useToast } from '@/app/admin/components/ToastContainer';

const { success, error, warning, info } = useToast();

success('Saved successfully');
error('Something went wrong');
```

Wrap your page/layout with `<ToastProvider>` (already in admin layout).

---

### Badge

```tsx
import { Badge } from '@/app/admin/components/ui/badge';

<Badge variant="success">Active</Badge>
<Badge variant="warning">Draft</Badge>
<Badge variant="error">Archived</Badge>
<Badge variant="info">Scheduled</Badge>
<Badge variant="default">Unknown</Badge>
```

---

### Table (via DataTable)

Use the `DataTable` component for all list pages — it wraps the Untitled UI table with a standard header, filters slot, empty state, and row actions.

```tsx
import DataTable, { Column, Action } from '@/app/admin/components/DataTable';

const columns: Column<Item>[] = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status', render: (item) => <Badge variant="success">{item.status}</Badge> },
];

const actions: Action<Item>[] = [
  { label: 'Edit', href: (item) => `/admin/items/${item.id}` },
  { label: 'Delete', onClick: (item) => handleDelete(item.id), className: 'text-red-600 hover:text-red-900' },
];

<DataTable
  title="Items"
  createButton={{ label: 'New Item', href: '/admin/items/new' }}
  data={items}
  columns={columns}
  actions={actions}
  keyExtractor={(item) => item.id}
  onRowClick={(item) => router.push(`/admin/items/${item.id}`)}
  emptyMessage="No items yet"
/>
```

---

## Design Tokens

Semantic tokens are defined in `src/styles/theme.css` as CSS variables under `@theme`. Use them via Tailwind:

```tsx
// Primary brand color
className="bg-[--color-brand-600] text-white"

// Semantic status colors
className="text-[--color-success-700]"
className="bg-[--color-error-50] border-[--color-error-200]"
```

Prefer Untitled UI components over raw token classes — they handle theming automatically.

---

## Accessibility

- All interactive elements must have visible focus rings (handled by Untitled UI components)
- Use `aria-label` on icon-only buttons
- Tables use `role="table"`, `scope="col"` on headers, keyboard navigation on clickable rows
- Toasts use `role="alert"` and `aria-live="polite"`
- Modals trap focus and close on ESC
