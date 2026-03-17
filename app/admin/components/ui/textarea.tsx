'use client';

import React from 'react';
import type { ReactNode, Ref } from 'react';
import {
  TextArea as UntitledTextArea,
  TextAreaBase as UntitledTextAreaBase,
} from './textarea/textarea';

/**
 * Validation state for the textarea.
 */
export type ValidationState = 'default' | 'error' | 'success' | 'warning';

export interface TextareaProps {
  /** Textarea label text */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Current value (controlled) */
  value?: string;
  /** Default value (uncontrolled) */
  defaultValue?: string;
  /** Change handler */
  onChange?: (value: string) => void;
  /** Validation state */
  validationState?: ValidationState;
  /** Helper text displayed below the textarea */
  helperText?: string;
  /** Error message (shown when validationState is 'error') */
  errorMessage?: string;
  /** Whether the field is required */
  isRequired?: boolean;
  /** Whether the field is disabled */
  isDisabled?: boolean;
  /** Whether the field is read-only */
  isReadOnly?: boolean;
  /** Tooltip text for the label */
  tooltip?: string;
  /** Number of visible rows */
  rows?: number;
  /** Number of visible columns */
  cols?: number;
  /** Textarea name attribute */
  name?: string;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Additional class name */
  className?: string;
  /** Ref forwarded to the textarea wrapper div */
  ref?: Ref<HTMLDivElement>;
  /** Ref forwarded to the textarea element */
  textAreaRef?: Ref<HTMLTextAreaElement>;
  /** aria-label for accessibility when no visible label */
  'aria-label'?: string;
  /** aria-describedby for accessibility */
  'aria-describedby'?: string;
  /** Min length */
  minLength?: number;
  /** Max length */
  maxLength?: number;
}

/**
 * Tailwind classes for validation-state hint text colors.
 */
const validationHintClass: Record<ValidationState, string> = {
  default: '',
  error: '',
  success: 'text-success-primary',
  warning: 'text-warning-primary',
};

/**
 * Textarea wrapper around Untitled UI TextArea.
 *
 * Uses semantic design tokens via the Untitled UI theme instead of hardcoded
 * Tailwind color classes.
 *
 * Supports: validation states (default, error, success, warning),
 * helper text, error messages, required indicators, disabled/readonly,
 * and tooltip labels.
 */
export const Textarea = React.forwardRef<HTMLDivElement, TextareaProps>(
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
      tooltip,
      rows,
      cols,
      name,
      autoFocus,
      className,
      textAreaRef,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      minLength,
      maxLength,
      ...rest
    },
    ref,
  ) => {
    const isInvalid = validationState === 'error';
    let hint: ReactNode = helperText;

    if (isInvalid && errorMessage) {
      hint = errorMessage;
    }

    // For success/warning states, wrap hint in styled span
    const styledHint =
      hint && validationState !== 'default' && validationState !== 'error' ? (
        <span className={validationHintClass[validationState]}>{hint}</span>
      ) : (
        hint
      );

    return (
      <UntitledTextArea
        ref={ref}
        textAreaRef={textAreaRef}
        label={label}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        isInvalid={isInvalid}
        isRequired={isRequired}
        isDisabled={isDisabled}
        isReadOnly={isReadOnly}
        tooltip={tooltip}
        rows={rows}
        cols={cols}
        name={name}
        autoFocus={autoFocus}
        className={className}
        aria-label={ariaLabel || (!label ? placeholder : undefined)}
        aria-describedby={ariaDescribedBy}
        minLength={minLength}
        maxLength={maxLength}
        hint={styledHint}
      />
    );
  },
);

Textarea.displayName = 'Textarea';

// Re-export base component for advanced usage
export { UntitledTextAreaBase as TextAreaBase };

export default Textarea;
