import { parseDate, CalendarDate, type DateValue } from '@internationalized/date';

/**
 * Convert a date string (YYYY-MM-DD) to a CalendarDate object
 */
export function stringToDateValue(dateString: string | null | undefined): CalendarDate | null {
  if (!dateString) return null;
  try {
    return parseDate(dateString);
  } catch {
    return null;
  }
}

/**
 * Convert a CalendarDate or DateValue object to a date string (YYYY-MM-DD)
 */
export function dateValueToString(date: DateValue | null | undefined): string {
  if (!date) return '';
  return date.toString();
}

/**
 * Get today's date as a CalendarDate
 */
export function getToday(): CalendarDate {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  return new CalendarDate(year, month, day);
}
