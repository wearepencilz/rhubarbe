import { cookies } from 'next/headers';
import type { Locale } from './index';

/**
 * Read the current locale from the request cookie (server components only).
 * Defaults to 'fr'.
 */
export async function getLocale(): Promise<Locale> {
  try {
    const cookieStore = await cookies();
    const value = cookieStore.get('locale')?.value;
    if (value === 'en' || value === 'fr') return value;
  } catch {
    // outside request context (static generation)
  }
  return 'fr';
}
