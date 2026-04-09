export const DEFAULT_LEAD_TIME_DAYS = 28;

export function getEarliestCateringDate(leadTimeDays: number = DEFAULT_LEAD_TIME_DAYS): Date {
  const date = new Date();
  date.setDate(date.getDate() + leadTimeDays);
  date.setHours(0, 0, 0, 0);
  return date;
}
