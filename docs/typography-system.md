# Typography Token System

The storefront uses a centralized typography token system. Every font size, weight, line height, and font family on the storefront must reference a token — never use arbitrary pixel values or raw Tailwind classes for type.

## Architecture

```
lib/design/tokens.ts          ← Token definitions + CSS generation
components/DesignTokensStyle.tsx  ← Server component injecting CSS vars into <body>
app/admin/design/page.tsx     ← Admin editor (edit sizes, weights, font stacks)
src/styles/theme.css          ← Base font-face + font stack definitions (DO NOT edit)
```

**Flow:** `tokens.ts` defines 19 tokens → `DesignTokensStyle` reads them (or admin overrides from Settings) → injects `:root` CSS variables → components consume via `typeStyle()` or `var(--type-*)`.

## Font Stacks

| Key | Font | CSS Variable | Used For |
|---|---|---|---|
| `display` | Solar Display | `--type-font-display` | Section headings, hero text, display type |
| `body` | PP Neue Montreal | `--type-font-body` | Paragraphs, UI text, body copy |
| `mono` | ABC Diatype Mono | `--type-font-mono` | Labels, tags, captions, meta text |

The admin can override these at `/admin/design`. Overrides propagate to both the token vars (`--type-font-*`) and the legacy theme vars (`--font-solar-display`, `--font-neue-montreal`, `--font-diatype-mono`).

## Token Scale (19 tokens)

### Display (5) — Large headings, hero text

| Token | Desktop | Mobile | Stack | Used In |
|---|---|---|---|---|
| `display-xxl` | 90/90 · 600 | 60/60 · 600 | display | Step numbers (01, 02, 03) |
| `display-xl` | 80/76 · 700 | 36/34 · 700 | body | Journal hero, story cover, flavours hero |
| `display-lg` | 48/52 · 600 | 36/40 · 600 | display | Section titles (FAQ, Contact), order hero |
| `display-md` | 40/44 · 600 | 28/34 · 600 | display | Content 2-up card title, ingredient focus |
| `display-sm` | 36/44 · 600 | 24/32 · 600 | display | Quote text, featured story title, blockquote |

### Heading (5) — Section and card headings

| Token | Desktop | Mobile | Stack | Used In |
|---|---|---|---|---|
| `heading-xl` | 28/34 · 600 | 22/28 · 600 | display | Section subtitle, image-with-text title |
| `heading-lg` | 26/32 · 600 | 20/26 · 600 | display | Text/instructions title, two-column title |
| `heading-md` | 24/30 · 600 | 20/26 · 600 | display | FAQ topic, order page title, footer brand |
| `heading-sm` | 22/23 · 700 | 18/19 · 700 | body | Journal/story card title in grid |
| `heading-xs` | 20/26 · 600 | 16/22 · 600 | body | Home section titles, flavour name, mobile nav |

### Body (5) — Paragraphs, UI text

| Token | Desktop | Mobile | Stack | Used In |
|---|---|---|---|---|
| `body-xl` | 18/26 · 500 | 16/22 · 500 | body | FAQ question, cart panel title |
| `body-lg` | 17/27 · 400 | 15/24 · 400 | body | Story body, about paragraphs, page intro |
| `body-md` | 16/24 · 600 | 14/21 · 600 | display | Nav links, product title/price, form labels |
| `body-sm` | 15/22 · 400 | 14/20 · 400 | body | Page subtitle, thank-you body, contact body |
| `body-xs` | 14/20 · 400 | 13/18 · 400 | body | Meta text, card excerpt, button text, input label |

### Caption (4) — Small text, labels, tags

| Token | Desktop | Mobile | Stack | Used In |
|---|---|---|---|---|
| `caption-lg` | 13/20 · 400 | 12/18 · 400 | body | Flavour description, story card excerpt |
| `caption-md` | 12/18 · 500 | 11/16 · 500 | body | Image caption, footer copyright, order labels |
| `caption-sm` | 11/14 · 500 | 10/14 · 500 | mono | Section markers, meta dates, uppercase labels |
| `caption-xs` | 10/14 · 500 | 10/14 · 500 | mono | Tags/badges, attribution, share links |

Format: `fontSize/lineHeight · fontWeight`. Caption-sm and caption-xs also have `letter-spacing: 0.02em` and `text-transform: uppercase`.

## How to Use Tokens

### Preferred: `typeStyle()` helper

```tsx
import { typeStyle } from '@/lib/design/tokens';

// Returns a complete CSSProperties object reading from CSS vars
<h2 style={typeStyle('display-lg')}>Section Title</h2>
<p style={typeStyle('body-lg')}>Paragraph text here.</p>
<span style={typeStyle('caption-sm')}>CATEGORY · DATE</span>
```

`typeStyle()` returns:
```ts
{
  fontFamily: 'var(--type-display-lg-font)',
  fontSize: 'var(--type-display-lg-size)',
  lineHeight: 'var(--type-display-lg-line)',
  fontWeight: 'var(--type-display-lg-weight)',
  letterSpacing: 'var(--type-display-lg-spacing, normal)',
  textTransform: 'var(--type-display-lg-transform, none)',
}
```

Mobile responsiveness is automatic — the media query at 767px swaps the base vars to mobile values.

### Alternative: CSS variables directly

```tsx
<h2 style={{
  fontFamily: 'var(--type-display-lg-font)',
  fontSize: 'var(--type-display-lg-size)',
  lineHeight: 'var(--type-display-lg-line)',
  fontWeight: 'var(--type-display-lg-weight)',
}}>Title</h2>
```

Use this when you need to mix token values with other styles or only need a subset of properties.

### Combining with color

A common pattern (used in PageRenderer):

```tsx
const ts = (token: string) => ({ ...typeStyle(token), color: someColor });
<h2 style={ts('display-lg')}>Colored heading</h2>
```

## What NOT to Do

```tsx
// ❌ Arbitrary pixel sizes
<h2 className="text-[36px]">Title</h2>
<p style={{ fontSize: '17px' }}>Text</p>

// ❌ Raw font family vars without token sizing
<h2 style={{ fontFamily: 'var(--font-solar-display)', fontSize: '48px' }}>Title</h2>

// ❌ Tailwind text-* classes for storefront type
<p className="text-lg font-medium">Text</p>
```

Instead, find the matching token and use `typeStyle()`:

```tsx
// ✅ Token reference
<h2 style={typeStyle('display-lg')}>Title</h2>
<p style={typeStyle('body-lg')}>Text</p>
```

## CSS Variable Reference

For each token `{name}`, these CSS custom properties are available globally:

| Variable | Description |
|---|---|
| `--type-{name}-font` | Font family |
| `--type-{name}-size` | Font size (swaps to mobile at ≤767px) |
| `--type-{name}-line` | Line height (swaps to mobile at ≤767px) |
| `--type-{name}-weight` | Font weight (swaps to mobile at ≤767px) |
| `--type-{name}-spacing` | Letter spacing (only set on caption-sm, caption-xs) |
| `--type-{name}-transform` | Text transform (only set on caption-sm, caption-xs) |
| `--type-{name}-size-mobile` | Mobile font size (always available, even on desktop) |
| `--type-{name}-line-mobile` | Mobile line height |
| `--type-{name}-weight-mobile` | Mobile font weight |

## Responsive Behavior

The system handles mobile automatically via a `@media (max-width: 767px)` block that overrides `--type-{name}-size`, `--type-{name}-line`, and `--type-{name}-weight` with their mobile values. Components using `typeStyle()` or `var(--type-*-size)` get responsive sizing with zero extra work.

## Admin Editor

At `/admin/design`, the site owner can:
- Override font stacks (display, body, mono families)
- Edit desktop and mobile values for each token (size, line height, weight, letter spacing)
- Preview changes with contextual sample text

Overrides are stored in the Settings entity and loaded by `DesignTokensStyle` on every page render. The token list itself (names, categories) is fixed in code.

## Adding a New Token

Only add a new token if no existing one covers the size. To add one:

1. Add the entry to `DEFAULT_TOKENS` in `lib/design/tokens.ts`
2. Include a descriptive `usedIn` array
3. Update this doc and the steering rule at `.kiro/steering/typography-tokens.md`

## Updating `usedIn`

When you add a new component or page that uses a token, update the `usedIn` array in `lib/design/tokens.ts` so the admin editor shows where each token is used.
