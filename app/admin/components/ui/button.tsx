'use client';

import React from 'react';
import type { FC, ReactNode } from 'react';
import {
  Button as UntitledButton,
  type ButtonProps as UntitledButtonProps,
  type CommonProps,
} from './buttons/button';

/**
 * Simplified variant names that map to Untitled UI color system.
 *
 * primary   → brand solid (bg-brand-600)
 * secondary → outlined / subtle
 * tertiary  → text-only, no background
 * danger    → primary-destructive (bg-error-600)
 * ghost     → tertiary (no bg, subtle text)
 */
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

const variantToColor: Record<ButtonVariant, CommonProps['color']> = {
  primary: 'primary',
  secondary: 'secondary',
  tertiary: 'tertiary',
  danger: 'primary-destructive',
  ghost: 'tertiary',
};

export interface ButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    'color' | 'disabled'
  > {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Size of the button */
  size?: ButtonSize;
  /** Shows a loading spinner and disables interaction */
  isLoading?: boolean;
  /** Disables the button */
  isDisabled?: boolean;
  /** Icon component or element before the label */
  iconLeading?: FC<{ className?: string }> | ReactNode;
  /** Icon component or element after the label */
  iconTrailing?: FC<{ className?: string }> | ReactNode;
  children?: ReactNode;
}

/**
 * Button wrapper around Untitled UI Button.
 *
 * Uses semantic design tokens via the Untitled UI theme (primary-600, error-600, etc.)
 * instead of hardcoded Tailwind color classes.
 *
 * Supports: variants (primary, secondary, tertiary, danger, ghost),
 * sizes (sm, md, lg), loading/disabled states, and icon configurations.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      isDisabled = false,
      iconLeading,
      iconTrailing,
      children,
      className,
      ...rest
    },
    ref,
  ) => {
    const color = variantToColor[variant];

    return (
      <UntitledButton
        ref={ref as React.Ref<HTMLButtonElement>}
        size={size}
        color={color}
        isLoading={isLoading}
        isDisabled={isDisabled || isLoading}
        iconLeading={iconLeading}
        iconTrailing={iconTrailing}
        className={className}
        {...rest}
      >
        {children}
      </UntitledButton>
    );
  },
);

Button.displayName = 'Button';

export default Button;
