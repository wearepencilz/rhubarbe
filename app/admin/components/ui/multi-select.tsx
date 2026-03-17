'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Key } from 'react-aria-components';
import { useListData } from 'react-stately';
import {
  UntitledMultiSelect,
} from './select/multi-select-base';
import { SelectItem } from './select/select-item';
import type { SelectItemType } from './select/select-base';

/**
 * Validation state for the multi-select.
 */
export type ValidationState = 'default' | 'error' | 'success' | 'warning';

export interface MultiSelectOption {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Optional supporting text shown beside the label */
  supportingText?: string;
  /** Whether this option is disabled */
  isDisabled?: boolean;
  /** Optional group name for grouping options */
  group?: string;
}

export interface MultiSelectProps {
  /** Select label text */
  label?: string;
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Currently selected values (array of option ids) */
  value?: string[];
  /** Change handler — receives the full array of selected option ids */
  onChange?: (values: string[]) => void;
  /** Array of options to display */
  options?: MultiSelectOption[];
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
  renderOption?: (option: MultiSelectOption) => ReactNode;
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
 * MultiSelect wrapper around Untitled UI MultiSelect.
 *
 * Uses semantic design tokens via the Untitled UI theme instead of hardcoded
 * Tailwind color classes.
 *
 * Supports: removable tags for selected items, search/filter,
 * option groups, custom option rendering, disabled state,
 * and error/validation states.
 */
export function MultiSelect({
  label,
  placeholder = 'Search...',
  value = [],
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
}: MultiSelectProps) {
  const isInvalid = validationState === 'error';

  let hint: ReactNode = helperText;
  if (isInvalid && errorMessage) {
    hint = errorMessage;
  }

  const styledHint =
    hint && validationState !== 'default' && validationState !== 'error' ? (
      <span className={validationHintClass[validationState]}>{hint}</span>
    ) : (
      hint
    );

  // Convert options to SelectItemType[]
  const items: SelectItemType[] = options.map((opt) => ({
    id: opt.id,
    label: opt.label,
    supportingText: opt.supportingText,
    isDisabled: opt.isDisabled,
  }));

  // Build initial selected items from value prop
  const initialSelected = items.filter((item) => value.includes(item.id));

  const selectedItems = useListData<SelectItemType>({
    initialItems: initialSelected,
  });

  // Track whether this is the initial render to avoid calling onChange
  const isInitialRender = useRef(true);
  // Track external value changes
  const prevValueRef = useRef(value);

  // Sync external value changes into selectedItems
  useEffect(() => {
    const currentIds = selectedItems.items.map((i) => i.id);
    const valueSet = new Set(value);
    const currentSet = new Set(currentIds);

    // Check if they differ
    if (value.length === currentIds.length && value.every((v) => currentSet.has(v))) {
      prevValueRef.current = value;
      return;
    }

    // Remove items no longer in value
    for (const id of currentIds) {
      if (!valueSet.has(id)) {
        selectedItems.remove(id);
      }
    }

    // Add items newly in value
    for (const id of value) {
      if (!currentSet.has(id)) {
        const item = items.find((i) => i.id === id);
        if (item) {
          selectedItems.append(item);
        }
      }
    }

    prevValueRef.current = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Notify parent when selectedItems changes
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    const currentIds = selectedItems.items.map((i) => i.id);
    const prevIds = prevValueRef.current;

    // Only call onChange if the selection actually changed from the external value
    if (
      currentIds.length !== prevIds.length ||
      !currentIds.every((id, idx) => prevIds[idx] === id)
    ) {
      onChange?.(currentIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItems.items]);

  const handleItemInserted = useCallback(
    (_key: Key) => {
      // onChange is handled by the effect above
    },
    [],
  );

  const handleItemCleared = useCallback(
    (_key: Key) => {
      // onChange is handled by the effect above
    },
    [],
  );

  return (
    <UntitledMultiSelect
      label={label}
      placeholder={placeholder}
      selectedItems={selectedItems}
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
      onItemInserted={handleItemInserted}
      onItemCleared={handleItemCleared}
      placeholderIcon={null}
    >
      {(item: SelectItemType) => {
        const itemProps = {
          id: item.id,
          label: item.label ?? '',
          supportingText: item.supportingText,
          isDisabled: item.isDisabled,
        };
        return <SelectItem {...itemProps} />;
      }}
    </UntitledMultiSelect>
  );
}

MultiSelect.displayName = 'MultiSelect';

// Re-export base components for advanced usage
export { UntitledMultiSelect, SelectItem };
export type { SelectItemType };

export default MultiSelect;
