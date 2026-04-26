---
inclusion: fileMatch
fileMatchPattern: "{app/**,components/**,lib/design/**,src/styles/**}"
description: Typography token system — all storefront font styles must use typeStyle() or token CSS vars from lib/design/tokens.ts.
---

# Typography Token System

## Rule (Non-Negotiable)

Every font size, weight, line height, and font family on any **storefront** page MUST reference a token from `lib/design/tokens.ts`. Do not use arbitrary pixel values, raw Tailwind `text-*` classes, or inline font sizes without a token link.

Full documentation: `docs/typography-system.md`

## Enforcement

When creating or modifying any storefront component or page:

1. **Use `typeStyle(tokenName)`** from `@/lib/design/tokens` for all text styling. This is the preferred API.
2. **Never use** `text-[Xpx]`, `fontSize: 'Xpx'`, or Tailwind `text-sm/lg/xl` for storefront type. Find the matching token instead.
3. **Font families** must come from tokens (`typeStyle()` includes it) or `var(--type-font-display|body|mono)`. Do not use `var(--font-solar-display)` directly for new code — use the token layer.
4. **Update `usedIn`** in `lib/design/tokens.ts` when adding a component that uses a token.
5. **Admin pages are exempt** — they use Untitled UI's own type system.

## Quick Reference: Picking a Token

| Need | Token | Desktop Size |
|---|---|---|
| Hero / splash text | `display-xxl` to `display-sm` | 90–36px |
| Section heading | `heading-xl` to `heading-xs` | 28–20px |
| Body paragraph | `body-lg` or `body-sm` | 17px / 15px |
| UI text (nav, labels, prices) | `body-md` or `body-xs` | 16px / 14px |
| Small labels, tags, meta | `caption-lg` to `caption-xs` | 13–10px |

## Token Scale (19 tokens)

| Token | Desktop | Mobile | Font Stack |
|---|---|---|---|
| `display-xxl` | 90px | 60px | display |
| `display-xl` | 80px | 36px | body |
| `display-lg` | 48px | 36px | display |
| `display-md` | 40px | 28px | display |
| `display-sm` | 36px | 24px | display |
| `heading-xl` | 28px | 22px | display |
| `heading-lg` | 26px | 20px | display |
| `heading-md` | 24px | 20px | display |
| `heading-sm` | 22px | 18px | body |
| `heading-xs` | 20px | 16px | body |
| `body-xl` | 18px | 16px | body |
| `body-lg` | 17px | 15px | body |
| `body-md` | 16px | 14px | display |
| `body-sm` | 15px | 14px | body |
| `body-xs` | 14px | 13px | body |
| `caption-lg` | 13px | 12px | body |
| `caption-md` | 12px | 11px | body |
| `caption-sm` | 11px | 10px | mono |
| `caption-xs` | 10px | 10px | mono |

## Usage Pattern

```tsx
import { typeStyle } from '@/lib/design/tokens';

<h2 style={typeStyle('display-lg')}>Title</h2>
<p style={typeStyle('body-lg')}>Paragraph</p>
<span style={typeStyle('caption-sm')}>LABEL</span>
```

Mobile responsiveness is automatic — CSS vars swap at 767px.

## When Adding or Editing Font Styles

1. **Check if an existing token covers the size.** Use the closest token.
2. **If no token fits**, add the usage to the `usedIn` array of the nearest token, or create a new token only if the size is genuinely new and distinct.
3. **Never use arbitrary font sizes** (`text-[17px]`, `fontSize: '19px'`) without mapping them to a token.
4. **Update the `usedIn` array** when adding a new component or page that uses a token.
5. **Font stacks**: Use `display` for headings, `body` for paragraphs, `mono` for labels/tags. Don't introduce new font families without adding them to `FONT_STACKS`.

## Files

| File | Role |
|---|---|
| `lib/design/tokens.ts` | Token definitions, `typeStyle()`, CSS generation |
| `components/DesignTokensStyle.tsx` | Server component injecting CSS vars |
| `app/admin/design/page.tsx` | Admin typography editor |
| `src/styles/theme.css` | Base font-face definitions (DO NOT modify) |
| `docs/typography-system.md` | Full documentation |
