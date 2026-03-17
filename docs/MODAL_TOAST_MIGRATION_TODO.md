# Modal & Toast Migration TODO

This document tracks the migration from browser `alert()` and `confirm()` to the new `ConfirmModal` and `Toast` system.

## ✅ Completed

- [x] Created `ConfirmModal` component with 4 variants (danger, warning, success, info)
- [x] Created `Toast` notification system with `ToastProvider`
- [x] Updated `EditPageLayout` to remove built-in modal
- [x] Migrated `app/admin/launches/[id]/page.tsx`
- [x] Migrated `app/admin/formats/[id]/page.tsx`

## 🔄 In Progress / TODO

### High Priority (User-Facing Actions)

- [ ] `app/admin/modifiers/[id]/page.tsx` - Delete confirmation
- [ ] `app/admin/settings/taxonomies/page.tsx` - Delete confirmation
- [ ] `app/admin/sprites/[id]/page.tsx` - Delete confirmation

### Seed Pages (Bulk Operations)

- [ ] `app/admin/seed/page.tsx` - Multiple confirms for seed operations
- [ ] `app/admin/flavours/seed/page.tsx` - Seed confirmations
- [ ] `app/admin/ingredients/seed/page.tsx` - Seed confirmations

### Error Handling (Replace alert with toast)

- [ ] `app/admin/flavours/create/page.tsx` - Error alerts
- [ ] `app/admin/flavours/page.tsx` - Delete error alerts
- [ ] `app/admin/flavours/[id]/page.tsx` - Load/save error alerts
- [ ] `app/admin/batches/page.tsx` - Delete error alert
- [ ] `app/admin/batches/create/page.tsx` - Create error alerts
- [ ] `app/admin/news/page.tsx` - Delete error alert
- [ ] `app/admin/news/[id]/page.tsx` - Save/upload error alerts
- [ ] `app/admin/ingredients/create/page.tsx` - Create error alerts
- [ ] `app/admin/ingredients/[id]/page.tsx` - Load/save error alerts
- [ ] `app/admin/ingredients/page.tsx` - Delete error alerts (with blockers)
- [ ] `app/admin/formats/create/page.tsx` - Create error alerts
- [ ] `app/admin/formats/page.tsx` - Delete error alerts
- [ ] `app/admin/products/page.tsx` - Delete error alerts
- [ ] `app/admin/pages/[pageName]/page.tsx` - Save alerts

### Component-Level

- [ ] `app/admin/components/FlavourIngredientSelector.tsx` - Create ingredient alerts
- [ ] `app/admin/components/TaxonomyTagSelect.tsx` - Create taxonomy error alert
- [ ] `app/admin/components/TaxonomyMultiSelect.tsx` - Create taxonomy error alert
- [ ] `app/admin/games/[id]/ResetCampaignButton.tsx` - Success alert (replace with toast)

## Migration Pattern

### For Delete Confirmations

```tsx
// 1. Add imports
import { useToast } from '@/app/admin/components/ToastContainer';
import ConfirmModal from '@/app/admin/components/ConfirmModal';

// 2. Add state and hook
const toast = useToast();
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [deleteTarget, setDeleteTarget] = useState<{id: string, name: string} | null>(null);

// 3. Update delete handler
const handleDeleteClick = (item) => {
  setDeleteTarget({ id: item.id, name: item.name });
  setShowDeleteModal(true);
};

const handleDeleteConfirm = async () => {
  try {
    const response = await fetch(`/api/items/${deleteTarget.id}`, { method: 'DELETE' });
    if (response.ok) {
      toast.success('Item deleted', `${deleteTarget.name} has been removed`);
      // Update state
    } else {
      const error = await response.json();
      toast.error('Delete failed', error.error || 'Unable to delete item');
    }
  } catch (error) {
    toast.error('Delete failed', 'Unable to delete item');
  } finally {
    setShowDeleteModal(false);
    setDeleteTarget(null);
  }
};

// 4. Add modal to JSX
<ConfirmModal
  isOpen={showDeleteModal}
  variant="danger"
  title="Delete Item"
  message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
  confirmLabel="Delete"
  cancelLabel="Cancel"
  onConfirm={handleDeleteConfirm}
  onCancel={() => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
  }}
/>
```

### For Error Alerts

```tsx
// Replace this:
alert('Failed to save');

// With this:
toast.error('Save failed', 'Unable to save changes');
```

### For Success Alerts

```tsx
// Replace this:
alert('Saved successfully');

// With this:
toast.success('Saved', 'Your changes have been saved');
```

### For Seed Confirmations

```tsx
// Replace this:
if (!confirm('Are you sure you want to seed?')) return;

// With this:
const [showSeedModal, setShowSeedModal] = useState(false);

<ConfirmModal
  isOpen={showSeedModal}
  variant="warning"
  title="Seed Database"
  message={`Are you sure you want to seed in '${mode}' mode? This will modify your database.`}
  confirmLabel="Seed"
  cancelLabel="Cancel"
  onConfirm={handleSeedConfirm}
  onCancel={() => setShowSeedModal(false)}
/>
```

## Benefits

- ✅ Consistent UX across the entire CMS
- ✅ No more browser-native dialogs
- ✅ Better accessibility
- ✅ Keyboard support (ESC to close)
- ✅ Visual feedback with icons and colors
- ✅ Non-blocking notifications for success/error
- ✅ Blocking confirmations for destructive actions

## Notes

- All `DeleteModal` components should be replaced with `ConfirmModal`
- The `DeleteModal` component can be deprecated after migration
- Toast notifications auto-dismiss after 5 seconds (configurable)
- Modals require explicit user action (confirm or cancel)
