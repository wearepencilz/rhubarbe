import type { Config } from 'tailwindcss'

/**
 * Semantic Design Token System for Janine CMS
 * 
 * This config extends the existing Untitled UI CSS theme (src/styles/theme.css)
 * with semantic design tokens for consistent usage across the admin interface.
 * 
 * Color tokens map to the Untitled UI brand palette defined in theme.css:
 * - primary: Brand blue scale (maps to --color-brand-*)
 * - success: Green scale (maps to --color-success-*)
 * - error: Red scale (maps to --color-error-*)
 * - warning: Amber scale (maps to --color-warning-*)
 * - info: Blue/brand scale (aliases primary)
 * 
 * Usage: bg-primary-600, text-error-500, border-success-300, etc.
 */

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Semantic color tokens
      colors: {
        // Untitled UI semantic shorthand tokens (used by UI components)
        // These map the shorthand classes like bg-brand-solid, text-secondary etc.
        'brand-solid': 'var(--color-bg-brand-solid)',
        'brand-solid_hover': 'var(--color-bg-brand-solid_hover)',
        'error-solid': 'var(--color-bg-error-solid)',
        'error-solid_hover': 'var(--color-bg-error-solid_hover)',
        'disabled': 'var(--color-bg-disabled)',
        'fg-white': 'var(--color-fg-white)',
        'fg-primary': 'var(--color-fg-primary)',
        'fg-secondary': 'var(--color-fg-secondary)',
        'fg-secondary_hover': 'var(--color-fg-secondary_hover)',
        'fg-tertiary': 'var(--color-fg-tertiary)',
        'fg-tertiary_hover': 'var(--color-fg-tertiary_hover)',
        'fg-quaternary': 'var(--color-fg-quaternary)',
        'fg-quaternary_hover': 'var(--color-fg-quaternary_hover)',
        'fg-disabled': 'var(--color-fg-disabled)',
        'fg-disabled_subtle': 'var(--color-fg-disabled_subtle)',
        'fg-brand-primary': 'var(--color-fg-brand-primary)',
        'fg-brand-secondary': 'var(--color-fg-brand-secondary)',
        'fg-brand-secondary_hover': 'var(--color-fg-brand-secondary_hover)',
        'fg-error-primary': 'var(--color-fg-error-primary)',
        'fg-error-secondary': 'var(--color-fg-error-secondary)',
        'fg-warning-primary': 'var(--color-fg-warning-primary)',
        'fg-success-primary': 'var(--color-fg-success-primary)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary': 'var(--color-text-tertiary)',
        'text-quaternary': 'var(--color-text-quaternary)',
        'text-disabled': 'var(--color-text-disabled)',
        'text-placeholder': 'var(--color-text-placeholder)',
        'text-white': 'var(--color-text-white)',
        'text-brand-primary': 'var(--color-text-brand-primary)',
        'text-brand-secondary': 'var(--color-text-brand-secondary)',
        'text-brand-tertiary': 'var(--color-text-brand-tertiary)',
        'text-error-primary': 'var(--color-text-error-primary)',
        'text-warning-primary': 'var(--color-text-warning-primary)',
        'text-success-primary': 'var(--color-text-success-primary)',
        'bg-primary': 'var(--color-bg-primary)',
        'bg-primary_hover': 'var(--color-bg-primary_hover)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'bg-secondary_hover': 'var(--color-bg-secondary_hover)',
        'bg-tertiary': 'var(--color-bg-tertiary)',
        'bg-active': 'var(--color-bg-active)',
        'bg-disabled': 'var(--color-bg-disabled)',
        'border-primary': 'var(--color-border-primary)',
        'border-secondary': 'var(--color-border-secondary)',
        'border-tertiary': 'var(--color-border-tertiary)',
        'border-disabled': 'var(--color-border-disabled)',
        'border-brand': 'var(--color-border-brand)',
        'border-error': 'var(--color-border-error)',
        'focus-ring': 'var(--color-focus-ring)',
        'button-primary-icon': 'var(--color-button-primary-icon)',
        'button-primary-icon_hover': 'var(--color-button-primary-icon_hover)',
        // Untitled UI uses these shorthand names directly in component classes
        'secondary': 'var(--color-bg-secondary)',
        'tertiary': 'var(--color-fg-tertiary)',
        'tertiary_hover': 'var(--color-fg-tertiary_hover)',
        'secondary_hover': 'var(--color-fg-secondary_hover)',
        'error-primary': 'var(--color-bg-secondary)',
        'error-primary_hover': 'var(--color-bg-secondary_hover)',
        'brand-secondary': 'var(--color-fg-brand-secondary)',
        'brand-secondary_hover': 'var(--color-fg-brand-secondary_hover)',
        'outline-brand': 'var(--color-border-brand)',
        'outline-error': 'var(--color-border-error)',
        'ring-disabled_subtle': 'var(--color-border-disabled)',
        'ring-error_subtle': 'var(--color-border-error)',
        'ring-primary': 'var(--color-border-primary)',
        // Full brand/error/etc scales
        primary: {
          25: 'var(--color-brand-25)',
          50: 'var(--color-brand-50)',
          100: 'var(--color-brand-100)',
          200: 'var(--color-brand-200)',
          300: 'var(--color-brand-300)',
          400: 'var(--color-brand-400)',
          500: 'var(--color-brand-500)',
          600: 'var(--color-brand-600)',
          700: 'var(--color-brand-700)',
          800: 'var(--color-brand-800)',
          900: 'var(--color-brand-900)',
          950: 'var(--color-brand-950)',
        },
        success: {
          25: 'var(--color-success-25)',
          50: 'var(--color-success-50)',
          100: 'var(--color-success-100)',
          200: 'var(--color-success-200)',
          300: 'var(--color-success-300)',
          400: 'var(--color-success-400)',
          500: 'var(--color-success-500)',
          600: 'var(--color-success-600)',
          700: 'var(--color-success-700)',
          800: 'var(--color-success-800)',
          900: 'var(--color-success-900)',
          950: 'var(--color-success-950)',
        },
        error: {
          25: 'var(--color-error-25)',
          50: 'var(--color-error-50)',
          100: 'var(--color-error-100)',
          200: 'var(--color-error-200)',
          300: 'var(--color-error-300)',
          400: 'var(--color-error-400)',
          500: 'var(--color-error-500)',
          600: 'var(--color-error-600)',
          700: 'var(--color-error-700)',
          800: 'var(--color-error-800)',
          900: 'var(--color-error-900)',
          950: 'var(--color-error-950)',
        },
        warning: {
          25: 'var(--color-warning-25)',
          50: 'var(--color-warning-50)',
          100: 'var(--color-warning-100)',
          200: 'var(--color-warning-200)',
          300: 'var(--color-warning-300)',
          400: 'var(--color-warning-400)',
          500: 'var(--color-warning-500)',
          600: 'var(--color-warning-600)',
          700: 'var(--color-warning-700)',
          800: 'var(--color-warning-800)',
          900: 'var(--color-warning-900)',
          950: 'var(--color-warning-950)',
        },
        info: {
          25: 'var(--color-brand-25)',
          50: 'var(--color-brand-50)',
          100: 'var(--color-brand-100)',
          200: 'var(--color-brand-200)',
          300: 'var(--color-brand-300)',
          400: 'var(--color-brand-400)',
          500: 'var(--color-brand-500)',
          600: 'var(--color-brand-600)',
          700: 'var(--color-brand-700)',
          800: 'var(--color-brand-800)',
          900: 'var(--color-brand-900)',
          950: 'var(--color-brand-950)',
        },
      },

      // Typography tokens with lineHeight
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.125rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.875rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.375rem' }],
      },

      // Border radius tokens
      borderRadius: {
        'sm': '0.375rem',   // 6px
        'md': '0.5rem',     // 8px
        'lg': '0.75rem',    // 12px
        'xl': '1rem',       // 16px
      },

      // Box shadow tokens (Untitled UI skeumorphic shadows)
      boxShadow: {
        'xs': 'var(--shadow-xs)',
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
        '3xl': 'var(--shadow-3xl)',
        'skeumorphic': 'var(--shadow-skeumorphic)',
        'xs-skeumorphic': 'var(--shadow-xs-skeumorphic)',
      },

      // Outline color tokens
      outlineColor: {
        'brand': 'var(--color-border-brand)',
        'error': 'var(--color-border-error)',
        'focus-ring': 'var(--color-focus-ring)',
      },

      // Spacing scale tokens
      spacing: {
        '0.5': '0.125rem',  // 2px
        '1': '0.25rem',     // 4px
        '1.5': '0.375rem',  // 6px
        '2': '0.5rem',      // 8px
        '2.5': '0.625rem',  // 10px
        '3': '0.75rem',     // 12px
        '3.5': '0.875rem',  // 14px
        '4': '1rem',        // 16px
        '5': '1.25rem',     // 20px
        '6': '1.5rem',      // 24px
        '8': '2rem',        // 32px
        '10': '2.5rem',     // 40px
        '12': '3rem',       // 48px
        '16': '4rem',       // 64px
        '20': '5rem',       // 80px
        '24': '6rem',       // 96px
      },
    },
  },
  plugins: [],
}

export default config
