'use client';

import React from 'react';
import type { ComponentType, HTMLAttributes, ReactNode, Ref } from 'react';
import {
  Input as UntitledInput,
  InputBase as UntitledInputBase,
  TextField as UntitledTextField,
} from './input/input';
import { HintText } from './input/hint-text';
import { Label } from './input/label';

/**
 * Validation state for the input.
 * Maps to visual styling via Untitled UI's isInvalid prop and hint text colors.
 */
export type ValidationState = 'default' | 'error' | 'success' | 'warning';

export interface InputProps {
  /** Input label text */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Current input value (controlled) */
  value?: string;
  /** Default value (uncontrolled) */
  defaultValue?: string;
  /** Change handler */
  onChange?: (value: string) => void;
  /** Validation state */
  validationState?: ValidationState;
  /** Helper text displayed below the input */
  helperText?: string;
  /** Error message (shown when validationState is 'error') */
  errorMessage?: string;
  /** Whether the field is required */
  isRequired?: boolean;
  /** Whether the field is disabled */
  isDisabled?: boolean;
  /** Whether the field is read-only */
  isReadOnly?: boolean;
  /** Input size */
  size?: 'sm' | 'md';
  /** Icon component displayed before the input */
  prefixIcon?: ComponentType<HTMLAttributes<HTMLOrSVGElement>>;
  /** Icon component displayed after the input */
  suffixIcon?: ComponentType<HTMLAttributes<HTMLOrSVGElement>>;
  /** Tooltip text for the label */
  tooltip?: string;
  /** Keyboard shortcut to display */
  shortcut?: string | boolean;
  /** HTML input type */
  type?: string;
  /** Input name attribute */
  name?: string;
  /** Auto-complete attribute */
  autoComplete?: string;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Additional class name */
  className?: string;
  /** Ref forwarded to the input element */
  ref?: Ref<HTMLInputElement>;
  /** aria-label for accessibility when no visible label */
  'aria-label'?: string;
  /** aria-describedby for accessibility */
  'aria-describedby'?: string;
  /** Min length */
  minLength?: number;
  /** Max length */
  maxLength?: number;
  /** Pattern for validation */
  pattern?: string;
}

/**
 * Resolves hint text and invalid state from validation props.
 */
function resolveValidation(validationState?: ValidationState, helperText?: string, errorMessage?: string) {
  const isInvalid = validationState === 'error';
  let hint: ReactNode = helperText;

  if (validationState === 'error' && errorMessage) {
    hint = errorMessage;
  }

  return { isInvalid, hint };
}

/**
 * Tailwind classes for validation-state hint text colors.
 * Error uses Untitled UI's built-in error styling via isInvalid.
 * Success and warning use semantic tokens from theme.css.
 */
const validationHintClass: Record<ValidationState, string> = {
  default: '',
  error: '', // handled by HintText isInvalid prop
  success: 'text-success-primary',
  warning: 'text-warning-primary',
};

/**
 * Input wrapper around Untitled UI Input.
 *
 * Uses semantic design tokens via the Untitled UI theme instead of hardcoded
 * Tailwind color classes.
 *
 * Supports: validation states (default, error, success, warning),
 * helper text, error messages, required indicators, disabled/readonly,
 * prefix/suffix icons, and keyboard shortcuts.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      placeholder,
      value,
      defaultValue,
      onChange,
      validationState = 'default',
      helperText,
      errorMessage,
      isRequired = false,
      isDisabled = false,
      isReadOnly = false,
      size = 'sm',
      prefixIcon,
      suffixIcon,
      tooltip,
      shortcut,
      type,
      name,
      autoComplete,
      autoFocus,
      className,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      minLength,
      maxLength,
      pattern,
      ...rest
    },
    ref,
  ) => {
    const { isInvalid, hint } = resolveValidation(validationState, helperText, errorMessage);

    // For success/warning states, we wrap the hint in a styled span
    const styledHint =
      hint && validationState !== 'default' && validationState !== 'error' ? (
        <span className={validationHintClass[validationState]}>{hint}</span>
      ) : (
        hint
      );

    return (
      <UntitledInput
        ref={ref}
        label={label}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        isInvalid={isInvalid}
        isRequired={isRequired}
        isDisabled={isDisabled}
        isReadOnly={isReadOnly}
        size={size}
        icon={prefixIcon}
        tooltip={tooltip}
        shortcut={shortcut}
        type={type}
        name={name}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        className={className}
        aria-label={ariaLabel || (!label ? placeholder : undefined)}
        aria-describedby={ariaDescribedBy}
        minLength={minLength}
        maxLength={maxLength}
        pattern={pattern}
        hint={styledHint}
      />
    );
  },
);

Input.displayName = 'Input';

// Re-export base components for advanced usage
export { UntitledInputBase as InputBase, UntitledTextField as TextField, HintText, Label };

export default Input;
