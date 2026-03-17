# Recent Changes Summary

## Image Upload Fix & Testing Infrastructure

### Issues Fixed

1. **Image Upload Preview Not Working**
   - Root cause: Images uploaded to API server (port 3001) but frontend tried to load from Vite dev server (port 5173)
   - Solution: Created `getImageUrl()` utility that prepends API_URL in development
   - All image references now use this utility for consistent behavior

2. **Button Hover Color**
   - Changed hover color from `#e7fe89` to `#89FED7` (cyan)
   - Applied to both hero buttons and UI buttons

3. **CMS Improvements**
   - Added drag-and-drop reordering for lists (services, about items, hero buttons)
   - Made list items collapsible with meaningful titles
   - Reduced CMS page width to 600px for better readability
   - Separated sections into distinct card blocks

4. **SVG Preview**
   - Changed image preview from `object-cover` to `object-contain`
   - SVGs and images now display fully without cropping

### New Features

#### Automated Testing
Created comprehensive testing infrastructure to catch errors before deployment:

**Test Commands:**
- `npm run test:smoke` - Fast smoke tests (~1 second)
- `npm run validate` - Full validation (tests + build)
- `./scripts/validate.sh` - Shell script with detailed output

**What Gets Tested:**
- Component imports (syntax errors)
- Utility functions (image URL handling)
- Component rendering (runtime errors)
- Build completion
- Duplicate imports detection

**CI/CD:**
- GitHub Actions workflow runs on every push/PR
- Automatically validates tests and build

### Files Changed

**New Files:**
- `src/utils/imageUrl.js` - Image URL utility
- `src/components/ui/SortableList.jsx` - Drag-and-drop component
- `src/test/smoke.test.jsx` - Smoke tests
- `scripts/validate.sh` - Validation script
- `.github/workflows/ci.yml` - CI workflow
- `TESTING.md` - Testing documentation

**Modified Files:**
- All image-displaying components now use `getImageUrl()`
- `src/components/Button.jsx` - Hover color updated
- `src/components/ui/FileInput.jsx` - Better preview handling
- `src/cms/SettingsForm.jsx` - New layout with sortable lists
- `src/cms/HomePageForm.jsx` - New layout with sortable lists
- `package.json` - Added test scripts

### Dependencies Added
- `@dnd-kit/core` - Drag and drop core
- `@dnd-kit/sortable` - Sortable lists
- `@dnd-kit/utilities` - DnD utilities

### How to Use

**Before committing large changes:**
```bash
npm run validate
```

**Image uploads now work because:**
- Development: `/uploads/image.jpg` → `http://localhost:3001/uploads/image.jpg`
- Production: `/uploads/image.jpg` → `/uploads/image.jpg` (same origin)

**Reorder CMS lists:**
- Drag items by the handle icon
- Click to expand/collapse
- Items show their actual title (not "Item 1, 2, 3")

### Testing Results
✅ All 13 smoke tests passing
✅ Build completes successfully
✅ No duplicate imports
✅ No critical issues

### Next Steps
- Run `npm run validate` before major commits
- Image uploads should now work correctly in both dev and production
- CMS is more user-friendly with drag-and-drop
