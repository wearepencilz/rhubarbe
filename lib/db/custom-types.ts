import { customType } from 'drizzle-orm/pg-core';

/**
 * Custom jsonb type that properly serializes JavaScript objects to JSON strings
 * before sending to the database driver.
 * 
 * Workaround for drizzle-orm + postgres.js jsonb serialization bug:
 * https://github.com/drizzle-team/drizzle-orm/issues/724
 * 
 * postgres.js's `unsafe()` method (used by drizzle) doesn't know column types,
 * so it can't auto-serialize objects to JSON for jsonb columns.
 */
export const customJsonb = <TData>(name: string) =>
  customType<{ data: TData; driverData: string }>({
    dataType() {
      return 'jsonb';
    },
    toDriver(value: TData): string {
      return JSON.stringify(value);
    },
    fromDriver(value: string | TData): TData {
      if (typeof value === 'string') {
        return JSON.parse(value) as TData;
      }
      return value as TData;
    },
  })(name);
