---
inclusion: fileMatch
fileMatchPattern: "app/admin/**"
description: Untitled UI React design system reference — component patterns, color tokens, and accessibility.
---

# Untitled UI React - Design System Reference

This project uses [Untitled UI React](https://github.com/untitleduico/react) as a reference for component design and implementation patterns.

## Overview

Untitled UI React is an open-source collection of React components built with:
- **React 19.1** (we're using 18.3, but patterns are compatible)
- **Tailwind CSS v4.1** (we're using v3.4)
- **TypeScript 5.8** (we use JSX)
- **React Aria** - for accessibility primitives

## Key Principles

### Copy-Paste Architecture
Unlike traditional npm packages, Untitled UI components are copied directly into your project. This means:
- No package dependencies to manage
- No vendor lock-in
- Full control to modify and extend components
- You own the code

### Accessibility First
All components are built on React Aria primitives, ensuring:
- WCAG compliance baseline
- Keyboard navigation
- Screen reader support
- Focus management

## Design System Structure

### Color System
Untitled UI uses a comprehensive color palette with semantic naming:
- **Base colors**: brand, gray, error, warning, success
- **Utility colors**: blue, indigo, purple, pink, orange, yellow, green, teal, cyan
- **Semantic tokens**: text, border, foreground, background colors
- **Dark mode support**: automatic color inversion via `.dark-mode` class

### Typography Scale
- `text-xs` through `text-xl` for body text
- `text-display-xs` through `text-display-2xl` for headings
- Custom font families: body, display, mono

### Spacing & Layout
- Consistent spacing scale based on `--spacing` variable
- Max width container: 1280px
- Responsive breakpoints: xxs (320px), xs (600px)

### Border Radius
- `radius-none` through `radius-3xl`
- `radius-full` for circular elements

### Shadows
- `shadow-xs` through `shadow-3xl`
- Specialized shadows: skeumorphic, modern-mockup

## Component Patterns

### Component Structure
```jsx
// Functional components with hooks
const ComponentName = ({ prop1, prop2, ...props }) => {
  // Component logic
  return (
    <div className="tailwind-classes" {...props}>
      {/* Component content */}
    </div>
  );
};

export default ComponentName;
```

### Styling Approach
- Use Tailwind utility classes exclusively
- Leverage CSS custom properties for theming
- Support dark mode via `.dark-mode` class
- Use semantic color tokens (e.g., `text-color-primary`, `bg-color-secondary`)

### Accessibility Patterns
- Use React Aria components for complex interactions
- Ensure proper ARIA attributes
- Implement keyboard navigation
- Provide focus indicators

## Integration with Our Project

### Current State
- We use Tailwind CSS 3.4 (Untitled UI uses 4.1)
- We use React 18.3 (Untitled UI uses 19.1)
- We use JSX (Untitled UI uses TypeScript)
- We have custom components in `src/components/ui/`

### Adaptation Guidelines

When referencing Untitled UI components:

1. **Copy component patterns**, not exact code
2. **Adapt TypeScript to JSX** by removing type annotations
3. **Use our existing Tailwind config** instead of their theme.css
4. **Maintain our component structure** (PascalCase files, default exports)
5. **Keep accessibility features** from React Aria patterns
6. **Simplify where appropriate** - we don't need all features

### Color Token Mapping

If adopting Untitled UI color tokens, map to our existing Tailwind config:
- Their `--color-text-primary` → Our `text-gray-900`
- Their `--color-bg-primary` → Our `bg-white`
- Their `--color-border-primary` → Our `border-gray-300`

### Component Examples

Reference these Untitled UI patterns for:
- **Buttons**: Size variants, color schemes, icon placement
- **Forms**: Input states, validation, error handling
- **Cards**: Layout patterns, hover effects
- **Modals**: Focus trapping, backdrop, animations
- **Navigation**: Responsive patterns, active states

## Resources

- [Documentation](https://untitledui.com/react/docs)
- [GitHub Repository](https://github.com/untitleduico/react)
- [Figma UI Kit](https://untitledui.com) - Design reference
- [Installation Guide](https://untitledui.com/react/docs/installation)

## License

Untitled UI React open-source components are MIT licensed for unlimited commercial use.

---

**Note**: This is a reference guide. Always adapt patterns to fit our project's specific needs, tech stack, and existing conventions.
