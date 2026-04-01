"use client";

import { useMemo } from "react";
import { parseAbsolute, parseDate, getLocalTimeZone, now, today, CalendarDateTime, toCalendarDateTime, CalendarDate, Time } from "@internationalized/date";
import type { DateValue } from "react-aria-components";
import { DateTimeField } from "./date-time-field";
import { DatePickerField } from "./date-picker-field";
import { TimeField } from "./time-field";

/**
 * Parse a local datetime string (YYYY-MM-DDTHH:mm) into a CalendarDateTime.
 * Returns null if the string is empty or invalid.
 */
function parseLocalDatetime(str: string): CalendarDateTime | null {
  if (!str) return null;
  try {
    const [datePart, timePart] = str.split("T");
    const [y, m, d] = datePart.split("-").map(Number);
    if (timePart) {
      const [h, min] = timePart.split(":").map(Number);
      return new CalendarDateTime(y, m, d, h, min);
    }
    return new CalendarDateTime(y, m, d, 0, 0);
  } catch {
    return null;
  }
}

/**
 * Parse a local date string (YYYY-MM-DD) into a CalendarDate.
 */
function parseLocalDate(str: string): CalendarDate | null {
  if (!str) return null;
  try {
    const [y, m, d] = str.split("-").map(Number);
    return new CalendarDate(y, m, d);
  } catch {
    return null;
  }
}

/**
 * Parse a time string (HH:mm) into a Time.
 */
function parseTimeStr(str: string): Time | null {
  if (!str) return null;
  try {
    const [h, m] = str.split(":").map(Number);
    return new Time(h, m);
  } catch {
    return null;
  }
}

/**
 * Convert a DateValue back to a local datetime string (YYYY-MM-DDTHH:mm).
 */
function toLocalDatetimeStr(value: DateValue | null): string {
  if (!value) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = value.year;
  const m = pad(value.month);
  const d = pad(value.day);
  if ("hour" in value) {
    const h = pad((value as any).hour);
    const min = pad((value as any).minute);
    return `${y}-${m}-${d}T${h}:${min}`;
  }
  return `${y}-${m}-${d}`;
}

/**
 * Convert a DateValue back to a local date string (YYYY-MM-DD).
 */
function toLocalDateStr(value: DateValue | null): string {
  if (!value) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${value.year}-${pad(value.month)}-${pad(value.day)}`;
}

/**
 * Convert a Time back to a time string (HH:mm).
 */
function toTimeStr(value: any): string {
  if (!value) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(value.hour)}:${pad(value.minute)}`;
}

// ─── Admin-friendly wrappers that accept/emit strings ───

interface AdminDateTimeFieldProps {
  label?: string;
  value: string; // "YYYY-MM-DDTHH:mm"
  onChange: (value: string) => void;
  description?: string;
  errorMessage?: string;
  isRequired?: boolean;
}

export function AdminDateTimeField({ label, value, onChange, description, errorMessage, isRequired }: AdminDateTimeFieldProps) {
  return (
    <DateTimeField
      label={label}
      value={value}
      onChange={onChange}
      description={description}
      errorMessage={errorMessage}
      isRequired={isRequired}
    />
  );
}

interface AdminDateFieldProps {
  label?: string;
  value: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
  description?: string;
  errorMessage?: string;
  isRequired?: boolean;
  isDateUnavailable?: (date: DateValue) => boolean;
}

export function AdminDateField({ label, value, onChange, description, errorMessage, isRequired, isDateUnavailable }: AdminDateFieldProps) {
  const dateValue = useMemo(() => parseLocalDate(value), [value]);

  return (
    <DatePickerField
      label={label}
      value={dateValue}
      onChange={(v) => onChange(toLocalDateStr(v))}
      description={description}
      errorMessage={errorMessage}
      isRequired={isRequired}
      isDateUnavailable={isDateUnavailable}
    />
  );
}

interface AdminTimeFieldProps {
  label?: string;
  value: string; // "HH:mm"
  onChange: (value: string) => void;
  description?: string;
  errorMessage?: string;
}

export function AdminTimeField({ label, value, onChange, description, errorMessage }: AdminTimeFieldProps) {
  const timeValue = useMemo(() => parseTimeStr(value), [value]);

  return (
    <TimeField
      label={label}
      value={timeValue}
      onChange={(v) => onChange(toTimeStr(v))}
      description={description}
      errorMessage={errorMessage}
    />
  );
}
