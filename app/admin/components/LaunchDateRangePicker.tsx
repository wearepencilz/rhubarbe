'use client';

import { parseDate } from '@internationalized/date';
import { DateRangePicker } from './ui/date-picker/date-range-picker';

interface LaunchDateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartChange: (date: string) => void;
  onEndChange: (date: string) => void;
}

export function LaunchDateRangePicker({ 
  startDate, 
  endDate, 
  onStartChange, 
  onEndChange 
}: LaunchDateRangePickerProps) {
  // Convert string dates to DateValue objects
  const value = startDate && endDate ? {
    start: parseDate(startDate),
    end: parseDate(endDate)
  } : null;

  const handleChange = (range: any) => {
    if (range?.start && range?.end) {
      onStartChange(range.start.toString());
      onEndChange(range.end.toString());
    }
  };

  return (
    <DateRangePicker
      value={value}
      onChange={handleChange}
      onApply={() => {
        // Optional: Add any apply logic here
      }}
    />
  );
}
