'use client';

import { getLocalTimeZone, today } from '@internationalized/date';
import type { DatePickerProps as AriaDatePickerProps, DateValue } from 'react-aria-components';
import {
  DatePicker as AriaDatePicker,
  Calendar as AriaCalendar,
  CalendarGrid as AriaCalendarGrid,
  CalendarGridBody as AriaCalendarGridBody,
  CalendarGridHeader as AriaCalendarGridHeader,
  CalendarHeaderCell as AriaCalendarHeaderCell,
  CalendarCell as AriaCalendarCell,
  DateInput as AriaDateInput,
  DateSegment as AriaDateSegment,
  Dialog as AriaDialog,
  Group as AriaGroup,
  Heading as AriaHeading,
  Label as AriaLabel,
  Popover as AriaPopover,
  Button as AriaButton,
} from 'react-aria-components';

interface DatePickerFieldProps extends AriaDatePickerProps<DateValue> {
  label?: string;
  variant?: 'default' | 'white';
}

export default function DatePickerField({ label, variant = 'default', ...props }: DatePickerFieldProps) {
  const ariaLabel = label || 'Date';
  const isWhite = variant === 'white';
  return (
    <AriaDatePicker {...props} aria-label={ariaLabel} className="flex flex-col gap-1" shouldForceLeadingZeros>
      {label && variant === 'default' && (
        <AriaLabel className="text-xs text-gray-500 uppercase tracking-wide">{label}</AriaLabel>
      )}
      <AriaGroup className={`flex items-center cursor-pointer ${isWhite ? '' : 'border-b border-gray-300 focus-within:border-gray-900 transition-colors'}`}>
        <AriaButton className="flex flex-1 items-center outline-none">
          <AriaDateInput className={`flex flex-1 py-1.5 text-sm bg-transparent ${isWhite ? 'text-white' : ''}`}>
            {(segment) => (
              <AriaDateSegment
                segment={segment}
                className={`rounded px-0.5 tabular-nums caret-transparent outline-none ${isWhite ? 'focus:bg-white/20 text-white' : 'focus:bg-gray-900 focus:text-white'}`}
              />
            )}
          </AriaDateInput>
          <span className={`px-1 ${isWhite ? 'text-white' : 'text-gray-400'}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </span>
        </AriaButton>
      </AriaGroup>
      <AriaPopover offset={4} placement="bottom start" className="z-50">
        <AriaDialog className="rounded-lg bg-white shadow-xl ring-1 ring-gray-200 p-4">
          <AriaCalendar aria-label={ariaLabel} className="flex flex-col gap-2">
            <header className="flex items-center justify-between">
              <AriaButton slot="previous" aria-label="Previous month" className="p-1 rounded hover:bg-gray-100 outline-none text-gray-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </AriaButton>
              <AriaHeading className="text-sm font-medium text-gray-900" />
              <AriaButton slot="next" aria-label="Next month" className="p-1 rounded hover:bg-gray-100 outline-none text-gray-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </AriaButton>
            </header>
            <AriaCalendarGrid weekdayStyle="short" className="w-max">
              <AriaCalendarGridHeader>
                {(day) => (
                  <AriaCalendarHeaderCell className="p-0">
                    <div className="flex size-9 items-center justify-center text-xs font-medium text-gray-400">{day.slice(0, 2)}</div>
                  </AriaCalendarHeaderCell>
                )}
              </AriaCalendarGridHeader>
              <AriaCalendarGridBody className="[&_td]:p-0">
                {(date) => {
                  const todayDate = today(getLocalTimeZone());
                  const isToday = date.year === todayDate.year && date.month === todayDate.month && date.day === todayDate.day;
                  return (
                    <AriaCalendarCell
                      date={date}
                      className={({ isSelected, isDisabled, isUnavailable, isFocusVisible, isOutsideMonth }) =>
                        `flex size-9 items-center justify-center rounded-full text-sm outline-none transition-colors
                        ${(isDisabled || isUnavailable) && !isOutsideMonth ? 'text-gray-300 line-through pointer-events-none cursor-default' : ''}
                        ${isOutsideMonth ? 'text-gray-300 pointer-events-none cursor-default' : ''}
                        ${!isDisabled && !isUnavailable && !isOutsideMonth ? 'cursor-pointer' : ''}
                        ${isSelected ? 'bg-gray-900 text-white font-medium' : !isDisabled && !isUnavailable && !isOutsideMonth ? 'hover:bg-gray-100' : ''}
                        ${isToday && !isSelected ? 'ring-1 ring-gray-900' : ''}
                        ${isFocusVisible ? 'ring-2 ring-gray-900 ring-offset-1' : ''}`
                      }
                    />
                  );
                }}
              </AriaCalendarGridBody>
            </AriaCalendarGrid>
          </AriaCalendar>
        </AriaDialog>
      </AriaPopover>
    </AriaDatePicker>
  );
}
