---
inclusion: fileMatch
fileMatchPattern: "{app/**,components/**,lib/design/**,src/styles/**}"
description: Typography token system — all font styles must be linked to a token in lib/design/tokens.ts.
---

# Typography Token System

## Rule

Every font size, weight, line height, and font family used on any storefront page MUST be tracked in `lib/design/tokens.ts` as part of the consolidated type scale.

## Token Scale (20 tokens)

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

## When adding or editing font styles

1. **Check if an existing token covers the size.** Use the closest token from the scale above.
2. **If no token fits**, add the usage to the `usedIn` array of the nearest token, or create a new token only if the size is genuinely new and distinct.
3. **Never use arbitrary font sizes** (`text-[17px]`, `fontSize: '19px'`) without mapping them to a token.
4. **Update the `usedIn` array** when adding a new component or page that uses a token.
5. **Font stacks**: Use `display` for section headings, `body` for paragraphs, `mono` for labels/tags. Don't introduce new font families without adding them to `FONT_STACKS`.

## CSS Variables

Tokens are injected as CSS custom properties by `DesignTokensStyle` in the root layout:
- `--type-{name}-size` — desktop font size
- `--type-{name}-size-mobile` — mobile font size
- `--type-{name}-line` / `--type-{name}-line-mobile` — line heights
- `--type-{name}-weight` / `--type-{name}-weight-mobile` — font weights
- `--type-{name}-font` — font family reference

## Font stack overrides

The admin can override font stacks at `/admin/design`. When set, these update the original theme.css vars:
- `--font-solar-display` (display)
- `--font-neue-montreal` (body)
- `--font-diatype-mono` (mono)

Existing code using `var(--font-solar-display)` etc. automatically picks up changes.

## Files

- `lib/design/tokens.ts` — Token definitions and CSS generation
- `components/DesignTokensStyle.tsx` — Server component injecting CSS vars
- `app/admin/design/page.tsx` — Admin typography editor
- `src/styles/theme.css` — Original font stack definitions (DO NOT modify directly)
