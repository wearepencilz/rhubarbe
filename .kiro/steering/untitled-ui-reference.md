---
inclusion: fileMatch
fileMatchPattern: "app/admin/**"
description: Untitled UI React — component sourcing and adaptation rules for admin UI.
---

# Untitled UI — Admin Component Rules

Before building any admin UI component, check if Untitled UI has one:

```bash
npx untitledui@latest add [component-name]
# Output: app/admin/components/ui
```

## Adaptation Rules

1. Copy patterns, not exact code — adapt to our stack
2. We use React 18.3 + Tailwind 3.4 (Untitled UI uses React 19 + Tailwind 4)
3. Keep React Aria accessibility features
4. Components go in `app/admin/components/ui/`
5. PascalCase files, default exports

## Color Mapping

| Untitled UI | Our Tailwind |
|---|---|
| `--color-text-primary` | `text-gray-900` |
| `--color-bg-primary` | `bg-white` |
| `--color-border-primary` | `border-gray-300` |

## Resources

- [Docs](https://untitledui.com/react/docs)
- [GitHub](https://github.com/untitleduico/react)
