# Typography Token System — Portable Spec

## The Problem It Solves

Without a system, font sizes drift. Designers spec 17px body text, developers write `text-lg` (18px) or `text-[17px]`. Mobile sizes are ad-hoc. Font families get referenced 14 different ways. Six months in, you have 40 unique font-size declarations and no way to change them globally.

This system enforces a fixed scale of 19 tokens that cover every text style on the site. Each token defines desktop + mobile values. Components never use arbitrary sizes — they reference a token. The admin can edit every value from the CMS without a deploy.

---

## Architecture (4 files)

```
lib/design/tokens.ts              ← Token definitions + typeStyle() helper + CSS generation
components/DesignTokensStyle.tsx   ← Server component: reads tokens → injects :root CSS vars
app/admin/design/page.tsx          ← Admin UI: edit all values, live preview, save to DB
src/styles/theme.css               ← Base @font-face + font stack CSS vars (never edited at runtime)
```

### Data Flow

```
tokens.ts (defaults)
    ↓
DesignTokensStyle (server component in root layout)
    reads DB overrides (if any) → merges with defaults
    ↓
<style> tag in <body> with :root { --type-* vars }
    ↓
Components consume via typeStyle('token-name') or var(--type-*)
```

---

## Token Structure

Each token defines a complete text style for desktop and mobile:

```typescript
interface TypeToken {
  name: string;           // e.g. 'display-lg', 'body-sm', 'caption-xs'
  label: string;          // Human-readable: 'Display LG'
  category: 'display' | 'heading' | 'body' | 'caption';
  fontFamily: 'display' | 'body' | 'mono';  // maps to a font stack
  desktop: {
    fontSize: number;
    lineHeight: number;
    fontWeight: number;
    letterSpacing?: string;
    textTransform?: string;
  };
  mobile: {
    fontSize: number;
    lineHeight: number;
    fontWeight: number;
    letterSpacing?: string;
    textTransform?: string;
  };
  usedIn: string[];       // tracks every component/page using this token
}
```

---

## The Scale (19 tokens, 4 categories)

| Category | Count | Range (desktop) | Purpose |
|---|---|---|---|
| **display** | 5 | 90px → 36px | Hero text, splash, large section titles |
| **heading** | 5 | 28px → 20px | Section headings, card titles |
| **body** | 5 | 18px → 14px | Paragraphs, UI text, nav, form labels |
| **caption** | 4 | 13px → 10px | Labels, tags, meta text, timestamps |

19 tokens covers everything. The constraint is intentional — if you can't find a token, you're probably inventing a new size that shouldn't exist.

### Full Token Table

Format: `fontSize/lineHeight · fontWeight`

| Token | Desktop | Mobile | Font Stack |
|---|---|---|---|
| `display-xxl` | 90/90 · 600 | 60/60 · 600 | display |
| `display-xl` | 80/76 · 700 | 36/34 · 700 | body |
| `display-lg` | 48/52 · 600 | 36/40 · 600 | display |
| `display-md` | 40/44 · 600 | 28/34 · 600 | display |
| `display-sm` | 36/44 · 600 | 24/32 · 600 | display |
| `heading-xl` | 28/34 · 600 | 22/28 · 600 | display |
| `heading-lg` | 26/32 · 600 | 20/26 · 600 | display |
| `heading-md` | 24/30 · 600 | 20/26 · 600 | display |
| `heading-sm` | 22/23 · 700 | 18/19 · 700 | body |
| `heading-xs` | 20/26 · 600 | 16/22 · 600 | body |
| `body-xl` | 18/26 · 500 | 16/22 · 500 | body |
| `body-lg` | 17/27 · 400 | 15/24 · 400 | body |
| `body-md` | 16/24 · 600 | 14/21 · 600 | display |
| `body-sm` | 15/22 · 400 | 14/20 · 400 | body |
| `body-xs` | 14/20 · 400 | 13/18 · 400 | body |
| `caption-lg` | 13/20 · 400 | 12/18 · 400 | body |
| `caption-md` | 12/18 · 500 | 11/16 · 500 | body |
| `caption-sm` | 11/14 · 500 | 10/14 · 500 | mono |
| `caption-xs` | 10/14 · 500 | 10/14 · 500 | mono |

`caption-sm` and `caption-xs` also have `letter-spacing: 0.02em` and `text-transform: uppercase`.

---

## Font Stacks (3)

```typescript
const FONT_STACKS = {
  display: { cssVar: '--type-font-display', default: 'var(--font-solar-display)' },
  body:    { cssVar: '--type-font-body',    default: 'var(--font-neue-montreal)' },
  mono:    { cssVar: '--type-font-mono',    default: 'var(--font-diatype-mono)' },
};
```

Each token references one of these three stacks. The admin can override the actual font family per stack without touching any component code.

General guidance:
- **display** — headings, hero text, display type
- **body** — paragraphs, UI text, body copy
- **mono** — labels, tags, captions, meta text

---

## CSS Variable Generation

`tokensToCss()` generates two blocks from the token array:

```css
/* Desktop (default) */
:root {
  --type-display-lg-font: var(--type-font-display);
  --type-display-lg-size: 48px;
  --type-display-lg-line: 52px;
  --type-display-lg-weight: 600;
  --type-display-lg-size-mobile: 36px;
  --type-display-lg-line-mobile: 40px;
  --type-display-lg-weight-mobile: 600;
  /* ... repeated for all 19 tokens */
}

/* Mobile override — swaps the base vars */
@media (max-width: 767px) {
  :root {
    --type-display-lg-size: 36px;
    --type-display-lg-line: 40px;
    --type-display-lg-weight: 600;
    /* ... */
  }
}
```

Components never think about breakpoints for typography. The vars swap automatically at 767px.

### CSS Variable Reference

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

---

## The `typeStyle()` Helper

The primary API. Returns a complete `React.CSSProperties` object:

```tsx
import { typeStyle } from '@/lib/design/tokens';

<h2 style={typeStyle('display-lg')}>Section Title</h2>
<p style={typeStyle('body-lg')}>Paragraph text.</p>
<span style={typeStyle('caption-sm')}>CATEGORY · DATE</span>
```

Returns:

```typescript
{
  fontFamily:     'var(--type-display-lg-font)',
  fontSize:       'var(--type-display-lg-size)',
  lineHeight:     'var(--type-display-lg-line)',
  fontWeight:     'var(--type-display-lg-weight)',
  letterSpacing:  'var(--type-display-lg-spacing, normal)',
  textTransform:  'var(--type-display-lg-transform, none)',
}
```

### Combining with color

```tsx
const ts = (token: string) => ({ ...typeStyle(token), color: '#1A3821' });
<h2 style={ts('display-lg')}>Colored heading</h2>
```

### Using CSS variables directly

When you need a subset of properties or want to mix with other styles:

```tsx
<h2 style={{
  fontFamily: 'var(--type-display-lg-font)',
  fontSize: 'var(--type-display-lg-size)',
  lineHeight: 'var(--type-display-lg-line)',
  fontWeight: 'var(--type-display-lg-weight)',
}}>Title</h2>
```

---

## The `DesignTokensStyle` Server Component

Placed once in the root layout. Zero client JS.

```tsx
// components/DesignTokensStyle.tsx
import { DEFAULT_TOKENS, tokensToCss, type TypeToken } from '@/lib/design/tokens';

export default async function DesignTokensStyle() {
  let tokens: TypeToken[] = DEFAULT_TOKENS;
  let fontOverrides: Record<string, string> = {};

  try {
    const settings = await getSettings(); // your DB read
    if (settings?.typographyTokens?.length) tokens = settings.typographyTokens;
    if (settings?.fontStacks) fontOverrides = settings.fontStacks;
  } catch {}

  const css = tokensToCss(tokens, fontOverrides);
  if (!css) return null;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
```

```tsx
// app/layout.tsx
<body>
  <DesignTokensStyle />
  {children}
</body>
```

---

## Admin Editor (`/admin/design`)

A single page where the site owner can:

- **Override font stacks** — change the display, body, or mono font family
- **Edit every token** — desktop + mobile values for size, line height, weight, letter spacing
- **Live preview** — contextual sample text per token (e.g. "FAQs" for `display-lg`, "STORIES · 10.05.2026" for `caption-sm`)
- **See usage** — `usedIn` badges show where each token is used across the site
- **Filter by category** — display / heading / body / caption tabs

Saves to the Settings entity. Changes propagate on next page load (no deploy needed).

---

## The `usedIn` Tracking

Every token has a `usedIn: string[]` that lists every component and page using it. Maintained manually in `tokens.ts`.

```typescript
{ name: 'body-lg', /* ... */,
  usedIn: ['Story body text', 'About page paragraphs', 'Page intro'] },
```

Serves two purposes:
1. **Admin visibility** — the editor shows what changes when a token is edited
2. **Developer audit** — grep for a token name to find all usages

---

## Enforcement Rules

### What to do

1. **Use `typeStyle(tokenName)`** for all storefront text styling
2. **Update `usedIn`** in `tokens.ts` when adding a component that uses a token
3. **Pick the closest token** — if no token fits exactly, use the nearest one
4. **Font stacks**: `display` for headings, `body` for paragraphs, `mono` for labels/tags

### What not to do

```tsx
// ❌ Arbitrary pixel sizes
<h2 className="text-[36px]">Title</h2>
<p style={{ fontSize: '17px' }}>Text</p>

// ❌ Raw font family vars without token sizing
<h2 style={{ fontFamily: 'var(--font-solar-display)', fontSize: '48px' }}>Title</h2>

// ❌ Tailwind text-* classes for storefront type
<p className="text-lg font-medium">Text</p>
```

```tsx
// ✅ Always use tokens
<h2 style={typeStyle('display-lg')}>Title</h2>
<p style={typeStyle('body-lg')}>Text</p>
```

### Scope

- **Storefront pages** — all text must use tokens. No exceptions.
- **Admin pages** — exempt. They use their own design system (e.g. Untitled UI, Radix).

### Quick Reference: Picking a Token

| Need | Token | Desktop Size |
|---|---|---|
| Hero / splash text | `display-xxl` to `display-sm` | 90–36px |
| Section heading | `heading-xl` to `heading-xs` | 28–20px |
| Body paragraph | `body-lg` or `body-sm` | 17px / 15px |
| UI text (nav, labels, prices) | `body-md` or `body-xs` | 16px / 14px |
| Small labels, tags, meta | `caption-lg` to `caption-xs` | 13–10px |

---

## What Makes This Work

1. **Single source of truth** — 19 tokens in one file. Not scattered across Tailwind config, CSS files, and inline styles.
2. **Responsive by default** — Mobile values are baked into the CSS vars. No `md:text-lg` needed.
3. **Admin-editable without deploys** — Font sizes, weights, and families can be changed from the CMS.
4. **Auditable** — `usedIn` tracks every usage. The admin sees exactly what changes when they edit a token.
5. **Constrained** — 19 tokens is enough. The constraint prevents size proliferation.
6. **Zero runtime cost** — CSS vars are injected server-side. `typeStyle()` returns a static object. No JS runs on the client for typography.

---

## Porting to Another Project

1. **Copy `lib/design/tokens.ts`** — adjust the 19 tokens to your project's scale (sizes, weights, font families)
2. **Copy `components/DesignTokensStyle.tsx`** — adjust the DB read to your settings storage (or hardcode if no admin editing needed)
3. **Add `<DesignTokensStyle />`** to your root layout
4. **Copy the admin page** if you want runtime editing (optional)
5. **Replace font stack names/defaults** with your project's fonts
6. **Add the steering rule** if using Kiro (`.kiro/steering/typography-tokens.md`)

The token names (`display-lg`, `body-sm`, etc.) are generic enough to work across projects. The actual pixel values and font families are project-specific.

### Minimal Setup (no admin editing)

If you don't need runtime editing, skip the admin page and DB read. Just use `DEFAULT_TOKENS` directly:

```tsx
// components/DesignTokensStyle.tsx (simplified)
import { DEFAULT_TOKENS, tokensToCss } from '@/lib/design/tokens';

export default function DesignTokensStyle() {
  const css = tokensToCss(DEFAULT_TOKENS);
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
```

Everything else works the same — `typeStyle()`, CSS vars, mobile responsiveness.

---

## Adding a New Token

Only add a new token if no existing one covers the size. To add one:

1. Add the entry to `DEFAULT_TOKENS` in `lib/design/tokens.ts`
2. Include a descriptive `usedIn` array
3. Update this doc and any steering rules
4. The CSS vars and admin editor pick it up automatically
