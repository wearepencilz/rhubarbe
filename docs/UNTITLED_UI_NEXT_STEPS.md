# Untitled UI Integration - Next Steps

## Current Status

Attempted to integrate Untitled UI React components with Tailwind CSS v4, but encountered compatibility issues with Next.js 14.2.

## Issue Summary

Untitled UI React requires:
- Tailwind CSS v4
- `@tailwindcss/postcss` plugin
- CSS-based configuration using `@theme` directive

However, Next.js 14.2 has compatibility issues with Tailwind v4's new architecture, resulting in build failures.

## Recommended Approaches

### Option 1: Use Untitled UI CSS/Figma Design System (Recommended)

Instead of using Untitled UI React components directly, follow their design patterns manually:

1. Keep existing Tailwind v3 setup
2. Reference Untitled UI design tokens from their documentation
3. Manually implement components following Untitled UI patterns
4. Use their Figma files as design reference

**Pros:**
- Works with current Next.js setup
- No breaking changes
- Full control over implementation
- Maintains existing CMS functionality

**Cons:**
- More manual work
- Need to maintain design consistency manually

### Option 2: Wait for Next.js 15 + Tailwind v4 Stability

Wait for official Next.js support for Tailwind v4:

1. Monitor Next.js 15 release (expected Q2 2026)
2. Check Vercel's official Tailwind v4 integration guide
3. Migrate when stable

**Pros:**
- Official support and documentation
- Fewer compatibility issues
- Better long-term stability

**Cons:**
- Delays Untitled UI component usage
- Current CMS remains with custom styling

### Option 3: Use Alternative Component Library

Consider component libraries that work with Tailwind v3:

- **shadcn/ui** - Similar design system, Tailwind v3 compatible
- **Headless UI** - Unstyled components from Tailwind team
- **Radix UI** - Accessible primitives with Tailwind styling

**Pros:**
- Immediate implementation
- Good documentation and community
- Works with current setup

**Cons:**
- Different design system than Untitled UI
- Need to adapt existing CMS pages

## Immediate Action Plan

### Short Term (This Week)

1. **Revert to Tailwind v3** for stable builds
2. **Document Untitled UI design patterns** we want to follow
3. **Create component style guide** based on Untitled UI
4. **Implement key components manually**:
   - Date pickers (for launch dates)
   - Form inputs (consistent styling)
   - Buttons (primary, secondary, destructive)
   - Tables (for list pages)

### Medium Term (Next Month)

1. **Evaluate shadcn/ui** as alternative
2. **Create reusable component library** in `app/admin/components/ui/`
3. **Migrate existing pages** to use new components
4. **Document component usage** in steering files

### Long Term (Q2-Q3 2026)

1. **Monitor Next.js 15 release**
2. **Test Tailwind v4 compatibility**
3. **Plan migration to Untitled UI React** when stable
4. **Gradual component replacement**

## Design Consistency Guidelines

Until we can use Untitled UI React directly, follow these patterns:

### Colors
```css
/* Primary Actions */
bg-blue-600 hover:bg-blue-700

/* Secondary Actions */
border-gray-300 hover:bg-gray-50

/* Destructive Actions */
bg-red-600 hover:bg-red-700

/* Text */
text-gray-900 (primary)
text-gray-700 (secondary)
text-gray-600 (tertiary)
```

### Form Inputs
```tsx
<input
  className="w-full px-4 py-2 border border-gray-300 rounded-lg 
             focus:outline-none focus:ring-2 focus:ring-blue-500 
             focus:border-blue-500"
/>
```

### Buttons
```tsx
// Primary
<button className="px-6 py-2 bg-blue-600 text-white rounded-lg 
                   hover:bg-blue-700 transition-colors">

// Secondary
<button className="px-6 py-2 border border-gray-300 rounded-lg 
                   hover:bg-gray-50 transition-colors">
```

### Spacing
- Use consistent padding: `p-6` for cards, `p-4` for smaller containers
- Use `space-y-4` for vertical spacing
- Use `gap-4` for flex/grid layouts

## Files Modified in This Attempt

- `package.json` - Added Tailwind v4 packages
- `postcss.config.mjs` - Updated for @tailwindcss/postcss
- `src/styles/globals.css` - Created with Tailwind v4 syntax
- `src/styles/theme.css` - Added Untitled UI theme tokens
- `app/layout.tsx` - Updated CSS imports
- Deleted: `tailwind.config.js`, `postcss.config.js` (old configs)

## Rollback Instructions

If needed, revert to previous working state:

```bash
# Revert the last commit
git revert HEAD

# Or reset to before Tailwind v4 attempt
git reset --hard 9c5d51d

# Reinstall dependencies
npm install

# Test build
npm run build
```

## References

- [Untitled UI React Docs](https://www.untitledui.com/react/docs)
- [Tailwind CSS v4 Alpha](https://tailwindcss.com/blog/tailwindcss-v4-alpha)
- [Next.js + Tailwind CSS](https://nextjs.org/docs/app/building-your-application/styling/tailwind-css)
- [shadcn/ui](https://ui.shadcn.com/)

## Decision

**Recommended: Option 1 - Use Untitled UI Design System Manually**

This provides the best balance of:
- Immediate progress on CMS design consistency
- No breaking changes to existing functionality
- Flexibility to migrate to Untitled UI React later
- Maintains stable build process

Next commit should revert Tailwind v4 changes and implement manual Untitled UI patterns.
