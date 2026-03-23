'use client';

import type { TimeFieldProps as AriaTimeFieldProps, TimeValue } from 'react-aria-components';
import {
  TimeField as AriaTimeField,
  DateInput as AriaDateInput,
  DateSegment as AriaDateSegment,
  Label as AriaLabel,
} from 'react-aria-components';

interface TimeFieldProps<T extends TimeValue> extends AriaTimeFieldProps<T> {
  label?: string;
}

export default function TimeField<T extends TimeValue>({ label, ...props }: TimeFieldProps<T>) {
  return (
    <AriaTimeField {...props} className="flex flex-col gap-1">
      {label && (
        <AriaLabel className="text-xs text-gray-500 uppercase tracking-wide">{label}</AriaLabel>
      )}
      <AriaDateInput className="flex border-b border-gray-300 py-1.5 text-sm bg-transparent focus-within:border-gray-900 transition-colors">
        {(segment) => (
          <AriaDateSegment
            segment={segment}
            className="rounded px-0.5 tabular-nums caret-transparent outline-none focus:bg-gray-900 focus:text-white"
          />
        )}
      </AriaDateInput>
    </AriaTimeField>
  );
}
