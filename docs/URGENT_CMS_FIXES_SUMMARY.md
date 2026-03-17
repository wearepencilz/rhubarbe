# Urgent CMS Fixes Summary

## Critical Issues Fixed

### 1. ✅ Data Loss Prevention
- **Problem**: Vitest was running in watch mode, continuously overwriting data files with test data
- **Solution**: Killed vitest process, documented the issue
- **Action Required**: Never run `npm test` during development. Only use `npm run test:run`

### 2. ✅ Product Deletion
- **Problem**: Products couldn't be deleted if referenced in launches
- **Solution**: Updated DELETE endpoint to remove product from launches instead of blocking deletion

### 3. ✅ Modal Background Consistency
- **Problem**: Modals had inconsistent background styles
- **Solution**: Standardized all modals to use `bg-black/30 backdrop-blur-sm`

### 4. ✅ Page Title
- **Problem**: Products page said "Menu Items"
- **Solution**: Changed to "Products"

## Outstanding Issues (Need Implementation)

### 1. ESC Key Should Close Modals
**Affected Files:**
- `app/admin/components/ShopifyProductPicker.tsx`
- `app/admin/components/FlavourIngredientSelector.tsx`
- All delete confirmation modals

**Fix Needed:**
```typescript
useEffect(() => {
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowModal(false);
    }
  };
  
  if (showModal) {
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }
}, [showModal]);
```

### 2. Delete Buttons on List Pages
**Pages Missing Delete:**
- `app/admin/modifiers/page.tsx`
- `app/admin/launches/page.tsx`
- `app/admin/products/page.tsx`

**Pages with Delete (Good Examples):**
- `app/admin/flavours/page.tsx` ✓
- `app/admin/ingredients/page.tsx` ✓
- `app/admin/formats/page.tsx` ✓

**Fix Needed**: Add delete button to each card/row with proper confirmation modal

### 3. Clickable Table Rows/Cards
**Pages with Non-Clickable Rows:**
- `app/admin/flavours/page.tsx`
- `app/admin/ingredients/page.tsx`

**Pages with Clickable Rows (Good Examples):**
- `app/admin/modifiers/page.tsx` ✓
- `app/admin/launches/page.tsx` ✓
- `app/admin/products/page.tsx` ✓

**Fix Needed**: Wrap entire row/card in Link or add onClick handler

### 4. Standardize Image Upload
**Pages Using ImageUploader (Good):**
- `app/admin/ingredients/[id]/page.tsx` ✓

**Pages Needing ImageUploader:**
- `app/admin/launches/[id]/page.tsx` - has `heroImage` field using text input
- `app/admin/formats/create/page.tsx` - has `image` field
- `app/admin/modifiers/[id]/page.tsx` - has `image` field

**Fix Needed**: Replace text inputs with:
```typescript
<ImageUploader
  value={formData.image}
  onChange={(url) => setFormData({ ...formData, image: url })}
  altText={formData.imageAlt}
  onAltTextChange={(alt) => setFormData({ ...formData, imageAlt: alt })}
  aspectRatio="16:9"
  label="Hero Image"
/>
```

### 5. Lost Data - Needs Manual Restoration
**Taxonomy Data**: Settings were reset to minimal taxonomies
**Modifiers Data**: Only 1 modifier remains (Premium Nuts)

**Action Required**:
1. Check git history for previous settings.json and modifiers.json
2. Manually recreate taxonomy values in `/admin/settings/taxonomies`
3. Manually recreate modifiers in `/admin/modifiers`

## Implementation Priority

1. **HIGH**: Restore lost taxonomy and modifiers data (manual work)
2. **HIGH**: Add ESC key handling to modals (affects UX significantly)
3. **MEDIUM**: Add delete buttons to list pages (consistency)
4. **MEDIUM**: Make table rows clickable (UX improvement)
5. **LOW**: Standardize image upload fields (nice to have)

## Files to Modify

### ESC Key (2 files):
- app/admin/components/ShopifyProductPicker.tsx
- app/admin/components/FlavourIngredientSelector.tsx

### Delete Buttons (3 files):
- app/admin/modifiers/page.tsx
- app/admin/launches/page.tsx
- app/admin/products/page.tsx

### Clickable Rows (2 files):
- app/admin/flavours/page.tsx
- app/admin/ingredients/page.tsx

### Image Upload (3 files):
- app/admin/launches/[id]/page.tsx
- app/admin/formats/create/page.tsx
- app/admin/modifiers/[id]/page.tsx

## Estimated Time
- ESC key: 30 minutes
- Delete buttons: 1 hour
- Clickable rows: 30 minutes
- Image upload: 1 hour
- **Total**: ~3 hours of development work

## Next Steps
1. Restore lost data from git or manually recreate
2. Implement ESC key handling
3. Add delete buttons to list pages
4. Make rows clickable
5. Standardize image uploads
6. Test all changes
7. Commit and push
