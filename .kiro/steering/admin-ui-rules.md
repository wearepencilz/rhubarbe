---
inclusion: auto
description: Admin UI rules — Untitled UI components, Tailwind conventions, form/table/modal patterns, and auth.
---

# Admin UI Rules

## Design System: Untitled UI

All admin components must follow [Untitled UI React](https://www.untitledui.com/react/application-ui) patterns.

**Before building any UI component**, check if an Untitled UI component exists:

```bash
npx untitledui@latest add [component-name]
# Specify output: app/admin/components/ui
```

Common components available via CLI: `date-picker`, `date-range-picker`, `input`, `textarea`, `select`, `button`, `modal`, `table`

Only build custom components if no suitable Untitled UI component exists.

## Tailwind Conventions

- Tailwind utility classes only — no custom CSS, no CSS modules
- Primary actions: `bg-blue-600 hover:bg-blue-700`
- Secondary/neutral: gray scale (`gray-100` through `gray-900`)
- Form inputs: `border-gray-300 focus:border-blue-500 focus:ring-blue-500`
- Consistent hover states and focus rings on all interactive elements

## Component Patterns

### Forms
- Use React Hook Form for all forms
- Validation errors displayed inline below the field
- Submit button disabled while loading
- Success/error feedback via toast (not alert())

### Tables / List Views
- Sortable columns where relevant
- Status badges using colored dots + text
- Row actions (edit, delete) in the rightmost column
- Empty state with a clear call-to-action

### Modals
- Use for confirmations (delete) and quick edits
- Always include a cancel action
- Focus trap inside modal
- Close on backdrop click and Escape key

### Image Uploads
- Show preview after selection
- Accept: `image/jpeg, image/png, image/webp, image/gif, image/svg+xml`
- Dev: POST to `/api/upload` → stored in `public/uploads/`
- Prod: POST to `/api/upload` → stored in Vercel Blob

## File & Component Conventions

- Pages: `app/admin/[section]/page.tsx` (lowercase, hyphenated)
- Components: `PascalCase.tsx` in `app/admin/components/`
- Untitled UI components: `app/admin/components/ui/`
- All admin pages are Server Components by default; add `'use client'` only when needed

## Auth

- All `/admin/*` routes are protected by `middleware.ts`
- Unauthenticated users redirect to `/admin/login`
- Session via NextAuth JWT
- Default credentials: `admin / admin123` (change in production)

## Protected Files — Do Not Revert

The following files have been intentionally redesigned and must not be reverted to previous versions:

- `app/admin/taxonomies/page.tsx` — sidebar-based layout with grouped categories (Ingredients, Flavours, Formats & Modifiers, Launches, Stories). Do not replace with the tab-based layout from `app/admin/settings/taxonomies/page.tsx`.
- `app/admin/ingredients/[id]/page.tsx` — sectioned layout (Basics, Story & Provenance, Sensory & Culinary Profile, Sourcing, Usage, Operational). Do not revert to the single-card form.
- `app/admin/ingredients/create/page.tsx` — mirrors the edit page section structure above.
