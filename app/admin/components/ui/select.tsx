'use client';

import React from 'react';
import type { FC, ReactNode } from 'react';
import {
  UntitledSelect,
  type SelectItemType,
} from './select/select-base';
import { SelectItem } from './select/select-item';

/**
 * Validation state for the select.
 */
export type ValidationState = 'default' | 'error' | 'success' | 'warning';

export interface SelectOption {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Optional supporting text shown beside the label */
  supportingText?: string;
  /** Whether this option is disabled */
  isDisabled?: boolean;
  /** Optional icon component or element */
  icon?: FC | ReactNode;
  /** Optional group name for grouping options */
  group?: string;
}

export interface SelectProps {
  /** Select label text */
  label?: string;
  /** Placeholder text when no value is selected */
  placeholder?: string;
  /** Currently selected value (the option id) */
  value?: string;
  /** Change handler — receives the selected option id directly */
  onChange?: (value: string) => void;
  /** Array of options to display */
  options?: SelectOption[];
  /** Validation state */
  validationState?: ValidationState;
  /** Helper text displayed below the select */
  helperText?: string;
  /** Error message (shown when validationState is 'error') */
  errorMessage?: string;
  /** Whether the field is required */
  isRequired?: boolean;
  /** Whether the field is disabled */
  isDisabled?: boolean;
  /** Select size */
  size?: 'sm' | 'md';
  /** Tooltip text for the label */
  tooltip?: string;
  /** Name attribute for form submission */
  name?: string;
  /** Additional class name */
  className?: string;
  /** aria-label for accessibility when no visible label */
  'aria-label'?: string;
  /** Custom option renderer */
  renderOption?: (option: SelectOption) => ReactNode;
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
 * Select wrapper around Untitled UI Select.
 *
 * Uses semantic design tokens via the Untitled UI theme instead of hardcoded
 * Tailwind color classes.
 *
 * Supports: search/filter (via ComboBox variant), option groups,
 * custom option rendering, single selection, placeholder text,
 * disabled state, and error/validation states.
 */
export function Select({
  label,
  placeholder = 'Select an option',
  value,
  onChange,
  options = [],
  validationState = 'default',
  helperText,
  errorMessage,
  isRequired = false,
  isDisabled = false,
  size = 'sm',
  tooltip,
  name,
  className,
  'aria-label': ariaLabel,
  renderOption,
}: SelectProps) {
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

  // Convert SelectOption[] to SelectItemType[]
  const items: SelectItemType[] = options.map((opt) => ({
    id: opt.id,
    label: opt.label,
    supportingText: opt.supportingText,
    isDisabled: opt.isDisabled,
    icon: opt.icon,
  }));

  const handleSelectionChange = (key: React.Key | null) => {
    if (key !== null && onChange) {
      onChange(String(key));
    }
  };

  return (
    <UntitledSelect
      label={label}
      placeholder={placeholder}
      selectedKey={value ?? null}
      onSelectionChange={handleSelectionChange}
      items={items}
      isInvalid={isInvalid}
      isRequired={isRequired}
      isDisabled={isDisabled}
      size={size}
      tooltip={tooltip}
      name={name}
      className={className}
      aria-label={ariaLabel || (!label ? placeholder : undefined)}
      hint={styledHint}
    >
      {(item) =>
        renderOption ? (
          <SelectItem
            key={item.id}
            id={item.id}
            label={item.label}
            supportingText={item.supportingText}
            isDisabled={item.isDisabled}
            icon={item.icon}
          >
            {renderOption(item as unknown as SelectOption)}
          </SelectItem>
        ) : (
          <SelectItem
            key={item.id}
            id={item.id}
            label={item.label}
            supportingText={item.supportingText}
            isDisabled={item.isDisabled}
            icon={item.icon}
          />
        )
      }
    </UntitledSelect>
  );
}

Select.displayName = 'Select';

// Re-export base components for advanced usage
export { UntitledSelect, SelectItem };
export type { SelectItemType };

// Attach Item as a sub-component for compound usage (Select.Item)
(Select as any).Item = SelectItem;

export default Select;
