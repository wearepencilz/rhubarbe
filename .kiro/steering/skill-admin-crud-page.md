---
inclusion: manual
description: Skill — Scaffold a new admin CRUD page set (list, edit, create) following project conventions.
---

# Skill: Admin CRUD Page

Use this skill when creating a new admin section with list, edit, and create pages.

## File Structure

For a resource called `[resource]` (e.g. `stories`, `ingredients`):

```
app/admin/[resource]/page.tsx          # List page
app/admin/[resource]/[id]/page.tsx     # Edit page
app/admin/[resource]/create/page.tsx   # Create page
```

## List Page Pattern (`page.tsx`)

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/app/admin/components/ConfirmModal';
import { useToast } from '@/app/admin/components/ToastContainer';
import { Button } from '@/app/admin/components/ui/button';
import { Edit01, Trash01 } from '@untitledui/icons';

export default function ResourceListPage() {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: '', name: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/[resource]?pageSize=500');
      if (res.ok) {
        const data = await res.json();
        setItems(data.data || data);
      }
    } catch (error) {
      console.error('Error fetching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/[resource]/${deleteConfirm.id}`, { method: 'DELETE' });
    if (res.ok) {
      setItems(items.filter((i) => i.id !== deleteConfirm.id));
      toast.success('Deleted', `"${deleteConfirm.name}" has been removed`);
    } else {
      const error = await res.json();
      toast.error('Delete failed', error.error || 'Failed to delete');
    }
    setDeleteConfirm({ show: false, id: '', name: '' });
  };

  // ... render table with search, filters, row actions, empty state
}
```

Key conventions:
- Always `'use client'`
- Fetch on mount with `useEffect`
- `useToast()` for success/error feedback
- `ConfirmModal` before delete (variant `"danger"`)
- Row click navigates to edit page via `router.push`
- Status/category badges using `BadgeWithDot` from `@/app/admin/components/ui/nav/badges`
- Empty state with a CTA linking to the create page

## Edit Page Pattern (`[id]/page.tsx`)

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EditPageLayout from '@/app/admin/components/EditPageLayout';
import ImageUploader from '@/app/admin/components/ImageUploader';
import { Input } from '@/app/admin/components/ui/input';
import { Textarea } from '@/app/admin/components/ui/textarea';
import { useToast } from '@/app/admin/components/ToastContainer';

const emptyForm = { /* all fields with defaults */ };

export default function EditResourcePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const set = (patch: Partial<typeof emptyForm>, touch = true) => {
    if (touch) {
      setTouchedFields((prev) => {
        const next = new Set(prev);
        Object.keys(patch).forEach((k) => next.add(k));
        return next;
      });
    }
    setFormData((p) => ({ ...p, ...patch }));
  };

  useEffect(() => {
    fetch(`/api/[resource]/${params.id}`)
      .then(res => res.json())
      .then(data => { setFormData(data); setLoading(false); });
  }, [params.id]);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/[resource]/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (res.ok) toast.success('Saved', 'Changes saved successfully');
    else toast.error('Error', 'Failed to save');
    setSaving(false);
  };

  // Wrap in EditPageLayout, use SectionCard for form groups
}
```

Key conventions:
- Wrap in `EditPageLayout` with `backHref`, `onSave`, `onDelete`, `onCancel`, `isDirty`
- Group fields in `SectionCard` components (collapsible sections)
- `set()` helper tracks touched fields (important for AI autofill compatibility)
- Save via PUT, delete via DELETE
- Use `TaxonomySelect` / `TaxonomyTagPicker` for taxonomy fields
- Use `ImageUploader` for image fields

## Create Page Pattern (`create/page.tsx`)

Nearly identical to edit page but:
- POST to `/api/[resource]` instead of PUT
- All fields start empty (use `emptyForm`)
- On success, redirect to edit page: `router.push('/admin/[resource]/${newItem.id}')`
- No delete button in `EditPageLayout`

## Shared Components Reference

| Component | Import | Purpose |
|---|---|---|
| `EditPageLayout` | `@/app/admin/components/EditPageLayout` | Page wrapper with save/delete/back |
| `DataTable` | `@/app/admin/components/DataTable` | Generic table with filters |
| `ConfirmModal` | `@/app/admin/components/ConfirmModal` | Confirmation dialog (danger/warning/success/info) |
| `DeleteModal` | `@/app/admin/components/DeleteModal` | Delete-specific confirmation |
| `ImageUploader` | `@/app/admin/components/ImageUploader` | Drag-drop image upload |
| `Toast` / `useToast` | `@/app/admin/components/ToastContainer` | Toast notifications |
| `TaxonomySelect` | `@/app/admin/components/TaxonomySelect` | Single taxonomy dropdown |
| `TaxonomyTagPicker` | `@/app/admin/components/TaxonomyTagPicker` | Multi-select taxonomy tags |
| `Button` | `@/app/admin/components/ui/button` | Untitled UI button |
| `Input` | `@/app/admin/components/ui/input` | Untitled UI input |
| `Textarea` | `@/app/admin/components/ui/textarea` | Untitled UI textarea |
| `Modal` | `@/app/admin/components/ui/modal` | Untitled UI modal |
| `Badge` / `BadgeWithDot` | `@/app/admin/components/ui/nav/badges` | Status/category badges |

## Styling Rules

- Tailwind utility classes only, no custom CSS
- Primary actions: `bg-blue-600 hover:bg-blue-700`
- Form inputs: `border-gray-300 focus:border-blue-500 focus:ring-blue-500`
- Section cards: `bg-white rounded-lg border border-gray-200`
- Consistent hover states and focus rings on all interactive elements
