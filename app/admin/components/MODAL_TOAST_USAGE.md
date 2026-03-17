# Modal & Toast Usage Guide

This guide shows how to use the unified `ConfirmModal` and `Toast` notification system across the CMS.

## Toast Notifications (Non-blocking updates)

Use toasts for success messages, errors, warnings, and info that don't require user action.

### Setup

The `ToastProvider` is already configured in `app/admin/layout.tsx`, so you just need to import the hook:

```tsx
import { useToast } from '@/app/admin/components/ToastContainer';

function MyComponent() {
  const toast = useToast();
  
  // Use toast methods
}
```

### Toast Methods

```tsx
// Success (green)
toast.success('Product created', 'Your product has been successfully created');

// Error (red)
toast.error('Failed to save', 'Please check your connection and try again');

// Warning (yellow)
toast.warning('Unsaved changes', 'You have unsaved changes that will be lost');

// Info (blue)
toast.info('Tip', 'You can use keyboard shortcuts to navigate faster');
```

### Complete Example

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/admin/components/ToastContainer';

export default function ProductForm() {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save');

      toast.success('Product saved', 'Your changes have been saved successfully');
      router.push('/admin/products');
    } catch (error) {
      toast.error('Save failed', 'Unable to save product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <button onClick={handleSave} disabled={saving}>
      {saving ? 'Saving...' : 'Save Product'}
    </button>
  );
}
```

## Confirm Modal (Blocking confirmations)

Use modals for actions that require explicit user confirmation (delete, publish, etc.).

### Import

```tsx
import ConfirmModal from '@/app/admin/components/ConfirmModal';
```

### Modal Variants

- `danger` (red) - Destructive actions like delete
- `warning` (yellow) - Caution actions like unpublish
- `success` (green) - Positive confirmations like publish
- `info` (blue) - Informational confirmations

### Complete Example

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/admin/components/ToastContainer';
import ConfirmModal from '@/app/admin/components/ConfirmModal';

export default function ProductsPage() {
  const router = useRouter();
  const toast = useToast();
  
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    id: '',
    name: '',
  });

  const [publishModal, setPublishModal] = useState({
    show: false,
    id: '',
    name: '',
  });

  // Delete confirmation (danger variant)
  const handleDeleteClick = (id: string, name: string) => {
    setDeleteModal({ show: true, id, name });
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`/api/products/${deleteModal.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      toast.success('Product deleted', `${deleteModal.name} has been removed`);
      setDeleteModal({ show: false, id: '', name: '' });
      // Refresh data
    } catch (error) {
      toast.error('Delete failed', 'Unable to delete product');
    }
  };

  // Publish confirmation (success variant)
  const handlePublishClick = (id: string, name: string) => {
    setPublishModal({ show: true, id, name });
  };

  const handlePublishConfirm = async () => {
    try {
      const response = await fetch(`/api/products/${publishModal.id}/publish`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to publish');

      toast.success('Product published', `${publishModal.name} is now live`);
      setPublishModal({ show: false, id: '', name: '' });
      // Refresh data
    } catch (error) {
      toast.error('Publish failed', 'Unable to publish product');
    }
  };

  return (
    <>
      {/* Your page content */}
      
      {/* Delete Modal */}
      <ConfirmModal
        isOpen={deleteModal.show}
        variant="danger"
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteModal.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ show: false, id: '', name: '' })}
      />

      {/* Publish Modal */}
      <ConfirmModal
        isOpen={publishModal.show}
        variant="success"
        title="Publish Product"
        message={`Ready to publish "${publishModal.name}"? It will be visible to customers immediately.`}
        confirmLabel="Publish"
        cancelLabel="Cancel"
        onConfirm={handlePublishConfirm}
        onCancel={() => setPublishModal({ show: false, id: '', name: '' })}
      />
    </>
  );
}
```

## When to Use What

### Use Toast for:
- ✅ Success confirmations (saved, created, updated)
- ❌ Error messages (failed to save, network error)
- ⚠️ Warnings (unsaved changes, quota limits)
- ℹ️ Info messages (tips, status updates)
- Non-blocking notifications
- Background process updates

### Use Modal for:
- 🗑️ Delete confirmations
- 📤 Publish/unpublish actions
- ⚠️ Destructive operations
- 🔄 Sync operations with Shopify
- 🎯 Actions requiring explicit user choice
- Blocking confirmations that need attention

## Migration from DeleteModal

Replace this:

```tsx
import DeleteModal from '@/app/admin/components/DeleteModal';

<DeleteModal
  isOpen={deleteConfirm.show}
  title="Delete Product"
  message={`Are you sure you want to delete "${deleteConfirm.name}"?`}
  onConfirm={handleDelete}
  onCancel={() => setDeleteConfirm({ show: false, id: '', name: '' })}
/>
```

With this:

```tsx
import ConfirmModal from '@/app/admin/components/ConfirmModal';

<ConfirmModal
  isOpen={deleteConfirm.show}
  variant="danger"
  title="Delete Product"
  message={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
  confirmLabel="Delete"
  cancelLabel="Cancel"
  onConfirm={handleDelete}
  onCancel={() => setDeleteConfirm({ show: false, id: '', name: '' })}
/>
```

## Best Practices

1. **Always provide context** - Include the item name in confirmation messages
2. **Use appropriate variants** - Match the severity to the action
3. **Toast for feedback** - After modal confirmation, show a toast with the result
4. **Keep messages concise** - Clear, actionable text
5. **Handle errors gracefully** - Show error toasts when operations fail
6. **Consistent labels** - Use "Delete" for delete, "Publish" for publish, etc.
