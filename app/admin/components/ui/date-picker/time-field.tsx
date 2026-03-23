"use client";

import type { TimeFieldProps as AriaTimeFieldProps, TimeValue } from "react-aria-components";
import { TimeField as AriaTimeField, DateInput as AriaDateInput, DateSegment as AriaDateSegment, Label as AriaLabel, Text as AriaText } from "react-aria-components";
import { cx } from "../../utils/cx";

interface TimeFieldProps<T extends TimeValue> extends AriaTimeFieldProps<T> {
  label?: string;
  description?: string;
  errorMessage?: string;
}

export function TimeField<T extends TimeValue>({ label, description, errorMessage, ...props }: TimeFieldProps<T>) {
  return (
    <AriaTimeField {...props} className="flex flex-col gap-1.5">
      {label && (
        <AriaLabel className="text-sm font-medium text-secondary">{label}</AriaLabel>
      )}
      <AriaDateInput
        className={cx(
          "flex rounded-lg bg-primary px-3 py-2 text-sm shadow-xs ring-1 ring-inset transition-colors",
          "focus-within:ring-2 focus-within:ring-brand",
          props.isInvalid || errorMessage ? "ring-error" : "ring-border-secondary",
        )}
      >
        {(segment) => (
          <AriaDateSegment
            segment={segment}
            className={cx(
              "rounded px-0.5 tabular-nums caret-transparent focus:bg-brand-solid focus:font-medium focus:text-white focus:outline-hidden",
              segment.isPlaceholder && "text-placeholder uppercase",
              segment.type === "literal" && "text-fg-quaternary",
            )}
          />
        )}
      </AriaDateInput>
      {description && !errorMessage && (
        <AriaText slot="description" className="text-xs text-tertiary">{description}</AriaText>
      )}
      {errorMessage && (
        <AriaText slot="errorMessage" className="text-xs text-error-primary">{errorMessage}</AriaText>
      )}
    </AriaTimeField>
  );
}
